import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import {Redis} from "./index";

export class AmazonRedis extends Redis {
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
