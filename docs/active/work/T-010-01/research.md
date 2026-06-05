# Research — T-010-01 detail-lever B (the *alternate* detail mechanism)

Descriptive map of the code, seams, the S-006 result this ticket gates on, and the constraints
relevant to choosing and testing a **second, distinct** detail lever on the champion
`vRefRevise-designdoc` approach (Taj reference). S-010 is E-08's second run-the-test link: try a
detail mechanism S-006 did **not** use, then say which works better and why.

## The experiment in one line

`detail` is the lone dimension stuck at *competent* across the Taj arc (010→016), while
proportion/color/fidelity reach *strong* (P15). S-006 (T-006-01) attacked it with a
**relief-geometry panel grammar** and it did **not** lift detail. T-010-01 must pick a *different*
mechanism, apply it as one prompt diff, run the Taj trial, judge both rounds (median-of-3), and
record an explicit comparison to the S-006 lever.

## What S-006 / T-006-01 actually did (read first — the ticket requires it)

S-006's Design chose **Option D**: replace the soft "any plane >~6 must carry layered relief
[menu]" bullet in `composeRefRevisionPrompt` with a **mandatory recessed-panel + string-course
grammar** — every flat field becomes a sunken panel (recessed 1–2 into −Z by exclusion) framed by
pilaster strips + top/bottom string courses, plus a continuous horizontal course every ~6–8 rows.
**Relief only, palette held**, with an explicit **anti-material-grain guard**: *"do NOT introduce
extra materials or 2-3-related-block 'grain' to fake texture; that collapses the color hierarchy."*
(`benchmarks/temple-facade/run.mjs:429–441`, currently in the working tree, uncommitted.)

**Result — it did not promote.** Generation 1 = **run 016**, `detail = competent` (3/3). The judge
read the panels as *drawn-on outlines*, not real relief:

> "the articulation is largely drawn-on outlines: flat orange panels each holding a single small
> blue cross, a plain unmodeled plinth, and broad uninterrupted wall fields with little actual
> relief depth … the dome's shingling and the arch surround show the build CAN do layered relief,
> which makes the empty panels and base read as missed opportunities." (016 `summary.json`)

Generation 2 (run 017) is **incomplete** — only `build.prompt.txt` / `design-doc.*` / `reference.png`
exist; no `render.png`/`summary.json`. So S-006's verdict is at best **discard** (gen-1 competent,
gen-2 never landed). Its diff is still on disk but did not earn promotion under the AC rule.

**The diagnostic that matters for me:** S-006's mechanism failed because *the model can nominally
follow a recess recipe but the recesses do not register as depth* — it outlines panels at flat Z
instead of carving them, so the big terracotta field still reads flat. Relief geometry under-delivers
in this medium/budget.

## The approach pipeline (`benchmarks/temple-facade/run.mjs`)

`vRefRevise-designdoc` (≈ lines 881–946) is three `claude -p` calls:

1. **Stage 1 — reference-grounded design doc.** `composeReferenceDesignDocPrompt` (369–403),
   multimodal (Taj photo attached). Splits **craft ← reference** from **color ← brief** (P12).
2. **Stage 2 — high-res build.** `composeHighResBuildPrompt` (263–309) → `requestDesignArtifact`
   (JSON-Schema path). Emits the whole artifact. Rendered to **`round-0.png`** (saved line ~927,
   **not** auto-judged by the harness).
3. **Stage 3 — reference-compared 2nd pass.** `composeRefRevisionPrompt` (408–460) →
   `requestDesignArtifactWithImage` (reference + round-0 render). Re-emits the WHOLE improved
   artifact. Rendered to **`render.png`** — the only render `main()` scores (line 1123).

### Finding 1 — the two real seams (ticket's `facade.baml` note is wrong for this approach)
The ticket lists `baml_src/facade.baml` + `npm run baml:gen` as a seam. As established in T-006-01
research, `facade.baml`'s `BuildTempleFacade` is used **only by `vBAML`**; `vRefRevise-designdoc`'s
build is the plain-JS `composeHighResBuildPrompt`. Editing `facade.baml` has **zero** effect here
and no `baml:gen` is needed for a prompt-string change. The lever seam is
**`composeRefRevisionPrompt` (run.mjs:408)** — the most isolated (its only call site is line ~920).

### Finding 2 — round-0 is a built-in control (inherited from T-006-01)
Because the build (round-0) and revision (render) are separate seams, a lever placed in the revision
**leaves round-0 unchanged** → round-0 is a clean within-run control, render is the treatment. The AC
mandates judging both. The T-006-01 helper `judge-round0.mjs` scores any PNG via the same
`judgeRender` seam `vN-bestof` uses (run.mjs:976) — reusable verbatim for run 018/019.

