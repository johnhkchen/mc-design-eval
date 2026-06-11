# T-115-01 generate-first-provision — Review (handoff)

## What this ticket did

Built and ran **E-29's headline inversion**: a generate-first provision mode where the voxelized
TRELLIS blob is fit evidence and cage target only — **zero blob cells in the artifact,
machine-checked** — and put all three subjects through the frozen gates head-to-head with the
T-111 repair-path results. The answer, recorded with receipts: generate-first is a **peer of the
repair path on the judge** (cottage 12 vs 10 gaps, gatehouse 12 = 12, church 12 = 12 — and the
church runs end-to-end on this path where T-111's repair chain refused pre-gate), **strictly
cleaner under the craft censuses** (spikes 86→53 / 43→26 / 204→62; ragged 15.9%→9.9% on church),
with every loss traced to **named fit refusals** — roof FORM remains THE seam, on every azimuth of
every subject.

## Files created / modified

**New pure cores (in `npm test`):**
- `src/form/provision-fit.mjs` + `.test.mjs` — the full component set fitted from the conditioned
  evidence occupancy (fresh decompose inside; footprint runs + wallTop arbitration; the complete
  roof ladder incl. T-112 hip/pyramid; per-opening head fits). Tolerance-or-named-finding per
  component; refused roofs are NAMED `flat-cap` parameters; sorted-Set serialization round-trips.
- `src/form/provision-generate.mjs` + `.test.mjs` — every artifact cell authored from parameters +
  kit: hollow perimeter wall slabs (thickness 2, no interior floor — see Learnings), per-band wall
  blocks from the committed zone-map record, roofs via `generateRoof` with the eave/sheet fascia
  rule, apertures carved THROUGH the slab along fitted head curves, unsupported protrusions
  omitted with `mass-unsupported`. `assertGeneratedProvenance` = the zero-blob machine check.

**New runner:** `benchmarks/sculpture/generated-milestone.mjs` (`npm run generated:{cottage,
gatehouse,church}` + `--repro`/`--offline`) — evidence (voxelize @ registry scale + in-memory
`shellStage` conditioning) → fit → generate (+ provenance check + regenerate-from-record byte
proof) → `buildSkin` (S-113 authority) → the SHARED `styledStretch` → frozen gate (label
`generated`) → cage evidence (IoU vs GLB and vs blob, closure, census beside declared cells) →
instrument-diff → head-to-head rows → record. Double-run byte-compare; honest `pipeline-failed`;
self-grep clean.

**Modified:**
- `benchmarks/sculpture/styled-milestone.mjs` — `styledStretch` extracted/exported (ONE settle
  op), `spawnGate`/`distillGate` exported label-parameterized. Proven no-behavior-change
  (`styled:cottage --repro` MATCH pre/post).
- `benchmarks/sculpture/challenge-milestone.mjs` — `shellStage` exported (verbatim).
- `benchmarks/sculpture/multi-angle-gate.mjs` — optional `--reference` INPUT flag (the
  kit-presence aperture fixpoint reads the chain's raw input build; for generate-first that is the
  generated base). Input plumbing like `--artifact`; the judged contract is untouched —
  `instrument.diffs: []` on all three subjects is the receipt.
- `benchmarks/sculpture/durable-skin.mjs` — registry data only: `generated: {scale}` (32/32/48 —
  registry-scale alignment everywhere on this path, retiring aabb-affine).
- `package.json` (scripts), `.gitignore` (generated/ PNG stanza).

**Committed records:** `generated/<subj>.{json,md}` + artifacts/fit-record/component-plan per
subject, `multi-angle/<subj>-generated.{json,md}`, gate sheets in `pr/assets/frames/`, and the
cross-subject sheet `pr/assets/generate-first.md`.

## Test coverage

- 15 new unit tests across the two cores (fit refusal paths, determinism, Set round-trip; AJV
  validity, provenance refusals ×3 shapes, through-carve, arch curve, flat-cap, missing family,
  band painting, unsupported protrusion, regenerate proof). `npm test` 1514/1514 green.
- The runner itself is GL/judge-gated (not in `npm test`) — verified live ×3 subjects with
  double-run byte-equality in-process, fresh-process `--repro` MATCH, `--offline` re-asserts, and
  the conformance tripwire (S-113) green over the new files.
- **Gap:** `assembleComponentPlan` and the runner's record-shaping helpers have no direct unit
  tests (exercised live only). The `--reference` gate flag is likewise live-proven, not unit-tested.

## Open concerns / known limitations (all named in records)

1. **Roof form is THE seam.** Every subject FAILs the judge on roof form majors. The fits are
   honest (gatehouse: one sane gable from a fragmented ridge record under-covers the top; church:
   nave gable + tower hip-cap fit but read wrong; named `roof-region-unfitted`/`gable-insane`/
   `end-hip` refusals) — the next epic of work has a single address: roof-form fitting coverage.
2. **Hollow tops read as "open hollow shell"** where roof fits under-cover (gatehouse, church
   minors/majors). A consequence of (1), not of the hollow topology itself.
3. **Judge flap:** cottage re-judged on a byte-identical styled artifact moved 11→12 gaps — the
   known budget-edge flap, committed as judged. Both decisively FAIL; no decision rides on it.
4. **Omitted masses:** gatehouse ×3 / church ×2 protrusions omitted as `mass-unsupported`
   (their blob support was never built). Honest, but visible detail loss the judge may be
   pricing in.
5. **Generation bands borrow the committed zone-map yRanges** measured on the repair-path builds
   (slightly different frames). The skin re-derives bands on the generated geometry, so this only
   affects which blocks are *present* pre-skin — but a future scale change could strand them.
6. Per-mass **storey fitting remains shallow** (wallTop only + `heightDisagreement` evidence) —
   the AC's "storey heights" is satisfied as fit-with-recorded-error, but interior floor lines are
   supplied by bands, not fitted.

## For the human reviewer

The one contract-adjacent change is the gate's `--reference` flag (multi-angle-gate.mjs:240) —
review that it is input plumbing only; the per-run `instrument.diffs: []` receipts are the
machine's proof. The honesty-critical code is `assertGeneratedProvenance`
(provision-generate.mjs) and the regenerate-from-record proof (generated-milestone.mjs,
provisionStage) — together they are the "zero blob cells" claim. Commits: 6 feature/docs commits
on `main`, sequence in progress.md; `pr/assets/generate-first.md` is the epic-facing sheet.
