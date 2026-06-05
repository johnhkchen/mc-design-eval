# T-035-01 — Plan

Ordered, independently-verifiable steps. Each step ends in a green `npm test` (or a documented
live-only check). Commit after each meaningful unit.

## Step 1 — config method-id
- Add `VCONCEPT_SCULPTURE_METHOD_ID = "vconcept-sculpture.v1"` to `src/config.mjs`.
- Verify: `node -e "import('./src/config.mjs').then(m=>console.log(m.VCONCEPT_SCULPTURE_METHOD_ID))"`.
- Commit: `feat(sculpture): add vConcept sculpture method-id to config`.

## Step 2 — pure module `src/sculpture.mjs`
- Implement descriptor, constants (`SCALE_MIN/MAX/DEFAULT_SCALE`, `SCULPTURE_DEFAULTS`,
  `SCULPTURE_VIEW_3Q`, `TURNTABLE`), `assertSculptureSpec`, `sculptureScaleCaps`, `runIdForSubject`,
  `sculptureMetadata`, `metadataPinLines`, `composeSculptureDesignDocPrompt`,
  `composeSculptureBuildPrompt`. All PURE; no SDK/GL/fs imports beyond `config.mjs`.
- The build prompt MUST: invert facade orientation (no "FACES +Z"/"front elevation"/"relief into −Z"/
  "connected plane"); state full x/y/z "in the round"; embed the single-view limitation sentence;
  interpolate `sculptureScaleCaps(scale)`; emit metadata pin lines.
- Verify: import + smoke a `console.log` of both prompts for `moai`/32; eyeball.

## Step 3 — unit tests `src/sculpture.test.mjs`
- Cover descriptor, `assertSculptureSpec` (accept + 5 reject cases), `sculptureScaleCaps`
  (monotonic, positive ints, reflects scale), doc prompt (subject+scale present, no facade tokens),
  build prompt (subject+scale+caps+metadata-pins present, single-view limit present, no facade
  tokens, x/y/z present), `runIdForSubject` (slug + zero-pad).
- Verify: `npm test` → was 302, now **302 + N pass, 0 fail**.
- Commit: `feat(sculpture): pure prompt builders + scale wiring (unit-tested)`.

## Step 4 — BAML `SculptureConceptPrompt` + regen
- Append `SculptureConceptPrompt(design_doc, target_blocks, attached)` to `baml_src/conceptart.baml`
  (3/4 isolated-object framing; reuse black-bg/segmentation/HARD-LIMITS language, object not facade).
- `npm run baml:gen`; confirm `SculptureConceptPrompt` appears in `baml_client/async_request.ts`.
- Verify: `npm test` still **green** (generated client must not break existing tsx/import paths);
  `node -e` is not enough (TS) — instead `npx tsx -e "import {b} from './baml_client/index.ts';
  console.log(typeof b.request.SculptureConceptPrompt)"` prints `function`.
- Commit: `feat(sculpture): SculptureConceptPrompt BAML fn + regenerated client`.

## Step 5 — concept-image runner `benchmarks/sculpture/baml-concept.mts`
- Copy `temple-facade/baml-concept.mts`, swap to `b.request.SculptureConceptPrompt`; default
  `images: []` (doc-only). Keep the dummy-ANTHROPIC_API_KEY render-only guard.
- Verify (live, optional): pipe a tiny `{designDocPath, targetBlocks:32, model:"flash", outPath}` and
  confirm a PNG is written (uses GEMINI_API_KEY). If keys/network absent, defer to Step 8.

## Step 6 — live runner `benchmarks/sculpture/run.mjs` + README + .gitignore
- Implement the 6-stage flow (Structure §run.mjs), importing builders from `src/sculpture.mjs`, seams
  from `src/sdk-binding.mjs` + `src/nano-banana.mjs` (via the tsx runner), render core lazily.
- `runBamlConcept(input)` mirrors facade `runBamlBuild` (spawn `npx tsx … baml-concept.mts`).
- Turntable: `oscillateAzimuths(frames, {centerDeg, amplitudeDeg})` → `renderOrbit`. Best-effort mp4.
- README with RUNS markers + Known-limitations; `.gitignore` mirrors temple-facade's.
- `package.json`: add `bench:sculpture`.
- Verify (structural, no live call): `node --check benchmarks/sculpture/run.mjs`; `node -e` import of
  the parseArgs/flow that doesn't touch the seam if factored; at minimum syntax-check + an
  `--help`/unknown-arg path that exits without a model call.
- Commit: `feat(sculpture): vConcept sculpture runner (--subject/--scale) + 3/4 + rock turntable`.

## Step 7 — full test gate
- `npm test` → **all green** (302 baseline + sculpture units). This is the AC "existing tests stay
  green; new pure logic unit-tested" gate. Hard requirement before Review.

## Step 8 — live smoke (AC #1), best-effort
- `npm run bench:sculpture -- --subject "moai" --scale 32 --note "T-035-01 smoke"`.
- Expect: `design-doc.md`, `concept.png`, `artifact.json` (schema-valid), `render-3q.png`,
  `turntable/frame.*.png`, `summary.json`, README updated.
- If the live seam / Gemini / GL is unavailable in this environment at run time, record the exact
  failure point and that the wiring is otherwise verified by Steps 3+7 — do NOT fake a result.
- Commit any committable run provenance per `.gitignore` policy.

## Testing strategy

- **Unit (`npm test`, must pass):** every pure function in `src/sculpture.mjs` — spec validation,
  scale caps, prompt content invariants (subject/scale present; facade tokens ABSENT; single-view
  limit present; metadata pins present). These are the regression guard for "object-oriented, not
  facade" and "`--scale` honored".
- **Generation gate:** `baml:gen` must leave `npm test` green and expose the new symbol.
- **Integration (manual/live, not in `npm test`):** the end-to-end smoke (Step 8), exactly like
  `bench:temple-facade`. Verified by artifact schema-validity (the seam validates) + non-empty
  renders + a populated turntable dir.
- **Structural:** `node --check` on the runner + concept tsx; import-time purity of `src/sculpture.mjs`
  (no GL/SDK pulled in) implicitly proven by the unit tests running under the plain test glob.

## Verification criteria (maps to ACs)

- AC1 end-to-end term run → Step 8 (live) + Steps 2/5/6 wiring.
- AC2 object-oriented concept+build prompts, `--scale` honored → Steps 2/3/4 (tests assert no facade
  tokens, caps present), parseArgs `--scale`.
- AC3 single-view limit documented → build prompt sentence (Step 2/3 test) + README (Step 6).
- AC4 tests green + new pure logic unit-tested → Steps 3/7.

## Rollback / deviation policy
Each step is additive and isolated; reverting a commit removes its files/constant without touching
facade code. If `baml:gen` produces an unexpectedly broad or breaking diff, fall back to emitting the
concept prompt as a plain JS template in `src/sculpture.mjs` (Design Decision 2 alt) and skip Steps
4–5's BAML edit — documented as a deviation in `progress.md` if taken.
