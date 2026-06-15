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

- **Step 4 — `SculptureConceptPrompt` BAML fn + regen.** Added to `baml_src/conceptart.baml`
  (sibling of `FacadeConceptPrompt`; 3/4 freestanding-object framing). `npm run baml:gen` wrote 14
  files; `b.request.SculptureConceptPrompt` resolves; `npm test` stayed green.
- **Step 5 — `benchmarks/sculpture/baml-concept.mts`.** Concept-image tsx runner (doc-only,
  `images:[]`), mirrors the facade one swapping the BAML fn.
- **Step 6 — runner + README + .gitignore + script.** `benchmarks/sculpture/run.mjs` (the
  `--subject/--scale` entry point, 3-stage `vConcept` flow → 3/4 still + rock turntable), README with
  RUNS markers + Known-limitations, `.gitignore` (ignores `transcript.jsonl` + `turntable/`),
  `package.json` `bench:sculpture` script.
- **Step 7 — test gate.** 312 pass / 0 fail.
- **Step 8 — live smoke (`moai`, scale 32, 8 frames).** Ran end-to-end: doc (2109 ch) → concept
  (Nano Banana, 21s) → 35-op build = **3414 blocks, 0 unmapped, schema-VALID** → 3/4 still + 8-frame
  rock turntable. Bounds `x[-6,6] y[0,31] z[-5,7]` — a true freestanding object in all three axes,
  height = scale. Visually a recognizable moai (head/brow/topknot/base), 3/4 not facade; turntable
  frames show real parallax. Cost $0.66.

## Deviation found by the smoke (fixed)
The build prompt initially pinned `metadata.target = "<subject>"` and the runner injected it. But
the **live schema's `metadata.target` is an enum (`house|path|landscape`)** — a subject term there
FAILS the AJV gate (the model correctly omitted it, which is why the raw artifact validated; my
injection then broke it). Fix: `sculptureMetadata` never sets `target`; the build prompt emits no
target pin; the runner leaves model metadata untouched. The **per-subject join key is `trial_id`**
(the run id embeds the subject slug) **+ `summary.json`**. Tests updated to assert target is NOT
pinned. Re-validated VALID; 312 green. (This is the "[[prompt-vs-live-artifact-schema]]" trap.)

## Notes / decisions taken
- `sculptureMetadata` sets `target` only when the caller passes the subject (the only scope where the
  term is known); the build prompt passes it so the artifact's `metadata.target` is the join key.
- Kept palette discipline in the design-doc stage as *prompted* color-theory (the open-subject task
  invents its own palette), matching the facade open-task lineage — no fixed palette whitelist.
