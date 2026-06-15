# T-126-01 workshop-loop — Implement progress

Baseline (pre-step-1): `npm test` green, 1704 tests.

- [x] Step 1 — pin-guard domain refusal + tests (commit d8bcc18)
- [x] Step 2 — src/workshop/program.mjs + tests
- [x] Step 3 — src/workshop/actions.mjs + tests
- [x] Step 4 — src/workshop/critique.mjs + tests
- [x] Step 5 — src/workshop/loop.mjs + tests
- [x] Step 6 — src/workshop/replay.mjs + tests (045db75)
- [x] Step 7 — runner + fixture program + isolation pin + scripts (incl. model-tier
      OP_ROUTING row, npm scripts, gitignore; fixture verified: 4/6 checks pass, pink band
      trips courses-even ×28 + palette-in-pack, ridgeY fix lateral-safe)
- [x] Step 8 — proof run + replay + offline + evidence: 6/6 rounds (budget-exhausted),
      conformance 4✓/29f → 6✓/0f (round 1, seeded pink band removed via courses rewrite),
      seeded squat roof fixed round 2 (ridgeY 7→9, lateral); 3 regressions rolled back by the
      cage; re-recognize recorded action-unavailable; replay BYTE-IDENTICAL; --offline clean;
      before/after frames committed.
- [x] Step 9 — review.md

Deviations from plan:
- The exchange seam receives the CURRENT program (loop.mjs change) so the runner's reply
  parser grounds actions against the live program — plan had the parser closed over the seed.
- The per-round prompt embeds the round's conformance report (design D3 note) — grounding the
  model's action choice in the gate it must not regress.
- The fixture roof is HIP, not gable: a gable needs shell gable-end triangles that would have
  to move in lockstep with a roof ridgeY adjust (two elements per fix = a rollback trap);
  hip closes against flat wall tops at any ridgeY.

Concurrent session note: T-125-01 (sibling Lisa thread) is mid-flight in this working tree
(src/recognition/*, commit a5c8033); its committed test "openings must fit the wall" currently
fails — NOT this ticket's scope, all 77 workshop-scope tests green. Commits here use explicit
file lists only.
