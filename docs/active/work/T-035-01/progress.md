# T-035-01 — Progress

## Done
- **Step 1 — config method-id.** Added `VCONCEPT_SCULPTURE_METHOD_ID = "vconcept-sculpture.v1"`
  to `src/config.mjs` (single-sourced, doc-commented like the siblings).
- **Step 2 — pure module `src/sculpture.mjs`.** Descriptor `VCONCEPT_SCULPTURE`; constants
  (`SCALE_MIN/MAX`, `DEFAULT_SCALE`, `SCULPTURE_DEFAULTS`, `SCULPTURE_VIEW_3Q`, `TURNTABLE`);
  `assertSculptureSpec`, `sculptureScaleCaps`, `runIdForSubject`, `sculptureMetadata`,
  `metadataPinLines`, `composeSculptureDesignDocPrompt`, `composeSculptureBuildPrompt`. SDK/GL-free
  (only imports `config.mjs`). Build prompt inverts every facade assumption + states the single-view
  limitation + interpolates scale caps + pins metadata.
- **Step 3 — unit tests `src/sculpture.test.mjs`.** 10 tests; full suite **312 pass / 0 fail**
  (302 baseline + 10). Deviation: the "no facade tokens" guard initially banned the bare word
  "facade", which both prompts legitimately use in NEGATION ("NOT a facade"). Narrowed the guard to
  facade-ORIENTATION assertions (`front elevation`, `FACES +Z`, `relief into/recedes`, `model only
  the front`, `connected plane`) — the harmful positive frames, not the negated word.

## Remaining
- **Step 4** — `SculptureConceptPrompt` BAML fn + `npm run baml:gen`.
- **Step 5** — `benchmarks/sculpture/baml-concept.mts` (concept-image tsx runner).
- **Step 6** — `benchmarks/sculpture/run.mjs` + README + `.gitignore` + `package.json` script.
- **Step 7** — full `npm test` gate after the BAML regen.
- **Step 8** — live smoke `--subject "moai" --scale 32` (best-effort; metered + Gemini + GL).

## Notes / decisions taken
- `sculptureMetadata` sets `target` only when the caller passes the subject (the only scope where the
  term is known); the build prompt passes it so the artifact's `metadata.target` is the join key.
- Kept palette discipline in the design-doc stage as *prompted* color-theory (the open-subject task
  invents its own palette), matching the facade open-task lineage — no fixed palette whitelist.
