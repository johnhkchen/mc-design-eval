# T-210-01 — Research: center a gate on a wall by construction

Epic **E-54** / Story **S-210**. Descriptive map of the aperture-placement machinery, where centering
is decided today, and the concrete constraints the `centerOnFace` helper must respect. No solutions here.

## The ticket in one line

Today the gate widens **wherever the build already has a slot**. Make a declared gate land **centered on its
wall face by construction** — column span computed from the face width, not inherited from a stray void.

## Where centering is decided today

`src/view/aperture-carve.mjs:70` — `carveTargetCells(occ, declaredAperture, { programW, scale, … })`:

```
const aus = cells.map((c) => c.au);
const uLoSlot = Math.min(...aus), uHiSlot = Math.max(...aus);
const uMid = (uLoSlot + uHiSlot) / 2;          // ← centre comes from the EXISTING slot
const T = clamp(Math.round((programW ?? minArchWidth) * (scale || 1)), minArchWidth, maxWidth);
const uLo = Math.round(uMid - (T - 1) / 2), uHi = uLo + T - 1;
```

The width `T` is program-driven and clamped (5..9), but the **centre `uMid` is the midpoint of the declared
aperture's air cells**. So horizontal placement is hostage to wherever the (often GLB-inherited) slot happens to
sit. The doc comment is explicit: *"the EXISTING aperture (the build positions the slot); width from the program."*

Vertical extent (`vLo,vHi`) also comes from the slot cells. **This ticket concerns only the horizontal (u-axis)
centre** — the vertical sill/head band is unchanged.

## The face-axis convention (shared, byte-stable)

`OPENING_AXES` (aperture-carve.mjs:33, mirrored in arch-frame.mjs:37): a side-face `dir` → `{u,v,w,sign}` where
`u` is the along-face world axis, `v=1` (vertical), `w` the depth/normal, `sign` the exterior end. For a `-x`
gate, `u=2` (the face runs along **z**), `w=0` (depth along x), `sign=-1` (exterior at min x). The runner's
`U_AXIS` (picture-climb.mjs:236) is the same map reduced to just the u world-index: `{"-x":2,"+z":0,…}`.

`posOf(ax,au,av,w)` builds a world `[x,y,z]` from face-relative coords. Centering math is all in `au` (the u-axis
world coordinate along the face).

## The aperture-coherence gate (the safety contract the carve must pass)

`apertureCoherenceGate(before, after, target, {floor,eaveY,arch})` (aperture-carve.mjs:220) — three conjuncts:

1. **SCOPE** — every removed cell (solid-before ∧ air-after) lies inside `target.widenedRegion`. *Note: this gate
   checks REMOVED cells only; it is blind to pre-existing air that the carve leaves untouched (key for the
   inherited-slot conflict below).*
2. **COHERENT** — `carvedVoidCoherence` (rectangular) or `archedVoidCoherence` (spandrels = head, not notches;
   passed `arch.spring`). Both inspect the void **only inside `[uLo,uHi]×[vLo,vHi]`** at the wall plane `wStar`.
3. **CLOSURE-EXCEPT-APERTURE** — `recessClosureGuard` no-regression with the aperture columns excluded
   (`apertureColumns(target)`), plus a reported-but-not-gated volumetric mouth count.

`apertureColumns(target)` (aperture-carve.mjs:118) enumerates the `"x,z"` columns the widened aperture occupies
across its depth — the closure forgiveness set. It reads `target.{ax,uLo,uHi,vLo,wMin,wMax,wStar}`. **Any change
to where `uLo/uHi` sit flows through this automatically** — one definition, no drift.

## The hands that consume the target (the wiring sites)

`experiments/eval-alignment/picture-climb.mjs`:

- **`carve_arch(occ)`** (line 244) and **`rebuild_arch(occ)`** (line 296) both do the identical preamble:
  resolve the declared door from the program (`masses[0].openings.find(kind==="door" && head==="arch")`), find
  the live (or seed-ref) aperture, compute `scale` from the **build wall-band u-span ÷ program rect span**, then
  call `carveTargetCells(occ, declared, { programW: door.w, scale })`.
