# Design — T-149-02

Two gaps, sequenced: (1) the band0 coverage reject (deterministic, gates the cottage judge), then
(2) the first live E-35 slice (facade recognition + relieved build). The band0 fix is **diagnose-then-
branch by construction** — the ticket forbids prejudging, and Research §1 shows the discriminator is a
single yRange print. This document fixes the decision *procedure* and the branch criteria, because the
correct code change is determined by a measurement that must run first.

## Decision 1 — band0: a diagnose-first decision tree, committed in advance

Research established the mechanism with committed counts: band0 reads 0.40 own because the gate's
**concept-derived** band0 zone (`deriveZones` → `extractConceptZoneMap`, concept-pixel boundaries fitted
to the build extent) extends above the build's stone (y0–4) into the white_terracotta upper storey
(y5–19, band1's *correct* dominant). The own-vocabulary metric already includes the preserve set, so
this is **not** the church literal-name class. What remains undetermined is *where band0's upper
boundary lands on the build* and *whether the build's short-stone/tall-white split is legitimate or a
dressing gap*. That is the measurement.

### Step 1 (mandatory, no spend): print the boundary

Run `deriveZones()` on `workshop/cottage/final-artifact.json` with the cottage concept PNG + matMap, and
emit, into `diagnosis.md`: each band's `yRange`, the per-band own/dominant fractions recomputed live
(must reproduce the committed 0.40), and the build's stone→white transition row (y4→y5). One number
decides the branch: `band0.yRange[1]` vs y4.

### Branch A — H-instrument (band0 over-claims; `band0.yRange[1] ≫ 4` and the build's storey split is a
valid realization of the concept proportion at a different absolute scale)

The concept band0 proportion is fitted onto the taller wall-raised build without rescaling, so band0's
zone reaches into rows the build legitimately dressed as band1. Fix lives in the **zone-derivation /
census**, under identity-class discipline (T-095/T-101/T-110/T-100):
- Re-derive the band0/band1 boundary against the build's **own** storey structure (the layer-dominant
  transition the build actually realized), so a wall that is stone-to-y4 then white is zoned band0=[…,4],
  band1=[5,…] — the build's own occupancy, not the concept's unrescaled pixel proportion. The concept
  still supplies *which materials* per storey (the policy), the build supplies *where the storeys split*.
- **Monotone proof**: every previously-passing coverage (all committed gate records — barn, saltcrag,
  fixture, styled, generated, challenge) re-derives byte-identically; `coverage-monotone.test.mjs` stays
  green; own ⊇ dominant preserved. A new unit test pins the boundary-from-build-occupancy behavior.
- **Both arithmetics** reported; committed records untouched; gate contract unmoved.

### Branch B — H-gap (the lower wall is genuinely mis-dressed; band0's boundary is right and the build
left band0's zone white where the concept wants stone)

The component-skin under-dressed band0 — the wall-raise grew the white storey and the stone storey
stayed a thin plinth, so band0's zone really is white where it should be stone. Fix lives in the
**build/skin** (supplying-op fixpoint — `presence-is-a-fixpoint-not-a-census`,
`surface-paint-respects-run-rule`): the component-skin dresses band0's full zone as `stone_bricks`,
re-deriving coverage against the **workshop output**, not a stale reference. No per-building constants.

### Why a decision tree rather than picking now

Picking before Step 1 violates the ticket's explicit "do not prejudge" bar and risks the recurring
failure mode where the band0 reject was the *instrument* (church) — fixing the build when the census was
wrong bakes the bug in. The single yRange print is cheap and decisive. **A naive scale-mismatch is ruled out**: `band-profile.mjs`
already rescales the concept's stone-storey *fraction* onto the build's layer extent
(`mapRowsToLayers(profile.rows, rowExt, layerExt, anchors)`, line 482), so band0's boundary tracks the
concept proportion of the *build's* wall height — not an unrescaled concept pixel. That means the
remaining live hypothesis on the H-instrument side is narrow (a floor-line snap landing the boundary a
few rows off), and the *evidence to date leans H-gap*: the build's stone reaches only y4 while band0's
zone (concept fraction) reaches ~mid-wall, so the component-skin dressed by the build's geometric storey
divide (y4/5) and left band0's upper rows white — the dressing/geometry coupling named in T-143-02
concern 1. The print confirms or flips it. Either branch ends at the same bar: **cottage reaches
coverage-PASS (judge-eligible)** or the residual is named honestly with counts; `--repro`/`--offline`
byte-identical on the touched path.

