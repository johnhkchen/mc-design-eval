# Concept material-correction loop — the E-21 refine pass (T-073-01)

The E-15 surgical `reviseLoop` run on the **T-072 feature-assigned gatehouse** with
`conceptMaterialTarget({conceptPath})` — the deterministic concept colour-agreement metric — and the
**swap-only material editor**. The loop body / observe / diagnose router / accept-gate are unchanged;
only the target (concept material, not form) and the editor (recolor, not shape) are new. The LLM sees
the build render + the concept and proposes recolor corrections; each is applied under the region-lock
+ the palette policy + AJV and kept only if the per-region concept colour agreement improved.

## gatehouse-probe
- whole-object concept colour agreement: **0.628 → 0.645**  verdict: **improved**
- regions kept/rolled-back: **1/1**  P14: **ok** (locked: 1)
- manifest before: `["minecraft:cobblestone","minecraft:dark_oak_log","minecraft:dark_oak_planks","minecraft:stone_bricks"]`
- manifest after: `["minecraft:cobblestone","minecraft:dark_oak_log","minecraft:dark_oak_planks","minecraft:deepslate_tiles","minecraft:stone_bricks"]`
- concept-justified additions (AC#2): `[]`

| # | region | defect | region agreement before→after | kept? | reason |
|---|--------|--------|:-----------------------------:|:-----:|--------|
| 0 | `{"min":[-13,16,-13],"max":[13,31,13]}` | roof/gable material zoning vs the concept | 0.621→0.641 | ✓ | accepted |
| 1 | `{"min":[-13,0,-13],"max":[13,15,13]}` | wall/corner/base material zoning vs the concept | 0.686→0.686 | ✗ | rolled-back |

- **improved** — a region cleared the per-region accept-gate AND the whole-object concept colour agreement rose — the local material clean transferred to the whole
- **held** — no region beat its per-region material target — the cage kept the build's materials unchanged (no regression; the materials already agreed, or the gate rolled back every proposal)
- **regressed** — a region cleared the per-region accept-gate but the whole-object agreement FELL — a real divergence: the local per-region recolor did not transfer to the whole-object colour distribution. NOT a gate bug (P14 holds); a limit of the per-region single-view agreement signal as a hill-climb metric
- **unknown** — missing a before or after score

- LLM proposals: `[{"region":"-13,16,-13|13,31,13","proposedRemaps":1,"proposedSwaps":0,"proposedAdditions":0,"applied":1,"acceptedAdditions":0,"rejected":[],"stashed":true},{"region":"-13,0,-13|13,15,13","proposedRemaps":0,"proposedSwaps":0,"proposedAdditions":0,"applied":0,"acceptedAdditions":0,"rejected":[],"stashed":false}]`
