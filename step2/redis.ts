import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";

// Redis is a "ComponentResource" (a Resource composed of other Resources) that implements a Redis
// service, using Docker containers. It is a simple example of constructing a resource using code that composes
// a nontrivial set of resources.
//
// All Resources in Pulumi that consist only of other resources must derive from the pulumi ComponentResource class.
export class Redis extends pulumi.ComponentResource {
    // The network identity of this Redis instance. For Docker containers, this is simply the name.
    public readonly host: pulumi.Output<string>;

    // The constructor of a ComponentResource does all of the work. In it, users can place all of the code that
    // provisions other resources. In this case, we're encapsulating the use of Docker containers.
    constructor(name: string, args: RedisArgs, opts?: pulumi.ComponentResourceOptions) {
        super("dockercon:docker:Redis", name, args, opts);
        // Pulumi allows for users to supply additional options to child resources. We'd like to propegate the options,
        // with the additional options that children will be parented to this resource.
        const childOpts = { ...opts, parent: this };

        // Otherwise, the code here is pretty much the same as in step 1.
        const redisImage = new docker.RemoteImage(`${name}-image`, {
            name: "redis:latest",
            keepLocally: true,
        }, childOpts);

        const redisContainer = new docker.Container(`${name}-container`, {
            image: redisImage.name,
            networksAdvanced: [{ name: args.network.name }],
            restart: "on-failure",
        }, childOpts);

        // The "host" of this Redis service is simply the name of the docker container.
        this.host = redisContainer.name;

        // registerOutputs informs the Pulumi CLI that this resource has completed construction. Its use is purely
        // cosmetic and only affects UI presentation.
        this.registerOutputs({
            host: this.host,
        });
    }
}

export interface RedisArgs {
    network: docker.Network,
}
