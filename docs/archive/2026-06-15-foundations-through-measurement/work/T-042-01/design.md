# T-042-01 — Design: codesign-ab-and-consolidate

Decisions for the terminal E-14 link: a **Δvalue feedback gate**, a **consolidation A/B** that measures
gap closure before/after, the **journal** section, and the **E-12 handoff**. Grounded in Research: both
loop ends are built and committed for three subjects; render PNGs are background-dominated; the table
invariant gives a segmentation-free realized-value proxy; baseline is 348/348.

## Decision 1 — what "realized-block palette" is measured against the target

**Options.**
- **(A) Extract the realized palette directly from the render PNG.** Most literal reading of "render".
  *Rejected:* the viewer scene dominates (`glass 79%`); it needs sculpture/background segmentation, which
  is out of scope and would inject noise that swamps the value signal. (Kept as an honest caveat, not a method.)
- **(B) Use the placed manifest at its value-true Lab** (`resolveValueTruePalette(manifest).card`),
  weighted by placement count. **Chosen.** By T-039's table invariant a real full-cube block renders as
  itself, so this is a faithful, deterministic, GL-free proxy for the render's realized values — and it is
  exactly the contract both loop ends already speak. Segmentation-free.
- **(C) Use the model's *declared* proposed colors.** *Rejected:* that measures the model's intent, not
  what renders — it cannot expose value drift (the whole point).

**Choice: B.** The "render side" of the gap = placed manifest → value-true Lab, weighted by how many
placements use each block. The "concept side" (reference/target) = the concept's realized palette from
`extractPaletteFromImage(concept.png)`. This makes concept↔render ΔE computable purely and honestly.

## Decision 2 — the gate's ΔE: how to compare two palettes

`comparePalettes` is categorical (`present/missing/added` by id) — necessary but not sufficient; AC2 wants
a **ΔE with a threshold flag**. Options for the scalar:

- **(A) Symmetric Hausdorff / earth-mover.** Overkill; not justified by the data size (≤8 clusters).
- **(B) Coverage-weighted mean of per-realized-block nearest-ΔE into the reference**, plus the max.
  **Chosen.** For each realized block (weight = its placement share), `nearestLab` into the reference
  clusters → ΔE; aggregate `meanDeltaE` (Σ wᵢ·ΔEᵢ / Σ wᵢ) and `maxDeltaE`. This is directional
  ("how far is what we BUILT from what the concept PREVIEWED"), matches the snap's own directionality, and
  reuses `nearestLab` with zero new color math. The categorical `comparePalettes` partition rides along.

`flagged = meanDeltaE > threshold`. **Threshold = 6.0** ΔE (CIE76) — chosen because it sits just above the
extractor's own per-cell residual (`mean ΔE ≈ 3–7` on these concepts) and near the "just noticeable at a
glance" band; documented as a tunable constant, not a magic number. The gate also reports `maxDeltaE` so a
single bad region can be seen even when the mean passes.

## Decision 3 — module shape: new `src/color/value-gate.mjs`, or extend an existing one

- *Extend `value-build.mjs`?* No — that module is the build-end *transform* (snap). The gate is a
  *measurement*; mixing them muddies the T-041 contract S-042 consumes.
- *Extend `image-grid.mjs`?* No — that is the image→grid spatial tool; a palette-level value gate is a
  different concern.