- The wall-band u-span is already computed there (lines 310–315 / 259–263): walk cells in `[floor..eaveY]`, take
  min/max of `c[ax]`. **That min/max IS the wall face's u-range** — exactly what `centerOnFace` needs. `faceW =
  uMax − uMin + 1`, `uFaceLo = uMin`.
- `rebuild_arch` is the live gatehouse hand (T-203): carve → frame jambs/lintel → voxel arch ring → sill →
  `deriveArchHead` voussoir naming → arch-aware gate; on KEEP it promotes `apertureColumns(target)` into
  `openColumns` so the next round's closure metric reads closure-except-aperture.
- The **front face is recognition-declared**: `door.wall` = `"-x"` from the program (`masses[0].openings`). The
  E-50 orientation finding (`ridgeAxis` pulled from the program, picture-critique blind to rotation) is the same
  principle — placement intent comes from recognition, not from a geometry guess or a stray void.

## The real-build situation (grounds the falsifiable claim)

Probing the gatehouse seed (`benchmarks/sculpture/generated/gatehouse/artifact.json`):

- bounds `min [-13,0,-13]`, `max [13,24,13]`.
- The `-x` declared door aperture sits at **au(z)=6, single column**, av(y)∈[0,12].
- Wall-band z-span (faceW along z): **z∈[-13,13] → faceW=27**, centre **z=0**.
- `scale = 27/15 = 1.8`; `T = clamp(round(4·1.8),5,9) = 7`.
- Slot-centred today → `uMid=6`, span **z∈[3,9]** (off-centre by 6).
- Face-centred → `uLo = ⌊(27−7)/2⌋ + (−13) = −3`, span **z∈[−3,3]** (centred on z=0).

**The inherited slot at z=6 lies OUTSIDE the face-centred span z∈[−3,3].** So face-centring on this real subject
is precisely the falsifiable failure mode the ticket names: a GLB-inherited slot remains *beside* the new centred
opening → a double opening / ragged edge. The SCOPE conjunct will NOT catch it (it only inspects removed cells).
This conflict must be handled (fill the residual slot shut — adding wall, the opposite of an air op, is allowed
and restores the shell) or documented with evidence. **It is real here, not hypothetical.**

## Constraints / invariants

- **PURE module.** `aperture-carve.mjs` is `no GL / no I/O / no Date|random`, runs under `src/**/*.test.mjs`.
  `centerOnFace` lives here and stays pure.
- **Byte-stability.** Existing climbs (T-201/T-205/T-207/T-208) and `npm test` (2349 tests) must stay green and
  byte-identical unless face-centring is explicitly engaged. The slot-centred path must remain the default
  behaviour of `carveTargetCells` when no face span is supplied.
- **Recess-by-exclusion** holds outside the declared aperture (memory: `facade-recess-by-exclusion`). Filling the
  inherited slot is *adding* wall, not carving — permitted.
- **Frozen instrument untouched** — `measurements/` and the scoring layer are not modified.
- **Clamp.** Opening width can never exceed the face (`w ≤ faceW`); span clamps to `[0, faceW−1]`.
- **Ambiguous face on a near-square footprint** — do not guess the edge; the `dir` comes from the program. The
  helper takes the face already chosen by `door.wall`, so ambiguity is resolved upstream by recognition.

## Open questions for Design

1. Does `centerOnFace` return a **face-relative** `[uLo,uHi]` (offset 0..faceW−1) and let the caller add
   `uFaceLo`, or **world-absolute** au? (purity + testability favour face-relative; wiring adds the offset.)
2. How does `carveTargetCells` accept the centred span — a new optional `faceSpan` param, or a `centerU` override?
3. Where is the inherited-slot fill done — inside `carveTargetCells`, or in the runner hand after the carve?
