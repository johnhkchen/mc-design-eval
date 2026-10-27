// A Block, Auckland: a 1980s concrete-frame office block, nine storeys (36 blocks at 4 a storey) on a
// stepped plan: the lidar's roof per cell is median-smoothed and quantised to storey tiers (8, 12 ... 36).
// Facade: a stone plinth, shopfront glazing on the ground storey, then per storey a light-gray floor band, two
// rows of light-blue glass panes between white-concrete mullions, and a white spandrel. Inside: air behind the
// glass, a floor slab per storey, a structural column grid, and warm lights behind some panes (on the slab below).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const W = 72, D = 88, H = 49;
const cells = JSON.parse(readFileSync(`${DIR}/way_1186688040.cells.json`, "utf8"));

const ground = new Int8Array(W * D).fill(-1), raw = new Int16Array(W * D).fill(-1);
for (const [x, z, g, r] of cells) { ground[z * W + x] = g; raw[z * W + x] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[z * W + x] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// the roof tier per cell: the 3x3 median of the lidar roof (noise and stray low cells out), then whole storeys
const tier = new Int16Array(W * D).fill(-1);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) vals.push(raw[(z + dz) * W + x + dx]);
  vals.sort((a, b) => a - b);
  tier[z * W + x] = Math.min(36, Math.max(8, Math.round(vals[vals.length >> 1] / 4) * 4));
}

// the sides of a cell that face outside the footprint, and the sides where a neighbour's roof is below height y
const exposed = (x, z, y) => {
  const out = [], step = [];
  for (const [dx, dz] of DIRS) {
    if (!inside(x + dx, z + dz)) out.push([dx, dz]);
    else if (tier[(z + dz) * W + x + dx] <= y) step.push([dx, dz]);
  }
  return { out, step };
};
const isFacade = (x, z, y) => { const e = exposed(x, z, y); return e.out.length + e.step.length > 0; };

const g = new Voxels([W, H, D]);
const filled = new Set();
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); filled.add(`${x},${y},${z}`); };

// the entrance: the ground-floor face with the most outside cells, its door at the cell nearest the face's middle
const faceCount = new Map();
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (inside(x, z))
  for (const d of exposed(x, z, 1).out) { const k = `${d[0]},${d[1]}`; faceCount.set(k, (faceCount.get(k) ?? 0) + 1); }
const [entryKey] = [...faceCount.entries()].sort((a, b) => b[1] - a[1])[0];
const entry = entryKey.split(",").map(Number);
const onFace = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++)
  if (inside(x, z) && exposed(x, z, 1).out.some(d => d[0] === entry[0] && d[1] === entry[1])) onFace.push([x, z]);
const along = (c) => (entry[0] !== 0 ? c[1] : c[0]);
onFace.sort((a, b) => along(a) - along(b));
const [dx0, dz0] = onFace[onFace.length >> 1];
const facing = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" }[entryKey];
const special = new Map();
const doorState = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
special.set(`${dx0},1,${dz0}`, ["dark_oak_door", doorState("lower")]);
special.set(`${dx0},2,${dz0}`, ["dark_oak_door", doorState("upper")]);
special.set(`${dx0},3,${dz0}`, ["stone_bricks"]);
const flanks = entry[0] !== 0 ? [[dx0, dz0 - 1], [dx0, dz0 + 1]] : [[dx0 - 1, dz0], [dx0 + 1, dz0]];
for (const [fx, fz] of flanks) {
  if (!inside(fx, fz) || !exposed(fx, fz, 1).out.some(d => d[0] === entry[0] && d[1] === entry[1])) continue;
  special.set(`${fx},1,${fz}`, ["light_gray_concrete"]);
  special.set(`${fx},2,${fz}`, ["light_gray_concrete"]);
  special.set(`${fx},3,${fz}`, ["stone_bricks"]);
}

