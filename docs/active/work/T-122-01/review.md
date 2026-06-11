# T-122-01 ridge-height-closure — Review

S-122's single ticket. The generated cross-gable ridge that survived T-118 and T-121 as the
standing −4-class residual is **closed and instrument-verified**: cottage cross-gable ridge
mean −4.324 → **−0.401**, barn −4.396 → **−0.111** (declared tolerance ±1), with the cage held
and one owned re-judge recorded. Six commits: `8e50977`, `3d75530`, `13776a6`, `6c7bfd1`,
`1375805`, `90af70f`. Suite **1629/1629** green at every boundary.

## Acceptance criteria — outcomes

1. **Diagnosis first — DONE** (progress.md step 0, written before any fix). Four named
   mechanisms with the real numbers: (a) shallow independently-fitted side pitches intersect
   below ridge.y (cottage cross: planes meet 18.864, ridge.y 21, built surface 18.577); (b) a
   misfitted near-flat hip plane ramped half the barn ridge 13.5→19 against a GLB ridge flat at
   19.5 over the FULL span; (c) the trusted apex evidence was recorded but never consumed
   (cross-gable apexLine 22.792 / sampled profile 22.445 vs ridge.y 21); (d) the instrument's
   eave anchors were not like-for-like on asymmetric eaves (barn −1.897 of the delta was anchor
   artifact). Ticket candidates: "apex not consumed" confirmed; "integer quantization" refuted
   (it is continuous plane shallowness); "swap-ladder rung" refuted (no ladder in this path).
2. **Pure, unit-tested fix with the witness — DONE.** `closeRidge` + `fitRidgeProfile`
   (src/form/roof-ridge-fit.mjs) apply the sampled GLB ridge line eave-relatively, re-derive
   side pitches through the closed ridge, refute/re-anchor hip demands; consumed by
   `fitProvision` so the generator builds the closed gables; the shared surface definition is
   untouched. The **witness is a unit test** (roof-ridge-fit.test.mjs): the committed cottage
   cross-gable literals in → as-committed surface tops 18.577 (the −4-class deficit asserted)
   → closed ridge realized within ±1. Witness provenance recorded: the committed ridge stats
   mean is −4.324; the ticket's −4.015 headline is a rake rawDelta in T-118's before record.
   Synthetic specs cover both ridge axes, the cross-gable composition, hip refuted/re-anchored,
   refusal paths, and stair/slab cap states (`unmapped` empty).
3. **Instrument-verified BEFORE judging — DONE** via the new `--skip-gate` seam (chain +
   artifacts, no judge spawn, fail-closed under pin-guard). Ridge-region deltas above; rmse
   4.33→0.40 / 4.81→0.11; total mismatch 5922→5637px (cottage) / 4416→3153px (barn); per-view
   IoU vs GLB up at 7 of 8 azimuths, the one dip (cottage +x−z −0.008) inside the declared
   0.01 tolerance — no rollback triggered. Before-state preserved under
   `docs/active/work/T-122-01/artifacts/before/`; after = the committed records + sheets.
4. **One owned re-judge — DONE** (`--rotate-pins`, one judge run per view, zero T-114
   re-asks, receipts `frozen, diffs: []` both subjects). **Cottage moved: 12/2 (0/4) → 10/2
   with 2/4 same-object** — 45° and 135° hold, 135° demotes ridge/apex to MINOR. **Barn held
   at 12/2 (0/4) but the majors changed character**: the flattened-ridge signature is gone
   (ridge delta −0.111 beside the verdict); the named gaps are now roof coverage/material
   ("open courses", "shingle coverage") — the barn-kit recognition residual T-121 explicitly
   deferred pending a human call. Church/gatehouse generated artifacts were not moved and were
   not re-judged (economy rule).
5. **Reproducible + hygiene — DONE.** `--repro` and `--offline` PASS on both subjects;
   `diff:roof --repro` PASS on all 7 derivable records; generalization grep clean — the barn
   record finally reads **`generalization.clean: true`** (the stale T-121 flag refreshed on
   this owned artifact-moving run, never re-judged for the cosmetic field); `roof-diff.mjs`
   header comment de-specialized; `npm test` 1629/1629.

## Files changed (code)

- **`src/form/roof-fit.mjs`** — `glbHeightAt` moved here from roof-region-diff (one sampler,
  one composition point); NEW `gableEaveAnchors` (per-side GLB eave medians, unsampled sides
  drop from BOTH means). +4 tests.
