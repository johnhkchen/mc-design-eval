# value-true.md — "we measured the drift, then killed it" (E-14 / S-042)

The E-13 sculptural best-of (`sculptures.md`) ends on one failure that was **not** geometry: the moai
realized as the series' best case — *Competent, form Strong* — yet its `gray_concrete` body **rendered
darker than the pale tuff the concept showed**. That is *value drift*: the design names a block, the
concept previews a hue, and only the render exposes the block's true **value** (*L\**). E-14 turns that
into a closed loop — the concept previews against the **real block values**, the build **places the
value-true block**, and a **concept↔render Δvalue gate** scores the gap *before* the render. This is the
beat for E-12: the one E-13 non-geometry miss, **measured, then killed**.

Renders are **real prismarine-viewer voxels** — `.v1` is the model's name-by-hue build, `.v2` is the
value-matched build (same form, same placements; the engine only re-chose *which block* hits each region's
value). Never conflate either with the Nano-Banana concept art.

## The number — concept↔render mean ΔE, before → after

| subject | E-13 verdict | ΔE before (`.v1`) | ΔE after (`.v2`) | gap closure | gate after | before → after frames |
|---|---|---|---|---|---|---|
| **moai** (angular) | Competent — *drifted value* | **6.97** ⚠ | **2.31** ✓ | **4.66 (66.9%)** | **cleared** | `frames/value-moai-v1.png` → `frames/value-moai-v2.png` |
| **sword** (angular) | Recognizable — near-true | 3.98 ✓ | 2.65 ✓ | 1.33 (33.4%) | clear | `frames/value-sword-v1.png` → `frames/value-sword-v2.png` |
| **pineapple** (organic) | Organic — line softens | 10.34 ⚠ | 8.55 ⚠ | 1.79 (17.3%) | **still flagged** | `frames/value-pineapple-v1.png` → `frames/value-pineapple-v2.png` |

Gate threshold: mean ΔE > 6 (CIE76). Source: `benchmarks/sculpture/codesign-ab.{md,json}` (offline over
the committed runs — no model call). Per-region swaps: each run's `value-swaps.md`.

## The hero pair — the moai value drift, killed

`frames/value-moai-v1.png` → `frames/value-moai-v2.png`. The body block `gray_concrete` (L24.3) →
`deepslate_bricks` (L29.8), **+5.5** toward the value the concept previewed. The gate falls **6.97 → 2.31**,
clearing the threshold: the one documented E-13 value miss is **measurably cured**, faithful form intact.

## Honest, on screen — what value-true *didn't* fix

- **sword** — *already near-true*: the model's iron/gold/andesite picks already rendered at value (3.98,
  under the gate), so value-true **confirms** rather than rescues. The contract earns its keep on the
  *drifting* case, not uniformly.
- **pineapple** — *narrowed, not closed*: the organic palette drops 10.34 → 8.55 but **stays flagged** —
  the proof the gate is real, not cosmetic. Honest caption for the wall: "value-matching narrows the
  organic drift; it does not erase it."
- **The gate's own caveat**: `.v2` ΔE is low *partly by construction* (the build snapped to this exact
  palette), and the render-side palette is a **segmentation-free placement proxy** (a real full-cube block
  renders as itself), not a pixel read of the still. Stated, not hidden — see `design-learnings.md` §E-14.

## Suggested E-12 beat

Run after the F09 explosion / breadth wall: a **two-frame before→after** on the moai (the hero pair) with
the **6.97 → 2.31** number burned in, then a quick three-row sweep (closed / already-true / narrowed) so
the honesty reads — *the loop kills the drift it can, and shows the drift it can't.*
