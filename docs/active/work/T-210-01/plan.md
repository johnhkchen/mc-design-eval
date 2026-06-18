# T-210-01 — Plan: ordered, verifiable steps

Epic **E-54** / Story **S-210**. Each step commits atomically; tests gate the pure work, the probe gives the
real-build evidence (zero spend, no model calls).

## Step 1 — `centerOnFace` (pure helper) + unit tests

- Add `centerOnFace(faceW, openingW)` to `src/view/aperture-carve.mjs` (near `clamp`, before `carveTargetCells`).
- Add tests to `src/view/aperture-carve.test.mjs`:
  - **even/even** faceW=8,w=4 → uLo=2,uHi=5 (2 left / 2 right).
  - **odd/odd** faceW=7,w=3 → uLo=2,uHi=4 (symmetric).
  - **even/odd** faceW=8,w=3 → uLo=2,uHi=4 (floor bias high).
  - **odd/even** faceW=7,w=4 → uLo=1,uHi=4 (1 left / 2 right, floor bias).
  - **clamp** faceW=5,w=9 → width clamped to 5, uLo=0,uHi=4, `clamped:true`.
  - **gatehouse** faceW=27,w=7 → uLo=10,uHi=16 (face-relative; +uFaceLo(−13) ⇒ world z∈[−3,3]).
  - faceW=1,w=1 → uLo=0,uHi=0 (degenerate, no throw).
- **Verify:** `node --test src/view/aperture-carve.test.mjs` green for the new cases.
- **Commit:** `feat(T-210-01): centerOnFace — centred span from face width (pure)`.

## Step 2 — `inheritedSlotResidual` + `faceSpan` in `carveTargetCells` + byte-stability test

- Add `inheritedSlotResidual(declaredAperture, target)` (pure) → `{aus, columns}` outside `[target.uLo,uHi]`.
- Add optional `faceSpan` to `carveTargetCells`; centre from the face when present, slot-centred when absent;
  set `target.centeredOnFace`. Generalise the `wStar` probe to the chosen span's jambs.
- Tests:
  - **faceSpan centring independent of slot:** fixture slot at au=3, pass `faceSpan:{uLo:0,uHi:6}` (faceW=7),
    programW=4 → T=5 → centred span uLo=1,uHi=5 (centre 3 here coincidentally — so use a fixture where the slot
    is OFF-centre: slot at au=1, faceSpan 0..6 → centred span still 1..5, NOT slot-centred 0..4). Assert
    `target.uLo===1`, `target.centeredOnFace===true`.
  - **inheritedSlotResidual:** slot au∈{1}, centred span [3,9] (force via faceSpan/T) → residual aus=[1]; slot
    au∈{6}, centred span [-3,3] → residual=[6]; slot inside span → residual empty.
  - **byte-stability:** `carveTargetCells(occ, aperture, {programW:4,scale:1,depth:"plane"})` with NO faceSpan
    returns the SAME `remove` set + `target.uLo/uHi/wStar` as the current AC1 test expects (1..5, wStar 0). Assert
    `target.centeredOnFace===false`.
- **Verify:** full `node --test src/view/aperture-carve.test.mjs` green; AC1/AC1b/AC4 unchanged.
- **Commit:** `feat(T-210-01): carveTargetCells faceSpan centring + inheritedSlotResidual (pure, default unchanged)`.

## Step 3 — wire centring + inherited-slot fill into the runner hands

- In `rebuild_arch` and `carve_arch` (`picture-climb.mjs`): build `faceSpan:{uLo:uMin,uHi:uMax}` from the
  already-computed wall-band span and pass it to `carveTargetCells`.
- Resolve the wall field block (`roleBlock(pack, program.masses[0].walls.ground.role)`, fallback `stone_bricks`).
- After `carveAperture`: `inheritedSlotResidual(declared, target)`; fill each residual wall-plane column over the
  band `[target.vLo,target.vHi]` (and the full tunnel depth `[wMin,wMax]` for through-passage symmetry — at
  minimum the exterior plane `wStar`) to solid with the field block; add to the `dressed` reconstruction.
- Log: `centeredByConstruction=true faceW=<> span=[uLo,uHi] residual=<n> filled=<n>`.
- **Verify:** `node -e "import('./experiments/eval-alignment/picture-climb.mjs')"` parses (syntax); the probe in
  Step 4 is the behavioural check.
- **Commit:** `feat(T-210-01): rebuild_arch/carve_arch centre the gate on the face + fill the inherited slot`.

## Step 4 — real-build evidence (zero spend, no model calls)

- Run the probe: `REBUILD_ARCH_PROBE=1 CLIMB_MAX_ROUNDS=… node experiments/eval-alignment/picture-climb.mjs`
  (the probe path renders before/rebuilt beside sheets + prints the gate verdict, then exits clean — no spend).
- Capture into the work dir:
  - `evidence-rebuilt-beside.png` ← the `rebuilt-beside.png` (front azimuth shows the centred gate, no residual
    hole beside it).
  - the console block: footprint closure, gate PASSED/REFUTED, closure-except-aperture, and the new
    `centeredByConstruction/residual/filled` line → paste into `progress.md`.
- **Pass criteria:** gate PASSED (scope/coherent/closure all ok), the front-azimuth glance shows ONE centred
  arched gate (no second hole at the old slot), and the residual fill count > 0 (proves the conflict was real and
  handled) OR is recorded =0 with the reason if the slot already sat within the centred span.
- If the gate REFUTES or a residual hole shows: that is the falsifiable failure — record it honestly, diagnose
  (closure regressed by fill? passage blocked? probe mis-resolved?), and either fix or document the limit with
  the evidence PNG. Do not paper over it.
- **Commit:** `docs(T-210-01): real-build evidence — gate centred on the face, inherited slot filled`.

## Step 5 — full suite + review

- `npm test` — expect green (2349 + the new cases), frozen instrument untouched.
- Write `review.md`: files changed, test coverage + gaps, the inherited-slot conflict outcome (handled/named),
  open concerns, honest read of whether the claim held on the real build.

## Testing strategy

- **Unit (gates `npm test`):** `centerOnFace` math matrix, `inheritedSlotResidual` set, `faceSpan` centring,
  default byte-stability. These are deterministic geometry — the project's discriminator.
- **Integration (evidence, not in `npm test`):** the `REBUILD_ARCH_PROBE` render + gate verdict on the live
  gatehouse — the AC's "real-build check," reproducible by replay, zero model spend.
- **No metered climb run** is required by the AC (that is S-211's capstone); this ticket proves the placement
  helper + wiring + the centred gate reads/passes the gate.

## Risks / mitigations

- **R1 probe generalisation breaks byte-identity** → Step 2 byte-stability test asserts the default removal set +
  `target` are unchanged on the fixture.
- **R2 fill regresses closure** (unlikely — fill adds solid) → the gate's closure conjunct catches it; the probe
  prints closure-except-aperture before/after.
- **R3 slot already centred on the gatehouse** (then residual=0, no conflict to show) → research shows slot at
  z=6 vs centre z=0, so residual is non-empty; recorded either way.
- **R4 fill block id wrong/foreign** → reuse the exact `roleBlock(pack, groundRole)` the wall hands use; foreign
  block would show in the glance and is checked in Step 4.
