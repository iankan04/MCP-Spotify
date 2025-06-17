import { z } from "zod";
import { handleSpotifyRequest } from "./auth.js";
const startPlayback = {
    name: "startPlayback",
    description: "Start a new context or resume current playback on user's active device, only for spotify premium users",
    schema: {
        device_id: z
            .string()
            .optional()
            .describe("The id of the device this command is targetting. If not supplied, the user's current actual device is the target. Example: {context_uri:'spotify:album:1Je1IMUlBXcx1Fz0WE7oPT'}"),
        context_uri: z
            .string()
            .optional()
            .describe("Optional. Spotify URI of the context to play. Valid contexts are albums, artists and playlists"),
        // offset: z
        //     .object({
        //         position: z.number().nonnegative().optional().describe('The offset from the context object. Example: "offset": {"position": 5}. '),
        //         uri: z.string().optional().describe('A string representation of the uri of the item to start at. Example: "offset": {"uri": "spotify:track:1301WleyT98MSxVHPZCA6M"}')
        //     })
        //     .refine(data => typeof data !== "string", {
        //         message: "Offset must be an object, not a string",
        //         path: ["offset"]
        //     })
        //     .optional()
        //     .describe('Optional. Indicates from where in the context playback should start. Only available when the context_uri corresponds to an album or playlist object.'),
    },
    handler: async (args, extra) => {
        const { device_id, context_uri } = args;
        function normalizeOffset(o) {
            return (o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).length > 0)
                ? o
                : undefined;
        }
        // const off = normalizeOffset(offset);
        // console.error(off);
        // if (off && !context_uri) {
        //     return {
        //         content: [
        //             {
        //                 type: 'text',
        //                 text: 'Offset without context or uris not allowed',
        //             }
        //         ]
        //     }
        // }
        let response;
        try {
            await handleSpotifyRequest(async (spotifyApi) => {
                const device = device_id || '';
                // if (!context_uri && !off) {
                //     await spotifyApi.player.startResumePlayback(device);
                // } else {
                //     await spotifyApi.player.startResumePlayback(device, context_uri, undefined, off);
                // }
                response = await spotifyApi.player.startResumePlayback(device);
                return;
            });
            console.error(response);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Playback started`,
                    }
                ]
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error starting/resuming playback with error: ${error}`
                    }
                ]
            };
        }
    }
};
const playMusic = {
    name: 'playMusic',
    description: 'Start playing a Spotify track, album, artist, or playlist',
    schema: {
        uri: z
            .string()
            .optional()
            .describe('The Spotify URI to play (overrides type and id)'),
        type: z
            .enum(['track', 'album', 'artist', 'playlist'])
            .optional()
            .describe('The type of item to play'),
        id: z.string().optional().describe('The Spotify ID of the item to play'),
        deviceId: z
            .string()
            .optional()
            .describe('The Spotify device ID to play on'),
    },
    handler: async (args, _extra) => {
        const { uri, type, id, deviceId } = args;
        if (!(uri || (type && id))) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Error: Must provide either a URI or both a type and ID',
                        isError: true,
                    },
                ],
            };
        }
        let spotifyUri = uri;
        if (!spotifyUri && type && id) {
            spotifyUri = `spotify:${type}:${id}`;
        }
        await handleSpotifyRequest(async (spotifyApi) => {
            const device = deviceId || '';
            if (!spotifyUri) {
                await spotifyApi.player.startResumePlayback(device);
                return;
            }
            if (type === 'track') {
                await spotifyApi.player.startResumePlayback(device, undefined, [
                    spotifyUri,
                ]);
            }
            else {
                await spotifyApi.player.startResumePlayback(device, spotifyUri);
            }
        });
        return {
            content: [
                {
                    type: 'text',
                    text: `Started playing ${type || 'music'} ${id ? `(ID: ${id})` : ''}`,
                },
            ],
        };
    },
};
export const write = [
    // startPlayback
    playMusic
];
