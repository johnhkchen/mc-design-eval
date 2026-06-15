# T-077-01 Research — resemblance-consolidation

Terminal ticket of **E-22** (Story **S-077**). Descriptive map of what exists, where, and how it
connects. T-075-01 fixed the render lens; T-076-01 built the resemblance gate; this ticket *applies*
both to the headline builds and reports honestly. No solutions proposed here.

## The two delivered dependencies

### T-075-01 — the fixed render lens (SSAA ×3)
- `render/src/render.mjs` — `renderWorldToPng(world, center, opts)` → PNG Buffer. `DEFAULTS.supersample = 3`:
  renders the scene at `width*3 × height*3` (1536²) and box-down-filters to the fixed 512² contract.
- `render/src/headless-canvas.mjs` — added `readCanvasRgba(canvas)` (GL→2D blit read) and
  `encodeRgbaToPng(rgba,w,h)` (sync node-canvas encode). `GL_AVAILABLE` probe — **true** in this env.
- `src/render-supersample.mjs` — pure `boxDownscale` / `nearestDownscale` / `highFreqEnergy` (unit-tested).
- The **old lens** is reachable by passing `supersample: 1` (the legacy point-sampled path) — the encode
  branch falls back to the raw `createPNGStream()`. This is the lever for the AC#3 before/after.
- Proof from T-075: scale-64 gatehouse HF energy **690.9 → 197.5 (−71.4%)**, build artifact untouched.
- High-level entry: `render/src/render-tool.mjs` `renderArtifact(artifact, {outPath, view})`; the canonical
  view is `BUILDING_VIEW_3Q` (exported from `src/building.mjs`) — the one lens shared by the triptych.

### T-076-01 — the resemblance gate
- `src/form/resemblance.mjs` — **pure core**: `formScores` (silhouette IoU vs mesh + concept),
  `buildPalette`/`setAgreement`/`zoneAgreement` (block-table-Lab material agreement), `resemblanceRow`
  (orchestrator), triptych math (`resampleRgba`/`silhouetteToRgba`/`composeTriptych`), and the judge
  `buildResemblancePrompt` (fixed, Rule 5) + `parseResemblanceVerdict` (3-enum + named-gap integrity).
  `RESEMBLANCE_DEFAULTS` is the single frozen threshold set. 20 GL-free unit tests in `resemblance.test.mjs`.
- `benchmarks/sculpture/resemblance.mjs` — **impure runner**. `runResemblanceGate({subject, conceptPath,
  glbPath, artifactPath, committedRenderPath, outDir, offline, samples})` is the **reusable per-subject
  entry S-077 calls** (explicitly handed off). Owns GL re-render, image decode, the metered `claude -p`
  judge (`runJudge` → `requestTextWithImage`, model `claude-opus-4-8`, ~$0.11/call), label drawing, I/O.
- Outputs per subject to `benchmarks/sculpture/resemblance/`: `<s>-triptych.png`, `<s>-minecraft.png`,
  `<s>-perceptual.json`, `<s>-verdict.json`, `<s>-resemblance.md`.
- The `SUBJECTS` table currently holds **only gatehouse**. Its entry shape:
  `{key, glb, run, artifact, committedRender}` — `conceptPath` is derived as `runs/<run>/concept.png`.
- **Gatehouse already has a committed live verdict:** `"drifted"`, gap **form @ roof/upper gable**
  (`resemblance/gatehouse-verdict.json`), meshIoU 0.929, conceptIoU 0.611, set 0.75, zone 0.304, ΔE 39.27.

## The four headline subjects (AC#1: gatehouse + cottage + 2 sculptures)

All three inputs (immutable concept image, GLB mesh, build artifact) verified present on disk:

| subject | build artifact | GLB | concept (canonical, per glb/README.md) | committed render |
|---------|----------------|-----|----------------------------------------|------------------|
| gatehouse | `building/best/artifact.json` | `glb/stone-gatehouse.glb` | `runs/015-…-gatehouse-…/concept.png` | `building/scale-64/render-3q.png` |
| cottage | `concept-materials/cottage/after-artifact.json` | `glb/cottage.glb` | `runs/014-vConcept-a-cottage/concept.png` | `concept-materials/cottage/after-3q.png` |
| moai | `e19-build/moai/artifact.json` | `glb/moai.glb` | `runs/003-vConcept-a-moai-statue/concept.png` | `e19-build/moai/render-3q.png` |
| pineapple | `e19-build/pineapple/artifact.json` | `glb/pineapple.glb` | `runs/004-vConcept-a-pineapple/concept.png` | `e19-build/pineapple/render-3q.png` |

