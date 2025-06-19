<div align="center" style="display: flex; align-items: center; justify-content: center; gap: 10px;">
<img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg" width="30" height="30">
<h1>MCP Spotify AI Assistant</h1>
</div>

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that enables Claude to control Spotify features.

<details>
<summary>Contents</summary>
  
- [Example Interactions](#example-interactions)
- [Tools](#tools)
  - [Read Operations](#read-operations)
  - [Play / Create Operations](#play--create-operations)
- [Setup](#setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Creating a Spotify Developer Application](#creating-a-spotify-developer-application)
  - [Spotify API Configuration](#spotify-api-configuration)
  - [Authentication Process](#authentication-process)
- [Integrating with Claude Desktop, Cursor, and VsCode (Cline)](#integrating-with-claude-desktop-and-cursor)
</details>

## Example Interactions

- _"Can you add the top 5 Coldplay songs to my playlist vibes"_
- _"What are my most listened to songs this past month"_
- _"Can you shuffle play my top songs"_

## Tools

### Read Operations

1. **searchSpotify**

   - **Description**: Search for tracks, albums, artists, or playlists on Spotify
   - **Parameters**:
     - `query` (string): The search term
     - `type` (string): Type of item to search for (track, album, artist, playlist)
     - `limit` (number, optional): Maximum number of results to return (10-50)
   - **Returns**: List of matching items with their IDs, names, and additional details
   - **Example**: `searchSpotify("bohemian rhapsody", "track", 20)`

2. **getTopItems**

   - **Description**: Get the current user's top artists or tracks based on calculated affinity
   - **Parameters**:
     - `type` (string): The type of entity to return. Valid values: artists or tracks
     - `time_range` (string, optional): Over what time frame the affinities are computed. Long_term ~1 year of data, medium_term is last 6 months, short_term is last 4 weeks
     - `limit` (number, optional): The maximum number of items to return. Default: 20, minimum: 1, maximum: 50
   - **Returns**: List of matching items with name, ids, and additional details
   - **Example**: `getTopItems("artists", "short_term", 5)`

3. **getMyPlaylists**

   - **Description**: Get a list of the playlists owned or followed by the current Spotify user
   - **Parameters**:
     - `limit` (number, optional): The maximum number of items to return. Default: 20, minimum: 1, maximum: 50
   - **Returns**: List of matching playlists with name, ids, and additional details
   - **Example**: `getMyPlaylists(25)`

4. **getPlaylistItems**

   - **Description**: Get full details of the items of a playlist owned by a Spotify user
   - **Parameters**:
     - `playlist_id` (string): The Spotify ID of the playlist
     - `fields` (string, optional): A comma-separated list of the fields to return
     - `limit` (number, optional): The maximum number of items to return. Default: 20, minimum: 1, maximum: 50
   - **Returns**: List of matching playlist items with name, ids, and additional details
   - **Example**: `getPlaylistItems("123")`

5. **getCurrentUserProfile**

   - **Description**: Get detailed profile information about the current user
   - **Parameters**: None
   - **Returns**: Users' display name, id, email, and number of followers
   - **Example**: `getCurrentUserProfile()`

6. **getCurrentlyPlaying**

   - **Description**: Get full details of the items of a playlist owned by a Spotify user
   - **Parameters**: None
   - **Returns**: Returns the currently playing item's name and accompanying details
   - **Example**: `getCurrentlyPlaying()`

7. **getRecentlyPlayedTracks**

   - **Description**: Get full details of the items of a playlist owned by a Spotify user
   - **Parameters**:
     - `limit` (number, optional): The maximum number of items to return. Default: 20, minimum: 1, maximum: 50
   - **Returns**: List recently played tracks' names and additional information
   - **Example**: `getRecentlyPlayedTracks(20)`

8. **getUserQueue**

   - **Description**: Get the list of objects that make up the user's queue
   - **Parameters**: None
   - **Returns**: The items' names and additional information in the queue
   - **Example**: `getUserQueue()`

### Write Operations

1. **startPlayback**

   - **Description**: Start a new playback on the active device
   - **Parameters**: 
     - `device_id` (string, optional): The ID of the device this command is targeting
     - `context_uri` (number, optional): Spotify URI of the context to play. Valid contexts are albums, artists, and playlists
     - `type` (number, optional): The type to play. Valid types are track, album, artist, or playlist
     - `id` (number, optional): The Spotify ID of the item to play
   - **Returns**: Playback started
   - **Example**: `startPlayback()`

2. **resumePlayback**

   - **Description**: Resume playback on the active device
   - **Parameters**: 
     - `device_id` (string, optional): The ID of the device this command is targeting
   - **Returns**: Playback resumed
   - **Example**: `resumePlayback()`

3. **pausePlayback**

   - **Description**: Pause playback on the active device
   - **Parameters**: 
     - `device_id` (string, optional): The ID of the device this command is targeting
   - **Returns**: Playback paused
   - **Example**: `pausePlayback()`

4. **addQueue**

   - **Description**: Add an item to be played next in the playback queue
   - **Parameters**:
     - `uri` (string): The URI of the item to add to the queue. Must be a track or an episode URI
     - `device_id` (string, optional): The ID of the device this command is targeting
   - **Returns**: Added to Queue
   - **Example**: `addQueue("123uri")`
  
5. **togglePlaybackShuffle**

   - **Description**: Toggle shuffle on or off for the user's playback
   - **Parameters**:
     - `state` (boolean): True: Shuffle the user's playback. False: Do not shuffle the user's playback
     - `device_id` (string, optional): The ID of the device this command is targeting
   - **Returns**: Shuffle changed
   - **Example**: `togglePlaybackShuffle(true)`

6. **createPlaylist**

   - **Description**: Create a playlist for a Spotify user
   - **Parameters**:
     - `device_id` (string): The user's Spotify user ID
     - `name` (string): The name for your new playlist
     - `public` (boolean, optional): The playlist's public/private status
     - `description` (string, optional): The playlist's description
   - **Returns**: New playlist created
   - **Example**: `createPlaylist("user123", "new playlist", true, "This is a new playlist")`

7. **addItemsToPlaylist**

   - **Description**: Adds one or more items to a user's playlist
   - **Parameters**:
     - `playlist_id` (string): The Spotify ID of the playlist
     - `uris` (string, optional): A comma-separated list of Spotify URIs to add, can be track or episode URIs
     - `types` (boolean, optional): A comma-separated list of types in the same order as ids
     - `ids` (string, optional): A comma-separated list of ids in the same order as types
   - **Returns**: Items added to playlist
   - **Example**: `createPlaylist("playlist123")`
  
7. **changePlaylistDetails**

   - **Description**: Change a playlist's name and public/private state
   - **Parameters**:
     - `playlist_id` (string): The Spotify ID of the playlist
     - `name` (string, optional): The new name for the playlist
     - `public` (boolean, optional): The playlist's new public/private status
     - `description` (string, optional): Value for playlist description
   - **Returns**: Playlist details changed
   - **Example**: `changePlaylistDetails("playlist123", "new new playlist")`

## Setup

### Prerequisites

- Node.js v16+
- A Spotify Premium account
- A registered Spotify Developer application

### Installation

```bash
git clone https://github.com/iankan04/MCP-Spotify.git
cd mcp-spotify
npm install
npm run build
```

### Creating a Spotify Developer Application

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with your Spotify account
3. Click the "Create an App" button
4. Fill in the app name and description
5. Accept the Terms of Service and click "Create"
6. In your new app's dashboard, you'll see your **Client ID**
7. Click "Show Client Secret" to reveal your **Client Secret**
8. Click "Edit Settings" and add a Redirect URI (e.g., `http://localhost:8000/callback`)
9. Save your changes

### Spotify API Configuration

Create a `.env.local` file in the project root (you can copy and modify the provided example):
```bash
SPOTIFY_CLIENT_ID='Your client_id'
SPOTIFY_CLIENT_SECRET='Your client_secret'
SPOTIFY_REDIRECT_URI='Your redirect_uri (i.e. http://127.0.0.1:8000/callback'
```
Make sure your redirect_uri follows the newest [Spotify Developer Settings](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri).


### Authentication Process

The Spotify API uses OAuth 2.0 for authentication. Follow these steps to authenticate your application:

1. Open two terminal screens. In one, run 

```bash
redis-server
```

In the other, run

```bash
npm run auth
```

2. The script will generate an authorization URL. Open this URL in your web browser.

3. You'll be prompted to log in to Spotify and authorize your application.

4. After authorization, Spotify will redirect you to your specified redirect URI with a code parameter in the URL.

5. The authentication script will automatically exchange this code for access and refresh tokens.

6. These tokens will be saved to the Redis database and automatically refreshed when called

## Integrating with Claude Desktop

To use your MCP server with Claude Desktop, add it to your Claude configuration:

```json
{
  "mcpServers": {
    "spotify": {
      "command": "node",
      "args": ["MCP-Spotify/build/index.js"]
    }
  }
}
```
If Claude is running, restart the application, and you should see "spotify" as a new tool
