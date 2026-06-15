# T-069-01 — surgical-refine-to-standard · Design

Decide HOW to push the high-res building to a Strong+ verdict via the E-15 loop with the GLB form target,
and how to record the trajectory + the honest outcome. Grounded in the research; one approach chosen.

## The decision in one line

**Mirror the T-068-01 split exactly**: a new PURE core `src/form/surgical-standard.mjs` (the verdict/IoU
trajectory analysis, the P14-safety check, the Strong+-vs-topping-out decision, the report assembler — all
unit-tested, in `npm test`) + a new IMPURE runner `benchmarks/sculpture/surgical-standard.mjs` that wires the
EXISTING `reviseLoop` + `glbFormTarget` + `judgeRender` over the building and emits the artifacts. **No
change to `reviseLoop`, `glbFormTarget`, the editors, or the judge** — the seam invariant proven in E-16
means this ticket is composition, not surgery.

## Options considered

### A. One pure analyzer + one impure runner, reuse `reviseLoop`/`glbFormTarget`/`judgeRender` verbatim ✅ CHOSEN

- The runner runs the loop in **bounded ROUNDS**. Each round = one `reviseLoop` pass over the still-unlocked
  detail regions, scored by `glbFormTarget`; then judge the **whole-build render** once (median samples) →
  one trajectory point. Accepted regions are removed from the next round's region list (P14 across rounds,
  honestly: an accepted region is never revisited). Stop when **Strong+ reached**, a round accepts nothing
  (**dry** — procedural is deterministic so it can't improve on a retry; the LLM route may), or `--rounds`
  exhausted.
- The PURE core consumes the per-round cells + the merged loop trace and computes: the verdict trajectory,
  the form-IoU trajectory, the P14-safety verdict, and the outcome (`reachedStandard@round` OR
  `toppingOut{bestVerdict, unfixedDetail}`), then renders `{md, json}`.
- **Why chosen:** it is the literal house pattern (building-build, glb-formtarget-ab). Reuses every proven
  seam → minimal new surface, maximal `npm test` coverage of the only new logic (the analysis/decision). The
  AC's four bullets map 1:1 onto the runner's records + the pure core's outputs. P14-safety is the loop's
  structural property; the pure core *verifies* it rather than trusting it.

### B. Judge after every accepted region (per-region verdict trajectory)

- Rejected. A 57k-block whole render + 3-sample claude -p judge **per accepted region** is cost-prohibitive
  and the project is explicitly cost-conscious (memories: scale studies are not cheap; metered judge). The
  per-region **form-IoU** trajectory is already free from the loop trace; the **judge** trajectory is the
  expensive signal, so sample it per ROUND (a full pass), not per region. A round is the natural verdict unit.

### C. Procedural-only refinement (no LLM editor)

- Rejected. The AC names window reveals, cornices, roof edges — these are **form/line** defects, exactly the
  class E-15 built the LLM block-editor for (relief/material procedural passes do depth/skin, not form). A
  procedural-only loop would roll back nearly everything (E-15 measured this) and could not honestly attempt
  Strong. The design keeps **both** routes behind the gate (`makeFormEditor`'s router) so procedural handles
  relief and the LLM handles line — the loop cannot tell them apart, and the trace records which fired.

### D. Add a categorical-judge accept-gate inside the loop

- Rejected. The loop's accept-gate must stay the **deterministic form-IoU compare** (a hill-climb cannot
  tolerate a non-deterministic gate — the explicit E-15/T-073 lesson recorded in `concept-materials-ab.mjs`).
  The categorical judge is the **outer measurement** of where quality tops out, NOT the inner gate. Mixing
  them would make P14-safety unprovable and the trajectory noisy. Judge measures; IoU gates.

## Chosen design — details

### Regions (the AC's named details)

Address the fine-detail zones with **scale-robust `where` slabs** (default), bbox-overridable:
- `{ where: "top", fraction: 0.22 }` — the **roof edges / ridge / cornice** (the gable crown).
- `{ where: "front", fraction: 0.30 }` — the **gable face + arch voussoir ring** (the entry identity).
- `{ where: "left", fraction: 0.28 }` and `{ where: "right", fraction: 0.28 }` — the **side window
  reveals** (the 1×3 slit windows; thin → the known weak-IoU zone, recorded honestly).

`where` slabs are chosen over absolute bbox so the region list survives a re-voxelize at a different scale
(the bounds come from `artifactBounds(refined)`); a `--regions` JSON override is accepted for tuning.

### The critic / editor wiring

`makeFormEditor({ critic })` with a critic that **routes each region to the LLM form route** (`curve`/
`detail`) for line defects, mirroring `glb-formtarget-ab.mjs:107`. Procedural relief stays available for any
region the critic tags `relief`. The model SEES the R-framed crop (`observe: observeRegion`) + proposes a
bounded op-list; the gate keeps it only if the GLB per-region IoU strictly improves. Budget per round:
`{ maxIterations: regions·perRegion, perRegion: 2 }` — small, bounded.

### What gets recorded (AC#2 — per-round)

1. **Judge verdict trajectory** — baseline (round 0, pre-edit) + one verdict per round: `{ round, overall,
   proportion, color, detail, fidelity, perSample, wholeIoU }`.
2. **Per-region edit trace** — the merged loop trace across rounds: `{ region, route, procedural|llm, tweak,
   scoreBefore, scoreAfter, accepted, reason }` (route∈relief/material→procedural, else→llm).
3. **Form-IoU trajectory** — per-region before→after from the trace + the whole-object before→after per round.
4. **P14-safety** — the pure `checkP14(trace)`: every accepted subBounds disjoint from every other edit's
   subBounds (no accepted region later altered) AND every non-accepted attempt has `after ≤ before+eps`
   (rolled back). Emits `{ safe, violations }`.

### The honest outcome (AC#3)

The pure `assessOutcome({ trajectory, trace, bar:"strong" })`:
- **reachedStandard** — first round whose `overall` rank ≥ strong → `{ reached:true, atRound, verdict }`.
- else **toppingOut** — `{ reached:false, bestVerdict, atRound, unfixedDetail }` where `unfixedDetail` names
  the region with the **lowest final per-region IoU among rolled-back regions** (the specific detail the loop
  could not fix — e.g. "side window reveals: IoU 0.41, 0/2 edits kept"). This is a **result, not a failure**;
  the report states it plainly (E-20's purpose is to find where quality tops out).

### Deliverables (AC#3/#4)

- `benchmarks/sculpture/surgical-standard.{json,md}` — the trajectory + outcome report.
- `benchmarks/sculpture/building/refined/artifact.json` — the final refined AJV-valid `DesignArtifact`
  (the loop output; committed like `building/best/`). `pr/assets/frames/building-refined.png` — its render.
- `building/round-*/summary.json` — per-round metrics (lightweight; feeds `--offline`).
- `npm test` green via `src/form/surgical-standard.test.mjs` (the only new reviewable logic).

### Failure / degeneracy handling (pure, null-tolerant — building-build idiom)

- No rounds ran / assets absent → the report says so (placeholder), no throw.
- A judge sample that fails parse → that round's verdict is `unknown` (ranks below weak; never crashes the
  trajectory). A null per-region IoU → ranks last in the topping-out pick.
- The loop rolling back **every** edit is a valid outcome (the cage held; build unchanged) → outcome =
  topping-out at the baseline verdict, recorded honestly.

## Why this is correct, not just convenient

The AC is fundamentally a **measurement** task ("find where quality tops out — measure and explain"). The
risk is a non-deterministic, unreviewable blob. The split quarantines all non-determinism (GL + model) in the
runner and makes the **decision logic** (what counts as Strong+, what the topping-out detail is, whether P14
held) pure, deterministic, and unit-tested — the same discipline T-068-01 used, and the same seam invariant
E-16 proved. Nothing in the loop, the form target, or the judge changes.
