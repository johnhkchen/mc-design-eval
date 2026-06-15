# T-145-02 Progress

## Status: implement complete (deterministic core landed; live recognition run deferred — see notes)

- [x] Step 1 — schema `band` enum (`feat(T-145-02): facade face carries an optional storey band (schema)`)
- [x] Step 2 — `bandYRange` + check-9 rule (`feat(T-145-02): bandYRange + band/storey validation`)
- [x] Step 3 — compiler threads band as pure data (`feat(T-145-02): compiler threads the storey band…`)
- [x] Step 4 — brushes honor `band` (`feat(T-145-02): facade brushes restrict relief to the recognized storey band`)
- [x] Step 5 — end-to-end containment test (`test(T-145-02): end-to-end storey-band relief containment`)
- [x] Step 6 — prompt clause + regen fixture prompt (`feat(T-145-02): recognition prompt teaches the storey band…`)
- [x] Step 7 — fix stray barn-grammar.json (`fix(T-145-02): barn relief grammar — stone-pier roles + storey band…`)
- [~] Step 8 — live recognition records — **DEFERRED** (see notes)
- [x] Step 9 — render proof, cottage (`docs(T-145-02): render proof — cottage half-timber…`); barn pending S-159

## What landed

- `schema/building-program.schema.json`: optional per-face `band ∈ {ground, upper, all}` (additive).
- `src/recognition/program.mjs`: `bandYRange(m, band)` (the single named-band → mass-relative {yLo,yHi}
  mapping; no per-building constant) + check-9 rule (`upper` needs `storeys ≥ 2`).
- `src/recognition/compile.mjs`: `facadeArticulationPlan` threads `band:{yLo,yHi}` (pure data) into the
  pilaster / infill-panel / quoin params; absent ⇒ byte-identical legacy plan.
- `src/view/facade-articulation.mjs`: `bandZone()` helper; pilaster/infillPanel/quoin accept `band` and
  build the y-band predicate internally (explicit `zoneOf` still wins). Reports echo the band.
- `src/recognition/facade-grammar.mjs`: `facadeDigest` teaches the band vocabulary; fixture `prompt.txt`
  regenerated via the production fn.
- `benchmarks/sculpture/relief/barn-grammar.json`: de-mis-rolled — `wall.dressing` piers + `wall.field.ground`
  panels + `band:"all"` (was `frame.timber` on a stone barn).
- `benchmarks/sculpture/facade-relief-proof.mjs` + `pr/assets/frames/beside-concept-cottage-relief.png`:
  the render proof — studs frame the plaster upper storey, stone ground storey stays clean.
- Tests: `program.test.mjs` (bandYRange + validation), `compile.test.mjs` (band threading + byte-identity
  guard), `facade-articulation.test.mjs` (FA10–FA12 containment), `facade-build.test.mjs` (end-to-end
  containment), `facade-grammar.test.mjs` (digest teaches band). `npm test` 2138/2138 green.

## Notes / deviations

- **Step 8 (live recognition) deferred, not skipped.** The subscription shim is confirmed available
  (`claude -p` probe) and the runner accepts `--ticket T-145-02`; the facade record dirs are untracked so
  the pin-guard would permit a first write. It was deferred because a live billed pass produces a
  NON-DETERMINISTIC record that gets committed and pinned (offline byte-identical replay), and I cannot
  guarantee a single live call emits the `band` correctly — that curation belongs to a deliberate run,
  not an autonomous tail. The shape it must emit is proven by the corrected `barn-grammar.json` and the
  cottage proof grammar. **Remaining producer command:**
  `npm run facade-grammar -- --subject cottage --ticket T-145-02` (and `--subject barn …`), then
  `npm run facade-grammar:offline` to pin byte-identical replay.
- **Step 9 barn render deferred to S-159.** The generate-first barn build is holey (a Stage-4 build
  bug, not the grammar); a clean barn render rides S-159's watertight seed. The cottage carries the
  primary AC#3 proof (per the AC's own note). The corrected barn grammar is validated and ready.
- Pre-existing uncommitted files in the worktree (barn artifacts, .lisa.*) are from prior sessions and
  were left untouched — only T-145-02 files were committed.
