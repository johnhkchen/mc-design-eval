# T-124-01 — style-pack-and-idioms — Progress

All 7 plan steps complete. Full `npm test`: **1703/1703 pass**.

- [x] **Step 1 — gap constructs** (`src/form/idiom-constructs.mjs` + tests, 16/16): dormerGable,
      chimneyStack, jettyOverhang, plinthBand. Deviation: the worked-example test uses an explicit
      1×1 aperture (the default 1×2 swallows a 3-wide dormer's center profile cell — correct
      behavior, poor demonstration).
- [x] **Step 2 — idiom registry** (`src/pack/idiom-registry.mjs` + tests, 10/10): 11 constructs
      (incl. roof adapters over generateRoof) + 4 passes; paramsSchema per entry; getIdiom throws
      on unknown names.
- [x] **Step 4 (taken before 3) — conformance checks** (`src/pack/conformance.mjs` + tests, 9/9):
      courses-even, symmetry-held, openings-rhythm, palette-in-pack (new predicates) +
      watertight/single-component (E-25 keeper wrappers); runConformance driver. Reorder reason:
      the pack loader imports `CONFORMANCE_CHECK_NAMES` for semantic validation.
- [x] **Step 3 — pack contract** (`schema/style-pack.schema.json` + `src/pack/style-pack.mjs` +
      tests, 10/10): Ajv2020 gate (artifact.mjs idiom), semantic validation (provenance refs,
      idiom resolution + params, valueCheck snapshot re-derivation against the committed 305
      table, proportions, check vocabulary, zone seats), `MATERIAL_PRECEDENCE`, `packPolicy` →
      composeVocabulary seam. Fix found mid-step: `loadBlockTable()` returns `{blocks: […]}`, not
      an array.
- [x] **Step 5 — the rustic pack** (`packs/rustic.json` + `packs/README.md` +
      `scripts/validate-pack.mjs` + `pack:validate` script): 13 palette roles over 6 provenance
      sources, 15 idioms, three-band zone seats (base/upper/roof); validates clean (0 findings);
      grounded in the cottage/barn material maps and the stone-ground-storey memory.
- [x] **Step 6 — idiom render card** (`src/pack/idiom-card.mjs` + tests 5/5 +
      `benchmarks/sculpture/idiom-card.mjs` + `idioms:card` script): 20 plots covering every
      construct (dormer ×4 facings, jetty ×4 edges, chimney ×3 caps, both gable axes); gate pass,
      **unmapped 0**, 5 renders (4 gate azimuths + front) committed with sha256 receipts; sheet
      visually verified (crown oversail, dormer gables, jetty joists all read).
- [x] **Step 7 — full gate + review**: `npm test` 1703/1703; review.md written.

Commits: idiom constructs → registry → conformance → contract+pack → render card (5 feature
commits + docs).
