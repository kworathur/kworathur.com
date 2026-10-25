---
title: Writing Fast Mamba Kernels for TPUs
date: 2026-10-13
description: "Rapid developments in structured state space models and hardware
  accelerators such as TPUs have expanded the options for efficient ML inference
  and kernel optimization. "
type: blog
tags:
  - ml-systems
---
# What Makes an SSM Different from a Transformer?
 
The "state" in a structured state space sequence model (SSM) has a fixed size regardless of input length, while a transformer's attention mechanism computes a dot product for each previous key. At each step $i$ of generation a transformer computes $i - 1$ dot products in its masked-self attention layer. Repeatedly performing this step to grow a sequence up to $n$ tokens results in inference that is quadratic in n. 

# TPU v5e Roofline Model for Baseline Implementation

Without porting the custom CUDA kernels for selective scan to TPU just yet, let's see how SSMs perform without a more naive selection mechanism. I'm using a TPU v5e, which features TensorCores with massive matrix multiply units like newer TPU generations, at a lower cost.

```
WARNING: All log messages before absl::InitializeLog() is called are written to STDERR
I0000 00:00:1792952093.998488    5479 pjrt_api.cc:119] GetPjrtApi was found for TPU at /home/ubuntu/mamba/.venv/lib/python3.12/site-packages/libtpu/libtpu.so
I0000 00:00:1792952095.169929    5479 device_rt.cc:166] PjRt runtime initialization deferred for tpu
Successfully renamed PrivateUse1 backend to 'tpu'. Device: device(type='tpu')
Registered Python module for 'tpu'.
Device type: tpu, Device index: default
Initializing TPU distributed runtime
I0000 00:00:1792952095.173256    5479 libtpu_version.cc:63] Setting libtpu version to: 0.0.51
...
  File "/home/ubuntu/mamba/mamba_ssm/modules/mamba_simple.py", line 189, in forward
    y = selective_scan_fn(
        ^^^^^^^^^^^^^^^^^^
  File "/home/ubuntu/mamba/mamba_ssm/ops/selective_scan_interface.py", line 124, in selective_scan_fn
    return SelectiveScanFn.apply(u, delta, A, B, C, D, z, delta_bias, delta_softplus, return_last_state)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/home/ubuntu/mamba/mamba_ssm/ops/selective_scan_interface.py", line 39, in forward
    _check_selective_scan_cuda()
  File "/home/ubuntu/mamba/mamba_ssm/ops/selective_scan_interface.py", line 28, in _check_selective_scan_cuda
    raise RuntimeError(
RuntimeError: selective_scan_cuda is not installed. To use Mamba-1, reinstall with:
  MAMBA_KEEP_CUDA_BUILD=TRUE pip install mamba-ssm --no-build-isolation
...
```


# References

[1] A. Gu and T. Dao, “Mamba: Linear-Time Sequence Modeling With Selective State Spaces,” arXiv.org, Dec. 01, 2023. https://arxiv.org/abs/2312.00752 (accessed Oct. 22, 2026).

