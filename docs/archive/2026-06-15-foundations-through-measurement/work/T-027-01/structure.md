# T-027-01 — Structure: material-noise pass

The shape of the code. One new source file, one new test file, two small edits to existing files. No
deletions. No changes to the spine modules or the E-10 engine (consume only).

## File manifest

| File | Action | What |
|---|---|---|
| `src/sculptor/material.mjs` | **create** | the material-noise stage, hue-family set, compile, convenience API |
| `src/sculptor/material.test.mjs` | **create** | unit tests + AJV round-trip + lock-composition |
| `src/sculptor/index.mjs` | **modify** | export the new public surface |
| `src/sculptor/README.md` | **modify** | add the material-noise pass to the pass list |

## `src/sculptor/material.mjs`

Header comment in the house style: what the pass is (run-015 same-hue noise + light-break), the E-10
coupling it intentionally introduces, the namespace-normalization rule, and the boundary (writes only
`material`, locks only `material`, never touches `occupied`/`relief`).

### Imports
```
import { defineStage, runStages } from "./orchestrator.mjs";
import { occupiedCells } from "./build-state.mjs";
import { toDesignArtifact } from "./compile.mjs";
import { srgbToLab, deltaE, nearestLab } from "../color/cielab.mjs";   // engine (portable)
import { loadBlockTable } from "../color/block-table.mjs";             // runtime path, zero asset deps
```

### Constants
- `MATERIAL_STYLE = Object.freeze({ name: "material-noise", rationale: "Same-hue block set per
  surface, varied by height — texture/age without changing the silhouette." })`
- `DEFAULTS = Object.freeze({ size: 3, spread: 0.7, radius: 6 })`
- `const TABLE = loadBlockTable();` — loaded once at module scope (mirrors palette-extract).

### Namespace helpers (the load-bearing id boundary)
- `tableKey(id)` → strip a leading `namespace:` so `"minecraft:stone"`/`"stone"` both → `"stone"`
  (table keys are bare).
- `blockId(key)` → add `"minecraft:"` if the key has no `namespace:` → `"minecraft:stone"` (artifacts
  require namespaced ids).

### `hueFamilySet(target, opts) → string[]`  (namespaced ids, ordered dark→light by L)
- Resolve `targetLab`: if `target` is an array of 3 numbers → treat as `rgb` (`srgbToLab`) unless
  flagged lab; if a string → `tableKey` lookup in `TABLE.blocks` (throw if unknown); accept a
  `{lab}`/`{rgb}` object too. (Keep resolution small and explicit.)
- Rank `TABLE.blocks` by `deltaE(targetLab, b.lab)` ascending; keep those with `ΔE ≤ radius`; take the
  first `size`; **always keep ≥1** (the nearest, even if its ΔE > radius — guards a far target).
- Sort the kept set by `lab[0]` (L) ascending (dark→light); return `blockId(b.block)` for each.
- Pure, deterministic; reuses only the engine's `deltaE` (and `srgbToLab` for rgb targets).

### `cellHash(x, y) → [0,1)`  (deterministic per-cell noise)
- Integer hash: `let h = (x*73856093) ^ (y*19349663); h ^= h<<13; h ^= h>>>17; h ^= h<<5;` then
  `(h >>> 0) / 2**32`. Pure, no `Math.random`. (xorshift-style avalanche so neighbouring cells differ.)

### `pickMaterial(setOrderedDarkToLight, t, h, spread) → BlockId`
- `S = set.length`. If `S === 1` return `set[0]`.
- `center = t * (S - 1)`; `idx = Math.round(center + (h - 0.5) * 2 * spread)`; clamp to `[0, S-1]`;
  return `set[idx]`. (`t` ∈ [0,1] is height fraction; bottom→darkest, top→lightest.)

### Surface resolution
- `resolveSurfaces(state, intent) → [{ cells:[{x,y}], set:string[], spread }]`
  - `mi = intent?.material ?? {}`; `size/spread/radius` from `mi` else `DEFAULTS`.
  - `defaultTarget = dominantBlock(mi.palette) ?? MASSING_BLOCK` (`dominantBlock` = first id, or the
    highest-`coveragePct` entry if palette is objects; namespace-agnostic).
  - Occupied cells from `occupiedCells(state)`; bbox `minY/maxY` for `t`.
  - If `mi.surfaces` given: for each, build its cell list from `region` (predicate or `[[x,y]]` list);
    its `set = hueFamilySet(surface.target ?? defaultTarget, {size, radius})`. Cells not claimed by
    any explicit surface form the **default surface** (`set` from `defaultTarget`).
  - Else: one default surface = all occupied cells.
  - Returns surfaces each carrying the shared `minY/maxY` for height fraction (or pass bbox alongside).

