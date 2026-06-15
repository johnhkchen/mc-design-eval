# T-037-02 — Fidelity-vs-concept read: "a moai statue" @ scale 48 (scale study)

Run **011-vConcept-a-moai-statue**, **scale 48** (the large end of S-037's angular-hero triptych).
Cross-scale partners: **run 003 @ scale 32** (mid anchor) and **run 010 @ scale 16** (small end,
T-037-01). Slug collides across all three — disambiguated by seq + `summary.json.scale`.

## Side by side

- Concept (Nano Banana, light detailed moai):
  `../../../../benchmarks/sculpture/runs/011-vConcept-a-moai-statue/concept.png`
- 3/4 hero render (the canonical view):
  `../../../../benchmarks/sculpture/runs/011-vConcept-a-moai-statue/render-3q.png`
- Best turntable frame (most side-on, az≈85 — faintest profile step visible):
  `../../../../benchmarks/sculpture/runs/011-vConcept-a-moai-statue/turntable/frame.023.png`
- Anchor for comparison (scale 32, unmistakable moai):
  `../../../../benchmarks/sculpture/runs/003-vConcept-a-moai-statue/render-3q.png`
- Small end (scale 16, recognizable carved face):
  `../../../../benchmarks/sculpture/runs/010-vConcept-a-moai-statue/render-3q.png`

## Faithfulness at scale 48 (one line)

**Poor** — the concept is a richly carved moai (heavy brow, deep eyes, long nose, set lips, topknot,
stepped plinth), but the build renders as a **near-black, near-featureless rectangular monolith**: the
moai's defining face does not read from any saved view.

## Where it fell short

- **The face is geometrically present but invisible in the render.** The artifact *does* encode a
  −z-facing face: a thin forward nose wedge (`x[-1,1] y32–40 z−6…−8`), a `deepslate` brow-shadow band
  (`y39`), and small deepslate brow corners. But there are **no real eye sockets** (the design doc
  promised "2×2 deepslate voids" — they were not built), the relief is shallow (1–3 blocks on a
  15-wide face), and value drift (below) erases what little contrast exists.
- **Severe value drift, amplified by scale.** `gray_concrete` renders **near-black** in
  prismarine-viewer (memory *concept-image-not-color-value-preview*). On a large, mostly flat 48-tall
  slab there is almost no relief to break it up, so the whole mass reads as one black block. The
  `deepslate` accents — meant to *carve* the face by value contrast — are invisible because the base
  gray is already as dark as the accent. The only visible tonal break is the scattered `andesite`/
  `stone` weather voxels, which render **lighter** than the body (an inverted value relationship vs the
  concept) and read as random light specks, not erosion.
- **Orientation lottery.** The face is on **−z**; the fixed 45° hero and the front-right rock turntable
  (az 5°→85°) keep the camera on the +x flank / back-right, so the carved front is turned away in every
  saved frame. The scale-32 anchor (run 003) oriented its face *into* the camera — luck, not pipeline
  guarantee. (Azimuth lesson, dancing-man 002 / bow-and-arrow T-036-04: the fixed hero is actively
  misleading for orientation-sensitive subjects.)
- **The model under-spent the larger budget on detail.** Only **33 ops** and **7,272 output tokens**
  produced 6,283 blocks via big volumetric fills — see the cross-scale token note below. The extra
  canvas was used for *bulk*, not *carving*.

## Scale-48 vs scale-32 (run 003), vs scale-16 (run 010) — the cross-scale note

| | scale 16 (run 010) | scale 32 (run 003) | **scale 48 (run 011)** |
|---|---|---|---|
| blocks | 732 | 2402 | **6283** |
| bounds (x×y×z) | 7×16×9 | 11×32×11 | **15×48×13** |
| build ops | — | — | **33** |
| tokens out | 16,752 | 14,273 | **7,272** |
| cost | $0.631 | $0.568 | **$0.400** |
| duration | 245 s | 392 s | **135 s** |
| face reads? | yes — stepped brow + eye recess visible | **yes — unmistakable, + pukao topknot, carved eyes/nose/mouth, arms on plinth** | **no — dark slab, face turned away & value-drowned** |
| judgment | recognizable / Competent | **Competent (form Strong)** | **loose→failed / Weak** |

**Did more budget close the gap? No — it widened it. Fidelity is non-monotonic in scale, and scale-48
is the *worst* of the three.** Counter to the S-037 hypothesis (and to my own recorded expectation that
the angular hero would be "at least as faithful at 48 as at 32"), the largest build is the least
recognizable. Two mechanisms:

1. **Effort fell as the canvas grew.** Output tokens *decreased* monotonically with scale
   (16,752 → 14,273 → **7,272**) and the scale-48 build used just 33 coarse fill ops. The model treated
   the bigger budget as license to lay down large volumetric blocks and skip the fine carving it *did*
   do at 16 and 32 (which built actual brow ledges, eye recesses, and — at 32 — a pukao). More blocks,
   far less relief per block.
2. **Value drift scales with flat area.** A bigger flat near-black slab has proportionally *less* relief
   to catch light, so the gray_concrete darkness dominates more completely than at 16/32, where smaller
   faces and more-clustered carving kept some readable structure.

Feature-by-feature (concept → build): **brow** present as a 1-block deepslate line, but invisible
(value); **eye sockets** *dropped* (promised, not built); **nose** a thin shallow wedge, lost in
darkness; **mouth/lips** absent; **topknot/pukao** *dropped* entirely (run 003 had one and it was the
single most legible feature there); **plinth** present and the one clearly readable element. **Bounds**
grew as expected (~48 tall), confirming the scale knob worked — the failure is in *how the budget was
spent*, not in the scale wiring.

## Categorical judgment

**`loose` (bordering `failed`)** in the four-bucket scale → **`Weak`** in the project `Category` enum.
Rationale: a tall, head-heavy, plinthed monolith silhouette survives (so not a total `failed`), but the
features that say *moai* specifically — brow, eyes, nose, mouth, topknot — do not read; from the saved
views it could be a generic standing stone or menhir. This is a clear regression below the scale-32
anchor's **Competent / form Strong**, and below the scale-16 sibling's recognizable carved face.

This is the **commissioned measurement, not a pipeline failure** (Design Decision 6): the build exited
clean, schema-valid, 0 unmapped, `scale==48`. A coarse/abstract result at the large end *is* the datum
— it was **not** re-run for looks.

## Run facts (self-contained, from summary.json)

- runId `011-vConcept-a-moai-statue`, seq **11**, **scale 48**, date 2026-06-05, model `claude-opus-4-8`.
- blocks **6283**, unmapped **0**; bounds `[-7,0,-8]..[7,47,4]` → 15(x) × 48(y) × 13(z).
- 33 build ops; tokens 21,156 in / 7,272 out; cost **$0.4002**; duration 134,534 ms (~135 s).
- concept `gemini-3-pro-image-preview`, 4570 prompt chars, 21,008 ms; turntable 24-frame rock
  (center 45°, amplitude 40°).
- palette: `gray_concrete` (dominant), `andesite`, `stone`, `deepslate` (accent). note "T-037-02 scale-48 study".
