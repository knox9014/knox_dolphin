# Knox_Dolphin

**코드의 '왜'를 저장하는 로컬 우선 프로젝트 메모리.**

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
- **여러 프로젝트(같은 사람):** 현재는 단일 메모리 풀입니다. 프로젝트별로 완전히 분리하려면 다른 DB 파일을 쓰면 됩니다:

  ```bash
  KNOX_DB_PATH=./data/projectB.db npm run db:migrate
  KNOX_DB_PATH=./data/projectB.db npm run dev
  ```

  > UI 안에서 프로젝트를 골라 전환하는 기능은 로드맵입니다(스키마의 `projects` 테이블은 이미 준비됨).

---

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
- UI 안 멀티 프로젝트 전환은 미구현(위 우회법 참고).

## 기술 스택

Next.js 16 · TypeScript · `node:sqlite` (로컬 우선, 로그인 없음)
