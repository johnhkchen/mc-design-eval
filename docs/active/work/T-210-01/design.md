# T-210-01 — Design: centerOnFace + by-construction centring

Epic **E-54** / Story **S-210**. Decisions, with the rejected alternatives and why.

## Decision 1 — `centerOnFace` is a pure, face-relative span function

```js
export function centerOnFace(faceW, openingW) → { uLo, uHi, width, clamped }
```

- `w = clamp(openingW, 1, faceW)` — an opening can never be wider than its face.
- `uLo = Math.floor((faceW − w) / 2)`, `uHi = uLo + w − 1`. (The ticket's formula verbatim.)
- Result is **face-relative**: `uLo ∈ [0, faceW − 1]`, measured from the face's low u-edge. The caller adds the
  face's world `uFaceLo` to get world au. `clamped:true` is reported when `openingW > faceW` (width was reduced).
- Pure arithmetic — no occupancy, no GL. Trivially unit-testable on even/odd `faceW`/`openingW` and the clamp.

**Why face-relative, not world-absolute (rejected):** the centring formula is a property of two scalars (face
width, opening width). Keeping it scalar-in / scalar-out makes it a clean unit (the AC's "pure: faceW + openingW
→ centered [uLo,uHi]") and decouples it from the axis/sign bookkeeping. The caller already knows `uFaceLo` (it
computes the wall-band min); adding the offset there is one line and keeps the helper free of world geometry.

**Even/odd behaviour (worked):** `floor((faceW−w)/2)` biases the leftover cell to the **high** side when the
parities differ (faceW=7,w=4 → uLo=1, span[1,4], leaves 1 left / 2 right). This is the deterministic, documented
convention; symmetric when parities match (faceW=7,w=3 → uLo=2, span[2,4], 2 left/2 right). The gatehouse case
(faceW=27,w=7) is symmetric: uLo=10 face-relative → z=−3 world.

## Decision 2 — `carveTargetCells` gains an optional `faceSpan`; default unchanged

Add one optional opt: `faceSpan?: { uLo, uHi }` — the **world u-range of the declared wall face**.

- **When supplied:** compute the centre from the face. `faceW = faceSpan.uHi − faceSpan.uLo + 1`; run
  `centerOnFace(faceW, T)`; world span `uLo = faceSpan.uLo + rel.uLo`, `uHi = faceSpan.uLo + rel.uHi`. The width
  `T` is still the program-driven clamp (5..9) computed exactly as today, so an arch head stays buildable.
- **When omitted (default):** the existing slot-centred `uMid` path runs **byte-identically**. Every existing
  test and climb that does not pass `faceSpan` is unchanged.
- The probe for the exterior wall plane `wStar` moves to the **chosen span's jambs** (`uLo−1`, then `uHi+1`)
  instead of the slot's, so a centred span far from the slot still resolves its wall plane. When `faceSpan` is
  omitted the chosen span *is* the slot-centred span and the jambs coincide with today's `uLoSlot−1`/`uHiSlot+1`
  only when T is odd-aligned — see Risk R1; we guard byte-stability with a test that the default path's removal
  set is unchanged on the fixture.

**Why a `faceSpan` param, not a separate `carveCenteredCells` function (rejected):** the removal-set logic,
`widenedRegion` construction, depth/tunnel handling, and `target` shape are identical; only the centre changes.
Duplicating the whole function to vary one computed value invites drift between two carve paths and two `target`
shapes that `apertureColumns`/the gate both read. One function, one optional input.

**Why not a raw `centerU` override (rejected):** passing a pre-computed centre would push the `faceW`/clamp/
`centerOnFace` call into the runner and scatter the centring contract. Passing the **face span** keeps the helper
the single owner of "centre on this face."

## Decision 3 — inherited-slot conflict: fill the residual shut (remove-then-place), reported

The real gatehouse case (research): face-centred span z∈[−3,3], inherited slot at z=6 → a residual hole beside
the centred gate. The SCOPE conjunct is blind to it (it only checks *removed* cells). Handle it:

- After choosing the centred world span, compute the **inherited-slot residual**: declared-aperture air columns
  (the slot `au`s) that fall **outside** `[uLo,uHi]`. For each residual `au`, **fill** the wall-plane column over
  the band back to **solid** with the wall field block (restoring the shell). Filling is *adding* wall — the
  opposite of an air op — so it honours recess-by-exclusion and the brush-door charter.
- This is done in the **runner hand** (`rebuild_arch`/`carve_arch`), not inside the pure `carveTargetCells`,
  because it needs the wall field block (`roleBlock(pack, groundRole)`) and writes solid cells — runner concerns,
  not pure-geometry concerns. `carveTargetCells` exposes the residual columns so the hand can fill them; expose a
  small pure helper `inheritedSlotResidual(declaredAperture, target)` → the `au`s (and their columns) to fill.
- **Reported honestly** in the hand's log + progress: `centeredByConstruction:true`, `inheritedSlotConflict:{
  residualColumns:[…], filled:N }`.

**Why fill, not overlay (rejected):** overlaying the centred opening and leaving the old slot open is exactly the
double-opening / ragged-edge failure the ticket forbids. Filling is the "removed/rebuilt first, not overlaid"
path the ticket prescribes.

**Why fill in the runner, not the pure core (rejected alt):** the pure module must not know block ids or write
field material. Keeping the fill in the hand preserves `aperture-carve.mjs`'s purity and keeps the test surface
clean (the residual *set* is pure and tested; the *material* fill is runner-side and shown by the real-build
evidence).

## Decision 4 — front face derives from the recognition-declared gate

No new logic: the hands already resolve `door.wall` from `program.masses[0].openings` and pass that `dir`. The
face span comes from the wall-band u-span on **that** dir. Near-square ambiguity is therefore resolved upstream by
recognition (the E-50 orientation principle), never guessed. We add an assertion/log that the face used matches
`door.wall`, no behavioural change.

## Decision 5 — engage face-centring on the live gatehouse hand (`rebuild_arch`)

Wire `faceSpan` into `rebuild_arch` (the live T-203 hand) and `carve_arch` (kept parallel). The wall-band
`uMin/uMax` already computed for `scale` becomes `faceSpan:{uLo:uMin,uHi:uMax}`. This is the by-construction
centring the AC's real-build check verifies. Default callers (tests, other subjects) pass no `faceSpan` → no
change.

## What this does NOT do

- No new aperture engine — reuses `carveTargetCells`/`frameArchPlacements`/the gate.
- No vertical re-centring — sill/head band stays slot-derived (only the falsifiable u-axis centre changes).
- No change to the frozen instrument, the scoring layer, or `measurements/`.
- No lintel-support check beyond the clamp: at faceW=27/T=7 the lintel spans 7 with full jambs both sides; the
  "off a support" failure mode is checked by the existing coherence gate (a blocked passage would fail), and the
  real-build evidence confirms `headBuilt`.

## Falsifiability recap

The claim fails if, after wiring, the front-azimuth glance shows a hole beside the gate (residual not filled), or
the gate refutes (closure regressed by the fill, or passage blocked). The plan's evidence step renders the front
azimuth and prints the gate verdict to catch exactly this.
