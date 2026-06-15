# T-148-01 Structure — file-level blueprint

The shape of the code, not the code. Ordering is the commit order (each step green on its own).
Convention: pure modules under `src/**` run in the test glob (no GL/IO/Date/random); the live runner
and the calibration sweep are impure under `benchmarks/`. The S-146 engine (`surfaceRelief`,
`reliefProfile`, `reliefNoRegress`) and the S-145 demand schema (`facade`) are reused verbatim — no
new schema, no new op.

## S1 — The lens: pure core (`src/form/relief-presence.mjs`) — CREATE

Mirrors `src/form/kit-presence.mjs` (the companion-precondition pattern).

- `export const RELIEF_PRESENCE_SCHEMA = "relief-presence/v1";`
- `export const RELIEF_AWARE_GATE_SCHEMA = "relief-aware-gate/v1";`
- `export function reliefDemand(program, pack)` → `[{massId, face, axis:"column"|"row", every, span,
  phase, material, depth, role, source}]`. Per mass with a `facade`, one demand per `faces[]` entry
  (`axis:"column"`, `every=rhythm.period` or count-derived, `material=roleToBlock(pack,memberRole)`)
  and one per `courseLines[]` entry (`axis:"row"`, the declared `y` → phase, `material=roleToBlock`).
  No facade ⇒ `[]`. Imports `roleToBlock` from `../recognition/compile.mjs`. PURE.
- `export function reliefPresence(occ, {demand, zoneOf})` → `{schema, ran, passed, checks[],
  residual[], evidence[]}`. `ran = demand.length>0`; if not, `{schema, ran:false, passed:true,
  checks:[], residual:[], evidence:[]}`. Else per demand: `surfaceRelief(occ, {material, faces:[face],
  rhythm:{axis,every,span,phase}, depth, zoneOf})`; `missing = placements.length`; row `{face, axis,
  every, material, demandedStrips, missingCells, fieldCells, passed: missing===0}`; on fail push a
  named `residual` string (`"missing relief: <material> on <face> @ every <every> (<missing> cells)"`).
  `evidence`: per distinct relieved face, `reliefProfile(projectSurface(occ, face))` →
  `{face, proud, flush, recessed, plane}`. `passed = checks.every(c=>c.passed)`. Imports
  `surfaceRelief` (`../view/surface-relief.mjs`), `projectSurface`+`reliefProfile`
  (`../view/surface-grid.mjs`). PURE.
- `export function composeReliefAwareVerdict(kitAware, presence)` → `{schema:
  RELIEF_AWARE_GATE_SCHEMA, decided, refusal?, passed?, components:{kitAware, relief}}`. `decided`
  tracks `kitAware.decided`; `relief = presence?.schema===RELIEF_PRESENCE_SCHEMA && presence.ran ?
  {ran:true, passed, residual} : {ran:false}`; on `decided`, `passed = kitAware.passed &&
  (relief.ran ? relief.passed : true)`. Refusal passes through. PURE, total. (Mirrors
  `composeKitAwareVerdict`; note `reliefNoRegress` is reused by the CALIBRATION, not here — the lens
  measures the build as-is; no-regress proves the synthesized articulated reference is honest.)

**Tests** `src/form/relief-presence.test.mjs` — CREATE:
- `reliefDemand`: no facade → `[]`; a facade with a column rhythm → one demand, `material` resolved.
- `reliefPresence` THE ANTI-ANCHOR shape: a flat synthetic wall occ + a column demand → `missing>0`,
  `passed:false`, a named residual; THE ARTICULATED PASS: same occ + `surfaceRelief` placements
  applied + same demand → `missing===0`, `passed:true`; no demand → `ran:false, passed:true`;
  `evidence` carries `reliefProfile` proud/flush counts.
- `composeReliefAwareVerdict`: kit-aware PASS + relief FAIL → composite FAIL, both components present;
  relief `ran:false` → passthrough equals `kitAware.passed`; refusal stays refusal.

## S2 — Calibration sweep (`benchmarks/sculpture/relief-calibration.mjs`) — CREATE

Mirrors `benchmarks/sculpture/budget-calibration.mjs` exactly (pure re-derivation, anchors,
`guardedWriteRecord`, md, `--rotate-pins`, non-zero exit on miss). GL-free, deterministic.

- `export const RELIEF_CALIBRATION_SCHEMA = "relief-calibration/v1";`
- Loads: the committed barn artifact (`benchmarks/sculpture/workshop/barn/final-artifact.json`) →
  `artifactOccupancy`; the committed recognised barn grammar
  (`benchmarks/sculpture/relief/barn-grammar.json`) + `packs/rustic.json`; the committed barn gate
  record (`multi-angle/barn-patternbook.json`) for the kit-aware verdict reported beside.
