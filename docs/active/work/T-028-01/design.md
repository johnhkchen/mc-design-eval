# T-028-01 — Design: self-shadow relief pass

Decisions for the seed relief stage (pass B), each grounded in Research. The pass is one new module
`src/sculptor/relief.mjs` that imports **only the spine** (build-state, orchestrator, compile) plus
`MASSING_BLOCK`-free geometry — relief is purely Z-depth, so unlike material it needs **no E-10 color
engine**. It mirrors `material.mjs`'s ergonomics so T-028 reads as the obvious sibling of T-027.

## D1 — How relief is represented (Z model)

The state's `relief` field is an integer Z-depth (`defaultCell()` → 0). The compile already writes
`pos:[x, y, relief]`, and the schema allows negative Z. So the three legal-geometry moves reduce to a
per-cell integer in `{-1, 0, +1}`:

- recess / window → **−1** (inset; self-shadow)
- trim / cornice / frame → **+1** (pop; cast shadow under the lip)
- horizontal line (cornice / eave / base) → **+1** lip on the line course (overhangs the row below)

**Decision: discrete integer relief, no sub-voxel/curve.** Z is the integer voxel lattice; there is no
fractional depth in this model (curve is a *separate* future pass — see review's routing table, which
keeps `ringing→curve` distinct from `flat→relief`). Modeling "lip/overhang" as a +1 pop on the line
course is the faithful voxel realization: the lip projects one cell forward, so the course beneath sits
in its shadow. Rejected: a continuous depth float (compile only consumes integer Z; would need
rounding anyway), and a dedicated "overhang" Z value like +0.5 (illegal — schema is integer).

## D2 — Feature model: type → relief value

A **feature** is `{ type, region }`. `type` is from a small closed vocabulary mapped to a relief value
by one table `FEATURE_RELIEF`:

```
recess, window            → inset (default -1)
trim, cornice, frame,
  lip, eave, base         → pop   (default +1)
```

- **Option A — features carry a raw `relief` number.** Maximal flexibility, but pushes the
  legal-geometry policy onto the caller and lets an illegal/odd Z (e.g. −3) through.
