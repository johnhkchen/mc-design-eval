# Progress — T-083-01 hollow-cottage-milestone

Tracking against `plan.md`. The live metered run **succeeded fully** in this environment (headless GL + the
`claude -p` shim + `dwebp` all available) — both tiers fired, both gates reported, both exterior-held proofs
true. No deviations from the design; one runner fix (montage invocation).

## Steps

- **Step 1 — pure cutaway core + tests.** ✅ `src/view/cutaway.mjs` (`sectionKeys` / `roofCut` /
  `frontHalfCut`) + `cutaway.test.mjs` (11 tests). `npm test` **976** green (965 + 11). Committed
  (`89bdbf2`).
- **Step 2 — chained milestone runner.** ✅ `benchmarks/sculpture/hollow-cottage-milestone.mjs` +
  `package.json` `milestone:cottage`. Mirrors the three sibling runners; metered calls wrapped with
  deterministic fallbacks; `exteriorHeld` throws on failure. Committed with step 3.
- **Step 3 — live metered run.** ✅ `npm run milestone:cottage` ran end-to-end:
  - spray-paint: front 526 + side 520 cells, **plaster 8 → 315 (reversed)**, face resemblance **0.25 → 0.40**.
  - seal: 7874 placements, **watertight=false** (the designed door survived sealing — as intended).
  - hollow: **978 removed** (cavity 6438 → 5460), 122 protected, **exteriorHeld=true**. Detector
    **claude-haiku-4-5** (light), `hollowable:true`.
  - floorplan: author **claude-opus-4-8** (strong) → **2×2**, 4 rooms/storey, 395 placements, plausibility
    **PASS** (all six constraints), residual `openings-align`, **exteriorHeld=true**.
  - artifact AJV **VALID**; renders + cutaway sections produced. Committed (`d7698b2`).
- **Step 4 — E-12 handoff.** ✅ `pr/assets/{cottage-face-before,cottage-face-after,cottage-multi-angle,
  cottage-cutaway}.png` + `pr/assets/hollow-cottage.md`. Committed (`2277cc6`).
- **Step 5 — design-learnings E-23 section.** ✅ `## 2.5-D interaction sector (E-23) …` appended (view-
  matched-to-task; two paths; the gate-switch; right-sized-model results + rubric; over/under-reach). This
  commit.
- **Step 6 — review.** ✅ `review.md` (this commit / next).

## Deviation from plan

- **Montage invocation (minor).** The plan said `magick montage`; its default per-tile **filename labels need
  a font** the host lacked → exit 1 (renders unaffected; only the strip assembly failed). Switched to
  `magick … +append` (font-free horizontal strip). The runner's montage is best-effort and never blocks the
  run. No artifact/gate impact.
- **Intermediate probe renders dropped.** The detector input renders (`view-hollow-probe-3q`,
  `view-fp-probe-{top,front}`) are inputs to the metered calls, not deliverables — removed from the work dir
  to keep it to the milestone + cutaway + face renders (the sibling pattern commits only meaningful views).

## Notes carried into review

- `floorLines` read as `[0, 7, 14]` on the sealed cottage (a mid-band at 7) but `storeysFromRead` correctly
  grouped to **2 storeys** (floorY 0 and 14) — the floorplan placed exactly 2 storeys.
- The chain is reproducible offline in *structure* (deterministic fallbacks for both metered calls); the live
  numbers above are the metered run's, recorded in `milestone-report.json`.
