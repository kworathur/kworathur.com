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

Before I explain my debugging approach, it's important to understand which quantities I am measuring and how they are being measured. I ran my experiments on the hotel search service of the open-source [DeathStarBench](https://github.com/kworathur/DeathStarBench/) benchmarking suite, measuring three key quantities:

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

Schedulers, the part of the CPU that makes these placement decisions, are generally good at spreading tasks across a CPU's cores to minimize resource conflicts. Sometimes, however, they may schedule sub-optimally, placing two compute-bound tasks on the same core while others remain idle. I chose to **pin processes to run on separate cores**, preventing such collisions and making my experimental results more deterministic.

To do this, I used the `taskset` utility to set affinity of processes to cores. `taskset` lets you specify a list of cores a process should run on, which let me fix the application's cache to run on a core separate from all other processes. I did this specifically because the cache is a shared dependency of all requests, and giving it its own core to run on avoids spikes in power/latency measurements from the cache randomly being de-scheduled.

```
$ pgrep -f memcached | xargs -I{} taskset -cp {}
pid 223302's current affinity list: 0
```

Controlling for task placement helped me stabilize my power measurements in between runs. Now, I could notice a convergence in power usage between `schedutil` and `performance` governors at high load:

![new power plots show a clear convergence in power usage between the two governors](./power_consumption_converges.png)

## Catching the Warm Cache

Remember how I said I ran all `performance` governor trials before `schedutil` trials? That seemly benign detail might have biased the `schedutil` results in its favor due to shared cache state between trials. Caches provide faster accesses to frequently used application data than your standard database query. In the hotel search service, cache reads are included in the critical path to help the server maximimize its response throughput.

