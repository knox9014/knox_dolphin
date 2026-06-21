# Knox_Dolphin Product Requirements Document (PRD)

## Product Name
Knox_Dolphin

## Product Vision
Help developers and AI systems remember why software decisions were made.

## Problem

Developers remember code less than they think.
Over time they forget:

- Why a technology was selected
- Why architecture changed
- Why a bug was fixed in a specific way
- What alternatives were considered

GitHub stores code history.
It does not store decision history.

## Target Users

Primary:
- Student developers
- AI-assisted developers
- Indie hackers
- Side-project builders

Secondary:
- Startup teams
- Small software teams

## MVP Goal

A developer can ask:

"Why did we implement this?"

and receive an answer generated from previously stored project decisions.

## MVP Features

### 1. GitHub Login
Authenticate using GitHub OAuth.

### 2. Repository Connection
Allow users to connect repositories.

### 3. Commit Analysis
Analyze commit diffs.

### 4. Decision Extraction
Generate possible reasoning behind changes.

### 5. User Confirmation
Allow user to edit or confirm the reason.

### 6. Memory Storage
Store decisions in a structured database.

### 7. Search & Recall
Allow AI to answer questions using stored memories.

> 참고 (전략 세션 이후 갱신): 위 1~3번은 변경되었습니다.
> 데이터 원천은 커밋 diff 분석이 아니라 Claude Code 대화 로그이며(D1),
> 로컬 우선 배포라 GitHub 로그인은 레벨 2로 연기됩니다(D6, D8).
> 현재 유효한 설계는 docs/DECISIONS.md와 docs/ARCHITECTURE.md를 기준으로 합니다.

## Out of Scope

- Team collaboration
- Slack integration
- Jira integration
- Notion replacement
- Social networking features

## Success Metrics

- User can retrieve past decisions.
- User can understand project history after months.
- AI responses become more context-aware.

## Future Roadmap

Phase 2:
- Architecture timeline
- Portfolio generation
- Development journal generation

Phase 3:
- Multi-project memory
- Team memory
- Cross-AI memory layer
