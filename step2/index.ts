import * as docker from "@pulumi/docker";

// Now that we've pulled Redis into its own file, import it here.
import {Redis} from "./redis";

// We still have to create the docker Network, but we can also create a Redis resource as if it were
// any other resource and pass it the network as a parameter.
const network = new docker.Network("net");
const redis = new Redis("redis", {
    network: network,
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
