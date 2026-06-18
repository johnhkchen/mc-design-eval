# T-210-01 — Review: center a gate on a wall by construction

Epic **E-54** / Story **S-210**. Handoff for a human reviewer. Honest read: the helper, the wiring, and the
real-build evidence all land; the inherited-slot conflict is real and handled (as a no-op on this build state)
with the open-case machinery present and unit-tested.

## What changed

### `src/view/aperture-carve.mjs` (pure core)
- **`centerOnFace(faceW, openingW)`** — new export. Face-relative centred span: `uLo = floor((faceW−w)/2)`,
  `uHi = uLo+w−1`, width clamped to `[1,faceW]` (an opening is never wider than its face), `clamped` reported.
  Floor biases the leftover cell to the high side when parities differ (documented convention). Throws on
  `faceW<1` / `openingW<1`.
- **`inheritedSlotResidual(declaredAperture, target)`** — new export. The declared slot `au`s (and their
  `"x,z"` wall-plane columns) that fall OUTSIDE the centred span — the residual a face-centred gate could leave
  beside itself (the SCOPE conjunct is blind to pre-existing air). Pure.
- **`carveTargetCells(…, {faceSpan})`** — new optional `faceSpan` (world u-range of the declared face). When
  given, centre is computed from the face via `centerOnFace` (`target.centeredOnFace=true`); when omitted, the
  legacy slot-centred path is byte-identical. The `wStar` probe was generalised from the slot's jambs to the
  chosen span's jambs (same `wStar` for a flat wall; guarded by the CF6 byte-stability test).

### `experiments/eval-alignment/picture-climb.mjs` (runner hands)
- `rebuild_arch` (live) and `carve_arch` (parallel): build `faceSpan = {uLo:uMin, uHi:uMax}` from the wall-band
  u-span on the recognition-declared `door.wall`, pass it to `carveTargetCells`, then fill any off-span inherited
  slot at the exterior wall plane (air-only, wall field block via `roleBlock(pack, walls.ground.role)`). Honest
  log line: `centeredByConstruction / faceW / span / residual / filled`.

### `src/view/aperture-carve.test.mjs`
- CF1–CF6 added (6 tests). Import extended with `centerOnFace`, `inheritedSlotResidual`.

### Evidence
- `evidence-rebuilt-beside.png` / `evidence-before-beside.png` — the zero-spend `REBUILD_ARCH_PROBE` front-azimuth
  beside sheets.

## Acceptance criteria — status

- [x] `centerOnFace` pure helper, unit-tested on even/odd face & opening widths + clamp edge — CF1/CF2/CF3.
- [x] Wired into the aperture path so a declared gate centres on its wall face independent of any pre-existing
      slot; the front face derives from the recognition-declared `door.wall`. Real build: `span=[-3,3]` (centre
      z≈0) while the inherited slot sits at au=6 → centred by construction, not by the slot.
- [x] Real-build check: gate lands centred (front azimuth, `evidence-rebuilt-beside.png`) and passes the
      coherence gate (`ok=true`, scope/coherent[single,passage,head]/closure all true). Inherited slot conflict:
      named (`residual=1, au=6`); on this build state `filled=0` because `close_shell` pre-seals the slot, so no
      double opening — the remove-then-place machinery is present and fires for the open case (CF5).
- [x] Recorded honestly — see progress.md and the log line.
- [x] `npm test` green (2433/0); frozen instrument untouched; recess-by-exclusion honoured (fill ADDS wall,
      never carves outside the declared aperture).

## Test coverage

- **Strong on the pure core.** The centring math (4-way parity matrix + clamp + degenerate + the exact gatehouse
  case), the residual set (off-span vs in-span), the faceSpan centring (independent of slot position), and the
  default byte-stability are all unit-tested and gate `npm test`.
- **Integration via the probe, not `npm test`** (by design — the metered climb is not in the suite). The
  real-build centring + gate verdict are reproducible by replay (`REBUILD_ARCH_PROBE=1`), zero model spend.

### Gaps / not covered by automated tests
- The **runner-side fill** (the material write) is shown by the probe + CF5 (the residual set), but there is no
  unit test that asserts the filled occupancy on a build where the slot is *still open* (the live build has
  `close_shell` seal it first). If a future build reaches `rebuild_arch` without `close_shell`, the fill path
  runs untested-in-CI; it is straightforward (air-only solid write) and exercised by the probe machinery.
- The fill closes only the **exterior wall plane** at the residual column, not a deep tunnel were the inherited
  slot to bore through a thick wall. This is sufficient for the glance (the front azimuth) and the claim; a
  deep-residual case is not present on this subject and is a named limit.

## Open concerns / handoff notes

1. **`filled=0` is the honest result, not a miss.** The conflict the ticket leads with (a slot beside the centred
   gate) is real here (`residual=1, au=6`) but does not manifest because the climb seals the slot in `close_shell`
   before `rebuild_arch`. If S-211's capstone reorders or skips `close_shell`, re-check the fill fires.
2. **faceW=26 vs the seed's 27.** The runner reads the face from the closed+gabled build's wall band (26), not
   the seed (27). The centred result is unchanged (span centred on z≈0). No action needed — the face is correctly
   read from the build being carved.
3. **Other gatehouse gaps are out of scope.** The glance still shows a brown roof / dark wall field — those are
   `recolor_roof` / the wall-field hand (other E-52/E-54 tickets), not this placement ticket. This ticket only
   moves the OPENING to centred-by-construction, which it does.
4. **Composes with S-211.** The centred gate is the placement S-211's re-climb reads as *the* gatehouse gate. No
   API change to the gate or `apertureColumns` — `target.{uLo,uHi}` now reflect the centred span and flow through
   unchanged.

## Risk assessment
- Low. The default `carveTargetCells` path is byte-identical (CF6 + full suite green); the new behaviour is opt-in
  via `faceSpan`, supplied only by the two arch hands. The fill is additive (restores shell), never carves.
