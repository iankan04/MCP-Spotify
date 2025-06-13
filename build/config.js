import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '/Users/iank8/Desktop/Coding Projects/MCP-Spotify/.env.local' });
function getEnv(name) {
    const val = process.env[name];
    if (!val)
        throw new Error(`Missing required env var: ${name}`);
    return val;
}
export const config = {
    client_id: getEnv('SPOTIFY_CLIENT_ID'),
    client_secret: getEnv('SPOTIFY_CLIENT_SECRET'),
    redirect_uri: getEnv('SPOTIFY_REDIRECT_URI'),
};