**Rejected — widen the threshold or add a band0 tolerance.** That is the per-building-constant the
ticket forbids and the `tolerance 0.15 uncalibrated` concern (T-143-02). It hides the mechanism instead
of correcting the zone or the skin.

**Rejected — re-point the coverage census at the reference artifact.** Research §1 confirms the census
is already self-comparing against the judged occupancy; the reference is aperture-only. There is no
stale-reference census path to fix.

## Decision 2 — live facade recognition (cottage + barn)

Use the existing `facade-grammar.mjs` runner unchanged, invoked `--ticket T-149-02` on the subscription
shim, pack `rustic`. Recognition produces a real `facade` block per mass from concept (front faces) +
textured-GLB layout evidence (unseen faces, `layoutOnly:true`), gated by `assertFacadeDiegetic` (roles
only, palette diegetic). Commit `merged.json` / `record.json` / `render.json` / `replies.json`;
`facade:offline` replays byte-identically.

**No new code** — T-145-01 shipped the runner; this is its first real-subject run. The only ticket-level
choice is *which subjects* (cottage + barn, both rustic) and *recording honestly* if a GLB is absent
(facade-render records absence, never fatal — "GL bytes never decide").

**Rejected — author facade grammars by hand.** Defeats the epic's deliverable (recognition is the AI
stage in its native representation). The whole point is *does the model read a facade off the concept*.

## Decision 3 — relieved workshop build (cottage + barn)

Run `pattern-book.mjs --ticket T-149-02 --rotate-pins` after recognition. Because the recognized program
now carries a facade, `seedWorkshopProgram`'s `compileProgram` yields a non-empty articulation plan and
`realizeWithArticulation` folds the four E-35 brushes onto the skin (T-149-01 wiring) — the first real
articulated renders. Commit ledger/digest/final artifact; `patternbook:repro` + `workshop:replay`
byte-identical on the new chain; S-142 witnesses green-or-named-SKIP, recorded. **No judge run.**

**Ordering**: band0 fix → recognition → relieved build → glance → milestone → docs. The band0 fix must
land first because (a) it is deterministic and independently verifiable, and (b) the relieved cottage
build will re-trigger the same coverage path, so the fix must be in place for the glance to read.

**Sequencing risk — recognition/relieved-build share `recognition/cottage.program.json`.** The facade
pass rewrites the recognized program (adds `facade`); the pattern-book then consumes it. This is a
within-ticket sequence, not cross-ticket concurrency, so pin-guard + ordering suffice (no DAG edge
needed). Preflight pins before each spend.

## Decision 4 — the glance & milestone, recorded honestly

Compose `milestone:facade --rotate-pins` (after `:baselines` snapshots the pre-rotation flat-build
texture quotes). Both arithmetics on every row (`overall` kit-aware + `aggregate` budget v2/legacy);
`reliefAware` reports `armed:false` honestly until a relieved *judge* runs (out of scope). Sheets to
`pr/assets/` (cottage + barn: relieved vs flat baseline vs concept). State plainly: does relief deliver,
does the flat box become articulated, does band0 now read. **A still-flat or still-blocked result is the
finding** and scopes the next rung.

## Honesty / environment clause

Live stages need `claude -p` + headless GL. If a stage cannot complete in this environment (shim
unavailable, GL absent, model spend blocked), record the deterministic work that *did* land (the band0
fix with monotone proof + tests, `--offline` replays of any committed material) and name the live stage
as **deferred to the operator runbook with the exact command**, not as done. The band0 fix is the
self-contained deterministic deliverable that stands on its own and unblocks E-34's cottage judge.

## What "done" means for this ticket

1. `diagnosis.md` states the branch with counts (yRange + fractions).
2. The chosen branch's fix lands with monotone proof + a new test; cottage reaches coverage-PASS or the
   residual is named with counts; touched path `--repro`/`--offline` byte-identical.
3. Live recognition + relieved build run (or are named deferred with commands), first articulated
   renders produced where the shim/GL allow.
4. Glance sheets + facade milestone composed; both arithmetics; relief `armed:false` honest.
5. design-learnings E-35 gains the live-build outcome + band0 root cause; pins rotated under T-119 with
   retired pins named; `npm test` green; no per-building constants; subscription shim only.
