import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { listProjects, listDecisions } from "../lib/db/read-repo.ts";
import { keywordRetriever } from "../core/recall/keyword-retriever.ts";

// Knox_Dolphin MCP server — exposes a project's CONFIRMED decisions to Claude as
// tools. It returns only stored records (with source quotes); it never invents.
// This is the mission in action: Claude reads the distilled, trusted memory
// instead of re-reading whole transcripts. Read-only; shares the local SQLite DB.

// Resolve a project. Precedence: explicit arg → KNOX_PROJECT env (so a target
// repo's .mcp.json can pin its project) → the only project if there's just one.
function resolveProjectId(ref?: string): number | null {
  const projects = listProjects();
  const want = ref ?? process.env.KNOX_PROJECT ?? "";
  if (want) {
    const asNum = Number(want);
    if (Number.isInteger(asNum)) {
      const byId = projects.find((p) => p.id === asNum);
      if (byId) return byId.id;
    }
    const byName = projects.find((p) => p.name === want);
    if (byName) return byName.id;
    return null;
  }
  return projects.length === 1 ? projects[0].id : null;
}

function text(obj: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }] };
}

const server = new McpServer({ name: "knox-dolphin", version: "0.1.0" });

server.registerTool(
  "knox_list_projects",
  {
    title: "List Knox_Dolphin projects",
    description: "List all projects whose decision memory is available.",
    inputSchema: {},
  },
  async () => text({ projects: listProjects() })
);

server.registerTool(
  "knox_recall",
  {
    title: "Recall project decisions",
    description:
      "Search a project's CONFIRMED decision memory for a question and return the " +
      "matching records (each with its verbatim source_quote). Answer the user " +
      "ONLY from these records. If `records` is empty, tell the user there is no " +
      "recorded decision — do not guess.",
    inputSchema: {
      project: z.string().optional().describe("Project name or id (defaults to KNOX_PROJECT env or the only project)"),
      question: z.string().describe("What the user wants to know the reasoning for"),
      topK: z.number().int().min(1).max(20).optional(),
    },
  },
  async ({ project, question, topK }) => {
    const pid = resolveProjectId(project);
    if (pid === null) return text({ error: `project not resolved (pass project, or set KNOX_PROJECT): ${project ?? ""}` });
    const records = keywordRetriever.retrieve(pid, question, topK ?? 5);
    return text({
      grounded: records.length > 0,
      note: records.length === 0 ? "no recorded decision — do not answer from outside knowledge" : undefined,
      records,
    });
  }
);

server.registerTool(
  "knox_list_decisions",
  {
    title: "List all confirmed decisions",
    description: "Return every confirmed decision for a project (with source quotes and status).",
    inputSchema: {
      project: z.string().optional().describe("Project name or id (defaults to KNOX_PROJECT env or the only project)"),
    },
  },
  async ({ project }) => {
    const pid = resolveProjectId(project);
    if (pid === null) return text({ error: `project not resolved (pass project, or set KNOX_PROJECT): ${project ?? ""}` });
    return text({ decisions: listDecisions(pid) });
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
