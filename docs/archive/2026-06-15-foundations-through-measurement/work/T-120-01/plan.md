# T-120-01 plan — registration-hardening

Five steps, each committable with `npm test` green. Pure cores land first (no consumers, zero
risk), the impure wave second, fixtures third, docs last. No step runs a model, a judge, or
TRELLIS; the only "live" work is local re-runs of glb-smoke/registration-smoke against
on-disk inputs.

## Step 1 — speck tolerance, pure (commit: `feat(E-30 T-120-01): speckVerdict — declared
sub-speck budget for the glb-smoke gate`)

1. `src/form/voxel-components.mjs`: add `GLB_SMOKE_SPECK_FRACTION = 0.02` +
   `speckVerdict(sizes, total, {speckFraction})` per structure §6. Doc comment states the
   grounding (barn worst sweep point 1.87% total stray; moai second mass ≈ 0.48) and the
   delegation contract (specks are componentStrip's job, recorded not deviated).
2. `src/form/voxel-components.test.mjs`: the 6 cases from structure §7 (barn shape, moai
   shape, exact-boundary pair, many-tiny-specks, single component, empty).
3. Verify: `npm run test:unit` green (1580 → ~1586).

## Step 2 — registration smoke, pure (commit: `feat(E-30 T-120-01): registration-smoke core —
proxy-geometry lens run + kit dry-run`)

1. `src/form/registration-smoke.mjs` per structure §1: `proxyGeometry` (anchor → roof-run →
   `proxy-eave-undecidable` ladder), `registrationSmoke` (proxy → lens verbatim → ephemeral
   zone-record → `bandRefsFromZoneRecord`/`buildKitPrompt` in try/catch),
   `REGISTRATION_SMOKE_SCHEMA`.
2. `src/form/registration-smoke.test.mjs` per structure §2 — including the two AC fixtures at
   unit level: the barn-shaped flipped-field witness PASSES with `fieldResolution` engaged;
   a synthetic lens-unreadable concept REFUSES `no-field-cells` with `pass:false` (zero spend
   is structural: the core cannot reach a network).
3. Verify: `npm run test:unit` green (~+12).

## Step 3 — the impure wave (commit: `feat(E-30 T-120-01): pre-spend smoke wired — runner,
trellis sibling-gate, tolerant glb-smoke`)

1. `benchmarks/sculpture/registration-smoke.mjs` runner per structure §3 (pin-guard import,
   guarded sibling-record writes, exits 0/1/2).
2. `benchmarks/sculpture/glb-smoke.mjs`: gate swap to `speckVerdict` (raw conn stats stay in
   the report), `--record` via `guardedWriteRecord`, header update.
3. `benchmarks/sculpture/trellis-glb.mjs`: CLI-main sibling `registration-smoke.json` check
   before the POST (refuse on `pass:false`; note-and-proceed when absent).
4. `src/form/pin-guard.conformance.test.mjs`: PIN_WRITERS += the two runners.
5. `package.json`: `registration:smoke` script.
6. Verify: `node --check` on all three runners; `npm test` green (conformance now covers the
   new writers); `node benchmarks/sculpture/glb-smoke.mjs glb/church.glb --scale 48` still
   exits 0 with identical conn stats (behavior-preserving for clean meshes).

## Step 4 — regression fixtures, recorded (commit: `feat(E-30 T-120-01): barn deviations
re-run as regression fixtures — smoke + speck records`)

All zero-model-spend local re-runs; records committed through the guard (new files — the
guard passes; any future drift refuses without `--rotate-pins`).

1. Barn lens smoke (former deviation 1):
   `npm run registration:smoke -- --subject barn --concept benchmarks/sculpture/runs/017-…/concept.png
   --map benchmarks/sculpture/material-map/barn.json`
   → expect exit 0, `pass:true`, `lens.params.fieldResolution` present;
   commits `runs/017-…/registration-smoke.{json,md}`.
2. Barn glb-smoke (former deviation 2):
   `node benchmarks/sculpture/glb-smoke.mjs benchmarks/sculpture/glb/barn.glb --scale 48
   --record benchmarks/sculpture/glb/smoke/barn@48.json`
   → expect exit 0, `pass:true`, exactly one 1-cell speck (fraction ≈ 0.00028), conn26
   components 2 / largestFraction 0.9997 (the checklist numbers reproduced).
3. Moai control: same with `glb/moai.glb` → expect exit 1, `pass:false`, oversize component
   ≈ 0.48 fraction; record committed (a recorded FAIL is the control fixture). The `--record`
   write must happen before the exit-code decision so failing runs still record.
4. Church baseline: `glb/church.glb` @48 → exit 0, zero specks, largestFraction 1.0000.
5. Negative wiring probe (not committed): run `trellis-glb.mjs` with a scratch dir containing
   a `pass:false` record + any PNG and `MODAL_ENDPOINT_URL` UNSET — must refuse on the record
   BEFORE complaining about the env (proves the gate sits before any spend attempt).
6. Verify: `git diff` of records is additive only; `npm test` green.

## Step 5 — runbook + doc touches (commit: `docs(E-30 T-120-01): registration runbook — one
place, checklist gains the lens-smoke step`)

1. `docs/knowledge/registration-runbook.md` per structure §4 — checklist items 1–7 verbatim
   (from runs/016+017 records) + item 8 (lens smoke), the full ordered flow including the
   material-map-before-TRELLIS reorder rationale, the four registry DATA lists, speck-gate
   semantics, immutability boundary.
2. `provision-concept.mjs` "next:" hint + `glb/README.md` gate paragraph (one-liners,
   comment/doc only).
3. Verify: `npm test` green; grep that the runbook is referenced from provision-concept,
   glb-smoke, registration-smoke headers.

## Testing strategy summary

- **Unit (committed, decode-free, GL-free):** speckVerdict (6 cases incl. both witness shapes
  + exact boundary), registration-smoke core (~12 cases incl. barn witness pass + synthetic
  unreadable refusal + ladder rungs + determinism). These are the AC's "pure, unit-tested"
  surface.
- **Conformance (committed):** the two new writers under the pin-guard tripwire.
- **Integration (run-and-record, like T-117):** the four fixture records of step 4 — real
  barn/moai/church inputs through the real runners, zero model spend; byte-reproducible
  re-runs guarded by the pin mechanism itself.
- **Acceptance mapping:** AC1 = steps 2+3+4.1+5 (smoke exists, refusal cheap+named+blocking,
  checklist gains the step; barn passes, synthetic refused with zero spend);
  AC2 = steps 1+3.2+4.2/4.3 (declared tolerance, strict above budget, barn passes, moai
  fails); AC3 = steps 4+5 (deviations re-run + recorded, runbook in one place);
  AC4 = no runner contract touched anywhere (zone-map/kit-extract/durable-skin/
  generated-milestone untouched), constants generic, `npm test` green at every commit.

## Risks / contingencies

- **Barn smoke might not pass** if the proxy upperTop lands badly (e.g. anchor null on the
  barn's long box). Contingency: the roof-run rung exists for exactly this; if BOTH rungs
  misplace the eave enough to refuse, that is a finding to record — the design's ladder gets
  a measured adjustment (never a barn-specific constant). Decide-by-running in step 4.1
  before committing the record.
- **glb/ binaries absent on a fresh clone**: fixture re-runs need the local GLBs (present
  here; sha-pinned). The committed records + unit shapes are the durable regression surface —
  noted in the runbook.
- **Record paths with `@` in filenames** (`barn@48.json`): plain POSIX paths, no shell
  expansion issue; keeps scale visible in the pin name (slug-collision lesson).
