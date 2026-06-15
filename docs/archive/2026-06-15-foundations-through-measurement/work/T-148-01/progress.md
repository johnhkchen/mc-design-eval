# T-148-01 Progress — relief-aware-gate

Status: **COMPLETE.** All plan steps landed; `npm test` 2085/2085 green; every touched chain/gate
byte-identical. Four commits on `main` (a sibling T-147-01 commit `32cf02b` interleaved — disjoint
files).

## Commits

- `4e34269` — Step 1: the pure lens `src/form/relief-presence.mjs` + 6 unit tests.
- `3d44a0f` — Step 2: the committed recognised barn facade grammar fixture.
- `950b888` — Step 3: the relief calibration sweep + committed evidence + npm script.
- `815fa5f` — Steps 4+5: gate `--offline` tolerance + inert live-gate wiring.

## Step-by-step

### Step 1 — pure lens (DONE, `4e34269`)
`src/form/relief-presence.mjs`: `reliefDemand(program, pack)` (grammar → surfaceRelief opts, role
resolved via `roleBlock`), `reliefPresence(occ, {demand})` (the FIXPOINT — `surfaceRelief`'s would-be
placements ARE the missing relief cells; `missing===0` ⇒ realized; `reliefProfile` evidence recorded),
`composeReliefAwareVerdict(kitAware, presence)` (`relief-aware-gate/v1`, kit-aware byte-unmoved beside,
`ran:false` → passthrough). 6 tests RP1–RP6 green (anti-anchor, articulated pass, passthrough,
evidence, compose). No deviation from design.

### Step 2 — grammar fixture (DONE, `3d44a0f`)
`benchmarks/sculpture/relief/barn-grammar.json` = `barn.program.json` + a diegetic `facade` (dark_oak_log
studs, column rhythm every 4, front+back walls), produced via `mergeFacade` and validated by
`validateProgramAgainstPack` (ok). `reliefDemand` yields 2 demands; `reliefPresence` on the real flat
barn → `passed:false` (600 missing stud cells); applying `surfaceRelief` → `passed:true`. **Deviation
from structure:** the fixture declares BOTH front and back walls (the structure said "one face") — a
timber barn studs both long walls; both validate; the calibration anti-anchor is stronger for it.

### Step 3 — calibration sweep (DONE, `950b888`)
`benchmarks/sculpture/relief-calibration.mjs` (`relief-calibration/v1`), mirroring
`budget-calibration.mjs`. Three anchors, ALL HOLD:
- **anti-anchor**: the committed flat barn FAILS the relief lens (residual: 300+300 missing studs);
  the committed kit-aware PASS reported beside.
- **articulated**: the barn + `surfaceRelief` applied PASSES; `reliefNoRegress`
  `inPlanePreserved && ratiosPreserved` both true (relief is honest construction; only the
  perpendicular extent widens, recorded never gated).
- **committed-unchanged**: 18 committed gate records swept, 0 with a relief demand → kit-aware overall
  re-derives unchanged.
`npm run relief:calibrate` exit 0; tracked re-run byte-identical (clean working tree).

### Step 4 — offline tolerance (DONE, `815fa5f`)
`multi-angle-gate.mjs --offline`: optional `relief`/`reliefAware` consistency check mirroring
`kitAware`/`visibility`; summary token `relief-aware n/a (no grammar)` on every committed record. Full
offline sweep over ALL committed gate records → ALL-CONSISTENT, zero record drift.

### Step 5 — inert live wiring (DONE, `815fa5f`)
`loadReliefLens(def, occ, overall)` fires only when a subject opts in via `def.facadeGrammar` (no
committed subject has it). Record gains optional `relief`/`reliefAware` ONLY when it fires → absent on
every committed record. `patternbook:repro` (cottage+barn) byte-identical; exit code stays on the
kit-aware `overall` (committed parity; relief-aware-as-exit-gate is S-149).

## Verification ledger

- `npm test` → **2085/2085** green.
- `npm run patternbook:repro` → cottage + barn byte-identical.
- `npm run facade:offline`, `npm run recognize:offline` → byte-identical (diegetic/artifact proven).
- `npm run relief:calibrate` → anchors ALL HOLD; tracked re-run byte-identical.
- Offline sweep over all committed `multi-angle/*.json` → ALL-CONSISTENT; `git status` clean on every
  committed gate record (only `multi-angle-gate.mjs` source changed).
- Self-grep: the lens has no subject keys in logic ("barn" appears only in motivating comments); the
  calibration names the subject in its anchor table exactly as `budget-calibration.mjs` does.

## Open concerns (carried to review)

1. The calibration grammar period (every 4) is recognised fixture data, not a LIVE recognition — no
   model in CI (S-145's standing limitation). The lens contract is proven; the first LIVE barn facade
   grammar + the opt-in (`def.facadeGrammar`) belong to S-149.
2. The relief verdict is REPORTED, not yet the exit gate (committed parity). S-149 flips the exit gate
   after a build actually carries relief.
