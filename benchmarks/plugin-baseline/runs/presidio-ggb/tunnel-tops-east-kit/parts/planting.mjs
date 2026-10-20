// Part 5, Planting and trees: native drift beds on flat ground, Monterey cypress and pine at the plan's trunk list,
// young meadow trees at their list. Every element writes into air only (the helpers refuse the rest).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { drift, cypress, pine, youngTree, CYPRESS_TRUNKS, PINE_TRUNKS, YOUNG_TRUNKS } from "../vocab.mjs";

const dir = fileURLToPath(new URL(".", import.meta.url));
const HM = readFileSync(dir + "heights.txt", "utf8").trim().split("\n").map((r) => [...r].map((c) => parseInt(c, 36)));

// ground height map: one digit per 2 x 2 blocks (row = z / 2, column = x / 2)
const H = (x, z) => HM[z >> 1][x >> 1];

// the ground-top y a bed sits on: the most common height under its bounding box (plants float over any lower cell)
function bedY(polygon) {
  const xs = polygon.map((p) => p[0]);
  const zs = polygon.map((p) => p[1]);
  const counts = new Map();
  for (let z = Math.min(...zs); z <= Math.max(...zs); z++) {
    for (let x = Math.min(...xs); x <= Math.max(...xs); x++) {
      const h = H(x, z);
      counts.set(h, (counts.get(h) ?? 0) + 1);
    }
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0][0];
}

// a trunk needs a full block under it and a clear cell at its base: the lawn-edge and path slabs sit on the first cell
// above the ground, so nudge the trunk to the nearest neighbour (out to 3 blocks) that has both
const SHIFTS = [[0, 0]];
for (let r = 1; r <= 3; r++) {
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) === r) SHIFTS.push([dx, dz]);
  }
}
function anchor(g, x, z) {
  for (const [dx, dz] of SHIFTS) {
    const ax = x + dx, az = z + dz;
    const ground = g.get(ax, H(ax, az), az)?.block ?? "";
    const base = g.get(ax, H(ax, az) + 1, az);
    if (!ground.includes("slab") && !ground.includes("stair") && !base) return [ax, az];
  }
  return [x, z];
}

// drift beds: [kind, outline [x, z]...] between paths, clear of the Field Station, the B footprints and the terraces
const BEDS = [
  ["grey-green", [[45, 17], [58, 17], [58, 22], [52, 26], [45, 25]]],
  ["ochre", [[44, 28], [56, 28], [57, 35], [47, 36], [43, 32]]],
  ["purple-blue", [[65, 19], [70, 19], [70, 26], [65, 26]]],
  ["coastal scrub", [[54, 62], [60, 62], [61, 70], [56, 72], [53, 68]]],
];

export function build(g) {
  // trees first: a crown's leaves stand above the drifts, so the plants give way to the trunks
  // the cypress and pine (wind-swept clumps) are laid by the last part, drifts.mjs, round the lamps and benches
  for (const [x0, z0] of YOUNG_TRUNKS) {
    const [x, z] = anchor(g, x0, z0);
    youngTree(g, x, H(x, z), z);
  }

  for (const [kind, outline] of BEDS) {
    const y = bedY(outline);
    drift(g, kind, outline, y);
    unsupportedOff(g, outline, y);
  }
  // sunflower heads floating above a sunflower (the upper half with no lower half under it): the head goes, and the
  // stalk below becomes short grass on the bed
  for (const [x, y, z] of [[45, 5, 30], [46, 5, 28]]) {
    if (!String(g.blockAt(x, y, z)).includes("sunflower")) continue;
    g.set(x, y, z, "air");
    if (String(g.blockAt(x, y - 1, z)).includes("sunflower")) g.set(x, y - 1, z, "short_grass");
  }
}

// drop plants that have nothing to stand on: air under them, or a bottom slab (half a block of air under the plant)
const PLANTS = new Set(["fern", "short_grass", "tall_grass", "dead_bush", "sunflower", "allium", "cornflower", "lilac",
  "sweet_berry_bush", "moss_carpet", "azalea_leaves", "flowering_azalea_leaves", "spruce_leaves"].map((b) => `minecraft:${b}`));
// paving and path surfaces: a plant there would stand on a walk
const PAVED = new Set(["smooth_sandstone", "smooth_stone", "gray_concrete", "white_concrete", "light_gray_concrete", "gravel", "polished_andesite", "stone_bricks"].map((b) => `minecraft:${b}`));
function unsupportedOff(g, outline, y) {
  const xs = outline.map((p) => p[0]), zs = outline.map((p) => p[1]);
  for (let z = Math.min(...zs); z <= Math.max(...zs); z++) {
    for (let x = Math.min(...xs); x <= Math.max(...xs); x++) {
      for (const py of [y + 1, y + 2, y + 3, y + 4, y + 5]) {
        const cell = g.get(x, py, z);
        if (!cell || !PLANTS.has(cell.block)) continue;
        const below = g.get(x, py - 1, z)?.block ?? "";
        if (!below || /air$/.test(below) || below.includes("slab") || PAVED.has(below)) g.set(x, py, z, "air");
      }
    }
  }
}
