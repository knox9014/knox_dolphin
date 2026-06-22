import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { basename } from "node:path";
import { listProjects, listDecisions, listPendingCandidates, createProject } from "../lib/db/read-repo.ts";
import { keywordRetriever } from "../core/recall/keyword-retriever.ts";
import { isVerbatimQuote } from "../core/trust/source-quote.ts";
import { saveCandidates } from "../lib/db/candidates-repo.ts";
import { confirmCandidate, rejectCandidate } from "../core/confirmation/confirm.ts";

// Knox_Dolphin MCP server — exposes a project's CONFIRMED decisions to Claude as
// tools. It returns only stored records (with source quotes); it never invents.
// This is the mission in action: Claude reads the distilled, trusted memory
// instead of re-reading whole transcripts. Read-only; shares the local SQLite DB.

// The working folder name — used to auto-detect the project when nothing is pinned.
function cwdProjectName(): string {
  return basename(process.cwd());
}

// Resolve a project. Precedence: explicit arg → KNOX_PROJECT env → the current
// working folder's name (zero-config: the repo Claude is in) → the only project.
function resolveProjectId(ref?: string): number | null {
  const projects = listProjects();
  const want = ref ?? process.env.KNOX_PROJECT ?? cwdProjectName();
  if (want) {
    const asNum = Number(want);
    if (Number.isInteger(asNum)) {
      const byId = projects.find((p) => p.id === asNum);
      if (byId) return byId.id;
    }
    const byName = projects.find((p) => p.name === want);
    if (byName) return byName.id;
  }
  return projects.length === 1 ? projects[0].id : null;
}

// Explicitly create a project by name (used only when the user confirms it).
function createNamedProject(name: string): number {
  return createProject(name);
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

server.registerTool(
  "knox_propose_decision",
  {
    title: "Propose a decision (to the review queue)",
    description:
      "Capture a decision made during this conversation. It does NOT become a stored " +
      "decision — it goes to the human review queue (candidates) for approval. ALWAYS " +
      "pass an explicit `project`; if it doesn't exist the call is refused and returns " +
      "the available projects (ask the user which one, or pass create_project:true only " +
      "after they confirm a new project). You MUST supply `source_quote` (exact words " +
      "from the conversation) and `conversation_excerpt` (the surrounding text). The " +
      "server verifies the quote is a verbatim substring of the excerpt and rejects it " +
      "otherwise. Do not invent reasoning: leave reason/alternatives/etc. null if not " +
      "explicitly stated.",
    inputSchema: {
      project: z.string().describe("Project name or id — required; the decision is scoped to it"),
      decision: z.string().describe("Short statement of the decision"),
      source_quote: z.string().describe("Exact verbatim words from the conversation"),
      conversation_excerpt: z.string().describe("The surrounding conversation text the quote came from"),
      reason: z.string().nullable().optional(),
      alternatives: z.string().nullable().optional(),
      rejected_because: z.string().nullable().optional(),
      impact: z.string().nullable().optional(),
      speaker: z.enum(["developer", "assistant"]).optional(),
      create_project: z.boolean().optional().describe("Set true ONLY after the user confirms creating this project"),
    },
  },
  async ({ project, decision, source_quote, conversation_excerpt, reason, alternatives, rejected_because, impact, speaker, create_project }) => {
    if (!decision?.trim()) return text({ error: "decision is required" });
    if (!project?.trim()) {
      return text({ error: "project is required", available: listProjects().map((p) => p.name) });
    }
    // Never silently auto-create a project — the user must confirm via create_project.
    let pid = resolveProjectId(project);
    if (pid === null) {
      if (!create_project) {
        return text({
          error: `project "${project}" not found — confirm with the user, then retry with create_project:true to create it`,
          available: listProjects().map((p) => p.name),
        });
      }
      pid = createNamedProject(project);
    }
    // Trust guard: the quote must actually appear in the evidence Claude provided.
    if (!isVerbatimQuote(source_quote, conversation_excerpt)) {
      return text({ rejected: true, reason: "source_quote is not a verbatim substring of conversation_excerpt" });
    }
    const saved = saveCandidates(pid, null, [
      {
        decision: decision.trim(),
        reason: reason ?? null,
        alternatives: alternatives ?? null,
        rejected_because: rejected_because ?? null,
        impact: impact ?? null,
        source_quote: source_quote.trim(),
        speaker: speaker ?? "developer",
      },
    ]);
    return text({ ok: true, queued: saved, note: "added to the review queue; a human must approve it before it becomes a stored decision" });
  }
);

server.registerTool(
  "knox_list_pending",
  {
    title: "List candidates awaiting review",
    description:
      "List the candidates in the review queue (not yet approved) for a project. " +
      "Use this to show the user what is waiting, then ask whether to approve each one.",
    inputSchema: {
      project: z.string().optional().describe("Project name or id (defaults to KNOX_PROJECT env)"),
    },
  },
  async ({ project }) => {
    const pid = resolveProjectId(project);
    if (pid === null) return text({ error: `project not resolved (pass project, or set KNOX_PROJECT): ${project ?? ""}` });
    return text({ pending: listPendingCandidates(pid) });
  }
);

server.registerTool(
  "knox_confirm_candidate",
  {
    title: "Approve a candidate into the decision memory",
    description:
      "Promote a reviewed candidate into the project's stored decisions. This is a " +
      "WRITE to the trusted memory. PROTOCOL: only call this AFTER you have shown the " +
      "candidate's full content to the human and they have EXPLICITLY approved it in " +
      "this conversation. Never approve on your own initiative, in bulk, or by " +
      "inferring consent. The human's approval is the gate — do not bypass it.",
    inputSchema: {
      candidateId: z.number().int().describe("The candidate id to approve (from knox_list_pending)"),
    },
  },
  async ({ candidateId }) => {
    try {
      const { decisionId } = confirmCandidate(candidateId);
      return text({ ok: true, decisionId, note: "promoted to stored decisions" });
    } catch (e) {
      return text({ error: (e as Error).message });
    }
  }
);

server.registerTool(
  "knox_reject_candidate",
  {
    title: "Reject a candidate",
    description: "Mark a candidate as reviewed without storing it. Call after the human declines it.",
    inputSchema: {
      candidateId: z.number().int().describe("The candidate id to reject"),
    },
  },
  async ({ candidateId }) => {
    try {
      rejectCandidate(candidateId);
      return text({ ok: true, note: "rejected; nothing written to decisions" });
    } catch (e) {
      return text({ error: (e as Error).message });
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
