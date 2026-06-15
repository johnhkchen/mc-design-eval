# T-027-01 — Design: material-noise pass

Decisions for the seed material-noise stage, each grounded in Research. The pass is one new module
`src/sculptor/material.mjs` that imports the spine (build-state, orchestrator, compile) **and** the
E-10 engine (`cielab.mjs` `deltaE`/`nearestLab`, `block-table.mjs` `loadBlockTable`). This cross-epic
import is the intended coupling S-027 calls for ("the E-10 color engine + block→Lab table").

## D1 — How to get the "nearest block AND its near neighbours in Lab" (the hue-family set)

- **Option A — add `nearestKLab` to `cielab.mjs`.** The engine gains a k-nearest. Reusable, but edits
  an E-10 file from an E-11 ticket — cross-epic file churn, and the portable core grows a feature this
  ticket alone needs.
- **Option B — a local `hueFamilySet` in `material.mjs`, built on the engine's `deltaE`.** Rank the
  table by `deltaE(targetLab, b.lab)`, take the nearest *k within a ΔE radius*. No E-10 edits; the
  portable core stays untouched; the scan reuses the engine's metric.
- **Option C — reuse `nearestLab` repeatedly, removing the winner each time.** k calls, k array
  rebuilds. Same result as B, more allocation, less clear.

**Decision: B.** The ticket says *use* the engine to find the set, not that the engine must own
k-nearest. A local ranked scan over `loadBlockTable().blocks` using the engine's `deltaE` keeps the
edit inside the sculptor module (clean DAG / file-lock story — T-027 touches only `src/sculptor/*` +
the one new file), leaves the portable core pristine, and is trivially testable on a synthetic table.

**Set shape.** `hueFamilySet(target, {size=3, radius=6, table}) → string[]` of **namespaced** block
ids, ordered **dark→light by Lab L** (so height can map to lightness). `target` is a bare/namespaced
block id *or* an `rgb`/`lab`. Algorithm: resolve `targetLab` (id → table lookup; rgb → `srgbToLab`),
rank all table blocks by `deltaE`, take the nearest `size` **whose ΔE ≤ radius**, always keep ≥1 (the
nearest). The nearest is the target itself when the target is a table block. `radius` (default 6 ΔE)
keeps the set same-hue — verified the stone neighbourhood is well within 6 ΔE; a sparse neighbourhood
yields a smaller set (2 instead of 3) rather than reaching for a far, off-hue block.

## D2 — The noise + height-variation model (how a cell picks its block)

Requirements: deterministic (no `Math.random`), top/bottom differ ("light break"), modest by default
(clean color fields), and every pick from the set.

- **Option A — flat random over the set, no height term.** Texture but no light break. Fails the
  height-variation AC.
- **Option B — discrete height bands, each a different mix ratio.** Clear banding; "bands" is an extra
  knob and band seams can read as hard stripes.
- **Option C — continuous height-driven center + per-cell hash jitter (chosen).** Order the set
  dark→light (index `0..S-1`). For a cell, let `t = (y - minY)/(maxY - minY)` ∈ [0,1] over the
  occupied bbox. The selection *center* tracks height: `center = t·(S-1)` (bottom favours the darkest
  member, top the lightest — light catches the top). A per-cell hash `h ∈ [0,1)` jitters it:
  `idx = clamp(round(center + (h − 0.5)·2·spread), 0, S−1)`.

**Decision: C.** One continuous gradient gives the light break *and* the noise from a single, pure
formula. `spread` (default **0.7**, "modest") controls how much the hash perturbs the height center:
small spread → mostly the height-appropriate block with light texture at band edges (clean fields);
larger spread → more mix. Determinism comes from a pure integer hash of `(x, y)` (xorshift on
`x·73856093 ^ y·19349663`), normalized to [0,1). Top vs bottom differ because `center` moves with `t`
— the height-variation AC is satisfied structurally, not by luck. With `S=1` (degenerate, no
neighbours) every cell picks index 0 — valid, though height variation collapses; the default stone
target guarantees `S≥2` so tests see real variation.

