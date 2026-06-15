# T-017-01 — Structure

The blueprint: exactly what changes, in what order. This ticket is a prompt-hardening pass — the
surface area is intentionally tiny (one source file) plus regenerated/derived artifacts.

## Files changed

### 1. `baml_src/conceptart.baml` — MODIFIED (the only hand-authored source change)

Single function `FacadeConceptPrompt`. Three surgical edits inside the prompt string; no signature
change, no new params.

- **Edit 1 — HARD LIMIT #1 (figures).** Current line:
  `- NO human or animal figures, NO sculptural relief scenes or statues.`
  → strengthen to also override the design doc and give a replacement target: niches/panels that the
  document fills with statuary become blank or rosette panels. The figure ban must read as
  *non-negotiable even when the doc says otherwise*.

- **Edit 2 — HARD LIMIT #2 (text).** Current line:
  `- NO text, letters, numerals, calligraphy, or inscriptions of any kind.`
  → name the specific offender (nameplate / signboard / plaque / cartouche / inscribed tablet above
  the entrance) and give the same blank-or-rosette replacement (per design-learnings recommendation).

- **Edit 3 — segmentation clause** (the paragraph beginning "Keep the structure's OUTER SILHOUETTE
  …"). Two reinforcements:
  - Background: demand **pure `#000000`**, no navy/blue/grey tint, no gradient or vignette.
  - Outermost elements: spires, finials, pinnacles, and the roof crest must be a **light,
    high-contrast** palette color — never a dark/dim tone (e.g. not dark/medium blue) — so the top
    edge cannot merge into the black field. Keep "reserve dark tones for recessed interior areas"
    and "the document's palette wins."

- **Edit 4 (conditional) — HARD LIMIT #3 (filigree).** Only if chapelle's gable star-burst finial
  persists after edits 1–3: append "no star-burst or spiked finials finer than a few whole blocks;
  cap towers with a simple chunky block, not a spike." Applied lazily to avoid over-constraining.

The header comment block (lines 1–6) stays accurate; no comment edit required unless wording drifts.

### 2. `baml_client/**` — REGENERATED (derived, not hand-edited)

`npm run baml:gen` rewrites `baml_client/` from `baml_src/`. The concept worker imports
`../../baml_client/index.ts` → `b.request.FacadeConceptPrompt`, so the regenerated client carries
the new prompt text. Committed as a derived artifact (the repo tracks `baml_client/`).

### 3. `benchmarks/temple-facade/concepts/<ref>-C-flash.png` — REGENERATED (5 files)

`taj-C-flash.png`, `horyuji-C-flash.png`, `chapelle-C-flash.png`, `arc-C-flash.png`,
`mausoleum-C-flash.png`. Overwritten in place by the orchestrator. These are the acceptance
evidence (saved under `concepts/`, viewed). Any per-reference redraw overwrites the same path.

### 4. `docs/knowledge/design-learnings.md` — APPENDED (journal)

A new `## Stage-1 concept-art · segmentation + resolution hardened (E-09, T-017-01)` section: the
per-reference audit table (round-0 → final), the prompt diff(s) made, and the verdict (all 5 cleanly
segmentable + resolution-disciplined). This satisfies the ticket's journal acceptance criterion.

### 5. `docs/active/work/T-017-01/*` — RDSPI artifacts (this work dir)

research.md, design.md, structure.md, plan.md, progress.md, review.md. Not part of the shipped
change; Lisa's phase-transition evidence.

## What is explicitly NOT touched

- `benchmarks/temple-facade/conceptart.mjs` — default variant C, TARGET_BLOCKS=48, variant set all
  unchanged. (No `--variant` / resolution change; the ticket holds both constant.)
- `benchmarks/temple-facade/baml-concept.mts` — transport/worker logic unchanged.
- `src/nano-banana.mjs` — Gemini client unchanged.
- The five `runs/<id>-vRefRevise-designdoc/{design-doc.md,render.png}` fixtures — read-only inputs;
  editing them was rejected in design (Option B).
- `scripts/`, `schema/`, `src/**` tests — untouched; `npm test` is a regression gate only.

## Ordering (where it matters)

1. Edit `conceptart.baml` (edits 1–3).
2. `npm run baml:gen` — MUST run before any regeneration, or the worker emits the old prompt.
3. Regenerate all 5 C concepts; VIEW.
4. Conditional edit 4 + repeat 2–3 only for any reference still failing.
5. `npm test`; commit; journal.

The hard dependency is **2 before 3** — the client must be regenerated before images, every loop.

## Interfaces / contracts (unchanged)

- `FacadeConceptPrompt(design_doc: string, target_blocks: int, attached: string) -> string` — same
  signature; only the prompt body text changes.
- Worker stdin job shape and `generateImage` contract — unchanged.
