# Component-fit closure milestone (E-28 terminal, T-111-01)

The arc's question, asked honestly: after E-27 converted every FAIL into named gaps and
T-108/T-109/T-110 addressed each by fitted construction, **do all three subjects now pass the full
multi-angle gate?** Answer: **no — and the instrument-frozen receipts say exactly why.** One named
run per subject (`npm run reconstructed:{cottage,gatehouse,church}`), full chain end-to-end with the
T-108/109 end-fitted + ridge-fitted + terminated + residual-passed roofs embedded, judged once per
view (E-28 Rule 4, no re-rolls), instrument deep-diffed per record: **`diffs: []` on both gated
subjects; judge `claude-opus-4-8` pinned; the church chain refused before its gate, instrument
untouched by construction.** The T-110 census-identity exception (third instance, gate coverage to
role-family `metric:"own"`) produced **zero** contract diffs — its monotone proof is
`src/view/coverage-monotone.test.mjs`, and both fractions are reported in the durable-skin records.

## Verdict movement (E-27 → E-28 closure, instrument unchanged)

| subject | chain | kit presence | E-27 verdict | E-28 closure verdict |
|---|---|---|---|---|
| cottage | styled, COMPLETE | **PASS** | FAIL 10/2 — 135°/225° same object; form@roof major at 45°/315° | FAIL 10/2 — **135°/225° same object held**; 45° major moved form→**massing** (roof-vs-walls), 315° form@roof major remains |
| gatehouse | styled, COMPLETE | **PASS** | FAIL 11/2 — 315° same object; form@roof major ×3 | FAIL 12/2 — **4/4 drifted** (315° regressed); form@roof major at every azimuth; 45° names the "extra protruding masses" = the two GLB-backed remnants T-109 exempt-showed (per-column membership is the named next move) |
| church | styled (first kit-routed run), **REFUSED @ settle** | — (gate not reached) | challenge-label: REFUSAL `unparsed:-x-z` (3/4 drifted, form@roof); kit presence **FAIL** 169/544 frame cells | refusal **reproduced with its structural cause**: settle still wants frame 13 / foreign fill 168 after 4 re-runs — the grammar-vs-dressing vocabulary split now owned by **S-113 (vocabulary-authority)**; the T-110 challenge-label verdicts remain the church's first and only gate verdicts |

Honest reading: the fitted roofs did not buy verdict flips. The cottage's two same-object views
held and its 45° major changed *kind* (form → massing); the gatehouse lost its one same-object
view — the judge now names the very masses the GLB corroborates (the membership test is per-mass,
the judge sees per-column; finer-grained membership is E-29 scope, not a constant to tune).

## Metrics vs the E-27 baselines (full-occupancy census, declared cells counted, never hidden)

| subject | protrusions (≥4/6 faces) | ragged columns | roof fit (fresh records) | top-of-build cage outcomes |
|---|---|---|---|---|
| cottage | 51 → **86** (+35: measured cell-by-cell — 36 `spruce_planks` + 2 `dark_oak_log` @ y14–24 = the **declared open-underside verge sheets/caps**; the roof-band census excludes them by key, the milestone census counts them by design) | 6.8% → **6.3%** | 3/4 ends fitted (faceRmse 1.541/1.116/1.038, overhang 2/2/1; cross-lo refused `end-unfitted`); ridge rung **accepted** (`end-fitted-voxel-pitch-ridge-fit`, Δapex −1.404/−2.113 recorded) | 4 terminations accepted; residual: chimney **exempt-shown** |
| gatehouse | 25 → **43** (same sheet-course class) | 9.9% → **8.1%** | ladder accepted `end-fitted-voxel-pitch-gable-ends`; ends `end-hip`×2 + `end-fit-insane` named; ridge intersect **invalid (named)** — as-built ridge stands | 7 terminations accepted; residual: 2 masses exempt (GLB flat band @ y31.5) |
| church | 202 → **204** (last completed stage, now with sheet courses) | 14.0% → **15.9%** (open-underside sheets read as ragged) | first cut under T-108/109 cores: nave **accepted** `end-fitted-gable-ends` (ridge Δ +0.378, apex rmse 0); both nave ends `end-hip` (slopes, refused honestly); tower fallback **named** (pyramidal cap — S-112) | 12/14 terminations accepted (2 closure rollbacks); residual: 18 cells **removed** (refuted @ +x+z), 5-cell mass exempt |

The census deltas vs E-27 are **explained regressions, not noise**: every added spike/ragged count
traces to generator-declared sheet and cap cells (T-108 review #1 chose geometry fidelity +
declared exclusion over hiding them). The deterministic story vs E-26 remains an order of
magnitude: 265→86, 118→43, 602→204.

## Evidence

- Terminal records: `benchmarks/sculpture/reconstructed/<subj>.{json,md}` — per-view verdicts
  (angle/region/attribute/severity), instrument diff, census deltas, roof fit, refusal cause,
  self-grep generalization proof (zero subject keys; subjects are registry data).
- Closure frames (same four azimuths, same fixed lens): `frames/closure-<subj>-before.png` (the
  E-27 reconstructed builds, byte-copied from `reconstructed-<subj>-after.png` @ `ccb198e` before
  the re-runs overwrote them) vs `frames/closure-<subj>-after.png` (this milestone).
- Gate sheets: `frames/multi-angle-{cottage,gatehouse}-styled.png`; the church has no styled gate
  sheet — its chain record is the verdict artifact (E-25 Rule 6).
- Roof receipts: `benchmarks/sculpture/roof/<subj>.{json,md}` + ridge/end frame pairs
  (`frames/roof-church-{ridge,end45,end315}-{before,after}.png` new this milestone).
- Reproducibility: milestones double-run byte-compared; `--repro` fresh-process re-proofs —
  cottage `33ffd0c825a0…` MATCH, gatehouse `a8b4c58e3571…` MATCH, church honestly reports
  "pipeline-failed — nothing to reproduce" (exit 1); `--offline` re-asserts all three records +
  both unchanged roof cores; E-26 baselines sha-pinned.

## Hand-forward (E-29, sequenced after this record)

S-112 hip/pyramid caps (tower fallback + gatehouse per-column membership), S-113 one
material-vocabulary authority (the church settle split; proof = the chain settles), S-114
judge-reply robustness (the 225° unparsed REFUSAL is the regression case). Targets pin against
THESE verdicts.
