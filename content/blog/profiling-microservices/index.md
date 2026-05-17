---
title: 'How to Trust Your Benchmark Results Again'
date: '2026-05-04'
description: 'What a Broken Benchmark Taught me About Reproducible Experiments'
type: 'blog'
featuredImage: 'jaeger_dashboard.png'
tags: ['Performance Engineering']
---

For a few weeks this spring, I thought my team had uncovered a way to make datacenters meaningfully more energy efficient. Spoiler: we hadn't. But trying (and failing) to reproduce our initial results taught me more about repeatable performance testing than the original finding ever would have.

Datacenters - the windowless buildings behind every online purchase, post, and prompt - are consuming electricity at alarming rates. Critics argue that datacenters are environmentally disruptive, and recent construction projects have been delayed in part due to these concerns. For our final project in **CS8803: Datacenter Networks and Systems**, we asked: could software make these facilities more energy efficient?

Our approach: clever _load balancing algorithms_ that distribute work amongst hundreds of servers. [Sinking a datacenter in the ocean](https://news.microsoft.com/source/features/sustainability/project-natick-underwater-datacenter/) or [launching one into space](https://www.npr.org/2026/04/03/nx-s1-5718416/ai-data-centers-in-space-spacex-elon-musk) was out of scope for the course, so software optimizations felt like a more practical approach.

My job was to simulate thousands of users concurrently searching for hotels online while taking detailed measurements of servers' _power consumption_ and _response latency_ (think: time it takes to receive a confirmation message after clicking "book" on AirBnB).

# How It All Started

![big if true: the one figure in our 6-page report that caught our professor's eye](questionable_results.png)

The figure above shows two plots: latency on the left, power consumption on the right, as we increase the number of queries per second (QPS). In the latency plot, solid lines represent median latency while dashed lines represent p99 latency (i.e. the latency that 99% of requests come in under). In both plots, the blue and orange lines represent different _frequency governors_. These frequency governors act similar to a speed limiter in a car: they intentionally limit the CPU clock rate (or top speed) to optimize for power utilization (or fuel economy/safety).

In the power plot, we can see the `schedutil` governor (blue line) uses consistently less power than the `performance` governor (orange line). Meanwhile, the latency plot shows that `schedutil` matches `performance` in terms of latency as we increase the QPS. Because earlier experiments did not show a power gap at high load between the two governors, this result was surprising, but certainly not impossible.

If this held up, it would mean **real power savings** for some production workloads without any modifications to an application's code\*. The best part is we don't have to sacrifice _p99 latency_, a metric datacenter operators tend to care about most, because it captures the worst experience most users will have. Admittedly, I didn't recognize the impact of this discovery at the time - but our professor did!

\*A small caveat is that we need to be able to run servers close to maximum load, which is difficult since users tend overestimate how much resources they will need, leading to _underutilization_. The real challenge, however, would be reproducing these results on a larger cluster.

# Debugging My Experiments

As I set out to reproduce these results, I faced one of the trickiest debugging challenges so far, spurred on by a complicated experimental setup and a three-week deadline.

First, the setup - I used six intel-based machines (courtesy of Cloudlab) that have more cores than your typical PC and dedicated high-bandwidth links connecting them. Each experiment is conducted using a pair of machines, with a client machine acting as a load generator and a separate server hosting the hotel search service. Crucially, both client and server have identical specs and ample cores. This ensures that (1) clients can simulate high QPS traffic and (2) servers can serve this traffic in a reasonable amount of time before reaching their limits.

![specs of my testbed](./cloudlab_cpu_specs.png)

Second, the tight deadlines encouraged me to run multiple experiments in parallel across pairs of machines - a best practice that can nonetheless have its pitfalls if not orchestrated carefully.

Before I detail my debugging approach, it's important to understand which quantities I am measuring and how they are being measured. I ran my experiments on the hotel search service of the open-source [DeathStarBench](https://github.com/kworathur/DeathStarBench/) benchmarking suite, measuring three key quantities:

- _p50 latency_ (i.e. median latency), which is the time 50% of requests complete under.

- _p99 latency_, which is the time 99% of requests complete under. Latency measurements are reported in milliseconds and are obtained from a load testing tool called `wrk`, running on the client.

- _power consumption_ of the server that handles search requests, measured in watts and collected by the `powerstat` command-line utility running on the server. `powerstat` uses hardware interfaces on Intel machines to obtain accurate running average power measurements.

I'm measuring these quantities while incrementing the number of QPS until the server reaches its _saturation point_: the point at which a server cannot take on any more requests per unit time. Each trial tests a single QPS level, and I performed all trials for the `performance` governor before the `schedutil` governor.

We choose the `performance` governor as a baseline since it does _not_ limit the CPU's clock rate, and we want to see whether limiting clock rates can improve energy efficiency. Let's quickly run a test at low load (1000 QPS) to establish a baseline.

```
Test Results @ http://10.10.1.2:5000
  Thread Stats   Avg      Stdev     99%   +/- Stdev
    Latency     7.08ms    5.47ms  21.73ms   79.14%
    Req/Sec   254.77     95.55   500.00     67.37%
  Latency Distribution (HdrHistogram - Recorded Latency)
 50.000%    6.79ms <- median latency
 75.000%   10.83ms
 90.000%   14.59ms
 99.000%   21.73ms <- p99 latency
 99.900%   29.41ms
 99.990%   38.40ms
 99.999%   42.08ms
100.000%   42.91ms
```

There's our p99 latency in the fifth row from the bottom! It looks like 99% percent of requests completed in under ~22 milliseconds. On the power side, `powerstat` reports the server using ~63W of power on average over a 60 second trial. These initial measurements will help us sanity check our fixes as we start debugging.

With that context and baseline in place, let's get into the investigation. We'll look at **four potential flaws** in my setup.
Along the way, I'll share some general tips for reproducible benchmarking, which can help not only researchers, but engineers in industry too! Just as researchers make claims in papers that must be backed by reproducible results, companies make guarantees about how their services will perform in the real world through _service-level objectives (SLOs)_.

## Pinning Down Noisy Results

Re-running my experiments without any changes, I found that power measurements varied between runs, with a standard deviation in power measurements of roughly **~2 watts**. This variability sometimes made it look like `schedutil` provided worse energy efficiency at high load than `performance`; in some runs, the opposite was true.

![in some runs, schedutil actually *fared worse* than performance on power usage](./schedutil_worse_than_performance.png)

So which of these conclusions should we trust? Prior to starting my experiments, I wrote some custom scripts to deploy the search service without docker, in order to push the server with the highest QPS possible. I revisited the scripts I wrote earlier and noticed a subtle flaw: the placement of tasks on the server was left entirely up to the CPU.

Schedulers, the part of the CPU that makes these placement decisions, are generally good at spreading tasks across a CPU's cores to minimize resource conflicts. Sometimes, however, they may schedule sub-optimally, placing two compute-bound tasks on the same core while others remain idle. I chose to **pin processes to run on separate cores**, preventing such collisions and making my experimental results more deterministic

To do this, I used the taskset utility to set affinity of processes to cores. `taskset` lets you specify a list of cores a process should run on, which let me fix the affinity of the cache to have its own dedicated core on the machine, which is reasonable since this machine has 32 virtual cores.

```
$ pgrep -f memcached | xargs -I{} taskset -cp {}
pid 223302's current affinity list: 0
```

Despite controlling for task placement, the noisy, seemingly random fluctuations in measurements in between runs persisted, which led me to look for other flaws in the experimental setup.

## Catching the Warm Cache

Remember how I said I ran all `performance` governor trials before `schedutil` trials? That seemly benign detail might have biased the `schedutil` results in its favor due to shared cache state between trials. Caches provide faster accesses to frequently used application data than your standard database query. In the hotel search service, cache reads are included in the critical path to help the server maximimize its response throughput.

To visualize how caches are used by a search query, I used an observability tool called [Jaeger](https://www.jaegertracing.io/). Jaeger allows us to trace the path a request takes through code in a way that print statements can't; using Jaeger, we can trace requests that are passed through multiple containers, as is the case here:

![Jaeger's dependency graph for search queries](./jaeger_dependency_graph.png)

We can see that when a user searches for a hotel, our application actually has to call three seperate microservices to determine hotels that are (1) close by to the user's location (2) within the user's price range and (3) available to book during the user's vacation.

In particular, the reservation service queries reservations for a given hotel using an in-memory cache called `memcached`. To see if caching biased the experiment results, I first tried removing the cache reads from the reservation microservice and measuring the latency of requests. My reasoning was that if the `performance` governor s

![without caching, tail latency exploded to 40ms at only 5,000 QPS](./no_cache_experiment_results.png)

Without caching, the application became bottlenecked on MongoDB database reads, which caused p99 tail latency to explode at low load. To rule out shared cache state, I decided to switch the order of my experiments - I would run `schedutil` trials first, then `performance` trials.

After doing this, I still saw the same behavior - `schedutil` closely matching `performance` in latency at high loads. At this point, I determined that the latency figures were indeed accurate. I turned to my power measurements, which showed a gap between `schedutil` and `performance`.

## Measuring the Wrong Window

The duration of my load test (in `WRK2_DURATION`) is set to 30 seconds. However, the `powerstat` tool I used can only capture measurements over 60-second intervals at minimum, which is not immediately clear from the man pages.

This discrepancy is what leads to `powerstat` collecting some power measurements while the server is idle, weighing down the average power usage.

## Reconciling the Servers

- tip: git bisect

- show change that introduced a filter in the reservation cache. Show raw logs that demonstrate that power utilization is consistently 4W higher for the unfiltered cache query

## 3. Documenting Configs

When your config lives in terminal commands that hide in long slack threads, it becomes _much_ harder to track the experiments you run. You might remember how our physics teachers in high school would be so picky about our lab notetaking:

Closer to the end of the project, I saved all of my experiment parameters in a python file and tracked changes to version control:

```python
#!/usr/bin/env python3
import os
from pathlib import Path


# Default workload assignment and governor order.
DEFAULT_TARGETS = ["hotels", "recommendations", "reservation", "user"]
DEFAULT_GOVERNORS = ["performance", "schedutil"]

# SSH configuration for connecting to experiment nodes.
SSH_USER = os.environ.get("HOTEL_REMOTE_SSH_USER", "")
SSH_KEY_PATH = os.path.expanduser(os.environ.get("HOTEL_REMOTE_SSH_KEY", ""))

# Repository and artifact layout on the remote hosts.
REPO_ROOT = Path(__file__).resolve().parents[2]
REMOTE_REPO_ROOT = os.environ.get("HOTEL_REMOTE_REPO_ROOT", str(REPO_ROOT))
REMOTE_SCRIPT = "hotelReservation/scripts/run_power_sweep.sh"

# Experiment defaults.
HOST_URL = os.environ.get("HOTEL_REMOTE_HOST_URL_TEMPLATE", "http://%h:5000")
THREADS = 4
CONNECTIONS = 128
RATES_SPEC = "1000:20000:1000"
WRK2_DURATION=30
POWERSTAT_INTERVAL = 0.5
POWERSTAT_SOURCE = "auto"
SETTLE_SECONDS = 5

# Result locations.
RESULTS_ROOT = REPO_ROOT / "results" / "distributed_power_sweeps"
LOCAL_OUTPUT_DIR = str(RESULTS_ROOT)
REMOTE_OUTPUT_BASE = os.environ.get("HOTEL_REMOTE_OUTPUT_BASE", "")
```

Version control is your friend! I found myself branching off versions of code to get back to states of the codebase .

## Conclusion

By establishing baselines, starting small, and documenting my experiments, I was able to pinpoint the flaws in my setup, and fix my scripts to obtain results that myself and my colleagues could reproduce. (see below):

![Final Results - Power](reproducible_power.png)
![Final Results - Latency](reproducible_latency.png)
