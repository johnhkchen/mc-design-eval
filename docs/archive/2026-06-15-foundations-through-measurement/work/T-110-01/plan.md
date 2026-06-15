# T-110-01 church-unblock — Plan

Ordered, atomically-committable steps. Steps 1–4 are pure-code + `npm test`; steps 5–9 execute the
named runners (GL + one-time LLM + metered judge) and commit evidence. Every step names its
verification. Deviations get recorded in progress.md before proceeding.

## Step 1 — Census role-family gate (the unblocker)

**Edit** `benchmarks/sculpture/durable-skin.mjs`:
- swap `dominantCoverage` import for `ownCoverage`; upgrade all three censuses (front-candidate,
  splat-only, final) to `ownCoverage`.
- gate front-candidate + final with `metric: "own"`; splat-only stays `metric: "dominant"` with a
  one-line comment (frozen E-23 baseline, legacy-replay precedent).
- terminal throw reports both fractions (`dominant=… own=…`) + the existing census decomposition.
- record `coverageGate.metric = { final: "own", frontCandidate: "own", splatOnly: "dominant" }` +
  lineage note (T-095 → T-101 → T-110, monotonicity reasoning).

**Edit** `benchmarks/sculpture/placement-grammar.mjs`: same metric switch in `grammarStage`
(census `ownCoverage`, gate `metric:"own"`, both fractions in the throw).

**Verify**: `npm test` green (no behavior change is asserted by existing tests — they pin cores,
not these runners); grep that no other `coverageGate(` call site changed.

**Commit**: `feat(E-28 T-110-01): role-family coverage gate — own-vocabulary metric at the T-088/T-098 seams`

## Step 2 — Monotone proof tests

**Add** `src/view/coverage-monotone.test.mjs`:
- replay committed `durable-skin/{cottage,gatehouse}.json` and `styled/{cottage,gatehouse}.json`
  (and `challenge/*` where policy+census pairs exist): recompute `ownCoverage` from recorded
  per-zone `byBlock` + the recorded shipped policy; assert every zone that passed the dominant gate
  passes the own gate, and recorded `passed:true` gates stay true. Records without a usable
  policy+census pair are skipped with a named note (never synthesized).
- gate-level property test: own ⊇ dominant ⇒ own-gate passes wherever dominant-gate passes.

**Verify**: `npm test` green; deliberately corrupt a fixture in-memory to confirm the assertion can
fail (then restore).

**Commit**: `test(E-28 T-110-01): monotone proof — committed records replayed through the own-metric gate`

## Step 3 — Per-component grouping core

**Add** `src/form/component-roof.mjs` (`componentGableGroups`) + `component-roof.test.mjs`:
- synthetic two-mass record: grouping, primary-first order, `gable-spans-masses` finding,
  `component-roof-unfitted` for a roofed mass with no gables.
- committed-record test: `components/church.json` + `gablesFromRecord` ⇒ nave group carries
  gable-roof-1-roof-5 + gable-roof-3-roof-7 (mass-0), tower group carries gable-roof-14-roof-15
  (mass-1).

**Verify**: `npm test` green. **Commit**: `feat(E-28 T-110-01): componentGableGroups — per-mass roof program grouping (pure)`

## Step 4 — Per-component invocation in the roof runner

**Edit** `benchmarks/sculpture/roof-program.mjs` per structure.md B: group loop threading the occ,
per-component `swap` records, composed top-level summary (back-compatible fields), summed
acceptance budget, per-component console lines, `renderMd` per-component section.

**Verify**:
- `npm test` green (runner has no unit tests; the cores it calls do).
- `npm run roof:cottage -- --repro` and `npm run roof:gatehouse -- --repro`: single-mass subjects
  must still reproduce their committed shas + status (proves the refactor is identity for one
  group).

**Commit**: `feat(E-28 T-110-01): roof program invoked per component — tower/nave fitted separately, composed under the cage`

