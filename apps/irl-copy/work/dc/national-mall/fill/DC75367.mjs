// 1220 12th St NW: a 1960s-style brick apartment block with a limestone base, storey bands every 3 blocks,
// a stepped central tower with an elevator penthouse, and an east-wing entrance recess.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC75367.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 18, D = 14, H = 26;

const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(x * 100 + z, { g, r });
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && cell.has(x * 100 + z);

// Roof height used for massing: the lidar's 14 is kept only where the cell is inside the tower block,
// so the tower's ring steps down to 12 and its core rises two blocks above it (a setback).
const roofOf = (x, z) => {
  const c = cell.get(x * 100 + z); if (!c) return 0;
  if (c.r < 14) return c.r;
  const core = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => (cell.get((x + dx) * 100 + z + dz)?.r ?? 0) >= 14);
  return core ? 14 : 12;
};
const occupied = (x, z, y) => inFp(x, z) && y < roofOf(x, z);
const DIRS = [[0, -1, "n"], [0, 1, "s"], [-1, 0, "w"], [1, 0, "e"]];
const openDirs = (x, z, y) => DIRS.filter(([dx, dz]) => !occupied(x + dx, z + dz, y)).map(d => d[2]);

function blockAt(x, z, y) {
  const c = cell.get(x * 100 + z); if (!c) return null;
  const R = roofOf(x, z), g = c.g;
  if (y < g) return "stone_bricks";                          // foundation up to the lidar ground
  if (y >= R) return null;
  const open = openDirs(x, z, y);
  const storeyLine = y >= 3 && y % 3 === 0;                  // limestone bands at 3, 6, 9, 12
  if (!open.length) {                                        // inside: floors and the roof deck only
    return y === g || storeyLine || y === R - 1 ? "smooth_stone" : null;
  }
  const top = y === R - 1 && R - 1 - g >= 3;                 // cornice / parapet on the taller roofs
  const corner = open.some(d => d === "n" || d === "s") && open.some(d => d === "e" || d === "w");
  if (y === g) return "stone_bricks";                        // base course
  if (top || storeyLine || corner) return "calcite";
  const along = open[0] === "n" || open[0] === "s" ? x : z;  // window grid: glass on odd bays, brick piers between
  return along % 2 === 1 ? "glass" : "bricks";
}

const b = new Voxels([W, H, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) {
  const id = blockAt(x, z, y);
  if (id) b.set(x, y, z, id);
}

// Warm light inside some windows: a glowstone or shroomlight one bay behind the glass.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) {
  if (b.get(x, y, z)?.block !== "minecraft:glass" || (x * 3 + y * 2) % 11 !== 0) continue;
  const dir = openDirs(x, z, y)[0]; if (!dir) continue;
  const [dx, dz] = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] }[dir];
  const ix = x + dx, iz = z + dz;
  if (inFp(ix, iz) && !openDirs(ix, iz, y).length) b.set(ix, y, iz, (x + y) % 2 ? "glowstone" : "shroomlight");
}

// East-wing entrance: a recess at x 13..15, z 0..1 with a limestone canopy, a hanging lantern and a dark oak door
// at the lobby wall (z 2), its upper half through the storey band.
for (let x = 13; x <= 15; x++) for (let z = 0; z <= 1; z++) b.set(x, 2, z, "air");
b.set(14, 2, 0, "lantern", { hanging: "true" });
b.set(14, 2, 2, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
b.set(14, 3, 2, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// Roof plant: two air-handling units on the east wing's deck, and the elevator penthouse on the tower core.
b.set(13, 12, 2, "iron_block"); b.set(14, 12, 2, "iron_block");
for (let x = 8; x <= 9; x++) for (let z = 6; z <= 7; z++) {
  b.set(x, 14, z, "bricks"); b.set(x, 15, z, "calcite");
}

const { blocks, palette } = b.save(`${DIR}/DC75367.nbt`);
console.log(`saved DC75367.nbt: ${blocks} blocks, ${palette} palette entries`);
