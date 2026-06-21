# Knox_Dolphin

## Project Overview

Knox_Dolphin is an AI-powered project memory system for software developers.

GitHub stores code.
Knox_Dolphin stores the reasoning behind the code.

The goal is to preserve technical decisions, architectural reasoning, implementation intent, and project context so that both developers and AI systems can understand why a project evolved in a certain way.

---

# Problem Statement

Modern software development increasingly relies on AI tools such as:

- Claude
- ChatGPT
- Codex
- Cursor

As projects grow, developers often forget:

- Why a technology was chosen
- Why architecture changed
- Why a bug was fixed a certain way
- What alternatives were considered
- What discussions led to a decision

GitHub preserves code history but not decision history.

AI can inspect current code but cannot reliably recover the original reasoning behind past decisions.

---

# Vision

Create a persistent memory layer for software projects.

Knox_Dolphin should become a system that remembers:

- What changed
- Why it changed
- Who made the decision
- What alternatives were considered
- What future impact the decision may have

The memory should be accessible by both humans and AI.

---

# Core Principle

A code repository is not enough.

A project also needs:

- Decision history
- Architectural history
- Development history
- Context history

Knox_Dolphin exists to preserve those layers.

---

# Key Idea

Instead of only storing code changes:

GitHub:
- Code

Knox_Dolphin:
- Decisions
- Intentions
- Tradeoffs
- Discussions
- Architecture reasoning

---

# Example

Git Commit:

```bash
feat: migrate authentication to JWT
```

GitHub remembers:
- Files changed
- Lines changed

Knox_Dolphin remembers:

Decision: Use JWT Authentication

Reason: Future mobile application support

Alternatives: Session Authentication

Rejected Because: State management overhead

Impact: Refresh Token required

---

# Target Users

Primary:
- AI-assisted developers
- Student developers
- Indie hackers
- Side project builders

Secondary:
- Startup teams
- Small software teams

---

# MVP Scope

1. GitHub Authentication
2. Repository Connection
3. Commit Diff Analysis
4. AI Decision Extraction
5. User Confirmation
6. Memory Storage
7. Decision Search

Do NOT add:
- Team collaboration
- Social features
- Chat system
- Project management features
- Notion replacement features

> 참고: 이 MVP Scope는 초기 버전이며, 이후 전략 세션에서 갱신되었습니다.
> 실제 데이터 원천은 커밋 diff가 아니라 Claude Code 대화 로그입니다(docs/DECISIONS.md D1).
> 배포는 로컬 우선이며 GitHub 인증은 레벨 2로 연기되었습니다(D6, D8).

---

# Success Criteria

After several months of development, a user should be able to ask:

'Why did we implement this?'

and receive an accurate answer within seconds.

---

# AI Responsibilities

When working on Knox_Dolphin:

You are not only a coding assistant.

You are also:
- Project Historian
- Knowledge Architect
- Memory System Designer

Always prioritize:

1. Memory quality
2. Decision traceability
3. Simplicity
4. Developer experience
5. MVP-first thinking

Avoid feature creep.

Always ask:

'Does this improve project memory?'
