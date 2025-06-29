import { z } from "zod";
import { handleSpotifyRequest } from "./auth.js";
const searchSpotify = {
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
    handler: async (args, extra) => {
        const { query, type, limit = 20 } = args;
        try {
            const results = await handleSpotifyRequest(async (spotifyApi) => {
                return await spotifyApi.search(query, [type], undefined, limit);
            });
            let formattedResults = "";
            if (type === 'album' && results.albums) {
                formattedResults = results.albums.items.map((album, i) => {
                    const artists = album.artists.map(a => a.name).join(', ');
                    return `${i + 1}. "${album.name}" by ${artists} (${album.release_date})`;
                }).join('\n');
            }
            else if (type === 'artist' && results.artists) {
                formattedResults = results.artists.items.map((artist, i) => {
                    return `${i + 1}. "${artist.name} with ${artist.followers} followers and popularity score ${artist.popularity}`;
                }).join('\n');
            }
            else if (type === 'playlist' && results.playlists !== null) {
                formattedResults = results.playlists.items.map((playlist, i) => {
                    return `${i + 1}. "${playlist?.name ?? 'Unknown Playlist'} owned by ${playlist?.owner.display_name ?? 'Unknown Owner'} with ${playlist?.followers ?? 'Unknown followers'} followers`;
                }).join('\n');
            }
            else if (type === 'track' && results.tracks) {
                formattedResults = results.tracks.items.map((track, i) => {
                    const artists = track.artists.map(a => a.name).join(', ');
                    return `${i + 1}. "${track.name} by ${artists} that is ${track.duration_ms} ms long`;
                }).join('\n');
            }
            else if (type === 'show' && results.shows) {
                formattedResults = results.shows.items.map((show, i) => {
                    return `${i + 1}. "${show.name} by ${show.publisher}. ${show.description} The show has ${show.total_episodes} number of total episodes`;
                }).join('\n');
            }
            else if (type === 'episode' && results.episodes) {
                formattedResults = results.episodes.items.map((episode, i) => {
                    return `${i + 1}. "${episode.name} is about ${episode.description} The episode is ${episode.duration_ms} ms long. `;
                }).join('\n');
            }
            else if (type === 'audiobook' && results.audiobooks) {
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
            };
        }
        catch (error) {
            console.error("Error in searchSpotify handler:", error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching for ${query}: ${error instanceof Error ? error.message : String(error)}`
                    }
                ]
            };
        }
    }
};
const getTopItems = {
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
    handler: async (args, extra) => {
        const { type, time_range = "medium_term", limit = 20 } = args;
        try {
            const results = await handleSpotifyRequest(async (spotifyApi) => {
                return await spotifyApi.currentUser.topItems(type, time_range, limit);
            });
            let formattedResults = "";
            if (type === 'artists' && results.items.length > 0) {
                formattedResults = results.items.map((artist, i) => {
                    return `${i + 1}. ${artist.name} with id ${artist.id} and popularity ${artist.popularity}`;
                }).join('\n');
            }
            else if (type === 'tracks' && results.items.length > 0) {
                formattedResults = results.items.map((track, i) => {
                    const albumName = track.album?.name ?? 'Unknown Album';
                    const albumId = track.album?.id ?? 'Unknown ID';
                    const artists = track.artists?.map((a) => a.name).join(', ') ?? 'Unknown Artist';
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
            };
        }
        catch (error) {
            console.error("Error in getTopItems handler:", error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching for top items: ${error instanceof Error ? error.message : String(error)}`
                    }
                ]
            };
        }
    }
};
const getMyPlaylists = {
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
    handler: async (args, extra) => {
        const { limit = 20 } = args;
        try {
            const results = await handleSpotifyRequest(async (spotifyApi) => {
                return await spotifyApi.currentUser.playlists.playlists(limit);
            });
            let formattedResults = "";
            if (results.items.length > 0) {
                formattedResults = results.items.map((playlist, i) => {
                    return `${i + 1}. ${playlist.name} by ${playlist.owner.display_name} with id ${playlist.id} with description ${playlist.description}`;
                }).join('\n');
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: formattedResults || `No results found for get my playlists.`,
                    }
                ]
            };
        }
        catch (error) {
            console.error("Error in getMyPlaylists handler:", error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching for my playlists: ${error instanceof Error ? error.message : String(error)}`
                    }
                ]
            };
        }
    }
};
const getPlaylistItems = {
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
    handler: async (args, extra) => {
        const { playlist_id, fields, limit = 20 } = args;
        try {
            const results = await handleSpotifyRequest(async (spotifyApi) => {
                return await spotifyApi.playlists.getPlaylistItems(playlist_id, undefined, fields, limit);
            });
            let formattedResults = "";
            if (results.items.length > 0) {
                formattedResults = results.items.map((track, i) => {
                    const artists = track.track.artists.map(a => a.name).join(', ');
                    return `${i + 1}. ${track.track.name} by ${artists} with id ${track.track.id} added at ${track.added_at} with duration ${track.track.duration_ms} ms`;
                }).join('\n');
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: formattedResults || `No results found for get my playlists.`,
                    }
                ]
            };
        }
        catch (error) {
            console.error("Error in getMyPlaylists handler:", error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error searching for my playlists: ${error instanceof Error ? error.message : String(error)}`
                    }
                ]
            };
        }
    }
};
export const tools = [
    searchSpotify,
    getTopItems,
    getMyPlaylists,
    getPlaylistItems,
];
