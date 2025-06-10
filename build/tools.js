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
        const { query, type, limit } = args;
        const lim = limit ?? 20;
        try {
            const results = await handleSpotifyRequest(async (spotifyApi) => {
                return await spotifyApi.search(query, [type], undefined, lim);
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
                // console.log(results.playlists);
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
            console.error(formattedResults);
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
export const tools = [
    searchSpotify,
];
