# T-147-01 Structure — file-level blueprint

The shape of the code, not the code. Ordering = commit order (each green on its own). Pure modules
under `src/**` run the test glob (no GL/IO/Date/random); impure runner is `benchmarks/`.

## S1 — The four brushes (pure technique module)

**Create `src/view/facade-articulation.mjs`** — `FACADE_ARTICULATION_SCHEMA`, imports
`surfaceRelief` from `./surface-relief.mjs` and `bareBlock`/`occupancyFromCells` from `./occupancy.mjs`,
`getBrush` from `../pack/idiom-registry.mjs` (for the applier only). Exports:
- `ARTICULATION_DEFAULTS = {depth:1, span:1, run:3}` — declared, never subject-tuned.
- `pilaster(occ, {material, faces, rhythm:{period, phase?}, span?, depth?, zoneOf?, zone?})` →
  `surfaceRelief(occ,{material, faces, rhythm:{axis:"column", every:period, span, phase}, depth, …})`.
  Validates `period≥1`; returns the relief result verbatim (`{placements, report}` + `brush:"pilaster"`).
- `quoin(occ, {material, faces, run?, depth?, zoneOf?, zone?})` → per named face, find the two
  vertical corner columns (min/max along-axis on the exterior skin); emit a proud run up each corner
  with an **alternating depth schedule** (`1,2,1,2…` capped at `depth`) over `run` courses, via
  `surfaceRelief` row-rhythm restricted to the corner column. Returns `{placements, report:{corners,
  proudCells}}`.
- `infillPanel(occ, {memberMaterial, fieldMaterial, faces, rhythm:{period, phase?}, depth?, zoneOf?,
  zone?})` → studs = `surfaceRelief` column rhythm with `memberMaterial`; field = recolor placements
  for the non-stud exterior cells of the named faces to `fieldMaterial` (base plane, no depth — the
  recess-by-exclusion read). Returns `{placements, report:{studs, fieldCells}}`.
- `eaveOverhang(occ, {material, faces, depth?, eaveRow?})` → resolve the eave row (topmost exterior
  wall row of the named faces, or explicit `eaveRow`); `surfaceRelief` row-rhythm `every:1` restricted
  to that row, depth proud. Returns `{placements, report:{eaveRow, proudCells}}`.
- `applyArticulation(occ, plan)` — for each `{brush, params}` in `plan`, `getBrush(brush).fn(occ,
  params)` (door, no direct import), accumulate; returns `{placements, report:{perBrush}}`.

Validation is fail-loud (the surface-relief precedent): bad material / empty faces / period<1 throw.

**Create `src/view/facade-articulation.test.mjs`** — groups FA1–FA9:
- FA1 pilaster: column placements on the rhythm; FA2 rake preserved (`reliefNoRegress` true);
- FA3 quoin: corners only, alternating depth, run length; FA4 idempotent (second run = ∅);
- FA5 infillPanel: studs proud + field recolored, no air; FA6 field excludes stud columns;
- FA7 eaveOverhang: only the eave row, proud, distinct from a storey-floor row;
- FA8 each brush idempotent + pure (two calls byte-equal); FA9 `applyArticulation` composes a plan
  and silhouette no-regress holds for the whole plan.

## S2 — Register the four passes through the door

**Modify `src/pack/idiom-registry.mjs`** — import `pilaster, quoin, infillPanel, eaveOverhang` from
`../view/facade-articulation.mjs`; add four `kind:"pass"` entries mirroring `surface.relief`:
`pilaster`, `quoin`, `infill-panel`, `eave-overhang`. Each: `fn`, `source:
"src/view/facade-articulation.mjs"`, `tests: "src/view/facade-articulation.test.mjs"`, `composition`
(`pilaster/quoin/eave-overhang`: consumes `["occupancy"]`; `infill-panel`: consumes
`["occupancy","zones"]`; all emit `["placements","report"]`), `preview:{substrate:{kind:"shell",spec},
params, realize}` (overlay via the existing `overlayCells`), closed `paramsSchema`.

**Modify `src/pack/brush-door.conformance.test.mjs`** — add `"facade-articulation"` to `TECHNIQUES`;
add `ALLOWED["src/view/facade-articulation.mjs"] = {modules:["surface-relief"], reason:…}`.

**Modify `src/pack/brush-contract.test.mjs`** — count assertion 24 → **28** (title + value).

**Tests touched:** `idiom-registry.test.mjs` — extend the pass-registration test to include the four
new names (closed paramsSchema, `kind:"pass"`, `fn` present). `brush-catalog.test.mjs` passes
unchanged (coverage is computed from the registry).

## S3 — Plan the articulation at compile (program-path wiring)

