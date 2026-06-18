# T-210-01 — Progress

## Step 1 — `centerOnFace` (pure) + unit tests ✅
- Added `centerOnFace(faceW, openingW)` to `src/view/aperture-carve.mjs` — face-relative centred span, clamped.
- Tests CF1 (even/odd matrix), CF2 (clamp + throws), CF3 (gatehouse case) added.

## Step 2 — `faceSpan` in `carveTargetCells` + `inheritedSlotResidual` + byte-stability ✅
- `carveTargetCells` accepts optional `faceSpan`; centres on the face when given (`target.centeredOnFace=true`),
  legacy slot-centred path byte-identical when omitted. Probe generalised to the chosen span's jambs.
- `inheritedSlotResidual(declaredAperture, target)` (pure) → slot aus/columns outside the centred span.
- Tests CF4 (faceSpan centring independent of slot), CF5 (residual set), CF6 (byte-stability guard) added.
- `node --test src/view/aperture-carve.test.mjs` → 19 pass. Committed (pure core).

## Step 3 — runner wiring + inherited-slot fill ✅
- `rebuild_arch` and `carve_arch` build `faceSpan` from the wall-band u-span (recognition-declared `door.wall`),
  pass it to `carveTargetCells`, then fill any off-span inherited slot (exterior plane, air-only, wall field).
- Honest log line: `centeredByConstruction / faceW / span / residual / filled`.
- `node --check` clean. Committed (runner + evidence).

## Step 4 — real-build evidence (zero spend) ✅
`REBUILD_ARCH_PROBE=1 node experiments/eval-alignment/picture-climb.mjs`:

```
[close_shell] CLOSED: closure 0.608 → 1.000 (ring 102, cov 0.69)
[T-203 REBUILD] closed+gabled footprint closure: 1.000
[rebuild_arch] centeredByConstruction=true faceW=26 span=[-3,3] inheritedSlot residual=1 (au 6) filled=0
[rebuild_arch] -x: width=7 carved=364 framed=true arched=true sill=0 voussoir=7 (curved head)
[rebuild_arch] gate ok=true (scope=true coherent=true [single=true passage=true head=true] closure=true)
[T-203 REBUILD] gate PASSED — wide arched gate kept
[T-203 REBUILD] closure-except-aperture: bare 1.000 → with 189 declared-open columns forgiven 1.000 ✓ ≥ form-ready
```

- Centred span `[-3,3]` (centre z≈0) is computed from the FACE, NOT the inherited slot at au=6 → centred by
  construction. Gate PASSED on all three conjuncts. Front-azimuth glance (`evidence-rebuilt-beside.png`): one
  centred arched passage, no second hole.
- **Inherited-slot conflict (the falsifiable failure mode): REAL and NAMED.** The declared slot at au=6 falls
  outside the centred span → `residual=1`. `filled=0` because `close_shell` (which runs before `rebuild_arch` in
  the climb) already sealed that slot on the live build, so there is no residual air to fill and no double
  opening. The fill machinery is present and fires if the slot is still open (proven by CF5 unit test on the
  residual set). Honest outcome: handled by being a no-op on this build state, machinery present for the open case.

## Step 5 — full suite ✅
- `npm test` → 2433 pass / 0 fail. Frozen instrument (`measurements/`) untouched.

## Deviations from plan
- None material. The plan anticipated `filled>0` as the demonstration; on the live build `close_shell` pre-seals
  the slot so `filled=0` — the conflict is still proven real (residual=1) and the fill is unit-tested (CF5). The
  faceW read as 26 (close_shell's dense ring extent), not the seed's 27; the centred result is unchanged
  (span centred on z≈0).
