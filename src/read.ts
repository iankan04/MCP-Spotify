import type { MaxInt } from "@spotify/web-api-ts-sdk";
import { z } from "zod";
import type { SpotifyHandlerExtra, tool, SpotifyTrack, SpotifyEpisode } from "./types.js";
import { handleSpotifyRequest } from "./auth.js";

function isTrack(item: any): item is SpotifyTrack {
    return (
        item &&
        item.type === 'track' &&
        Array.isArray(item.artists) &&
        item.album &&
        typeof item.album.name === 'string'
    )
}

function isEpisode(item: any): item is SpotifyEpisode {
    return (
        item &&
        item.type === 'episode' &&
        item.show
    )
}

const searchSpotify: tool<{
    query: z.ZodString;
    type: z.ZodEnum<['album', 'artist', 'playlist', 'track', 'show', 'episode', 'audiobook']>;
    limit: z.ZodOptional<z.ZodNumber>;
}> = {
    name: "searchSpotify",
    description: "Get Spotify catalog information about albums, artists, playlists, tracks, shows, episodes or audiobooks that match a keyword string",
    schema: {
        query: z.string().describe("Your search query"),
        type: z
            .enum(['album', 'artist', 'playlist', 'track', 'show', 'episode', 'audiobook'])
            .describe("Item types to search across"),
        limit: z
            .number()
            .min(1)
            .max(50)
            .optional()
            .describe("The maximum number of results to return in each item type")
    },
    handler: async (args, extra: SpotifyHandlerExtra) => {
        const { query, type, limit=20 } = args;

        try {
            const results = await handleSpotifyRequest(async (spotifyApi) => {
                return await spotifyApi.search(
                    query,
                    [type],
                    undefined,
                    limit as MaxInt<50>
                )
            });

            let formattedResults = ""

            if (results === null) {
                throw new Error("No results returned");
            }

            if (type === 'album' && results.albums) {
                formattedResults = results.albums.items.map((album, i) => {
                    const artists = album.artists.map(a => a.name).join(', ');
                    return `${i + 1}. "${album.name}" by ${artists} (${album.release_date})`;
                }).join('\n');
            } else if (type === 'artist' && results.artists) {
                formattedResults = results.artists.items.map((artist, i) => {
                    return `${i + 1}. "${artist.name} with ${artist.followers} followers and popularity score ${artist.popularity}`;
                }).join('\n');
            } else if (type === 'playlist' && results.playlists !== null) {
                formattedResults = results.playlists.items.map((playlist, i) => {
                    return `${i + 1}. "${playlist?.name ?? 'Unknown Playlist'} owned by ${playlist?.owner.display_name ?? 'Unknown Owner'} with ${playlist?.followers ?? 'Unknown followers'} followers`;
                }).join('\n');
            } else if (type === 'track' && results.tracks) {
                formattedResults = results.tracks.items.map((track, i) => {
                    const artists = track.artists.map(a => a.name).join(', ');
                    return `${i + 1}. "${track.name} by ${artists} that is ${track.duration_ms} ms long`;
                }).join('\n');
            } else if (type === 'show' && results.shows) {
                formattedResults = results.shows.items.map((show, i) => {
                    return `${i + 1}. "${show.name} by ${show.publisher}. ${show.description} The show has ${show.total_episodes} number of total episodes`;
                }).join('\n');
            } else if (type === 'episode' && results.episodes) {
                formattedResults = results.episodes.items.map((episode, i) => {
                    return `${i + 1}. "${episode.name} is about ${episode.description} The episode is ${episode.duration_ms} ms long. `;
                }).join('\n');
            } else if (type === 'audiobook' && results.audiobooks) {
                formattedResults = results.audiobooks.items.map((audiobook, i) => {
                    return `${i + 1}. "${audiobook.name} (${audiobook.edition} edition) by ${audiobook.publisher} and narrated by ${audiobook.narrators}. ${audiobook.description} The audiobook has ${audiobook.total_chapters} chapters. `;
                }).join('\n');
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: formattedResults || `No ${type} results found for ${query}.`,
                    }
                ]
            }
        } catch (error) {
            console.error("Error in searchSpotify handler:", error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching for ${query}: ${
                            error instanceof Error ? error.message : String(error)
                        }`
                    }
                ]
            }
        }
    }
}

const getTopItems: tool<{
    type: z.ZodEnum<["artists", "tracks"]>,
    time_range: z.ZodOptional<z.ZodEnum<["long_term", "medium_term", "short_term"]>>,
    limit: z.ZodOptional<z.ZodNumber>
}> = {
    name: "getTopItems",
    description: "Get the current user's top artists or tracks based on calculated affinity",
    schema: {
        type: z
            .enum(['artists', 'tracks'])
            .describe('The gtype of entity to return. Valid values: artists or tracks'),
        time_range: z
            .enum(["long_term", "medium_term", "short_term"])
            .optional()
            .describe("Over what time frame the affinities are computed. Long term ~1 year of data, medium term is last 6 months, short term is last 4 weeks"),
        limit: z
            .number()
            .min(0)
            .max(50)
            .optional()
            .describe("The maximum number of items to return. Default: 20, minimum: 1, maximum: 50")  
    },  
    handler: async (args, extra: SpotifyHandlerExtra) => {
        const { type, time_range="medium_term", limit=20 } = args

        try {
            const results = await handleSpotifyRequest(async (spotifyApi) => {
                return await spotifyApi.currentUser.topItems(
                    type,
                    time_range,
                    limit as MaxInt<50>
                )
            });

            let formattedResults = ""

            if (!results) {
                throw new Error("No results returned");
            }

            if (type === 'artists' && results.items.length > 0) {
                formattedResults = results.items.map((artist : any, i: number) => {
                    return `${i + 1}. ${artist.name} with id ${artist.id} and popularity ${artist.popularity}`;
                }).join('\n');
            } else if (type === 'tracks' && results.items.length > 0) {
                formattedResults = results.items.map((track: any, i: number) => {
                    const albumName = track.album?.name ?? 'Unknown Album';
                    const albumId = track.album?.id ?? 'Unknown ID';
                    const artists = track.artists?.map((a: any) => a.name).join(', ') ?? 'Unknown Artist';
                    return `${i + 1}. "${track.name}" from album "${albumName}" with id ${albumId} by ${artists} (duration: ${track.duration_ms} ms)`;
                }).join('\n');
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: formattedResults || `No ${type} results found for get top items.`,
                    }
                ]
            }
        } catch (error) {
            console.error("Error in getTopItems handler:", error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching for top items: ${
                            error instanceof Error ? error.message : String(error)
                        }`
                    }
                ]
            }
        }
    }
}

