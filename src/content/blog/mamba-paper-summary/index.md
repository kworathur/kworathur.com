---
title: Writing Fast Mamba Kernels for TPUs
date: 2026-10-13
description: "Rapid developments in structured state space models and hardware
  accelerators such as TPUs have expanded the options for efficient ML
  inference. "
type: blog
tags:
  - ml-systems
---
# What Makes an SSM Different from a Transformer?
 
The "state" in a structured state space sequence model (SSM) has a fixed size regardless of input length, while a transformer's attention mechanism computes a dot product for each previous key. At each step $i$ of generation a transformer computes $i - 1$ dot products in its masked-self attention layer. Repeatedly performing this step to grow a sequence up to $n$ tokens results in inference that is quadratic in n. 

# References

[1] A. Gu and T. Dao, “Mamba: Linear-Time Sequence Modeling With Selective State Spaces,” arXiv.org, Dec. 01, 2023. https://arxiv.org/abs/2312.00752 (accessed Oct. 22, 2026).

