# T-066-01 — Design: cleanup-consolidation

Decide how to compose the three landed fixes into one final build, how to frame the honest before/after, and
where the pure/impure seam sits. Grounded in Research: GL is available, the three fixes are merged, the only
unwired one is routing, and the busy baseline has committed renders.

## What "done" requires (from the ACs)

1. All 7 rebuilt with **pruned + clean materials + routed voxelizer**; renders saved (`e19-build/<subject>/`).
2. A before/after table vs E-18 (`e19-cleanup.{md,json}`): per subject — form IoU, fixed speckle, stray /
   largest-fraction, distinct, off-(aug)-palette, value ΔE — **with the marginal Δ each fix bought**.
3. Before/after visuals on the worst cases — heart (speckle), moai (stray geometry), koi — to `pr/assets/frames/`.
4. `design-learnings.md` gains a **voxel cleanup (E-19)** section marking each backlog item closed (with its
   number) or honestly explaining why not, and answering: **is GLB-voxel colour now as clean as text→JSON?**
5. An **E-12 handoff** (`pr/assets/`) with the cleaned builds; honest about anything not fully closed; `npm test` green.

## Decision 1 — How to build the "after" (routed + pruned + clean)

**Options.**
- **(A) Modify `e18-remeasure.mjs`** to call `voxelizeRouted`. *Rejected:* T-065 review names the E-18 spine
  read-only/frozen; mutating it destroys the intermediate "universal-thin" record the marginal-Δ table needs.
- **(B) Wire `voxelizeRouted` into the production `glb-voxel-build.mjs`.** *Rejected for this ticket:* that
  builder is not on the measured path (the benchmarks ARE the product this phase), and it would broaden the
  diff into reproducibility-sensitive frozen code for no AC. Flag as a future cleanup.
- **(C, chosen) New runner `benchmarks/sculpture/e19-build.mjs`** — a focused clone of `buildSubject` that
  swaps the one line `voxelizeGlbThin` → `voxelizeRouted(glbBytes,{subject,scale})` and writes to
  `e19-build/<subject>/`. Everything downstream (prune, palette, segment, render, score) is byte-for-byte the
  E-18 pipeline. **Rationale:** isolates the routing change, leaves every frozen surface untouched, matches the
  repo's one-runner-per-experiment pattern (T-065 notes the runners already duplicate `SUBJECTS`). The small
  duplication is the price of not mutating the frozen spine — accepted.

## Decision 2 — What is the "before" the table compares against

The ticket says "honest before/after vs **the busy E-18 builds** (`glb-voxel-seg/`, `e18-remeasure.json`)".
Two coherent framings:

- **Full-journey (chosen for the headline):** BEFORE = the **busy E-18 seg build** (`glb-voxel-seg/`),
  AFTER = E-19 (all three fixes). This shows the *whole* cleanup win (busy palette → flat, strays → gone,
  over-thick → routed) — what the epic was created to deliver. The busy build is **re-scored on the fixed
  metrics** (reconstruct occupancy from its committed `artifact.json`, score `speckleScore` + `strayVoxelStats`
  + distinct + off-pal vs `aug` + value ΔE), so before and after share one ruler. Form IoU "before" reads from
  its committed `summary.json` (`formIoUAfter`).
- **Marginal attribution (the "Δ each fix bought" requirement):** a second table reads the three landed
  records — stray Δ from T-063 (`e18-remeasure.json` `stray.before/after`), speckle/distinct/off-pal/valueΔE
  from T-064 (busy `glb-voxel-seg` → `e18` column), form-IoU/occupancy from T-065 (`form-routing.json`).
  Each fix's Δ comes from the ticket that made it — honest provenance, no re-derivation.

**Rejected:** BEFORE = current `e18-build` (prune+clean+thin). That isolates *only* routing and undersells the
consolidation; the ticket explicitly wants the busy baseline. Kept instead as the "intermediate" column so the
reader sees busy → (prune+clean) → routed.

