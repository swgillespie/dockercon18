// Copyright 2016-2018, Pulumi Corporation.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import {Redis} from "./index";

export class DockerRedis extends Redis {
    public readonly host: pulumi.Output<string>;

    constructor(name: string, args: DockerRedisArgs, opts?: pulumi.ComponentResourceOptions) {
        super("dockercon:docker:Redis", name, args, opts);
        const childOpts = { ...opts, parent: this }
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
    type: "docker",
    network: docker.Network;
}
