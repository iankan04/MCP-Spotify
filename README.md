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

- _"What songs does bruno mars have?"_

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

### Starting the application

Run redis-server and the index.js server to start application
```bash
node build/index.js
```

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