To visualize how caches are used by a search query, I used an observability tool called [Jaeger](https://www.jaegertracing.io/). Jaeger allows us to trace the path a request takes through code in a way that print statements can't; using Jaeger, we can trace requests that are passed through multiple containers, as is the case here:

![Jaeger's dependency graph for search queries](./jaeger_dependency_graph.png)

We can see that when a user searches for a hotel, our application actually has to call three seperate microservices to determine hotels that are (1) close by to the user's location (2) within the user's price range and (3) available to book during the user's vacation.

In particular, the reservation service queries reservations for a given hotel using an in-memory cache called `memcached`. To see if caching biased the experiment results, I first tried removing the cache reads from the reservation microservice and measuring the latency of requests. My reasoning was that if a warm cache had a tangible benefit to reducing latency for schedutil, then taking the cache out of the picture should take away this unfair advantage.

![without caching, tail latency exploded to 40ms at only 5,000 QPS. At the previous saturation point of 12,000 QPS, latency measurements were now on the order of seconds](./no_cache_experiment_results.png)

Without caching, the application became bottlenecked on MongoDB database reads, which caused p99 tail latency to explode at low load. When I expected `schedutil` to have higher latency than `performance`, we can see that they were roughly matched.

As a follow up, I decided to switch the order of my experiments - I would run `schedutil` trials first, then `performance` trials, effectively flipping the experiments in `performance`'s favor. After doing this, I still saw the same behavior - `schedutil` closely matching `performance` in latency at high loads. This made me convinced that they latency figures from our initial tests were indeed accurate.

I turned to my attention to the power measurements, the ones that showed a gap between `schedutil` and `performance`.

## Reconciling the Servers

After making my experiments reproducible, I started digging into my `git` commit history to find a version of the codebase that produced those peculiar power results at the start of this post. In the week leading up to the initial results, I had about **50 commits** to sift through to find a regresson:

```
git log --oneline --pretty=fuller --all | grep 'Keshav' | wc -l
      50
```

Fortunately, I don't have to check all of these commits one by one, thanks to `git bisect`. This powerful command performs a binary search over a commit history to find a breaking change that introduced a bug or broke a benchmark. When I ran `git bisect start`, I was prompted to give a reference to a known "bad" commit - a version of the codebase where I _couldn't_ reproduce my results. Next, I was prompted to give a known "good" commit - a version of the codebase where I _could_ reproduce my results - I gave my first commit here.

For a few iterations, `git bisect` would

- checkout a commit in my specified commit range
- I would compile the search service binaries, run my experiments, and spot-check the power results.
- If the power results were closer to what the initial report presented, I would mark the commit as "good" usign `git bisect good`. Otherwise, I would mark the commit as "bad" using `git bisect bad`.

Finally, git was able to point me to the commit that broke my benchmark:

```
first bad commit:
```

```
commit c712651cda3c39bf4464ad46e076e0dce73cbc73
Author: worathur <worathur@node-0.worathur-297467.gt-8803-dns-pg0.utah.cloudlab.us>
Date:   Mon Mar 30 18:12:20 2026 -0600

    Squashed commit of the following:

    commit ad50bc9fce7f2e5cfcdcb4003507207aa00efc2d
    Author: worathur <worathur@node-0.worathur-297467.gt-8803-dns-pg0.utah.cloudlab.us>
    Date:   Mon Mar 30 18:12:01 2026 -0600

        chore: add pycache to gitignore

    commit b52c1fb2756ecb7289932d56fadbfa95cfe5a11d
    Author: worathur <worathur@node-0.worathur-297467.gt-8803-dns-pg0.utah.cloudlab.us>
    Date:   Mon Mar 30 18:08:01 2026 -0600

        chore: add bootstrap scripts

    commit f1d4fc95776b45727377721fee1e1aa8b1925b72
    Author: worathur <worathur@node-0.worathur-297467.gt-8803-dns-pg0.utah.cloudlab.us>
    Date:   Mon Mar 30 15:55:50 2026 -0600

        feat: add scripts for testing a single rquest type at a time

    commit ddaa0a63a40b407b0b7c217bc2677f2ce30bcf5a
    Author: worathur <worathur@node-0.worathur-297467.gt-8803-dns-pg0.utah.cloudlab.us>
    Date:   Mon Mar 30 15:54:42 2026 -0600

        docs: add instructions for installing frequency governors

    commit 6cf281faab308de21fb62582c80f3d98c9b70145
    Author: worathur <worathur@node-0.worathur-297467.gt-8803-dns-pg0.utah.cloudlab.us>
    Date:   Mon Mar 30 10:10:23 2026 -0600

        docs: install governors

    commit e6fbad5903de1bd5c31997c2f72895c6ca465bfd
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Fri Mar 27 09:04:58 2026 -0500

        docs: add steps for running app

    commit 417bf497f0c27ed5e2970c19a213927977fd19be
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Fri Mar 27 09:01:58 2026 -0500

        docs: refer to install scripts in docs

    commit 6e73c3fdca85259e7b45f74867392596e9889b11
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Wed Mar 25 18:49:30 2026 -0500

        feat: add scripts for testing hotels only workload

    commit 014b7bfa7798f3a5a8102479c130f9acc58a0c30
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Wed Mar 25 12:40:22 2026 -0500

        fix: install luasocket in install script

    commit db99ba3efd2be6e126fa09f2722ec33b0be8b297
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Wed Mar 25 10:29:54 2026 -0500

        fix: too many pings errors

    commit c5b6b16981a67578258989107baf8ddf4f7aa8d3
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Wed Mar 25 09:55:31 2026 -0500

        fix: avoid hardcoded local config in go scripts

    commit 92c59d46ef63d8b0320d7655a1e6eac175d603b8
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Wed Mar 25 08:51:18 2026 -0500

        fix: background jaeger process

    commit 90871ef0098aac70efff8eda3b7b93f9a4ac13d0
    Author: worathur <worathur@node-1.worathur-296542.gt-8803-dns-pg0.utah.cloudlab.us>
    Date:   Tue Mar 24 17:14:49 2026 -0600

        docs: do not start mongod in install

    commit ef95707a03b81bc6079cd90d0c4943c085bc1b26
    Merge: c1f168d 5d42310
    Author: worathur <worathur@node-1.worathur-296542.gt-8803-dns-pg0.utah.cloudlab.us>
    Date:   Tue Mar 24 17:11:34 2026 -0600

        Merge branch 'feat/deploy-processes' of github.com:kworathur/DeathStarBench into feat/deploy-processes

    commit c1f168df17ce0655026487bdf862e569cc8c4e7d
    Author: worathur <worathur@node-1.worathur-296542.gt-8803-dns-pg0.utah.cloudlab.us>
    Date:   Tue Mar 24 17:10:50 2026 -0600

        docs: fix jaeger version

    commit 5d42310e1361a919737dc8a0a245c50344e16364
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Tue Mar 24 18:10:19 2026 -0500

        chore: fix incorrect tar file url

    commit 74b7efb944e3030ddbbca84d3264e8f478bdbd5a
    Merge: bd5a89a 95d82a6
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Tue Mar 24 18:01:34 2026 -0500

        fix merge conflicts

    commit bd5a89a28a9458ee3c00e0ba9a468dd595cbfe4f
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Tue Mar 24 18:00:00 2026 -0500

        docs: add jaeger install cmds

    commit 95d82a634429f990bfd8ea0b88a61dd5c9c26138
    Author: worathur <worathur@node-1.worathur-296542.gt-8803-dns-pg0.utah.cloudlab.us>
    Date:   Tue Mar 24 16:41:23 2026 -0600

        fix: make scripts executable

    commit fa3458c0ed34bfe752e2421ff95f18bdd5c495b3
    Author: worathur <worathur@node-1.worathur-296542.gt-8803-dns-pg0.utah.cloudlab.us>
    Date:   Tue Mar 24 16:38:26 2026 -0600

        fix: missing installs and perms

    commit 08d3f2443eb523f0b5f46c24248eb82013e02626
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Tue Mar 24 17:05:45 2026 -0500

        feat: add script for installing deps

    commit 82c8647974b236d08b4833bf9a0fcd016151c483
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Tue Mar 24 16:58:09 2026 -0500

        docs: add instructions for cloudlab setup

    commit 984d2585eb96284e094229a0dc504ae14b3b832c
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Tue Mar 24 12:48:02 2026 -0500

        feat: add orchestration scripts

    commit 232f83c7d69e026162c1dc83719cc41fe3d96601
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Tue Mar 24 12:47:41 2026 -0500

        feat: add SIGINT handling to go servers

    commit 574134d4f3a266901bbd325b1bf00cbd224b945f
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Tue Mar 24 12:47:15 2026 -0500

        fix: avoid re-seed when creating multiple instances of a microservice

diff --git a/hotelReservation/services/rate/server.go b/hotelReservation/services/rate/server.go
index 6aadd8a..09a1559 100644
--- a/hotelReservation/services/rate/server.go
+++ b/hotelReservation/services/rate/server.go
@@ -132,22 +132,28 @@ func (s *Server) GetRates(ctx context.Context, req *pb.Request) (*pb.Result, err
                for hotelId := range rateMap {
                        go func(id string) {
                                log.Trace().Msgf("memc miss, hotelId = %s", id)
-                               log.Trace().Msg("memcached miss, set up mongo connection")
+                               log.Trace().Msg("memcached miss, querying mongo for the request
ed hotel and date range")
    Date:   Tue Mar 24 12:47:41 2026 -0500

        feat: add SIGINT handling to go servers

    commit 574134d4f3a266901bbd325b1bf00cbd224b945f
    Author: Keshav Worathur <keshavworathur@gmail.com>
    Date:   Tue Mar 24 12:47:15 2026 -0500

        fix: avoid re-seed when creating multiple instances of a microservice

diff --git a/hotelReservation/services/rate/server.go b/hotelReservation/services/rate/server.g
o
index 6aadd8a..09a1559 100644
--- a/hotelReservation/services/rate/server.go
+++ b/hotelReservation/services/rate/server.go
@@ -132,22 +132,28 @@ func (s *Server) GetRates(ctx context.Context, req *pb.Request) (*pb.Resu
lt, err
                for hotelId := range rateMap {
                        go func(id string) {
                                log.Trace().Msgf("memc miss, hotelId = %s", id)
-                               log.Trace().Msg("memcached miss, set up mongo connection")
+                               log.Trace().Msg("memcached miss, querying mongo for the request
ed hotel and date range")

                                mongoSpan, _ := opentracing.StartSpanFromContext(ctx, "mongo_rate")
                                mongoSpan.SetTag("span.kind", "client")

-                               // memcached miss, set up mongo connection
                                collection := s.MongoClient.Database("rate-db").Collection("inventory")
-                               curr, err := collection.Find(context.TODO(), bson.D{})
+                               filter := bson.D{
+                                       {"hotelId", id},
+                                       {"inDate", bson.D{{"$lte", req.InDate}}},
+                                       {"outDate", bson.D{{"$gte", req.OutDate}}},
+                               }
+                               curr, err := collection.Find(context.TODO(), filter)
                                if err != nil {
-                                       log.Error().Msgf("Failed get rate data: ", err)
+                                       log.Error().Msgf("Failed to get rate data for hotel %s: %v", id, err)
                                }

                                tmpRatePlans := make(RatePlans, 0)
-                               curr.All(context.TODO(), &tmpRatePlans)
-                               if err != nil {
-                                       log.Error().Msgf("Failed get rate data: ", err)
+                               if curr != nil {
+                                       if err := curr.All(context.TODO(), &tmpRatePlans); err != nil {
+                                               log.Error().Msgf("Failed to decode rate data for hotel %s: %v", id, err)
+                                               tmpRatePlans = nil
+                                       }
                                }

                                mongoSpan.Finish()

```

- show change that introduced a filter in the reservation cache. Show raw logs that demonstrate that power utilization is consistently 4W higher for the unfiltered cache query

## Conclusion

By fixing the out-of-sync server binaries, I able to reproduce results that consistently show `schedutil` and `performance` converging in their power usage at high load.

![Final Results - Power](reproducible_power.png)
![Final Results - Latency](reproducible_latency.png)

These results suggest that the advantage of frequency-limiting servers are not as apparent as they were in the initial report results. Regardless, I learned a great deal of what it takes to reproducible research and I hope you did too!
