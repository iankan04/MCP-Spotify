import { createClient } from 'redis';
const url = process.env.REDIS_URL;
export const redis = createClient({ url: url });
redis.on('error', err => console.error('Redis error:', err));
await redis.connect();
