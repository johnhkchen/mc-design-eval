# T-018-01 · Progress

Synthesis ticket (terminal link of the E-09 stage-1 chain). All plan steps executed; no deviations.

## Steps

- [x] **Step 1 — Confirm locked artifacts.** `git status` clean for both files.
  `conceptart.baml` @ **33de8c8** (T-017-01 hardening); `conceptart.mjs` @ **565f32f** with line 76
  `arg("variant", "C")`. Read `conceptart.baml` and confirmed all three T-017 clauses present
  (HARD-LIMITS-override-doc / named text offenders + frieze / pure-black bg + bright edges). No
  corrective edit needed — synthesis stays pure.
- [x] **Step 2 — Baseline test gate.** `npm test` → 133/133 pass, before any edit.
- [x] **Step 3 — Re-generation decision.** Chose **no re-generation** (design Decision 1). The
  T-017-01 final audit (all-5 PASS under the identical locked prompt) is the freshest evidence and is
  already journaled; a fresh single draw adds non-determinism risk without confidence gain. No Nano
  Banana call made; `concepts/` untouched.
- [x] **Step 4 — Append consolidation section.** Appended `## Stage-1 concept-art · CONSOLIDATION +
  stage-2 handoff (E-09, T-018-01 …)` to `docs/knowledge/design-learnings.md` (now at line 1051;
  file 1049 → 1144 lines). Append-only; no existing line edited. Section carries: stage-1-DONE lead,
  locked-artifacts confirmation, best-variant-C + structural why, four voxel-ready criteria,
  load-bearing prompt rules (each tagged with the leak it closes + the white-near-bg wording trap),
  residual caveats, and the one-paragraph stage-2 handoff.
- [x] **Step 5 — Re-confirm test gate.** `npm test` → 133/133 pass after the edit (markdown-only).
- [x] **Step 6 — progress.md** (this file).
- [x] **Step 7 — review.md** (next).

## Acceptance criteria — mapping

- [x] **`conceptart.baml` confirmed as locked stage-1 prompt; default in `conceptart.mjs` matches
  S-016.** Step 1 — both committed and clean; default = C.
- [x] **`design-learnings.md` gains a stage-1 concept-art section** (best variant + rationale,
  voxel-ready criteria, load-bearing rules, residual caveat). Step 4.
- [x] **One-paragraph stage-2 handoff recorded** (isolated, cleanly-segmentable, resolution-
  disciplined, colorful, faithful → TRELLIS-consumable). Step 4 (Handoff to stage 2 paragraph).
- [x] **`npm test` green.** Steps 2 + 5 — 133/133.

## Deviations

None. The ticket resolved exactly as designed: confirm-only synthesis, zero source/client/image
changes, one markdown append.

## Files touched

- Modified: `docs/knowledge/design-learnings.md` (append one section).
- Created: `docs/active/work/T-018-01/{research,design,structure,plan,progress,review}.md`.
- Unchanged (verified): `baml_src/conceptart.baml`, `benchmarks/temple-facade/conceptart.mjs`,
  `baml-concept.mts`, `src/nano-banana.mjs`, `baml_client/**`, schema/rubric/brief, ticket frontmatter.