- **`src/view/roof-region-diff.mjs`** — anchor repair: `heightProfiles` consumes
  `gableEaveAnchors` (its docstring had promised per-side anchoring; the code pooled one
  median); `anchors` records `perSide`/`dropped`. +1 test (asymmetric-eave phantom-offset
  regression), 1 test updated to the new contract.
- **`src/form/roof-ridge-fit.mjs`** — `dominantLine` extracted from `fitRidgeLine`
  (byte-stable, record key order preserved for --repro); NEW `fitRidgeProfile` (sampled-surface
  ridge line — on the barn the vertex apexLine rested on 3 of 48 bins post-exclusion, the
  sampled profile is the verifiable read) and `closeRidge` (eave-relative target, derived
  pitches, hip arbitration, named refusals, apexCheck recorded). +10 tests incl. the witness.
- **`src/form/provision-fit.mjs`** — closure step after the ridgeFit evidence map; closed
  gables are what the record carries and the generator consumes; refusals/apex divergence are
  named findings (`stage: "ridge-closure"`). +2 tests.
- **`src/view/roof-generate.test.mjs`** — +3 realization tests (no generator code change).
- **`benchmarks/sculpture/generated-milestone.mjs`** — `--skip-gate` (deterministic chain +
  artifacts, return before renders/gate/record; registry-only).
- **`benchmarks/sculpture/roof-diff.mjs`** — one comment de-specialized.

## Records rotated (all named, owned, `--rotate-pins`)

`generated/{cottage,barn}/[base|grammar|artifact|provision-fit|component-plan].json`;
`generated/{cottage,barn}.{json,md}`; `multi-angle/{cottage,barn}-generated.{json,md}`; all 8
`roof-diff/*` records + md (the anchor repair moved every ruler; reconstructed-path inputs
untouched, only their anchor arithmetic) + the cottage/barn contact sheets. Prior verdicts
remain in git history (`1375805^`).

## Test coverage

20 new/updated unit tests across five files, all pure/deterministic (no GL, no judge): the
sampler, 4 anchor cases, dominantLine extraction regression (existing 17 ridge tests
byte-stable), 4 profile cases, the witness + 3 refusal classes + 2 hip cases + apex-divergence,
2 fitProvision integration cases, 3 generator realization cases. Gaps: no unit test pins the
`--skip-gate` runner flag itself (verified manually fail-closed; runner logic is thin); the
closure's `minProfileCoverage: 0.5` threshold is declared but only exercised at one boundary.

## Open concerns / handoff

1. **Barn resemblance FAIL is now a coverage/material verdict, not a form one.** The standing
   blocker is the deferred barn-kit recognition (all trim-tagged cubes value-flagged → grammar
   no-op; "shingle coverage" majors). That is the T-121 handoff item awaiting a human call —
   this ticket deliberately did not touch kit pins.
2. **Church/gatehouse generated chains are stale vs the closure code** (not re-run, not
   re-judged — economy rule). Their committed records remain self-consistent; the next owned
   ticket that moves them inherits the closure. Their roof-diff records WERE re-derived
   (anchor repair) and repro-pass.
3. **barn-reconstructed roof-diff stays a named skip** (no components/barn.json — pre-existing).
4. **apexLine vs sampled profile can diverge** (barn: 20.991 vs 19.5 on 3 surviving bins);
   recorded as `apexCheck`/`apexDiverges`, never blocking. If a future subject shows a large
   divergence on a WELL-covered apexLine, that is the signal to revisit which read is primary.
5. **Cottage 225°/315° majors remain** (near-slope form, massing/gapped upper courses) — real
   residuals with the diff beside them; the ridge itself is closed. The budget-edge verdict
   flap (T-111/T-116) still applies to the 2/4 holds.
6. **byRegion before/after tables re-attribute** when gables move (regions follow the fit);
   cross-run comparisons should lean on totals, profile stats, and IoU — worth a line in the
   instrument's docs if it trips anyone again.

## Critical flags for a human

None blocking. The one judgement call made without a standing rule: the **instrument anchor
repair landed in the same ticket that passes by the instrument** — justified because the old
arithmetic contradicted the function's own documented contract, the repair is unit-tested on
synthetics, and the witness subject (cottage, symmetric eaves) closes identically under either
arithmetic. The cottage +x−z IoU dip (−0.008, inside tolerance) is the only metric that moved
the wrong way anywhere; it is recorded in the cage block of the committed record.
