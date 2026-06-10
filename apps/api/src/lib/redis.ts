import env from "../config/env.config.js";

// Parse REDIS_URL into BullMQ ConnectionOptions
function parseRedisUrl(url: string): { host: string; port: number; password?: string; tls?: object } {
  try {
    const u = new URL(url);
    return {
      host:     u.hostname,
      port:     parseInt(u.port || "6379", 10),
      password: u.password || undefined,
      tls:      u.protocol === "rediss:" ? {} : undefined,
    };
  } catch {
    return { host: "localhost", port: 6379 };
  }
}

export const redisConnection = parseRedisUrl(env.REDIS_URL);
