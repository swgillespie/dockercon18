import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import * as k8s from "@pulumi/kubernetes";

export abstract class Redis extends pulumi.ComponentResource {
    public abstract readonly host: pulumi.Output<string>;

    public static create(name: string, args: RedisArgs, opts?: pulumi.ComponentResourceOptions): Redis {
        if (args.docker) {
            return new DockerRedis(name, args.docker, opts);
        }

        if (args.kubernetes) {
            return new KubernetesRedis(name, args.kubernetes, opts);
        }

        if (args.amazon) {
            return new AmazonRedis(name, args.amazon, opts);
        }

        throw new Error("don't know what to make!");
    }

    constructor(ty: string, name: string, args: RedisArgs, opts?: pulumi.ComponentResourceOptions) {
        super(ty, name, args, opts);
    }
}

export interface RedisArgs {
    docker?: DockerRedisArgs;
    kubernetes?: KubernetesRedisArgs;
    amazon?: AmazonRedisArgs;
}

class DockerRedis extends pulumi.ComponentResource {
    public readonly host: pulumi.Output<string>;

    constructor(name: string, args: DockerRedisArgs, opts?: pulumi.ComponentResourceOptions) {
        super("dockercon:docker:Redis", name, args, opts);
        const childOpts = Object.assign({ parent: this }, opts);
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
    network: docker.Network;
}

class KubernetesRedis extends pulumi.ComponentResource {
    public readonly host: pulumi.Output<string>;

    constructor(name: string, args: KubernetesRedisArgs, opts?: pulumi.ComponentResourceOptions) {
        super("dockercon:k8s:Redis", name, args, opts);
        const childOpts = Object.assign({ parent: this }, opts);
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

export interface KubernetesRedisArgs {}

class AmazonRedis extends Redis {
    public readonly host: pulumi.Output<string>;

    constructor(name: string, args: AmazonRedisArgs, opts?: pulumi.ComponentResourceOptions) {
        super("dockercon:aws:Redis", name, args, opts);
        const childOpts = Object.assign({ parent: this }, opts);
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

export interface AmazonRedisArgs {}