- **Option B — features carry a `type`; the module maps type→value, with two tunables `inset`/`pop`.**
  The legal moves live in code (the ticket's three rules), the caller names *intent* ("this is a
  window") not raw geometry, and `intent.relief.inset/pop` lets a plan deepen the effect uniformly.

**Decision: B.** It encodes the ticket's three named moves as the module's vocabulary (parallels
review's closed defect vocabulary and material's hue-family policy living in the module). A feature
whose `type` is unknown throws (a typed guard, like `assertDefect`) so a typo can't silently no-op.
`inset` defaults −1, `pop` defaults +1; both overridable on `intent.relief` for a deeper facade.

## D3 — Region resolution & precedence (reuse material's partition)

Relief partitions occupied cells exactly like material's `resolveSurfaces`:

- `intent.relief.features = [{type, region}]` — explicit features claim cells **in order** via a
  `claimed` Set; first feature to claim a cell wins (deterministic overlap resolution).
- `regionPredicate(region)` is the **same** helper shape as material: `null`→all remaining, a
  `(x,y)→bool` predicate, or a `[[x,y],…]` list.
- Cells claimed by no feature keep `relief:0` (flat) — relief is sparse by nature; most of a facade is
  flat wall.

**Decision: reuse the material partition pattern**, but relief does *not* need a "default surface"
covering all remaining cells (material must paint every cell; relief must NOT — flat wall is the
common case). Only claimed cells get a non-zero relief written.

## D4 — Simple detection over occupancy (the no-/sparse-intent path)

The ticket allows "simple detection over the material/occupancy." Options:

- **Option A — no detection; relief only does what intent says.** Then the bare
  `massing→material→relief` chain (no relief intent) produces *zero* relief and the metric AC fails on
  that path. Pushes all responsibility to the caller.
- **Option B — minimal geometric auto-detection of horizontal lines.** Detect the topmost occupied
  row of the bbox as a **cornice/eave lip** (+1) and (optionally) the bottom row as a **base** course.
  Pure occupancy scan (the `proportionsOf` bbox idiom). Cells already claimed by an explicit feature
  are skipped (explicit wins).
- **Option C — window/recess detection (interior holes, dark-material blobs).** Needs segmentation /
  material inspection; no engine exists (Research). Out of scope.

**Decision: B, top-row cornice lip on by default; base course off by default.** `intent.relief.detect`
(default `true`) toggles it. This gives the framework proof teeth: even with no plan annotations, the
chain yields a measurable Z-variance (a cornice is the single most universal facade relief), and it is
honest "simple detection over occupancy." Detection is *additive and last* — explicit features take
precedence; detection only writes still-flat cells. Rejected C (no detector; would couple relief to
material and color, breaking the "relief is geometry-only" boundary). Base-course defaults off to keep
the default effect minimal and predictable (one clean cornice line); a plan opts in via
`detect:{cornice:true, base:true}` or an explicit `base` feature.

## D5 — Determinism & no jitter

Material needed a per-cell hash because its choice was continuous over a set. Relief is a **discrete
classification** (a cell is in a feature region or not; its Z is the feature's value). So relief is
deterministic *without* any hash — same state + same intent → same relief, cell for cell. **Decision:
no `cellHash`/randomness in relief.** Simpler, and the determinism AC is structural.

## D6 — Locking & composition (the headline AC)

The stage writes **only `relief`**, and only on occupied cells (never materialize air — that would
change `occupied`). It never writes `occupied` or `material`. Run via `runStages(materialLocked,
[reliefStage], intent)`:

- `changedFields` sees only `relief` change → locks exactly `relief`.
- `occupied` (massing) and `material` (material-noise) stay locked — and because the stage's patches
  only carry `relief`, the draft never even attempts to change them (no `LockViolationError` on the
  happy path).
- Proof tests: a follow-on stage that tries to change `relief` throws `LockViolationError`; a
  draft-bypass that changes `relief` is rejected with `StageRejectedError`; and a stage trying to
  change the still-locked `occupied`/`material` also throws — relief did not loosen those locks.

Writing the same relief twice is a no-op (the draft's same-value rule) → idempotent re-runs.

## D7 — The "less flat" metric (AC #3)

Add a pure projection `reliefMetrics(state)` (parallels `proportionsOf` — derived, never stored):

```
reliefMetrics(state) → {
  occupied,            // count of occupied cells
  relievedCount,       // occupied cells with relief !== 0
  coverage,            // relievedCount / occupied        (0 when flat)
  variance,            // population variance of relief over occupied cells (0 when flat)
  min, max, range,     // relief extremes and max-min
}
```

Massing-only and material-only states have every `relief === 0` → `coverage:0, variance:0, range:0`.
After the relief pass both `coverage` and `variance` are `> 0`. The AC test asserts the *increase*
against the prior states. **Decision: provide both coverage and variance** (the AC says "a
relief-coverage *or* Z-variance metric increases" — supplying both makes the test robust and gives the
review critic a quantitative "flatness" signal).

## D8 — Compile

No compile change (relief already maps to Z). Provide a thin `compileRelief(state, opts)` that stamps
`RELIEF_STYLE` and forwards opts (parallels `compileMassing`/`compileMaterial`). Because the chain ran
material first, compiled blocks are the hue-family manifest; relief only moves their Z. The
exclusion-proof test reads `compileRelief` output: `placements.length === occupiedCount`, and a
recessed cell's lone placement has `pos[2] === -1` (no buried front block).

## D9 — Public API & convenience (mirror material)

Export: `relief(state, intent) → state` (convenience), `reliefStage(intent)` (bare stage),
`reliefMetrics(state)`, `compileRelief(state, opts)`, `RELIEF_STYLE`, `FEATURE_RELIEF`, and the
typed-guard `assertFeatureType`. Add all to `index.mjs`; add a `relief.mjs` bullet to `README.md`.

## Rejected globally

- **Raw per-feature Z numbers** (D2-A) — keeps the legal-geometry policy in the module.
- **Window/recess auto-detection** (D4-C) — no segmentation engine; would couple relief to material.
- **A per-cell hash / continuous relief** (D1, D5) — Z is integer and relief is a discrete class.
- **Storing metrics or the chosen features on the state** — derive on demand (mirrors `proportionsOf`).
- **A default surface covering all cells** (D3) — flat wall is correct; relief is sparse.
