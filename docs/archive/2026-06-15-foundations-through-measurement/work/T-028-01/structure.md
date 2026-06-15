# T-028-01 — Structure: self-shadow relief pass

The shape of the code — files, exports, and the internal organization of `relief.mjs`. Not code; the
blueprint. Mirrors `material.mjs` so the diff reads as the obvious sibling.

## Files

| File | Change | Why |
| --- | --- | --- |
| `src/sculptor/relief.mjs` | **create** | the relief stage, feature model, detection, metric, compile |
| `src/sculptor/relief.test.mjs` | **create** | unit + AJV round-trip + lock/composition + metric tests |
| `src/sculptor/index.mjs` | **modify** | re-export the relief public surface |
| `src/sculptor/README.md` | **modify** | add a `relief.mjs` bullet to "The pieces" |

No schema change (negative Z legal). No compile change (`pos:[x,y,relief]` already wired). No edits to
build-state / orchestrator / massing / material — relief is purely additive.

## `relief.mjs` — module layout (top → bottom)

A header comment in the house style (boundaries, the load-bearing lock note, the exclusion rule, the
"geometry-only, no E-10" boundary). Then:

### Imports
```
import { defineStage, runStages } from "./orchestrator.mjs";
import { occupiedCells } from "./build-state.mjs";
import { toDesignArtifact } from "./compile.mjs";
```
No color engine, no massing import (relief needs neither a block table nor MASSING_BLOCK).

### Constants
- `DEFAULTS = Object.freeze({ inset: -1, pop: +1, detect: true, base: false })` — the legal-move
  depths and detection toggles.
- `FEATURE_RELIEF` — frozen map `type → "inset" | "pop"` (the relief *kind*, resolved to a number via
  DEFAULTS/intent at apply time):
  - `recess: "inset"`, `window: "inset"`
  - `trim: "pop"`, `cornice: "pop"`, `frame: "pop"`, `lip: "pop"`, `eave: "pop"`, `base: "pop"`
- `RELIEF_STYLE = Object.freeze({ name: "relief", rationale: "Self-shadow relief — recess/trim/lip
  Z-depth over the locked material skin; silhouette and skin unchanged." })`.

### Typed guard
- `class FeatureTypeError extends Error` — `code:"feature_type"`, carries the bad `type`. (Parallels
  `DefectVocabularyError`.)
- `assertFeatureType(type) → type` — throws `FeatureTypeError` if `type ∉ keys(FEATURE_RELIEF)`.

### Feature → relief value
- `reliefValueFor(type, {inset, pop}) → number` — `assertFeatureType` then map via `FEATURE_RELIEF`
  (`"inset"`→inset, `"pop"`→pop).

### Region predicate (local mirror of material's helper)
- `regionPredicate(region)` — `null`→`()=>true`; function→itself; `[[x,y],…]`→Set membership;
  else→`()=>false`. Identical contract to material's, kept local (no cross-module import of a private).

### Detection
- `bbox(cells) → {minX,minY,maxX,maxY}|null` — small bbox scan over occupied cells (the
  `proportionsOf` idiom, local).
- `detectFeatures(cells, opts) → [{type, region}]` — geometry-only auto-detection:
  - if `opts.cornice` (default from `DEFAULTS.detect`): emit `{type:"cornice", region: cells in the
    top row (y === maxY)}` as an explicit `[[x,y],…]` list.
  - if `opts.base`: emit `{type:"base", region: cells in the bottom row (y === minY)}`.
  - returns `[]` when detection is off or there are no occupied cells.

### Region resolution
- `resolveFeatures(state, intent) → [{cells:[{x,y}], value:number}]` — the partition:
  1. read `ri = intent.relief || {}`; `inset = ri.inset ?? DEFAULTS.inset`, `pop = ri.pop ?? …`.
  2. start with explicit `ri.features` (in order), then **append** detected features
     (`detectFeatures`) so explicit always claims first.
  3. walk features, each claiming still-unclaimed occupied cells via a `claimed` Set (material's exact
     idiom), resolving `value = reliefValueFor(type, {inset,pop})`.
  4. drop features that claimed zero cells. Cells in no feature stay flat (not returned).

