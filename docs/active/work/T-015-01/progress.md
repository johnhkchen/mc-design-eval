# T-015-01 · Progress — concept-input-variant matrix

Execution log for the Implement phase. Followed plan.md steps 1–9. **No source/prompt change made** —
this was a pure comparison. `npm test` green at the end (133/133).

## Generation run log (all flash, 48 blocks constant)
| step | command | result |
|------|---------|--------|
| 1 smoke | `--variant=base --ref=horyuji` | ok 9851ms (0 img) → horyuji-base-flash.png ✓ go |
| 2 A×5 | `--variant=A` | 5/5 ok (1 img each), 10.6–12.6s |
| 3 B×5 | `--variant=B` | 5/5 ok (2 img each), 10.3–17.1s |
| 4 C×5 | `--variant=C` | 5/5 ok (1 img each), 10.5–12.6s |
| 5 base#2 | `--variant=base --ref=taj` | ok 10174ms (0 img) → taj-base-flash.png |

Matrix complete: A×5, B×5, C×5, base×2 = **17 cells** under `benchmarks/temple-facade/concepts/`
(plus the pre-existing `taj-A-flash-seg.png` overlay, untouched). All cells succeeded first try — no
reruns needed.

## Per-cell assessment (eyeball; F=fidelity to doc palette+massing, I=inspiration-not-blueprint, D=voxel-honest detail; bg = background actually produced)
| ref | variant | bg | F | I | D | note |
|-----|---------|----|---|---|---|------|
| taj | A | **white** | Lo | Lo | Hi | **white marble dome** = reference-palette bleed (doc says GOLD); white bg breaks segmentation |
| taj | B | black | Hi | Med | Hi | gold dome, red sandstone, blue inlay all doc-correct; 4 minarets borrowed; clean on black |
| taj | C | black | Hi | Hi | Hi | gold dome, doc palette, disciplined massing, plinth-as-base; segments clean |
| taj | base | black | Med | n/a | **Lo** | **calligraphic TEXT** in the gold band (hard-limit violation) |
| horyuji | A | **white** | Hi | Hi | Hi | excellent red+teal+gold pagoda — but white bg = segmentation fail |
| horyuji | B | black | Hi | Med | Hi | two-story, red columns/teal roofs, stone plinth; large white infill panels read flat |
| horyuji | C | black | Hi | Hi | Hi | clean, voxel-honest, stockier; segments clean |
| horyuji | base | black | Hi | n/a | Hi | surprisingly clean (no text); simple symmetric form suits doc-only |
| chapelle | A | black | Hi | Hi | Hi | gothic, rose window as bold color-blocks; on black — A's best cell |
| chapelle | B | **white** | Hi | Med | **Med** | ornate, but **fine rose/gable filigree** creeping in; white bg = segmentation fail |
| chapelle | C | black | Hi | Hi | Hi | rose window as chunky concentric rings (no filigree); bold; segments clean |
| arc | A | black | Med | **Lo** | **Lo** | **gold HUMAN FIGURES** in side panels (Arc reliefs copied literally — hard-limit violation) |
| arc | B | **white** | Hi | Med | Hi | figures suppressed (render grounding); but white bg + white arch-void merges with bg |
| arc | C | black | Hi | Hi | Hi | abstract block niches (no figures), blue voussoir; segments clean |
| mausoleum | A | black | Hi | Hi | Hi | blue roofs, white body, gold brackets, red doors; strong on black |
| mausoleum | B | black | Hi | Med | **Med** | gold Chinese-character glyphs in frieze (text) |
| mausoleum | C | black | Hi | Hi | **Med** | "GY/RU" Latin plaque (text) — but reference-driven, shared by all variants |

## Background reliability (the decisive axis — segmentation depends on the black background)
- **A: 2/5 white** (taj, horyuji) → unreliable segmentation, AND copies the reference literally
  (taj white dome; arc human figures) → worst on both targets 1 and 2.
- **B: 2/5 white** (chapelle, arc) → also unreliable; introduces filigree (chapelle) and text
  (mausoleum); the second attached image doesn't reliably pin the black background.
- **C: 5/5 black** → reliable segmentation; palette always doc-correct (refines our own render, which
  already obeys the doc); reference-copying is impossible (it never sees the reference).
- **base: 2/2 black** but text-prone (taj calligraphy); no architectural grounding → riskier massing.

## Per-variant synthesis
- **Most voxel-honest:** **C** — consistent bold block ornament, no filigree (vs chapelle-B).
- **Most faithful (palette + massing):** **C** — palette correct in 5/5 because it refines our
  doc-grounded render; A bleeds the reference palette (white Taj dome).
- **Best segmented:** **C** — 5/5 correct black background; A and B each fail 2/5 to white.

## Decision
**Default variant = C (render only).** See journal entry and review.md for the one-paragraph rationale.
This **confirms the ticket's prior** (expected C) on the evidence.

## Prompt weaknesses observed (S-017 input)
1. **Black-background instruction is not robust when a reference photo is attached** — A and B drift to
   white studio backgrounds (4 cells total). C, with no reference, never does. The prompt's black-bg
   demand is overridden by the photo's own neutral backdrop.
2. **Hard-limit on text is too weak for reference buildings with prominent inscriptions** — the
   mausoleum produced text/plaques across A/B/C; taj-base produced calligraphy. The "NO text" clause
   needs strengthening (e.g. "replace any nameplate/inscription with a blank or rosette panel").
3. **Reference-copying of figural relief** — arc-A reproduced the Arc's sculptural figures as gold human
   shapes; the "INSPIRATION ONLY / no figures" clauses don't fully suppress literal copying when the
   reference is figure-heavy. (Another reason C, which sees no reference, is safest.)

## Verification
- `npm test` → **133/133 pass**, 0 fail (no source touched; regression-clean as expected).
- No deviations from plan.md. No prompt/source edit, so no `npm run baml:gen` needed.
