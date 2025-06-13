import { userInfo } from 'os';
import { redis } from '../redisClient.js';
import { UserSchema, User } from '../schemas/userSchema.js';


const prefix = 'user:';

export async function setUser(client_id: string, access_token: string, expires_in: number, refresh_token: string) {

  const current = new Date();
  const expires_at = new Date(current.getTime() + expires_in * 1000);

  const new_user: User = {
      client_id: client_id,
      access_token: access_token,
      refresh_token: refresh_token,
      expires_at: expires_at,
      updated_at: current,
  }

  await redis.set(`${prefix}${client_id}`, JSON.stringify(new_user));
}

export async function getUser(client_id: string): Promise<User | null> {
  const data = await redis.get(`${prefix}${client_id}`);
  if (!data) return null;

  console.log(data);
  const parsed = UserSchema.safeParse(JSON.parse(data));
  if (!parsed.success) throw new Error('Corrupted user data');

  return parsed.data;
}

export async function updateUser(client_id: string, access_token: string, expires_in: number) : Promise<boolean> {
    const data = await redis.get(`${prefix}${client_id}`);
    if (!data) throw new Error('User does not exist in database');

    const parsed = UserSchema.safeParse(JSON.parse(data));
    if (!parsed.success) throw new Error('Corrupted user data');
    
    const user = parsed.data;
    const current = new Date();
    const expires_at = new Date(current.getTime() + expires_in * 1000);

    const updated_user: User = {
      ...user,
      access_token: access_token,
      expires_at: expires_at,
      updated_at: current
    }

    await redis.set(`${prefix}${client_id}`, JSON.stringify(updated_user));

    return true;
}
