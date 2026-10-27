// Mt Eden / Eden Terrace, 1930s reinforced-concrete commercial block: a 4-storey core (roof 17) on a
// 3-storey podium (roof 13, two cells deep at the edge) with 2-storey wings where the lidar roof is low.
// Storeys are 4 blocks: a string course on the floor line, a white sill, two glass rows, a cornice on the cap.
// Ground floor: stone plinth, shopfronts, a transom band, and a stone-framed entrance with a timber hood.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326736315.cells.json", "utf8"));
const X = 19, Y = 29, Z = 18;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

// lidar roof -> clean tiers (17 = 4 storeys, 13 = 3, 9 = 2); the outer two cells of the 17s become the podium
const cell = new Map();
for (const [x, z, , roof] of cells) {
  const base = roof >= 14 ? 17 : roof >= 12 ? 13 : 9;
  cell.set(key(x, z), { x, z, H: base });
}
// depth in cells from the outside edge: 1 = outer ring
const depth = new Map();
let frontier = [];
for (const c of cell.values()) {
  if (DIRS.some(([dx, dz]) => !cell.has(key(c.x + dx, c.z + dz)))) { depth.set(key(c.x, c.z), 1); frontier.push(c); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of DIRS) {
    const k = key(c.x + dx, c.z + dz);
    if (cell.has(k) && !depth.has(k)) { depth.set(k, d + 1); next.push(cell.get(k)); }
  }
  frontier = next;
}
for (const c of cell.values()) if (c.H === 17 && depth.get(key(c.x, c.z)) <= 2) c.H = 13;

const H = (x, z) => cell.get(key(x, z))?.H ?? 0;          // outside the footprint counts as no building
const blocked = (x, z, y) => H(x, z) <= y;                  // an open face: outside, or a lower tier
const isCore = (x, z) => H(x, z) === 17;

const P = new Map();                                        // "x,y,z" -> { block, state, dirs }
const put = (x, y, z, block, state, dirs) => P.set(`${x},${y},${z}`, { block, state, dirs });
const glass = [];

for (const c of cell.values()) {
  const { x, z } = c;
  for (let y = 0; y < c.H; y++) {
    const dirs = DIRS.map(([dx, dz]) => blocked(x + dx, z + dz, y));   // +x, -x, +z, -z
    const shell = dirs.some(Boolean);
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                 // plinth, and the ground slab under everything
    if (y === c.H - 1) { put(x, y, z, shell ? "smooth_quartz" : "gray_concrete", null, dirs); continue; }   // cornice / roof
    if (!shell) { if (y % 4 === 0) put(x, y, z, "smooth_stone"); continue; } // interior: a floor slab per storey, air between
    const [px, mx, pz, mz] = dirs;
    const corner = (px || mx) && (pz || mz);
    const u = pz || mz ? x : z;                                              // bays run along the face
    const pier = corner || u % 3 === 0;
    const ground = y < 4, k = y % 4;
    if (ground && k === 3) put(x, y, z, "polished_andesite", null, dirs);    // transom
    else if (k === 0) put(x, y, z, "polished_andesite", null, dirs);         // string course on the floor line
    else if (k === 1 && !ground) put(x, y, z, "white_concrete", null, dirs); // sill
    else if (pier) put(x, y, z, ground ? "polished_andesite" : "light_gray_concrete", null, dirs);
    else {
      put(x, y, z, ground ? "glass_pane" : "light_blue_stained_glass_pane", null, dirs);
      glass.push({ x, y, z, dirs, ground });
    }
  }
}

// street entrance on the south face (z = 14): a door in a stone surround under a timber hood
const south = [false, false, true, false];
for (const y of [1, 2]) {
  put(3, y, 14, "polished_andesite", null, south);
  put(5, y, 14, "polished_andesite", null, south);
}
put(4, 1, 14, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }, south);
put(4, 2, 14, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }, south);
for (const x of [3, 4, 5]) put(x, 3, 14, "dark_oak_planks", null, south);

// warm light behind some glass: a glowstone in the air gap one cell inside the pane
for (const g of glass) {
  if ((g.x * 5 + g.z * 3 + g.y * 7) % 11 !== 0) continue;
  const out = DIRS[g.dirs.findIndex(Boolean)];                 // the outward direction of this pane's face
  const ix = g.x - out[0], iz = g.z - out[1];
  const k = `${ix},${g.y},${iz}`;
  if (!P.has(k) && H(ix, iz) > g.y && !blocked(ix, iz, g.y)) P.set(k, { block: "glowstone", state: null, dirs: null });
}

// roof plant: a plant room and a lift overrun on the core roof (on the cap, at y 17 and 18)
for (const [x, z] of [[7, 6], [8, 6], [9, 6], [7, 7], [8, 7], [9, 7]]) if (isCore(x, z)) put(x, 17, z, "light_gray_concrete", null);
for (const [x, z] of [[8, 6], [8, 7]]) if (isCore(x, z)) put(x, 18, z, "light_gray_concrete", null);
for (const [x, z] of [[12, 9], [13, 9], [12, 10], [13, 10]]) if (isCore(x, z)) put(x, 17, z, "iron_block", null);

// glass panes join their neighbours: a pane connects to any block beside it in the same plane
const has = (x, y, z) => P.has(`${x},${y},${z}`);
const g = new Voxels([X, Y, Z]);
for (const [k, { block, state }] of P) {
  const [x, y, z] = k.split(",").map(Number);
  if (block === "glass_pane" || block === "light_blue_stained_glass_pane") {
    const st = {
      north: String(has(x, y, z - 1)), south: String(has(x, y, z + 1)),
      east: String(has(x + 1, y, z)), west: String(has(x - 1, y, z)), waterlogged: "false",
    };
    g.set(x, y, z, block, st);
  } else {
    g.set(x, y, z, block, state);
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326736315.nbt");
console.log("way_326736315:", g.count(), "blocks; core roof", [...cell.values()].filter((c) => c.H === 17).length, "cells");
