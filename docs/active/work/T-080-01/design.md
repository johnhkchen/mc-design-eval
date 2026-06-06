# Design — T-080-01 hollow-the-mass

Decide how to carve a solid mass into a hollow shell + structure, deterministically, without breaching the
exterior, reusing the E-23 substrate. Grounded in `research.md`.

## The core decision: how do you "remove" a voxel?

### Option A — append an `air` placement (REJECTED)

Treat carving as recolor-to-air: append `{op:"voxel", block:"minecraft:air"}` at each carved cell.
- ✗ **There is no air op** in the project's stance (`facade-recess-by-exclusion`); `expand.mjs` has no
  delete and `air` is not in any build manifest, so the artifact would fail the AJV gate
  (`prompt-vs-live-artifact-schema`).
- ✗ Even if validated, a rendered `air` block is not nothing — it's a transparent block in the voxel world,
  not absence. The interior would not actually be empty.

### Option B — flatten-by-exclusion (CHOSEN)

Expand the artifact to explicit voxels, drop the carved keys, re-emit the **kept** cells as `{op:"voxel"}`
placements: `placements' = expandArtifact(artifact).filter(v => !remove.has(key(v))).map(toVoxel)`.
- ✓ Respects the no-air-op contract: a voxel is gone because it is **not placed**, exactly the
  carve-by-exclusion principle.
- ✓ `expandArtifact` is order-independent and full-replace, so the kept cells re-expand **byte-identically**
  (same block + state per pos). Nothing about the kept geometry changes.
- ✓ Manifest-safe: only existing block ids are copied; no new material → stays AJV-valid.
- ✓ Pure, deterministic, trivially unit-testable on synthetic occupancy.
- ⚠ The output artifact loses the compact `box`/`fill` ops (one `voxel` per kept cell; ~6.4k for the
  cottage). Acceptable: artifacts are machine-generated, the render is identical, and determinism matters
  more than placement compactness for a measurement instrument. Documented as a known trade.

### Option C — carve as a `box`/`fill` of air over the interior (REJECTED)

A single `fill` op over the interior AABB, block air. Same air-op + AABB-not-shape problems as A, plus it
cannot follow a non-convex interior. Out.

## How is the removable set marked? (AC #1)

A voxel is removable iff it is **enclosed** (all six ortho neighbours occupied — *not on the skin*) AND
**not protected structure**. Two sub-decisions:

### Reuse the enclosed-mass definition, don't fork it

`surface-coherence.enclosedMassKeys` already returns the enclosed key set (and `hollowableCore` counts the
same). **Export `enclosedMassKeys`** and import it (T-080 depends_on T-084 — correct direction). One
definition, no third copy (`parallel-roots-duplicate-shared-deps`; mirrors `airComponents` being the single
enclosed-vs-border rule). Rejected: re-deriving the 6-neighbour loop in `hollow-carve.mjs` (drift risk).

### Protect structure — two pure-geometric keep sets, caller-composable

The carve core takes a `keep: Set<key>` it always retains even if enclosed. Two pure helpers feed it; the
core never hard-codes a structural heuristic (so the unit tests pin behaviour with explicit keeps, and the
live run composes the geometric ones):
- **`cornerPostKeys(occ)`** — every voxel in the 4 footprint-bbox-corner (x,z) columns. Matches "corner
  posts" verbatim; always safe (corner columns are what the skin hangs on).
- **`tallColumnKeys(occ, {minSpanFrac})`** — every voxel in columns whose occupied y-extent ≥ `minSpanFrac`
  of the build height. Captures the **chimney shaft** and any **floor-to-roof post** — "anything the skin
  needs". For an *articulated* building (open interior) only genuine full-height members qualify; we do not
  apply it to a fully-solid mass (where every column is full-span — see the trade below).

**Why keep is opt-in, not baked into the core.** A fully-solid TRELLIS mass has *every* interior column
full-height, so `tallColumnKeys` there would protect everything. The core's contract is the minimal,
always-correct rule — *enclosed minus keep* — and the caller chooses the keep set appropriate to the
subject. The cottage (already articulated) uses corner posts ∪ tall columns; a solid mass would use corner
posts only (or detector-driven regions). This keeps each piece independently correct and testable.

### Honour the detector (AC #1's metered path)

`markHollowable(occ, {keep, regions, inset})`:
- `regions` (from `parseHollowable`): if present, restrict removal to cells whose `y` falls in some
  `[yStart,yEnd]` band — the model said *which* mass is safe.
- `inset` (from the detector, default 1): keep an `inset`-thick wall. `inset=1` is the enclosed set itself;
  `inset=k` erodes `k-1` times (a cell survives erosion only if all 6 neighbours are also in the set), so
  thicker walls remain. Deterministic morphological erosion.
- `blockers`/watertight: the *runner* gates — if the detector reports blockers (or `watertightCheck` fails
  on the skin), it logs "seal first" and still carves the enclosed mass (exterior-safe regardless), so the
  cavity size is recorded honestly. The seal-before-hollow ordering is satisfied by feeding the **already
  sealed** T-084 artifact.

## How is "exterior unchanged" proven? (AC #3, #4)

### The proof is PURE; the render is a confirmation

Because removed cells are all enclosed, no front-most ortho surface voxel can change. So:
- **`exteriorSurfaceDigest(occ)`** — a stable string over all 6 `ORTHO_DIRS`: for each, the filled
  surface cells as `dir|x,y,z=block`, sorted, joined. The exterior render is a deterministic function of
  these front-most voxels, so **digest(before) === digest(after)** is a proof the render is identical.
- **`exteriorHeld(before, after)`** → `{held, digestBefore, digestAfter}`.
- The runner *also* renders before/after (threeQuarter, front, top) so a human can eyeball the triptych and
  diff PNG bytes — but the digest is the load-bearing proof (renders can carry GL nondeterminism; the
  digest cannot). AC #3's "resemblance verdict does not regress" is then trivially met: identical exterior
  voxels → identical resemblance.

Rejected: relying on a PNG byte-diff or a resemblance *score* delta as the primary proof — both are noisier
than the exact projection equality the geometry guarantees.

## Block-count / cavity record (AC #4)

`cavityReport(occ, remove)` → `{ before: occ.size, removed: remove.size, after: occ.size - remove.size }`.
The runner writes this plus the exterior-held digests and the watertight before/after into a
`hollow-report.json`, mirroring T-084's `surface-coherence-report.json`.

## Module boundary

New PURE module `src/view/hollow-carve.mjs` (under the test glob), exports above + `carveArtifact` and a
`carveOccupancy` (re-`occupancyFromCells` of the kept cells, for measurement without a re-expand). The
metered/GL runner is `benchmarks/sculpture/hollow-cottage.mjs` (`npm run hollow:cottage`). One additive
export (`enclosedMassKeys`) in `surface-coherence.mjs`. No behaviour change anywhere else.

## What this ticket is NOT

- Not closing intended openings (doors/windows) — that's strong-tier `seal-authoring` (T-082 reserved).
- Not placing rooms/floors inside the cavity — S-080's later work; this delivers the empty hollow.
- Not re-compacting the carved artifact back into `box`/`fill` ops — out of scope, determinism first.
