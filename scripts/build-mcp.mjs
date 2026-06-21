import { build } from "esbuild";

// Bundle the MCP server (+ its lib/core imports + npm deps) into one file so the
// plugin works after install with no `npm install` step. node:sqlite is a Node
// builtin and stays external. Commit the output (dist/mcp-server.mjs).
await build({
  entryPoints: ["mcp/server.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  outfile: "dist/mcp-server.mjs",
  external: ["node:sqlite"],
  banner: {
    js: "// Bundled Knox_Dolphin MCP server. Built from mcp/server.ts — do not edit.\n// Rebuild: npm run build:mcp",
  },
});
console.log("bundled -> dist/mcp-server.mjs");
