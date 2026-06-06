# T-018-01 · Research — concept stage consolidation (terminal link)

Descriptive map of the E-09 stage-1 concept-art chain as it stands at the end of S-015…S-017, so the
synthesis (design.md onward) rests on what actually exists, not on assumption. **This is a synthesis
ticket — no new experiment.** The job is to (a) confirm the locked artifacts, (b) distill the chain
into a durable `design-learnings.md` section, and (c) record an explicit stage-2 handoff.

## What stage 1 is, in the pipeline

E-09 is the image→3D voxel pipeline: a design doc + reference become a **concept image** (stage 1,
Nano Banana / Gemini), which TRELLIS 2 then reconstructs into a 3-D voxel mesh (stage 2), which is
quantized into a Minecraft build. Stage 1's whole reason to exist is to hand TRELLIS an image it can
segment and reconstruct cleanly. So stage-1 quality is not "is it pretty" — it is **"can TRELLIS
consume it":** isolated subject, clean background, block-scale (not sub-voxel) detail, faithful
palette/massing.

## The files that *are* stage 1

| file | role | state |
|------|------|-------|
| `baml_src/conceptart.baml` | `FacadeConceptPrompt(design_doc, target_blocks, attached)` — the versioned TEXT prompt; BAML renders `.request`, harness extracts the text. `b.parse` is never called (the *image* is produced by Nano Banana, not Claude). | **locked**, committed 33de8c8 |
| `benchmarks/temple-facade/conceptart.mjs` | series orchestrator: for each reference × variant, spawns `baml-concept.mts` → Nano Banana; writes `concepts/<ref>-<variant>-<model>.png`. Holds `TARGET_BLOCKS=48`. | **default = C**, committed 565f32f |
| `benchmarks/temple-facade/baml-concept.mts` | per-cell worker: composes the BAML prompt, attaches images, calls Nano Banana, writes the PNG. | unchanged across chain |
| `src/nano-banana.mjs` | Nano Banana (Gemini) client; reads the API key from `.env` directly (not shell env). | unchanged |
| `baml_client/**` | generated from `baml_src/` via `npm run baml:gen`. | gitignored, regenerable |
| `benchmarks/temple-facade/concepts/*.png` | the concept outputs / acceptance evidence. | gitignored (image-heavy, reproducible) |
| `docs/knowledge/design-learnings.md` | the durable journal — already carries the T-015/016/017 sections. | the file this ticket appends to |

## The four input variants (what `conceptart.mjs` can attach)

- **A** = `[reference]` — real photo as inspiration only (fresh generation).
- **B** = `[reference, ourRender]` — photo + our prior prismarine render, to refine.
- **C** = `[ourRender]` — refine our own render only. **← locked default.**
- **base** = `[]` — design-doc text only, no image.

A/B/base are retained for matrix reproducibility; only C is the default path.

## The chain, ticket by ticket (the evidence already on record)

- **T-015-01 (matrix, S-015).** 17 cells (A/B/C across 5 refs + 2 base controls), eyeball-only, no
  source change. **Decision: default = C.** Decisive axis was *background reliability* (the
  segmentation precondition): A 2/5 white, B 2/5 white, **C 0/5 white**. C is also the only variant
  immune to reference-copying (A bled the Taj's white marble dome; A grew literal gold human figures
  on the Arc) because it never sees the photo. Surfaced **three prompt weaknesses** for S-017.
- **T-016-01 (lock, S-016).** One-line default flip `arg("variant","A")→"C"` + header comment +
  per-reference regression check through the *defaulted* command. 4/5 held cleanly; horyuji drifted
  white once and re-drew black (confirmed a non-deterministic lottery, not a tendency); arc kept its
  black bg but grew gold figures in niches. Lock judged safe.
- **T-017-01 (harden, S-017).** Tightened `FacadeConceptPrompt` only, in 3 clauses over 2 iterations:
  figures (HARD-LIMIT override of the doc → blank/rosette panels), text (named nameplate/plaque/
  cartouche + a frieze clause), and segmentation (pure-black bg + bright outermost edges so the
  silhouette can't vanish). **Final audit: all 5 refs PASS both segmentation and resolution.** Closed
  the arc figure leak and the mausoleum glyph leak at the root; resolved the chapelle dark-on-dark.
  Recorded a **wording trap**: naming "white" near the background clause caused a white-bg regression.

## The load-bearing prompt rules (as they read in the locked `conceptart.baml`)

1. **Isolation / segmentation:** single isolated front elevation, centered, fully visible with margin,
   on **SOLID #000000 black** — explicitly "NEVER white, light, grey, navy, or any coloured/gradient
   backdrop"; outermost elements (spires/finials/pinnacles/crest) must be a **bright** palette color;
   dark tones reserved for recessed interior areas only.
2. **Resolution discipline (HARD LIMITS that OVERRIDE the doc):** no figures/statues (→ blank/rosette
   panels even if the doc places them), no text/nameplate/plaque/glyph friezes (→ blank/rosette /
   plain color-blocking), no filigree/thin finials (→ simple chunky caps). ~48 blocks wide, so every
   feature is a few whole blocks.
3. **Fidelity:** realize the doc's massing, proportion, style, motifs, and above all its **palette**
   (deliberately colorful — never a white/monochrome wall).

## Constraints binding this ticket

- **No rubric/brief edits.** No experiment. **At most one** small re-generation to illustrate.
- **Be honest about residual weakness.** Two real ones to carry forward: generation is
  non-deterministic ("held" ≠ guaranteed); the former-nameplate panel converges on a chunky
  concentric-square medallion (intended geometric ornament, not glyph text — but flag it).
- **`npm test` must stay green.** Currently **133/133** (no source change expected this ticket).

## Assumptions surfaced

- The committed `conceptart.baml` (33de8c8) *is* the strong version — confirmed: working tree is clean
  against it, and it contains all three T-017 clause tightenings.
- `concepts/` and `baml_client/` are gitignored by design; the durable record is the prompt diff +
  the journal, not the PNGs. The synthesis must therefore live in the journal, not lean on images.
- Stage 2 (TRELLIS) is not yet wired in this repo; the handoff paragraph is a *contract statement*
  of what stage-1 output guarantees, not a call into stage-2 code.