const PANE_OFF = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
const panes = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const gr = ground[z * W + x], t = tier[z * W + x], col = x % 8 === 4 && z % 8 === 4;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");                       // foundation: solid down to the lowest ground
  for (let y = gr; y < t; y++) {
    const key = `${x},${y},${z}`, r = y & 3, k = y >> 2;
    if (special.has(key)) { const [b, s] = special.get(key); put(x, y, z, b, s); continue; }
    if (y === t - 1) { put(x, y, z, "light_gray_concrete"); continue; }            // roof cap, solid over the whole tier
    const e = exposed(x, z, y);
    if (!e.out.length && !e.step.length) {                                           // interior: slab per storey, column grid
      if (col) put(x, y, z, "white_concrete");
      else if (r === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (r === 0) { put(x, y, z, k === 0 ? "stone_bricks" : "light_gray_concrete"); continue; }   // plinth / floor band
    if (r === 3) { put(x, y, z, "white_concrete"); continue; }                                    // spandrel
    if ((x + z) % 3 === 0) { put(x, y, z, "light_gray_concrete"); continue; }                     // mullion
    const sides = e.out.length ? e.out : e.step;
    const face = sides[(x + z) % sides.length];
    const outward = e.out.some(d => d[0] === face[0] && d[1] === face[1]);
    panes.push({ x, y, z, face, outward });
    put(x, y, z, "light_blue_stained_glass_pane", PANE_OFF);
  }
  const top = exposed(x, z, t);
  if (top.out.length) put(x, t, z, "white_concrete");                                       // parapet on the outer edge
}

// panes join their in-plane neighbours (glass or any solid in the same facade line)
for (const p of panes) {
  const st = { ...PANE_OFF };
  if (p.face[0] !== 0) {   // an x-facing face runs along z
    if (filled.has(`${p.x},${p.y},${p.z - 1}`)) st.north = "true";
    if (filled.has(`${p.x},${p.y},${p.z + 1}`)) st.south = "true";
  } else {
    if (filled.has(`${p.x - 1},${p.y},${p.z}`)) st.west = "true";
    if (filled.has(`${p.x + 1},${p.y},${p.z}`)) st.east = "true";
  }
  g.set(p.x, p.y, p.z, "light_blue_stained_glass_pane", st);
}

// warm lights behind some outer windows: in the air gap, on the floor slab below, never on a column
let lights = 0;
for (const p of panes) {
  const k = p.y >> 2;
  if (!p.outward || k < 1 || (p.y & 3) !== 1) continue;
  if ((p.x * 5 + p.z * 3 + k * 7) % 9 !== 0) continue;
  const ix = p.x - p.face[0], iz = p.z - p.face[1];
  if (!inside(ix, iz) || tier[iz * W + ix] <= p.y || isFacade(ix, iz, p.y)) continue;
  if (filled.has(`${ix},${p.y},${iz}`) || !filled.has(`${ix},${p.y - 1},${iz}`)) continue;
  if (ix % 8 === 4 && iz % 8 === 4) continue;
  put(ix, p.y, iz, (p.x + p.z) % 2 ? "shroomlight" : "glowstone");
  lights++;
}

// roof plant: a solid box on the top tier, set in from the parapet (core cells: four neighbours on the same tier)
const top = (x, z) => inside(x, z) && tier[z * W + x] === 36;
const core = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++)
  if (top(x, z) && DIRS.every(([dx, dz]) => top(x + dx, z + dz))) core.push([x, z]);
const cx = Math.round(core.reduce((s, c) => s + c[0], 0) / core.length);
const cz = Math.round(core.reduce((s, c) => s + c[1], 0) / core.length);
for (const [x, z] of core) {
  if (Math.abs(x - cx) > 6 || Math.abs(z - cz) > 4) continue;
  for (let y = 36; y <= 38; y++) put(x, y, z, y === 38 ? "white_concrete" : "light_gray_concrete");
}

const out = `${DIR}/way_1186688040.nbt`;
const info = g.save(out);
console.log(`built: ${info.blocks} blocks, ${info.palette} palette, ${panes.length} panes, ${lights} lights, entrance facing ${facing} at ${dx0},${dz0}`);
