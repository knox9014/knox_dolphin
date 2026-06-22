# Changelog

## v1.0.1 — 2026-06-22

- 라이선스 변경: MIT → **PolyForm Noncommercial 1.0.0**. 비상업적 용도(개인·취미·연구·교육·비영리)는 무료, 상업적 이용은 별도 허가 필요.

## v1.0.0 — 2026-06-22

첫 정식 릴리스. 설치형 Claude Code 플러그인 + 로컬 MCP 메모리 시스템.

- **신뢰 코어:** 출처 필수 / 사람 승인 단일 쓰기 / 무근거 답변 금지 / 추출≠추론 / 원문 비저장 / 상태 노출 — 코드·DB로 강제
- **캡처→회상:** `.claude` 로그에서 결정 추출 → 검토 큐 → 사람 승인 → 결정(성역) → 회상
- **Claude 연동(MCP):** `knox_recall` / `knox_propose_decision` / `knox_list_pending` / `knox_confirm_candidate` 등 — 대화에서 결정을 읽고, 제안하고, 승인
- **플러그인 패키징:** `/plugin marketplace add knox9014/knox_dolphin` → `/plugin install knox-dolphin`. 번들 단일 파일이라 `npm install` 불필요
- **로컬 우선:** 데이터는 `~/.knox-dolphin/knox.db` 한 곳. 웹앱(`npm run dev`)과 플러그인이 공유
- **키 선택:** 키 없이 동작(휴리스틱 추출 + 키워드 회상, 한국어 조사 인식). 키를 넣으면 LLM 추출·종합 답변
- **명시적 프로젝트:** knox 도구는 프로젝트를 명시해야 하며, 없는 프로젝트를 멋대로 만들지 않음

자세한 버전별 개발 과정은 Notion 개발로그 참고.
