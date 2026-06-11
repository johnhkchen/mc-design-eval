# T-124-01 — style-pack-and-idioms — Progress

Tracking the 7 plan steps. Updated after each commit.

- [x] **Step 1 — gap constructs** (`src/form/idiom-constructs.mjs` + tests): dormerGable,
      chimneyStack, jettyOverhang, plinthBand. 16/16 tests. Deviation: none — the worked-example
      test uses an explicit 1×1 aperture (the default 1×2 swallows the 3-wide dormer's center
      profile cell, which is correct behavior but a poor geometry demonstration).
- [ ] Step 2 — idiom registry (`src/pack/idiom-registry.mjs` + tests)
- [ ] Step 3 — pack contract (schema + `src/pack/style-pack.mjs` + tests)
- [ ] Step 4 — conformance checks (`src/pack/conformance.mjs` + tests)
- [ ] Step 5 — the rustic pack (`packs/rustic.json` + CLI + README)
- [ ] Step 6 — idiom render card (layout + runner + committed renders)
- [ ] Step 7 — full `npm test` + review.md
