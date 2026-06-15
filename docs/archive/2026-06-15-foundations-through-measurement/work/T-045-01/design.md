# T-045-01 — Design: deterministic-revision-loop

Decisions weighed against the research. Five questions: **(D1)** the loop's shape and what a "region
picker" is; **(D2)** the accept-gate + rollback; **(D3)** the spatial lock (accepted regions); **(D4)**
the scoped procedural tweak at the placement level; **(D5)** the seams — score / diagnose / observe —
that keep the loop pure & deterministic while leaving a live path for later.

## D1 — Loop shape: an explicit region list, not an autonomous picker

`reviseLoop(artifact, opts)` iterates regions in a **deterministic, caller-supplied order**:
`opts.regions` is an array of region specs (the same specs `selectRegion` accepts: bbox / `{part}` /
`where` / raw). This *is* the "pick region" step.

- **(a) Caller supplies an ordered region list (chosen).** Deterministic by construction (no hidden
  ordering), trivially testable, and honest: "which regions to revise, in what order" is a strategy
  decision the harness owns, not something the cage should guess. A future smarter picker is just a
  different list.
- **(b) Loop auto-discovers regions** (e.g. from the diagnosis `where`). *Rejected for now:* couples
  region selection to the (model) critic, fights determinism, and is exactly the autonomy S-046+ adds.

The loop walks the list once, in order, applying the per-region budget at each. This bounds the work
to `regions.length × perRegion` — termination is **structural** (D2), not dependent on any tweak ever
improving the score.

**Return:** `{artifact, trace, iterations, converged, locked}`. `trace` is a per-iteration array — the
ticket's required "region, defect, tweak, score before/after, accepted?" plus `iteration` and a
`reason`. `converged = true` iff the loop terminated by exhausting the region list (not by hitting
`maxIterations`). Pure: the input artifact is never mutated; `current` is rebound to fresh artifacts.

## D2 — The accept-gate and rollback

Per region `R`, the loop tries up to `budget.perRegion` candidate tweaks for the routed defect. The
gate is the heart of the cage:

```
before = await score(current, R)                 // computed once per region (current only changes on accept)
for attempt in 0 .. perRegion-1:
  candidate = applyRegionEdit(current, R, tweakFor(route, attempt, intent))   // lock-checked
  after = await score(candidate, R)
  if after > before + epsilon:  current = candidate; lock(R); record(accepted); break
  else:                         record(rejected/rolled-back)                  // current UNCHANGED
```

- **Accept iff strictly improved** (`after > before + epsilon`, `epsilon` default `0`). Equal or worse
  → **roll back** = simply *do not rebind* `current` (it still points at the pre-tweak artifact;
  `candidate` is dropped). Rollback is therefore free and total — there is no partial state to undo,
  because `applyRegionEdit` is pure and returns a fresh object we discard.
- **`before` once per region:** within a region `current` only changes when we accept, and on accept
  we `break`. So `before` is stable across the region's attempts — one score call, not `perRegion`.
- This directly yields the AC's negative test: feed a `score` that never rises (or a `material` tweak
  that cannot move a form score) → no attempt is accepted → the returned artifact is **deep-equal to
  the input**.

## D3 — The spatial lock: an accepted region is never re-edited

T-044-01 already guarantees **no out-of-region bleed** (every cell outside `subBounds` is
byte-identical after `applyRegionEdit`). The loop owns the *other* half: **an accepted region must not
be re-entered.** Design:

- The loop keeps `locked: Array<subBounds>`. On **accept**, push `R.subBounds`.
- Before editing a region, if `R.subBounds` **intersects** any locked box, the region is **skipped**
  (trace `reason:"locked-overlap"`), never edited. Intersection is the natural 3-D box-overlap test
  (reusing the integer-geometry idiom already in `region.mjs`).
- Rejected regions are **not** locked — but they are also not retried, because the loop visits each
  list entry exactly once. (Per-region attempts happen *within* one visit.) So a non-improving region
  is abandoned after its budget, not looped on — termination holds either way.

