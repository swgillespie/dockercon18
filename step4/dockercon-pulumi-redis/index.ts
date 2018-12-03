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

import {DockerRedis, DockerRedisArgs} from "./docker";
import {KubernetesRedis, KubernetesRedisArgs} from "./kubernetes";

export abstract class Redis extends pulumi.ComponentResource {
    public abstract readonly host: pulumi.Output<string>;

    public static create(name: string, args: RedisArgs, opts?: pulumi.ComponentResourceOptions): Redis {
        switch (args.type) {
        case "docker":
            return new DockerRedis(name, args, opts);
        case "kubernetes":
            return new KubernetesRedis(name, args, opts);
        }
    }

    constructor(type: string, name: string, args: RedisArgs, opts?: pulumi.ComponentResourceOptions) {
        super(type, name, args, opts);
    }
}

export type RedisArgs = DockerRedisArgs | KubernetesRedisArgs;
