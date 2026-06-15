# T-148-01 Review — relief-aware-gate

Handoff for a human reviewer. What changed, how it's tested, the one thing to look at, and what's
deferred. Landed in four commits on `main` (`4e34269`, `3d44a0f`, `950b888`, `815fa5f`; a sibling
T-147-01 commit `32cf02b` interleaved with disjoint files). Full suite **2085/2085 green**.

## What changed

**The lens (pure, new):** `src/form/relief-presence.mjs` (+ `.test.mjs`).
- `reliefDemand(program, pack)` — the recognised facade grammar (S-145) → relief demands: per face a
  column rhythm (`every=period`, member block via `roleBlock`), per course line a row rhythm. No
  facade ⇒ `[]`.
- `reliefPresence(occ, {demand})` — **the fixpoint**: `surfaceRelief` (S-146)'s would-be placements
  ARE the relief the build lacks; `missing===0` ⇒ the rhythm is realized. `reliefProfile` proud/flush/
  recessed recorded as evidence (the AC's "proud-cell fraction / field-frame contrast"). NO threshold,
  NO per-building constant.
- `composeReliefAwareVerdict(kitAware, presence)` — `relief-aware-gate/v1`; ANDs relief with the
  kit-aware verdict, BOTH reported; `ran:false` → pure passthrough; a resemblance refusal stays a
  refusal.

**The calibration (new):** `benchmarks/sculpture/relief-calibration.mjs` (`relief-calibration/v1`) +
committed evidence `benchmarks/sculpture/multi-angle/relief-calibration.{json,md}` + the grammar
fixture `benchmarks/sculpture/relief/barn-grammar.json` + `package.json` `relief:calibrate`.

**The instrument seam (additive):** `benchmarks/sculpture/multi-angle-gate.mjs` — `--offline`
tolerates an optional `relief`/`reliefAware` block; the live record-assembly attaches them only when a
subject opts in via `def.facadeGrammar` (none does today).

## How the AC is met

- **A relief/rhythm lens, not a colour metric** ✅ — `reliefPresence` measures the build's own surface
  geometry (`surfaceRelief`/`reliefProfile`) vs the recognised grammar; material identity is untouched.
  A flat mono-fill wall FAILS when the concept is articulated (anti-anchor); an articulated build
  PASSES (the fixpoint). Proven on the real barn AND in unit tests.
- **Calibrated from committed verdicts, no per-building constants** ✅ — the committed flat barn (the
  T-143-01 first-composite-PASS) is the anti-anchor: under the lens it moves to FAIL (residual:
  600 missing stud cells) with the kit-aware PASS reported beside. The articulated reference passes;
  `reliefNoRegress` proves the relief is honest construction (E-34 ruler byte-unmoved). The fixpoint
  predicate (`missing===0`) has no threshold; the period lives in committed fixture JSON, not source.
  Calibration evidence committed (`relief-calibration.json` — the sweep over committed builds).
- **Identity-class proof** ✅ — aggregation/precondition only, NO judge call, NO re-judge. The
  kit-aware verdict (`kit-aware-gate/v1`) is byte-unmoved and reported beside under a NEW policy tag
  (`relief-aware-gate/v1`); the prior tag is valid forever. 18 committed gate records re-derive
  unchanged (relief `ran:false`). The frozen judge contract is byte-unmoved — the lens never calls
  the judge (`instrument.diffs: []` holds by construction; `gateInstrumentDiff` is untouched).
- **Tests + repro** ✅ — anti-anchor + articulated pass + monotone re-derivation (the calibration
  anchors) + 6 unit tests; the offline checker tolerates the new field; `npm test` green;
  `--repro`/`--offline` byte-identical (`relief:calibrate`, `patternbook:repro`, `facade:offline`,
  `recognize:offline`, full offline sweep).

## Test coverage

- **Unit (pure glob)** `relief-presence.test.mjs` RP1–RP6: `reliefDemand` resolution; the anti-anchor
  (flat wall fails); the articulated pass (idempotence); no-demand passthrough; evidence; compose
  (FAIL drops PASS to composite FAIL with both beside; passthrough; refusal-stays-refusal).
- **Integration (committed, operator-run)** `relief:calibrate`: the anti-anchor flip + articulated
  pass + `reliefNoRegress` over the REAL barn build; 18-record monotone re-derivation; byte-identical
  on re-run. The committed `relief-calibration.json` IS the calibration evidence (AC2), like
  `budget-calibration.json`.
- **Byte-identity**: `patternbook:repro` (cottage+barn), gate `--offline` over all committed records,
  `facade:offline`, `recognize:offline`, `relief:calibrate` re-run — all byte-identical, zero
  committed-record drift.

## The one thing to look at — the relief lens is WIRED but not yet a build's exit gate

The lens is a first-class instrument citizen (offline-tolerated, live-wired, calibrated), but it fires
ONLY when a subject opts in via `def.facadeGrammar`, and **no committed subject does** — because no
build carries relief yet (S-145's facade is recorded-not-realized; S-146's `surfaceRelief` is unreached
by any committed chain). So:
- the committed flat barn's gate record is NOT mutated — its anti-anchor FAIL is demonstrated in the
  calibration fixture, beside the legacy kit-aware PASS;
- the gate's exit code still rides the kit-aware `overall` (committed parity).

This is deliberate and matches the project's "wire the seam, opt-in later" posture. The reviewer should
NOT expect a committed build's verdict to change here. **S-149 (re-skin + re-verdict)** is where a barn
is actually built with studs (`surfaceRelief` in the chain), a LIVE facade grammar is recognised, the
subject opts into `def.facadeGrammar`, and the relief-aware verdict becomes the exit gate.

## Open concerns / TODOs

1. **The calibration grammar is recognised fixture data, not a LIVE recognition.** No model in CI
   (S-145's standing limitation). The period (every 4, from the barn concept's stud spacing) is
   committed JSON validated diegetic — legitimate recorded data, but the first LIVE barn facade
   grammar belongs to S-149.
2. **Both long walls studded.** The fixture declares `+z` and `-z` (a timber barn studs both long
   walls) — a deliberate strengthening over the structure's "one face"; both validate.
3. **Relief verdict reported, not yet the exit gate.** S-149 flips it once a build carries relief.
4. **Row-rhythm (belt courses) is supported but unexercised by the fixture** (the barn grammar
   declares no `courseLines`); the column path is the calibrated one. A belt-course calibration could
   follow when a pack declares one.
5. **Ticket frontmatter** left untouched (Lisa owns phase transitions). The `M` on
   `docs/active/tickets/T-148-01.md` in `git status` is pre-existing, not from this work.
