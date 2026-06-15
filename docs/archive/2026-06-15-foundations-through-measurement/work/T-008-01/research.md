# Research — T-008-01: ground-on-sainte-chapelle (inverse-condition generalization test)

Descriptive map of the code, data, and prior results this ticket touches. No solutions here.

## What the ticket asks (restated)

Run the **champion** `vRefRevise-designdoc` pipeline on `references/St_Chapelle.png` (Sainte-Chapelle)
and judge whether the **P12 craft/color split is reference-conditional**. The ticket frames this as the
**inverse** of the Taj/Hōryū-ji runs:

- Taj (T-006 lineage) and Hōryū-ji (T-007): reference is **pale/monochrome** and **conflicts** with the
  brief's "COLORFUL" demand → the P12 color-hold clause is load-bearing (it stops the pale palette from
  capturing the build).
- Sainte-Chapelle (this ticket, *as framed*): reference is **already colorful** (polychrome stained
  glass) → reference and brief **agree** on color → the P12 clause should be a **near-no-op**, and
  `color` should come out **strong regardless**.

Hypothesis to confirm/refute: **P12 is load-bearing only in the conflict condition.** If color is strong
here, P12 should be **scoped** to the reference-conflict case. Secondary reads (AC #2): does Gothic
**verticality** hold `proportion` (cf. P13), and does the **S-006 detail lever** transfer to dense
Gothic **tracery**?

Generalization run, not a tuning run: prefer the champion config **as-is**; record any minimal diff only
if a principle visibly fails. Rubric (`judge.*`) and brief (`task.mjs`) immutable (AC).

## The reference (`references/St_Chapelle.png`, ~2.5 MB PNG) — a premise discrepancy worth flagging

**Inspected directly.** The image is the **EXTERIOR** of a Sainte-Chapelle (the Vincennes royal chapel:
a tall single-vessel Rayonnant Gothic chapel), photographed from the SW in daylight. What it actually
shows:
- **Palette: predominantly pale grey/cream limestone**, under a **dark slate-blue hipped roof**, against
  blue sky. A small round turret (NW stair) carries a conical blue-grey roof. The west gable is crowned
  with crocketed pinnacles and finials.
- **The colorful stained glass is an INTERIOR feature.** From the outside, in this lighting, the great
  **rose window** and the tall lancet windows read as **dark tracery voids**, not as saturated color.
  The dominant exterior impression is **monochrome stone**, not polychrome.

**This partly contradicts the ticket's premise.** The ticket assumes "the reference is already colorful,
so reference and brief agree on color." The *building's fame* is its polychrome glass — but the
*provided image* is a grey-stone exterior. So on the conflict↔agreement axis this reference is **not the
clean agreement case** the ticket posits; it is closer to a **third, mixed point**: a largely
monochrome-stone field with one potentially-colored feature (the rose). This is a load-bearing nuance,
because the P12 verdict hinges on what the *model actually sees* in the image, not on the building's
reputation. I record it now and let the render adjudicate (see Design / verdict logic).

**Why it still tests something real:** either reading yields a usable result. If the model treats the
image as monochrome stone, this is a *second* conflict-condition data point (does color hold off a pale
exterior, like the Taj?). If the model imputes the building's famous glass and treats it as colorful,
this is the agreement case the ticket intended. The verdict will state which reading the build reflects.

**Gothic form (relevant to the secondary reads):** strong **verticality** (tall narrow vessel, steep
gable, vertical lancets, pinnacles), a dominant **rose window**, deep **portal recession**, **buttress**
rhythm down the flank, and **dense tracery** — exactly the stress the secondary AC target (proportion
under verticality; detail on tracery).

## The pipeline (`benchmarks/temple-facade/run.mjs`, approach `vRefRevise-designdoc`, ~L884–L990)

Three live `claude -p` calls (spec §4), each via `src/sdk-binding.mjs`:

1. **Stage 1 — reference-grounded design doc** (`composeReferenceDesignDocPrompt`, L369;
   `requestTextWithImage` w/ ref). Writes `design-doc.md`. Carries P12 inline ("a CRAFT reference, NOT a
   color reference … never let a pale reference collapse the build into white").
2. **Stage 2 — high-res build** (`composeHighResBuildPrompt`, L263; `requestDesignArtifact`). Deep relief
   + full-width crown; caps width ~56 / height ~48 / depth ~24. Renders `round-0.png` (pre-revision).
3. **Stage 3 — reference-compared 2nd pass** (`composeRefRevisionPrompt`, L408;
   `requestDesignArtifactWithImage` w/ ref + round-0). Carries both principles under test: the **P13
   one-plane block** (L419–423) and the **P12 color-hold block** (L412–414 + L433–436). Produces final
   `artifact.json` → `render.png`.

`main()` (L1085): `--ref` selects the reference (default `sys_mausoleum.JPG`); the run lands in
`runs/<NNN-approach>/` (next id = **020-vRefRevise-designdoc**); `main` auto-judges **`render.png`** only
(median-of-3), writes `summary.json`, regenerates the README gallery. **`round-0.png` is NOT auto-judged**
— that needs the helper (below), required by AC #1 / P14.

## The judge (`judge.mjs` → `baml-judge.mts`, rubric `v2-categorical-baml`)

`judgeRender({ imagePath, brief, samples = 3 })` shells to the BAML categorical judge, returns a
**median-of-3** per-dimension verdict: `proportion / color / detail / fidelity / overall`, each in
`{weak, competent, strong, exceptional}`, plus `perSample` + `notes`. **Frozen** for this ticket. The
`exceptional` tier was recently sharpened (commit 0fd091d, rare apex); **weak/competent/strong boundaries
unchanged**, so scores stay comparable to runs 010–019.

## Round-0 judging helper (already exists, reusable)

`docs/active/work/T-006-01/judge-round0.mjs` (also copied into T-007-01): scores any PNG via the same
`judgeRender` seam, median-of-3, against `TEMPLE_FACADE_TASK.goal`. CLI: `node …/judge-round0.mjs
<path.png>`. I copy the same helper into this ticket's work dir to A/B `round-0.png` vs `render.png`
(P14: judge both rounds, don't assume the 2nd pass is better). Same relative-import depth — no path edit.

## The journal / attempt-log (the substantive deliverable)

`docs/knowledge/design-learnings.md` — "**Attempt log (newest last)**" (~L206; file is 380 lines, the
log currently ends at the **run 014** entry — runs 015/017/019 were never journaled). Lisa auto-injects
this file, so entries feed forward. AC #2/#3 require a dated entry: per-dimension A/B scores + an explicit
verdict on whether **P12 was neutral here** (color strong from agreement) vs still additive — and, if
supported, **scope P12** to the reference-conflict condition. Plus: proportion under verticality, detail
on tracery.

## Champion-config state (the inherited baseline — important)

- The working tree is **clean vs HEAD** on `run.mjs` at session start (`git diff --stat HEAD` empty),
  **unlike T-007-01**, which had S-010's un-promoted texture-grain edit to revert. So **no revert is
  needed**: HEAD already *is* the champion.
- HEAD's committed champion = the **015 "NO LARGE FLAT FIELDS" menu** detail bullet (L429–432; runs
  014/015 `overall=strong`). The P12 color-hold (L412–414, L433–436) and P13 one-plane (L419–423) blocks
  are the committed champion text.
- The two detail experiments upstream (S-006 panel grammar, S-010 texture grain) **did not promote**;
  HEAD reflects that (the 015 menu). The detail dimension is therefore read here with the P15 noise
  caveat, not as a tuned lever.

## Reference baseline for the A/B (prior champion runs)

| run | ref | proportion | color | detail | fidelity | overall |
|-----|-----|-----------|-------|--------|----------|---------|
| 014 | Taj | competent→**strong** (2nd pass lifted) | strong | competent | strong | **strong** |
| 015 | Taj | strong | strong | strong | strong | **strong** |
| 019 | Hōryū-ji | — | — | — | — | — *(T-007 run incomplete: only `round-0.png` on disk; never judged/journaled)* |

`detail` is boundary-noisy (014 competent vs 015 strong, identical config); P15 / the measurement caveat
warn against crediting a single noisy flip. This is a single generation → the *detail* read carries that
caveat; **color (P12) is the load-bearing read** for this ticket, with proportion (P13/verticality) the
secondary structural read.

## Constraints & assumptions

- **Frozen:** `task.mjs` (brief/seed=11/view), `judge.*` (rubric). Confirmed by AC.
- **Live & metered:** one `vRefRevise` run ≈ 3 model calls, ~15 min wall, ~$1.6–2.1 (runs 014–017).
- **`claude -p` knobs:** no `--temperature`; `--effort`/`--system-prompt` available but out of scope
  (generalization run, champion as-is). `claude` v2.1.165 confirmed on PATH; `node` v22.
- **Determinism:** seed fixed (11) but `claude -p` is not deterministic; generation noise is real (esp.
  `detail`). The **color** read is structural/low-variance — a single high-quality render answers it
  reliably; a single `detail` score is not over-credited.
- **`npm test`** (133 tests, confirmed green at session start) guards only artifact validation; a
  prompt-string edit has no unit test. Tests must stay green if any minimal generalizing edit is made.
