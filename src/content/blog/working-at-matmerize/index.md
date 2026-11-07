---
title: Building reliable systems for polymer informatics at Matmerize
date: 2026-08-31
description: "Software Engineer Intern at Matmerize: faster predictions, a
  pull-based prediction engine, and automated backup restoration."
type: experience
tags:
  - Experience
  - AWS
  - Terraform
  - Python
  - C++
---
**Software Engineer Intern** · Atlanta, GA · May 2026 – Aug 2026

**Stack:** AWS, Terraform, Python, C++

# Re-Architecting our Prediction Engine

Our prediction engine previously relied on a deprecated AWs library to receive new training hobs. Rather than having our worker instances have work pushed to them, I refactored them to pull jobs from SQS queues natively.

![The refactored prediction engine removes `sqsd`, an unmaintaned dependency, from production builds.](/assets/matmerize-pull-based-architecture.svg)

# Automated backup testing and restoration

We test backups of our production data frequently enough that it can be a little cumbersome to inspect data and job details by hand. Using some terraform and bash scripts, I automated testing of our production backups. Coverage went from less than 1% of platform data to 100%, and recovery now under 20 minutes, down from ~1 hour and 45 minutes.

![Automated production backup testing and restoration using Terraform, increasing testing coverage from less than 1% of platform data to 100% and achieving a recovery time of under 20 minutes.](/assets/matmerize-backup-automation.svg)