Why not bias the *mix ratio* instead of the center: a ratio shift still needs an ordering and a
threshold per band; the center+jitter form is the same idea with fewer knobs and a cleaner test
("does the bottom-band material multiset differ from the top-band's?").

## D3 — Surfaces / regions (what "for each region/surface" means here)

There is no region-segmentation engine yet (Research §intent). Options:

- **Option A — one surface = all occupied cells, single target.** Simplest; the run-015 effect over
  the whole silhouette. Loses multi-material facades.
- **Option B — surfaces from `intent`, default to one.** `intent.material.surfaces` (optional) is a
  list of `{target, region}` where `region` is a predicate `(x,y)→bool` or a list of `[x,y]`; cells in
  no explicit region fall to a default surface (target = dominant palette block). Each surface gets
  its own hue-family set.
- **Option C — auto-segment by occupancy/connected-components.** Out of scope; no detector exists.

**Decision: B**, implemented minimally. The common path is one surface (no `intent` → whole
silhouette, stone fallback; or `intent.material.palette` present → target = its dominant/first block).
Multiple surfaces are supported but lightly: explicit regions win, the rest get the default surface.
This matches the spine's "intent is optional, the pass defines its sub-shape" stance and gives T-028 a
template for reading `intent`.

## D4 — The `intent` sub-shape this pass reads

```
intent.material = {
  palette?:  string[] | [{block, coveragePct?}]   // design manifest or E-10 extracted palette
  surfaces?: [ { target?: BlockId|rgb|lab, region?: (x,y)=>bool | [[x,y],...], size?, spread? } ]
  size?:     number   // set size, default 3
  spread?:   number   // noise spread, default 0.7
  radius?:   number   // ΔE radius for the set, default 6
}
```
All optional. `palette` keys may be **bare or namespaced** — normalized on the way in. The default
surface's target = `palette[0]` (or its highest-coverage entry) else `MASSING_BLOCK` (`stone`).

## D5 — Locking & composition (must not break T-028)

The stage writes **only `material`** on **occupied** cells (skip air — never materialize an unoccupied
cell, which would change `occupied`). It never writes `relief`. Run via `runStages(massedState,
[materialStage], intent)`: `changedFields` sees only `material` change → locks exactly `material`;
`occupied` stays locked from massing; `relief` stays free for T-028. A follow-on stage that tries to
repaint a cell's `material` then throws `LockViolationError` — the composition proof. Writing the same
material twice is a no-op (the draft's same-value rule), so re-running is idempotent.

## D6 — Compile

`toDesignArtifact` already maps `cell.material ?? defaultBlock` and derives the manifest from placed
blocks — so a fully-painted surface compiles to a **multi-entry manifest** (the hue-family set) with
no compile change. Provide a thin `compileMaterial(state, opts)` that stamps a material-pass style and
forwards opts (parallels `compileMassing`); `defaultBlock` only covers any occupied-but-unpainted cell
(shouldn't occur when a surface covers all occupied cells, but keep `stone` as the safe default).

## D7 — Public API & convenience

Mirror massing's ergonomics: export `material(state, intent) → state` (the convenience that builds the
stage and runs it through `runStages`), plus `materialStage(intent)` (the bare stage for hand
composition), `hueFamilySet`, `compileMaterial`, and `MATERIAL_STYLE`. Add all to `index.mjs`; update
`README.md`'s pass list.

## Rejected globally

- **Editing `cielab.mjs`** (D1-A) — keeps cross-epic churn out; portable core stays zero-feature-creep.
- **Floyd–Steinberg / multi-hue dithering** — explicitly out of scope; this is same-hue texture noise.
- **Storing the chosen set on the state** — derive on demand; nothing to drift, mirrors `proportionsOf`.