### The stage + convenience
- `reliefStage(intent = {})` → `defineStage({ name:"relief", run: (draft, intentArg, prev) => …})`:
  prefer `intentArg` when it carries `.relief`, else the closure `intent` (material's
  `intentArg && intentArg.material ? intentArg : intent` idiom). For each resolved feature, for each
  cell: `draft.set(x, y, { relief: value })`. Touches only `relief`, only on occupied cells.
- `relief(state, intent = {})` → `runStages(state, [reliefStage(intent)], intent)`.

### Metric
- `reliefMetrics(state) → { occupied, relievedCount, coverage, variance, min, max, range }` — pure
  projection over `occupiedCells(state)`; rounds coverage/variance to 2dp (the `round2` idiom). Zero
  across the board for an all-flat state.

### Compile
- `compileRelief(state, opts = {}) → DesignArtifact` — `toDesignArtifact(state, { style:
  RELIEF_STYLE, ...opts })`. No defaultBlock pin (material already painted; an unpainted cell falls to
  compile's `minecraft:stone` default, same as material's wrapper).

## `relief.mjs` — public exports

```
export { relief, reliefStage, reliefMetrics, compileRelief,
         reliefValueFor, assertFeatureType, FeatureTypeError,
         FEATURE_RELIEF, RELIEF_STYLE, DEFAULTS as RELIEF_DEFAULTS };
```
(`regionPredicate`/`detectFeatures`/`bbox`/`resolveFeatures` stay module-private; tested through the
public surface.)

## `index.mjs` — added block (after the material exports)

```
export {
  relief,
  reliefStage,
  reliefMetrics,
  compileRelief,
  FEATURE_RELIEF,
  RELIEF_STYLE,
} from "./relief.mjs";
```

## `README.md` — added bullet (after the `material.mjs` bullet, before `review.mjs`)

A `relief.mjs (pass B, T-028)` entry: writes Z-depth (recess −1 / trim +1 / cornice lip) from
`intent.relief.features` + a simple top-row cornice detection, **carving recesses by exclusion** (one
voxel per cell, shifted in Z — never a buried front block), locks `relief` over the material-locked
state, and exposes `reliefMetrics` (coverage / Z-variance) as the quantitative "less flat" signal.

## `relief.test.mjs` — test groups (blueprint)

1. **assertFeatureType / reliefValueFor** — known types map to inset/pop; unknown throws
   `FeatureTypeError`; `inset`/`pop` overrides honored.
2. **detection** — top-row cells get a cornice (+1) by default; `detect:false` → none; base course off
   by default, on when requested.
3. **stage writes relief, leaves occupied/material untouched** — a material-locked tall fixture with a
   window region → those cells −1, rest 0; `occupied`/`material` values unchanged.
4. **exclusion / no buried blocks** — `compileRelief`: `placements.length === occupiedCount`; a
   recessed cell's lone placement has `pos[2] === -1`; no two placements share an (x,y).
5. **trim/cornice/lip** — a frame region → +1; an explicit horizontal `cornice` line → +1 lip.
6. **locks & composition** — relief locks `relief`; `occupied`+`material` locks survive; a re-relief
   stage throws `LockViolationError`; a draft-bypass throws `StageRejectedError`; a stage changing the
   still-locked `material` throws.
7. **metric increases** — `reliefMetrics` is all-zero on massing-only and material-only; after relief,
   `coverage>0` and `variance>0` (measurably less flat).
8. **chain + AJV round-trip** — `mass → material → relief` → `compileRelief` passes
   `parseArtifact`/`assertArtifact`; style name is `relief`; negative Z present in placements.
9. **determinism** — two relief runs over the same state agree cell-for-cell (no jitter).
10. **intent precedence & barrel** — explicit feature beats detection on an overlapping cell; the
    public surface is re-exported from `index.mjs` and behaves identically.

## Ordering of changes

`relief.mjs` → `relief.test.mjs` (red→green) → `index.mjs` barrel → `README.md`. Each is independently
verifiable; the barrel/README are doc-only and land last.
