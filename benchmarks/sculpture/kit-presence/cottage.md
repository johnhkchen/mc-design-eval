# Kit-presence proof — cottage (T-100-01)

**PROOF HOLDS**: the kit-less build fails with named absences; the composed pipeline build (durable-skin → placement-grammar → T-099 (openings) → kit-presence gate) passes.

Kit: `kit/cottage.json` (sha256 `8cc6d06dc850…`, immutable at gate time). Apertures: 6 concept-declared (measured on `concept-materials/cottage/after-artifact.json`). Positive artifact: `kit-presence/cottage/dressed-artifact.json` (sha256 `106e0bb2bcfd…`, 38 dressing placements over `placement-grammar/cottage/artifact.json`).

## Negative — `durable-skin/cottage/artifact.json`

**FAIL** — named gaps:
- `missing: spruce_planks frame @ 192/321 frame-line cells`
- `missing: spruce_fence infill @ openings 1/2/3/4/5/6`
- `missing: spruce_trapdoor shutters @ openings 1/2/3/4/5/6`

| feature | shipped block | kind | verdict | missing |
|---|---|---|---|---|
| frame | spruce_planks | gating | **MISSING** | 192 |
| panel:band0 | tuff | gating | pass | 0 |
| panel:band1 | smooth_sandstone | gating | pass | 0 |
| course | spruce_planks | gating | pass | 0 |
| openings:infill | spruce_fence | gating | **MISSING** | @ 1/2/3/4/5/6 |
| openings:shutters | spruce_trapdoor | gating | **MISSING** | @ 1/2/3/4/5/6 |
| openings:lintel-sill | — | evidence | — | 25 |

Skips (recorded, never silent): openings:door (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence)); openings:light (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence))

## Positive — the composed pipeline build

**PASS** — zero gaps

| feature | shipped block | kind | verdict | missing |
|---|---|---|---|---|
| frame | spruce_planks | gating | pass | 0 |
| panel:band0 | tuff | gating | pass | 0 |
| panel:band1 | smooth_sandstone | gating | pass | 0 |
| course | spruce_planks | gating | pass | 0 |
| openings:infill | spruce_fence | gating | pass | @ — |
| openings:shutters | spruce_trapdoor | gating | pass | @ — |
| openings:lintel-sill | — | evidence | — | 0 |

Skips (recorded, never silent): openings:door (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence)); openings:light (no door-kind aperture declared by the concept (T-099 D7 — detector gap, not absence))

> no LLM, no GL — committed inputs, pure checker; two executions byte-matched per side.