const getMyPlaylists: tool<{
    limit: z.ZodOptional<z.ZodNumber>
}> = {
    name: "getMyPlaylists",
    description: "Get a list of the playlist owned or followed by the current Spotify user",
    schema: {
        limit: z
            .number()
            .min(0)
            .max(50)
            .optional()
            .describe("The maximum number of items to return. Default: 20. Min: 1. Max: 50.")
    },
    handler: async (args, extra: SpotifyHandlerExtra) => {
        const { limit=20 } = args;

        try {
            const results = await handleSpotifyRequest(async (spotifyApi) => {
                return await spotifyApi.currentUser.playlists.playlists(
                    limit as MaxInt<50>
                )
            });

            if (!results) {
                throw new Error("No results returned");
            }

            let formattedResults = ""

            if (results.items.length > 0) {
                formattedResults = results.items.map((playlist, i) => {
                    return `${i + 1}. ${playlist.name} by ${playlist.owner.display_name} with id ${playlist.id} with description ${playlist.description}`
                }).join('\n');
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: formattedResults || `No results found for get my playlists.`,
                    }
                ]
            }
        } catch (error) {
            console.error("Error in getMyPlaylists handler:", error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching for my playlists: ${
                            error instanceof Error ? error.message : String(error)
                        }`
                    }
                ]
            }
        }
    }
}


const getPlaylistItems: tool<{
    playlist_id: z.ZodString,
    fields: z.ZodOptional<z.ZodString>,
    limit: z.ZodOptional<z.ZodNumber>
}> = {
    name: "getPlaylistsItems",
    description: "Get full details of the items of a playlist owned by a Spotify user",
    schema: {
        playlist_id: z.string().describe("The Spotify ID of the playlist"),
        fields: z
            .string()
            .optional()
            .describe("Filters for the query: a comma-separated list of the fields to return. If omitted, all fields are returned. For example, to get just the total number of items and the request limit: fields=total,limit. A dot separator can be used to specify non-reoccurring fields, while parentheses can be used to specify reoccurring fields within objects. For example, to get just the added date and user ID of the adder: fields=items(added_at,added_by.id). Use multiple parentheses to drill down into nested objects, for example: fields=items(track(name,href,album(name,href))). Fields can be excluded by prefixing them with an exclamation mark, for example: fields=items.track.album(!external_urls,images)"),
        limit: z
            .number()
            .min(0)
            .max(50)
            .optional()
            .describe("The maximum number of items to return. Default: 20. Min: 1. Max: 50.")
    },
    handler: async (args, extra: SpotifyHandlerExtra) => {
        const { playlist_id, fields, limit=20 } = args;

        try {
            const results = await handleSpotifyRequest(async (spotifyApi) => {
                return await spotifyApi.playlists.getPlaylistItems(
                    playlist_id,
                    undefined,
                    fields,
                    limit as MaxInt<50>
                )
            });

            if (!results) {
                throw new Error("No results returned");
            }

            let formattedResults = ""

            if (results.items.length > 0) {
                formattedResults = results.items.map((track, i) => {
                    const artists = track.track.artists.map(a => a.name).join(', ');
                    return `${i + 1}. ${track.track.name} by ${artists} with id ${track.track.id} added at ${track.added_at} with duration ${track.track.duration_ms} ms and popularity ${track.track.popularity}`;
                }).join('\n');
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: formattedResults || `No results found for get my playlists.`,
                    }
                ]
            }
        } catch (error) {
            console.error("Error in getMyPlaylists handler:", error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching for my playlists: ${
                            error instanceof Error ? error.message : String(error)
                        }`
                    }
                ]
            }
        }
    }
}

