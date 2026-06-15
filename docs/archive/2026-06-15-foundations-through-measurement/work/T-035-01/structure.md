# T-035-01 — Structure

File-level blueprint. Additive only; no facade/schema/seam files change. Ordering matters where the
BAML client must regenerate before the tsx concept runner can import the new symbol.

## Files

### CREATE `src/sculpture.mjs` (pure — the unit-tested surface)
Header comment documents the mode + the single-view limitation. Exports:

- `VCONCEPT_SCULPTURE` — `Object.freeze({ id: VCONCEPT_SCULPTURE_METHOD_ID, version: 1, label })`.
- `SCALE_MIN = 8`, `SCALE_MAX = 64`, `DEFAULT_SCALE = 32`.
- `SCULPTURE_DEFAULTS` — `Object.freeze({ seed: 17, serverStateId: "flat-creative-superflat.v1" })`
  (the fixed bookkeeping a subject needs; subject/scale come from the CLI).
- `SCULPTURE_VIEW_3Q` — `Object.freeze({ azimuthDeg: 45, elevationDeg: 30, fov: 45 })`.
- `TURNTABLE = Object.freeze({ centerDeg: 45, amplitudeDeg: 40, frames: 24, elevationDeg: 30, fov: 45 })`.
- `assertSculptureSpec({ subject, scale })` — throws `sculpture: …` on empty subject / non-integer /
  out-of-range scale. Returns the normalized `{subject, scale}`.
- `sculptureScaleCaps(scale)` → `{ maxW, maxH, maxD }` (PURE; the AC "scale wiring").
- `runIdForSubject(seq, subject)` → `"<NNN>-vConcept-<slug>"` (slug = lowercased, non-alnum→`-`).
- `sculptureMetadata({ runId, scale, model })` → Metadata object (method-id pinned).
- `composeSculptureDesignDocPrompt({ subject, scale })` → string (term→object doc, palette discipline).
- `composeSculptureBuildPrompt({ subject, scale, designDoc, runId, model })` → string (freestanding
  3-D, single-view limit, scale caps interpolated, metadata-pin lines).
- `metadataPinLines(meta)` — small shared helper (private or exported for the runner).

Imports: `loadPalette`/`formatPaletteBlocks` are NOT needed (sculpture invents its own palette in the
doc, like the open temple task) — keep `src/sculpture.mjs` dependency-light (only `config.mjs`).

### CREATE `src/sculpture.test.mjs` (unit tests, picked up by `npm test`)
Pure assertions only (no GL, no live calls):
- descriptor identity (`id === VCONCEPT_SCULPTURE_METHOD_ID`, version 1).
- `assertSculptureSpec`: accepts `{subject:"moai",scale:32}`; rejects empty subject, scale 0, 7, 65,
  non-integer, missing.
- `sculptureScaleCaps`: monotonic in scale; caps reflect `scale`; returns three positive ints.
- `composeSculptureDesignDocPrompt`: contains the subject + scale; asks for a *freestanding object*;
  no facade tokens ("facade", "front elevation", "FACES +Z", "relief into").
- `composeSculptureBuildPrompt`: contains subject, scale, the caps numbers, the metadata pin lines
  (runId/method-id/model/seed/serverState); **documents the single-view limit** (matches /back.*sides/i
  or an explicit phrase); contains NO facade-orientation tokens; mentions x/y/z / "in the round".
- `runIdForSubject`: slugifies + zero-pads seq.

### MODIFY `src/config.mjs`
Add (next to the other method-id constants, same doc style):
```js
export const VCONCEPT_SCULPTURE_METHOD_ID = "vconcept-sculpture.v1";
```

### MODIFY `baml_src/conceptart.baml`
Append `function SculptureConceptPrompt(design_doc: string, target_blocks: int, attached: string) ->
string { client ClaudeStub prompt #" … "# }`. Prompt: "CONCEPT ART of a Minecraft-block **OBJECT** …
a SINGLE ISOLATED freestanding object, **3/4 view** (three-quarter, slightly above), on solid
#000000 black, block-scale detail for a ~{{ target_blocks }}-block build", reusing the facade fn's
black-background/segmentation + HARD-LIMITS (no figures finer than blocks, no text) language, but for
an object in the round (not a front elevation). Ends with `{{ design_doc }}` then `{{ attached }}`.

### REGENERATE `baml_client/*` via `npm run baml:gen`
Adds `SculptureConceptPrompt` to `b.request` (async_request.ts/sync_request.ts), `index.ts`,
`inlinedbaml.ts`, etc. Checked-in client updates are expected diff.

