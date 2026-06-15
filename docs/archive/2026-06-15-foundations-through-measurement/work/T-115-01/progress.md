# T-115-01 generate-first-provision — Progress

## Completed (all plan steps)

- **Step 0 — baseline**: `npm test` 1499/1499 at HEAD; styled/reconstructed `--offline` re-assert;
  GLBs present for all three subjects.
- **Step 1 — fit core** (commit 1): `src/form/provision-fit.mjs` + tests. Full component set from
  the conditioned evidence occupancy; refused roofs become NAMED `flat-cap` parameters; refused
  heads carry their refusal; sorted-Set serialization round-trips.
- **Step 2 — generator + zero-blob check** (commit 2): `src/form/provision-generate.mjs` + tests.
  `assertGeneratedProvenance` (provenance vocabulary {mass, roof, opening-head}; foreign cell /
  count drift / out-of-vocabulary REFUSE); regenerate-from-record byte-identical.
- **Step 3 — extraction refactor** (commit c449b08): `styledStretch` exported (ONE settle op),
  `spawnGate`/`distillGate` label-parameterized, `shellStage` exported. No behavior change —
  styled --repro REPRODUCED pre/post.
- **Step 4 — runner** (commit 4): `generated-milestone.mjs` behind `generated:{<subj>}`; registry
  `generated: {scale}` 32/32/48; gate `--reference` input flag (aperture fixpoint reference).
- **Step 5 — live runs** (commits per subject): cottage FAIL 12/2 (135° same-object held),
  gatehouse FAIL 12/2 (4/4 drifted, = repair), church FAIL 12/2 (first full gated church run on
  ANY zero-blob build). Kit presence PASS ×3, zero gaps/skips. Zero-blob PASS ×3 (5,069/4,732/
  7,859 cells). `--repro` fresh-process MATCH ×3, `--offline` ×3, instrument `diffs: []` ×3,
  self-grep clean ×3.
- **Step 6 — comparison sheet** (commit 6): `pr/assets/generate-first.md`.
- **Step 7 — close**: `npm test` 1514/1514 green; review.md.

## Deviations from plan (all recorded in-flight)

1. **Gate `--reference` input flag** — the kit-presence aperture fixpoint reads the chain's raw
   input build; the generated path's raw input is its own base. Input plumbing like `--artifact`;
   judged contract untouched (instrument-diff receipts prove it per run).
2. **Roof generation adopts fitted parameters directly** (no swap-ladder rungs): there is no
   inherited roof to arbitrate against; the cage is recorded as evidence per AC #3.
3. **Hollow perimeter wall slabs, no interior floor** (plan said solid): two live-run discoveries —
   (a) solid masses make carved apertures invisible to the openings detector (projection air
   components need true holes); (b) a full floor slab out-weighs the eave as the widest layer and
   flips the concept zone-map's y-anchor (bands derived INVERTED). The blob is a shell; so is the
   generated build.
4. **Band painting + eave-fascia rule**: generated walls paint per the committed concept-derived
   zone-map bands; sheet strips + the wedge's eave course carry the concept's roof dominant — the
   skin's palette discipline requires every concept dominant present in the input manifest (the
   church kit's spruce family vs the concept's dark_oak roof made this load-bearing).
5. **Unsupported-protrusion rule**: a protrusion whose base rests on no generated cell is OMITTED
   with a named `mass-unsupported` finding (gatehouse ×3, church ×2) — never generated floating,
   never copied. Recorded in the record's `generation` block.
6. **Cottage re-judge flap**: under the fascia rule cottage's styled final converged
   byte-identically yet the re-judged verdict moved 11→12 gaps — the known budget-edge judge flap,
   committed as judged (both decisively FAIL).

## Acceptance criteria

1. Generate-first provision mode behind `npm run generated:<subj>`, full component set fitted,
   tolerance-or-named-finding per component — DONE (fit summaries + refusal codes per record).
2. Zero blob cells, machine-checked, unit-tested — DONE (provenance check + regenerate proof;
   set-intersection recorded as evidence, explicitly not the gate).
3. Cage vs the blob (per-azimuth IoU vs GLB AND vs the conditioned blob, closure) recorded — DONE.
4. Head-to-head ×3 under the frozen gates beside T-111 rows, instrument-diff `[]` — DONE
   (per-subject tables in `generated/<subj>.md` + `pr/assets/generate-first.md`; losses with causes).
5. Reproducible (double-run + `--repro` + `--offline`), registry-only, no hand-edits,
   `npm test` green (1514/1514) — DONE.