const getUserProfile: tool<{
    user_id: z.ZodString,
}> = {
    name: "getUserProfile",
    description: "Get public profile information about a Spotify user",
    schema: {
        user_id: z.string().describe("The user's Spotify user ID"),
    },
    handler: async (args, extra: SpotifyHandlerExtra) => {
        const { user_id } = args;

        try {
            const results = await handleSpotifyRequest(async (spotifyApi) => {
                return await spotifyApi.users.profile(
                    user_id
                )
            });

            if (!results) {
                throw new Error("No results returned");
            }

            let formattedResults = `User: ${results.display_name} with ID ${results.id} and followers ${results.followers.total}`

            return {
                content: [
                    {
                        type: 'text',
                        text: formattedResults || `No results found for get my playlists.`,
                    }
                ]
            }
        } catch (error) {
            console.error("Error in getUserProfile handler:", error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching for user profile: ${
                            error instanceof Error ? error.message : String(error)
                        }`
                    }
                ]
            }
        }
    }
}

const getCurrentlyPlaying: tool<{}> = {
    name: "getCurrentlyPlaying",
    description: "Get the object currently being played on the user's Spotify account",
    schema: {},
    handler: async (args, extra: SpotifyHandlerExtra) => {
        try {
            const results = await handleSpotifyRequest(async (spotifyApi) => {
                return await spotifyApi.player.getCurrentlyPlayingTrack();
            });

            if (!results) {
                throw new Error("No results returned");
            }
            
            if (!results.is_playing) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Nothing is currently playing on Spotify',
                        }
                    ]
                }
            }

            let formattedResults = "";

            if (isTrack(results?.item)) {
                const artists = results.item.artists.map(a => a.name).join(', ');
                const album = results.item.album.name;
                const duration_ms = results.item.duration_ms;
                const progress_ms = results.progress_ms;

                formattedResults = `Currently playing track ${results.item.name} by ${artists} from album ${album} with duration ${duration_ms} ms and progress ${progress_ms} ms into the song`;
            } else if (isEpisode(results?.item)) {
                const description = results.item.description;
                const duration_ms = results.item.duration_ms;
                const publisher = results.item.show.publisher;
                const episodeName = results.item.name;
                const showName = results.item.show.name;

                formattedResults = `Currently playing episode ${episodeName} of show ${showName} by ${publisher} with description ${description} and duration ${duration_ms} ms`
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: formattedResults || `No results found for get my playlists.`,
                    }
                ]
            }
        } catch (error) {
            // console.error("Error in getCurrentlyPlaying handler:", error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching for currently playing song: ${
                            error instanceof Error ? error.message : String(error)
                        }`
                    }
                ]
            }
        }
    }
}

