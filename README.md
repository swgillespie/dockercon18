# Code for DockerCon EU 2018

The code in this repo was used in a live demonstration talk for DockerCon EU 2018, titled ["Programming the Cloud Using
Containers as the Building Block"](https://www.youtube.com/watch?v=EbsE4p3uCu0).

In this talk, we construct an application consisting of a Redis instance and a [Redis
Commander](https://github.com/joeferner/redis-commander) instance. (Thanks to Joe Ferner for creating Redis Commander!)

The code in this repo is split into four subfolders, for easy navigation:

* **Step1**: Contains the code for the "first" step of the DockerCon talk. This code is the "first step" code showcased
  in the talk, before any modifications were made. This code creates a Docker container for Redis, a Docker container
  for Redis Commander, and connects the two using a Network.

* **Step2**: Contains the code for the "second" step of the DockerCon talk, where we introduce a `Redis` component resource that encapsulates the use of Docker containers.

* **Step3**: Contains the code for the "third" step of the DockerCon talk, where we turn `Redis` into an abstract class
  and provide implementations of it for Docker and Kubernetes.

* **Step4**: Contains the complete code for a package implementing a Redis component, suitable for publishing to NPM. This package includes some additional code that we did not have time to cover in the talk, most notably an Amazon implementation of the Redis abstraction using AWS ElastiCache.

All examples in this repo use [Pulumi](https://pulumi.io). You can download the Pulumi command-line tool from [the
official website](https://pulumi.io). You can also check out the source code of Pulumi [from the official
repo](https://github.com/pulumi/pulumi).

Every step can be run by `cd`-ing into the code directory, creating a stack for the example, installing dependencies, and running `pulumi up`:

```
$ cd step1
$ pulumi stack init my-stack-name
$ npm install
$ pulumi up
```

At every step, the stack output `host` will point to a running Redis Commander instance on your local machine. You can access this service in a web browser by running
`open $(pulumi stack output host)`.
