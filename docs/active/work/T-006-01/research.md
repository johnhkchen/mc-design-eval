# Research — T-006-01 detail-lever experiment

Descriptive map of the code, seams, prior runs, and constraints relevant to designing and
testing ONE detail lever on the champion `vRefRevise-designdoc` approach (Taj reference).

## The experiment in one line

Champion = run 014 (`vRefRevise-designdoc`, Taj). Three dimensions reached *strong*
(proportion, color, fidelity); `detail` is the lone holdout at *competent*. Design one more
powerful detail lever, apply it as a prompt diff, run the Taj trial end-to-end, judge both
rounds, and promote only if `detail` rises a full category to *strong* with no regression —
and robustly (≥2 generations or a describable articulation delta vs the 015 baseline).

## The approach pipeline (`benchmarks/temple-facade/run.mjs`)

`vRefRevise-designdoc` (lines 881–946) runs three model calls:

1. **Stage 1 — reference-grounded design doc.** `composeReferenceDesignDocPrompt` (369–403),
   multimodal (reference image attached). Splits craft (← reference) from color (← brief).
2. **Stage 2 — high-res build.** `composeHighResBuildPrompt` (263–309) →
   `requestDesignArtifact` (JSON-Schema path). Emits the whole artifact. Rendered to
   `round-0.png`.
3. **Stage 3 — reference-compared 2nd pass.** `composeRefRevisionPrompt` (408–460) →
   `requestDesignArtifactWithImage` with TWO images (reference + round-0 render). Re-emits
   the WHOLE improved artifact. Rendered to `render.png` (the scored final).

### Finding 1 — the ticket misnames the build seam

The ticket says "build = `baml_src/facade.baml` (regenerate with `npm run baml:gen`)". That is
**wrong for this approach**: `facade.baml`'s `BuildTempleFacade` is used **only** by the
`vBAML` approach (run.mjs line 755+). `vRefRevise-designdoc`'s build is the plain JS
`composeHighResBuildPrompt` via `requestDesignArtifact`. **Editing `facade.baml` would have
ZERO effect on this run**, and no `baml:gen` is needed for a build- or revision-prompt change
here. The two real seams for this experiment are:

- build = `composeHighResBuildPrompt` (run.mjs:263) — also shared by `vRef-designdoc`.
- revision = `composeRefRevisionPrompt` (run.mjs:408) — **used by `vRefRevise-designdoc`
  alone** (grep: only call site is line 920). Most isolated seam.

### Finding 2 — the build prompt has NO anti-flat clause

`composeHighResBuildPrompt` (263–309) asks for deep relief, a full-width crown, deep opening
reveals, and varied pitches — but it **never** mentions flat-field articulation. The only
"NO LARGE FLAT FIELDS" clause in the whole pipeline lives in **the revision**
(`composeRefRevisionPrompt`, line ~429) and in `facade.baml` (unused here). So the flat
terracotta/plinth fields seen in 014/015 are produced by a build prompt that never asks for
field articulation, and a revision that asks for it once amid five other duties (proportion,
crown, relief, color-restore, fixups) — and under-applies it (journal P15).

### Finding 3 — round-0 is a built-in control

`main()` (run.mjs:1085+) renders and scores only `render.png`. `round-0.png` is saved but
**not** judged by the harness. Because the build (round-0) and revision (render) are separate
seams, **a lever placed in the revision leaves round-0 unchanged** → round-0 becomes a clean
within-run control and render the treatment. The acceptance criteria already require judging
both rounds; this makes the A/B causal and isolates the lever. A lever in the build would
change round-0 too, muddying the comparison against the 015 baseline.

## The judge (`benchmarks/temple-facade/judge.mjs`, `baml_src/judge.baml`)

- `judgeRender({ imagePath, brief, samples = 3 })` shells to `baml-judge.mts`, samples 3×,
  returns median categorical scores `{proportion,color,detail,fidelity,overall,notes,
  perSample,...}`. Categories: weak < competent < strong < exceptional (`CATEGORIES`).
- It is a **standalone function** — `vN-bestof` calls it directly on arbitrary PNGs
  (run.mjs:967). So I can judge `round-0.png` with a tiny script, exactly as the AC requires.
- **Do NOT edit `judge.baml`** (ticket constraint) — the rubric is frozen for the run.

## Prior runs — what the renders actually show

- **014 render** (champion): terracotta body, gold trim, blue lattice windows, gold onion
  dome. Relief is concentrated on the central pishtaq + pilasters; the **flanking wall
  fields, the spandrels, the plinth, and the window insets read flat**. Judge notes:
  "flanking wall fields and the windows read as flat insets rather than layered ornament, so
  articulation is concentrated rather than pervasive." detail = *competent*.
- **015 render** (identical config, different generation): same scheme; the **windows gained
  a grid/lattice grain** (mullions) that reads as more detail → detail flipped to *strong* —
  but `summary.json.notes` still prose-describes detail as competent ("large orange wall
  fields are flat"). This is the **boundary-noise**: the categorical field said *strong*, the
  notes said *competent*. A single `detail=strong` is NOT proof of a lever.
- The **flat orange/terracotta wall fields are common to both** — that is the real, stable
  failure to attack; the window grain is the noisy part.

## Prior negative result that bounds the design (journal P9, run 007/v5)

`composeDetailBuildPrompt` (run.mjs:314) pushed "2–3 related blocks per material for
micro-texture" hard **in the build**. Result: overall 4.0 → 3.33, **color crashed 4 → 2.67**
(related blocks collapsed to near-monochrome orange), depth traded 15 → 10. Lesson: a
**material-swap / "noisier-grained block-texture" lever risks the exact color regression the
promotion rule forbids.** Any detail lever must protect the color hierarchy.

## Constraints / invariants (must hold)

- Voxel `line` ops must be axis-aligned or equal-magnitude diagonal (facade.baml:25; P11).
- Recesses are carved by **exclusion** (no air op) — don't bury a block behind a fill (P11,
  memory `facade-recess-by-exclusion`).
- Primarily the document palette; declare blocks in `palette.manifest`.
- A facade is ONE connected plane — engaged masses, no freestanding pillars (P13/P14).
- Live & metered: each run is 3 `claude -p` calls (~minutes, ~$1.6) + judging.
- `npm test` = validate-artifact self-test + invalid check + unit tests; a prompt-string
  edit does not touch any of these. `baml:gen` only needed if `facade.baml` changed.

## Run command

`node benchmarks/temple-facade/run.mjs --approach vRefRevise-designdoc --ref references/taj_mahal.png`
(references/taj_mahal.png exists; default ref is sys_mausoleum.JPG so `--ref` is required.)

## Open questions carried into Design

1. Build seam vs revision seam for the lever (Finding 3 strongly favors revision).
2. Which lever form is *more powerful* than the falsified soft "must carry layered relief"
   menu, while NOT repeating the v5 color crash.
3. How to satisfy the robustness gate (2 generations) and the 015-baseline articulation
   comparison within budget.
</content>
</invoke>
