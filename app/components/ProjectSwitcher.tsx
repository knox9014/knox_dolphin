"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Project {
  id: number;
  name: string;
}

// Project picker shown in the nav. Switching sets a cookie server-side and
// refreshes so every page re-scopes to the selected project.
export function ProjectSwitcher() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  function load() {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        setProjects(d.projects ?? []);
        setActiveId(d.activeId ?? null);
      });
  }
  useEffect(load, []);

  async function switchTo(id: number) {
    await fetch("/api/projects/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setActiveId(id);
    router.refresh();
  }

  async function create() {
    if (!name.trim()) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setName("");
    setCreating(false);
    load();
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span className="faint">프로젝트</span>
      {creating ? (
        <>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="새 프로젝트 이름"
            style={{ padding: "4px 8px", fontSize: 13 }}
          />
          <button onClick={create} className="btn btn-blue" style={{ padding: "4px 10px" }}>생성</button>
          <button onClick={() => setCreating(false)} className="btn-link">취소</button>
        </>
      ) : (
        <>
          <select
            value={activeId ?? ""}
            onChange={(e) => switchTo(Number(e.target.value))}
            style={{ padding: "4px 8px", fontSize: 13 }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button onClick={() => setCreating(true)} className="btn-link">+ 새 프로젝트</button>
        </>
      )}
    </div>
  );
}
