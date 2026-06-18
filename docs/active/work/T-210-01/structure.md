# T-210-01 — Structure: file-level changes

Epic **E-54** / Story **S-210**. The blueprint — interfaces and boundaries, not code.

## Files modified

### 1. `src/view/aperture-carve.mjs` (pure core — the helper + faceSpan wiring)

**New export — `centerOnFace(faceW, openingW)`**
```
@param faceW     integer ≥ 1   width of the wall face along the u-axis (cells)
@param openingW  integer ≥ 1   desired opening width (cells)
@returns { uLo, uHi, width, clamped }   FACE-RELATIVE span, uLo∈[0,faceW-1]
```
- `width = clamp(round(openingW), 1, faceW)`; `uLo = floor((faceW − width)/2)`; `uHi = uLo + width − 1`.
- `clamped = round(openingW) > faceW`.
- Validates `faceW ≥ 1` (else `fail`).
- Pure arithmetic; placed near `clamp` (line ~54), before `carveTargetCells`.

**New export — `inheritedSlotResidual(declaredAperture, target)`**
```
@returns { aus:number[], columns:Set<string> }   slot au-columns OUTSIDE [target.uLo,target.uHi]
```
- The declared aperture's distinct `au`s that fall outside the chosen centred span — the residual that, if left,
  reads as a second opening. `columns` are the `"x,z"` wall-plane columns to fill (uses `posOf`/`target.ax`,
  `target.wStar`). Pure; reused by the runner to fill and by tests to assert the residual set.

**Modified — `carveTargetCells(occ, declaredAperture, opts)`**
- New optional opt `faceSpan?: { uLo:number, uHi:number }` (world u-range of the declared wall face).
- Centre selection:
  - `faceSpan` present → `faceW = faceSpan.uHi − faceSpan.uLo + 1`; `rel = centerOnFace(faceW, T)`;
    `uLo = faceSpan.uLo + rel.uLo`, `uHi = faceSpan.uLo + rel.uHi`. Set `target.centeredOnFace = true`.
  - `faceSpan` absent → existing slot-centred `uMid` path, **byte-identical**. `target.centeredOnFace = false`.
- `wStar` probe generalised to the **chosen** span's jambs: `probeWallPlane(…, uLo−1, vLo) ?? probeWallPlane(…,
  uHi+1, vLo)` (was `uLoSlot−1 … uHiSlot+1`). For a flat wall this yields the same `wStar`; the default-path
  byte-stability test (Plan step 2) is the guard.
- `target` carries the new flag `centeredOnFace`; all other fields unchanged so `apertureColumns`, the gate, and
  the hands read it exactly as before.

No change to `apertureColumns`, `carvedVoidCoherence`, `archedVoidCoherence`, `apertureCoherenceGate`,
`carveAperture` — they already key off `target.{uLo,uHi,…}`, which now reflect the centred span automatically.

### 2. `experiments/eval-alignment/picture-climb.mjs` (the runner hands — engage centring + fill)

**`rebuild_arch(occ)`** (line 296) and **`carve_arch(occ)`** (line 244):
- Reuse the already-computed wall-band `uMin/uMax` → `faceSpan = { uLo: uMin, uHi: uMax }`.
- Call `carveTargetCells(occ, declared, { programW: door.w, scale, faceSpan })`.
- After the carve: `const residual = inheritedSlotResidual(declared, target);` — fill each residual wall-plane
  column back to **solid** with the wall field block (`roleBlock(pack, groundRole)` — same resolution as
  `construct_walls`/`close_shell`, fallback to a sensible field id). The fill cells join the `dressed`
  reconstruction alongside the frame/sill placements (added solid, no air op).
- Log honestly: `[rebuild_arch] centeredByConstruction=true faceW=<> span=[uLo,uHi] inheritedSlot residual=<n> filled=<n>`.
- The gate (`apertureCoherenceGate`) runs unchanged; on KEEP, `pendingRebuildCols = apertureColumns(target)` as
  today (now the centred columns).

### 3. `src/view/aperture-carve.test.mjs` (unit tests)

Add tests (see Plan for the matrix):
- `centerOnFace` even/odd `faceW`×`openingW` + clamp edge (openingW > faceW) + the exact gatehouse case
  (faceW=27,w=7 → uLo=10 face-relative).
- `inheritedSlotResidual` returns the off-span slot au (e.g. slot at au=6, span [−3,3] → residual {6}).
- `carveTargetCells` with `faceSpan` centres on the face independent of the slot position.
- `carveTargetCells` **without** `faceSpan` is byte-identical to today on the existing fixture (removal set +
  `target.uLo/uHi/wStar` unchanged) — the byte-stability guard for the probe generalisation.

## Files NOT touched

- `src/view/arch-frame.mjs` — `frameArchPlacements` consumes the `wideAp` built from `target`; the centred span
  flows through unchanged.
- `measurements/`, the scoring layer, the frozen instrument — untouched.
- No schema change (`APERTURE_CARVE_SCHEMA` unchanged; `centeredOnFace`/`clamped` are additive report fields).

## Interfaces / contracts summary

| Symbol | Kind | Contract |
|---|---|---|
| `centerOnFace(faceW, openingW)` | new pure export | scalar→`{uLo,uHi,width,clamped}`, face-relative, clamped |
| `inheritedSlotResidual(ap,target)` | new pure export | slot aus/columns outside the centred span |
| `carveTargetCells(…, {faceSpan})` | modified | face-centred when `faceSpan` given; default unchanged |
| `target.centeredOnFace` | new field | `true` iff `faceSpan` drove the centre (report only) |

## Ordering of changes

1. `centerOnFace` + `inheritedSlotResidual` (pure, with tests) — independently verifiable.
2. `carveTargetCells` `faceSpan` wiring + byte-stability test.
3. Runner `rebuild_arch`/`carve_arch` wiring + inherited-slot fill.
4. Real-build evidence (front azimuth render + gate verdict) via the existing `REBUILD_ARCH_PROBE` path.
