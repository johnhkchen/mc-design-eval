# T-040-01 — Plan: palette-aware-concept

Ordered, independently verifiable steps. Each maps to acceptance criteria (AC1–AC4). Pure code is
unit-tested first (cheap, offline); the live A/B comes last (metered, GEMINI present).

AC recap:
- **AC1** — `.v2` exists beside untouched `.v1`; `baml:gen` regenerates cleanly (addition, not edit).
- **AC2** — real-block swatch grid attached as a multimodal input; prompt instructs value-matching.
- **AC3** — A/B recorded: `.v2` vs `.v1` for ≥2 subjects (moai + organic), with the honesty note +
  any segmentation/quality cost.
- **AC4** — artifacts saved (both concepts + swatch grid); `npm test` green.

## Step 1 — Pure module `src/color/palette-swatch.mjs`

Implement `cardToSwatchGrid`, `paletteSwatchLegend`, `buildPaletteSwatch` per Structure §2.
- `cardToSwatchGrid(card,{cols})`: validate non-empty array; `cols = cols ?? min(card.length,4)`;
  `m = ceil(len/cols)`; build `m×n` grid filling row-major with `card[i].block`, trailing = `null`;
  `legend = card.map(c=>({block:c.block, rgb:c.rgb}))`.
- `paletteSwatchLegend(card)`: join per-entry lines
  `` `${name} → ${block}  ${hex}  L*${value}${snapped ? `  snapped ΔE${deltaE}` : ""}` ``.
- `buildPaletteSwatch(card,{cols,cell=96})`: `renderGridSwatch(cardToSwatchGrid(card,{cols}),{cell})`
  + `paletteSwatchLegend(card)`; return `{swatch, legend, cols, rows}`.

**Verify:** `node -e` smoke — a 2-entry card produces a `1×2` (or `2×1`) grid + a 2-line legend.

## Step 2 — Test `src/color/palette-swatch.test.mjs`

Groups A–F from Structure §3. Anchor color/value assertions on `resolveValueTruePalette` output so the
test proves the T-039-01 → pixels round-trip (e.g. `gray_concrete` paints a low-L\* / dark pixel).
**Verify:** `node --test src/color/palette-swatch.test.mjs` green; then `npm test` → full suite green
(**AC4 test arm**).

**Commit 1:** `feat(E-14 T-040-01): card→swatch-grid module + tests`.

## Step 3 — BAML `.v2` function + regenerate

Append `SculptureConceptPromptV2` to `baml_src/conceptart.baml` (Structure §1) — `.v1` body copied
verbatim + the VALUE-TRUE block + `{{ palette_swatches }}`. Leave `SculptureConceptPrompt` untouched.
Run `npm run baml:gen`.
**Verify:**
- `git diff baml_src/conceptart.baml` shows only an addition; the `SculptureConceptPrompt` lines are
  unchanged (**AC1 frozen-prompt**).
- `baml:gen` exits 0; `git status` shows regenerated `baml_client/` files; `grep -r
  SculptureConceptPromptV2 baml_client` finds the generated binding (**AC1 regenerates cleanly**).

## Step 4 — Additive `.v2` branch in `baml-concept.mts`

Add `variant`/`paletteSwatches` to the stdin destructure (defaults `"v1"`/`""`) and the ternary that
picks `SculptureConceptPromptV2` vs `SculptureConceptPrompt` (Structure §4).
**Verify:** `npx tsx benchmarks/sculpture/baml-concept.mts` with a `variant:"v1"` job behaves as
before (no behavior change for E-13). Type-check implicitly via `tsx` run in Step 6.

**Commit 2:** `feat(E-14 T-040-01): SculptureConceptPrompt .v2 (value-true swatch) + concept transport branch`.

## Step 5 — A/B runner `benchmarks/sculpture/concept-ab.mjs`

Implement Structure §5. Subjects: moai (`001-vConcept-moai`) + pineapple (`013-vConcept-a-pineapple`).
Per subject: resolve card → `buildPaletteSwatch` → encode swatch PNG (lazy `pngjs`) → spawn
`baml-concept.mts` `variant:"v2"` with `images:[swatchPng]` + `paletteSwatches` + `model:"pro"` →
copy `.v1` `concept.png` → write `<key>.ab.json`. Guard on `GEMINI_API_KEY`.
**Verify (dry, no spend):** run with the spawn stubbed / a `--dry` flag prints resolved cards, legend
text, and swatch dimensions for both subjects, and writes the swatch PNGs + `ab.json` (these need no
network). Confirms the deterministic half before spending.

## Step 6 — Live A/B (metered, 2 pro calls)

Run `node benchmarks/sculpture/concept-ab.mjs` for real. Produces, in `docs/active/work/T-040-01/`:
`moai.swatch.png`, `moai.v1.png`, `moai.v2.png`, `moai.ab.json` and the pineapple set (**AC2 attach
happens here; AC4 artifacts saved**).
**Verify:** all 8 files exist; `*.v2.png` are non-trivial PNGs (size > a few KB); `ab.json` carries
the value stats.

## Step 7 — Record the A/B (`a-b-note.md`)

Inspect each `.v1` vs `.v2` (and the `.swatch.png`) visually (Read tool reads PNGs). Write
`a-b-note.md`: per subject, does `.v2` preview the truer/darker value (cite the L\* numbers from
`ab.json`)? Any segmentation cost (does pinning dark values muddy the silhouette-on-black that `.v1`'s
rules protect)? Any quality cost? Net verdict + a recommendation for S-042 (**AC3**).

**Commit 3:** `feat(E-14 T-040-01): palette-aware concept A/B (moai + pineapple) + note`.

## Testing strategy

- **Unit (offline, `src/**/*.test.mjs`):** all of `palette-swatch.mjs` — layout, color fidelity,
  legend text, determinism, validation, and the resolver round-trip. This is the only code on the
  test path; it must stay GL/network/model-free.
- **Integration (manual/benchmark):** `baml-concept.mts` `.v2` branch + `concept-ab.mjs` are exercised
  by the live run (Step 6), not the unit suite — they touch Nano Banana and `tsx`.
- **Regression guards:** `reuse-boundary.test.mjs` (cielab untouched) and the existing 327 tests must
  stay green; the `.v1` BAML diff must be empty.

## Risks & mitigations

- **`baml:gen` drift** — regenerated client may touch many files. Mitigation: review the diff is
  additive (new fn bindings only), commit the regeneration with the `.baml` change.
- **Swatch too coarse for Nano Banana** — few blocks → few big swatches. Mitigation: `cell=96` and a
  ≤4-col grid keep swatches large and legible; the text legend backs it up.
- **`.v2` darkens the silhouette and breaks segmentation** — pinning true (dark) values fights `.v1`'s
  "keep the outer silhouette bright" rule. This is itself an A/B finding; record it in the note rather
  than pre-judging. The `.v1` rules are retained verbatim, so the model still has the silhouette
  guidance; the swatch only changes *interior* value expectation.
- **Metered spend** — 2 pro calls only; `.v1` arm reuses on-disk images; design docs reused (no
  `claude -p`). Bounded.
