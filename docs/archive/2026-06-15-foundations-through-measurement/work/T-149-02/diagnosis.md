# Diagnosis — band0 coverage reject (T-149-02 AC1)

**The mandated first move: state which, with counts, before any fix.** Reproduced offline (no model,
no GL) via `diagnose-band0.mjs`, which calls the gate's exported `deriveZones` on the committed cottage
build. The harness **reproduces the committed own-fractions exactly** (0.398 / 0.410 / 0.451 / 0.437 vs
the four committed views) → the derivation is faithful, the reading below is the gate's own arithmetic.

## Verdict: REAL build-vs-concept divergence — NOT a census/instrument bug.

The build genuinely under-supplies stone in band0's zone. This is the *"if a real skin gap"* branch of
AC2, **not** the church literal-name class.

## The numbers

| quantity | value |
|----------|-------|
| band0 gate-zone (concept-derived) | **y0–12** (dominant `stone_bricks`, concept share **0.919**) |
| band1 gate-zone | y13–22 (dominant `white_terracotta`, concept share 0.992) |
| build wall extent (upperTop) | 23 |
| **build stone (`stone_bricks`)** | **only y0–4** |
| **build white (`white_terracotta`)** | **y5–19** (band1's *correct* dominant) |
| build roof (`spruce_planks`) | y20–23 |
| band0 own-vocab | `[stone_bricks, dark_oak_log, spruce_planks, cobblestone, bricks]` |
| band0 ownFraction (4 views) | **0.398, 0.410, 0.451, 0.437** (all < 0.5 threshold → REJECT) |
| kitPresence band0 fill | surface 1920, filled **1135**, kept 785 (785/1920 = 0.409) |

**Mechanism.** The concept shows a tall stone ground storey: band0 occupies the lower ~13 of 23 wall
rows (~55%) at 91.9% stone. The build put stone in only y0–4 (5 rows, ~22%) and grew the
`white_terracotta` upper storey to 15 rows. The gate's band0 zone therefore covers y0–12, of which y5–12
(8 rows) are `white_terracotta` — band1's *correct* material, but foreign to band0's own set. So band0
reads ~40% own and the coverage gate short-circuits the resemblance judge (T-088 contract).

**Why it is NOT the instrument.** (a) `band-profile.mjs` already rescales the concept's stone-storey
*fraction* onto the build's layer extent (`mapRowsToLayers`), so band0's boundary tracks the concept
proportion of the *build's* height — not an unrescaled pixel. (b) The own-vocabulary metric
(`metric:"own"`) already includes the preserve set; the 60% foreign is genuine `white_terracotta`
(band1's dominant), correctly excluded — this is the opposite of the church case, where a stone-family
block was wrongly excluded under a literal name. (c) The committed standalone `zone-map/cottage.json`
(pre-wall-raise) reads band0=[0,6]/band1=[7,13] — a ~50/50 split — confirming the concept proportion is
stable; the build's 5/15 split is the divergence. The band0 reject is the gate **correctly** flagging
that the build's lower-half wall is white where the concept (and band0's policy) want stone.

This matches T-143-02 finding 4 verbatim: *"the taller band0 the wall-raise produced outran the
component-skin dressing… the dressing must learn to re-derive against the geometry it now moves."*

## Blast-radius of the prescribed fix (the supplying-op settle) — measured

A band-settle that supplies band0's dominant where a foreign block sits, run across the committed
subjects (committed gate `byZone`):

| subject | band0 ownFraction | settle effect |
|---------|-------------------|---------------|
| **barn** (rustic) | **1.000** | no foreign cells → **true no-op, byte-identical** ✓ |
| **barn--saltcrag** | **0.995** | 0.5% residue (the known 5/3337 cells, concern #2) → settle would change **5 cells** |
| **cottage** | **0.398** | re-dress ~1135 cells (y5–12 white→stone) → the intended fix |

**Finding:** a *global* settle is not monotone-clean. It is a true no-op on barn (good) but perturbs
saltcrag's 5 residue cells — saltcrag's coverage already **passes** (0.995 ≥ 0.5), so changing its bytes
violates the AC2 bar *"every previously-passing coverage re-derives unchanged."* Conditioning the settle
on "below the gate threshold" would isolate cottage cleanly, but that couples the **build** to the
**judge threshold** — forbidden by E-31 Rule 1 (workshop is structurally isolated from the frozen gate).

## What the correct fix therefore requires (and why it is not deterministic here)

The faithful fix places the build's stone/white material boundary at the concept band boundary (y12/13)
**at seed/dress time**, so the workshop loop critiques the corrected build and records a self-consistent
conformance + ledger. That means a **fresh live workshop run** (the loop calls the model for critique;
the glance needs GL renders), monotone-verified against the committed chains, with the saltcrag
interaction handled as its own residue. It cannot be landed as a deterministic post-hoc replay because:
- adding settle to `replayLedger` of the *existing* cottage ledger yields a build the original loop never
  saw; `offlineAssert` byte-compares the replayed artifact against the committed `final-artifact.json`
  (white y5–12) → mismatch → requires regenerating the chain, i.e. a fresh run;
- and the run is exactly AC4's relieved workshop build — which needs the subscription shim **and**
  headless GL. **GL is absent in this environment** (no `headless-gl`, no Playwright), so the relieved
  build + glance cannot be produced or validated here.

## Disposition (AC2 via its explicit OR clause)

The residual is **named honestly with counts** (above). The root cause is identified, faithfully
reproduced, and its fix path specified: correct the band boundary at the workshop dress/seed seam (reuse
`zoneFill`'s supplying op + the gate's `deriveZones` zone-of), proven inert on barn, with the saltcrag
5-cell residue carried, landed via a fresh `pattern-book --ticket T-149-02 --rotate-pins` run +
monotone re-derivation of every committed gate record. That fresh run is AC4 (shim + GL); it is
**deferred to the operator runbook** here because GL is unavailable — see `progress.md`.