### `materialStage(intent) → Stage`
- `defineStage({ name: "material", run: (draft, intentArg, prev) => { ... } })`.
- Inside: `resolveSurfaces(prev, intentArg ?? intent)`, compute bbox `minY/maxY` once; for each
  surface cell, `t = (maxY===minY) ? 0 : (y-minY)/(maxY-minY)`; `h = cellHash(x,y)`;
  `draft.set(x, y, { material: pickMaterial(surface.set, t, h, surface.spread) })`.
- Only `material` is written; air cells are never touched.

### `material(state, intent = {}) → state`
- `runStages(state, [materialStage(intent)], intent)`. Returns the material-locked successor.

### `compileMaterial(state, opts = {}) → DesignArtifact`
- `toDesignArtifact(state, { style: MATERIAL_STYLE, ...opts })`. Manifest derives from placed blocks.

### Exports
`material`, `materialStage`, `hueFamilySet`, `pickMaterial`, `cellHash`, `compileMaterial`,
`MATERIAL_STYLE`, `DEFAULTS`. (`pickMaterial`/`cellHash` exported for direct unit tests.)

## `src/sculptor/material.test.mjs`

Mirror `massing.test.mjs` conventions (ASCII `gridOf`, `mass` to make the locked substrate, real AJV
gate, `assert.throws(fn, Type)`).

Groups:
1. **hueFamilySet** — stone target → ≥2 blocks, all namespaced, all within radius, the nearest is
   `minecraft:stone`, ordered by L; rgb target resolves; unknown id throws; `size`/`radius` honoured;
   degenerate tiny synthetic table → returns ≥1.
2. **cellHash / pickMaterial** — `cellHash` deterministic & in [0,1); neighbouring cells differ;
   `pickMaterial` returns a set member; `t=0` biases low index, `t=1` biases high index; `S=1` always
   index 0.
3. **stage: writes material, leaves occupied untouched** — on a `mass`ed fixture, every occupied cell
   gets a `material` from the surface set; air cells stay `undefined`; `occupied` values unchanged.
4. **stage: out-of-palette guard** — every assigned material ∈ the computed hue-family set (∪ manifest
   when palette given); no foreign block.
5. **height variation** — top-band material multiset ≠ bottom-band multiset on a tall fixture.
6. **locks** — after `material`, `isLocked(material)` true and `isLocked(occupied)` still true; a
   follow-on stage repainting a material throws `LockViolationError`; a follow-on stage may still set
   `relief` (unlocked); a draft-bypass that changes `material` → `StageRejectedError`.
7. **compile + AJV round-trip** — `material → compileMaterial` passes `parseArtifact`/`assertArtifact`;
   manifest = the surface set (multi-entry); one placement per occupied cell.
8. **intent** — `intent.material.palette` (bare and namespaced ids) sets the target; explicit
   `surfaces` with a region predicate paints two different sets to two halves; empty intent → stone
   family fallback.
9. **determinism** — running `material` twice on the same state yields identical materials (and is a
   no-op-safe re-run, given same-value writes).

## `src/sculptor/index.mjs` (modify)
Append a block exporting `material`, `materialStage`, `hueFamilySet`, `compileMaterial`,
`MATERIAL_STYLE` from `./material.mjs` (keep `pickMaterial`/`cellHash` internal-ish but exported from
the module for its own tests; the barrel need only surface the public verbs).

## `src/sculptor/README.md` (modify)
Add a `material.mjs` bullet under "The pieces" (pass A, T-027 — same-hue set per surface via the E-10
engine, noise + height light-break, writes/locks `material`) and note in "The load-bearing rule" that
material locks `material` over the locked massing (already half-written there).

## Ordering of changes
1. `material.mjs` (set + noise + stage + compile).  2. `material.test.mjs` (red → green).
3. `index.mjs` export.  4. `README.md`.  5. full `npm test`.
