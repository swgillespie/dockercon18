import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";

export class Redis extends pulumi.ComponentResource {
    public readonly host: pulumi.Output<string>;

    constructor(name: string, args: RedisArgs, opts?: pulumi.ComponentResourceOptions) {
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
        /*
        this.registerOutputs({
            host: this.host,
        });*/
    }
}

export interface RedisArgs {
    network: docker.Network,
}
