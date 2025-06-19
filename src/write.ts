import { z } from "zod";
import type { SpotifyHandlerExtra, tool, SpotifyTrack, SpotifyEpisode } from "./types.js";
import { handleSpotifyRequest } from "./auth.js";
import { ZodEnum } from "zod/v4";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";


const startPlayback: tool<{
    device_id: z.ZodOptional<z.ZodString>,
    context_uri: z.ZodOptional<z.ZodString>,
    type: z.ZodOptional<z.ZodEnum<['track', 'album', 'artist', 'playlist']>>,
    id: z.ZodOptional<z.ZodString>
}> = {
    name: "startPlayback",
    description: "Start a new playback on the active device. Requires at least context_uri or type and id to be given",
    schema: {
        device_id: z
            .string()
            .optional()
            .describe("The id of the device this command is targetting. If not supplied, the user's current actual device is the target"),
        context_uri: z
            .string()
            .optional()
            .describe("Optional. Spotify URI of the context to play. Valid contexts are albums, artists and playlists"),
        type: z
            .enum(['track', 'album', 'artist', 'playlist'])
            .optional()
            .describe("The type to play. Valid types are track, album, artist, or playlist"),
        id: z
            .string()
            .optional()
            .describe("The id to play")
    },
    handler: async (args, _extra: SpotifyHandlerExtra) => {
        const { device_id, context_uri, type, id } = args;

        if (!(context_uri || (type && id))) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Missing context'
                    }
                ]
            }
        }

        let spotifyUri = context_uri;
        if (!spotifyUri && type && id) {
            spotifyUri = `spotify:${type}:${id}`;
        }

        try {
            await handleSpotifyRequest(async (spotifyApi) => {
                const device = device_id || '';

                if (!spotifyUri) {
                    await spotifyApi.player.startResumePlayback(device);
                    return;
                } 
                
                if (type === 'track') {
                    await spotifyApi.player.startResumePlayback(
                        device,
                        undefined,
                        [spotifyUri]
                    );
                    return;
                } else {
                    await spotifyApi.player.startResumePlayback(device, spotifyUri);
                }
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: `Playback started`,
                    }
                ]
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error starting/resuming playback with error: ${error}`
                    }
                ]
            }
        }
    }
}

const resumePlayback: tool<{
    device_id: z.ZodOptional<z.ZodString>,
}> = {
    name: "resumePlayback",
    description: "Resume playback on the active device, only for Spotify premium members",
    schema: {
        device_id: z
            .string()
            .optional()
            .describe("The id of the device this command is targetting. If not supplied, the user's current actual device is the target")
    },
    handler: async (args, _extra: SpotifyHandlerExtra) => {
        const { device_id: id } = args;

        await handleSpotifyRequest(async (spotifyApi) => {
            try {
                await spotifyApi.player.startResumePlayback(id || '');
                return { message: "Playback resumed" };
            } catch (err) {
                console.error("Non-JSON response or error", err);
                return { message: "Playback command sent" };
            }
        });

        return {
            content: [
                {
                    type: 'text',
                    text: `Playback resumed`,
                }
            ]
        }
    }
}

const pausePlayback: tool<{
    device_id: z.ZodOptional<z.ZodString>,
}> = {
    name: "pausePlayback",
    description: "Pause playback on the active device, only for Spotify premium members",
    schema: {
        device_id: z
            .string()
            .optional()
            .describe("The id of the device this command is targetting. If not supplied, the user's current actual device is the target")
    },
    handler: async (args, _extra: SpotifyHandlerExtra) => {
        const { device_id: id } = args;

        await handleSpotifyRequest(async (spotifyApi) => {
            try {
                await spotifyApi.player.pausePlayback(id || '');
                return { message: "Playback paused" };
            } catch (err) {
                console.error("Non-JSON response or error", err);
                return { message: "Playback command sent" };
            }
        });

        return {
            content: [
                {
                    type: 'text',
                    text: `Playback paused`,
                }
            ]
        }
    }
}

const addQueue: tool<{
    uri: z.ZodString,
    device_id: z.ZodOptional<z.ZodString>,
}> = {
    name: "addQueue",
    description: "Add an item to be played next in the playback queue",
    schema: {
        uri: z
            .string()
            .describe("The uri of the item to add to the queue. Must be a track or an episode uri"),
        device_id: z
            .string()
            .optional()
            .describe("The id of the device this command is targetting. If not supplied, the user's current actual device is the target")
    },
    handler: async (args, _extra: SpotifyHandlerExtra) => {
        const { uri, device_id: id } = args;

        await handleSpotifyRequest(async (spotifyApi) => {
            try {
                await spotifyApi.player.addItemToPlaybackQueue(uri, id);
                return { message: "Added to queue" };
            } catch (err) {
                console.error("Non-JSON response or error", err);
                return { message: "Command recieved" };
            }
        });

        return {
            content: [
                {
                    type: 'text',
                    text: `Added to queue`,
                }
            ]
        }
    }
}

const togglePlaybackShuffle: tool<{
    state: z.ZodBoolean,
    device_id: z.ZodOptional<z.ZodString>,
}> = {
    name: "togglePlaybackShuffle",
    description: "Toggle shuffle on or off for user's playback",
    schema: {
        state: z
            .boolean()
            .describe("True: Shuffle user's playback. False: Do not shuffle user's playback"),
        device_id: z
            .string()
            .optional()
            .describe("The id of the device this command is targetting. If not supplied, the user's current actual device is the target")
    },
    handler: async (args, _extra: SpotifyHandlerExtra) => {
        const { state, device_id: id } = args;

        await handleSpotifyRequest(async (spotifyApi) => {
            try {
                await spotifyApi.player.togglePlaybackShuffle(state, id);
                return { message: "Shuffle changed" };
            } catch (err) {
                console.error("Non-JSON response or error", err);
                return { message: "Command sent" };
            }
        });

        return {
            content: [
                {
                    type: 'text',
                    text: `Shuffle changed`,
                }
            ]
        }
    }
}


const createPlaylist: tool<{
    user_id: z.ZodString,
    name: z.ZodString,
    public: z.ZodOptional<z.ZodBoolean>
    description: z.ZodOptional<z.ZodString>
}> = {
    name: "createPlaylist",
    description: "Create a playlist for a spotify user",
    schema: {
        user_id: z
            .string()
            .describe("The user's Spotify user id"),
        name: z
            .string()
            .describe("The name for your new playlist"),
        public: z
            .boolean()
            .optional()
            .describe("The playlists public/private status. Defaults to public"),
        description: z
            .string()
            .optional()
            .describe("The playlist description")
    },
    handler: async (args, _extra: SpotifyHandlerExtra) => {
        const { user_id: id, name, public: pub=true, description } = args;

        if (!(name && id)) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Missing name or user_id'
                    }
                ]
            }
        }

        try {
            await handleSpotifyRequest(async (spotifyApi) => {
                await spotifyApi.playlists.createPlaylist(id, {
                    "name" : name,
                    "public" : pub,
                    "description" : description
                });
                return;
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: `Playlist created`,
                    }
                ]
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error starting/resuming playback with error: ${error}`
                    }
                ]
            }
        }
    }
}

