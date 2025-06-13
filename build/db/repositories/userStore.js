import { redis } from '../redisClient.js';
import { UserSchema } from '../schemas/userSchema.js';
const prefix = 'user:';
export async function setUser(client_id, access_token, expires_in, refresh_token) {
    const current = new Date();
    const expires_at = new Date(current.getTime() + expires_in * 1000);
    const new_user = {
        client_id: client_id,
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expires_at,
        updated_at: current,
    };
    await redis.set(`${prefix}${client_id}`, JSON.stringify(new_user));
}
export async function getUser(client_id) {
    const data = await redis.get(`${prefix}${client_id}`);
    if (!data)
        return null;
    console.log(data);
    const parsed = UserSchema.safeParse(JSON.parse(data));
    if (!parsed.success)
        throw new Error('Corrupted user data');
    return parsed.data;
}
export async function updateUser(client_id, access_token, expires_in) {
    const data = await redis.get(`${prefix}${client_id}`);
    if (!data)
        throw new Error('User does not exist in database');
    const parsed = UserSchema.safeParse(JSON.parse(data));
    if (!parsed.success)
        throw new Error('Corrupted user data');
    const user = parsed.data;
    const current = new Date();
    const expires_at = new Date(current.getTime() + expires_in * 1000);
    const updated_user = {
        ...user,
        access_token: access_token,
        expires_at: expires_at,
        updated_at: current
    };
    await redis.set(`${prefix}${client_id}`, JSON.stringify(updated_user));
    return true;
}
