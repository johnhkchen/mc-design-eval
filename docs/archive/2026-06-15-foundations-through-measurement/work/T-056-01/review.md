# T-056-01 — Review (ablation-sweep)

Handoff for a human reviewer: what changed, test coverage, open concerns. This ticket added **E-17 rung
R3** (the surgical sweep) and produced the **R0–R3 data spine** the scorecard (T-057-01) will read.

## What changed

### Created (source, in `npm test`)
- `src/form/ablation.mjs` — pure, GL/network-free core:
  - `RUNGS` — the canonical 4-rung ladder + labels.
  - `autoRegions(bounds, {slabs=3})` — generic horizontal-slab region specs from a build's AABB (the R3
    loop's region list; no curated per-subject defects).
  - `rungVerdict(prev, cur, eps)` — categorical form verdict rung-over-rung (`baseline|improved|held|
    regressed|unknown`); mirrors `formVerdictOf` but defined in `src/` so source never imports a benchmark.
  - `assembleAblation(rows)` — the metric-collection logic: flat `{subject,rung,formIoU,valueDeltaE}` rows
    → the `subject × rung` structured record + marginal deltas + the markdown tables. Null-tolerant.
- `src/form/ablation.test.mjs` — 8 unit tests.

### Created (benchmarks, GL/host-metered, NOT in CI)
- `benchmarks/sculpture/glb-voxel-surgical-sweep.mjs` — **R3**: `reviseLoop` on each R2 build with
  `glbFormTarget`, generic regions, default procedural diagnose. Writes `r3.{md,json}` + per-subject
  `summary.json`/`artifact.json`. `--offline` rebuilds the roll-up.
- `benchmarks/sculpture/sweep-ablation.mjs` — the **collector**: per subject decode the GLB texture once
  (reference palette), per rung load the artifact, source formIoU (committed for R1–R3, rendered for R0),
  compute value ΔE; `assembleAblation` → the top-level record. `--offline` rebuilds from per-subject json.

### Created (committed outputs)
- `benchmarks/sculpture/glb-voxel-surgical-sweep/{r3.md,r3.json,<subj>/summary.json,<subj>/artifact.json}`
- `benchmarks/sculpture/sweep-ablation.{md,json}` + `sweep-ablation/<subj>/ablation.json`

### Modified
- `.gitignore` — ignore the R3 sweep + ablation R0 render PNGs (derived, regenerable).

Nothing existing was modified except `.gitignore`. The E-16 synthesis runner (`glb-voxel-surgical.mjs`) and
all prior rung runners are untouched.

## Results (the spine)

| | R0 | R1 | R2 | R3 | story |
| --- | --- | --- | --- | --- | --- |
| form IoU range | 0.28–0.78 | **0.47–0.98** | 0.47–0.98 | 0.47–0.98 | R1 is the form win |
| value ΔE range | 6.2–16.5 | 1.2–7.9 | 0.0 | 0.0 | R2 cleans the palette |
| verdict | baseline | improved ×7 | held ×7 | held ×6, regressed ×1 | R3 ≈ null |

- **R1 (glb-voxel) is the decisive lever** — +0.12…+0.42 form IoU over text→JSON on every subject.
- **R2 (material-clean) buys palette cleanliness** — ΔE descends R0→R1→R2 for all 7; it does not move form
  (occupancy unchanged), so form IoU is flat R1→R2 (≤0.001).
- **R3 (surgical) holds** — 6/7 unchanged (the P14 cage held the already-close builds); bow-and-arrow is the
  one `regressed`, an honest per-region-vs-whole-object divergence (accepted local edit, GLB IoU
  0.289→0.292, lowered whole IoU 0.473→0.469).

## Test coverage

- **Pure logic:** 8 tests on `ablation.mjs` — `autoRegions` (count/exact-tiling/edge/malformed),
  `rungVerdict` (all five outcomes at eps), `assembleAblation` (verdict chain, signed marginal deltas
  incl. negative ΔE, null-cell tolerance, empty/malformed input). `npm test` = 530 pass / 0 fail.
- **Gaps (intentional, GL/metered — same split as every prior rung):** the two runners' live paths
  (render, `dwebp` decode, `reviseLoop` wiring) are not unit-tested in CI. Mitigated by: (a) all wired
  components are already covered (`src/revise/*.test.mjs`, `src/form/*.test.mjs`, `src/color/value-gate.
  test.mjs`); (b) `--offline` determinism (R3 byte-identical ex `durationSec`; ablation byte-identical);
  (c) the committed `.json/.md` records are the durable, inspectable artifact.

## Open concerns / known limitations

1. **value ΔE is tautological at R2/R3 (ΔE = 0.00).** The reference is the GLB's own canonical palette and
   R2 snaps to exactly that palette, so R2's distance to it is zero by construction — and R3 reuses R2's
   blocks, so it is zero too. This is *correct*, but the column only discriminates across R0→R1→R2 (the
   descent toward the true material values); it cannot rank R2 vs R3. Matches the documented
   `[[value-true-palette-codesign]]` caveat. **If T-057-01 wants a cleanliness number that separates R2
   from R3, use the R2 record's `speckle`/distinct-block count instead** (already committed) — ΔE is the
   "how true are the materials" axis, speckle is the "how busy is the skin" axis.
2. **R0-vs-GLB form IoU is cross-target.** R0 builds are text→JSON with their own coordinate system;
   `normalizeSilhouette` removes translation + uniform scale but NOT rotation/pose. R0's IoU is the honest
   floor, not a like-for-like comparison — read it as "how close did blind text get," not a calibrated
   distance. (R1–R3 share the GLB's pose since they are voxelized from it.)
3. **R3 is a near-null by design.** A single-view per-region accept-gate rarely lifts the whole-object
   silhouette of an already-close build (`[[form-revision-needs-3d-target]]`). The rung is included for
   completeness and to surface the divergence finding, not because it was expected to move the headline.
   The marginal-Δ table makes "R3 bought ~0 form" explicit rather than implying a win.
4. **autoRegions is generic, not defect-targeted.** Three horizontal slabs are a uniform probe, not the
   curated defect regions the E-16 synthesis hand-picked for koi/heart. A defect-aware region picker could
   find more accept-gate-clearing edits — but that is a future lever (E-15 region selection), out of scope
   for "apply the loop uniformly across 7 subjects."

## Critical issues
None. P14-safety holds for all 7 subjects (zero violations); `npm test` green; no secrets logged; PNGs
gitignored. No human action required to land.

## Handoff to T-057-01 (scorecard)
- Read `benchmarks/sculpture/sweep-ablation.json` (`schema: "sweep-ablation/v1"`): `subjects[].rungs[Rn]`
  carries `{formIoU, valueDeltaE, verdict, dFormIoU, dValueDeltaE}`.
- For palette cleanliness that separates R2 from R3, cross-reference `glb-voxel-clean/<subj>/summary.json`
  (`speckle*`, `manifest*`) — value ΔE bottoms out at R2 (concern #1).
- All four rung records are regenerable offline (`--offline` on both runners) without GL or network.
