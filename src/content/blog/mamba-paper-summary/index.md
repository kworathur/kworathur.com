---
title: Writing Fast Mamba Kernels for TPUs
date: 2026-10-13
description: A summary of the paper "Linear-Time Sequence Modeling with
  Selective State Spaces" (Gu and Dao, COLM 2024) that introduces the Mamba
  architecture.
type: blog
---
Linear-Time Sequence Modeling with Selective State Spaces
Authors: Albert Gu, Tri Dao
Published in COLM 2024

Foundation models have attention layers in their backbone, whose computation time scales quadratically with input size. Attention-free architectures have performed well for continuous sequence modelling on audio and vision data, but not discrete sequence modelling tasks involving text data.

The authors identify an efficiency-accuracy tradeoff in sequence transformation architectures, and propose selective state space models to strike a balance between these two goals. When making SSMs selective, the authors wanted to avoid creating an architecture that "forgets" like RNNs (which inspired transformers in the first place) 
