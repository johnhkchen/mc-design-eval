# T-061-01 Structure — file-level blueprint

Additive only (consolidation never deletes). Three created files, three written tracked assets, two
edited docs. Build order at the end; each step is independently verifiable.

## Created

### `src/form/e18-scorecard.mjs` (pure, ~150 lines)

The attribution/presentation layer over the `e18-remeasure/v1` spine. No I/O, no GL, imports only from
`src/`.

```
import { METRICS, BUILDS, delta } from "./remeasure.mjs";

// The three fixes = the marginal each isolating-baseline reveals (frozen, ordered).
export const FIXES = Object.freeze([
  { key: "thin",       label: "thin voxelization (form)",          baseline: "r1", metric: "formIoU" },
  { key: "segment",    label: "material segmentation (speckle)",   baseline: "r2", metric: "speckle" },
  { key: "discipline", label: "palette discipline (off-pal+distinct)", baseline: "r2", metric: "offPalette" },
]);

const EPS = { formIoU: 1e-3, speckle: 5e-3, offPalette: 0.5, distinct: 0.5, valueDeltaE: 0.05 };

// PURE helpers
export function meanPresent(values) -> { mean, n }      // reused-shape from scorecard.mjs
export function attributeFixes(spine) -> [{ key,label,baseline,metric, mean, n, improved,held,regressed, verdict }]
   // for each fix: pull spine.subjects[].deltas[vsR1|vsR2][metric].{raw,improved}, mean the raw,
   // tally improved/held/regressed (held = raw within EPS), verdict by direction+sign.
export function classifyRouting(spine) -> { thinHelped:[subj], solidHurt:[subj], byline }
   // partition subjects by sign of deltas.vsR1.formIoU.improved (+ raw): helped vs hurt/flat.
export function assembleE18Scorecard(spine, opts) -> { md, json }
   // json = { schema:"e18-scorecard/v1", epic:"E-18", scale, fixes, routing, subjects, averages, note }
   // md  = renderMd(json): Levels (5 metrics × R1/R2/E18) + Marginal Δ (vsR1, vsR2) + "what each
   //       fix bought" + routing block + honesty notes. (The E-12 handoff + sword prose are appended
   //       by the runner, like sweep-scorecard.mjs appends its handoff.)
```

Internal `renderMd(json)` builds, in order:
1. **Title + intro** — links the spine path; one-line gloss per metric + direction.
2. **Levels — every build, every subject** — per subject: 5 rows (form IoU / speckle / distinct /
   off-pal / value ΔE), columns `R1 glb-voxel | R2 material-clean | E18 combined`. Values via the
   spine cells; `—` for nulls.
3. **Marginal Δ — what E18 moved** — per subject, two columns: `Δ vs R1` and `Δ vs R2`, one signed
   row per metric (reuse spine `deltas`).
4. **What each fix bought** — the `FIXES` table: fix | isolating Δ | n | avg Δ | improved/held/regressed
   | verdict, plus one gloss line per fix.
5. **Form-type routing** — the `classifyRouting` partition rendered as prose + a per-subject
   thin-Δform table (subject | class | Δform vs R1 | route).
6. **Honesty notes** — value ΔE rose (cost, not tautology); solid-subject form regressions; off-pal
   measured vs augmented design-doc palette; n on every average.

Exports: `FIXES`, `meanPresent`, `attributeFixes`, `classifyRouting`, `assembleE18Scorecard`,
`_internal` (EPS, verdict helper) for tests.

### `src/form/e18-scorecard.test.mjs` (~90 lines, GL-free)

Synthetic 2–3 subject spine fixture (one thin-helped, one solid-hurt, one with a value-ΔE rise).
Tests:
1. `attributeFixes` — thin fix means the right `vsR1.formIoU.raw`; verdict `won-form` when mean > EPS,
   `regressed`/`wash` otherwise.
2. `attributeFixes` — segment fix means `vsR2.speckle.raw`; discipline fix means `vsR2.offPalette.raw`
   and tallies improved when E18 off-pal < R2.
