# T-076-01 Review — resemblance-gate

Handoff for a human reviewer. What changed, how it's tested, what's still open. Epic **E-22** / Story
**S-076**: the gate that measures the **real** goal — does the Minecraft build *look like* its immutable
references (concept image + GLB mesh)? — replacing the proxy metrics that read perfect on grey static.

## Summary

A three-part gate, split pure-core / impure-runner like `building-build`:
1. **Triptych** (`concept | mesh | minecraft`, one shared `BUILDING_VIEW_3Q` lens) — the verdict a human
   inspects (Rule 2).
2. **Perceptual scorer** (pure, GL-free, unit-tested) — silhouette **form IoU** (vs mesh + concept) +
   block-table-grounded **material agreement** (set: same materials? + zone: same places?). Diagnostic only.
3. **Categorical judge** (metered `claude -p`) — sees the triptych → `same object | drifted | different
   object` + a **named gap** (region + attribute) when not "same object". Parse/validate is pure + tested;
   the live call is metered.

**Gatehouse result (live, reproduced — Rule 6):** verdict **"drifted"**, gap **form @ the roof/upper
gable** — "the upper roof dissolves into a noisy lighter mass with no clean gable ridge". The same build
that once scored clean on every proxy now gets an honest, named verdict.

## Files changed

**Created**
- `src/form/resemblance.mjs` — **pure core**. `formScores`, `buildPalette`, `setAgreement`, `zoneAgreement`,
  `resemblanceRow`; triptych math `resampleRgba`/`silhouetteToRgba`/`composeTriptych`; judge
  `buildResemblancePrompt` (fixed, Rule 5) + `parseResemblanceVerdict` (enum + gap-integrity, Rule 7).
  `RESEMBLANCE_DEFAULTS` is the one frozen threshold set (Rule 5).
- `src/form/resemblance.test.mjs` — 20 GL-free unit cases (root suite).
- `benchmarks/sculpture/resemblance.mjs` — **impure runner** `runResemblanceGate` (+ CLI, `--offline`).
  References passed as immutable inputs (Rule 1).
- `benchmarks/sculpture/resemblance/gatehouse-{triptych.png, minecraft.png, perceptual.json, verdict.json,
  resemblance.md}` — the gatehouse run artifacts.
- `docs/active/work/T-076-01/{research,design,structure,plan,progress,review}.md`.

**Modified**
- `package.json` — `"resemblance"` script.
- (`resampleRgba` accepts both `{width,height}` and `{w,h}` shapes — the decoded-vs-panel bridge.)

**Not touched (pure reuse):** `form-fidelity.mjs`, `glb-silhouette.mjs`, `block-table.mjs`, `cielab.mjs`,
`palette-extract.mjs`, `sdk-binding.mjs`, `render/**`, the references, and the build artifact.

## Acceptance criteria

| AC | Status | Evidence |
|----|--------|----------|
| #1 triptych assembler, shared `BUILDING_VIEW_3Q`, `concept\|mesh\|minecraft`, per-subject PNG | ✅ | `composeTriptych` + runner; `resemblance/gatehouse-triptych.png` (labeled) |
| #2 pure GL-free unit-tested perceptual scorer: form IoU (reuse) + palette/material via block-table Lab; diagnostic | ✅ | `formScores`/`setAgreement`/`zoneAgreement`/`resemblanceRow`; 20 tests; `gatehouse-perceptual.json` |
| #3 categorical metered judge: 3-way verdict + named gap; parse/validate unit-tested, live call metered | ✅ | `buildResemblancePrompt`+`parseResemblanceVerdict` (tested); `runJudge` (metered, $0.11) |
| #4 run on gatehouse: triptych + row + verdict + named gap; gap named not hidden if drifted | ✅ | verdict "drifted", gap form@roof; all 5 outputs committed |
| #5 reusable (`runResemblanceGate` per subject), immutable refs, fixed thresholds | ✅ | exported runner; `SUBJECTS` table; frozen `RESEMBLANCE_DEFAULTS` + fixed prompt |
| #6 `npm test` green | ✅ | **812 pass / 0 fail** (was 792) |