### CREATE `benchmarks/sculpture/baml-concept.mts` (tsx shell-out — concept image)
Near-copy of `benchmarks/temple-facade/baml-concept.mts`, swapping
`b.request.FacadeConceptPrompt` → `b.request.SculptureConceptPrompt`. Reads
`{designDocPath, images?, targetBlocks, model, outPath, attached?}` on stdin; renders the prompt
text; `generateImage({prompt, images, model})`; writes PNG to `outPath`; emits a result record on
stdout. The concept is doc-only (no reference image) ⇒ `images: []`.

### CREATE `benchmarks/sculpture/run.mjs` (LIVE runner — the entry point)
`--subject "<term>" --scale <N> [--frames N] [--note ...] [--effort ...] [--model ...]`.
Flow (single `vConcept` approach):
1. `assertSculptureSpec`; resolve seq → runId; mkdir run dir.
2. Stage 1 — `composeSculptureDesignDocPrompt` → `requestText` → `design-doc.md`.
3. Stage 2 — `runBamlConcept({designDocPath, targetBlocks:scale, model:"pro", outPath:concept.png})`
   (spawn `npx tsx benchmarks/sculpture/baml-concept.mts`, mirror `runBamlBuild`).
4. Stage 3 — `composeSculptureBuildPrompt` → `requestDesignArtifactWithImage({prompt, images:[concept
   png], model, effort})` → `artifact` (schema-valid from the seam). Write `artifact.json`.
5. Render — `renderArtifact(artifact, {outPath: render-3q.png, view: SCULPTURE_VIEW_3Q})`; then
   `renderOrbit(artifact, {frames, azimuths: oscillateAzimuths(frames,{centerDeg,amplitudeDeg}),
   view:{elevationDeg,fov}, outDir: runDir/turntable, baseName:"frame"})`; best-effort mp4.
6. Write `summary.json` (seq, runId, subject, scale, method-id, model, blocks, tokens, cost, view,
   turntable params, note), `transcript.jsonl`, regenerate `README.md`.
Lazy-imports the GL render core (`render/src/render-tool.mjs`, `render/src/orbit.mjs`) inside `main`
so importing for a dry check loads no GL. Reuses sdk-binding seams + `PHASE1_MODEL_ID`.

### CREATE `benchmarks/sculpture/README.md`
Title, how-to (`npm run bench:sculpture -- --subject "moai" --scale 32`), the
`<!-- RUNS:START … RUNS:END -->` gallery markers run.mjs regenerates, and a **Known limitations**
section spelling out the single-view (back/sides imagined) limit + the image→3D (TRELLIS) deferral.

### CREATE `benchmarks/sculpture/.gitignore`
`runs/` outputs that shouldn't be committed wholesale — mirror `benchmarks/temple-facade/.gitignore`
(check its contents; likely ignores large generated media, keeps summaries). Match the sibling.

### MODIFY `package.json`
Add script: `"bench:sculpture": "node benchmarks/sculpture/run.mjs"`.

## Module boundaries / interfaces

- `src/sculpture.mjs` is PURE and SDK/GL-free — importable by tests and the runner alike. It owns all
  prompt TEXT (doc + build) and all numeric policy (scale caps, views, turntable params, ids).
- `benchmarks/sculpture/run.mjs` owns I/O, the live seam calls, rendering, and run-dir provenance —
  no prompt wording lives here (it calls the `src/sculpture.mjs` builders).
- `baml-concept.mts` owns ONLY the concept-image transport (BAML render + Nano Banana).
- The seams (`sdk-binding`, `nano-banana`, `render-tool`, `orbit`) are imported unchanged.

## Ordering (must-respect)

1. `src/config.mjs` constant → 2. `src/sculpture.mjs` (+ test) → 3. `npm test` green →
4. `baml_src/conceptart.baml` edit → 5. `npm run baml:gen` (regenerate client) →
6. `benchmarks/sculpture/baml-concept.mts` (imports regenerated symbol) → 7. `run.mjs` + README +
.gitignore + package script → 8. live smoke (`moai`, scale 32) if seam/keys/GL allow.

## Risks

- BAML regen could touch many checked-in `baml_client` files; verify `npm test` still passes after
  regen (the generated client is imported by the facade tsx paths, not by `src/*.test.mjs`, so risk is
  low but checked).
- Live smoke depends on `claude -p` subscription + Gemini + GL — if unavailable at run time, the
  pure tests + a structural dry-run still validate the wiring; document any unrun live step honestly.
