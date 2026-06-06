# Fidelity read — a moai statue (scale 32)

Run `003-vConcept-a-moai-statue` · vConcept · `claude-opus-4-8` · 2402 blocks, 0 unmapped,
schema-valid · bounds min `[-5,0,-4]` max `[5,31,6]` (height 31 ≈ scale 32) · $0.5684 · 58 ops.

**One-line verdict:** A faithful concept→voxel transfer of *form* — columnar head-and-torso
monolith, red topknot, stone plinth, all unmistakably moai — but the *value* drifted: the real
`gray_concrete` block renders as dark basalt-charcoal, far darker than the concept's light tuff, and
light-stone carved recesses make the face read busier (tiki-leaning) than the clean concept moai.

## Concept → render (fidelity-vs-concept)

Concept (`concept.png`, Nano Banana) = a clean 3-view of a **light warm-gray** moai: heavy wedge
brow, long nose, recessed eyes, side ears, low stub hands, terracotta pukao, tiled plinth — a
textbook, instantly-named moai. Render (`render-3q.png`) = the voxel build of the same plan.

- **Masses / silhouette — kept.** One continuous column, head-dominant, slight crown overhang,
  compact ~11×11 footprint on a wider plinth. The columnar moai silhouette transfers cleanly; it
  never reads as a facade or a free human figure. ✔
- **Proportion — kept.** Plinth → torso → head stack matches the doc's 4/12/16 budget; head is the
  prize at ~half height; bottom-heavy, not top-heavy. The 3/4 fuses profile relief + frontal face
  as designed. ✔
- **Palette hierarchy — preserved in *blocks*, drifted in *value*.** The build used exactly the
  doc's named palette (80% `gray_concrete`, 14% `stone`, 4% `red_sandstone` pukao, 2% `andesite`) —
  correct dominant/supporting/accent hierarchy. BUT `gray_concrete` is a **dark charcoal** texture,
  so the realized body reads as near-black basalt, not the concept's light quarried tuff; the
  `red_sandstone` pukao reads as a saturated **orange** vs the concept's muted terracotta. The
  *harmony* holds (monochrome stone + one warm crown); the *identity* shifts toward volcanic basalt.
- **Where the concept→voxel step lost / gained.** LOST: tonal value (concept previewed
  "gray concrete" as light stone; the real block is dark) and some facial legibility — the light
  `stone` used for eye-sockets/ears/arm-reliefs pops bright against the dark body, fragmenting the
  face into a busier, tiki/totem-leaning read rather than the concept's smooth-cheeked moai.
  GAINED: nothing material; the build is a faithful-geometry, shifted-palette realization of the doc.

## Categorical judgement

Category enum (project standard, `baml_src/judge.baml`): **Weak · Competent · Strong · Exceptional**.
Hard-to-please rubric: default ceiling is "strong"; "exceptional" is the rare one-in-ten you'd stop
and screenshot. Judged only on what the render shows.

| dimension | category | anchor |
|-----------|----------|--------|
| form & proportion | **Strong** | columnar head-dominant monolith, plinth/torso/head budget honored, stable; coherent and deliberate from every front-hemisphere angle. |
| palette | **Competent** | disciplined monochrome-stone + warm accent, faithful to its named blocks — but realized value (dark charcoal) diverges from the intended/previewed light tuff; harmony holds, identity drifts. |
| detail / craft | **Competent** | stepped facial planes, recessed eyes, side ears, low arm reliefs all present; but bright light-stone recesses fragment the face, busier than intended. |
| fidelity / recognizability | **Competent** | reads as a moai/ancestor-monolith at a glance (topknot + columnar head-torso clinch it); the dark value + busy face nudge it toward generic tiki — recognizable, not unmistakable-iconic. |
| **overall** | **Competent** | a solid, recognizable moai with strong form; nameable easy wins (lighter body block, calmer recess contrast) keep it below "strong" holistically. |

## Notes / single-view limitation

The rock turntable (±40° about the 45° 3/4 azimuth) stays in the front hemisphere; the imagined
back/sides are never paraded. Within that arc the form is consistent and the carved relief reads
the same from each angle — no obvious single-view artifacts in the shown hemisphere.

**Prediction check (ticket form-note: "angular monolith — text-JSON's best case").** Confirmed for
*geometry*: the angular, rectilinear-slab form is exactly what text-JSON realizes best, and the
silhouette/proportion transferred faithfully. NOT the whole story for *color*: the build surfaced a
different failure axis the "angular = easy" prediction didn't anticipate — **the concept image is
not a reliable preview of a real Minecraft block's tonal value** (`gray_concrete` ≠ light tuff). The
angular-best-case holds for shape; palette-value fidelity is a separate, cross-cutting gap.
