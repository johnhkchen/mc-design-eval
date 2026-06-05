# Design — T-010-01: detail lever B (the alternate mechanism)

Decide ONE detail lever that is a **distinct mechanism from S-006's** (relief-geometry panel
grammar), grounded in Research. It must be attributable to a single prompt diff, must not repeat the
v5 color crash (P9), and the choice must enable a clean "which mechanism works better, and why"
comparison to S-006 (the ticket's headline AC).

## The mechanism space (S-006 used #3; I must use one of the others)

The ticket and story name four candidate mechanisms:
1. **Dedicated detail-only pass** (new stage editing only flat fields).
2. **Per-region articulation minimums** (each plane >~6 carries ≥1 named relief device).
3. **Paneling / string-course grammar** — **S-006 used this. Excluded (redundant).**
4. **Noisier-grained block-texture / material swap** (busier grain reads as more detail).

## Options considered

### Option A — Dedicated detail-only 4th pass (mechanism #1)
Add a stage that re-emits editing only flat fields.
- **Con (decisive):** the harness re-emits the *whole* artifact each pass; a true diff-only pass needs
  new incremental-I/O machinery — **more than one prompt diff**, a 4th metered call, and it forfeits
  the round-0 control. T-006-01 already rejected this on scope grounds; nothing changed. Out of scope.

### Option B — Per-region articulation minimums (mechanism #2)
Enumerate each offender region (left/right flank, plinth, spandrels, each window inset, frieze) and
require ≥1 named relief device per region, with a self-audit list.
- **Pro:** distinct from S-006's *uniform* recipe; attacks the *concentration* failure (articulation
  piles on the central pishtaq) via a coverage quota.
- **Con (decisive):** it is still **relief geometry** — the exact thing S-006 proved the model
  under-delivers (016: panels became "drawn-on outlines… little actual relief depth"). A coverage
  quota over a device the model flattens will likely flatten too — re-failing S-006's failure mode
  rather than testing a *new* one. It is also uncomfortably close to the **original falsified menu**
  (P15: a per-plane menu that under-applied). Low expected information: a near-replay of S-006.

### Option C — Block-texture / material-grain lever, **contrast-preserving** (mechanism #4) ✅
Replace S-006's relief-panel detail bullets in `composeRefRevisionPrompt` with a **surface-texture
grain** mechanism: break each flat field with a **deliberate, patterned grain** drawn from **texture
variants of the same material family** (smooth / cut / chiselled / brick-vs-cut, stair+slab coursing),
arranged as **coursing / banding / quoining / a repeating panel motif** — so the field gains visible
grain *at flat Z* without depending on the renderer registering recess depth.
- **Pro 1 — genuinely orthogonal to S-006.** Geometry (depth/shadow) vs **texture** (material grain).
  This is the cleanest possible A/B for the ticket's "which mechanism works better, and why."
- **Pro 2 — the corpus explicitly endorses it.** The measurement-caveat banner names "block texture
  as a deliberate detail variable" and credits 015's noisier grain as "a real… lever." It has never
  been run as a *controlled* lever — only observed as generation noise. T-010-01 makes it deliberate.
- **Pro 3 — it sidesteps S-006's exact failure.** Texture reads as detail **without needing depth**;
  where S-006's recesses flattened into outlines, a coursed/quoined grain registers at flat Z.
- **Risk — the v5 color crash (P9), handled head-on.** v5 crashed `color` 4→2.67 because it applied
  "2–3 related blocks per material" **uniformly, across every material, including the dominant field**,
  collapsing it to a monochrome smear. The reconciling distinction (Research): **015's grain helped
  because it was *patterned* and *contrast-holding*; v5's hurt because it was a *uniform low-contrast
  smear*.** The lever is worded to take the first and forbid the second (see guard below).

## Decision: Option C — contrast-preserving block-texture grain, in the revision seam

### The hypothesis (one sentence)
*Where relief geometry under-delivers (the model outlines panels instead of carving them, S-006),
**patterned surface-texture grain** — variant blocks of the same hue arranged as coursing/quoining —
will register as `detail` because it reads at flat Z, **provided** the grain stays patterned and
contrast-preserving so it never collapses the dominant/supporting/accent color hierarchy (the v5
failure).*