Why lock by **bounds** rather than by placement identity: placements are replaced wholesale by an
edit, so identity is unstable; the spatial box is the stable, checkable thing — and it is exactly the
unit T-044-01's invariant is stated over. The test asserts: two overlapping specs, first accepted →
the second is skipped and its cells are untouched.

## D4 — The scoped procedural tweak (placement-level relief / material)

Research found the boundary mismatch: E-11's `relief`/`material` operate on a `BuildState`; the loop
has only a `DesignArtifact` + `R`. We therefore implement the **placement-level analogues** — the same
two ideas, expressed as `(inRegionPlacements) => newPlacements` editors bounded to `R`:

- **`reliefPass` — the Z (depth) move.** Shift each in-region voxel's Z by `delta` (E-11's pop/inset
  vocabulary: `+1`/`-1`), **clamped to `subBounds.z`** so the pass is well-behaved (never asks the lock
  to throw). Handles `voxel` (`pos[2]`) and `box/fill/line` (`from[2]`/`to[2]`). Under the 3/4 camera a
  depth change moves the projected silhouette — so this is the pass that *can* raise a form score.
- **`materialPass` — the block swap.** Remap each in-region placement's `block` to a target (positions
  unchanged → always in-region). Geometry-invariant, so under a silhouette score it is a **no-op** that
  the accept-gate rolls back — the honest demonstration that the gate rejects non-form edits.

`tweakFor(route, attempt, intent)` selects the editor from the **E-11 route vocabulary** (imported
`ROUTING_TABLE`/`ROUTE_TARGETS` from `review.mjs` — pure, no GL): `relief → reliefPass`,
`material → materialPass`; `attempt` steps the parameter (relief alternates `+1`/`-1`; material steps a
small target list); any other route → an **identity** editor (safe no-op, rolled back). The passes
clamp themselves, but `applyRegionEdit`'s lock remains the enforcement for arbitrary (future LLM)
editors — belt and suspenders, by design.

**Determinism:** both passes are pure integer transforms with no hashing/RNG; `tweakFor` is a pure
function of `(route, attempt, intent)`. Same inputs → same edit.

## D5 — The seams: score, diagnose, observe (pure tests load no GL)

Three injectable seams keep the loop both deterministic-by-default and live-capable:

- **`score(artifact, R) → number` (the form metric).** This is the **live render seam**: the default
  (`liveFormScore`) lazy-imports the render stack, renders the artifact, and calls
  `formFidelity`/`formFidelityFromPair` against a concept reference (whole-object IoU by default; a
  caller may pass a 2-D `region` for `regionIoU`). Pure unit tests **inject a synthetic deterministic
  score**, so they load no GL — the metric's contract (a number that goes up when form improves) is all
  the loop needs.
- **`diagnose(artifact, R, observation?) → {defect, where, route}[]`.** Default = **`proceduralDiagnose`**,
  a *model-free geometric* stand-in (AC #3): inspect R's in-region voxels — zero Z-variance → `flat`
  routed to `relief`; a single uniform block → routed to `material`; else clean. It reuses E-11's route
  vocabulary so the wiring is identical when the model critic drops in (T-046-01). **No model call.**
- **`observe(artifact, R)` (optional).** The listed pipeline has an `observeRegion` step feeding the
  critic. Since the default diagnosis is geometric (needs no image), `observe` defaults to **undefined
  and is skipped** — so the default path renders **only** for scoring, and pure tests (synthetic score)
  load no GL at all. A caller wanting the real critic passes `observe: observeRegion` + a model
  `diagnose`; the loop awaits and forwards the observation. This honors AC #1's shape without forcing GL
  into the deterministic proof.

**Module boundary (mirrors `region.mjs`):** the loop's pure graph imports only `region.mjs`,
`tweak.mjs`, and the pure parts of `review.mjs` — **no** top-level `render/world/gl`. The live `score`
default reaches the render stack by `await import()` only. A **static import scan** test (the Group-E
idiom) enforces this.

## What this design explicitly does NOT do

No model/SDK call (T-046-01). No GLB target (T-047-01). No autonomous region discovery. No 3-D→2-D
projection for `regionIoU` (whole-object IoU is the default live score; documented limitation). No new
camera/render code — scoring reuses `observeRegion`/`formFidelity` verbatim through the lazy seam.
