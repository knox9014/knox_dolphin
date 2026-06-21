---
name: knox-save
description: Propose a decision from this conversation into Knox_Dolphin's review queue.
---

Capture a technical decision made in this conversation into the project's review queue using `knox_propose_decision`.

What to save: $ARGUMENTS

Rules (trust matters here):
1. The `source_quote` MUST be exact words actually said in this conversation, and you MUST pass the surrounding `conversation_excerpt` they came from. The server rejects a quote that isn't a verbatim substring.
2. Do NOT invent reasoning. Leave reason / alternatives / rejected_because / impact null unless explicitly stated.
3. It goes to the **review queue**, not stored memory. Tell the user it needs approval.
4. To approve later: show pending items with `knox_list_pending`, and only call `knox_confirm_candidate` after the user explicitly approves.
