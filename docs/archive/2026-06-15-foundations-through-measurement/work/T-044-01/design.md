# T-044-01 — Design: region-lock-and-observe

Decisions, with the alternatives weighed against the research. Three design questions:
**(D1)** how a region is addressed and what R is; **(D2)** how the lock is enforced and what its
guarantee actually protects; **(D3)** how observe crops without new camera math and stays GL-isolated.

## D1 — Region addressing: what `spec` accepts and what `R` is

A region must be expressible three ways (AC #1): an explicit **bbox**, a **named part**, or a
critic **`where` string**. The unifying observation: all three reduce to **integer sub-bounds**
`{min:[x,y,z], max:[x,y,z]}` over the artifact's overall extent.

### The named-part problem (and the chosen resolution)

Research surfaced the hard constraint: there is **no part registry**, and semantic orientation
("head" vs "tail") is **not recoverable** from the artifact (koi eyes sit at min-x — a "front=max"
guess is wrong). Options considered:

- **(a) Semantic body-part map** (head/body/tail/fin → boxes). *Rejected:* needs per-subject
  metadata that does not exist; any built-in guess is wrong half the time — unacceptable in a
  measurement instrument.
- **(b) Geometric direction vocabulary** — a fixed, documented map from *geometric* names
  (`top/bottom/left/right/front/back/core/middle`) to fractional slabs of the overall bounds.
  *Chosen.* These are unambiguous geometric directions (low/high along an axis), deterministic, and
  honest: they make no claim about anatomy. A caller who knows where the koi's head is passes a
  **bbox** (they read it off the design doc); the named vocabulary is for "tighten on the top third,"
  "the back end," etc. — exactly the granularity a region-scoped loop needs.

The vocabulary, resolved against overall bounds `B` with a configurable `fraction` (default `0.5`):
- **major axis** = the longer of the two horizontal axes (x vs z); **vertical** = y.
- `top`/`bottom` → outer `fraction` slab along **y** (high/low). `upper`/`lower` aliases.
- `left`/`right` → outer slab along the **minor** horizontal axis.
- `front`/`back` → outer slab along the **major** horizontal axis (documented: `front` = max end,
  `back` = min end — a stated geometric convention, not an anatomical claim).
- `core`/`center` → central `fraction` cube on **all** axes. `middle` → central slab on major axis.

### The `where` string

The critic's `where` is free text. We **keyword-match** it against the same geometric vocabulary
(case-insensitive token scan); if ≥1 keyword hits, R = the **union** of the matched slabs' bounds
(clamped to B); if **none** hit (or `where` is empty), R = the **whole** build bounds (a no-op crop
= observe the whole thing). This is deliberately conservative: an unparseable `where` never throws
and never silently selects the wrong corner — it falls back to the full build. (E-11 passed `where`
through verbatim; T-044 takes the first step toward parsing it, with a safe default.)

### What `R` carries

`R = { spec, subBounds:{min,max}, placements, indices, fraction }`:
- `subBounds` — the integer bbox (AC: "its integer sub-bounds"), clamped to B and to integers.
- `placements` — the **in-region placement set** (AC), and `indices` their positions in the
  original array (needed to rebuild the artifact preserving out-of-R order).
- A frozen object; `selectRegion` is pure.

`subBoundsOf(R)` is a one-line accessor returning `R.subBounds` — the exact value `framedCamera`
consumes (D3).

### In-region membership (the partial-overlap decision)

A placement is **in R** iff its **own bbox is fully contained** in `subBounds` (voxel: `pos` inside;
fill/box/line: both normalized corners inside). Rationale weighed against the alternative
("any-overlap = in R"):
- **Full-containment (chosen):** out-of-R placements are exactly those the lock freezes whole — no
  placement is ever half-edited; the lock guarantee becomes clean and testable (below). A fill
  straddling the boundary is **frozen** (it is not fully in R); the loop simply can't rewrite the
  cells it owns this round — additive and safe, the P14 spirit.
- **Any-overlap (rejected):** would force splitting a straddling placement to edit only its in-R
  part — exactly the kind of structural surgery that invites the P14 detach-a-mass regression.

## D2 — The region-lock: enforcement and guarantee

E-11 locks **fields** and throws at the write site. The spatial analog: the **cells outside R are
frozen**, and an edit may only change cells **inside `subBounds`**. The guarantee we enforce is
stated over **cells**, not placements (research showed the lock's real subject is cells):

> **Invariant:** after `applyRegionEdit`, every voxel at a coordinate **outside `subBounds`** is
> byte-identical (block + state) to before. Only cells inside R may change.

### `applyRegionEdit(artifact, R, edit)`

- `edit` is either an **array** of replacement in-R placements, or a **function**
  `(inRegionPlacements) => newPlacements` (so a procedural pass or an LLM editor both fit). The
  function form receives `R.placements` (the current in-R set).
- **Validation (the lock):** every voxel of every placement in the edit result must lie within
  `subBounds`. Computed via `expandPlacement` (reusing `src/expand.mjs` — also inherits its line
  guard). Any voxel outside → throw **`RegionEditOutOfBoundsError`** (named, `.code =
  "region_edit_out_of_bounds"`, carries the offending placement index + the first stray coord),
  mirroring E-11's `LockViolationError`. This is what "rejects any edit that adds/removes/moves a
  placement outside R" means concretely: a moved/added placement whose cells leave R is rejected;
  removing an out-of-R placement is **impossible** because the edit only replaces the in-R set —
  out-of-R placements are carried through untouched.
- **Result assembly:** `out-of-R placements (original order) ++ validated in-R placements`. Because
  in-R cells ⊆ `subBounds` and out-of-R placements are unchanged, the invariant holds by
  construction. The new `palette.manifest` is rebuilt as the **deduped union** of every placement's
  block (like `compile.mjs`), so a swap-in block is declared and the artifact stays schema-valid
  (manifest non-empty/unique). Metadata/style/version copied through. **Pure** — input frozen,
  output a fresh object; caller runs it through `assertArtifact` (the AJV gate, AC #2).
- **Schema floor:** if the edit yields **zero** placements (empties R *and* R was the whole build),
  the result would violate `minItems:1`; `applyRegionEdit` throws a clear error rather than emit an
  invalid artifact. (An edit that empties R but leaves out-of-R placements is fine.)

Why over-R cells *shared* with a frozen straddler may still change: a straddler is out-of-R, kept,
and appended-before; an in-R edit placement appended-after wins last-writer at shared **in-R** cells
only (its voxels can't reach outside `subBounds`). So the straddler's out-of-R cells are untouched —
the invariant is about coordinates outside `subBounds`, which is exactly what we assert.

## D3 — Observe: tight crop, no new camera math, GL-isolated

`observeRegion(artifact, R, opts) → {path, bytes, view, bounds}`:
- **Crop = full world, camera framed on R.** Research showed `renderWorldToPng(world, center,
  {bounds})` already routes `opts.bounds` into `framedCamera(opts.bounds, opts.view)`. So observe
  builds the **whole** artifact's world (context blocks present) and frames the camera on
  `subBoundsOf(R)`. This is the truest "tight crop on a section" and reuses the existing primitive
  verbatim — `framedCamera(subBoundsOf(R))`, exactly as the ticket specifies. (Alternative —
  render only R's placements as a sub-artifact — was rejected: it drops surrounding context, so the
  section is observed out of its build, defeating "look closely *at one section* of the build.")
- **GL isolation (E-11 review seam).** `observeRegion` lives in the same module as the pure region
  functions **but lazy-`import()`s** `world.mjs` + `render.mjs` (and re-exports `GL_AVAILABLE`), so
  importing the module for the pure unit tests loads **no GL** — identical to `review.mjs`'s
  `defaultRender`. The pure tests never call `observeRegion`; the **one live crop render** proof
  (AC #4) is a **GL-gated** test in `render/test/` (where GL tests already live and run separately
  from `npm test`), driven on the committed koi artifact (`009-*-koi-fish`). Thus `npm test`
  (`src/**/*.test.mjs`) stays green and GL-free, and the live proof runs under `render/`'s own
  `node --test` when GL is present (it is, here).

## Module placement

New directory `src/revise/` (the E-15 surgical-revision-loop home; S-045/S-046 will add the loop
and the LLM editor beside it). Files: `src/revise/region.mjs` (+ `region.test.mjs`), and the live
proof `render/test/observe-region.test.mjs`. This avoids any file collision with the parallel root
ticket T-043-01 (the form metric), which has no reason to touch `src/revise/region.mjs`.

## What this design explicitly does **not** do

No control flow (no loop, no accept-gate, no diagnosis) — those are S-045+. No LLM editor — S-046.
No GLB target — S-047. No semantic part registry. `observeRegion` returns a path/report, not a
metric. This ticket builds the **two primitives** only.
