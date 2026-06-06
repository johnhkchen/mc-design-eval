# Co-design consolidation A/B (E-14 / T-042-01)

The **terminal link** of the concept-build palette co-design loop, measured. For each E-13 subject:
the concept↔render **Δvalue** before (`.v1`, the model chose blocks by name/hue) vs after (`.v2`, the
engine snapped each placement to a value-true block). The gap = how far the **built** palette sits from
the palette the **concept previewed**, scored by the Δvalue feedback gate (`src/color/value-gate.mjs`).
Generated offline from committed `artifact.json` + `artifact.value-matched.json` + `concept.png` — no
model call, no GL.

## How the gap is measured (and an honesty caveat)

- **Concept side (the target):** the concept's realized palette, `extractPaletteFromImage(concept.png)`.
- **Render side:** the build's placed manifest at its **value-true Lab** — segmentation-free, because a
  real full-cube block renders as itself (T-039 invariant). Extracting straight from the render PNG is
  avoided: the prismarine-viewer scene dominates it (~79% `glass`), which would need sculpture/background
  segmentation — the documented *cost of segmentation*.
- **Caveat (stated, not hidden):** `.v2`'s ΔE is low partly **by construction** — the T-041 snap targeted
  this exact realized palette. So the gate's value is as a **regression/threshold flag** and as a record
  of the **residual** (where the drift is *not* fully cured), not as a surprise-free proof. The
  **pineapple staying flagged after** is the proof the gate is not tautological.

Gate threshold: mean ΔE > 6 (CIE76).

## Summary — concept↔render gap closure

| subject | E-13 verdict | ΔE before (.v1) | ΔE after (.v2) | closure | gate after | E-14 verdict |
|---|---|---|---|---|---|---|
| **moai** | Competent | 6.97 | 2.31 | **4.66** (66.9%) | ✓ clear | closed |
| **sword** | Recognizable | 3.98 | 2.65 | **1.33** (33.4%) | ✓ clear | already-near-true |
| **pineapple** | Organic | 10.34 | 8.55 | **1.79** (17.3%) | ⚠ flagged | narrowed |

## Headline — the moai value drift, killed

The documented E-13 failure: a faithful moai whose `gray_concrete` body rendered far darker than the
concept showed. The gate scores that drift at **6.97** before — **over** the gate — and the value-matched build pulls it to **2.31**, **clearing** it. `gray_concrete` (L24.3) → `deepslate_bricks` (L29.8), +5.5; the residual to the
concept's lighter dominant is shown in the swap table, not hidden.

### 001-vConcept-moai

**E-13 baseline:** Competent — faithful form, drifted value (gray_concrete reads darker than tuff)
**Concept (previewed) palette:** 5 blocks over 44% of frame: deepslate_copper_ore 37%, deepslate_bricks 25%, copper_ore 19%, chiseled_nether_bricks 13%, diorite 6% (mean ΔE 4)

Concept↔render mean ΔE: **6.97 → 2.31** (closure **4.66**, 66.9%). Gate (threshold 6): before **flagged** (max 11.44), after **clear** (max 10.54).

**E-14 verdict — closed:** value-matching pulled the concept↔render drift **below** the gate — the drift is cured.
**Corrective re-place:** not recommended, **fired: no** — drift under the gate — no re-place needed.

Renders: `runs/001-vConcept-moai/render-3q.png` (.v1) vs `runs/001-vConcept-moai/render-3q.value.png` (.v2). Per-region swaps: `runs/001-vConcept-moai/value-swaps.md`.

_.v2 realized blocks vs nearest concept cluster:_

| placed block (value-true) | L* | nearest concept cluster | ΔE |
|---|---|---|---|
| `copper_ore` | 52.6 | `copper_ore` | 1.75 |
| `deepslate_bricks` | 30.2 | `deepslate_bricks` | 2.35 |
| `chiseled_nether_bricks` | 11.6 | `chiseled_nether_bricks` | 10.54 |

### 007-vConcept-a-sword

**E-13 baseline:** Recognizable — faithful cruciform, near-true palette
**Concept (previewed) palette:** 8 blocks over 8% of frame: polished_diorite 25%, brown_concrete 13%, gilded_blackstone 13%, polished_andesite 13%, spruce_log 13%, iron_block 12%, birch_planks 6%, gold_block 6% (mean ΔE 3.7)

Concept↔render mean ΔE: **3.98 → 2.65** (closure **1.33**, 33.4%). Gate (threshold 6): before **clear** (max 8.18), after **clear** (max 4.71).

**E-14 verdict — already-near-true:** already under the gate before value-matching — the contract confirms, not rescues.
**Corrective re-place:** not recommended, **fired: no** — drift under the gate — no re-place needed.

Renders: `runs/007-vConcept-a-sword/render-3q.png` (.v1) vs `runs/007-vConcept-a-sword/render-3q.value.png` (.v2). Per-region swaps: `runs/007-vConcept-a-sword/value-swaps.md`.

_.v2 realized blocks vs nearest concept cluster:_

| placed block (value-true) | L* | nearest concept cluster | ΔE |
|---|---|---|---|
| `polished_andesite` | 56 | `polished_andesite` | 1.55 |
| `gold_block` | 84.5 | `gold_block` | 4.71 |
| `spruce_log` | 17.3 | `spruce_log` | 2.46 |
| `iron_block` | 87.8 | `iron_block` | 1.44 |

### 013-vConcept-a-pineapple

**E-13 baseline:** Organic — cross-hatch present but the defining line softens
**Concept (previewed) palette:** 8 blocks over 21% of frame: green_concrete 13%, hay_block 13%, honeycomb_block 13%, jungle_log 13%, melon 13%, orange_terracotta 13%, pumpkin 13%, smooth_red_sandstone 13% (mean ΔE 7.3)

Concept↔render mean ΔE: **10.34 → 8.55** (closure **1.79**, 17.3%). Gate (threshold 6): before **flagged** (max 19.16), after **flagged** (max 14.16).

**E-14 verdict — narrowed:** value-matching **narrowed** the drift but it stays over the gate — a corrective re-place is recommended.
**Corrective re-place:** recommended, **fired: no** — residual over gate; a re-place against the SAME realized palette is idempotent — the real lever is a new palette-aware concept or a wider extractor k.

Renders: `runs/013-vConcept-a-pineapple/render-3q.png` (.v1) vs `runs/013-vConcept-a-pineapple/render-3q.value.png` (.v2). Per-region swaps: `runs/013-vConcept-a-pineapple/value-swaps.md`.

_.v2 realized blocks vs nearest concept cluster:_

| placed block (value-true) | L* | nearest concept cluster | ΔE |
|---|---|---|---|
| `hay_block` | 57.9 | `hay_block` | 14.16 |
| `orange_terracotta` | 44.5 | `orange_terracotta` | 9.71 |
| `green_concrete` | 36 | `green_concrete` | 2.8 |
| `melon` | 56.3 | `melon` | 6.09 |

## Live full-loop re-run (deferred — metered)

This consolidation measures both loop ends over committed artifacts (T-040 palette-aware concept; T-041
value-matched build). A single fresh end-to-end run (palette-aware `.v2` concept → value-matched build)
is **metered** (model + Nano-Banana image gen) and out of scope here, mirroring how T-040/T-041 gated
their live paths. To run it live: `node benchmarks/sculpture/run.mjs --value-match "<subject>"`.