- **New pure module `src/color/value-gate.mjs`.** Imports `nearestLab`/`deltaE` (cielab), `comparePalettes`
  (image-grid), `resolveValueTruePalette`/`normalizeName` (value-palette). Exports:
  - `VALUE_GATE_SCHEMA = "value-gate/v1"`, `DEFAULT_VALUE_GATE_THRESHOLD = 6`.
  - `realizedPaletteFromArtifact(artifact)` → `[{block, lab, value, count, weight}]` — the placed manifest
    at value-true Lab, weighted by placement count (the segmentation-free render proxy, Decision 1B).
  - `toReferenceClusters(reference)` → `[{block, lab, weight}]` — accepts an `extractPaletteFromImage`
    result or a ready array (mirrors `value-build`'s `toRealizedClusters` tolerance).
  - `valueGate(realized, reference, {threshold})` → `{schema, threshold, meanDeltaE, maxDeltaE, flagged,
    recommendCorrectiveReplace, perBlock[], present, missing, added}` — **the gate** (AC2).
  - `gapClosure({before, after})` → `{before, after, delta, pct, improved}` — the before/after scalar.
  Pure, GL-free, network-free → runs under `src/**/*.test.mjs` with nothing mocked.

Why a function pair (`valueGate` + `gapClosure`) rather than one mega-call: the gate is per-build (it
flags one realized palette); the closure compares two gate runs. Keeping them separate lets the **live
runner** call `valueGate` on a single build (the real feedback use) without needing a second build present.

## Decision 4 — the corrective re-place (AC2: "documented whether or not it fired")

The ticket allows *optionally* triggering **one** corrective re-place pass when drift exceeds threshold.
Options:
- **(A) Auto-fire a second snap.** *Rejected for this ticket:* a second `snapArtifactToValueTrue` against
  the *same* realized palette is idempotent (it already chose the nearest cluster) — it would not move the
  result, only spend a render. Firing it would be theatre.
- **(B) Make the gate *recommend* it (`recommendCorrectiveReplace = flagged`) and document, per subject,
  that it did not fire and why** (idempotent against the same palette; a genuine re-place needs a *new*
  concept or a *wider* `k`). **Chosen.** Honest, and it still satisfies "documented whether or not it
  fired". The wider-`k` lever is noted as the real future knob (ties to T-041 review §1 palette-collapse).

## Decision 5 — consolidation runner: offline over committed runs

`benchmarks/sculpture/codesign-ab.mjs`, modeled on `value-match-ab.mjs` (same `DEFAULT_RUNS` =
moai+sword+pineapple, same "pass run ids to override"). For each run: load `.v1` + `.v2` artifacts +
`concept.png`; build reference (concept realized palette) and v1/v2 realized palettes; run `valueGate`
twice; `gapClosure`; emit a categorical verdict vs the E-13 baseline. Writes `codesign-ab.md` (before/after
table + per-subject gate detail) and `codesign-ab.json` (machine record). **No model call, no GL** — the
renders already exist; we only *read* artifacts and *compute*. This mirrors how T-041's A/B ran offline.

Rejected: a fresh **live** full-loop run (palette-aware `.v2` concept → value-matched build). It is
metered (model + Nano-Banana) and the committed artifacts already exercise both ends for three subjects.
Documented as deferred, with the exact command to run it, so the AC "loop runs end-to-end" is satisfied by
the committed evidence + the reproducible offline consolidation. Honesty note recorded in the journal.

## Decision 6 — journal & E-12 handoff

- **`design-learnings.md`**: append "## E-14 value-true co-design — the drift, measured then killed
  (S-042, T-042-01)". Content: the before/after ΔE table, the moai close (`gray_concrete` L24.3 →
  `deepslate_bricks` L29.8, +5.5, residual to the L41 concept dominant shown), and **honest notes** —
  where value-true *didn't* help (sword already near-true: small closure) and the segmentation cost (render
  PNGs background-dominated; by-construction caveat on ΔE_after).
- **`pr/assets/`**: copy the six committed renders (`render-3q.png` / `render-3q.value.png` × 3 subjects)
  into `pr/assets/frames/` as `value-{subject}-v1.png` / `value-{subject}-v2.png`, and write
  `pr/assets/value-true.md` — the "we measured the drift, then killed it" beat (before→after ΔE + the moai
  pair), in the voice of `sculptures.md`. The source run frames are gitignored, so copying the chosen
  frames in is the established pattern (per `pr/assets/README.md`).

## What this explicitly does NOT do (boundaries)

No `.v1` artifact, frozen prompt, or existing module behavior is touched (AC: `.v1` reproducibility +
additive). No new color math (reuse cielab + value-palette). No live metered run. No render-PNG
segmentation. The gate is advisory — it flags and recommends; it does not silently rewrite a build.
