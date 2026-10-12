// STUB: builds nothing yet. Delete this line when the part is built (make.sh skips the roof step while shell is a stub).
/*
Eighteen shed roof bands via roofBand, each in the ROOFS table of plan.md with its rect and low side (RA union [0,0,35,8]+[9,8,26,11] low south; RB [9,18,26,21] low north; RC [9,12,14,17] low east; RD [21,12,26,17] low west; RE [0,9,8,20] low east; RF [27,9,35,20] low west; RG [0,22,12,25], RH [13,22,22,25], RI [23,22,35,25] low south; RJ-N [8,26,27,29] low south; RJ-S [8,38,27,41] low north; RJ-W [8,27,11,40] low east; RJ-E [24,27,27,40] low west; RK-W [0,28,7,39] low east; RK-E [28,28,35,39] low west; RL-T [11,42,24,46], RL-SW [0,42,10,46], RL-SE [25,42,35,46] low north). Palette RoofTile: bricks 3 : red_nether_bricks 2, eave bricks, ridge quartz_slab, verge quartz_block. Run roof --dry-run first; no --no-contrast or pitch bypass without --why. Leave the compluvium void (x15..20, z12..17, y6..9) open. Pediment (pediment helper): quartz_stairs at y6 x16..19 and y7 x17..18 over the pocket. Ticks E06 E18 E02 (pediment) E27.

2. **roofs** (module `parts/roofs.mjs`). Every ROOFS band with `roofBand`, palette RoofTile, `--dry-run` first. The compluvium void stays open. Pediment at the fauces. Scope: rects and low sides from ROOFS; pediment; no other blocks above y5. Ticks: E06, E18, E02 (pediment), E27.
*/

export function build(g) {}
