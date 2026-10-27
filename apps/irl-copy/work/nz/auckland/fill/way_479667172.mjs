// Auckland CBD office tower (way 479667172), built from its lidar footprint record: a stone podium of shopfronts and
// a 2000s glass-and-concrete tower with setbacks, a cornice and roof plant. Storeys are 4 blocks (1.2 blocks a metre
// makes them about 3.3 m); every storey's floor plate is a 1-block slab, the air behind the glass is the room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${OUT}/way_479667172.cells.json`, "utf8"));
const g = new Voxels([104, 166, 100]);

const key = (x, z) => `${x},${z}`;
const fp = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

// Roof tiers: the lidar roof snapped to whole storeys (multiples of 4, at least 2 storeys), then a 3x3 median so the
// setbacks read as flat tiers rather than lidar noise.
const snapTop = ({ ground, roof }) => Math.max(8, Math.ceil(Math.max(Math.round(roof / 4) * 4, ground + 4) / 4) * 4);
const raw = new Map(cells.map(([x, z]) => [key(x, z), snapTop(fp.get(key(x, z)))]));
const T = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const v = raw.get(key(x + dx, z + dz)); if (v !== undefined) vals.push(v);
  }
  vals.sort((a, b) => a - b);
  T.set(key(x, z), vals[Math.floor(vals.length / 2)]);
}
const top = (x, z) => T.get(key(x, z));
const ground = (x, z) => fp.get(key(x, z)).ground;

// A side is exposed when the neighbour is outside the footprint or stands lower than this cell.
const exposed = (x, z, dx, dz) => {
  const n = key(x + dx, z + dz); if (!fp.has(n)) return true;
  return T.get(n) < top(x, z);
};
const isWall = (x, z) => DIRS.some(([dx, dz]) => exposed(x, z, dx, dz));

const TOWER = {
  found: "stone_bricks", base: "polished_granite", floor: "smooth_stone", spandrel: "white_concrete",
  frame: "white_concrete", cornice: "white_concrete", deck: "gray_concrete", glass: "light_blue_stained_glass_pane",
};
const PODIUM = {
  found: "stone_bricks", base: "polished_andesite", floor: "smooth_stone", spandrel: "stone_bricks",
  frame: "stone_bricks", cornice: "smooth_stone", deck: "gray_concrete", glass: "light_blue_stained_glass_pane",
};
const PANE = { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" };
const panes = [];

for (const [x, z, gr] of cells) {
  const t = top(x, z), perim = isWall(x, z);
  const M = t <= 24 ? PODIUM : TOWER;
  const expX = exposed(x, z, -1, 0) || exposed(x, z, 1, 0);
  const expZ = exposed(x, z, 0, -1) || exposed(x, z, 0, 1);
  // foundation under the cell, to its ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, M.found);
  for (let y = gr; y < t; y++) {
    if (y >= t - 3) { g.set(x, y, z, perim ? M.cornice : M.deck); continue; }   // cornice and roof deck
    if (y === gr) { g.set(x, y, z, perim ? M.base : M.floor); continue; }      // base course / ground floor
    if (y % 4 === 0) { g.set(x, y, z, perim ? M.spandrel : M.floor); continue; } // storey floor plate / spandrel
    if (!perim) continue;                                                        // air behind the glass
    const mull = (expX && expZ) || (expZ ? x % 3 === 0 : z % 3 === 0);
    if (M === PODIUM && y < 4) { g.set(x, y, z, mull ? "dark_oak_planks" : "glass"); continue; } // shopfront
    if (mull) { g.set(x, y, z, M.frame); continue; }
    g.set(x, y, z, M.glass, PANE); panes.push([x, y, z]);
  }
}

// Entrance: the podium's north-facing ground cells, a door at their middle, a lintel above, a warm light inside.
const north = cells.filter(([x, z]) => top(x, z) <= 24 && exposed(x, z, 0, -1)).map(([x, z]) => [x, z]);
const lowest = Math.min(...north.map(([x, z]) => ground(x, z)));
const door = north.filter(([x, z]) => ground(x, z) === lowest).sort((a, b) => a[0] - b[0]);
const mid = door[Math.floor(door.length / 2)];
const doorCells = door.filter(([x, z]) => z === mid[1] && Math.abs(x - mid[0]) <= 1).slice(0, 2);
doorCells.forEach(([x, z], k) => {
  const gr = ground(x, z);
  const hinge = k === 0 ? "left" : "right";
  g.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  g.set(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
  g.set(x, gr + 3, z, PODIUM.frame);
  if (fp.has(key(x, z + 1)) && !isWall(x, z + 1) && !g.get(x, gr + 1, z + 1)) g.set(x, gr + 1, z + 1, "glowstone");
});

// Warm light: glowstone in the air behind some windows.
for (const [x, y, z] of panes) {
  if ((x * 7 + z * 13 + y * 5) % 17 !== 0) continue;
  for (const [dx, dz] of DIRS) {
    const ix = x - dx, iz = z - dz; // the room side: opposite the exposed face
    if (!fp.has(key(ix, iz)) || isWall(ix, iz) || g.get(ix, y, iz)) continue;
    g.set(ix, y, iz, "glowstone"); break;
  }
}

// Glass panes connect to the solid frame and glass beside them, as the game draws them.
const solid = (b) => b && /pane|concrete|stone|glass|planks/.test(b.block);
for (const [x, y, z] of panes) {
  const c = { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" };
  const n = { east: [1, 0], west: [-1, 0], north: [0, -1], south: [0, 1] };
  for (const [side, [dx, dz]] of Object.entries(n)) if (solid(g.get(x + dx, y, z + dz))) c[side] = "true";
  g.set(x, y, z, TOWER.glass, c);
}

// Roof plant on the top tier: a few plant boxes inside the cornice and a lightning rod on the centre. The podium deck
// stays clean (scattered pads read as stray blocks from the air).
const maxT = Math.max(...T.values());
const top_ = cells.filter(([x, z]) => top(x, z) === maxT);
const cx = top_.reduce((s, [x]) => s + x, 0) / top_.length, cz = top_.reduce((s, [, z]) => s + z, 0) / top_.length;
for (const [x, z] of top_) {
  if (isWall(x, z) || Math.hypot(x - cx, z - cz) > 9) continue;
  const boxed = (x % 4 === 1) && (z % 4 === 1);
  if (boxed) for (let y = maxT; y < maxT + 3; y++) g.set(x, y, z, "light_gray_concrete");
}
const rod = top_.reduce((best, c) => (Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? c : best));
for (let y = maxT; y < maxT + 6; y++) g.set(rod[0], y, rod[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// Stray blocks: a facade or roof block with no solid neighbour on any side is lidar or stair-step debris; drop it.
// Glass, lights, doors and the rod are kept whatever their neighbours.
const KEEP = /glowstone|lightning|door|pane|glass/;
const stray = [];
g.forEachCell((i) => {
  const [X, Y, Z] = g.size, x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  const b = g.get(x, y, z); if (!b || KEEP.test(b.block) || y < 24) return;
  const nb = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  if (nb.every(([dx, dy, dz]) => !g.get(x + dx, y + dy, z + dz))) stray.push([x, y, z]);
});
for (const [x, y, z] of stray) g.set(x, y, z, "air");

const info = g.save(`${OUT}/way_479667172.nbt`);
console.log(JSON.stringify({ ...info, maxT, footprint: cells.length, strayRemoved: stray.length, entrance: doorCells }));
