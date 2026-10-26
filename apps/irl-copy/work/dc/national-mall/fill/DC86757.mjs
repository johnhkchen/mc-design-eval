import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Wilkins House, 1700 Massachusetts Ave NW (Old Australian Embassy). Inferred from the record, not surveyed: an
// early-20th-century Georgian Revival house on Embassy Row. Three storeys of red brick on a stone plinth, limestone
// string courses, quoins and cornice, a low hipped slate roof, and the entrance on the street (east) face.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86757.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const ROOF = 7;                                  // first roof course, on the limestone cornice at y 6
const STONE = "stone_bricks", BRICK = "bricks", LIME = "smooth_quartz", SLATE = "deepslate_tiles", SLATE_ST = "deepslate_tile_stairs";
const DIRS = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];   // name, dx, dz (north = -z)

const k = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, g, r]) => [k(x, z), { x, z, g, r }]));
const inside = (x, z) => cell.has(k(x, z));
const outward = (x, z) => DIRS.filter(([, dx, dz]) => !inside(x + dx, z + dz));   // faces toward open air

// Distance in cells from the outside: edge cells are 1, the middle grows inwards (drives the hip).
const dist = new Map();
let frontier = cells.map(([x, z]) => [x, z]).filter(([x, z]) => outward(x, z).length);
for (const [x, z] of frontier) dist.set(k(x, z), 1);
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) for (const [, dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz, nk = k(nx, nz);
    if (inside(nx, nz) && !dist.has(nk)) { dist.set(nk, dist.get(k(x, z)) + 1); next.push([nx, nz]); }
  }
  frontier = next;
}

// Roof height above the cornice, from the lidar roof (8 or 9 blocks above y 0), 5-cell mean so the noise goes:
// 9 reads as two courses of roof, 8 as one. The two outer rings are one course, so the hip steps up only in the core.
const roofHeight = new Map();
for (const c of cell.values()) {
  const nb = [[0, 0], ...DIRS.map(([, dx, dz]) => [dx, dz])].map(([dx, dz]) => cell.get(k(c.x + dx, c.z + dz))).filter(Boolean);
  const mean = nb.reduce((s, n) => s + n.r, 0) / nb.length;
  roofHeight.set(k(c.x, c.z), dist.get(k(c.x, c.z)) < 3 ? 1 : mean >= 8.5 ? 2 : 1);
}
const top = (x, z) => roofHeight.get(k(x, z)) ?? 0;   // outside the footprint: no roof

const g = new Voxels([9, 21, 12]);
const panes = [], lights = [];

for (const c of cell.values()) {
  const { x, z } = c, out = outward(x, z), edge = out.length > 0;
  g.set(x, 0, z, STONE);                         // plinth, and the fill up to a lower cell's ground
  if (!edge) {                                   // interior: air behind the glass, a floor slab per storey
    for (const y of [2, 4, 6]) g.set(x, y, z, STONE);
  } else {
    const [, vx, vz] = out[0];
    // a quoin only on a convex corner (both outward faces open, the diagonal cell outside too)
    const corner = out.length > 1 && !inside(x + out[0][1] + out[1][1], z + out[0][2] + out[1][2]);
    const along = vx !== 0 ? z : x;              // position along the face: one narrow glass bay in three, brick piers between
    for (let y = 1; y <= 5; y++) {
      if (y === 2 || y === 4 || corner) g.set(x, y, z, LIME);
      else if (along % 3 === 0) { g.set(x, y, z, "glass_pane"); panes.push([x, y, z]); }
      else g.set(x, y, z, BRICK);
    }
    g.set(x, 6, z, LIME);                        // cornice ring
    // warm light in some bays, standing in the air behind the glass (ground and middle storeys only)
    const bx = x - vx, bz = z - vz;
    if (!corner && inside(bx, bz) && dist.get(k(bx, bz)) > 1) {
      if (along % 6 === 0) lights.push([bx, 1, bz]);
      if (along % 6 === 3) lights.push([bx, 3, bz]);
    }
  }
}

// Roof: slate courses on the cornice, the top course a stair stepping down toward the lower neighbour (the hip).
for (const c of cell.values()) {
  const { x, z } = c, h = top(x, z);
  for (let i = 0; i < h; i++) {
    const y = ROOF + i;
    if (i < h - 1) { g.set(x, y, z, SLATE); continue; }
    const low = DIRS.filter(([, dx, dz]) => top(x + dx, z + dz) < h).sort((a, b) => top(x + a[1], z + a[2]) - top(x + b[1], z + b[2]));
    if (low.length) g.set(x, y, z, SLATE_ST, { facing: low[0][0], half: "bottom", shape: "straight", waterlogged: "false" });
    else g.set(x, y, z, SLATE);
  }
}

// Two brick chimneys on flat-topped interior roof cells, standing on the full course below.
const flat = [...cell.values()].filter(c => dist.get(k(c.x, c.z)) > 1 && top(c.x, c.z) === 2 && DIRS.every(([, dx, dz]) => top(c.x + dx, c.z + dz) >= 2));
const stacks = [];
for (const c of flat) if (stacks.length < 2 && stacks.every(s => Math.abs(s.x - c.x) + Math.abs(s.z - c.z) >= 3)) stacks.push(c);
for (const { x, z } of stacks) { g.set(x, 9, z, BRICK); g.set(x, 10, z, BRICK); g.set(x, 11, z, LIME); }

// The entrance on the street (east) face at z 7: a door in a limestone surround under a small hood.
for (const [x, y, z] of [[8, 1, 6], [8, 2, 6], [8, 1, 8], [8, 2, 8], [8, 3, 6], [8, 3, 7], [8, 3, 8]]) g.set(x, y, z, LIME);
g.set(8, 1, 7, "oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(8, 2, 7, "oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
const doorAt = [8, 1, 7], doorUp = [8, 2, 7];
for (const [x, y, z] of lights) if (!(x === doorAt[0] && z === doorAt[2])) g.set(x, y, z, "glowstone");

// Glass panes take their connections from the solid neighbours, so each bay reads as a framed window.
for (const [x, y, z] of panes) {
  if (x === 8 && z === 7) continue;
  const conn = Object.fromEntries(DIRS.map(([n, dx, dz]) => [n, g.get(x + dx, y, z + dz) ? "true" : "false"]));
  g.set(x, y, z, "glass_pane", { ...conn, waterlogged: "false" });
}

const tally = {};
g.forEachCell((i, v) => { const b = g.palette[v].block; tally[b] = (tally[b] || 0) + 1; });
const info = g.save(`${DIR}/DC86757.nbt`);
console.log(JSON.stringify({ ...info, footprint: cells.length, chimneys: stacks.length, lights: lights.length, doorUp, tally }));
