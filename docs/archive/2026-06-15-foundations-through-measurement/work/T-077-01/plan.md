# T-077-01 Plan — resemblance-consolidation

Ordered, independently-verifiable steps. Each commits atomically. Testing strategy noted per step. The
heavy live run (GL + metered judge) is isolated to one step so the pure/structural work is verified first.

## Step 1 — `renderArtifact` forwards `supersample` (the before/after lever)
- Edit `render/src/render-tool.mjs`: forward `opts.supersample` into `renderBuild`; add JSDoc line.
- **Verify:** `npm test` still green (additive, no behavior change when undefined). Quick manual probe:
  `renderArtifact(artifact,{supersample:1})` vs default produces visibly different HF energy on scale-64.
- **Commit:** `feat(E-22 T-077-01): renderArtifact forwards supersample (before/after lens lever)`

## Step 2 — pure `consolidateResemblance` + tests
- Add `consolidateResemblance(subjectResults, opts)` + `RESEMBLANCE_CONSOLIDATION_SCHEMA` to
  `src/form/resemblance.mjs` (counts, per-subject row, `routesToE21`, `e21Findings`).
- Add the describe block to `src/form/resemblance.test.mjs` (routing rule both ways, unknown verdict,
  null-gap no-route, counts, determinism, schema).
- **Verify:** `npm test` green with the new cases (target 812 → ~820+). GL-free, model-free.
- **Commit:** `feat(E-22 T-077-01): pure resemblance consolidation aggregator + E-21 routing rule`

## Step 3 — generalize the `SUBJECTS` table
- In `benchmarks/sculpture/resemblance.mjs`: add `cottage`, `moai`, `pineapple`; give each entry explicit
  `concept`/`artifact`/`committedRender`/`glb`; update `main()` to read `def.concept` directly.
- **Verify:** `node benchmarks/sculpture/resemblance.mjs --offline --subject moai` (GL-free, model-free)
  produces a triptych + perceptual row from the committed render — confirms path resolution for a new
  subject without spending GL/model. Repeat `--subject cottage`, `--subject pineapple`.
- **Commit:** `feat(E-22 T-077-01): SUBJECTS table — cottage + moai + pineapple (immutable refs)`

## Step 4 — the consolidation driver (structure only, no live run yet)
- Create `benchmarks/sculpture/resemblance-consolidation.mjs`: iterate SUBJECTS → `runResemblanceGate` →
  `consolidateResemblance` → write reports; `renderGatehouseBeforeAfter`; E-21 findings; asset copy.
- **Verify (offline first):** `node …/resemblance-consolidation.mjs --offline` runs end-to-end on committed
  renders (placeholder verdicts) — proves the driver wiring, report writers, before/after render, and asset
  copy work GL-clean and model-free. Inspect the generated `.md`/`.json` shape.
- **Commit:** `feat(E-22 T-077-01): resemblance consolidation driver (offline-verified wiring)`

## Step 5 — the live run (GL re-render + metered judge, all four subjects)
- `node benchmarks/sculpture/resemblance-consolidation.mjs` (live). Produces fresh fixed-lens renders, four
  metered verdicts, the four triptychs, the consolidation reports, the gatehouse before/after with HF
  numbers, the E-21 findings file, and the `pr/assets/` copies.
- **Verify (Rule 4/6):** open each triptych and read it like a human; confirm verdicts parsed (no
  `"unparsed"`); confirm before/after HF energy drops (old ≫ new); confirm `consolidation.json` counts match
  the per-subject verdict files; confirm any material-attributed gap appears in `e21-material-findings.md`.
- **Commit:** `feat(E-22 T-077-01): live resemblance consolidation — 4 subjects photographed + judged`
- (If a judge call returns `"unparsed"`, the runner records it honestly; re-run that subject once — Rule 6.
  If GL or the model is unavailable in a given environment, fall back to `--offline` and record the mode in
  the report; the live verdicts committed here remain the record of reference.)

## Step 6 — design-learnings.md E-22 section
- Append the **"Faithful render + resemblance gate (E-22)"** section using the *real* re-photographed
  verdicts from Step 5 (root cause, fix, gate-replaces-green-metric, honest per-subject delta incl. any
  worse).
- **Verify:** section reads honestly; cites HF −71.4% and the four verdicts; links the relevant memory nodes.
- **Commit:** `docs(E-22 T-077-01): design-learnings — faithful render + resemblance gate section`

## Step 7 — final verification + review
- `npm test` green (full suite). Confirm all AC artifacts exist on disk (triptychs, consolidation .md/.json,
  before/after in pr/assets, e21 findings, design-learnings section).
- Write `review.md` (changes, test coverage, open concerns).
- **Commit:** `docs(E-22 T-077-01): review — resemblance consolidation handoff`

## Testing strategy summary
- **Unit (root `npm test`, GL-/model-free):** the new `consolidateResemblance` aggregator + routing rule.
  This is the durable regression surface. The pre-existing 812 stay green.
- **Offline runner verification (Steps 3–4):** GL-/model-free path proves wiring, path resolution, report
  writers, before/after render, asset copy — without spending GL or the metered model.
- **Live run (Step 5):** the end-to-end gate (Rule 6 reproduce) — the four real verdicts + the before/after
  proof. Verified by human triptych inspection (Rule 2) + the HF-energy number (Rule 7 quantified).
- **No golden-image tests** for triptychs/renders (GL/driver-variant + node-canvas text flakiness — the
  T-076 documented gap); covered by the pure compose-math tests + committed PNGs.

## Risk register
- **Judge returns `"unparsed"`:** handled — recorded honestly, counted under its key, no E-21 finding, no
  crash. Re-run the subject once (Rule 6).
- **A subject's GLB absent on a clean checkout:** runner warns, degrades to placeholder mesh panel + null
  meshIoU; triptych + perceptual row + verdict still produced. All four GLBs present in this env.
- **Concept camera mismatch** depresses conceptIoU/zone ΔE (T-076 concern #1) — diagnostic only; the
  triptych + judge are the verdict. Reported, not "fixed."
- **A material-drift gap is found:** correct outcome — routed to E-21 as a finding (AC#4), not edited here.
- **A verdict gets *worse* under the fixed lens:** an honest result (the ticket explicitly anticipates it);
  recorded in the consolidation report + design-learnings, not suppressed (Rule 7).
