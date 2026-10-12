---
title: 'Working at Matmerize'
date: '2026-08-31'
description: 'Software Engineer Intern at Matmerize: faster predictions, a pull-based prediction engine, and automated backup restoration.'
type: 'experience'
tags: ['Experience', 'AWS', 'Terraform', 'Python', 'C++']
---

**Software Engineer Intern** · Atlanta, GA · May 2026 – Aug 2026

**Stack:** AWS, Terraform, Python, C++

During my internship I worked on three projects: 

# Faster predictions with C++

I transpiled the Python-based prediction scripts into C++ and packaged them as distributable binaries. For property predictions made on on-premises infrastructure, this gave a speedup of 1.6X.

# A pull-based prediction engine

I refactored the prediction engine so that workers pull jobs from SQS queues instead of having work pushed to them. This improved hourly job throughput in production by 43%. It also let us remove unmaintained dependencies from production builds.

![Refactored prediction engine to consume jobs from SQS queues, improving job throughput in production by 43% and eliminating unmaintained dependencies from production builds.](/assets/matmerize-pull-based-architecture.svg)

# Automated backup testing and restoration

I automated production backup testing and restoration with Terraform. Testing coverage went from less than 1% of platform data to 100%, and recovery takes under 20 minutes.

![Automated production backup testing and restoration using Terraform, increasing testing coverage from less than 1% of platform data to 100% and achieving a recovery time of under 20 minutes.](/assets/matmerize-backup-automation.svg)
