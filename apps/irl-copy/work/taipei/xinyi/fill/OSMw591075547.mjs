import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw591075547.cells.json`, "utf8"));

const g = new Voxels([6, 29, 17]);

// Footprint lookup: "x,z" -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const TOP = 16;                 // parapet / roof membrane; roof surface at y = 17
const FLOORS = [5, 10, 15];     // storey slabs (interior) and storey lines (exterior)
const SILLS = [6, 9, 11, 14];   // spandrel / lintel rows in upper storeys
const WIN_ROWS = [7, 8, 12, 13];// glazing rows in upper storeys

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const W = !has(x - 1, z), E = !has(x + 1, z);
  const N = !has(x, z - 1), S = !has(x, z + 1);
  const ew = W || E, ns = N || S;
  const corner = ew && ns;
  const ext = ew || ns;
  // position along the facade this cell sits on
  const u = ew ? z : x;
  // glass_pane connections run along the facade
  const paneProps = ew
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

  // Base course / floor at grade
  g.set(x, gr, z, ext ? "stone_bricks" : "light_gray_concrete");

  for (let y = gr + 1; y <= TOP; y++) {
    if (!ext) {
      // Interior: no rooms, only floor slabs and the roof membrane
      if (FLOORS.includes(y) || y === TOP) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Exterior shell
    if (y === TOP) { g.set(x, y, z, "white_concrete"); continue; }          // parapet
    if (FLOORS.includes(y)) { g.set(x, y, z, "smooth_quartz"); continue; }  // storey line

    if (y <= 4) {
      // Ground floor: shopfront
      if (y === 4 || corner || u % 2 === 0) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "glass");
      continue;
    }

    // Upper storeys
    if (SILLS.includes(y)) { g.set(x, y, z, "white_concrete"); continue; }
    if (WIN_ROWS.includes(y)) {
      if (corner || u % 2 === 0) g.set(x, y, z, "white_concrete");   // mullion
      else if ((u * 3 + y) % 7 === 0) g.set(x, y, z, "glowstone");   // lit room behind glass
      else g.set(x, y, z, "glass_pane", paneProps);
      continue;
    }
  }
}

// Entrance: on the north (z-min) face, nearest to x = 2, with headroom for a door
let door = null;
for (const [x, z, gr] of cells) {
  if (has(x, z - 1) || has(x - 1, z) === false && false) continue;
  const northFace = !has(x, z - 1);
  const isCorner = !has(x - 1, z) && !has(x + 1, z);
  if (!northFace || isCorner || gr + 2 > 4) continue;
  if (!door || Math.abs(x - 2) < Math.abs(door[0] - 2)) door = [x, z, gr];
}
if (door) {
  const [dx, dz, dgr] = door;
  g.set(dx, dgr + 1, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, dgr + 2, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(dx, dgr + 3, dz, "white_concrete");   // lintel over the entrance
}

// Rooftop: water tank (2x2) and stair housing (2x3) with a quartz cap
for (const [x, z] of [[1, 4], [2, 4], [1, 5], [2, 5]]) {
  if (!has(x, z)) continue;
  for (let y = 17; y <= 19; y++) g.set(x, y, z, "iron_block");
}
for (const [x, z] of [[3, 11], [4, 11], [3, 12], [4, 12], [3, 13], [4, 13]]) {
  if (!has(x, z)) continue;
  for (let y = 17; y <= 19; y++) g.set(x, y, z, "white_concrete");
  g.set(x, 20, z, "smooth_quartz");
}

g.save(`${DIR}/OSMw591075547.nbt`);
