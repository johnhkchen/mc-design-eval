# T-066-01 — Review

Terminal E-19 ticket. Rebuilds all 7 sculpture subjects with the three E-19 fixes composed
(stray pruning T-063 + clean materials T-064 + thin routing T-065), measured against the busy
E-18 seg build on the fixed T-062 cleanliness metrics, and answers the epic's headline:
**is the GLB-voxel colour now as clean as text→JSON?**

## What changed

### Created
- `src/form/e19-cleanup.mjs` — pure consolidation-report assembler (`assembleCleanup`, `cleanupRow`,
  marginal-Δ attribution). No I/O, no rendering — takes scored rows, emits the before/after table +
  Δ block + headline verdict. Keeps the runner thin and the logic unit-testable.
- `src/form/e19-cleanup.test.mjs` — 11 unit tests (row math, speckle delta, largest-fraction gating,
  headline `cleanAsTextJson` predicate, marginal attribution strings).
- `benchmarks/sculpture/e19-build.mjs` — live sweep runner: routed+pruned+clean clone of
  `e18-remeasure`'s scaffolding, re-scores the busy seg build via `occupancyFromArtifact`, applies the
  prune gate, copies before/after frames. Wired as `npm run e19:build`.
- `benchmarks/sculpture/e19-cleanup.{md,json}` — the before/after deliverable (busy→intermediate→E-19,
  per subject, all required axes + marginal Δ).
- `benchmarks/sculpture/e19-build/<subject>/` — 7 rebuilt + rendered + scored builds.
- `pr/assets/voxel-cleanup.md` — E-12 handoff.
- `pr/assets/frames/e19-{moai,heart,koi}-{before,after}.png` — before/after composites on the worst cases.

### Modified
- `package.json` — `e19:build` script.
- `docs/knowledge/design-learnings.md` — **Voxel cleanup (E-19)** section: backlog closed by number
  (T-062/063/064/065), the headline answer, the two honest caveats, the consolidation finding, the net.

### Not touched (deliberate)
- `pruneStrays` / `e18-remeasure` left frozen. The prune gate lives **in the E-19 runner**
  (`PRUNE_GATE_FRACTION = 0.9`), not in the shared module — so E-18 behaviour is unchanged (and the gate
  would be a no-op there anyway: e18's only sub-0.9 build is moai at 0.519).

## Acceptance criteria

| AC | status | evidence |
|----|--------|----------|
| All 7 rebuilt (pruned + clean + routed), renders saved | ✅ | `benchmarks/sculpture/e19-build/<subject>/` ×7 |
| Before/after table vs E-18 (all axes + marginal Δ) | ✅ | `e19-cleanup.{md,json}`: form IoU, speckle, largest-frac, stray, distinct, off-pal, value ΔE, busy→inter→E-19 |
| Before/after visuals on worst cases (moai/heart/koi) | ✅ | `pr/assets/frames/e19-{moai,heart,koi}-{before,after}.png` |
| design-learnings E-19 section (backlog by number + headline) | ✅ | "Voxel cleanup (E-19)" section, each item marked closed |
| E-12 handoff + `npm test` green | ✅ | `pr/assets/voxel-cleanup.md`; **676/676 pass** |

## Result summary

- **off-palette → 0 on all 7** (busy avg 1149; moai 887 / heart 1174 / mushroom 5981 → 0). The headline:
  the build now snaps *within* the augmented design-doc palette, exactly like text→JSON — busy textured
  blocks (`coral_brain`, `mycelium`, `nether_quartz_ore`) gone from every manifest.
- **moai strays gone** (2023 → 0, largest-frac 0.52 → 1.0, components 6 → 1) — the stray-geometry headline.
- **speckle ≤ 0.045 on all 7** (avg 0.024 < the 0.05 clean bar).
- **form IoU held** (busy avg 0.763 → E-19 0.761); routing recovered the universal-thin solid regressions
  (dancing-man 0.814→0.914, mushroom 0.929→0.98).
- **Headline answer: yes on colour cleanliness** — 0 off-palette ×7 AND avg speckle ≤ 0.05.

## Test coverage

- `src/form/e19-cleanup.test.mjs` (11 tests) covers the pure assembler: row construction, the three-state
  delta math, the `largestFraction < 0.9` prune-gate predicate, the `cleanAsTextJson` headline rule, and
  the marginal-attribution strings. Full suite **676/676 green**.
- **Gap (acknowledged):** `e19-build.mjs` itself — the live sweep runner — is not unit-tested. It is a
  thin I/O + render orchestration clone of the already-exercised `e18-remeasure` scaffolding; its pure
  decision logic (gating, attribution) was extracted into the tested `e19-cleanup.mjs` precisely so the
  untested surface is only glue. Verified by the live ×7 run, not by automated test.

## Deviation from plan

One material deviation, fully documented in `progress.md` and `design-learnings.md`: the plan said
"compose the three fixes as-is", but the first live sweep surfaced a real **routing × prune interaction**
— pineapple form IoU fell 0.907 → 0.811. Root cause: under routing, solids go to plain `voxelizeGlb`,
pineapple's crown tips disconnect into 11 tiny components (45 cells, 1.3% of cells, silhouette-load-bearing),
and `pruneStrays`' relative floor (tuned for moai's gross duplicate masses) clipped them. Fix: a
`PRUNE_GATE_FRACTION = 0.9` gate — prune only a real multi-mass hallucination (moai, frac 0.52); near-single-mass
solids keep incidental specks. Pineapple recovered to 0.907; moai keeps its full stray fix. This is itself a
consolidation finding (a prune calibrated for one form clips legitimate detached detail on another) and is
recorded as a reusable lesson.

## Open concerns / known limitations

1. **value ΔE rose** (avg 7.19 → 9.81; moai 14.05, koi 17.55). This is the design-doc-palette **discipline
   cost** / ablation tautology — the busy build's value ΔE is low *because* it snapped to the GLB texture it
   is scored against. text→JSON pays the identical price. Reported as a cost, explicitly **excluded** from the
   colour-cleanliness verdict. No action needed; it is a property of having a fixed palette.
2. **moai is geometrically clean but not a clean moai.** Pruning drops the two fully-detached masses, but the
   kept largest component is itself a tangle of partial statues the bridge bars hold together — **the moai GLB
   is the hallucination** (TRELLIS reconstructed 3 statues from a 3-view contact sheet). moai's form IoU falls
   vs its own corrupt reference (0.565 → 0.416); stray/component is moai's honest signal, not IoU. The real fix
   is upstream — regenerate the GLB from a single-view concept — a **separate ticket**; pruning is the no-op
   safety net once that lands.
3. **Prune gate is heuristic.** `0.9` cleanly separates the current 7 (moai 0.52 vs next-lowest koi 0.976),
   but it is a single threshold tuned on one corpus; a future hallucination with frac in (0.9, 0.976) would
   slip through. Acceptable for the terminal E-19 build; flagged for any later voxelizer work.

## For the human reviewer

The substantive judgement call is the **prune gate** (deviation above): it changes the composed behaviour
from the plan and lives in the runner, not the shared module. The two caveats (value ΔE tautology, moai's
corrupt GLB) are honest residue with named upstream fixes, not unfinished work — the epic's backlog is closed.
The headline verdict is deliberately scoped to *colour cleanliness* (off-palette + speckle), with value ΔE
held out as a separate, tautological axis — confirm that framing is acceptable.
