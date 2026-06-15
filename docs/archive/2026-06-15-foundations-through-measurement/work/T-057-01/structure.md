# T-057-01 Structure — file-level blueprint

The shape of the code: two new pure `src/form/` modules (each with a test), one benchmark runner,
one tracked output doc + 7 tracked composites, and two doc edits. Build order at the end.

## Created

### `src/form/scorecard.mjs` (pure, ~120 lines)

The presentation/attribution layer over the spine. No I/O, no GL, no imports outside `src/`.

```
import { RUNGS, VERDICT_GLOSS } from "./ablation.mjs";

// The three techniques = the marginal column each non-baseline rung adds.
export const TECHNIQUES = [
  { rung: "R1", from: "R0", key: "voxel",          label: "glb-voxel (form grounding)" },
  { rung: "R2", from: "R1", key: "material-clean", label: "material-clean (palette)"   },
  { rung: "R3", from: "R2", key: "surgical",       label: "surgical (per-region)"      },
];

/** Mean of the present (numeric) values + the count averaged. {mean:null,n:0} if none. */
function meanPresent(values) -> { mean:number|null, n:number }

/** Per-technique aggregate across subjects: mean dFormIoU, mean dValueDeltaE, n,
 *  and tallies {improved,held,regressed} from each subject's rung verdict. PURE. */
export function attributeTechniques(spine) -> [{ key,label,rung,from,
    meanDFormIoU, meanDValueDeltaE, n, improved, held, regressed, verdict }]

/** spine(json from sweep-ablation) → { md, json }. The scorecard:
 *  - Levels table (reuse spine subjects: form IoU / value ΔE / verdict rows)
 *  - Marginal Δ table (per subject)
 *  - AVG / Δ technique-attribution row(s) from attributeTechniques
 *  - a one-line verdict per technique (won-form / won-value / wash) + honesty notes.
 *  PURE; tolerant of missing subjects/cells. */
export function assembleScorecard(spine, opts?) -> { md, json }
```

`json` shape (`scorecard/v1`): `{ schema, epic:"E-17", scale, subjects:[…spine passthrough…],
techniques:[…attributeTechniques…], note }`. The technique `verdict` string is chosen by threshold:
`meanDFormIoU > +eps` → "won-form"; else if `meanDValueDeltaE < −eps` → "won-value"; else "wash"
(eps = 1e-3 / 0.05 for ΔE). These thresholds live as module consts.

### `src/form/scorecard.test.mjs` (pure unit tests, ~90 lines)

Tests, all offline with hand-built spine fixtures (no files, no renders):
1. `meanPresent` skips nulls and reports n; returns `{mean:null,n:0}` for all-null.
2. `attributeTechniques`: a 2-subject fixture → voxel mean ΔformIoU/ΔvalueΔE correct, n=2.
3. technique verdict thresholds: form-only Δ → "won-form"; value-only Δ → "won-value"; both ~0 →
   "wash".
4. tallies: a fixture with one `regressed` R3 → `surgical.regressed === 1`, `improved === 0`.
5. `assembleScorecard` round-trips the real `sweep-ablation.json` numbers: voxel meanDFormIoU ≈
   +0.238, material-clean meanDFormIoU ≈ +0.000, surgical meanDFormIoU ≈ −0.001 (asserted to 3 dp
   from an inline copy of the 7-subject marginals — no file read in the test).
6. tolerance: a spine missing a subject's R3 cell → no throw; that technique's n drops by 1.

### `src/form/montage.mjs` (pure, ~45 lines)

```
/** Paste N equal-height RGBA8 panels left→right with `gap`px gutters of `bg`.
 *  @param images {{width,height,data:Uint8Array|Buffer}[]}  (data = RGBA8, length 4*w*h)
 *  @param opts {{gap?:number, bg?:[r,g,b,a]}}
 *  @returns {{width,height,data:Buffer}}  width = Σw + gap*(n-1), height = max h
 *  Panels shorter than the tallest are top-aligned; gutters + padding filled with bg. PURE. */
export function montageRow(images, opts?) -> { width, height, data }
```