3. `meanPresent` — skips nulls, reports n.
4. `classifyRouting` — partitions by sign of `vsR1.formIoU` (helped vs hurt).
5. `assembleE18Scorecard` — returns `{md, json}`; json.schema === "e18-scorecard/v1"; md contains the
   five section headers and a known subject name; tolerant of a missing build cell (`—`).

### `benchmarks/sculpture/e18-scorecard.mjs` (runner, ~140 lines)

The I/O edge over the two pure cores. Mirrors `sweep-scorecard.mjs`.

```
import { assembleE18Scorecard } from "../../src/form/e18-scorecard.mjs";
import { montageRow } from "../../src/form/montage.mjs";
import { RENDER_BG } from "../../src/form/form-fidelity.mjs";
import { PNG } from "pngjs";

const SPINE  = e18-remeasure.json
const ASSETS = pr/assets ; FRAMES = pr/assets/frames

// before/after pairs to stitch (source renders are gitignored; composites are committed)
const PAIRS = [
  { out:"speckle-heart.png",        before: glb-voxel-clean/heart/render-3q.png, after: e18-build/heart/render-3q.png,        cap:"heart speckle — R2 vs E18" },
  { out:"speckle-koi.png",          before: glb-voxel-clean/koi/render-3q.png,   after: e18-build/koi/render-3q.png,          cap:"koi speckle — R2 vs E18" },
  { out:"thin-bow-and-arrow.png",   before: glb-voxel-thin/bow-and-arrow/render-base-3q.png, after: .../render-thin-3q.png,  cap:"bow form — base vs thin" },
];

stitchPair(pair)  // decodePng(before),decodePng(after) → montageRow([a,b],{gap:6,bg:RENDER_BG.dropColor+255}) → write FRAMES/out
handoffSection(written, routing)  // E-12 beat + the form-type-routing rule + sword boundary prose
main():
  spine = read SPINE
  written = Σ stitchPair (unless --no-frames)
  { md, json } = assembleE18Scorecard(spine)
  write pr/assets/surface-and-thin.md  = md + handoffSection(written, json.routing)
  (optionally write pr/assets/e18-scorecard.json = json)   // tracked, small
flags: --no-frames (md only)
```

The runner owns the sword/routing prose (it is qualitative, not spine-derived) — same split as
`sweep-scorecard.mjs` owning the handoff text while `scorecard.mjs` owns the tables.

## Written (tracked bundle)

- `pr/assets/surface-and-thin.md` — the scorecard md + E-12 handoff. New file.
- `pr/assets/frames/speckle-heart.png`, `speckle-koi.png`, `thin-bow-and-arrow.png` — 2-panel composites
  (~1030×512 each), committed (sources gitignored).
- `pr/assets/e18-scorecard.json` — the structured `e18-scorecard/v1` record (small; tracked for E-12).

## Edited

- `docs/knowledge/design-learnings.md` — append `## Surface coherence & thin form (E-18) — …` after the
  E-17 "Consolidation sweep" section (~line 1687). ~45 lines: the fix table, before/after numbers, the
  routing rule + sword, the residual, one-sentence distillation. Numbers must match the spine exactly.
- `pr/assets/frames/README.md` — append a provenance block for the three new composites (source render
  per panel + the regen command `node benchmarks/sculpture/e18-scorecard.mjs`).

## Public interfaces (stable)

- `assembleE18Scorecard(spine, opts?) → { md, json }` — pure; the contract the runner depends on.
- `attributeFixes`, `classifyRouting`, `meanPresent`, `FIXES` — exported for tests + potential reuse.

## Build order

1. `src/form/e18-scorecard.mjs` + `e18-scorecard.test.mjs` → `node --test` green (depends only on
   `remeasure.mjs` exports; no files).
2. `benchmarks/sculpture/e18-scorecard.mjs` → run live → writes `pr/assets/surface-and-thin.md`,
   `e18-scorecard.json`, 3 composite PNGs. Verify the md numbers vs the spine by eye.
3. `docs/knowledge/design-learnings.md` + `pr/assets/frames/README.md` edits → read-back vs spine.
4. `npm test` green; write progress.md + review.md; final commit.

Commits (atomic): (1) pure core + tests; (2) runner + tracked bundle (md + json + 3 PNGs); (3) docs
(design-learnings + frames README).
