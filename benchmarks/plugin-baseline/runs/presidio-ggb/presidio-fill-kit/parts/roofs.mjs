// Roofs: plot 0's roof is roof.json (laid by runParts after the shell). Here: the main roofs of plots 1, 2, 4, 5, 6
// (reroof, one spec per plot, footprint and keep boxes from plan.md ROOFS), and the hand roofs of plots 1, 3, 6
// (mission_parapet, door hoods, pyramid_cap, dormers). Each step is guarded: a failure is named, the rest still lays.
import { reroof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/roofs.mjs";
import { mission_parapet, door_hood, pyramid_cap, dormer } from "../vocab.mjs";

// Materials are explicit mixes of palette.json blocks (the roof tool's named palettes reach for blocks the kit lacks).
const RED_TILE = { mix: [["granite", 55], ["polished_granite", 25], ["bricks", 20]], eave: "granite", ridge: "polished_granite", verge: "smooth_quartz" };
const SLATE = { mix: [["deepslate_tiles", 100]], eave: "deepslate_tiles", ridge: "polished_andesite", verge: "smooth_quartz" };
const DARK_SLATE = { mix: [["deepslate_tiles", 100]], eave: "deepslate_tiles", ridge: "smooth_quartz", verge: "smooth_quartz" };

// plan.md ROOFS, one entry per plot. footprint = x0,z0,x1,z1 of the body; overhang 1 runs it out to the eaves.
// Each keep also holds the neighbour's roof cells that reroof's 3-cell margin would otherwise try to strip (refused anyway).
const MAIN = [
  { plot: 1, name: "duplex hip", spec: { style: "hip", pitch: 0.5, material: RED_TILE, footprint: [9, 1, 16, 8], overhang: 0, y: 6,
      keep: [{ from: [11, 6, 9], to: [14, 8, 9] }, { from: [6, 5, 0], to: [7, 9, 9] }] } },
  { plot: 2, name: "garage gable", spec: { style: "gable", pitch: 1, material: SLATE, footprint: [19, 1, 22, 4], ridgeAxis: "z", overhang: 0, y: 3,
      keep: [{ from: [20, 4, 4], to: [21, 4, 4] }, { from: [16, 3, 0], to: [17, 9, 9] }] } },
  { plot: 4, name: "barracks gable", spec: { style: "gable", pitch: 0.6, material: SLATE, footprint: [30, 1, 41, 9], ridgeAxis: "x", overhang: 0, y: 6,
      keep: [{ from: [28, 1, 6], to: [29, 9, 8] }, { from: [42, 1, 6], to: [43, 9, 8] }, { from: [30, 6, 7], to: [30, 9, 7] }, { from: [41, 6, 7], to: [41, 9, 7] }] } },
  { plot: 5, name: "hall low gable", spec: { style: "gable", pitch: 0.5, material: RED_TILE, footprint: [47, 1, 60, 16], ridgeAxis: "z", overhang: 0, y: 6,
      keep: [{ from: [47, 6, 16], to: [60, 10, 16] }] } },
  { plot: 6, name: "officers hip", spec: { style: "hip", pitch: 0.5, material: DARK_SLATE, footprint: [66, 1, 73, 7], overhang: 0, y: 6,
      keep: [{ from: [64, 1, 3], to: [65, 8, 5] }, { from: [74, 1, 3], to: [75, 8, 5] }, { from: [66, 6, 4], to: [66, 8, 4] }, { from: [73, 6, 4], to: [73, 8, 4] },{ from: [66, 7, 5], to: [68, 8, 6] }, { from: [71, 7, 5], to: [73, 8, 6] }] } },
];

function step(name, fn) {
  try {
    const r = fn();
    return r ?? null;
  } catch (e) {
    console.warn(`roofs: ${name} not laid: ${String(e.message).split("\n")[0]}`);
    return null;
  }
}

export function build(g) {
  for (const { plot, name, spec } of MAIN) step(`plot ${plot} ${name}`, () => reroof(g, spec));

  // plot 1: the Mission parapet over the front bay, and the two door hoods under it
  step("plot 1 mission parapet", () => mission_parapet(g, [11, 6, 9]));
  step("plot 1 hood W", () => door_hood(g, [10, 3, 9], "south"));
  step("plot 1 hood E", () => door_hood(g, [15, 3, 9], "south"));

  // plot 3: the shed's pyramid cap
  step("plot 3 pyramid cap", () => pyramid_cap(g, { x0: 24, z0: 0, x1: 27, z1: 3, y: 3 }));

  // plot 6: two gabled dormers on the south slope
  step("plot 6 dormer W", () => dormer(g, 66, 68, 5, 7));
  step("plot 6 dormer E", () => dormer(g, 71, 73, 5, 7));
}
