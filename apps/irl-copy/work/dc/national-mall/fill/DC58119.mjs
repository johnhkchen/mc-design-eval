// 1444 Rhode Island Ave NW: a 1920s brick apartment block with an elevator, four storeys on a 12-block body and a
// five-storey tower core at 15. Red brick walls with stone string courses, a stone plinth and cornice, white
// sash-style panes in brick piers, stone quoins at the corners, a dark-oak entrance under a stone lintel,
// and a light court at grade. Hollow inside: one floor slab per storey and an air gap behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58119.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 18, H = 27, D = 20;
const N4 = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const STOREY = 3;

// one record per footprint cell; a light well is a cell whose roof is no higher than its ground
const byXZ = new Map();
for (const [x, z, g, roof] of cells) byXZ.set(`${x},${z}`, { x, z, g, roof, court: roof <= g, top: 0 });
const at = (x, z) => byXZ.get(`${x},${z}`) ?? null;
const body = [...byXZ.values()].filter((c) => !c.court);

// lidar roof, smoothed by the median of its 3x3 neighbourhood, then two flat tiers: the body at 12, the tower at 15
for (const c of body) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = at(c.x + dx, c.z + dz); if (n && !n.court) near.push(n.roof);
  }
  near.sort((a, b) => a - b);
  c.top = near[Math.floor(near.length / 2)] >= 14 ? 15 : 12;
}

// a face is open to the air at row y if the neighbour beside it is missing, a light well, or does not reach y
const openAt = (c, y) => N4.some(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.court || n.top <= y; });
// the parapet runs along the roof edge: outside the footprint or down to a lower tier
const edgeAt = (c) => N4.some(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.court || n.top < c.top; });

// the street front is the longest straight run of exposed cells on one side; its middle cell takes the door
const runs = [];
for (const [dir, dx, dz] of N4) {
  const face = body.filter((c) => !at(c.x + dx, c.z + dz) || at(c.x + dx, c.z + dz).court);
  const horizontal = dx === 0;   // north/south faces run along x
  const groups = new Map();
  for (const c of face) { const line = horizontal ? c.z : c.x; if (!groups.has(line)) groups.set(line, []); groups.get(line).push(c); }
  for (const [, list] of groups) {
    list.sort((a, b) => (horizontal ? a.x - b.x : a.z - b.z));
    let run = [];
    for (const c of list) {
      const prev = run[run.length - 1];
      if (prev && (horizontal ? c.x - prev.x : c.z - prev.z) === 1) run.push(c); else { if (run.length) runs.push({ dir, run }); run = [c]; }
    }
    if (run.length) runs.push({ dir, run });
  }
}
runs.sort((a, b) => b.run.length - a.run.length);
const front = runs[0];
const door = { cell: front.run[Math.floor(front.run.length / 2)], facing: front.dir };

// the blocks, keyed by position: [block, state]
const put = new Map();
const set = (x, y, z, block, state) => put.set(`${x},${y},${z}`, [block, state]);
const get = (x, y, z) => put.get(`${x},${y},${z}`);

for (const c of byXZ.values()) {
  const { x, z, g } = c;
  if (c.court) {   // a light well: foundation and a paved floor at grade, open to the sky
    for (let y = 0; y < g; y++) set(x, y, z, "stone_bricks");
    set(x, g, z, "stone_bricks");
    continue;
  }
  for (let y = 0; y < g; y++) set(x, y, z, "stone_bricks");   // foundation up to the cell's ground
  for (let y = g; y <= c.top; y++) {
    const rel = y - g;
    if (y === c.top) {   // parapet on the roof edge
      if (edgeAt(c)) set(x, y, z, "stone_brick_wall");
      continue;
    }
    const ex = openAt(c, y);
    if (y === c.top - 1) { set(x, y, z, ex ? "smooth_stone" : "gray_concrete"); continue; }   // cornice, or tar roof inside
    if (rel % STOREY === 0) { set(x, y, z, ex && rel === 0 ? "stone_bricks" : "smooth_stone"); continue; }   // plinth, then string courses
    if (!ex) continue;   // air behind the glass
    set(x, y, z, (x + z) % 3 !== 0 ? "white_stained_glass_pane" : "bricks");   // sash panes between brick piers
  }
}

// the entrance: dark-oak door in the middle of the front run, under a stone lintel at the storey line
{
  const { cell, facing } = door;
  const y0 = cell.g + 1;
  set(cell.x, y0, cell.z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  set(cell.x, y0 + 1, cell.z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  set(cell.x, cell.g + 3, cell.z, "smooth_stone");
}

// roof plant: small mechanical units on the tiers' flat roofs
for (const c of body) {
  if (openAt(c, c.top - 1) || (c.x * 5 + c.z * 3) % 9 !== 4) continue;
  set(c.x, c.top, c.z, "light_gray_concrete");
  set(c.x, c.top + 1, c.z, "light_gray_concrete");
}

// warm lamps set in the air gap behind some lower-row windows
for (const c of body) {
  const y = c.g + 1;
  if (!openAt(c, y) || (c.x + 2 * c.z) % 5 !== 0) continue;
  const inward = N4.map(([, dx, dz]) => at(c.x + dx, c.z + dz)).find((n) => n && !n.court && !openAt(n, y) && y >= n.g && y < n.top - 1 && (y - n.g) % STOREY !== 0);
  if (inward) set(inward.x, y, inward.z, (c.x + c.z) % 2 === 0 ? "glowstone" : "shroomlight");
}

// connections: panes join panes and solid walls, parapets join parapets
const SOLID = new Set(["bricks", "stone_bricks", "smooth_stone", "white_stained_glass_pane"]);
const joins = (x, y, z, pred) => Object.fromEntries(N4.map(([d, dx, dz]) => {
  const b = get(x + dx, y, z + dz); return [d, b && pred(b[0]) ? "true" : "false"];
}));
for (const [key, [block]] of [...put]) {
  const [x, y, z] = key.split(",").map(Number);
  if (block === "white_stained_glass_pane") put.set(key, [block, joins(x, y, z, (b) => SOLID.has(b))]);
  if (block === "stone_brick_wall") {
    const w = Object.fromEntries(N4.map(([d, dx, dz]) => { const b = get(x + dx, y, z + dz); return [d, b && b[0] === "stone_brick_wall" ? "low" : "none"]; }));
    put.set(key, [block, { up: "true", ...w }]);
  }
}

const g = new Voxels([W, H, D]);
for (const [key, [block, state]] of put) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/DC58119.nbt`);
console.log(JSON.stringify({ door: { at: [door.cell.x, door.cell.z], facing: door.facing, run: front.run.length }, ...out }));