**Modify `src/recognition/compile.mjs`:**
- New pure helper `facadeArticulationPlan(m, pack, rect)` (module-local) — given a mass with
  `m.facade`, emit `[{massId:m.id, brush, params}]`: per face → `infill-panel` (if `fields`) else
  `pilaster` from `rhythm`+`memberRole`; `quoins` → `quoin`; `courseLines` → `surface.relief` row
  courses; `eaveOverhang>0` → `eave-overhang`. **All roles resolved via `roleBlock(pack, role)`** —
  the program-path vocabulary authority (AC#3). `faces[].wall` → the brush `faces:[wall]`. No `m.facade`
  ⇒ returns `[]`.
- Accumulate across masses into `articulation`; **refine jetty:** when a face has `jettyDepth` and the
  mass has `m.jetty` covering that wall, set that jetty element's `spec.overhang = jettyDepth`.
- Return `{ workshopProgram, articulation }` (additive; absent facade ⇒ `articulation: []` and
  `workshopProgram` byte-identical → all existing destructurers unaffected).

**Tests:** extend `src/recognition/compile.test.mjs` — a no-facade program → `articulation:[]` and the
workshop program is unchanged from the pre-edit snapshot (byte-identity guard); a facade program →
expected plan (brush names, resolved blocks, jetty `overhang` reflects `jettyDepth`).

## S4 — Prove "the recognised grammar actually builds" (integration fixture)

**Create `src/recognition/fixtures/facade/articulated-program.json`** — a minimal valid
`building-program/v1` (rustic pack vocab) with a 2-storey mass carrying `jetty`, `roof.dormers`, and a
`facade` (pilaster face + infill face + quoins + eaveOverhang + a face `jettyDepth`). Committed pin.

**Create `src/recognition/facade-build.test.mjs`** (the end-to-end pure proof):
- load the fixture → `assertBuildingProgram` + `validateProgramAgainstPack` (rustic) pass;
- `compileProgram` → non-empty `articulation`; `realizeProgram` → base occupancy with dormer + jetty
  cells (constructs build); `applyArticulation(occ, plan)` → proud pilaster/quoin/infill/eave cells;
- jetty element `overhang` equals the fixture's `jettyDepth`;
- `reliefNoRegress(occBefore, articulationPlacements, {faces})` → in-plane preserved + ratios preserved.

This satisfies AC#2 without minting a live committed subject or touching the recognition model.

## S5 — Program-path live hook (guarded, byte-identical)

**Modify `benchmarks/sculpture/pattern-book.mjs`:** capture `articulation` from `compileProgram`; after
`realizeProgram`, if `articulation.length`, run `applyArticulation(artifactOccupancy(artifact),
articulation)` and overlay the placements before the grammar stage. Guard: empty ⇒ untouched. Reach
the brushes via the imported `applyArticulation` (which uses `getBrush`); `pattern-book` already
imports from `src/` freely — confirm no direct technique import is added (applier hides it). Keep the
edit comment-clean of subject keys (`generalizationGrep`, research §5). No new npm script needed; the
existing `patternbook:*` cover it (committed subjects stay no-op → byte-identical).

*If S5 risks any committed pin or the self-grep, fall back to S4 as the AC#2 proof and record the live
hook as a named follow-on in `review.md` — the pure plan+applier are the durable deliverable.*

## Ordering & atomicity

1. **S1** brushes + tests — green standalone (no registry coupling yet).
2. **S2** registry + conformance + count — green (`npm test`); catalog/contract pass.
3. **S3** compile plan + jetty refine — green; byte-identity guard test passes.
4. **S4** integration fixture + build test — green (the AC#2 proof).
5. **S5** live hook — green; `patternbook:repro/offline`, `recognize:offline`, `facade:offline`
   byte-identical; `styled:*` unaffected.

Each step commits independently. `npm test` green after each.

## Files touched (summary)

- **Create:** `src/view/facade-articulation.mjs` (+ `.test.mjs`),
  `src/recognition/fixtures/facade/articulated-program.json`,
  `src/recognition/facade-build.test.mjs`.
- **Modify:** `src/pack/idiom-registry.mjs`, `src/pack/brush-door.conformance.test.mjs`,
  `src/pack/brush-contract.test.mjs`, `src/pack/idiom-registry.test.mjs`,
  `src/recognition/compile.mjs`, `src/recognition/compile.test.mjs`,
  `benchmarks/sculpture/pattern-book.mjs`.
- **Untouched on purpose:** `surface-relief.mjs` (reused, not changed), `idiom-card.mjs` (passes need
  no card), `material-vocabulary.mjs` (program-path resolution stays at `roleBlock`), the styled chain,
  all committed artifacts/pins.