So the table has three measured columns per subject: **busy (glb-voxel-seg)** → **intermediate (e18, universal
thin + prune + clean)** → **E-19 (routed + prune + clean)**, plus per-fix marginal Δ.

## Decision 3 — Before/after visuals

- **Use the committed `glb-voxel-seg/<subject>/render-3q.png` as BEFORE** (busy: moai duplicate masses, heart/
  koi speckle) — no regeneration, faithful to what shipped. **Use the fresh `e19-build/<subject>/render-3q.png`
  as AFTER.** Copy both to `pr/assets/frames/e19-<subject>-before.png` / `-after.png` for heart, moai, koi.
- **Rejected:** re-rendering a synthetic "busy" build by disabling the baked-in fixes. The fixes are not
  cleanly switchable (variance/keepFloor/gradient live inside `material-segment.mjs` with no off-flag), and
  the committed busy renders are the *actual* artifacts the epic reacted to — more honest than a reconstruction.

## Decision 4 — Pure/impure seam (so something is CI-tested)

Mirror `form-routing.mjs`: a **pure assembler** `src/form/e19-cleanup.mjs` owns all table math + md/json
rendering and is unit-tested; the runner owns GL + decode + file I/O.

- `assembleCleanup({busy, intermediate, e19, marginals, scale})` → `{md, json}`. Pure, deterministic, tolerant
  of a missing subject cell (emits `null`/`—`, never throws on a gap — same contract as `assembleRoutingReport`).
  Computes per-subject deltas (E-19 − busy) and averages; classifies each axis improved/held/regressed; renders
  the markdown table. Schema tag `e19-cleanup/v1`.
- The runner (`e19-build.mjs`) collects the three records, re-scores the busy build, builds + renders + scores
  E-19, calls `assembleCleanup`, writes `e19-cleanup.{md,json}`, and copies the before/after frames.

**Rationale:** the only genuinely new *logic* is the table assembly; making it pure means it gets a real test
under `npm test` while the GL sweep stays integration-only — exactly the discipline T-062…T-065 followed.

## Decision 5 — moai, honestly

Research flags that on the **plain** (routed-solid) moai occupancy the component split may differ from the thin
one, and that form IoU vs the corrupt moai GLB is not a quality signal. The design does **not** assume; the
runner measures the routed-solid moai's `strayVoxelStats` before/after pruning and its rendered IoU, and the
E-19 section reports stray/component as moai's honest signal with IoU annotated as reference-corrupt (citing
T-063's finding). If pruning the plain moai over-prunes or under-prunes vs minFraction 0.5, that is reported,
not tuned away (tuning the threshold is out of scope; the root fix is a single-view GLB regen — a separate ticket).

## Decision 6 — Scope boundaries

- **No new algorithm, no new metric** (all four exist). **No frozen-surface edits** (`e18-remeasure.*`,
  `glb-voxel-seg/`, voxelizers, `segmentMaterials`, `pruneStrays`).
- **Production `glb-voxel-build.mjs` routing wiring is deferred** (flagged in review as the follow-up).
- `package.json` gains an `e19:build` script. `design-learnings.md` + a `pr/assets/voxel-cleanup.md` handoff
  are written. The headline question is answered with the measured numbers, including where the answer is "not
  fully" (value ΔE, moai form).

## Risks

- **Live sweep fails mid-run** (GL/asset). Mitigation: per-subject try/skip with a noted gap (the assembler
  tolerates nulls); GL already proven working on a probe render.
- **Re-scoring the busy build needs `occupancyFromArtifact`** — it lives in the benchmark (`cleanliness-
  baseline.mjs`), not `src/`. Import it from there (presentation-only, YAGNI to lift) or inline a tiny copy in
  the runner. Chosen: import from `cleanliness-baseline.mjs` to avoid a third copy.
- **Determinism of value ΔE / IoU** across re-runs is fine (deterministic), but renders are PNGs — committed as
  binary, regenerated only by the live sweep.