No pngjs import here — operates on raw RGBA buffers so it is GL-free and trivially testable.

### `src/form/montage.test.mjs` (pure unit tests, ~50 lines)

1. two 2×2 solid-color panels, gap 0 → 4×2 output; left half = color A, right half = color B.
2. gap 1 with a known `bg` → middle column equals bg; output width = 2+1+2 = 5.
3. unequal heights (2×2 and 2×1) → output height 2; the short panel's bottom row = bg (top-aligned).
4. throws on empty `images` / mismatched element shape.

### `benchmarks/sculpture/sweep-scorecard.mjs` (runner, I/O edge, ~110 lines)

```
node benchmarks/sculpture/sweep-scorecard.mjs            # write pr/assets/sweep.md + 7 march PNGs
node benchmarks/sculpture/sweep-scorecard.mjs --no-frames # scorecard md only (skip the PNG stitch)
```

Responsibilities (all impure I/O; calls the pure cores):
- read `benchmarks/sculpture/sweep-ablation.json`; `assembleScorecard(spine)` → write
  `pr/assets/sweep.md` (scorecard tables + AVG row + the E-12 handoff section appended by the runner
  from a template string, referencing the march frames).
- per subject in `SUBJECTS` (imported from `glb-voxel-breadth.mjs`): decode the 4 rung PNGs
  (`RUNG_RENDERS` path map), `montageRow`, encode `pr/assets/frames/march-<subj>.png`. A missing
  source render is logged + skipped (never a hard fail) so a partial local checkout still emits the
  scorecard.
- PNG decode/encode via `pngjs` `PNG.sync` (same lib `decodeImage` uses).

### `pr/assets/sweep.md` (tracked output)

The scorecard + the E-12 handoff. Written by the runner; committed.

### `pr/assets/frames/march-<subject>.png` × 7 (tracked outputs)

The per-subject R0→R3 composites. Written by the runner; committed (source renders are gitignored).

## Modified

### `docs/knowledge/design-learnings.md`

Append the **"Consolidation sweep (E-17)"** section (per D5): attribution table with averaged
numbers, the "where it didn't help" paragraph, one-sentence residual. ~35 lines.

### `pr/assets/frames/README.md`

Add a provenance block for `march-<subject>.png` (source = the four gitignored rung renders;
regen = `node benchmarks/sculpture/sweep-scorecard.mjs`). ~8 lines in the provenance table + a note.

### `benchmarks/sculpture/.gitignore` *(only if needed)*

The march PNGs live under `pr/assets/`, NOT `benchmarks/`, so they are tracked by default — **no
gitignore change required**. The runner writes nothing new under `benchmarks/sculpture/` that isn't
already ignored. (Confirm during Implement; add an entry only if a stray artifact appears.)

## Deleted

None.

## Public interfaces (stable contracts)

- `assembleScorecard(spine, opts?) → {md, json}` — pure; the scorecard generator.
- `attributeTechniques(spine) → technique[]` — pure; the per-technique averages + tallies.
- `montageRow(images, opts?) → {width,height,data}` — pure; the row compositor.
- `TECHNIQUES` — the rung-pair → technique map (frozen).

## Build order

1. `src/form/montage.mjs` + test  → green (no deps on anything new).
2. `src/form/scorecard.mjs` + test → green (depends only on `ablation.mjs` exports).
3. `benchmarks/sculpture/sweep-scorecard.mjs` → run live → `pr/assets/sweep.md` + 7 march PNGs.
4. `docs/knowledge/design-learnings.md` + `pr/assets/frames/README.md` edits.
5. `npm test` green; commit.

Each step is independently verifiable: 1–2 by `node --test`, 3 by inspecting the emitted md/PNGs, 4
by read-back. Commits: (1+2) pure cores, (3) runner + outputs, (4) docs.
