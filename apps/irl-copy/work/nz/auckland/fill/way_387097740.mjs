// Mt Eden / Newton: a 1930s reinforced-concrete commercial block, stucco over concrete (cream smooth quartz), a stone
// base course, terracotta friezes, shopfronts with striped awnings on the ground floor, and a stepped massing: a two-storey
// core set back behind a one-storey ring, lower wings, all on the lidar roof heights. Windows are glass panes with an
// air gap behind and a glowstone further in for some of them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_387097740.cells.json", "utf8"));
const W = 28, H = 26, D = 51;
const FLOOR0 = 6;                       // the ground-floor level: the uphill ground of the bulk; storeys are 4 blocks above it
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

const at = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { x, z, g, r }]));
const has = (x, z) => at.has(`${x},${z}`);
const faces = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));   // outward sides that face open ground

// depth: 1 on the outside wall, 2 behind it, ... (a 2-D breadth-first walk in from the edge of the footprint)
const depth = new Map(); const queue = [];
for (const c of at.values()) if (faces(c.x, c.z).length) { depth.set(`${c.x},${c.z}`, 1); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const { x, z } = queue[i], d = depth.get(`${x},${z}`);
  for (const [dx, dz] of DIRS) { const k = `${x + dx},${z + dz}`; if (has(x + dx, z + dz) && !depth.has(k)) { depth.set(k, d + 1); queue.push({ x: x + dx, z: z + dz }); } }
}

// the roof tier from the lidar height: smoothed to three flat levels (two-storey core, one-storey ring, one-storey wing)
const topOf = (r, d) => (r >= 12 ? (d >= 2 ? 14 : 11) : r >= 9 ? 11 : 10);

// the grid of block specs; undefined is air
const grid = new Array(W * H * D);
const idx = (x, y, z) => (z * H + y) * W + x;
const put = (x, y, z, b, s) => { grid[idx(x, y, z)] = { b, s }; };
const gaps = [], lights = [];

// the entrance: a single-face wall cell of the bulk nearest the footprint's centre
const cx = cells.reduce((a, c) => a + c[0], 0) / cells.length, cz = cells.reduce((a, c) => a + c[1], 0) / cells.length;
let door = null;
for (const c of at.values()) {
  const f = faces(c.x, c.z);
  if (f.length !== 1 || c.g < FLOOR0 || (depth.get(`${c.x},${c.z}`) ?? 0) !== 1) continue;
  const dd = Math.hypot(c.x - cx, c.z - cz);
  if (!door || dd < door.dd) door = { x: c.x, z: c.z, dir: f[0], dd };
}
const doorAlong = (dir) => (dir[0] !== 0 ? door.z : door.x);

for (const c of at.values()) {
  const { x, z, g, r } = c;
  const d = depth.get(`${x},${z}`) ?? 0;
  const f = faces(x, z), isFace = f.length > 0;
  const top = topOf(r, d);
  for (let y = 0; y < top; y++) {
    if (y < g) { put(x, y, z, "stone_bricks"); continue; }                  // foundation up to this cell's ground
    if (y === top - 1) { put(x, y, z, isFace ? "stone_bricks" : "gray_concrete"); continue; }   // coping, or the flat roof
    const k = Math.floor((y - FLOOR0) / 4), rel = y - (FLOOR0 + 4 * k);      // rel 0 belt, 1-2 window, 3 frieze
    if (!isFace) { put(x, y, z, rel === 0 ? "polished_andesite" : "smooth_quartz"); continue; }
    const joined = DIRS.filter(([dx, dz]) => has(x + dx, z + dz)).length;
    if (f.length > 1 && joined >= 2) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }   // quoins at the corners of the bulk
    if (f.length > 1) { put(x, y, z, rel === 0 ? "polished_andesite" : rel === 3 ? "terracotta" : "smooth_quartz"); continue; }   // a free-standing column of the footprint: plain wall
    const [dx, dz, name] = f[0];
    if (rel === 0) { put(x, y, z, "polished_andesite"); continue; }
    if (rel === 3) {
      // the frieze, with an awning over the entrance on the ground floor
      const t = dx !== 0 ? z : x;
      if (k === 0 && door && door.dir[2] === name && Math.abs(doorAlong(door.dir) - t) <= 1 && (dx !== 0 ? door.x === x : door.z === z)) {
        const t0 = doorAlong(door.dir);
        put(x, y, z, t === t0 ? "red_wool" : "white_wool");
      } else put(x, y, z, "terracotta");
      continue;
    }
    // rel 1-2: the door (lower and upper half), a glazed bay, or a pier
    if (door && x === door.x && z === door.z && k === 0) {
      put(x, y, z, "dark_oak_door", { facing: name, half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const t = dx !== 0 ? z : x;
    const bay = t % 3 !== 0;                                  // every third column is a pier
    if (!bay) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
    const pane = dx !== 0 ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
                          : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
    put(x, y, z, "glass_pane", pane);
    // air gap one cell in, then a light two cells in (some windows; every shopfront bay at dusk)
    const in1 = at.has(`${x - dx},${z - dz}`), in2 = at.has(`${x - 2 * dx},${z - 2 * dz}`);
    if (in1) gaps.push([x - dx, y, z - dz]);
    const lit = k === 0 ? t % 2 === 0 : (t + k * 2) % 3 === 0;
    if (in1 && in2 && lit) lights.push([x - 2 * dx, y, z - 2 * dz]);
  }
}

// rooftop plant on the two-storey core, a few boxes: they stand on the roof they sit on
for (const c of at.values()) {
  const d = depth.get(`${c.x},${c.z}`) ?? 0;
  if (topOf(c.r, d) === 14 && d >= 3 && (c.x * 3 + c.z * 5) % 11 === 0) {
    put(c.x, 14, c.z, "light_gray_concrete"); put(c.x, 15, c.z, "light_gray_concrete");
  }
}

for (const [x, y, z] of gaps) grid[idx(x, y, z)] = undefined;           // air behind the glass
for (const [x, y, z] of lights) put(x, y, z, "glowstone");

const v = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const s = grid[idx(x, y, z)]; if (s) v.set(x, y, z, s.b, s.s);
}
v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_387097740.nbt");
