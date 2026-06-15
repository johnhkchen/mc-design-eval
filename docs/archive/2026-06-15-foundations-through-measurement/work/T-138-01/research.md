# T-138-01 proportion-milestone — Research

E-33 terminal (S-138). Three re-runs through the full proportion loop (cottage, barn, saltcrag
barn), the epic's only judge runs, before/after ratios, the glance sheets, design-learnings +
E-12. This maps what exists; no solutions proposed here.

## Upstream state (all verified on disk, 2026-06-11 ~10:30pm)

| ticket | landed | what T-138 inherits |
|---|---|---|
| T-133 | ✓ review.md | `src/recognition/measured-program.mjs` — `applyMeasuredProportions({program, sketch, pack})` (pure; per-parameter sources, conflicts sketch-wins), `silhouetteRatios`, `sketchTargetRatios`, `snapPitch`. Records `measured/{cottage,barn}.{program,artifact,record,md}` (rustic only — **no saltcrag measured record yet**). Handoff #5: "wiring applyMeasuredProportions into stage 3 (and rotating the chain's seed/ledger/final pins) belongs to S-136/S-138." |
| T-134 | ✓ review.md | `roof.gable.steep` brush through the door; compile lowers steep (family fallback through the pack's `roof.gable` row when the steep idiom isn't declared by name); **`roof.gable` refuses pitchClass >1 by name** (single-door). Saltcrag declares `pitchClasses [2,1,0.5]`; rustic `[1]` — rustic steepening is a NAMED REFUSAL (also: rustic's roof family carries no stair blocks). `steep-pitch/` records: saltcrag barn before/after; rustic barn refusal. |
| T-135 | ✓ review.md | `deriveProportionDeclarations({sketch})` (src/form/silhouette-proportion.mjs); `runConformance` appends `proportion-vs-concept` when the seed declares `declarations.proportions`; the loop's no-regress reads it; tolerance 0.15 (declared default, uncalibrated — barn sits at Δrel 0.164, just outside). Witness: committed T-127 cottage fails ridgeToEave 4.5 vs 1.4145 every round. Caveat #1: on jettied buildings the silhouette eave (widest layer = jetty course) ≠ program eave — read both rows. Concepts are unsegmentable → all live targets are sketch-sourced (concept-mask path unproven). |
| T-136 | code ✓ (Steps 1–7 committed); **Step 8 + review.md pending in a SIBLING session** | `src/workshop/geometry.mjs` (applyGeometryAdjust through recompile), actions.mjs geometry/recognize appliers, rerecognize.mjs + ReRecognizeMass BAML fn, loop threads `source`, replay/offlineAssert handle geometry rounds, critique gains the source block (masses, levers, ratios vs targets). Runner `geometry-levers.mjs` = the loop-with-hands composition (in-process `runWorkshopLoop` with injected re-recognize applier; seeds from the COMMITTED T-127 seed + armed declarations; records at `levers/`). |
| T-137 | ✓ review.md (7 commits) | `visibilityAwareCoverage` in the gate runner: T-088 short-circuit uses the aware arithmetic, legacy recorded beside it, `not-on-skin` bands excluded-and-named. The cottage's judge call is unblocked at the precondition. Handoff #3: "T-138 should rotate pins explicitly (`--rotate-pins`) when re-running gates." |

## The two loop runners (the seam this ticket closes)

- **`pattern-book.mjs`** (the chain of record, T-127/T-132): sketch shas → committed recognition
  program (consumed, never re-sampled) → `seedWorkshopProgram` (NOT measured; no proportion
  declarations) → **spawns `workshop.mjs` CLI** (`--subject --pack [--rotate-pins]`) → chain
  record. Modes live/`--repro`/`--offline`. Judge explicitly NOT here (isolation-scanned);
  S-127 convenes it from outside via `gate:patternbook:*`.
- **`workshop.mjs`** (the spawned loop): loads the committed seed (`chainRels.seed`), runs
  `runWorkshopLoop` with critique only — **no `source`, no geometry/re-recognize appliers, no
  proportion arming**. Eyes, no hands.
- **`geometry-levers.mjs`** (T-136's proof runner): in-process loop WITH hands —
  `runWorkshopLoop({program, pack, source, seams:{exchange, render}, appliers:{...DEFAULT_APPLIERS,
  "re-recognize": reRecognize}, meta:{…refs, tier, instrument}})`; seed = committed T-127 seed +
  `declarations.proportions` from `deriveProportionDeclarations({sketch})`; per-round ratio table
  via T-135 prefix replay (`replayLedger({ledger, pack, throughRound})` → `silhouetteRatios`);
  records at `levers/` (pin domain "workshop"). Renders via `renderViews` at
  `MULTI_ANGLE_GATE.azimuths`, 512×512; critique via `bamlRender(CritiqueWorkshopRound)` →
  `runTieredOp({tier:"strong"})` → `runReplyPolicy` (T-114 bounds).

So today: the chain of record has eyes-only; the hands live beside it. Nothing seeds the chain
from a measured program.

## The judge / gate machinery

- `multi-angle-gate.mjs` (782 lines, frozen instrument): CLI `--subject <GATE_SUBJECTS key>
  --label <label> [--artifact rel] [--reference rel] [--rejudge] [--rotate-pins]`. Live mode:
  T-119 preflight BEFORE any render/judge spend ("a live gate run re-rolls the committed verdict
  record — that is a pin rotation and must be explicit"); fresh GL renders per view; coverage
  precondition (now visibility-aware, both arithmetics recorded); judge per surviving view through
  `judgeThroughPolicy` (T-114 bounded re-asks, `replies[]` audit, model `PHASE1_MODEL_ID` =
  claude-opus-4-8); sheet → `multi-angle/<slug>-sheet.png` + copy → `pr/assets/frames/
  multi-angle-<slug>.png`; record `multi-angle/<subj>-<label>.{json,md}` via `guardedWriteRecord`.
  `--rejudge` completes only `unparsed` views of a committed record. `--offline` re-asserts.
- Existing gate records (committed pins): `barn-patternbook.json` (decided, **8 gaps vs budget 2**
  → passed:false — the two arithmetics: 4/4 same-object/all-minor vs ≤2-budget FAIL),
  `barn-patternbook-saltcrag.json` (T-132 baseline, 4/4 / 8 minors), `cottage-patternbook.json`
  (the T-127 coverage REFUSAL — judge never called; T-137's witness re-censused it 0/4→4/4 at
  `visibility/cottage-patternbook.*` without judging).
- `pattern-book-compare.mjs` (outside the isolation scan): reads `<key>-patternbook.json` +
  `<key>-generated.json`, composes head-to-head + `pr/assets/pattern-book-milestone.md`.

## Records, paths, pins

- `chainRels(key, packRel)` → seed `workshop/<runKey>/program.json`, ledger `workshop/<runKey>.json`,
  final `workshop/<runKey>/final-artifact.json`, plan `workshop/<runKey>/component-plan.json`,
  record `pattern-book/<runKey>.{json,md}`. All tracked = pins; `guardedWriteRecord` +
  `preflightPins` (T-119, nine writers) refuse overwrite without `--rotate-pins`; the "workshop"
  domain structurally refuses gate-record namespaces.
- Pack namespacing: `packNs` → runKey `barn--saltcrag` etc. Sketch is pack-free
  (`form-sketch/<subject>.json`); recognition is pack-conditioned (`recognition/<runKey>.*`).
- `pr/assets/` carries E-12 pages (`pattern-book-milestone.md`, `challenge-milestone.md`, …) and
  `frames/` (gate sheets land there on every live gate run).

## Measured facts that bound the runs (honesty notes)

- Sketch pitches: barn `dominantTiltDeg 45` → ratio 1.0 → snaps to pitchClass **1 in BOTH packs**
  (TRELLIS flattens; the concept depicts ~2:1). Cottage `35.54°` → snaps to 1 (rustic's only
  class). So **no measured number demands >45°** — steep realization, if it happens, comes from
  the model aiming the pitch lever in the workshop (saltcrag affords class 2; rustic refuses).
  E-33 honesty: the concept is the contract; the sketch is the fallback; T-135's targets are all
  sketch-sourced today.
- T-133 measured ratios (committed): cottage ridge:eave 2.25→1.55 (target 1.4145), roofShare
  0.5556→0.3548 (0.293), aspect exact; barn 2.4444→2.4 (target 2.1; rustic pitch ceiling),
  aspect exact. Cottage eave 8→20 (4 storeys×5 — openings crowd the lower wall, T-133 concern #3).
- T-135 jetty caveat: the cottage SILHOUETTE ridgeToEave (4.5, widest-layer = jetty) differs from
  the program-side ratio (~2.6) — gate-side numbers and program-side diagnostics diverge on
  jettied subjects.

## Operational constraints (load-bearing)

- **Spend**: the sibling T-136 `levers:cottage` re-run HALTED at round 3 at 10:24pm on the Claude
  monthly spend limit (untracked `levers/cottage.*` records, outcome `exchange-refused`, written
  10:10pm). A minimal `claude -p` probe on claude-opus-4-8 at 10:30pm returned normally — the seam
  spends NOW, but mid-run exhaustion is a live risk (memory: zero-token notice replies burn the
  re-ask budget; probe before re-spending). T-138's live bill: 3 workshop loops (≤6 strong-tier
  critique exchanges each + re-asks + optional fragment exchanges) + 3 gate runs × 4 views judge
  calls (+ T-114 re-asks).
- **Sibling concurrency**: T-136's session owns `levers/*` and `docs/active/work/T-136-01/*`
  (Step 8 re-run + review.md pending); no live process right now (ps clean). Its planned re-run
  competes for the same spend pool. No T-138 commits exist (no double dispatch).
- **Isolation receipts**: `src/workshop/isolation.test.mjs` scans the workshop modules + runners
  (judge seams pinned absent); `pattern-book-compare.mjs` is deliberately outside. Any new
  loop-running or verdict-reading file must land on the right side of that scan.
- E-25 Rule 3 self-grep: no subject key may appear in runner source (it fires on comments too).
- npm arg passing needs `--` or direct `node` (flag-swallowing precedent).
- Suite at HEAD: 2005/2005 green.

## What the AC needs that does not exist yet

1. A path from **measured program → armed seed → loop-with-hands** for the CHAIN's named runs
   (cottage, barn, barn--saltcrag): pattern-book stage 3 seeds unmeasured/unarmed; workshop.mjs
   has no hands; geometry-levers has hands but seeds from the committed (squat) T-127 seed and
   writes to T-136's namespace.
2. A saltcrag measured-program record (`measured/barn--saltcrag.*`) — runner supports `--pack`,
   model-free.
3. The epic's judge runs on the NEW builds (labels/pins decision needed: re-roll `*-patternbook`
   records with `--rotate-pins` + retired pins named, vs new labels preserving baselines as live
   records).
4. Per-subject before/after silhouette-ratio deltas, both gap-budget arithmetics, verdict-vs-
   baseline movement (gap count + severity), the workshop-ledger lever-use citation.
5. The glance sheets beside the concepts in `pr/assets/` + an E-12 handoff page.
6. `docs/knowledge/design-learnings.md` E-33 section (no E-33 heading exists yet).

## Assumptions surfaced

- "Full loop" = the pattern-book chain shape (seed→workshop→record) with E-33's additions, not a
  fourth parallel runner family with its own divergent record schema.
- The cottage's "first pattern-book verdict" = the verdict on the NEW cottage build judged on the
  pattern-book path (the old `cottage-patternbook.json` is a refusal, not a verdict).
- The ≤2 gap budget stays as configured; both arithmetics are REPORTED, recalibration is flagged
  to the reviewer (E-33 Rule 3) — no config change in this ticket.
- Lisa handles phase transitions; this session writes artifacts only (no ticket frontmatter edits).
