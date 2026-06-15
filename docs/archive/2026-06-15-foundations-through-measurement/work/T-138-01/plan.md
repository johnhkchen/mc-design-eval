# T-138-01 proportion-milestone — Plan

Eleven steps; 1–6 are spend-free code, 7–9 are the named runs (spend-probed), 10–11 docs +
review. Each step verifies before the next; commits are atomic per step (or per subject in 8).

## Step 1 — `roofIdiomForPitch` (compile.mjs)
Pure helper + tests (gable up-aim →`roof.gable.steep`, steep down-aim → `roof.gable`, ≤1
identity, non-gable identity). **Verify:** `node --test src/recognition/compile.test.mjs`.
Commit: `feat(E-33 T-138-01): the steep door is nameable — roofIdiomForPitch`.

## Step 2 — geometry lever reaches the steep door (geometry.mjs)
Re-aim before recompile in `applyGeometryAdjust`. Tests: pitch 2 + steep-declaring pack →
recompiled through the steep door (idiom renamed, ridge rises); pitch 0.5 → base; pitch 2 +
classes `[1]` pack → the existing refusal recorded (apply-failed), asserted. **Verify:** unit
glob + `levers` tests untouched (`npm run test:unit`). Commit.

## Step 3 — measured seam re-aims (measured-program.mjs)
Re-aim after `snapPitch`; note text carries it; no conflict row. Tests per structure §3.
**Verify:** unit glob green AND `npm run measured:repro` byte-identical (both committed records
measure ≤1 — the re-aim must be a no-op on them). Commit.

## Step 4 — workshop.mjs gains hands
Conditional source/sketch load; loop + parse + applier wiring; replay/offline pass `pack`.
**Verify:** `npm run workshop:replay` and `workshop:offline` (fixture, committed ledger) green;
ALL committed workshop replays green (`workshop.mjs --subject {cottage,barn} --replay/--offline`,
`--subject barn --pack packs/saltcrag.json --replay`); `node --test
src/workshop/isolation.test.mjs` green (no judge seams added); full unit glob. Commit.

## Step 5 — pattern-book stage 3: measured + armed seed; repro mirrors
Per structure §5 (refusal verdict UNARMED, then merge declarations, re-serialize; record gains
`measured` + `proportionsDeclared` + seed ratios; `derivePlan`/`runRepro` thread `pack`;
repro mirrors the new derivation). **Verify:** `node --test` full glob green. KNOWN-RED window:
`patternbook:repro`/`:offline` now diverge on the seed byte-compare for the three OLD committed
chains (the re-derivation is measured+armed, the committed seeds are not) — this is the
documented mid-flight state; steps 5→8 land in one session so HEAD never rests red across
subjects longer than the run order. The ledger-replay and final-conformance legs must still be
green at this step (only the seed-compare leg goes red). Commit with the red window named in
the message.

## Step 6 — npm scripts + suite
`measured:barn:saltcrag`, `milestone:proportion{,,:baselines,:repro}` scripts. **Verify:**
`npm test` (the full pretest + self-test + unit glob) — everything green except the named
patternbook seed-compare window (not part of `npm test`). Commit.

## Step 7 — baselines capture + saltcrag measured record (model-free)
1. `npm run milestone:proportion:baselines` — quotes the three pre-rotation gate aggregates +
   chain final ratios + shas into `pattern-book/proportion-baselines.json`. **Verify:** the
   quoted numbers equal the committed records (barn 8 gaps/budget 2 decided; saltcrag barn 8;
   cottage coverage-refused undecided); re-run refuses without `--rotate-pins`.
2. `npm run measured:barn:saltcrag` then `node benchmarks/sculpture/measured-proportions.mjs
   --all --repro --pack packs/saltcrag.json`. **Verify:** record written, repro byte-identical,
   conformance PASS, ratios recorded (expect pitch snap 1.0 — sketch-flattened; the steep
   residual recorded). Commit both.

