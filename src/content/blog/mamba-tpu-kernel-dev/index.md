---
title: TPU kernel optimization for sequence models
date: 2026-10-13
description: "A venture into programming for alternative accelerators "
type: blog
tags:
  - ml-systems
featuredImage: mamba_tpu_roofiline_plot.png
---
# Motivation

The transformer has become the de-facto building block of foundation models, where an ugly tradeoff emerges. At inference time, transformers crucially trade off **accuracy for latency**. The KV cache used for generating tokens grows linearly with sequence length, and memory bandwidth becomes a bottleneck and impediment to fast inference. A tradeoff exists because one could choose to drop entries from the KV cache, thereby reducing its bandwidth usage, which would likely lead to accuracy degradation.

One night, when I was debugging a memory allocation bug in vLLM specifically affecting the Qwen family of open-weight models, I was surprised to find out that some blocks in these models use *constant* space for their inference state. Clearly, the community was surprised too: vLLM at the time did not have a way to allocate physical memory for these special blocks independently of traditional attention-based blocks - the assumption that inference state grew linearly with sequence length was still very much entrenched within the system. 

Can we build an accurate model entirely out of these memory-efficient building blocks, side-stepping the accuracy vs. latency tradeoff that comes with transformers? For now, that seems unlikely, but these blocks, known in the literature as **mamba** blocks, are here to stay. However, the rich toolkit developed for transformer inference optimization - KV cache compression, flash attention, and more - will not be readily applicable. So how can we perform efficient inference with these transformer alternatives?

## What makes mamba's architecture different from the transformer?

The selective state update found in Mamba is a recurrence that uses the previous hidden state $h*{t - 1}$ to compute the current hidden state $h*{t}$ (the size of hidden states never changes). Because of this dependency, there is no easy way to vectorize sequence encoding like we can in transformers. While it might seem that the only way to compute the recurrence is to go step by step, there is a better way. When adding up numbers 1 to 100, we don't need to go left-to-right: we can split up the sum any way we want to divide and conquer. Both addition, and mamba's core recurrence, are associative.

![This diagram represents just one iteration in a for-loop over $L$ positions in the Mamba recurrence](/assets/mamba_ssm_forward.drawio.svg)

## TPU v5e roofline model

The code for a mamba block is designed to efficiently use a GPU's memory hierarchy, so I was curious to see how the performance gains would transfer to TPUs. Before trying to port the CUDA kernels to JAX, I first wanted to see how much performance I could get out of a simple for loop. I tried four main configurations:

![Trying out different loop optimizations before parallelizing the state updates](./mamba_tpu_roofiline_plot.png)

1. CPU-bound for-loop: this was my first attempt, which performed quite poorly since it called the forward pass of Mamba $L$ times for a sequence of length $L$, resulting in a large number of device memory transfers and high idle time. Didn't include this in the roofline model since it performed terribly.
2. For-loop inside `forward()` method: this approach reduced the number of host-device transfers since `forward()` was now only called once per sequence.
3. Messing with physical memory allocation of tensors: the GPU-optimized version of Mamba prefers to store the hidden state tensors in batch-feature-sequence order, while I found that collapsing tensors into two dimensions by combining batch and sequence dimensions actually resulted in a noticeable increase in HBM utilization.
4. Last, I used `torch.compile()` to automatically fuse certain operations, leading to an increase in arithmetic intensity.## References

\[1] A. Gu and T. Dao, “Mamba: Linear-Time Sequence Modeling With Selective State Spaces,” arXiv.org, Dec. 01, 2023. https://arxiv.org/abs/2312.00752 (accessed Oct. 22, 2026).
