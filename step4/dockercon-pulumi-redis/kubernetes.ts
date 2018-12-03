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
import * as k8s from "@pulumi/kubernetes";
import {Redis} from "./index";

export class KubernetesRedis extends Redis {
    public readonly host: pulumi.Output<string>;

    constructor(name: string, args: KubernetesRedisArgs, opts?: pulumi.ComponentResourceOptions) {
        super("dockercon:k8s:Redis", name, args, opts);
        const childOpts = Object.assign({ parent: this }, opts);
        const labels = { app: name };
        const deploy = new k8s.apps.v1.Deployment(`${name}-deploy`, {
            metadata: {
                labels: labels,
            },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: labels,
                },
                template: {
                    metadata: {
                        labels: labels,
                    },
                    spec: {
                        containers: [{
                            name: "redis",
                            image: "redis:latest",
                        }]
                    },
                },
            },
        }, childOpts);

        const svc = new k8s.core.v1.Service(`${name}-svc`, {
            metadata: {
                labels: labels,
            },
            spec: {
                selector: labels,
                type: "LoadBalancer",
                ports: [{
                    port: 6379,
                    targetPort: 6379
                }]
            }
        }, childOpts);

        this.host = svc.status.apply(status => status.loadBalancer.ingress[0].ip);
        this.registerOutputs({
            host: this.host
        });
    }
}

export interface KubernetesRedisArgs {
    type: "kubernetes",
}
