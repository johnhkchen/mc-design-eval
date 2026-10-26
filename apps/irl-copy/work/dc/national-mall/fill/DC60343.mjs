// DC60343: a Federal Triangle-style Neoclassical office block (1930s), pale limestone over a stone plinth, with a
// tower core on a podium and setbacks. Massing follows the lidar roof, median-smoothed into flat tiers (11/12/13/14).
// Every voxel of a cell sits on the one below it (each cell is a column from y 0 to its tier), so nothing floats.
// Storey lines are absolute: string courses at y 4, 7, 10, 13; window bands between them; plinth at y 0-1.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC60343.nbt";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC60343.cells.json", "utf8"));

const W = 20, D = 16, H = 26;
const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inFoot = (x, z) => raw.has(key(x, z));

// roof tier: the median of the 3x3 lidar roof heights around each cell, as a flat tier
const tier = new Map();
for (const [k, { g, r }] of raw) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) vals.push(raw.get(key(x + dx, z + dz)).r);
  vals.sort((a, b) => a - b);
  tier.set(k, { g, R: vals[Math.floor(vals.length / 2)] });
}
const cell = (x, z) => tier.get(key(x, z));

// a voxel's side is outside when its neighbour is off the footprint or has its roof below this height
const exposedX = (x, z, y) => [-1, 1].some((dx) => { const n = cell(x + dx, z); return !n || y >= n.R; });
const exposedZ = (x, z, y) => [-1, 1].some((dz) => { const n = cell(x, z + dz); return !n || y >= n.R; });

const STRING = new Set([4, 7, 10, 13]);
const WINDOW_ROWS = new Set([2, 3, 5, 6, 8, 9, 11, 12]);
const ENTRY = { x: 10, z: 0 };           // the street-side portal on the low (z=0) face

const g = new Voxels([W, H, D]);
const glass = new Set();                 // "x,y,z" of every window pane, for the air gap behind it
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const pane = (ax) => ({ north: String(ax === "z" ? false : true), south: String(ax === "z" ? false : true),
  east: String(ax === "z" ? true : false), west: String(ax === "z" ? true : false) });
// facade faces: 'x' = wall runs along x (outward normal in z), 'z' = wall runs along z
const facadeAxis = (x, z, y) => {
  const ex = exposedX(x, z, y), ez = exposedZ(x, z, y);
  if (ex && ez) return "corner";
  return ez ? "x" : ex ? "z" : null;
};

// pass 1: the solid massing and the facade
for (const [k, { g: gr, R }] of tier) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < R; y++) {
    const face = facadeAxis(x, z, y);
    const top = y === R - 1;
    if (!face) {                                  // interior: solid core, roof membrane on top
      put(x, y, z, top ? "smooth_stone" : "stone");
      continue;
    }
    if (top) { put(x, y, z, "smooth_quartz"); continue; }                       // parapet / cornice
    if (y <= 1 || y < gr) { put(x, y, z, "stone_bricks"); continue; }          // base course
    if (STRING.has(y) || !WINDOW_ROWS.has(y)) { put(x, y, z, "smooth_quartz"); continue; }
    const idx = face === "x" ? x : z;
    if (face === "corner" || idx % 3 === 2) { put(x, y, z, "smooth_quartz"); continue; }   // quoins and piers
    put(x, y, z, "light_blue_stained_glass_pane", pane(face));
    glass.add(`${x},${y},${z}`);
  }
}

// pass 2: the entrance on the low face, a portal with a door and lintel
{
  const { x, z } = ENTRY;
  const side = { facing: "north", hinge: "left", open: "false", powered: "false" };
  put(x, 1, z, "dark_oak_door", { ...side, half: "lower" });
  put(x, 2, z, "dark_oak_door", { ...side, half: "upper" });
  put(x - 1, 2, z, "smooth_quartz"); put(x - 1, 3, z, "smooth_quartz");
  put(x + 1, 2, z, "smooth_quartz"); put(x + 1, 3, z, "smooth_quartz");
  for (const dx of [-1, 0, 1]) put(x + dx, 3, z, "smooth_quartz");  // lintel over the portal
}

// pass 3: air gap behind the glass, with a warm light behind some windows; floor slabs are the solid core
for (const [k, { R }] of tier) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 2; y < R; y++) {
    if (facadeAxis(x, z, y)) continue;
    const behindGlass = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => glass.has(`${x + dx},${y},${z + dz}`));
    if (!behindGlass) continue;
    const light = (x * 7 + z * 13 + y * 3) % 9 === 0 && y % 3 === 2;   // a few, on the upper row of each band
    put(x, y, z, light ? "glowstone" : "air");
  }
}

// pass 4: roof equipment: a penthouse on the tower core, with a lantern on its roof
for (const [x, z] of [[4, 7], [5, 7], [4, 8], [5, 8]]) {
  const c = cell(x, z);
  if (!c || c.R !== 14) continue;
  for (let y = 14; y <= 15; y++) put(x, y, z, "stone_bricks");
  put(x, 16, z, "smooth_quartz");
  if (x === 4 && z === 7) put(x, 17, z, "lantern", { hanging: "false" });
}

g.save(OUT);
const tiers = {};
for (const { R } of tier.values()) tiers[R] = (tiers[R] || 0) + 1;
console.log(JSON.stringify({ blocks: g.count(), palette: g.palette.length, tiers }));
