// 1302 New Jersey Ave NW: a two-storey Federal Revival public-service block of pale limestone on a plinth, with a
// stone cornice and a flat roof. Storeys, floor courses and the roof are solid rings; the interior is air with a
// floor slab per storey, and the windows are glass panes in stone piers, lit by hanging lanterns behind them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC69403.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 11, D = 15, H = 18;
// Lidar roof reads 5 to 6 over the footprint; smoothed to one flat tier at 6 (the brief's record), so the two storeys fit.
const ROOF = 6;
const PLINTH = 0, STOREY_1 = [1, 2], COURSE = 3, STOREY_2 = [4], TOP = 5;

const g = new Voxels([W, H, D]);
const inside = (x, z) => x > 0 && x < W - 1 && z > 0 && z < D - 1;
const rim = (x, z) => !inside(x, z);

// Piers on even bays, glass panes on odd bays, along each face; corners are piers.
const alongX = (x, z) => z === 0 || z === D - 1;
const isPier = (x, z) => (alongX(x, z) ? x : z) % 2 === 0;
const paneState = (x, z) => (alongX(x, z)
  ? { east: "true", west: "true", north: "false", south: "false" }
  : { north: "true", south: "true", east: "false", west: "false" });

// Foundation: solid from y 0 up to each cell's ground, then the plinth course under the whole footprint.
for (const [x, z, ground] of cells) {
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, PLINTH, z, "stone_bricks");
}

for (const [x, z] of cells) {
  // storey floors and the cornice course run the full footprint, so each tier stands on the one below it
  g.set(x, COURSE, z, "smooth_stone");
  g.set(x, TOP, z, rim(x, z) ? "chiseled_stone_bricks" : "gray_concrete");

  if (!rim(x, z)) continue;
  for (const y of [...STOREY_1, ...STOREY_2]) {
    if (isPier(x, z)) g.set(x, y, z, "calcite");
    else g.set(x, y, z, "glass_pane", paneState(x, z));
  }
}

// Entrances: a door centred on the street (north) face and on the back (south) face, between calcite piers.
for (const [z, facing] of [[0, "north"], [D - 1, "south"]]) {
  for (const [half, y] of [["lower", 1], ["upper", 2]]) {
    g.set(5, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
  }
  g.set(5, COURSE, z, "chiseled_stone_bricks");   // keystone over the door, so the entry reads from the street
}

// Warm light: hanging lanterns behind some panes, hung from the floor course or the roof above them.
const lanternsLow = [[3, 1], [7, 1], [1, 5], [1, 9], [9, 5], [9, 9], [3, 13], [7, 13]];   // [x, z] in the ground storey
for (const [x, z] of lanternsLow) g.set(x, 2, z, "lantern", { hanging: "true" });
const lanternsHigh = [[3, 1], [7, 1], [1, 3], [1, 11], [9, 3], [9, 11], [3, 13], [7, 13]];
for (const [x, z] of lanternsHigh) g.set(x, 4, z, "lantern", { hanging: "true" });

// Roof plant on the flat tier: two condenser units, a stair-core housing, and a brick flue.
for (let x = 2; x <= 4; x++) for (let z = 6; z <= 7; z++) g.set(x, ROOF, z, "light_gray_concrete");
for (let x = 6; x <= 8; x++) for (let z = 9; z <= 11; z++) g.set(x, ROOF, z, "light_gray_concrete");
for (let x = 7; x <= 8; x++) for (let z = 10; z <= 11; z++) g.set(x, ROOF + 1, z, "iron_block");
g.set(9, ROOF, 3, "bricks"); g.set(9, ROOF + 1, 3, "bricks");

const out = `${DIR}/DC69403.nbt`;
const stats = g.save(out);
console.log(`DC69403: ${stats.blocks} blocks, ${stats.palette} palette entries -> ${out}`);