### The lever, concretely (replaces run.mjs:429–441, S-006's two detail bullets)
Two bullets, same slot, same "Detail —" lead, so exactly the *mechanism* changes vs the 015 baseline:

1. **Detail via TEXTURE GRAIN (patterned).** Break every flat field (flanks, spandrels, plinth, window
   insets) with a **deliberate patterned grain** built from **texture variants within the field's own
   material family** — e.g. alternate smooth ↔ cut ↔ chiselled courses, brick ↔ cut banding,
   stair/slab string-grain, or a quoined/checkered panel motif. The pattern must be **regular and
   legible** (coursing, banding, quoining, a repeating motif), *not* random speckle. No wall plane
   wider than ~6 may remain a single uniform block. Build it with `fill`/`box`/`line` runs so it stays
   cheap at scale; declare every variant in `palette.manifest`.
2. **Protect the color hierarchy (the anti-v5 guard, HARD).** Grain changes **texture, not hue**: every
   variant in a field stays the **same color family** so the field still reads as its assigned
   dominant/supporting/accent color — just textured. **Never** let grain lower a field's contrast
   against its neighbors or smear the build toward monochrome (that is the v5 regression, an automatic
   fail). Keep the **dominant field clearly dominant**, supporting clearly supporting, the **accent
   blocks single and saturated** (do not grain the accents). If a grain choice would wash the palette
   out, drop it and keep the solid color.

The pre-existing **one-plane**, **proportion/rhythm**, **relief/depth**, and **color-restore** bullets
stay **intact and ahead** of these — the texture grain *augments* them; it does not remove the
revision's proportion/crown duties that earned 014 its `strong`.

### Why the revision seam, not the build (attribution)
Identical to T-006-01's argument: the lever in the revision leaves **round-0 unchanged** → round-0 is
the within-run control, `render.png` the treatment, and the 015 render is the cross-run baseline. A
build-side lever would move round-0 too and forfeit the control. The revision seam is also the most
isolated and needs no `baml:gen`.

### Why this is "one thing" / clean vs S-006
The single variable changing vs the 015 baseline is the **detail mechanism**: S-006 = relief-geometry
panels; T-010-01 = texture grain. I replace S-006's two detail bullets (panel grammar + anti-grain
guard) with the two texture bullets above. Because S-006 **did not promote** (016 detail=competent,
017 incomplete), the on-disk champion is effectively the 015 config; setting its panel grammar aside
and substituting the texture mechanism gives a clean **panel-vs-texture** comparison from the *same*
baseline — exactly what the ticket's "explicit comparison to the S-006 lever" asks for. Everything
else (build prompt, doc prompt, schema, rubric, brief, harness) is untouched.

### Risk register
- **Color crash (P9)** — primary risk; mitigated by the hard contrast/hue guard + not graining
  accents + dominant-field-stays-dominant. If color still regresses, that is a *strong* recorded
  finding: "even patterned, hierarchy-protected grain crashes color → relief is the only safe detail
  lever," which retires the texture hypothesis and re-points the loop at structured-I/O relief.
- **Op-budget theft (P9 monolith trade-off)** — grain expressed as `fill`/`box`/`line` coursing is
  cheap (runs, not per-voxel), and the proportion/crown bullets stay first, so the budget hit is
  modest. The robustness/A-B gate is the backstop.
- **Palette-whitelist / AJV reject** — variant blocks must be valid `minecraft-data` IDs and declared
  in `palette.manifest`; the run's retry-on-malformed + the live schema gate catch this; `npm test`
  guards the harness.

## Verification of the hypothesis (decision rule, from AC)
Promote to champion **iff**: `detail` rises a full category to *strong* (vs round-0 control and vs 014
competent), AND **no regression** on proportion/color/fidelity (color especially — the v5 tripwire),
AND overall stays ≥ *strong*, AND it is **robust** — `detail` *strong* across **2 generations** OR a
clear describable **texture-articulation** increase vs the 015 baseline render. Otherwise revert the
diff and record the negative result. A single noisy `detail=strong` does **not** promote.

**Comparison deliverable (headline AC):** state plainly which mechanism articulates better — S-006's
relief panels (016: outlines, flat) vs T-010-01's texture grain (018/019) — and *why* (depth-dependent
vs flat-Z-legible), and which the loop should carry forward.
