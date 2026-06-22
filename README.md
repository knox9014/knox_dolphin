# Knox_Dolphin

**코드의 '왜'를 저장하는 로컬 우선 프로젝트 메모리.** — Claude Code 플러그인 / MCP 서버

> **Claude Code 플러그인으로 1줄 설치 (터미널 CLI):**
> ```
> /plugin marketplace add knox9014/knox_dolphin
> /plugin install knox-dolphin
> ```
> 데스크톱 앱이라 `/plugin`이 없으면 → 아래 [Claude와 연결 (MCP, 수동)](#claude와-연결-mcp-수동) 참고.

---


GitHub은 코드를 저장합니다. Knox_Dolphin은 그 코드가 왜 그렇게 됐는지 — 어떤 결정을, 왜, 무엇과 비교해서 내렸는지 — 를 저장합니다. 데이터 원천은 커밋 diff가 아니라 **개발자와 AI 코딩 어시스턴트의 대화 로그**입니다. 결정의 '왜'는 diff에 없고 대화에 명시돼 있기 때문입니다.

핵심 흐름:

```
내 .claude 로그 → 추출(후보 생성) → 사람이 검토·승인 → 결정(성역, 출처 포함) → 검색으로 회상
```

나중에 AI가 전체 대화를 다시 읽지 않고, 이 **검증된 결정 알맹이**만 읽고 작업을 이어갈 수 있게 하는 것이 목표입니다.

---

## 신뢰 모델 (이 프로젝트의 전부)

저장된 기억이 거짓말하지 않는다는 보장이 이 제품의 생명줄입니다. 6가지 불변식을 코드·DB로 강제합니다:

1. **출처 없으면 결정 없음** — `decisions.source_quote`는 DB에서 `NOT NULL`.
2. **단일 쓰기 경로** — `decisions`에 쓰는 코드는 확인 게이트 하나뿐. 추출기는 `decisions`를 import조차 안 함.
3. **무근거 답변 금지** — 검색 결과가 없으면 모델을 호출하지 않고 "기록 없음"을 반환.
4. **추출 ≠ 추론** — 추출된 인용구가 원본 로그의 실제 substring인지 코드로 검증, 아니면 폐기. 지어내기 구조적 불가능.
5. **원문 비저장** — 대화 트랜스크립트는 영구 저장하지 않음. 추출 시점에만 잠깐 사용.
6. **상태 항상 노출** — 대체된 결정은 삭제하지 않고 `superseded`로 표시, 회상 시 원본과 대체본을 함께 보여줌.

자세한 배경은 [docs/DECISIONS.md](docs/DECISIONS.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) 참고.

---

## 요구 사항

- **Node.js 24+** (내장 `node:sqlite` 사용 — 별도 DB 설치·네이티브 빌드 없음)
- API 키는 **선택** — 키 없이도 전체 기능이 작동합니다(아래 참고).

## 설치 & 실행

```bash
git clone https://github.com/knox9014/knox_dolphin.git
cd knox_dolphin
npm install
npm run db:migrate     # 로컬 SQLite에 테이블 생성 (data/knox.db)
npm run dev            # http://localhost:3000
```

브라우저에서 http://localhost:3000 접속. 홈에 "✓ SQLite 연결 OK"가 보이면 준비 완료.

## 사용법

1. **내 로그** — 로컬 `~/.claude` 대화 로그 목록에서 하나를 골라 **추출**. 개발자 발화 중 결정으로 보이는 것이 후보로 surface됩니다.
2. **검토 큐** — 추출된 후보를 사람이 **승인 / 거부**. 승인한 것만 결정이 됩니다.
3. **결정** — 확정된 기억(성역). 출처와 함께 조회. 뒤집힌 결정은 다른 결정으로 **대체됨** 표시 가능.
4. **전체 후보** — 추출기가 뽑은 모든 후보(대기/검토됨).
5. **검색** — "왜 SQLite를 썼어?" 같은 질문 → 저장된 결정에서만 근거 답변, 없으면 "기록 없음".

데모로 빠르게 보려면 검토 큐의 **"데모 후보 추가"** 버튼을 누르세요(실제 로그 없이 목 데이터로 흐름 체험).

---

## 키 없음 vs 키 있음

| 단계 | 키 없을 때 (기본) | 키 있을 때 |
|---|---|---|
| 추출 | 휴리스틱 — 결정 신호 어휘가 있는 개발자 발화를 surface | LLM이 결정을 정밀 추출(이유·대안 포함) *(예정)* |
| 회상 답변 | 목 — 레코드를 출처와 함께 나열 | LLM이 레코드만 근거로 답변 |

키를 쓰려면 프로젝트 루트에 `.env`를 만들고:

```
ANTHROPIC_API_KEY=sk-ant-...
```

`.env`는 `.gitignore`에 포함돼 **절대 커밋되지 않습니다.** 키는 서버에서만 읽히고 브라우저로 나가지 않습니다. 추출/답변 시점에만 본인 키로 Anthropic API를 호출하며, 그때만 대화 일부가 외부로 전송됩니다(원문 영구 저장은 안 함, D6).

---

## 다른 사람 / 다른 프로젝트에서 쓰기

- **다른 사람:** 그대로 clone해서 위 단계를 따르면 됩니다. 각자 기기의 `~/.claude` 로그를 읽고, 각자의 로컬 `data/knox.db`에 저장합니다(gitignore라 안 섞임). 내 기기, 내 데이터.
- **여러 프로젝트(같은 사람):** 상단 네비의 **프로젝트 드롭다운**에서 골라 전환하거나 **"+ 새 프로젝트"**로 만들면, 결정·후보·검토·검색·추출이 모두 선택한 프로젝트로 분리됩니다. 한 DB 안에서 프로젝트별로 기억이 격리됩니다.

  > 완전히 별도의 DB 파일로 나누고 싶다면 `KNOX_DB_PATH=./data/other.db npm run dev`로 실행할 수도 있습니다(선택).

---

## Claude 플러그인으로 설치 (권장)

Knox_Dolphin은 Claude Code 플러그인으로 설치할 수 있습니다. 설치하면 어느 repo에서든 도구가 바로 잡히고, **작업 중인 폴더 이름으로 프로젝트를 자동 인식**합니다.

```
/plugin marketplace add knox9014/knox_dolphin
/plugin install knox-dolphin
```

- MCP 서버는 **번들된 단일 파일**(`dist/mcp-server.mjs`)이라 별도 `npm install`이 필요 없습니다. **Node 22+** 필요.
- 데이터는 `~/.knox-dolphin/knox.db` 한 곳에 모입니다 — 웹앱과 플러그인이 같은 기억을 공유합니다.
- 슬래시 커맨드: `/knox-recall <질문>`, `/knox-save <결정>`, `/knox-review`.
- 프로젝트를 폴더명과 다르게 쓰려면 도구에 `project`를 명시하거나 환경변수 `KNOX_PROJECT`로 고정.

> 직접 손으로 MCP를 붙이려면(플러그인 없이) 아래 방식도 가능합니다.

## Claude와 연결 (MCP, 수동)

Knox_Dolphin은 **MCP 서버**로 동작해, Claude(Claude Code/Desktop)가 작업 중에 **그 프로젝트의 확정 결정을 직접 검색**할 수 있습니다. Claude는 전체 대화를 다시 읽는 대신, 검증된 결정 알맹이만 읽고 이어 작업합니다.

노출되는 도구:

- `knox_list_projects` — 사용 가능한 프로젝트 목록
- `knox_recall(project?, question)` — 그 프로젝트 결정에서 검색해 **출처 포함 레코드**를 반환 (없으면 "기록 없음" 신호 → Claude가 지어내지 않음)
- `knox_list_decisions(project?)` — 확정 결정 전체
- `knox_propose_decision(project?, decision, source_quote, conversation_excerpt, …)` — 작업 중 내린 결정을 **검토 큐**에 제안 (바로 저장 안 됨, 사람 승인 필요). 인용구가 제공된 대화 조각의 실제 substring이 아니면 거부.
- `knox_list_pending(project?)` — 검토 대기 중인 후보 목록 (사용자에게 보여주고 승인 여부를 물을 때)
- `knox_confirm_candidate(candidateId)` — 후보를 결정으로 승격. **사용자가 대화에서 명시적으로 승인한 뒤에만** 호출. 실제 게이트는 Claude Code의 도구 권한 프롬프트(사람 클릭)
- `knox_reject_candidate(candidateId)` — 후보 거부

**대화에서 승인하기 (웹앱 없이):** Claude가 `knox_list_pending`으로 대기 후보를 보여주고 → 당신에게 "승인할까요?" 물어보고 → 허락하면 `knox_confirm_candidate`를 호출합니다. 이때 Claude Code가 도구 실행 허용을 다시 묻습니다(사람 게이트). 이 흐름이면 웹앱은 **조회용**으로만 쓰면 됩니다. ⚠️ 이 승인 도구는 "항상 허용"으로 두지 마세요 — 결정마다 직접 확인하는 게 신뢰의 핵심입니다.

**각 프로젝트에 연동하기:** 대상 repo(예: 내 앱 코드)의 루트에 `.mcp.json`을 두고, 그 repo가 어느 Knox 프로젝트에 대응하는지 `KNOX_PROJECT`로 고정합니다. 그러면 그 repo에서 Claude는 자동으로 해당 프로젝트의 기억을 씁니다. 샘플: [mcp/example.mcp.json](mcp/example.mcp.json) (절대 경로로 수정해 복사).

```json
{
  "mcpServers": {
    "knox-dolphin": {
      "command": "node",
      "args": ["/절대경로/knox-dolphin/mcp/server.ts"],
      "env": { "KNOX_PROJECT": "내-프로젝트-이름" }
    }
  }
}
```

`project` 인자를 명시하면 그게 우선이고, 생략하면 `KNOX_PROJECT`(또는 프로젝트가 하나뿐이면 그것)를 씁니다. 서버는 읽기 전용이며 웹앱과 같은 로컬 DB를 공유합니다. 로컬에서 직접 띄워보려면 `npm run mcp`.

## 폴더 구조

```
app/        Next.js UI + API 라우트 (localhost)
core/       프레임워크 무관 도메인 로직
  trust/        불변식 함수(출처 검증)
  extractor/    로그 → 후보 (decisions를 import 안 함)
  confirmation/ 후보 → 결정 승격 (decisions의 유일한 writer)
  recall/       검색 + 근거 답변 ("없으면 모른다")
lib/
  db/             SQLite 접근·스키마·마이그레이션
  claude-code-logs/  로컬 .claude JSONL 리더/파서
docs/       DECISIONS.md, ARCHITECTURE.md, PRD.md, PROJECT_CONTEXT.md
```

## 현재 한계 (정직하게)

- 키 없는 추출은 휴리스틱이라 노이즈(false positive)가 섞입니다 — 사람이 검토 큐에서 거릅니다.
- 벡터 검색은 아직 키워드 검색입니다(회상 단계에서 추가 예정, D9).

## 기술 스택

Next.js 16 · TypeScript · `node:sqlite` (로컬 우선, 로그인 없음)