const addItemsToPlaylist: tool<{
    playlist_id: z.ZodString,
    uris: z.ZodOptional<z.ZodArray<z.ZodString>>,
    types: z.ZodOptional<z.ZodArray<z.ZodString>>,
    ids: z.ZodOptional<z.ZodArray<z.ZodString>>
}> = {
    name: "addItemsToPlaylist",
    description: "Adds one or more items to a user's playlist",
    schema: {
        playlist_id: z
            .string()
            .describe("The spotify id of the playlist"),
        uris: z
            .array(z.string())
            .optional()
            .describe("A comma-separated list of Spotify URIs to add, can be track or episode URIs"),
        types: z
            .array(z.string())
            .optional()
            .describe("A comma-separated list of types in the same order as ids"),
        ids: z
            .array(z.string())
            .optional()
            .describe("A comma-separated list of ids in the same order as types"),
    },
    handler: async (args, _extra: SpotifyHandlerExtra) => {
        const { playlist_id, uris, types, ids } = args;

        if (!(uris || types && ids)) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Missing uris or types and ids'
                    }
                ]
            }
        } 
        
        if (uris?.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Empty uris list'
                    }
                ]
            }
        } 
        
        if ((types && !ids) || (!types && ids) || types?.length !== ids?.length) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'types and ids must be the same length and both present'
                    }
                ]
            }
        }

        if ((types?.length === 0 || ids?.length === 0) && !uris) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Empty types or ids list'
                    }
                ]
            };
        }

        const finalized_uris: string[] = uris
            ? uris
            : (types && ids
                ? types.map((type, idx) => `spotify:${type}:${ids[idx]}`)
                : []);

        console.error(finalized_uris);

        try {
            await handleSpotifyRequest(async (spotifyApi) => {
                await spotifyApi.playlists.addItemsToPlaylist(playlist_id, finalized_uris);
                return;
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: `Items added to playlist`,
                    }
                ]
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error adding to playlist ${error}`
                    }
                ]
            }
        }
    }
}

const changePlaylistDetails: tool<{
    playlist_id: z.ZodString,
    name: z.ZodOptional<z.ZodString>,
    public: z.ZodOptional<z.ZodBoolean>,
    description: z.ZodOptional<z.ZodString>
}> = {
    name: "changePlaylistDetails",
    description: "Change a playlist's name and public/private state",
    schema: {
        playlist_id: z
            .string()
            .describe("The Spotify ID of the playlist"),
        name: z
            .string()
            .optional()
            .describe("The new name for the playlist"),
        public: z
            .boolean()
            .optional()
            .describe("The playlist's public/private status"),
        description: z
            .string()
            .optional()
            .describe("Value for playlist description")
    },
    handler: async (args, _extra: SpotifyHandlerExtra) => {
        const { playlist_id, name, public: pub, description } = args;

        await handleSpotifyRequest(async (spotifyApi) => {
            try {
                await spotifyApi.playlists.changePlaylistDetails(playlist_id,{ 
                    "name": name, 
                    "public": pub, 
                    "description": description
                });
                return { message: "Shuffle changed" };
            } catch (err) {
                console.error("Non-JSON response or error", err);
                return { message: "Command sent" };
            }
        });

        return {
            content: [
                {
                    type: 'text',
                    text: `Shuffle changed`,
                }
            ]
        }
    }
}

export const write = [
    startPlayback,
    resumePlayback,
    pausePlayback,
    addQueue,
    togglePlaybackShuffle,
    createPlaylist,
    addItemsToPlaylist,
    changePlaylistDetails,
];

