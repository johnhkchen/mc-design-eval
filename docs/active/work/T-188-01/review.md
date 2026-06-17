# T-188-01 — REVIEW: wire the picture-critique climb, discover where it stalls

**Story S-188 / epic E-48 (M2 rung — the loop self-revising toward a picture).** This ticket wired the
E-47 picture-anchored `DiagnoseBuild` (the creation-loop critique, NOT the frozen instrument) as a
workshop-loop gradient on the gatehouse — render → critique → pick → apply → re-render — added the two
missing pieces (an accept-gate and a restraint/stopping rule), ran the climb, and produced the honest
**eyes-vs-hands inventory**. It is a **discovery** ticket: it finds the missing hands, it does not build
them (that is S-189).

## What changed

| path | change |
|---|---|
| `src/workshop/climb-gate.mjs` | **new (pure, in `npm test`)** — `acceptsRound` (C3 accept-gate: median-score improvement past a margin, coverage tie-break, else roll back), `stoppingDecision` (D2 restraint: agent-done / stall-K / round cap, never before `minRounds`), `classifyInventory` (run-derived eyes-vs-hands + climb/stall/oscillate verdict), `TOOL_DEPARTMENTS`, `CLIMB_DEFAULTS`. |
| `src/workshop/climb-gate.test.mjs` | **new** — CG1–CG9, pure unit tests for the gate/restraint/classifier. |
| `experiments/eval-alignment/picture-climb.mjs` | **new (metered runner, NOT in `npm test`)** — forks `autonomy-loop.mjs`; swaps the defect-dominated single-view eval for the multi-azimuth picture-anchored `DiagnoseBuild` term (VOTES=3 median `styleFidelityScore`); wires the accept-gate + restraint; reuses the three occ-tools verbatim. `GUARD_ONLY=1` dry-proof. |
| `docs/active/work/T-188-01/trajectory.json` | **new (generated)** — the per-round critique trend + the `classifyInventory` output. |
| `docs/active/work/T-188-01/round-{0..4}-beside.png` | **new (generated)** — the per-round beside-concept glance evidence. |
| `docs/active/work/T-188-01/eyes-vs-hands.md` + RDSPI artifacts | **new** — the inventory + the honest verdict, and research/design/structure/plan. |

**No existing production source was modified by this ticket.** `autonomy-loop.mjs` and
`results/autonomy-gatehouse.json` (the E-38 defect-dominated baseline) are untouched — the new runner is a
fork. The frozen instrument (`measurements/`) is untouched (`git status` clean of it). `builds/` is
gitignored (drafts), so the per-round renders are preserved as durable evidence by copying the beside
sheets into the work dir.

⚠️ **Concurrency note for the reviewer:** the sibling ticket **T-189-01 (S-189)** — which builds the
missing roof-material hand this discovery identified — landed two commits (`1eab339`, `f01565b`) that
**add to the shared files** `climb-gate.mjs` (a `recolor_roof` entry in `TOOL_DEPARTMENTS`) and
`picture-climb.mjs` (a `recolor_roof` hand + `ROOF_MATERIAL_PROBE` + `roof-material`/`material-map`
imports). Those additions are **T-189-01's**, committed under its ID, and are additive to the T-188-01
base (`1a6b974`). Reading the current file shows both tickets' work; the T-188-01 contribution is the
pre-`recolor_roof` core. `npm test` is green across both (2319/2319).

## The result (read honestly from the run)

**Trend `0 → 0 → 0 → 52 → 60 → 60`, stop: agent-done.** It **climbed** — a roofless ragged box became a
recognizable gabled gatehouse (glance-agreed: `round-2-beside.png`), driven by `apply_gable_roof` (+52).
Two honest caveats, both in `eyes-vs-hands.md`:
- **~+8 of the reported +60 is vote noise** — round 3 re-applied the gable to a byte-identical build and
  the median read 52→60; the gate accepted it (> margin 4). Real net ≈ **+52**.
- **`oscillated=true` is a heuristic false-positive** — the loop converged; the flag mislabels the
  idempotent no-op (accept r2/r3, roll back r4) as oscillation.

