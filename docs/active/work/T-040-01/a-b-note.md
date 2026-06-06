# T-040-01 — A/B: `.v1` vs `.v2` palette-aware concept (the AC3 record)

**Question (S-040):** does feeding Nano Banana the *value-true swatch grid* of the real blocks make the
concept preview the **true (often darker) value**, narrowing the surprise the render later exposes
(`[[concept-image-not-color-value-preview]]`)?

**Method.** Same Nano Banana model (**`gemini-3-pro-image-preview`**), same design doc, same
`target_blocks` for both arms; the **only** change is the `.v2` swatch grid (attached, 1 image) + the
value-match instruction. `.v1` is the on-disk E-13 `concept.png` (also PRO). Palette = each run's
`artifact.json` manifest → `resolveValueTruePalette`. Artifacts: `<subject>.{swatch,v1,v2}.png` +
`<subject>.ab.json`. Generated live `2026-06-05` (moai 21.5s, pineapple 33.5s; prompt ~5.5k chars,
1 swatch image attached each).

---

## Subject 1 — moai (`001-vConcept-moai`, 5 blocks, 1 snapped; L\* mean 39.6, min 12.4, max 56.7)

Swatch truth: `gray_concrete` **L\*24.3** (`#373a3e`, a dark cool slate), `red_nether_bricks`
**L\*12.4** (`#460709`, near-maroon), the andesite/cobblestone/stone-brick supports L\*51–57.

- **`.v1`** renders the body as a **light-to-mid warm gray** (eye reads ~L\*50–60) — the classic
  value over-promise: "gray concrete" imagined far lighter than its true L\*24. The pukao is a
  medium brick-red, lighter than the true deep maroon.
- **`.v2`** renders the body as a **distinctly darker, cooler slate** — visibly in the L\*24–30
  neighborhood of the real `gray_concrete`. The pukao is a **deep maroon** that matches
  `red_nether_bricks`' true L\*12. The lighter speckled cobblestone/andesite supports are spent on
  brow/nose/chin (the doc's "weathered shading"), so the value hierarchy reads correctly too.

**Verdict: `.v2` previews value far more honestly.** The single biggest E-13 value-drift (dark
`gray_concrete` shown light) is corrected.

## Subject 2 — pineapple (`013-vConcept-a-pineapple`, 4 blocks, 1 snapped; L\* mean 50.2, min 36, max 62.4)

Swatch truth: `honey_block`→**`hay_block`** **L\*57.9** (`#a68826`, a *muted* ochre, not candy
yellow), `orange_terracotta` **L\*44.5** (rust), `green_concrete` **L\*36** (dark olive),
`lime_concrete` **L\*62.4** (bright lime).

- **`.v1`** renders a **bright, saturated cartoon-yellow** body — over-bright and over-saturated vs
  the muted `hay_block` ochre; crown an undistinguished bright/dull green mix.
- **`.v2`** renders a **muted amber** body matching `hay_block`'s real `#a68826`, with the **rust
  `orange_terracotta`** correctly placed in the recessed cross-hatch grooves (the true two-tone
  hay+terracotta the build will use), and the crown split **bright `lime_concrete` on the outer tips,
  darker `green_concrete` in the interior/base** — value hierarchy honored.

**Verdict: `.v2` previews value more honestly** (muted vs candy-bright) and previews the *two-tone
groove* the real palette produces.

---

## Cost / risk read

- **Segmentation (the thing `.v1`'s rules protect): held.** `.v2` kept every `.v1` silhouette rule
  verbatim; both objects still separate cleanly from the `#000000` field. The darker true values
  (`red_nether_bricks` L\*12, `green_concrete` L\*36) landed on **interior / non-outline** surfaces,
  as instructed — no outline vanished into black. **Latent risk:** for a palette whose *brightest*
  block is still dark, the "bright silhouette" rule and value-honesty directly conflict; here every
  palette had a light-enough block (andesite L\*57 / lime L\*62) to carry the edge, so the tension
  never bit. This is the case S-042's ΔE gate should watch.
- **Quality / form: no regression.** Both `.v2` concepts are clean single 3/4 objects with intact
  massing and recognizability. (Incidentally `.v1` moai came back as a 3-view contact sheet — off the
  "single isolated object" spec — while `.v2` returned one object; treat as run-to-run variance, not a
  `.v2` effect, but it did not hurt `.v2`.)
- **Spend:** 2 PRO image calls; `.v1` arm free (on disk); no `claude -p` (docs reused).

## Net

For **both** subjects the swatch grid moved the concept toward the true, **lower / more muted** value —
exactly the over-promise S-040 set out to kill. **Recommendation:** adopt `.v2` as the concept arm of
the E-14 co-design loop (S-042), and have the ΔE gate flag the bright-silhouette-vs-true-value
conflict for all-dark palettes, where value-honesty and segmentation pull apart.
