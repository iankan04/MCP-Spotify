import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { read } from './read.js';
import { write } from './write.js';
// Create server instance
const server = new McpServer({
    name: "spotify",
    version: "1.0.0",
});
[...read, ...write].forEach((tool) => {
    server.tool(tool.name, tool.description, tool.schema, tool.handler);
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // console.error("Spotify MCP Server running on stdio")
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
