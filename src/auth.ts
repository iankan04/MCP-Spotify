import express from 'express';
import crypto from 'crypto';
import * as qs from 'querystring';
import axios from 'axios';
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { config } from "./config.js";
import { URLSearchParams } from 'node:url';
import { setUser, getUser, updateUser } from './db/repositories/userStore.js'

const app = express();
const PORT = 8000;

const { client_id, client_secret, redirect_uri } = config;

function generateRandomString(length : number) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

async function exchangeCodeForToken( 
    code : string 
): Promise<{ 
    access_token: string;
    expires_in: number; 
    refresh_token: string; 
}> {
    const tokenUrl = 'https://accounts.spotify.com/api/token'
    const authHeader = `Basic ${Buffer.from(`${client_id}:${client_secret}`).toString('base64')}`

    const params = new URLSearchParams();
        params.append('code', code);
        params.append('redirect_uri', redirect_uri as string);
        params.append('grant_type', 'authorization_code');

    const response = await axios.post<{
        access_token: string;
        expires_in: number;
        refresh_token: string;
    }>(
        tokenUrl, 
        params.toString(), 
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': authHeader,
            },
        }
    );

    if (response.status !== 200) {
        const error = await response.statusText;
        throw new Error(`Failed to exchange code for token: ${error}`);
    }

    const data = await response.data;
    return {
        access_token: data.access_token,
        expires_in: data.expires_in,
        refresh_token: data.refresh_token,
    };
}

app.get('/', function(req, res) {
    res.redirect('/login');
}) 

app.get('/login', function(req, res) {
    const state = generateRandomString(16);
    const scope = [
        'user-read-private',
        'user-read-email',
        'user-top-read'
    ]

    res.redirect('https://accounts.spotify.com/authorize?' +
        qs.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
        }));
});

app.get('/callback', async function(req, res) {   
    const code = typeof req.query.code === 'string' ? req.query.code : null;
    const state = typeof req.query.state === 'string' ? req.query.state : null;

    if (state === null || code === null) {
        res.redirect('/#' + qs.stringify({error: 'missing_state_or_code'}));
    } 

    try {
        const tokens = exchangeCodeForToken( code as string );

        if (await getUser(client_id) === null) {
            await setUser(client_id, (await tokens).access_token, (await tokens).expires_in, (await tokens).refresh_token);
        } else {
            console.error("User already exists in the database")
        }

        res.end(
            '<html><body><h1>Authentication Successful</h1><p>You can now close this window</p></body></html>'
        );
        console.log('Authentication successful');
        server.close();
    } catch (error) {
        res.end(
            '<html><body><h1>Authentication failure</h1><p>Close the window and try again</p></body></html>'
        );
        console.error(error);
    }
    
});

const server = app.listen(PORT, () => {
  console.error(`Express server running at http://localhost:${PORT}/`);
});

export async function refreshSpotifyToken(
    refresh_token: string
): Promise<{
    access_token: string;
    expires_in: number;
}> {
    const tokenUrl = 'https://accounts.spotify.com/api/token';

    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refresh_token);

    const response = await axios.post<{
        access_token: string;
        expires_in: number;
    }>(tokenUrl, params.toString(), {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization':
            'Basic ' +
            Buffer.from(`${config.client_id}:${config.client_secret}`).toString('base64'),
        },
    });

    return {
        access_token: response.data.access_token,
        expires_in: response.data.expires_in,
    };
    
}

export async function handleSpotifyRequest<T>(
    action: (spotifyApi : SpotifyApi) => Promise<T>,
): Promise<T> {
    let user = await getUser(client_id);
    if (user === null) {
        throw new Error("User does not exist in database");
    }
    
    const current = new Date();
    if (current >= user.expires_at) {
        console.error("refreshing");
        try {
            const refreshed = await refreshSpotifyToken(user.refresh_token);
            await updateUser(client_id, refreshed.access_token, refreshed.expires_in);

            user = await getUser(client_id);
            if (user === null) {
                throw new Error("User does not exist in database");
            }
        } catch (error) {
            console.error("Error refreshing token:", error);
            throw new Error("Failed to refresh token");
        }
    }
    
    try {
        const spotifyApi = SpotifyApi.withAccessToken(user.client_id, { 
            access_token: user.access_token, 
            token_type: 'Bearer', 
            expires_in: 3600, 
            refresh_token: user.refresh_token 
        });
        const result = await action(spotifyApi);
        if (!result) {
            throw new Error("No results returned from Spotify API");
        }
        return result;
    } catch (error) {
        console.error("Error in handleSpotifyRequest:", error);
        throw new Error(`Spotify API error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

