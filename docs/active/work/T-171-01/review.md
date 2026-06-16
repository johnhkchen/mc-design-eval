# T-171-01 — Review

**Outcome: the falsifiable claim held.** Giving the gatehouse a recognition program and feeding its
material roles through construction produced a materially-faithful **stone** gatehouse and lifted its
self-concept score from the ~2 E-40 floor to **42** (+40). No production source changed; frozen
instrument untouched; `npm test` green (2242/0).

## What changed

### Created (drafts — none under `measurements/`, none in `npm test`)
- `benchmarks/sculpture/recognition/gatehouse.program.json` — **the deliverable (AC #1)**:
  model-authored `building-program/v1`, roles only, at the canonical recognition location.
- `benchmarks/sculpture/recognition/gatehouse.artifact.json` — the realized faithful build.
- `…/gatehouse.{record,md,replies,prompt}` — the recognition draft record, summary, T-114 re-ask
  ledger + full raw text, and the rendered prompt + sha.
- `…/view-gatehouse-{+x+z,+x-z,-x+z,-x-z}.png` — 4-azimuth render evidence.
- `experiments/eval-alignment/score-gatehouse-selfconcept.mjs` — witness self-concept scorer (single
  matched-condition slice of `corpus-referee.mjs::runCrater`, reusing `diagnose` verbatim).
- `docs/active/work/T-171-01/beside-concept-gatehouse.png` — the AC #2 glance.
- `docs/active/work/T-171-01/selfconcept-score.json` — machine-readable result.
- RDSPI artifacts (`research/design/structure/plan/progress/review`).

### Modified
- **None in production source.** `recognize.mjs`, `compile.mjs`, `program.mjs`, `durable-skin.mjs`
  (`SUBJECTS`), `corpus-referee.mjs` + its baseline `results/*.json`, `packs/`, and every
  `measurements/` file were left untouched. Faithfulness came purely from *running the existing chain
  for a subject it was never run for* + one witness measurement.

## Acceptance criteria

- **AC #1 — recognition program + construction consumes its roles; no per-subject constants.** ✓
  `recognition/gatehouse.program.json` exists (model-authored, conformance PASS). The existing
  `compileProgram` → `realizeProgram` chain lowered its roles → blocks (the single `roleBlock` point);
  walls realized as `stone_bricks`. The runner is subject-blind (its `generalizationGrep` self-test is
  clean); the program is data. No `.mjs` gained a gatehouse branch.
- **AC #2 — render beside concept; materially faithful (stone, not plank); score vs floor.** ✓
  `beside-concept-gatehouse.png` shows grey stone walls + dark gable roof + arched gate beside the
  stone concept. Block distribution moved **polished_basalt 35.8% → stone_bricks 46.5%** (walls), with
  cobblestone rubble quoins; `polished_basalt` gone. Self-concept score **42** (votes 40/44) vs the ~2
  floor.
- **AC #3 — recorded honestly if still capped.** ✓ It did *not* stay capped — it lifted decisively
  (+40), and `nWrongStyle=0` means the build is read as *matched*, not wrong-style. The remaining
  majors (WALL/OPENING/ROOF, all `styleClass=absent`) are missing-*detail* ("add") items, not material
  mismatch; the roof-dominant `dark_oak_planks` solid is attributed to **S-172** (roof-as-construction),
  not papered over.
- **AC #4 — `npm test` green; frozen instrument untouched.** ✓ 2242 pass / 0 fail; nothing under
  `measurements/`. Determinism receipt: `recognize --offline` reproduces the artifact byte-identically.

## Test coverage & verification

- **No new unit tests** (matches the no-test posture of the sibling experiment harnesses; the change is
  a data artifact + experiment runners). Correctness was verified by five independent signals:
  1. the pack conformance gate inside `recognize.mjs` — **PASS**;
  2. the `--offline` byte-identical determinism replay — **PASS**;
  3. the block-distribution assertion (polished_basalt → stone_bricks) — **confirmed**;
  4. the visual beside-concept render (Read/inspected) — **stone, faithful**;
  5. the live diagnose self-concept score (42 vs ~2) — **lifted**.
- `npm test` (2242/0) guards that no production path regressed.

**Coverage gap (flagged):** the scorer and the program are not exercised by `npm test`, so a future
schema change to `building-program` or `diagnoseRenderArgs` could silently drift them. This is the
established trade-off for metered experiment harnesses (the corpus-referee has the same property); the
`--offline` replay is the durable determinism guard for the program/artifact.

## Open concerns / handoffs

- **The roof is the binding gate now (→ S-172).** The model chose `roof.trim` (dark_oak_planks) as the
  roof *field* to render a dark roof; because that role is not the rustic pack's spruce stair-course
  family, `roofBlocks()` realizes it as **solid full cubes** — a 53.1% dark-oak prism. So even on the
  recognition path the roof is prism-like and roof-dominant. S-172 (covering-over-envelope, kill the
  prism) is the next binding constraint; this ticket correctly did not touch it.
- **Quoins under-realized.** `wall.field.ground` (cobblestone) quoins resolved to only ~4 cells — the
  `opening-dressing` treatment + quoin application looks thin. Cosmetic; not material-faithfulness; not
  pursued here. Worth a look if quoin relief becomes a scored department.
- **Reading inverted vs the AC wording.** AC #2 said "cobblestone field + stone dressing"; the model
  read "dressed coursed-stone field + cobblestone rubble quoins" — materially all-stone and arguably
  more faithful to a grey coursed-stone concept. Flagged for the reviewer; not a defect.
- **The E-41 crater re-run is T-173-01, not this ticket.** This ticket measured the *self-concept*
  score of the new build (42); separating matched ≫ wrong-style on the faithful build is T-173-01's
  job. The corpus-referee still points at the OLD `builds/gatehouse/new-roof` build + synthetic
  program — T-173-01 should decide whether to repoint it at the recognition build/program.
- **Metered + nondeterministic inputs.** The program and the score came from live model calls; a
  re-run could vary. The program/artifact are pinned (committed + `--offline` byte-stable); the score
  is a 2-vote mean (40/44) and should be treated as ±noise, but the +40 lift is far outside the ±12
  band.

## One-line summary for the next session

Gatehouse now has a model-authored recognition program; construction builds it in dressed stone
(stone_bricks walls, polished_basalt gone); self-concept score **2 → 42**. Remaining cap is the
roof-dominant dark-oak prism → **S-172**. Frozen instrument untouched, tests green.