- `demand = reliefDemand(grammar, pack)`; `validateProgramAgainstPack(grammar, pack)` asserted (the
  grammar is diegetic — the concept's recognised grammar, T-145-01 shape).
- **anti-anchor** = `reliefPresence(barnOcc, {demand})` → expect `passed:false`; report the committed
  `barn-patternbook overall.passed` (kit-aware PASS) BESIDE.
- **articulated reference** = apply each demand's `surfaceRelief` placements to a clone of the barn
  occ → `reliefPresence(reliefedOcc, {demand})` → expect `passed:true`; assert
  `reliefNoRegress(barnOcc, allPlacements, {faces})` `inPlanePreserved && ratiosPreserved` (relief is
  honest construction; the E-34 ruler is byte-unmoved).
- **monotone re-derivation** = sweep committed `multi-angle/*.json`; each `reliefDemand` over its
  program is `[]` (no facade wired) → `reliefPresence` `ran:false` → committed `overall` re-derives
  unchanged. Report the count.
- Anchors: `antiAnchor:false` (must FAIL under relief), `articulated:true` (must PASS),
  `committedUnchanged:true`. Write `relief-calibration.{json,md}` to
  `benchmarks/sculpture/multi-angle/`; `--rotate-pins`; exit 1 on any anchor miss.

## S3 — Grammar fixture (`benchmarks/sculpture/relief/barn-grammar.json`) — CREATE

The committed recognised barn grammar: `barn.program.json` with a `facade` block attached (produced by
`mergeFacade` + validated through `validateProgramAgainstPack`, then committed verbatim). One face,
`memberRole:"frame.timber"` (dark_oak_log studs — diegetic for a rustic timber barn), column rhythm
`{period:4, phase:0}` (within the rustic fallback `facadeBounds` 2..5), `evidence:{source:"concept",
layoutOnly:false}`. Authored once, validated diegetic; the period is RECOGNISED data in committed
JSON, never a runner constant (E-25 self-grep stays clean).

## S4 — Offline-checker tolerance (`benchmarks/sculpture/multi-angle-gate.mjs`) — MODIFY (additive)

In the `--offline` checks block, add an optional `relief`/`reliefAware` consistency check mirroring
`kitAware` (`:303`) and `visibility` (`:320`): when `rec.reliefAware` is present, re-compose
`composeReliefAwareVerdict(rec.overall, rec.relief)` and confirm `decided/passed/refusal` match;
absent (every committed record) → `n/a`, no byte change. Add a console summary token. Import
`composeReliefAwareVerdict`, `RELIEF_PRESENCE_SCHEMA` from `../../src/form/relief-presence.mjs`.

## S5 — Live-gate wiring (`benchmarks/sculpture/multi-angle-gate.mjs`) — MODIFY (provably inert)

In the live `gateMain` record-assembly (after `overall` is composed, `:549`), compute
`demand = reliefDemand(program, pack)` from the subject's recognised program+facade IF one is loadable
(`recognition/facade/<subject>.json` or the program's own `facade`), else `[]`. If `demand.length>0`:
`presence = reliefPresence(occ, {demand})`; attach `record.relief = presence` and
`record.reliefAware = composeReliefAwareVerdict(overall, presence)`. For EVERY committed subject
`demand` is `[]` → nothing attaches → `patternbook:repro` + gate `--offline` byte-identical. Keep the
process exit code on `overall` (kit-aware) for committed parity; the relief-aware verdict is reported,
not yet the exit gate (S-149 owns making it the exit gate after re-skin). Guarded by a small helper
`loadReliefDemand(subject, program, pack)` that returns `[]` on any miss (never throws).

## S6 — npm scripts (`package.json`) — MODIFY (additive)

- `"relief:calibrate": "node benchmarks/sculpture/relief-calibration.mjs"`
- `"relief:calibrate:repro": "node benchmarks/sculpture/relief-calibration.mjs"` (re-run = byte check)
  — or document `--repro` as a no-write verify flag if budget-calibration uses one; match its idiom.

## Ordering & atomicity

1. **S1+tests** — the pure lens, green in isolation (no committed artifact touched).
2. **S3** — the grammar fixture (validated diegetic by a test/smoke).
3. **S2+S6** — the calibration sweep + script; run it → anchors hold, record written, `--repro`
   byte-identical.
4. **S4** — offline-checker tolerance (additive; gate `--offline` still passes, records unchanged).
5. **S5** — live-gate wiring (provably inert; `patternbook:repro` byte-identical after).

Each step commits independently; every committed program/artifact/gate record is untouched (the lens
fires only when a grammar is supplied, which no committed subject has), so `--repro`/`--offline` stay
byte-identical throughout. `npm test` green after each step.

## Files touched (summary)

- **Create:** `src/form/relief-presence.mjs` (+ `.test.mjs`),
  `benchmarks/sculpture/relief-calibration.mjs`, `benchmarks/sculpture/relief/barn-grammar.json`,
  `benchmarks/sculpture/multi-angle/relief-calibration.{json,md}` (sweep output).
- **Modify:** `benchmarks/sculpture/multi-angle-gate.mjs` (offline tolerance + inert live wiring),
  `package.json` (scripts).
- **Untouched on purpose:** `src/form/multi-angle-gate.mjs`, `src/form/kit-presence.mjs`,
  `src/view/surface-relief.mjs`, all `schema/*`, all `packs/*`, every committed gate record, the
  frozen judge contract.
