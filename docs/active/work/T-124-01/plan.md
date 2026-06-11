# T-124-01 — style-pack-and-idioms — Plan

Phase 4 of 6. Ordered, atomically-committable steps; each verified before the next. Alignment
note: `docs/knowledge/pipeline-philosophy.md` (ratified today) names this ticket's deliverables as
Stage 0 (material story → palette) and Stage 4 (brushes = "parametrized, composable, unit-tested,
preview-carded generators — the idiom registry"). E-32 (T-128-01 brush registry) builds ON this
registry — keep entries parametrized + preview-carded so E-32 extends rather than rewrites.

## Step 1 — Gap constructs: `src/form/idiom-constructs.mjs` (+ tests)

Implement `dormerGable`, `chimneyStack`, `jettyOverhang`, `plinthBand` per structure §1.
Before coding, read `src/form/shaped-vocab.mjs` (done), `src/view/roof-generate.mjs` (stair state
emission + STAIR_FACING) and its test file (fixture style) to match emission order and state
vocabulary exactly.

Tests (both-ways, exhaustive orientation):
- dormer: 4 facings × {cell census, cheek/face/roof partition, aperture keys punched out of the
  face, stair `facing` correct per pitch side, ridge row at computed ridgeY}; width even → throws;
  width < 3 → throws; non-stair roofBlock accepted (it's just an id — state legality is the
  card's job) but malformed origin/facing → throws.
- chimney: 1×1 and 2×2 footprints; height courses; `crown` cap = one-cell oversail ring (ring
  cells strictly outside footprint at topY); `slab` cap emits `{type:"bottom"}`; `columns` equals
  footprint columns; height < 1 → throws.
- jetty: 4 (axis × side) edges; beam cells exactly `overhang` outside the wall line over the
  range; joists at `joistEvery` beneath; `upperWallLine.at` shifted by overhang in the signed
  direction; degenerate range → throws.
- plinth: perimeter-only (no interior cells), `courses` layers, `inset` shrinks the ring;
  inverted footprint → throws.

Verify: `node --test src/form/idiom-constructs.test.mjs`. **Commit 1**
`feat(E-31 T-124-01): idiom gap constructs — dormer, chimney, jetty, plinth (pure, orientation-tested)`.

## Step 2 — Registry: `src/pack/idiom-registry.mjs` (+ tests)

Read `src/view/roof-generate.test.mjs` first and lift its gable-record fixture as the adapter
template. Implement the construct adapters (`roofGableConstruct`, `roofHipConstruct`,
`roofPyramidConstruct`, `archConstruct`, `flatHeadConstruct`) and the frozen `IDIOM_REGISTRY`
(constructs + passes), `idiomNames()`, `getIdiom()` per structure §2. Pyramid = hip with
degenerate ridge (ridge length 0 / both ends hipped) — confirm against roof-fit's hip plane
helpers; if `generateRoof` can't express it cleanly, fall back to four `stairRun` soffits…
no — keep canonical: pyramid via gable record with hip ends on both ends and minimal ridge; name
the deviation in progress.md if the fixture shows otherwise.

Tests: every registered name resolves and is frozen; each construct realizes a minimal synthetic
spec to non-empty `cells` with states drawn only from the proven set (assert per-block state keys
⊆ {facing, half, shape, type}); `getIdiom("nope")` throws; `kind` partition matches structure §2;
paramsSchema present on every construct entry and is a valid JSON-schema fragment (compiles under
Ajv2020).

Verify: targeted node --test. **Commit 2**
`feat(E-31 T-124-01): idiom registry — name → canonical generator, constructs + passes`.

## Step 3 — Pack contract: schema + `src/pack/style-pack.mjs` (+ tests)

Write `schema/style-pack.schema.json` (structure §3), then the loader module (structure §4):
parse/assert (artifact.mjs idiom, reuse `formatErrors`), `validateStylePack` semantic layer
(provenance referential integrity; idiom resolution + params vs paramsSchema; cube blocks in
305 table with valueCheck snapshot recompute via `loadBlockTable`/`familyOf`; fixture/rail
classification via the kit formClass name rule — read `src/form/kit.mjs` for the exact rule
before coding; proportions sanity), `loadStylePack`, `packPolicy`, `MATERIAL_PRECEDENCE`.

Tests: minimal valid pack accepted; each required field's absence rejected with a located error;
semantic both-ways — dangling provenance ref / unknown idiom / off-table cube / stale Lab
snapshot / min>max proportions each produce a named error finding; `packPolicy` returns
`{dominant, preserve}` per band consumable by `composeVocabulary` (smoke: call the real
`composeVocabulary` with it).

Verify: targeted node --test. **Commit 3**
`feat(E-31 T-124-01): style-pack contract — schema, loader, semantic validation, authority seam`.

## Step 4 — Conformance checks: `src/pack/conformance.mjs` (+ tests)

Implement the six checks + `runConformance` per structure §5. Read `src/view/shell-integrity.mjs`
closureCheck signature and `src/form/voxel-components.mjs` before wiring wrappers; build synthetic
occupancies with the existing occupancy helpers (read `src/view/occupancy.mjs` for the
constructor — likely `occupancyFromCells`).

Tests (both-ways per AC): even vs ragged band boundary; single- vs mixed-material course;
mirrored fixture vs one-cell perturbation; rhythmic vs off-rhythm openings + mismatched sills;
all-in-pack vs one foreign block (and: stairs of a palette cube are NOT foreign — the derived
shaped family rule); closed shell vs one-hole shell (declared opening regions honored); single
mass vs detached blob; `runConformance` runs exactly the pack-listed checks in order, throws on
an unknown check name.

Verify: targeted node --test. **Commit 4**
`feat(E-31 T-124-01): pack conformance checks — regularity predicates + E-25 keeper wrappers`.

## Step 5 — The rustic pack: `packs/rustic.json` (+ CLI + README)

Author the pack per design D9. Grounding pass first: view both concept images
(`runs/014-…cottage/concept.png`, `runs/017-…barn/concept.png`) and read the committed
material-maps/zone-maps for both subjects — the palette must be checkable line-by-line against
them (cottage ground storey is stone — refuted-plinth memory; barn roof dominance per T-118/T-122
records). Compute valueCheck snapshots with a scratch script through `loadBlockTable`/`familyOf`
(then discard the script). Write `scripts/validate-pack.mjs` (thin CLI) + `packs/README.md`; add
`pack:validate` npm script. Add the "rustic loads + validates clean" test to style-pack.test.mjs.

Verify: `npm run pack:validate` clean; targeted tests. **Commit 5**
`feat(E-31 T-124-01): the rustic pack — diegetic provenance, curated palette, human-reviewable`.

## Step 6 — Render card: layout + runner + committed renders

`src/pack/idiom-card.mjs` (IDIOM_CARD_SPECS over rustic palette blocks; layout + test) and
`benchmarks/sculpture/idiom-card.mjs` (read `benchmarks/sculpture/fixture-card.mjs` first; same
artifact/AJV/render/receipt shape; fail on non-empty `unmapped`). Add `idioms:card` npm script.
Run it; eyeball the PNGs (form before finish: dormers read as dormers at all 4 azimuths, chimney
crown oversails, jetty line visible). Commit PNGs + receipt.

Verify: runner exit 0, `unmapped: []` in receipt, renders visually sane. **Commit 6**
`feat(E-31 T-124-01): idiom render card — every milestone idiom realized, unmapped empty`.

## Step 7 — Full gate + Review

`npm test` (full chain) green. Write `progress.md` final state + `review.md` (changes, coverage,
open concerns: e.g. pyramid adapter caveats, conformance check definitions vs future workshop
use, E-32 registry handoff).

## Testing strategy summary

- **Unit (node:test, colocated):** every new pure module, both-ways on every conformance check
  and every spec validator (the AC's explicit demand). Exhaustive orientation on constructs.
- **Integration-ish (still unit glob):** rustic.json validated by the real loader; packPolicy fed
  to the real composeVocabulary; registry constructs realized end-to-end to placements.
- **Render (manual, receipted):** the idiom card — the only GL touch; its receipt + PNGs are the
  committed evidence (`unmapped` empty is machine-checked by the runner, not by unit tests).

## Risks & mitigations

1. **Gable-record construction is fiddly** (sane flags, ends, footprint cols) → lift fixtures from
   roof-generate.test.mjs verbatim; if pyramid can't be expressed, register `roof.pyramid` via the
   hip-fit path or document the gap honestly in review.md rather than faking it.
2. **Render environment** (headless GL) may be unavailable mid-session → all other steps are
   GL-free; the card step is last and isolated; if the render fails environmentally, commit the
   pure layout + runner and record the blocked render honestly.
3. **Occupancy API mismatch** for conformance fixtures → read occupancy.mjs before Step 4; checks
   accept the same occ shape the keepers already consume.
4. **Sibling thread on T-123-01** shares no files with this plan (verified: new files only +
   package.json scripts block — small merge surface; commit early, serialize via lisa's lock).
