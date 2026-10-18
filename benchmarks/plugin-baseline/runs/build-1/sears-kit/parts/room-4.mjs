// Room "P0 kitchen" (interior designer's part): the box x10..12, y2..4, z19..20 (plan.md P0 kitchen).
// Nothing is placed here yet. The shell fills the interior with air and runParts locks every cell it touched (air
// included), so each fit-out write below was refused ("had: air"). Intended layout, to lay once an interior part
// may write:
//   y2 z19: smoker (10,2,19) facing south, lit; furnace (12,2,19) facing south, lit; (11,2,19) stays clear
//   y2 z20: crafting_table (12,2,20)
//   y3 z20: potted_poppy (12,3,20), on the table
//   y4 z20: lantern hanging (11,4,20), needs a solid block at y5 above it
// The lane (10,20) -> (11,20) -> back door, and (11,19) -> (11,20), stays clear.
// The lamplighter's light, to restore once the shell leaves this kitchen unlocked (runParts refuses it now, "had: air"):
// import { porchLantern } from "../vocab.mjs";
// porchLantern(g, { x: 11, y: 4, z: 20 });   // lantern over the lane, under the solid dark oak ceiling at y5

export function build() {}
