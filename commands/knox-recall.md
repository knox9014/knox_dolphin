---
name: knox-recall
description: Recall why a past decision was made, from this project's stored decision memory.
---

Use the `knox_recall` tool to answer the user's question **only from the project's stored decisions**.

Question: $ARGUMENTS

Steps:
1. Call `knox_recall` with the question (omit `project` — it auto-detects from the working folder).
2. Answer strictly from the returned `records`, citing each `source_quote`.
3. If `grounded` is false (no records), say plainly that there is no recorded decision for this — do not guess or use outside knowledge.
4. If a record is `superseded`, report both it and its replacement.
