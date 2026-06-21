# Knox_Dolphin — 아키텍처 레퍼런스 (로컬 우선)

> Claude Code는 이 문서와 DECISIONS.md를 읽고 작업합니다.
> 형태: **localhost에서 도는 Next.js 로컬 도구.** 로그인 없음. 로컬 SQLite. 사용자 본인 API 키.

---

## 1. 핵심 흐름

**캡처(쓰기):**
로컬 Claude Code 로그(JSONL) → 추출기(후보 생성) → candidates(스테이징) → **확인 게이트(사람 승인 = 유일한 쓰기)** → decisions(성역, 출처 포함)

**회상(읽기):**
질문 → 벡터 검색(top-k) → decisions만 근거로 답변(+출처) → 관련 기록 없으면 "기록 없음"

원문 트랜스크립트는 어디에도 영구 저장하지 않는다. 추출 시 사용자 API 키로 Anthropic API에 잠깐 전송될 뿐.

---

## 2. 폴더 구조

```
knox-dolphin/
├── CLAUDE.md                 # 루트. Claude Code가 자동으로 읽음
├── docs/
│   ├── PROJECT_CONTEXT.md
│   ├── PRD.md
│   ├── DECISIONS.md          # 결정 메모리 (지켜야 할 규칙)
│   └── ARCHITECTURE.md       # 이 문서
├── app/                      # Next.js (localhost UI)
│   ├── review/               # 후보 검토 큐 = 확인 게이트 UI
│   ├── decisions/            # 결정 조회
│   ├── search/               # 자연어 검색 UI
│   └── api/
│       ├── extract/          # 추출 트리거 → candidates에만 기록
│       ├── confirm/          # 후보→결정 승격 (decisions 유일 writer)
│       └── recall/           # 질문 → 근거 기반 답변
├── core/                     # 프레임워크 무관 도메인 로직
│   ├── extractor/            # 로그 → 후보. 트리거 독립. decisions를 import 안 함
│   ├── confirmation/         # decisions의 유일한 writer. 출처 불변식 강제
│   ├── recall/               # 검색 + 답변. 읽기 전용. "없으면 모른다" 규칙
│   └── trust/                # 불변식 함수(출처 검증·인용·무근거 차단). 테스트 필수
├── lib/
│   ├── db/                   # SQLite + 벡터 확장 접근, 스키마
│   ├── claude/               # Anthropic API 클라이언트 (추출·답변)
│   ├── embeddings/           # 임베딩 클라이언트
│   └── claude-code-logs/     # 로컬 .claude JSONL 리더/파서
└── .env                      # API 키 (git 제외!)
```

---

## 3. 데이터 모델 (SQLite)

테이블 3개 (로컬 단일 사용자라 users 불필요).

- **projects**: id, name, created_at
- **candidates** (스테이징, 임베딩 없음):
  id, project_id, decision, reason, alternatives, rejected_because, impact,
  source_quote, session_id, speaker, reviewed, extracted_at
- **decisions** (성역):
  id, project_id, decision, reason, alternatives, rejected_because, impact,
  **source_quote (NOT NULL)**, session_id, source_timestamp, speaker,
  status (confirmed/superseded), superseded_by, embedding, embedding_model, confirmed_at

벡터 검색은 SQLite 벡터 확장(예: sqlite-vec)으로. 임베딩은 **승격 시점에만** 생성.

---

## 4. 신뢰 불변식 (코드/테스트로 강제)

1. `decisions`에 `source_quote` NOT NULL. 모든 회상 답변은 출처 인용.
2. `core/confirmation`만 `decisions`에 쓴다. `core/extractor`는 `decisions`를 import 금지.
3. 추출된 `source_quote`는 원본 로그의 실제 substring인지 코드로 검증 → 아니면 후보 폐기.
4. 회상은 검색 최고 유사도가 임계값 미만이면 모델 호출 없이 "기록 없음" 반환.
5. 명시 안 된 필드는 null. 추측 금지.

---

## 5. v0 프롬프트 (경험적으로 개선할 출발점)

### 추출 프롬프트
```text
You extract TECHNICAL DECISIONS from a conversation between a developer
and an AI coding assistant. Record only what is explicitly stated.
Never infer, guess, or invent reasoning.

RULES
1. Extract only durable technical/architectural decisions. Ignore routine
   work: bug fixes, typos, debugging chatter.
2. A decision counts ONLY if the DEVELOPER adopted it (stated by the
   developer, or proposed by the assistant AND agreed by the developer).
3. If a decision was reversed later, record only the FINAL one (note the
   change in `impact`).
4. For reason/alternatives/rejected_because/impact: use ONLY explicit text.
   If not stated, set null. Never fill with plausible content.
5. `source_quote` MUST be an exact verbatim substring from the conversation.
   Keep its original language.
6. Write fields in the conversation's language.
7. If no real decisions, return an empty list. Never manufacture.

Output STRICT JSON only:
{ "decisions": [ { "decision": str, "reason": str|null,
  "alternatives": str|null, "rejected_because": str|null,
  "impact": str|null, "source_quote": str,
  "speaker": "developer"|"assistant" } ] }
```
> 알려진 결함(v1에서 고칠 것): "추천대로 가자" 식 **참조 채택**은 인용구에 내용이 없음
> → 직전 어시스턴트 메시지에서 제안 내용을 해소해 콘텐츠로 삼고, 개발자 발화는 채택 출처로(2단 출처).
> few-shot 예시(빈 결과/null/참조 채택)를 추가할 것.

### 회상 프롬프트
```text
You answer a developer's question about WHY a past decision was made,
using ONLY the provided decision records (the project's confirmed memory).

RULES
1. Answer strictly from the records. No general knowledge or opinions.
   If they don't contain the answer, say so plainly — that is a correct,
   valuable answer. Never pad with a guess.
2. Cite every claim (which record: quote, date, session).
3. If a relevant decision was superseded, report BOTH the original and
   that it changed, with both records.
4. If records are only loosely related, say the memory doesn't cover it.
5. Output nothing not grounded in a provided record.

RECORDS: {retrieved_records}
QUESTION: {question}
```

---

## 6. 빌드 순서 (레벨 0 = 얇은 수직 슬라이스)

UI/마감은 마지막. 신뢰 코어를 먼저 증명.

1. 스캐폴딩: Next.js + TypeScript + 위 폴더 구조 + SQLite 연결
2. 마이그레이션: projects / candidates / decisions + 벡터 확장
3. 로그 파서: `.claude` JSONL 한 개 읽기
4. 추출기: v0 프롬프트 + 인용구 substring 검증
5. 확인 게이트: candidates → decisions 승격 (출처 NOT NULL 강제)
6. 회상: 벡터 검색 + 근거 답변 + "기록 없음"
7. UI: 검토 큐 / 검색 (마지막)

각 단계는 멈춰서 직접 테스트하고, git 커밋으로 체크포인트.
