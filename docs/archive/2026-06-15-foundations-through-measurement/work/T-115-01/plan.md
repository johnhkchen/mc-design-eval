# T-115-01 generate-first-provision — Plan

Seven steps, each committable atomically. Steps 1–4 are `npm test`-verifiable offline; steps 5–6
are the live runs (GL + metered judge, on demand, never in `npm test`); step 7 is docs/sheet.

## Step 0 — Baseline (no commit)

- `npm test` green at HEAD; record the count.
- `npm run styled:cottage -- --offline` and `npm run reconstructed:cottage -- --offline` re-assert
  (the refactor in step 3 must not disturb either).
- Confirm `glb/{cottage,church,stone-gatehouse}.glb` present (gitignored binaries).

## Step 1 — Fit core: `src/form/provision-fit.mjs` (+ test) — commit 1

- `fitProvision({occ, glb, alignment, opts})` per structure §1: decompose inside; mass
  parameterization (footprint runs, baseY, wallTop arbitration eave-fit→mass-top with
  `walltop-default` finding, heightDisagreement vs `heightfield`); roof ladder
  (gablesFromRecord → fitGableEnds → fitRidgeLine → fitHipCap/fitHipEnds), refused roofs become
  `flat-cap` parameters with `roof-unfitted`; openings via `fitOpeningHead`, refused heads carry
  the refusal; wallSlabs as evidence. Serializable record (`provision-fit/v1`).
- **Tests** (synthetic occupancies, the roof-fit/hip-fit fixture style): a gabled box fits
  (footprint runs exact, wallTop = eave, roof gable sane); a flat-topped box yields `flat-cap` +
  `roof-unfitted` named (not silent); an arched doorway fits an arch head; a too-narrow opening
  refuses with `arch-too-narrow` carried; every refusal path leaves a finding (assert no empty
  findings on forced-failure inputs); double-call determinism (deep-equal).
- Verify: `npm run test:unit` green.

## Step 2 — Generator + zero-blob check: `src/form/provision-generate.mjs` (+ test) — commit 2

- `generateProvision(fit, {family, policy})`: solid mass extrusion minus carved apertures; roofs
  via `roofHeightfield` + `generateRoof` (flat-cap masses: one-course cap); opening heads from
  fitted specs; named-space zone-dominant blocks from `policy`; per-cell provenance.
- `assertGeneratedProvenance(artifact, provenance)`: every placement key tagged, sources ∈
  {mass, roof, opening-head}, exact count match — THROW on violation.
- **Tests**: generated box+gable artifact passes AJV (`assertArtifact`) and provenance check;
  planted foreign cell REFUSES; carved aperture is absent from placements (exclusion, not air);
  regenerate-from-serialized-fit is byte-identical; roof cells sit above wallTop only; flat-cap
  course present for refused-roof mass.
- Verify: `npm run test:unit` green.

## Step 3 — Extraction refactor (no behavior change) — commit 3

- styled-milestone.mjs: export `styledStretch(...)` (grammar→dressing→settle verbatim),
  parameterized `spawnGate`/`distillGate` (label arg, default "styled"); `styledChain` =
  `runChain` + `styledStretch`.
- challenge-milestone.mjs: `export` `shellStage` (no call-site change).
- **Verification gate (must pass before step 4):** `npm test` green;
  `npm run styled:cottage -- --repro` MATCH; `npm run styled:cottage -- --offline` OK;
  `npm run reconstructed:cottage -- --offline` OK. Any divergence = the refactor changed behavior;
  fix before proceeding.

## Step 4 — Runner: `benchmarks/sculpture/generated-milestone.mjs` + registry + scripts — commit 4

- Registry `generated: {scale}` (32/32/48); package.json `generated:*` scripts.
- Runner per structure §3: evidence (voxelize + `shellStage` conditioning + refSils) → fit →
  generate (+ provenance check + regenerate-compare) → write `generated/<subj>/base-artifact.json`
  → component plan (wallTop/floor lines supplied) → `buildSkin` → shared `styledStretch` → gate
  CLI `--label generated` → cage evidence (IoU vs GLB refSils AND vs conditioned-blob silhouettes;
  closure; spike/ragged census) → `instrumentDiff` vs committed styled-label gate record →
  `generalizationGrep` → head-to-head rows from `reconstructed/<subj>.json` (+ `styled/church.json`
  for church, cited) → `generated/<subj>.{json,md}`; `--repro` / `--offline`; honest
  `pipeline-failed` records; deterministic stretch double-run byte-compare in-process.
- Verify: `npm test` green (runner itself is GL/judge-gated, not in tests); a dry structural
  smoke if feasible (fit+generate stages only) — otherwise step 5 is the verification.

## Step 5 — Live runs, subject by subject — commits 5a/5b/5c

Order: **cottage → gatehouse → church** (cottage is the best-instrumented; failures surface
cheapest there). Per subject:
- `npm run generated:<subj>` (live: GL frames + 4 judge calls + kit presence).
- `npm run generated:<subj> -- --repro` (fresh-process MATCH) and `-- --offline`.
- Commit the records + sheets with honest messages (losses are findings with causes — verdicts
  committed as judged, single sample, no re-rolls).
- Expected risks (act on, don't smooth): settle non-convergence on generated shells (a wiring
  bug by contract — fix, never widen the bound); zone-map derivation oddities on generated
  geometry (record the diff vs committed zone-map, audit not gate); judge losses on lost detail
  masses (record the gap cause in findings).

## Step 6 — Cross-subject comparison sheet — commit 6

- `pr/assets/generate-first.md`: per-subject table — repair-path row (T-111 reconstructed; church
  also post-T-113 styled FAIL, cited) vs generate-first row: per-azimuth verdicts, gap counts,
  fit errors (named refusals), spike/ragged census, kit presence, cage outcomes, zero-blob check.
- Losses analyzed with causes (E-29 honesty); wins not overstated (instrument receipts beside).

## Step 7 — Close out — commit 7

- design-learnings E-29/S-115 entry if warranted by findings; final `npm test` green; progress.md
  complete.

## Testing strategy summary

| Layer | How verified |
|---|---|
| provision-fit | unit tests (synthetic fixtures, refusal paths, determinism) — in `npm test` |
| provision-generate + zero-blob | unit tests (AJV, provenance refusal, byte-identical regen) — in `npm test` |
| stretch refactor | repro/offline proofs on committed subjects (step 3 gate) |
| runner end-to-end | live runs ×3 + `--repro` fresh-process MATCH + `--offline` re-assert |
| instrument integrity | `instrumentDiff` `diffs: []` per subject, embedded in records |
| generalization | `generalizationGrep` `subjectKeysInRunner: []` embedded; conformance tripwire stays green |

## Commit sequence

1. `feat(E-29 T-115-01): provision-fit core — full component set, tolerance-or-named-finding`
2. `feat(E-29 T-115-01): provision generator + zero-blob provenance check`
3. `refactor(E-29 T-115-01): styled stretch extracted (shared op, label-parameterized gate)`
4. `feat(E-29 T-115-01): generated-milestone runner — the blob is evidence, never the build`
5. a/b/c `feat(E-29 T-115-01): <subj> generate-first head-to-head — <honest outcome>`
6. `docs(E-29 T-115-01): generate-first comparison sheet`
7. (with 6 or separate) progress/learnings.
