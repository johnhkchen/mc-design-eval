# T-036-04 — Fidelity-vs-concept read: "a bow and arrow" (scale 32)

vConcept sculpture build, run `005-vConcept-a-bow-and-arrow`. AC#2 (fidelity-vs-concept, with an
explicit thin-element verdict) + AC#3 (categorical judgment) deliverable. Evidence lives in the run
dir; this file is the read. This is the **hardest case in the series** — the thin/linear stress test.

## Side by side

- **Concept (Nano Banana, 3/4):**
  [`concept.png`](../../../../benchmarks/sculpture/runs/005-vConcept-a-bow-and-arrow/concept.png)
- **3-D build — canonical 3/4 still (az 45°):**
  [`render-3q.png`](../../../../benchmarks/sculpture/runs/005-vConcept-a-bow-and-arrow/render-3q.png)
- **3-D build — best turntable frame (near-frontal, az ≈ 5°):**
  [`turntable/frame.018.png`](../../../../benchmarks/sculpture/runs/005-vConcept-a-bow-and-arrow/turntable/frame.018.png)
- **3-D build — side-on (az ≈ 85°, worst angle):**
  [`turntable/frame.006.png`](../../../../benchmarks/sculpture/runs/005-vConcept-a-bow-and-arrow/turntable/frame.006.png)

## Faithfulness (one line)

**Faithful palette and complete part inventory, recognizability gated by angle** — the build realizes
every element of the concept (recurve "D" bow, bone string, diagonal arrow with iron head and red
fletching, plinth) in the exact specified palette; from the near-frontal turntable frame it reads
unmistakably as *a bow and arrow*, but the fixed 45° hero still foreshortens the arrow into depth and
badly under-sells it.

## Where it fell short

1. **The canonical 3/4 still under-sells it — severely.** At the archetype's fixed 45° azimuth, the
   arrow points into depth (toward/away from camera) and collapses to its oversized white head plus a
   red speck; the composition reads as an ambiguous wooden arc with a white lump. The **turntable
   rescues the read**: `frame.018` (≈5°, near-frontal) shows the full horizontal arrow, the taut bone
   string, and the bow's "D" — nearly the concept. This is an *angle/framing* shortfall, not a build
   shortfall, and it is the **most pronounced instance yet** of the dancing-man (002) azimuth finding.
2. **Arrowhead is oversized/blobby.** The `iron_block` head is a chunky 2×2×3-ish cluster rather than a
   tapered point — it reads as "metal tip" but with no finesse.
3. **Fletching reduced.** The `red_concrete` fletching survived only as a small cluster; the doc's
   stepped vanes flattened to a single red marker. It still does its job (flags the arrow's tail/back).
4. **Bow curve is stepped, not smooth.** Expected at block scale — the recurve reads as a staircased
   "D". This is acceptable voxel idiom, not a defect.

## Thin-element survival verdict (the AC's explicit question)

**Headline: nothing vanished.** The ticket feared the largest gap of the set and a possible `failed`
(string + arrow both disappearing). Instead every thin element survived, thickened or chunked but
continuous:

| element | survived? | how it came through |
|---------|-----------|---------------------|
| **String** (thinnest, ~sub-block) | **Yes — intact** | a continuous **1-wide `bone_block` line** spanning the limb tips; not dotted, not dropped. The single most impressive survival — the near-sub-block element the ticket likened to the Golden-Gate cables held as a clean 1-block run. |
| **Arrow shaft** | **Yes — chunky** | a continuous ~1–2-thick `stripped_oak_log` horizontal run; clearly a shaft in frontal view, foreshortened at 45°. |
| **Arrowhead** | **Yes — oversized** | `iron_block` cluster; present and "metallic," but blobby. |
| **Fletching** | **Yes — degraded** | a small `red_concrete` cluster; flags the tail but lost the vanes. |
| **Bow stave** | **Yes — strong** | solid stepped recurve, the dominant well-read mass. |

So the thin/linear loss showed up as **chunkiness + an unflattering hero angle**, *not* as element
disappearance. The hardest case beat its own worst-case prediction.

## Categorical judgment: **recognizable**

From the right angle (`frame.018`) the build is a clear, complete bow-and-arrow with a faithful
palette and every named part present — a *strong* `recognizable`, approaching `faithful`. The
categorical bucket is held at `recognizable` (not `faithful`) because (a) the arrowhead/fletching lost
their shaped finesse and (b) the build cannot be read as a bow-and-arrow from its own canonical hero
still without the turntable's help. It is **well above `loose`/`failed`** — and notably *better* than
the ticket predicted for the set's hardest subject: the thin elements survived rather than vanished;
the gap is angle- and chunk-driven, not loss-driven.

## Run facts (from summary.json — self-contained record)

| field | value |
|-------|-------|
| run id | `005-vConcept-a-bow-and-arrow` (seq 5) |
| method | `vconcept-sculpture.v1` · model `claude-opus-4-8` |
| build ops / blocks | 169 ops → **411 blocks**, **0 unmapped** (schema-valid) |
| bounds | `[-5,0,-6] .. [18,33,6]` → ~24(x) × 34(y) × 13(z) — the wide x/z is the arrow's diagonal reach into depth (why 45° foreshortens it) |
| palette | spruce_planks (bow) · stripped_oak_log (arrow/base) · dark_oak_planks (grip) · bone_block (string) · iron_block (head) · red_concrete (fletching) |
| concept | Gemini `gemini-3-pro-image-preview`, ~1114-tok prompt, 20.8 s |
| cost / tokens | **$1.0938** · 21453 in / **34999 out** — priciest & most output-heavy of the series |
| wall time | ~453 s |
| turntable | 24 frames, front-arc rock (center 45°, ±40°) |

## Note for E-13 curation (T-038-01)

The strongest data point yet that **the fixed 45° hero azimuth is actively misleading for
orientation-sensitive subjects**. A bow-and-arrow's signature is a single horizontal axis; at 45° that
axis aims into depth and the subject becomes unreadable from its own canonical still, while
`frame.018` (near-frontal) reads almost like the concept. Recommended for curation: **pick the
near-frontal turntable frame as the gallery hero for the bow** (and likely for thin/linear subjects
generally), or have the archetype tune the still azimuth per subject. Recorded as a finding,
**not changed here** — editing the shared `SCULPTURE_VIEW_3Q`/runner would fork the archetype and
break breadth comparability across the eight T-036-* builds. Second finding: thin/linear elements at
scale 32 **survive as chunky/thickened runs rather than vanishing** — the 1-wide string held — so the
real Phase-1 limit for these subjects is *finesse + framing*, not raw survivability.
