// Way 258667471, Mt Eden / Eden Terrace side of the CBD: no record, so it is a c.1968 concrete-and-glass office block
// (white concrete piers and spandrels, light-blue glazing, stone base and shopfront storey, flat roofs), five storeys
// with a six-storey stepped tower at its centre and lower wings at three. Floors sit on 4-block storey lines in absolute y.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_258667471.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_258667471.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const SIZE = [73, 38, 78];
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const FACING = { "-1,0": "west", "1,0": "east", "0,-1": "north", "0,1": "south" };

// ---- footprint and the lidar, smoothed into tiers ----
const at = new Map();
for (const [x, z, g, r] of cells) at.set(`${x},${z}`, { x, z, g, r });
const cell = (x, z) => at.get(`${x},${z}`);
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
for (const c of at.values()) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = cell(c.x + dx, c.z + dz); if (n) near.push(n.r); }
  const firstStorey = (Math.floor(c.g / 4) + 1) * 4;      // at least one storey above its own ground
  c.T = Math.max(firstStorey, Math.round(median(near) / 4) * 4);   // roof line (exclusive top of the solid), on a storey line
}

// ---- the volume: one block per cell, role per cell so later passes know what is solid ----
const g = new Voxels(SIZE);
const out = new Map(), role = new Map();
const k3 = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state, r) => { out.set(k3(x, y, z), [block, state]); role.set(k3(x, y, z), r); };
const pane = (dx) => ["light_blue_stained_glass_pane", dx !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }];

// the exposed faces of a cell at height y: a side with no footprint cell, or one whose roof is already below y
const exposed = (c, y) => DIRS.filter(([dx, dz]) => { const n = cell(c.x + dx, c.z + dz); return !n || n.T <= y; });

// the facade block on a face with outward normal [dx, dz]: base, string course, glazing with piers, spandrel
const facade = (c, y, [dx, dz]) => {
  const u = dx !== 0 ? c.z : c.x, r = y & 3, ground = y < (c.g & ~3) + 4;
  if (y === c.g) return ["stone_bricks", null];
  if (r === 0) return ground ? ["stone_bricks", null] : ["light_gray_concrete", null];
  if (r === 3) return ["white_concrete", null];
  if (u % 3 === 0) return ["white_concrete", null];
  return pane(dx);
};

for (const c of at.values()) {
  const { x, z, g: gc, T } = c;
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks", null, "found");
  for (let y = gc; y <= T - 1; y++) {
    const dirs = exposed(c, y);
    if (dirs.length) {
      const [block, state] = facade(c, y, dirs[0]);
      put(x, y, z, block, state, "wall");
    } else if (y === T - 1) put(x, y, z, "gray_concrete", null, "deck");          // flat roof surface
    else if (y % 4 === 0 && y > gc) put(x, y, z, "smooth_stone", null, "slab");   // floor slab per storey
  }
  // coping on the outside edge of the roof
  if (DIRS.some(([dx, dz]) => !cell(x + dx, z + dz))) put(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }, "cap");
}

// a setback wall that starts over an empty course gets that course solid under it (no empty course under a tier)
for (const c of at.values()) for (let y = c.g + 1; y <= c.T - 1; y++) {
  if (role.get(k3(c.x, y, c.z)) === "wall" && !role.has(k3(c.x, y - 1, c.z))) put(c.x, y - 1, c.z, "light_gray_concrete", null, "support");
}

// ---- entrances on the street faces: a door in the base storey, a solid hood, two hanging lanterns ----
const outerOn = (dz, dx) => [...at.values()].filter((c) => !cell(c.x + dx, c.z + dz));
for (const [dx, dz] of [[0, -1], [0, 1]]) {
  const faces = outerOn(dz, dx).filter((c) => c.T >= c.g + 6);
  if (!faces.length) continue;
  const us = faces.map((c) => c.x).sort((a, b) => a - b);
  const u0 = us[us.length >> 1];
  const d = faces.reduce((best, c) => (Math.abs(c.x - u0) < Math.abs(best.x - u0) ? c : best));
  const facing = FACING[`${dx},${dz}`];
  for (const hy of [d.g, d.g + 1]) put(d.x, hy, d.z, "iron_door", { facing, half: hy === d.g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }, "door");
  for (let du = -2; du <= 2; du++) {
    const n = cell(d.x + du, d.z);
    if (n && !cell(d.x + du + dx, d.z + dz) && n.g <= d.g + 2 && n.T > d.g + 2) put(n.x, d.g + 2, n.z, "light_gray_concrete", null, "hood");
  }
  for (const du of [-1, 1]) {
    const n = cell(d.x + du, d.z);
    if (n && n.g <= d.g + 1) put(n.x, d.g + 1, n.z, "lantern", { hanging: "true", waterlogged: "false" }, "lamp");
  }
}

// ---- warm light behind some glazing: glowstone on the storey's floor slab, inside the air gap ----
for (const c of at.values()) for (let y = c.g + 1; y < c.T - 1; y++) {
  if ((y & 3) !== 1) continue;
  const dirs = exposed(c, y);
  if (!dirs.length) continue;
  const [dx, dz] = dirs[0], u = dx !== 0 ? c.z : c.x;
  if ((u * 7 + y * 5) % 11 !== 0) continue;
  const bx = c.x - dx, bz = c.z - dz;
  if (!cell(bx, bz) || role.has(k3(bx, y, bz)) || role.get(k3(bx, y - 1, bz)) !== "slab") continue;
  put(bx, y, bz, "glowstone", null, "lamp");
}

// ---- roof plant on the tower and one lower wing ----
const tops = [...at.values()].filter((c) => !exposed(c, c.T - 1).length);
for (const c of tops) {
  if (c.T === 24 && c.x >= 31 && c.x <= 34 && c.z >= 36 && c.z <= 40) {
    put(c.x, 24, c.z, "light_gray_concrete", null, "plant"); put(c.x, 25, c.z, "light_gray_concrete", null, "plant");
  } else if (c.T === 20 && c.x >= 10 && c.x <= 13 && c.z >= 12 && c.z <= 15) {
    put(c.x, 20, c.z, "white_concrete", null, "plant");
  }
}

for (const [k, [block, state]] of out) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const { blocks, palette } = g.save(OUT);
console.log(`way_258667471: ${blocks} blocks, ${palette} palette entries, ${cells.length} footprint cells`);
