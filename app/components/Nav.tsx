import Link from "next/link";
import { ProjectSwitcher } from "./ProjectSwitcher";

const LINKS = [
  { href: "/", label: "홈" },
  { href: "/logs", label: "내 로그" },
  { href: "/review", label: "검토 큐" },
  { href: "/decisions", label: "결정" },
  { href: "/candidates", label: "전체 후보" },
  { href: "/search", label: "검색" },
];

// Shared top navigation. `active` highlights the current page.
export function Nav({ active }: { active: string }) {
  return (
    <div style={{ marginBottom: "1.75rem" }}>
      <nav className="nav" style={{ marginBottom: 12 }}>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={l.href === active ? "active" : ""}>
            {l.label}
          </Link>
        ))}
      </nav>
      <ProjectSwitcher />
    </div>
  );
}
