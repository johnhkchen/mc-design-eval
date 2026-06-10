# T-098-01 placement-grammar — Plan

Six steps, each independently verifiable and atomically committable. `npm test` (full suite,
currently 1146+ tests) must stay green after every commit. No step touches durable-skin.mjs,
zone-fill.mjs, structural-read.mjs, or any committed E-24/E-25 record.

## Step 1 — frame-line geometry core

**Create** `src/view/frame-lines.mjs`: `FRAME_KINDS`, `cornerColumns`, `wallCells`, `frameLines`,
`fieldInstances` per structure.md. Internal helpers: side-exposure test, interior-floor-line
selection (strictly between ground layer and upperTop).

**Create** `src/view/frame-lines.test.mjs` — synthetic gabled hut fixture:
- 7×7 footprint, two storeys (y0–4 base, y5–9 upper), floor slabs at y0/y5/y10 (fill ≥ 0.6),
  gable ridge on the z-axis (roof courses stepping in from ±x), chimney column rising past the roof.
- Assertions: 4 corner columns exactly; cornerPost cells span both storeys (the rhythm AC);
  floorLine cells only at y5 on wall faces (y0 ground + y10 eave excluded); roofline includes the
  flat eave rows AND the rake diagonal on the gable ends; precedence (a corner cell at the eave is
  cornerPost, not roofline); chimney cells above the roof plane: top-exposed cells excluded via
  roofKeys, the adjacency ring recorded; fields = wall minus frame, instances bounded (no instance
  contains a frame cell; door/window air not in any instance); empty occ → empty results.

**Verify:** `node --test src/view/frame-lines.test.mjs`, then full `npm test`.
**Commit:** `feat(E-26 T-098-01): frame-line read — floor lines, corner posts, rakes+eaves from geometry`

## Step 2 — binding + grammar core

**Create** `src/form/placement-grammar.mjs`: `GRAMMAR_SCHEMA`, `rankCandidates`, `bindKit`,
`bindOpenings`, `placementGrammar` per structure.md. Composition inside `placementGrammar`:
diffed frame placements → `overlayPlacements` → `zoneFill` (shipped policy, exposure skin) →
`frameRefilled` + precondition report → field/opening instances + bindings.

**Create** `src/form/placement-grammar.test.mjs`:
- `rankCandidates`: specificity beats confidence beats lex; stable total order.
- `bindKit` on a cottage-shaped synthetic kit (mirror of the committed record's shape):
  frame=spruce_planks; panel(band1)=smooth_sandstone (specificity 1 beats 3); panel excludes the
  frame block; course skips flagged-mismatch cobblestone; fixture entries never bind cube features;
  empty kit → all-null bindings + skipped rows, no throw.
- `bindOpenings`: door→`*door`, window→top-ranked remainder; no treatments → null + candidates [].
- `placementGrammar` end-to-end on the Step-1 hut + synthetic kit + synthetic shipped policy:
  placements only recolor existing solid cells (never fixtures); `frameRefilled === 0`;
  chimney preserve-run survives the internal fill; two invocations produce `deepEqual` output
  (determinism); a policy missing the frame block in preserve flips `preconditions.frameInPreserve`
  false (reported, not thrown); rebuilt artifact (template + placements) passes `assertArtifact`
  (live AJV gate, fixture-card precedent).

**Verify:** module tests + full `npm test`.
**Commit:** `feat(E-26 T-098-01): placement-grammar core — kit binds to feature instances, fill keeps the frame`

## Step 3 — runner + wiring

**Create** `benchmarks/sculpture/placement-grammar.mjs` per structure.md (load committed inputs,
reconstruct zoneOf via `zonesFromBands`, `sub` composition mirroring buildSkin:340, double-run proof,
gates incl. runner-local band-evidence arithmetic, renders at `MULTI_ANGLE_GATE.azimuths`, sheets via
`composeSheet`, record + frames, `--offline`).
**Modify** `package.json`: `"grammar:cottage"`, `"grammar:gatehouse"` after `gate:multi`.
**Modify** `.gitignore`: placement-grammar PNG stanza (records/artifact committed, run PNGs ignored,
frames exception comment per existing pattern).

**Verify (no GL needed):** `node benchmarks/sculpture/placement-grammar.mjs` (no --subject) → usage
error; `--subject church` → honest THROW (no durable-skin artifact/kit); `npm test` green (runner has
no test file — impure wiring, seam invariant).
**Commit:** `feat(E-26 T-098-01): placement-grammar runner — recorded pipeline order, refill-proof gate`

## Step 4 — cottage run (the AC#3 evidence)

`npm run grammar:cottage` (live, GL). Expected: bindings frame=spruce_planks / band0=tuff (shipped) /
band1=smooth_sandstone / course=spruce_planks; frame placements > 0 with all three kinds present;
`frameRefilled === 0`; coverage gate + band evidence PASS (headroom: band0 0.683, band1 0.78 vs 0.5);
both storeys show posts + floor beam + rakes in the after-sheet. Then
`npm run grammar:cottage -- --offline` re-asserts.

Inspect the after-sheet renders at all four azimuths before committing (renders are evidence;
`reproducibility-excludes-gl-from-decisions` — gates decide, eyes confirm the rhythm reads).

**Commit:** record + artifact + `pr/assets/frames/grammar-cottage-{before,after}.png` —
`feat(E-26 T-098-01): cottage framing rhythm — frame lines on both storeys, fields stay panel`

## Step 5 — gatehouse generalization run

`npm run grammar:gatehouse` + `--offline`. Expected: frame=cobblestone (thin-sample allowed),
course=deepslate_bricks; proves zero subject constants (same code path, different data). If a gate
fails honestly (e.g. gatehouse band coverage), the failure record + analysis goes in progress.md and
review.md — the cottage AC does not depend on this step.

**Commit:** `feat(E-26 T-098-01): gatehouse grammar run — second subject, same grammar`

## Step 6 — review artifact

progress.md updated throughout; review.md last (changes, coverage, concerns).

## Testing strategy summary

- **Unit (node --test, pure, no GL):** frame-lines geometry on synthetic hut; binding rules;
  end-to-end grammar incl. determinism, fill-survival, live AJV gate. ~25–30 new tests.
- **Integration:** the runner's own gates ARE the integration test (double-run byte-equality,
  refill-proof, coverage/band re-gates, offline re-assert) — same convention as durable-skin.
- **Visual evidence:** committed before/after 4-azimuth sheets (never decision inputs).

## Risks & mitigations

- **Roofline over-classification** (chimney ring, dormer-less assumption): counted in the record;
  synthetic test pins the chimney behavior so it is a documented contract, not an accident.
- **Coverage dip below 0.5 after frame paint:** ample headroom on cottage; gate THROWs honestly if a
  subject lacks it (E-25 Rule 6), recorded as pipeline-failed.
- **Frame block coincides with band dominant** (single-material subjects): frame placements diff to
  zero on those bands — grammar degrades to a recorded no-op, no fight with the fill.
- **`fill.policy` preserve sets in the durable record are shipped-space** (verified: band0 dominant
  tuff) — the runner must NOT re-map them through `sub` (only kit-bound blocks get `sub`).
