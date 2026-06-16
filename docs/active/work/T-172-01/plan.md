# T-172-01 — Plan

Ordered, independently-committable steps. `npm test` green is the gate after each code step (1–4);
step 5 is verified by running the harness (no unit tests there, per project posture).

## Step 1 — covering engine + census helper (`roof-generate.mjs`)
- Add `opts.covering` (default false) and the per-column `coverFloor` (riser-seal rule from design.md).
- Change the emission bound `floor → coverFloor` (sheet path unchanged).
- Add exported pure `roofFieldFraction(gen)`.
- **Verify:** `node --test src/view/roof-generate.test.mjs` (existing 29 still green — covering is
  default-off, so byte-identical).
- **Commit:** `feat(T-172-01): covering mode + roofFieldFraction in roof-generate (default-off)`

## Step 2 — covering tests (`roof-generate.test.mjs`)
- Add the 7 cases from structure.md §3 (hollow interior; pitch-2 watertight; surface byte-identical;
  gable-end + closure preserved; census fraction; absent⇒legacy; multi-gable composes).
- Import `roofFieldFraction` and `closureOf`.
- **Verify:** `node --test src/view/roof-generate.test.mjs` all green; specifically the census case
  proves the field-fraction drop and the watertight case proves no daylight column on pitch 2.
- **Commit:** `test(T-172-01): pin covering hollow/watertight/census/byte-identity`

## Step 3 — propagate covering to generate-first (`provision-generate.mjs`)
- One line: add `covering: true` to the `generateRoof(roof.gables, family, {…})` call.
- **Verify:** `node --test src/form/provision-generate.test.mjs` + any roof/component suites. If a pin
  asserts a solid roof interior in the generate-first artifact, **do not force it** — revert the line,
  record the block in progress.md, and keep covering scoped to `roof-climb` (the named build). Report.
- **Commit (if green):** `feat(T-172-01): generate-first roof is a covering (provision-generate)`

## Step 4 — multi-ridge + covering wiring (`roof-climb.mjs`)
- Load `recognition/{subject}.program.json`; `registerRect(masses, eaveCols)`; one `gableRecord` per
  mass via `reg.transform`; fallback to single-bbox covering when absent/ambiguous (logged).
- `gableBlock` = modal kept wall block at the eave; `generateRoof(gables, FAMILY,{covering:true,
  gableBlock})`.
- Census (old vs new roof-field fraction) + `closureOf(eaveCols ring)` printed; output to
  `builds/{subject}/roof-covering/`; gate `score()` behind `--score`.
- **Verify:** `node --check experiments/eval-alignment/roof-climb.mjs` (syntax); a dry import smoke if
  cheap.
- **Commit:** `feat(T-172-01): roof-climb builds one gable per mass, covering, into roof-covering/`

## Step 5 — produce evidence (run, GL on, NO metered scoring)
- `node experiments/eval-alignment/roof-climb.mjs cottage`  (no `--score`)
- `node experiments/eval-alignment/roof-climb.mjs barn`
- `node experiments/eval-alignment/roof-climb.mjs gatehouse`
- Inspect renders (Read the PNGs): cottage shows TWO perpendicular gables with a valley; barn shows a
  single clean gable, no plank mountain; verify the slope reads watertight.
- Copy/compose beside-concept PNGs for cottage + barn into the work dir.
- Record the census table (old % → new %) and `closureOf` per subject in FINDINGS.md.
- **Commit:** `docs(T-172-01): roof-covering renders + census/closure FINDINGS`

## Step 6 — review.md
- Summarize changes, test coverage, the AC checklist, the `roofBlocks`/compile-path boundary
  (reported, not merged), and open concerns (steep narrow roofs; the crater is T-173-01).
- **Commit:** `docs(T-172-01): review.md`

## Testing strategy
- **Unit (the durable proof):** roof-generate covering cases — hollow, watertight@pitch-2,
  byte-identical surface, gable-end+closure invariance, census fraction. These satisfy AC #1 (prism
  gone, offline-provable) and AC #3 (closure no-regress) without GL/metering.
- **Integration-by-running:** `roof-climb` renders are the AC #2 witness (two gables / no prism).
- **Regression:** full `npm test` green after steps 1–3 (default-off keeps six callers byte-stable).
- **Determinism:** covering mode is pure; the `determinism` pin extends trivially (two covering
  generations deep-equal).

## Verification criteria (maps to AC)
- AC #1 (covering, census < 72 %): `roofFieldFraction` test + runner census print.
- AC #2 (multi-ridge cottage / barn prism gone / beside concept): runner renders, inspected + saved.
- AC #3 (no closure regression; report seams): `closureOf` invariance test + runner report; the
  `roofBlocks` seam reported in review.
- AC #4 (`npm test` green; instrument untouched): full-suite run; no `measurements/` edits.

## Risk register
- **Steep/narrow roof leak** → riser-seal rule + pitch-2 watertight test; if a real narrow-roof seam
  appears in a render, report it (don't hide) — it's named as roof-fit's own sub-problem.
- **`registerRect` ambiguous on a subject** → logged fallback to single-bbox covering; the prism is
  still killed even without multi-ridge.
- **provision-generate pin blocks covering** → revert step 3, scope to roof-climb, record it.
- **Metered budget** → scoring gated off by default; this ticket spends ~0 model tokens (renders are
  local GL).
