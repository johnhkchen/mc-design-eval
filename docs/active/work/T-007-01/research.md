# Research — T-007-01: ground-on-horyuji (generalization stress test)

Descriptive map of the code, data, and prior results this ticket touches. No solutions here.

## What the ticket asks (restated)

Run the **champion** `vRefRevise-designdoc` pipeline on a *new* reference —
`references/horyu_ji.JPG`, a vertical multi-storey **wooden pagoda + hall** complex — and judge
whether two principles **generalize** off the domed-Taj domain they were derived on:

- **P13** ("a facade is ONE connected plane; borrow rhythm, not 3-D standalone parts") — the
  Hōryū-ji is a *freestanding tower* with stacked tiers. Does the pipeline still emit a single
  coherent elevation, not a floating/detached-tier pagoda?
- **P12** ("a reference supplies CRAFT, not COLOR; color comes from the brief") — the timber
  palette is near-monochrome dark-brown/grey/white. The brief demands COLORFUL. Does color come
  from the brief, not the wood?

This is a **generalization run, not a tuning run**: run the champion as-is; only edit a prompt if a
principle *visibly* fails to translate, and only a *minimal* generalizing change (record the diff).
Do **not** touch the rubric (`judge.*`) or brief (`task.mjs`).

## The reference (`references/horyu_ji.JPG`, 699×466 JPEG)

A photo of the Hōryū-ji Sai-in precinct: on the left the **Kondō** (two-storey hipped-gable hall
with deep tiled eaves, white plaster + dark timber post-and-beam, a railed mokoshi skirt); on the
right the **five-storey pagoda** — stacked diminishing tiers of grey tiled roofs on dark timber
bracketing, capped by a tall bronze finial (sōrin). Palette is **muted and near-monochrome**:
weathered dark timber, white plaster infill, grey-blue clay tile, against a pale sky. Two
*freestanding, fully 3-D* masses. This is deliberately *unlike* the domed, symmetric, single-mass
Taj on which P11–P15 were derived — exactly the generalization axis the ticket targets.

## The pipeline (`benchmarks/temple-facade/run.mjs`, approach `vRefRevise-designdoc`, ~L891)

Three live `claude -p` calls (spec §4), each via `src/sdk-binding.mjs`:

1. **Stage 1 — reference-grounded design doc** (`composeReferenceDesignDocPrompt`, ~L369;
   `requestTextWithImage` with the ref). Writes `design-doc.md`. Carries the P12 craft/color split
   inline ("a CRAFT reference, NOT a color reference … never let a pale reference collapse the build
   into white").
2. **Stage 2 — high-res build** (`composeHighResBuildPrompt`, ~L263; `requestDesignArtifact`).
   Deep relief + full-width crown; caps lifted (width ~56, height ~48, depth ~24). Renders
   `round-0.png` (the pre-revision build).
3. **Stage 3 — reference-compared 2nd pass** (`composeRefRevisionPrompt`, ~L408;
   `requestDesignArtifactWithImage` with **two** images: ref + round-0). Carries **both** principles
   under test: the P13 "ONE connected plane" block (~L419) and the P12 color-hold block (~L443).
   Produces the final `artifact.json` → `render.png`.

`main()` (~L1095): `--ref` selects the reference (default `sys_mausoleum.JPG`); each run lands in
`runs/<NNN-approach>/`; `main` auto-judges **`render.png`** only (median-of-3) and writes
`summary.json` + regenerates the README gallery. **`round-0.png` is NOT auto-judged** — that needs
the helper (below), required by AC #1 / P14.

## The judge (`judge.mjs` → `baml-judge.mts`, rubric `v2-categorical-baml`)

`judgeRender({ imagePath, brief, samples = 3 })` shells to the BAML categorical judge and returns a
**median-of-3** per-dimension verdict: `proportion / color / detail / fidelity / overall`, each in
`{weak, competent, strong, exceptional}`, plus `perSample` + `notes`. Frozen for this ticket. The
`exceptional` tier was recently sharpened (rare apex); **weak/competent/strong boundaries unchanged**,
so scores stay comparable to runs 010–017.

## Round-0 judging helper (already exists, reusable)

`docs/active/work/T-006-01/judge-round0.mjs` (copied into T-010-01 too): scores any PNG via the same
`judgeRender` seam, median-of-3, against `TEMPLE_FACADE_TASK.goal`. CLI: `node …/judge-round0.mjs
<path.png>`. I will drop the same helper into this ticket's work dir to A/B `round-0.png` vs
`render.png` (P14: judge both rounds, don't assume the 2nd pass is better).

## The journal / attempt-log

`docs/knowledge/design-learnings.md` — "**Attempt log (newest last)**" (~L206). Lisa auto-injects
this file, so entries feed forward. AC #2/#3 require a dated entry here: per-dimension A/B scores +
explicit **held/failed** verdict for P12 and P13, grounded in the render; and if a principle fails,
**scope** it (state the condition) rather than silently pass.

## Champion-config state (the inherited baseline — important)

- The ticket gates on **T-010-01** (done) and inherits "whatever champion the two detail experiments
  (S-006, S-010) left." Neither experiment **promoted**:
  - **S-006** (relief-panel grammar) — run 016 `detail=competent`; never committed/promoted.
  - **S-010** (texture-grain) — working-tree edit to `composeRefRevisionPrompt`; **run 017 came back
    `proportion=competent` (regressed from strong) and `detail=competent`** → no detail lift, a
    proportion regression. No promotion journal entry exists. T-010-01's own `review.md` states the
    revert target on non-promotion is the **015 menu (committed HEAD)**.
- HEAD's committed champion = the **015 "NO LARGE FLAT FIELDS" menu** detail bullet (runs 014/015
  `overall=strong`). At session start the working tree carried S-010's un-promoted texture-grain edit
  (`git diff HEAD` = +14/−4 in the detail bullet only). The two principles under test (P12 color-hold
  ~L443, P13 one-plane ~L419) are **identical** in both variants — the diff is confined to the
  *detail* bullet, orthogonal to P12/P13.

## Reference baseline for the A/B (Taj champion runs)

| run | ref | proportion | color | detail | fidelity | overall |
|-----|-----|-----------|-------|--------|----------|---------|
| 014 | Taj | strong | strong | competent | strong | **strong** |
| 015 | Taj | strong | strong | strong | strong | **strong** |
| 017 | Taj | competent | strong | competent | strong | strong (texture-grain WT) |

`detail` is boundary-noisy (014 competent vs 015 strong, identical config); P15 / the measurement
caveat warn against crediting a single noisy flip. The Hōryū-ji run is a single generation, so the
*detail* dimension is read with that caveat; **P12/P13 are the load-bearing reads** for this ticket.

## Constraints & assumptions

- **Frozen:** `task.mjs` (brief/seed/view), `judge.*` (rubric). Confirmed by AC.
- **Live & metered:** one `vRefRevise` run ≈ 3 model calls, ~15 min wall, ~$1.6–2.1 (runs 014–017).
- **`claude -p` knobs:** no `--temperature`; `--effort`/`--system-prompt` available but out of scope
  (generalization run, champion as-is).
- **Determinism:** seed is fixed (11) but `claude -p` is not deterministic; generation noise is real
  (esp. on `detail`). Single-generation reads of P12/P13 are robust (they are categorical, structural,
  not boundary-flippy); a single detail score is not over-credited.
- **`npm test`** (133 tests) guards only artifact validation; a prompt-string edit has no unit test.
  Tests must stay green if any minimal generalizing edit is made.
