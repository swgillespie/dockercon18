import * as docker from "@pulumi/docker";
import {Redis} from "./redis";

const network = new docker.Network("net");
const redis = Redis.create("redis", {
    // docker: {network: network},
    // kubernetes: {},
    amazon: {},
});

const redisCommanderImage = new docker.RemoteImage("redis-commander-image", {
    name: "rediscommander/redis-commander:latest",
    keepLocally: true,
});

const redisCommanderContainer = new docker.Container("redis-commander", {
    image: redisCommanderImage.name,
    restart: "on-failure",
    networksAdvanced: [{ name: network.name }],
    envs: [
        redis.host.apply(name => `REDIS_HOST=${name}`),
    ],
    ports: [{
        internal: 8081,
        external: 3000,
    }]
});

const redisCommanderEndpoint = redisCommanderContainer.ports.apply(p => `http://localhost:${p![0].external}`);
export const appName = redisCommanderContainer.name;
export const host = redisCommanderEndpoint;
