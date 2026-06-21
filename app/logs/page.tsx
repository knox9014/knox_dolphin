import { Nav } from "../components/Nav";
import { getActiveProjectId } from "@/lib/active-project";
import { listProjects } from "@/lib/db/read-repo";
import { listLogFiles } from "@/lib/claude-code-logs/list";
import { summarizeLog } from "@/lib/claude-code-logs/summary";
import { LogsView, type LogInfo } from "./view";

export const dynamic = "force-dynamic";

// Server component: resolves the active project and reads log summaries here, so
// switching projects (which triggers router.refresh) re-scopes the list. The
// interactive bits (filter, extract) live in the client child.
export default async function LogsPage() {
  const projectId = await getActiveProjectId();
  const activeName = listProjects().find((p) => p.id === projectId)?.name ?? null;

  const logs: LogInfo[] = listLogFiles()
    .slice(0, 100)
    .map((l) => {
      const s = summarizeLog(l.path);
      return {
        path: l.path,
        file: l.file,
        sizeKB: Math.round(l.sizeBytes / 1024),
        modified: l.modified,
        title: s.title,
        cwdName: s.cwdName,
        cwd: s.cwd,
        developerMsgs: s.developerMsgs,
        assistantMsgs: s.assistantMsgs,
        preview: s.firstUserPreview,
      };
    });

  return (
    <main>
      <Nav active="/logs" />
      <h1>내 Claude Code 로그</h1>
      <p className="lead">
        로컬 <code>.claude</code> 대화 기록입니다. 하나를 골라 <b>추출</b>하면 결정으로 보이는 발화가 후보로 검토 큐에 올라갑니다.
        원문은 저장하지 않습니다.
      </p>
      <LogsView logs={logs} activeName={activeName} />
    </main>
  );
}