## Step 5 — Church zone-map record (needs step 1)

- `npm run zone:map -- --subject church` → commit `zone-map/church.{json,md}`.
- If the gate STILL throws on the base build: stop, record the named residual + census decomposition
  in progress.md and the ticket record — that engages AC3's "or the residual re-measured and named"
  branch; kit extraction stays blocked and the review must say so. (Do not tune.)

**Commit**: `feat(E-28 T-110-01): church zone-map record — first concept-derived bands for the challenge subject`

## Step 6 — Church kit extraction (one-time LLM)

- Add the church row to `kit-extract.mjs` SUBJECTS (registry data).
- `npm run kit:extract -- --subject=church` (STRONG tier via the subscription shim); then
  `npm run kit:extract -- --offline` must reproduce `kit/church.json` byte-identically.
- Commit `kit/church.{json,raw.json,md}` + the registry row.

**Commit**: `feat(E-28 T-110-01): church kit extracted — first kit record for the challenge subject (raw reply committed)`

## Step 7 — Registry wiring + church roof program run

- `SUBJECTS.church`: `kitRecord: "kit/church.json"`, `zoneMapRecord: "zone-map/church.json"`.
- `npm run roof:church` (family now derivable from the kit): expect per-component outcomes —
  whatever they are, recorded; `npm run roof:church -- --offline` re-asserts.
- Commit `roof/church.{json,md}` (+ `roof/church/artifact.json` if accepted) + registry change.

**Commit**: `feat(E-28 T-110-01): church roof program per component — <actual outcome per mass> (registry wired)`

## Step 8 — The church chain end-to-end, first gate verdicts

- `npm run challenge:church` — the chain must clear the skin (or the residual is named; AC3's
  "or" branch). Exit code = the resemblance gate's verdict; commit record + artifacts + gate
  record/sheet + frames.
- `npm run styled:church` — the full AC3 chain through kit-presence + resemblance (**both gates**).
  Commit `styled/church.*`, `multi-angle/church-styled.*`, kit report, frames.
- `npm run challenge:church -- --repro` and `npm run styled:church -- --repro` (fresh-process
  determinism), `-- --offline` re-asserts.
- **No re-rolls**: the first verdicts stand, PASS/FAIL/REFUSAL alike (T-111-01 owns closure).

**Commit**: `feat(E-28 T-110-01): church through both gates for the first time — verdicts recorded as measured`

## Step 9 — Review artifact

- progress.md kept current throughout; final `review.md`: changed files, test coverage + gaps, the
  roof-program.mjs/T-108-01 merge flag, open concerns (e.g. tower fallback, verdict contents,
  splat-only metric pin), AC-by-AC status.

## Testing strategy summary

| Layer | What | How verified |
|---|---|---|
| Pure cores | componentGableGroups | unit tests (synthetic + committed church record) |
| Gate semantics | own-metric monotonicity | record-replay test + property test |
| Runner identity | single-mass refactor no-op | roof:{cottage,gatehouse} --repro vs committed shas |
| Chain | church end-to-end | double-run byte-equality (built-in), --repro, --offline |
| Honest failure | residual naming | gate throw carries both fractions + census decomposition |

## Risks / contingencies

- **zone:map church throws on the base build** → AC3 "or" branch; record + stop the kit leg; the
  census fix + per-component roof still land (steps 1–4) — partial AC delivery named in review.
- **Church kit lacks a roof cube row** → roofFamily finding, all components fall back named — AC2
  is still satisfied (tolerance-or-named-fallback); chain proceeds (reconstruct simply composes no
  roof delta).
- **roof-program.mjs collision with T-108-01** → keep the diff additive; flag in review.md; if a
  same-file commit lands mid-flight, rebase mine on top before committing (check `git log` for
  minutes-old sibling commits before each commit — the double-dispatch lesson).
- **`npm test` must stay green after every commit** (1364 root + 46 render at T-107 baseline).