**The eyes-vs-hands discovery (the deliverable):** the loop has **eyes + one strong hand** (roof FORM via
the gable, wall STRUCTURE via construct_walls). It **named, but had no lever for**: the **roof
MATERIAL/value** (the critique kept tagging `ROOF·replace·major` after the gable — brown spruce vs the
concept's near-black stone; `apply_gable_roof` hard-codes `spruce_planks`), the **arched gate**, the
**base/ground storey**, and **fine eave/ridge trim**. The agent hit this wall and chose `done`, naming the
dark roof value as unaddressable. **The single highest-leverage missing hand is roof recolor** — exactly
what S-189 / T-189-01 is now building.

## Acceptance criteria

- ✅ **Picture-reading critique wired as the climb gradient with an accept-gate + restraint; ≥3 rounds
  run.** 5 rounds run on the gatehouse; gradient = `DiagnoseBuild` (4 azimuths, VOTES=3 median);
  accept-gate = `acceptsRound`; restraint = `stoppingDecision` (stopped on agent-done after the gable
  converged).
- ✅ **Per-round beside-concept renders + the picture-critique trend, saved to the work dir.**
  `round-{0..4}-beside.png` + `trajectory.json` (scores, votes, items, gate decisions per round).
- ✅ **The eyes-vs-hands inventory.** `eyes-vs-hands.md` + `trajectory.json.inventory`: acted-on (ROOF
  form, WALL/OPENING) vs named-no-lever (roof material, arched gate, base, trim). The discovered S-189
  scope, no speculative fix list.
- ✅ **Recorded honestly: climb / stall / oscillate, how much actionable.** Climbed (~+52 real, +8 noise);
  converged (not oscillating, despite the flag); `actionableFrac = 0.75`.
- ✅ **`npm test` green; frozen instrument untouched; no new construction hands.** 2319/2319; `measurements/`
  untouched; the three occ-tools reused verbatim (the `recolor_roof` hand is T-189-01's, not this ticket).

## Test coverage

9 new pure unit tests (CG1–CG9), all green, fast (no GL/LLM):
- **acceptsRound (CG1–CG3):** improve-past-margin accept; regress reject; within-margin tie broken by
  coverage shrink (breadth or majors), else reject.
- **stoppingDecision (CG4–CG5):** `minRounds` floor (no stop before round 3 even on agent-done); stop on
  agent-done / stall-K / round cap.
- **classifyInventory (CG6–CG9):** acted-on vs eyes-only separation; oscillation flag on accept-then-
  rollback; stalled verdict + purity (no input mutation); empty-trajectory loud failure.

**Gaps (named):**
- The **runner is not in `npm test`** (GL + metered, like every `experiments/` sibling). It is verified by
  the `GUARD_ONLY=1` dry-proof (assets + GL + render seam + occ round-trip, zero spend) and the real
  5-round run. Reproduce: `node experiments/eval-alignment/picture-climb.mjs`.
- The **vote noise is not unit-testable** (it lives in the live judge). The run *exposes* it (the per-round
  vote triples in `trajectory.json`); the median + margin tame most of it; the +8 no-op accept is the
  residual, reported not hidden.
- `classifyInventory` is tested at **department** granularity; the **sub-department** (form vs material)
  gap that the run surfaced (persistent `ROOF·replace`) is not yet a classifier feature — see below.

## Open concerns / limitations (for the human reviewer + S-189)

1. **The inventory's department granularity hides the real gap.** ROOF counts "acted-on" because the gable
   touched it, so `eyesOnly` returns `(none)` — yet the run's true eyes-but-no-hands finding is the
   roof *material* (a persistent `ROOF·replace·major` after the form was fixed). A reviewer should read
   `eyes-vs-hands.md`, not just `inventory.eyesOnly`. Refining `classifyInventory` to form/material/feature
   sub-departments is a natural follow-on (it would auto-surface the roof-material gap).
2. **Residual vote noise slips the gate.** A +8 median swing on a byte-identical build was accepted (round
   3). The margin (4) + median is right in shape but the noise floor for this judge is ~one swing-unit
   above it. Options for S-189/S-190: raise VOTES, raise the margin, or gate on a build-hash no-op guard
   (don't re-score an identical occupancy). Not changed here (a discovery ticket reports the calibration,
   it doesn't re-tune the instrument).
3. **The `oscillated` heuristic mislabels idempotent no-ops.** Same-tool accept-then-reject ≠ oscillation
   when the tool is idempotent. A truer signal would compare build hashes, not tool identity.
4. **The scalar is cap-dominated.** A wrong roof FORM pinned the whole score at 0 through rounds 0–1,
   blind to real wall progress; only the **C3 coverage tie-break** kept the walls round. This is a design
   win (C1 scalar-only would have stalled the climb) but also a caution: the picture scalar is a coarse
   gradient, and the climb leaned on the qualitative coverage read to make progress visible.
5. **The convergence was shallow** — one strong hand (the gable) carried the whole climb; the other two
   tools contributed structure the scalar couldn't reward and detail it couldn't reach. The climb stalled
   exactly where the hands run out (roof material, gate, base) — which is the *intended* discovery, and
   the precise input S-189 needs.

## Handoff

Read `eyes-vs-hands.md` (the discovery) beside `round-{0,1,2}-beside.png` (the glance: box → walls →
gabled gatehouse). The engine split is `src/workshop/climb-gate.mjs` (pure decisions, 9 tests) +
`experiments/eval-alignment/picture-climb.mjs` (the metered runner). Reproduce with `GUARD_ONLY=1 node
…/picture-climb.mjs` (free) then the bare command (metered, ~5 rounds × VOTES=3 strong-tier diagnoses).
The single open build gap — roof recolor — is already in flight as S-189 / T-189-01 (which also explains
the `recolor_roof` additions now visible in the shared files). Nothing here touches the frozen instrument.
