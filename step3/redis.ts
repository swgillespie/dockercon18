import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import * as k8s from "@pulumi/kubernetes";

// Since we're using a general-purpose programming language, we can now use that language to provide multiple
// implementations of the same abstraction. In this case, we define an abstract "Redis" component whose only property is
// that it has some network identity (host) that consumers can connect to and talk to a Redis connection.
export abstract class Redis extends pulumi.ComponentResource {
    public abstract readonly host: pulumi.Output<string>;

    public static create(name: string, args: RedisArgs, opts?: pulumi.ComponentResourceOptions): Redis {
        // Since we are using TypeScript and RedisArgs is the union of argument types for each resource. Since args.type
        // has type "amazon" | "docker" | "kubernetes", the compiler assists us in making sure that we don't
        // accidentally mix up argument types.
        switch (args.type) {
        case "amazon":
            return new AmazonRedis(name, args, opts);
        case "docker":
            return new DockerRedis(name, args, opts);
        case "kubernetes":
            return new KubernetesRedis(name, args, opts);
        }
    }

    constructor(ty: string, name: string, args: RedisArgs, opts?: pulumi.ComponentResourceOptions) {
        super(ty, name, args, opts);
    }
}

export type RedisArgs = DockerRedisArgs | KubernetesRedisArgs | AmazonRedisArgs;

class DockerRedis extends pulumi.ComponentResource {
    public readonly host: pulumi.Output<string>;

    constructor(name: string, args: DockerRedisArgs, opts?: pulumi.ComponentResourceOptions) {
        super("dockercon:docker:Redis", name, args, opts);
        const childOpts = { ...opts, parent: this };
        const redisImage = new docker.RemoteImage(`${name}-image`, {
            name: "redis:latest",
            keepLocally: true,
        }, childOpts);

        const redisContainer = new docker.Container(`${name}-container`, {
            image: redisImage.name,
            networksAdvanced: [{ name: args.network.name }],
            restart: "on-failure",
        }, childOpts);

        this.host = redisContainer.name;
        this.registerOutputs({
            host: this.host,
        });
    }
}

export interface DockerRedisArgs {
    type: "docker";
    network: docker.Network;
}

// KubernetesRedis is an implementation of the Redis abstraction, using a deployment on a Kubernetes cluster.
class KubernetesRedis extends Redis {
    public readonly host: pulumi.Output<string>;

    constructor(name: string, args: KubernetesRedisArgs, opts?: pulumi.ComponentResourceOptions) {
        super("dockercon:k8s:Redis", name, args, opts);
        const childOpts = { ...opts, parent: this }
        const labels = {app: "redis"};
        const redisDeployment = new k8s.apps.v1.Deployment(`${name}-deploy`, {
            metadata: {
                labels: labels,
            },
            spec: {
                selector: {
                    matchLabels: labels,
                },
                replicas: 1,
                template: {
                    metadata: {
                        labels: labels,
                    },
                    spec: {
                        containers: [{
                            name: "redis",
                            image: "redis:latest",
                            ports: [{
                                containerPort: 6379,
                            }]
                        }]
                    }
                }
            }
        }, childOpts);

        const redisService = new k8s.core.v1.Service(`${name}-svc`, {
            metadata: {
                labels: labels,
            },
            spec: {
                type: "LoadBalancer",
                selector: labels,
                ports: [{
                    targetPort: 6379,
                    port: 6379,
                }]
            }
        }, childOpts);

        this.host = redisService.status.apply(status => status.loadBalancer.ingress[0].ip);
        this.registerOutputs({
            host: this.host
        });
    }
}

export interface KubernetesRedisArgs {
    type: "kubernetes";
}

// AmazonRedis is an implementation of the Redis abstraction, using AWS ElastiCache.
class AmazonRedis extends Redis {
    public readonly host: pulumi.Output<string>;

    constructor(name: string, args: AmazonRedisArgs, opts?: pulumi.ComponentResourceOptions) {
        super("dockercon:aws:Redis", name, args, opts);
        const childOpts = { ...opts, parent: this };
        const cluster = new aws.elasticache.Cluster(`${name}-ec`, {
            engine: "redis",
            nodeType: "cache.t2.micro",
            numCacheNodes: 1,
        }, childOpts);

        this.host = cluster.cacheNodes.apply(nodes => nodes[0].address);
        this.registerOutputs({
            host: this.host,
        });
    }
}

export interface AmazonRedisArgs {
    type: "amazon";
}