### Finding 3 — the build prompt never asks for field grain or field articulation
`composeHighResBuildPrompt` asks for deep relief + crown but **never** mentions flat-field surface
texture. The only detail clause in the live pipeline is the revision's. So the flat terracotta fields
in 014/015/016 come from a build that doesn't ask for field grain and a revision whose relief recipe
the model flattens. Leaving the build untouched keeps round-0 as the control.

## The pivotal corpus signal — texture is the endorsed next variable

`design-learnings.md` (auto-injected) is unusually explicit about *which* detail mechanism to try:

- **Measurement-caveat banner:** "run 015 chose a **noisier-grained block texture**, which reads as
  more detail — a real but small lever … detail variance is partly an *exploitable signal*
  (block-texture grain, alongside structural relief) … Experiments should treat **block texture as a
  deliberate detail variable**." → texture is named, endorsed, and *not yet run as a controlled lever*.
- **P9 / run 007 (v5) — the cautionary bound:** pushing "2–3 related blocks per material for
  micro-texture" **in the build, across all materials** crashed **color 4 → 2.67** ("related blocks
  collapsed into a near-monochrome orange field") and traded relief 15 → 10. So a naïve grain lever
  self-falsifies on *color*, the dimension the promotion rule forbids regressing.
- **The reconciling distinction:** 015's grain *helped* (a **patterned** window lattice/mullions that
  *holds contrast*); v5's grain *hurt* (a **uniform smear** on the dominant field that *kills
  contrast*). The exploitable lever is **patterned, contrast-preserving grain**, never uniform
  low-contrast grain — and applied where it cannot collapse the dominant/supporting/accent hierarchy.
- **Rubric update:** `exceptional` now demands "detail = no flat field anywhere"; competent→strong
  boundaries unchanged, so 014/015/016 remain comparable.

## Prior renders — the stable offender

Across 014/015/016 the **large flat terracotta/orange wall fields and the plinth** are the constant
flat regions; the dome shingling, arch voussoirs, and (in 015) window lattice already read as detail.
015 (`detail` strong-ish) differed from 014 (competent) mainly by **window-grain**, not by relief on
the big fields — i.e. the grain signal lives exactly where a texture lever would act.

## Constraints / invariants (must hold)

- Recesses carved by **exclusion** (no air op); `line` ops axis-aligned or equal-magnitude diagonal
  (P11; memory `facade-recess-by-exclusion`). A facade is **ONE connected plane** — engaged masses,
  no freestanding pillars (P13/P14). These bullets in `composeRefRevisionPrompt` stay **intact**.
- **Palette discipline is the gate:** any block variants I introduce must be declared in
  `palette.manifest` and the JSON must pass the live AJV gate (memory
  `prompt-vs-live-artifact-schema` — conform to the live schema or renders fail).
- **Do NOT edit `judge.baml`** (rubric frozen) or `task.mjs` (brief frozen).
- Live & metered: each run = 3 `claude -p` calls (~$1.6–2.0, ~15–18 min) + judging.
- `npm test` = validate-artifact self-test + invalid check + unit tests (133); a prompt-string edit
  touches none of them; no `baml:gen` (no `.baml` change).

## Run command

`node benchmarks/temple-facade/run.mjs --approach vRefRevise-designdoc --ref references/taj_mahal.png`
(default ref is `sys_mausoleum.JPG`, so `--ref` is required; `references/taj_mahal.png` exists.)

## Open questions carried into Design

1. **Which distinct mechanism?** S-006 used relief-geometry panels (failed). The remaining single-diff
   candidates are *per-region articulation minimums* (relief again — risks re-failing the same way) and
   *block-texture / material grain* (the corpus-endorsed, genuinely orthogonal variable, with the v5
   color-crash to design around). Design must pick one and justify.
2. **How to get texture's benefit (015's contrast-holding grain) without v5's crash** — i.e. how to
   word a *patterned, contrast-preserving, hierarchy-protecting* grain so the field gains busyness
   without going monochrome.
3. **Baseline & attribution:** test from the 015 champion baseline (S-006 did not promote), keep
   round-0 as control, and word it so exactly one variable (detail *mechanism*) differs vs 015.
4. **Robustness gate:** the AC forbids crediting a single noisy `detail=strong`; need 2 generations or
   a describable texture-articulation delta vs the 015 render.