**Why moai + pineapple as the two sculptures:** they are the two *form-type poles* the project has
characterized — moai = angular/fine-relief (regresses with scale; value-true work), pineapple =
organic/textured (cross-hatch recovers with scale). See `[[scale-fidelity-is-form-dependent]]`. Judging
both exercises the gate across the form spectrum, not one comfortable case.

**Cottage build provenance:** the cottage has no `building/`-style build; its only build artifact is the
E-21 material-correction output `concept-materials/cottage/after-artifact.json` (with a `before-artifact.json`
sibling). It is a full-building subject (per glb/README.md, the E-20 de-risk helper). GLB + concept present.

**e19-build is the headline sculpture pipeline** (newest, Jun 6 10:08): `summary.json` records scale 32,
moai e19 formIoU 0.416 / valueΔE 14.05 (pruned 2192 from 4215), pineapple e19 formIoU 0.907 / valueΔE 6.68.

## Where the deliverables land

- **Triptychs + per-subject gate outputs:** `benchmarks/sculpture/resemblance/` (existing convention).
- **Per-subject report (AC#2):** `resemblance-consolidation.{md,json}` — new file, location TBD in Design
  (candidate: `benchmarks/sculpture/resemblance/`). Holds verdict + named residual gap per subject.
- **Gatehouse before/after (AC#3):** old lens (`supersample:1`, static) vs fixed lens (`supersample:3`,
  clean) on the **same** `building/scale-64/artifact.json`. T-075 already produced `before.png`/`after.png`
  in its work dir as proof; AC#3 wants these in the E-12 handoff (`pr/assets/`), freshly rendered (Rule 4).
- **Material-drift findings → E-21 (AC#4):** a findings file routing any gate-attributed *material* gap
  (palette / material-zoning attribute) back to E-21. E-22 photographs + judges; it does **not** edit form
  or materials. Candidate location: `docs/active/work/T-077-01/e21-material-findings.md` or `pr/assets/`.
- **design-learnings.md section (AC#5):** `docs/knowledge/design-learnings.md` (1926 lines; sections:
  "Principles (distilled)" P1–P15, then "Attempt log (newest last)"). Append a **"Faithful render +
  resemblance gate (E-22)"** subsection: minification-aliasing root cause, the SSAA/mipmap fix, the
  reference-anchored gate that replaced green-metric sign-off, and **what re-photographing changed** about
  prior verdicts (honest, including any that got worse).
- **E-12 handoff (AC#6):** `pr/assets/` (exists; holds prior PR media + `frames/`, `rotations/`). Drop the
  gatehouse old/new before/after + the four triptychs there. `npm test` green.

## Constraints & assumptions

- **Rules of engagement (binding):** verdict = the triptych not a number (R2); no shrinking builds to pass
  (R3); every claim cites a fresh render (R4); residual gaps quantified + reported, never hidden (R7).
- **Capability probe (this session):** `GL_AVAILABLE = true`; `claude` CLI present (v2.1.167). So the
  **live** gate (GL re-render + metered judge) is runnable — not forced onto the `--offline` fallback.
- **GLBs are gitignored** (~5 MB each) but present locally; the runner degrades to a placeholder mesh panel
  + null meshIoU if absent. All four GLBs are on disk here.
- **Concept camera mismatch** (documented T-076 open concern #1): concept is an *approximate* 3/4 view, so
  `conceptIoU` and zone ΔE are depressed by misalignment, not only real drift. `meshIoU` (exact view) is the
  trustworthy form number. The categorical judge + human triptych are the verdict; numbers explain (R2).
- **Single judge sample** today; `samples` is reserved on `runResemblanceGate` for S-077 to raise. The
  prompt + thresholds stay fixed within the comparison set (R5).
- **Test surface:** `npm test` = artifact self-tests + `node --test "src/**/*.test.mjs"`; currently **812
  pass**. The runner is intentionally *not* unit-tested (it pulls GL + the metered model); new pure logic
  (e.g. consolidation aggregation) must be GL-free + model-free to be testable in the root suite.
- **The runner already exists and is the seam.** T-077 is mostly *application + reporting*: extend the
  `SUBJECTS` table, drive all four subjects, aggregate verdicts, render the before/after, write the reports,
  route material findings, document the learning. Minimal new pure code (aggregation), no pure-core changes.