const getRecentlyPlayedTracks: tool<{
    limit: z.ZodOptional<z.ZodNumber>
}> = {
    name: "getRecentlyPlayedTracks",
    description: "Get tracks from the current user's recently played tracks",
    schema: {
        limit: z
            .number()
            .min(0)
            .max(50)
            .optional()
            .describe("The maximum number of items to return. Default: 20. Min: 1. Max: 50")
    },
    handler: async (args, extra: SpotifyHandlerExtra) => {
        try {
            const { limit=20 } = args

            const results = await handleSpotifyRequest(async (spotifyApi) => {
                return await spotifyApi.player.getRecentlyPlayedTracks(
                    limit as MaxInt<50>
                );
            });

            let formattedResults = "";



            if (results) {
                const total = results.total;
                const tracks = results.items.map((track, i) => {
                    return `${i + 1}. ${track.track.name} by ${track.track.artists} with duration ${track.track.duration_ms} ms and played at ${track.played_at}`;
                }).join('\n');


                formattedResults = `Total items: ${total}\n ${tracks}`;
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: formattedResults || `No results found for get recently played tracks.`,
                    }
                ]
            }
        } catch (error) {
            console.error("Error in getRecentlyPlayedTracks handler:", error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching for get recently played tracks: ${
                            error instanceof Error ? error.message : String(error)
                        }`
                    }
                ]
            }
        }
    }
}

const getUserQueue: tool<{}> = {
    name: "getUserQueue",
    description: "Get the list of objects that make up the user's queue",
    schema: {},
    handler: async (args, extra: SpotifyHandlerExtra) => {
        try {
            const results = await handleSpotifyRequest(async (spotifyApi) => {
                return await spotifyApi.player.getUsersQueue();
            });

            if (!results) {
                throw new Error("No results returned");
            }

            let formattedResults = "";

            if (results.queue.length > 0) {
                formattedResults = results.queue.map((track, i) => {
                    if (isTrack(track)) {
                        const artists = track.artists.map(a => a.name).join(', ');
                        const album = track.album.name;
                        const duration_ms = track.duration_ms;

                        return `${i + 1}. ${track.name} by ${artists} from album ${album} with duration ${duration_ms} ms`;
                    } else if (isEpisode(track)) {
                        const description = track.description;
                        const duration_ms = track.duration_ms;
                        const publisher = track.show.publisher;
                        const episodeName = track.name;
                        const showName = track.show.name;

                        formattedResults = `Currently playing episode ${episodeName} of show ${showName} by ${publisher} with description ${description} and duration ${duration_ms} ms`
                    }
                }).join('\n');
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: formattedResults || `No songs in queue at the moment`,
                    }
                ]
            }
        } catch (error) {
            console.error("Error in getUserQueue handler:", error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching for user queue: ${
                            error instanceof Error ? error.message : String(error)
                        }`
                    }
                ]
            }
        }
    }
}

export const read = [
    searchSpotify,
    getTopItems,
    getMyPlaylists,
    getPlaylistItems,
    getUserProfile,
    getCurrentlyPlaying,
    getRecentlyPlayedTracks,
    getUserQueue
]