## Step 8 — the three named runs (serial; spend-probed; per-subject commits)
Order: **barn (rustic) → barn--saltcrag → cottage** (cheapest failure surface first; cottage
last has the most expected rounds). Before each chain and each gate: minimal `claude -p` probe
(`spend-limit-reply-failure-mode` memory — a zero-token notice burns re-ask budget).
Per subject:
1. `node benchmarks/sculpture/pattern-book.mjs --subject <key> [--pack packs/saltcrag.json]
   --ticket T-138-01 --rotate-pins` — the chain live: measured+armed seed → workshop loop WITH
   hands (≤6 strong-tier critique exchanges + bounded re-asks + optional re-recognize
   fragments) → rotated chain records.
   **Verify:** chain record status not `pipeline-failed`; ledger shows the proportion check
   armed every round; `--repro` and `--offline` exit 0 (the seed-compare leg returns to green
   for this subject).
2. `npm run gate:patternbook:<key>[:saltcrag] -- --rotate-pins` — the epic's judge runs: fresh
   GL renders, coverage precondition (visibility-aware, both arithmetics), judge once per
   surviving view through T-114 bounds.
   **Verify:** record `decided: true` (a coverage refusal on the cottage here would mean the
   T-137 unblock failed on the NEW build — investigate, do not weaken); `--offline` exit 0;
   sheet present in `pr/assets/frames/`.
3. Commit: `feat(E-33 T-138-01): <key> through the proportion loop — chain+gate pins rotated
   (retired: <old shas>)`.
Contingencies: workshop `exchange-refused` (spend) → commit the honest partial, pause, re-probe;
judge `unparsed` views → `npm run gate:rejudge -- --subject <key> --label patternbook[…]`
(completes only unparsed views, T-114); GL/render failure → loud pipeline failure, rerun.

## Step 9 — the milestone composition
`npm run milestone:proportion` → `pattern-book/proportion-milestone.json` +
`pr/assets/proportion-milestone.md`; then `node benchmarks/sculpture/pattern-book-compare.mjs
--rotate-pins` (head-to-head + pattern-book-milestone.md re-composed on the new verdicts).
**Verify:** `milestone:proportion:repro` byte-identical; the md shows per subject: concept
beside sheet, before/after/target ratio rows, both gap-budget arithmetics, lever-use ledger
citations, retired pins named; witness degradation check — `npm run proportion:repro` and
`npm run visibility:repro` exit 0 with the named pin-mismatch SKIPs (assert the skip lines
appear; if they FAIL instead of skip, stop and record). Commit.

## Step 10 — docs
`docs/knowledge/design-learnings.md` § "E-33 — the proportion loop": measured vs estimated
quantity (T-133 numbers); the steep unlock and whether anything used it (ledger evidence — the
honest finding either way); eyes-to-hands (did the model aim the levers when the check named
the delta); the fourth identity-class census fix (T-137, cottage 0/4→4/4); over/under-reach
honestly (TRELLIS flattening → no measured demand >45°; tolerance 0.15 uncalibrated; the ≤2
budget question FLAGGED to the reviewer with both arithmetics quoted). E-12 handoff = the
pr/assets page (link it). **Verify:** `npm test` green. Commit.

## Step 11 — review.md
Changes, test coverage, open concerns (the budget flag, witness skips, sibling T-136
interaction, any spend interruptions), AC ledger.

## Testing strategy summary
- Unit: steps 1–3 (pure seams — the only new pure logic).
- Replay/offline sweeps as integration: fixture + all committed workshop/chain/measured records
  at every step boundary; the three new chains' `--repro`/`--offline` after step 8.
- The milestone runner: `--repro` self-verification (runner precedent — witnesses/measured).
- Live evidence: 3 chain records + 3 gate records + baselines + milestone record.

## Verification gates that stop the line
- Any committed-record byte-compare that should be green going red OUTSIDE the named step-5
  window.
- Isolation test failing (a judge seam leaked into workshop files).
- The cottage's NEW build refused at coverage (T-137's unblock must hold on the new geometry).
- `guardedWriteRecord` refusing a write that was preflighted (pin-guard disagreement = stop).

## AC traceability
- Three re-runs, measured seeds, steep where afforded, armed check, levers live, budgets
  declared (PATTERN_BOOK_BUDGET on the seed), ledgers committed, replay byte-identical → step 8.
- Epic's only judge runs, per-view, fresh renders, T-114, pins rotated + retired named,
  isolation receipts → steps 7–9 (+ review citation).
- Per-subject ratios before/after, conformance, verdict-vs-baseline, both arithmetics, ≤2
  flagged not decided → steps 7+9.
- Glance sheets beside concepts + lever-use ledger citation → step 9.
- design-learnings + E-12 + `npm test` green → step 10.
