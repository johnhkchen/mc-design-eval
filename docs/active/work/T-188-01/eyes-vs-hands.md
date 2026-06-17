# T-188-01 — EYES-vs-HANDS INVENTORY (the discovery, read from the real run)

The first sustained **picture-driven climb** on the gatehouse. Gradient = the E-47 picture-anchored
`DiagnoseBuild` critique (4 azimuths, VOTES=3 median `styleFidelityScore`); accept-gate = `acceptsRound`;
restraint = `stoppingDecision`; hands = the three existing occ-tools. Run: `node
experiments/eval-alignment/picture-climb.mjs` → `trajectory.json` + `round-{0..4}-beside.png` (the glance).

## The trajectory (scores are VOTES=3 medians; votes shown to expose the noise)

| round | tool | build score | candidate votes | gate | what the critique still named |
|---|---|---|---|---|---|
| 0 (seed) | — | **0** | — | — | WALL·replace, ROOF·replace, OPENING·replace + 2 (ragged roofless box) |
| 1 | construct_walls | 0 → **0** | 0/8/0 | **KEPT** (tie: coverage shrank) | WALL·replace, ROOF·replace, OPENING·replace |
| 2 | apply_gable_roof | 0 → **52** | 48/60/52 | **KEPT** (+52) | WALL·replace, OPENING·add×2, ROOF·replace |
| 3 | apply_gable_roof | 52 → **60** | 68/60/60 | KEPT (+8) | **ROOF·replace·major**, ROOF·add·minor, WALL·add·minor |
| 4 | apply_gable_roof | 60 → 60 | 68/60/**0** | **ROLLED BACK** (tie: no shrink) | ROOF·replace·major, ROOF·add·minor |
| — | done | **60** | — | agent: "dark roof value + eave banding — no tool addresses them" |

**Trend 0 → 0 → 0 → 52 → 60 → 60.** Stop: **agent-done**. The glance confirms a real climb: round-0 is a
ragged roofless box; round-1 is grey stone walls with quoins (still a stepped top); **round-2 is a
recognizable gabled gatehouse** — the gable is the lever (+52). Rounds 2/3/4 beside-sheets are
**byte-identical** (the gable is idempotent).

## Did it climb, stall, or oscillate? — CLIMBED (with two honest caveats)

- **CLIMBED.** Real movement ≈ **0 → 52**, driven entirely by `apply_gable_roof` replacing the stepped
  pyramid with a two-slope gable. The glance agrees (round-2 reads as the concept's building class where
  round-0/1 did not). This is the first time a build *moved* under the picture critique, not the ruler.
- **Caveat 1 — the reported +60 includes ~+8 of NOISE.** Round 3 re-applied the gable to a build that
  already had it (byte-identical render) yet the median read 52→60 and the gate accepted it (+8 > margin
  4). The "climb" from 52→60 is vote noise on an unchanged build, not construction. Honest net: **~+52**.
- **Caveat 2 — `oscillated=true` is a heuristic false-positive.** The flag fires because
  `apply_gable_roof` was accepted (r2,r3) then rolled back (r4). Reading the trajectory, the loop
  **converged** — r4's rollback is the gate correctly refusing a no-op, not a back-and-forth between
  states. The convergence is real; the flag over-reports.

**How much was actionable?** `actionableFrac = 0.75` (3 of 4 tool-applications kept). The gate did its job
twice over: it **kept** the walls round the scalar scored flat (0→0) on the coverage tie-break, and it
**rolled back** the no-op gable. Without the C3 coverage tie-break, a scalar-only gate (C1) would have
discarded the walls (no score gain) and the climb might never have reached the gable.

## HANDS (named → acted-on, score moved toward the concept)

- **ROOF (form)** ← `apply_gable_roof`, rounds 2–3, Δ +52 then +8(noise). The stepped pyramid → gable.
  **This is the load-bearing hand for this subject.**
- **WALL / OPENING** ← `construct_walls`, round 1, Δ 0 (scalar) but **coverage shrank** (wrongStyleBreadth
  fell) — kept on the tie-break. The walls *are* built (round-1 glance: grey stone + quoins), but the
  roof-form cap pinned the scalar at 0 until the gable lifted it.

## EYES-ONLY (named, NO lever) — the discovered S-189 scope

`classifyInventory`'s department-level read returns **eyesOnly = (none)** — every named department
(ROOF/WALL/OPENING) was touched by some kept tool. **But that granularity hides the real gap.** Reading
the items, the genuine eyes-but-no-hands findings are **SUB-DEPARTMENT**:

1. **ROOF *material/value* — named every round through the last, never actionable.** After the gable was
   built and kept, the critique kept tagging **ROOF·replace·major**: the roof reads *brown spruce* where
   the concept shows a *near-black / grey-stone* roof. `apply_gable_roof` hard-codes `spruce_planks`, so
   it can fix the roof FORM but cannot touch the roof MATERIAL. The agent named this precisely at the stop
   ("dark roof value … no tool addresses it") and chose `done`. **This is the missing hand** — a
   roof-recolor that rebuilds the gable in the concept-true material. (The sibling story S-189 / T-189-01
   is already building exactly this: `recolor_roof` via a program↔material-map reconcile.)
2. **OPENING — the arched gate / shuttered reveals.** `construct_walls` dresses openings incidentally via
   the skin, but there is **no standalone hand** to build the concept's framed arched gate; round-2's
   glance shows a hollow base, not a gate. Named (OPENING·add×2 in round 2), never resolved.
3. **ROOF·add·minor (eave/ridge banding)** and **WALL·add·minor** — sub-tool-amplitude trim the fixed
   tools don't lay. Named, below the hands' resolution.
4. **The base/ground floor.** The build floats above the ground plane (round-1/2 glances); no tool seats
   it. The critique folds this into WALL but no hand addresses the missing ground storey.

## The instrument findings (for the ruler, separate from the build)

- **The picture critique steers at a finer grain (form vs material) than the hands or the inventory
  resolve.** ROOF·replace persisting after the gable proves the critique *can* name the material gap; the
  department-level inventory can't see it. The eyes-vs-hands record needs **sub-department (form/material/
  feature)** granularity to surface gap #1 automatically — a refinement of `classifyInventory`.
- **The scalar is cap-dominated and noisy.** A wrong roof FORM caps the whole score at 0 regardless of
  wall progress (rounds 0–1); and a no-op round drew a +8 median swing (round 3). The **coverage
  tie-break** (C3) was load-bearing for keeping real progress the scalar couldn't see; the **median + a
  small margin** caught most but not all noise. Both are validated; the residual noise is real.
- **The restraint rule converged correctly** (rolled back the no-op, honored agent-done after minRounds),
  but `oscillated`'s same-tool-accept-then-reject heuristic mislabels idempotent no-ops as oscillation.

## Verdict

The loop has **eyes and one strong hand**: it sees the picture and can fix roof *form* and wall
*structure*, and it climbed a roofless box into a recognizable gabled gatehouse (~+52, glance-agreed). It
**named, but could not fix**, the roof *material/value*, the arched gate, the base, and fine trim — the
eyes-but-no-hands set. The single highest-leverage missing hand is **roof recolor** (the gap the agent hit
the wall on and stopped at), which S-189 is already building. No speculative fix list beyond what the run
surfaced.