## Test coverage

- **Unit (root `npm test`, GL-free, model-free):** `resemblance.test.mjs` — form scores (identity / proportion
  drift / null mesh), `buildPalette` (counts, top-K, table join, unknown-block drop), `setAgreement`
  (identical→1 / disjoint→0 / symmetric / empty→null), `zoneAgreement` (identity→1 / color drift / zero-fg→
  null not NaN), `resemblanceRow` (schema, determinism, throws on bad input), `resampleRgba` (identity / 2×→1×
  box mean / letterbox), `silhouetteToRgba`, `composeTriptych` (offsets / guards), prompt stability, and the
  full verdict-parser contract (fences, enums, gap integrity). **This is the durable regression surface.**
- **Runner verification (not unit-tested, by design — pulls GL + the metered model):** `--offline` proves the
  GL-free + model-free path (committed render, placeholder verdict); the **live** gatehouse run proves the
  end-to-end gate (Rule 6).

### Gaps
- No golden-image test for the triptych (GL/driver-variant + node-canvas text → flaky). Covered by the pure
  compose-math tests + the committed PNG.
- The metered judge call is exercised only by the live run (cost), never by `npm test` — the spec §4 contract.

## Open concerns / known limitations

1. **Concept camera mismatch.** The concept is an *approximate* 3/4 view → `conceptIoU` (0.611) and zone ΔE
   are depressed by misalignment, not only by real drift. Documented in the honesty ledger; the categorical
   judge + human triptych are the verdict, the numbers explain it (Rule 2). `meshIoU` (0.929, exact-view
   mesh) is the trustworthy form number.
2. **Zoning is a render-pixel proxy.** `zoneAgreement` reads dominant Lab per grid cell from render pixels
   (the artifact has no 2-D projection without the GL camera), snapped to block-table Lab. It is diagnostic,
   not a positional ground truth — a coarse "are materials roughly where the concept puts them?" signal.
3. **Single judge sample.** One metered call (vs temple-facade's N-median). `samples` is reserved on
   `runResemblanceGate` for S-077 to raise; the threshold/prompt stay fixed within a comparison set (Rule 5).
4. **GLB gitignored.** The mesh panel + `meshIoU` require `glb/stone-gatehouse.glb` (present here, gitignored
   on clean checkouts). The runner warns and degrades to a placeholder mesh panel + null `meshIoU` if absent;
   `--offline` still produces the triptych + perceptual row from committed PNGs.
5. **Verdict drift / unparsed.** A garbled model reply is caught: `parseResemblanceVerdict` throws precisely
   and the runner records `verdict:"unparsed"` with the raw text rather than crashing or guessing.
6. **`resampleRgba` dual shape.** Accepts `{width,height}` and `{w,h}` to bridge decoded images and panel
   buffers — convenient but a mild smell; a single shape convention across the module would be cleaner.

## Reviewer fast path
1. Look at `benchmarks/sculpture/resemblance/gatehouse-triptych.png` — read it like a human: concept vs build.
2. Read `gatehouse-resemblance.md` (verdict + named gap + the diagnostic table).
3. Skim `resemblance.mjs` headers (honesty ledger) + `parseResemblanceVerdict` (the Rule-7 integrity checks).
4. `npm test` → 812 green. `node benchmarks/sculpture/resemblance.mjs --offline` to reproduce GL-/model-free.

## Handoff to S-077
`runResemblanceGate({subject, conceptPath, glbPath, artifactPath, committedRenderPath, outDir, offline,
samples})` is the per-subject entry. Add subjects to the `SUBJECTS` table; references are immutable inputs;
thresholds are fixed. The consolidation story can raise `samples`, add subjects, and aggregate verdicts
without touching the pure core.
