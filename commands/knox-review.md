---
name: knox-review
description: Review pending decision candidates and approve/reject them with the user.
---

Walk the user through the project's pending decision candidates.

Steps:
1. Call `knox_list_pending` to get the queue (project auto-detects from the working folder).
2. If empty, say so and stop.
3. For each candidate, show its decision text and `source_quote`, then ask the user whether to approve it.
4. Only after the user explicitly approves one, call `knox_confirm_candidate` with its id. If they decline, call `knox_reject_candidate`.
5. Never approve on your own initiative or in bulk — each decision needs the user's explicit OK.
