import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1970s reinforced-concrete office block over street-level shops (Auckland's CBD-fringe commercial stock of that
// decade): light concrete walls, a stone plinth on the downhill side, tinted glass in framed bays, a parapet, a
// lift overrun and roof plant. Massing follows the lidar roof tiers (16 core, 13-15 wings) with the ground floor on
// the storey line at or above each cell's own ground.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269468125.cells.json`, "utf8"));
const W = 44, D = 43, H = 30;

const WALL = "light_gray_concrete", FOUND = "stone_bricks", BAND = "smooth_stone", PLINTH = "stone_bricks";
const FRAME = "gray_concrete", PANE = "light_blue_stained_glass_pane", SHOP = "light_blue_stained_glass";
const ROOF = "stone", PARAPET = "light_gray_concrete", LAMP = "glowstone", SHROOM = "shroomlight", DOOR = "dark_oak_door";
const AIR = "air";

const foot = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, ground, roof] of cells) foot[z][x] = { ground, raw: roof, roof };
const cell = (x, z) => (x >= 0 && z >= 0 && x < W && z < D ? foot[z][x] : null);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const list = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (cell(x, z)) list.push([x, z, cell(x, z)]);

// 1. Roof: the lidar's 3x3 mode over footprint neighbours (own value wins ties) kills the one-off noise cells; at least
//    3 blocks of wall above the cell's own ground so every column has storeys.
for (const [x, z, c] of list) {
  const counts = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = cell(x + dx, z + dz); if (n) counts.set(n.raw, (counts.get(n.raw) || 0) + 1);
  }
  let best = c.raw, bestN = -1;
  for (const [v, n] of counts) if (n > bestN || (n === bestN && v === c.raw)) { best = v; bestN = n; }
  c.roof = Math.max(best, c.ground + 3);
}

// 2. Solid massing from y 0 to the roof (foundation below each cell's ground, roof deck on top). No interiors: the
//    window recesses below are the only air.
const g = new Voxels([W, H, D]);
for (const [x, z, c] of list) for (let y = 0; y < c.roof; y++) {
  g.set(x, y, z, y < c.ground ? FOUND : y === c.roof - 1 ? ROOF : WALL);
}

// 3. Facades: every outward face (footprint edge) and every step face (a neighbour lower in the tiers) gets the
//    storey grammar. Storey lines sit on absolute multiples of 4; ground storey = the first line at or above the
//    cell's own ground, so the shopfront glazing is at street level and the downhill side shows a plinth.
const panes = [], glass = [];
for (const [x, z, c] of list) {
  const faces = [];
  for (const [dx, dz] of DIRS) {
    const n = cell(x + dx, z + dz);
    if (!n) faces.push({ dx, dz, from: c.ground, outside: true });
    else if (n.roof < c.roof) faces.push({ dx, dz, from: n.roof, outside: false });
  }
  if (!faces.length) continue;
  faces.sort((a, b) => Number(b.outside) - Number(a.outside));
  const shopBase = Math.ceil(c.ground / 4) * 4;
  for (let y = c.ground; y < c.roof; y++) {
    const f = faces.find((face) => y >= face.from);
    if (!f) continue;
    const t = f.dx !== 0 ? z : x;                    // the coordinate running along this face
    const rel = y % 4;
    let block = WALL, isGlass = null;
    if (y === c.roof - 1) block = BAND;              // cornice under the deck
    else if (f.outside && y === c.ground) block = PLINTH;
    else if (rel === 0) block = BAND;               // storey line
    else if (rel === 3 || y < shopBase) block = WALL;
    else if (t % 3 === 0) block = FRAME;            // mullion / shopfront post
    else if (y < shopBase + 4) { block = SHOP; isGlass = "shop"; }
    else { block = PANE; isGlass = "pane"; }
    g.set(x, y, z, block);
    if (block === PANE) panes.push([x, y, z]);
    if (isGlass) glass.push({ x, y, z, dx: f.dx, dz: f.dz, shop: isGlass === "shop" });
  }
}

// 4. Air gap behind each glazed bay (one cell, only where the cell behind is well inside the footprint) and a warm
//    light in some of them: glowstone behind upper glass, shroomlight behind shop glass.
for (const { x, y, z, dx, dz, shop } of glass) {
  if (y % 4 !== 1) continue;                       // one air cell per bay, on the storey line: solid over it
  const bx = x - dx, bz = z - dz, b = cell(bx, bz);
  if (!b || b.roof <= y || !DIRS.every(([ex, ez]) => cell(bx + ex, bz + ez))) continue;
  const h = (x * 7 + y * 13 + z * 31) % 9;
  const lit = shop ? h % 3 === 0 : h === 0;
  g.set(bx, y, bz, lit ? (shop ? SHROOM : LAMP) : AIR);
}

// 5. Parapet on the outward edge of the roof deck.
for (const [x, z, c] of list) {
  if (DIRS.some(([dx, dz]) => !cell(x + dx, z + dz))) g.set(x, c.roof, z, PARAPET);
}

// 6. Entrance on the south face (the low side): two doors in a one-deep recess, a lintel over them, lit porch.
let door = null;
for (const [x, z, c] of list) {
  if (cell(x, z + 1) || !cell(x + 1, z) || cell(x + 1, z + 1)) continue;
  if (x < 24 || x > 34) continue;
  const score = Math.abs(x - 29);
  if (!door || score < door.score) door = { x, z, c, score };
}
if (door) {
  const { x, z } = door;
  const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  for (const dx of [0, 1]) {
    const dc = cell(x + dx, z);
    const yb = dc.ground + 1;
    g.set(x + dx, yb, z - 0, DOOR, doorState("lower"));
    g.set(x + dx, yb + 1, z, DOOR, doorState("upper"));
    g.set(x + dx, yb, z - 1, AIR); g.set(x + dx, yb + 1, z - 1, AIR);     // porch recess
    g.set(x + dx, dc.ground + 3, z, BAND); g.set(x + dx, dc.ground + 3, z - 1, BAND);  // lintel / canopy soffit
  }
}

// 7. Roof plant: a lift overrun (3x3, 4 high) and two small plant boxes on the core deck (roof 16), inset from the edge.
let core = null;
for (const [x, z] of [[16, 20], [14, 20], [16, 22], [14, 22], [18, 20], [16, 18], [16, 24], [12, 20]]) {
  let ok = true;
  for (let dz = -2; dz <= 2 && ok; dz++) for (let dx = -2; dx <= 2 && ok; dx++) {
    const n = cell(x + dx, z + dz); if (!n || n.roof !== 16) ok = false;
  }
  if (ok) { core = { x, z }; break; }
}
if (core) {
  const { x, z } = core;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const top = 16 + 3;
    for (let y = 16; y < top; y++) g.set(x + dx, y, z + dz, y === top - 1 ? ROOF : y === top - 2 ? BAND : WALL);
  }
  for (const [dx, dz] of [[-2, -2], [-2, 2]]) for (let y = 16; y < 18; y++) g.set(x + dx, y, z + dz, FRAME);
}

// 8. Pane connections: a pane joins each horizontal neighbour that is solid (the wall behind it or a mullion) or
//    another pane; air leaves it open.
for (const [x, y, z] of panes) {
  if (g.get(x, y, z)?.block !== "minecraft:" + PANE) continue;   // a doorway took this bay
  const solid = (px, pz) => g.get(px, y, pz) !== null;
  g.set(x, y, z, PANE, {
    north: String(solid(x, z - 1)), south: String(solid(x, z + 1)),
    east: String(solid(x + 1, z)), west: String(solid(x - 1, z)), waterlogged: "false",
  });
}

// Check: nothing floats (every solid cell above y 0 has a solid below, or a lintel/canopy ends on a solid wall)
let floating = 0, solids = 0;
const floatKinds = {}, floatAt = [];
g.forEachCell((i) => {
  const X = W, Y = H, x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  solids++;
  // a course over air is a lintel: fine when a solid neighbour in the same course carries it
  const carried = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dz]) => g.get(x + dx, y, z + dz) !== null);
  if (y > 0 && g.get(x, y - 1, z) === null && !carried) { floating++; const b = g.get(x, y, z).block; floatKinds[b] = (floatKinds[b] || 0) + 1; floatAt.push([x, y, z]); }
});
const saved = g.save(`${DIR}/way_269468125.nbt`);
console.log(JSON.stringify({ footprint: cells.length, blocks: saved.blocks, palette: saved.palette, floating, door: door ? { x: door.x, z: door.z } : null, core, panes: panes.length, glass: glass.length, floatKinds, floatSample: floatAt.slice(0, 12) }));
