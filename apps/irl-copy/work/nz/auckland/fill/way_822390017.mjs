// New Zealand International Convention Centre (OSM way 822390017): a glazed, precast-concrete convention block on a
// volcanic-basalt plinth. The lidar roof sets the massing (median-smoothed, 2-block steps); each column is solid from
// y 0 to its ground, then a shell of storeys: glass in a concrete grid, a basalt base course, a parapet, a shell of air
// behind the glass with a floor slab per storey. Two recessed entrances with doors and canopies, lit windows, a roof plant room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_822390017.cells.json`, "utf8"));

const W = 169, D = 144, H = 59;
const g = new Voxels([W, H, D]);

// Per-column arrays: ground (-1 = outside the footprint) and the smoothed roof top.
const groundAt = new Int16Array(W * D).fill(-1);
const rawRoof = new Int16Array(W * D);
for (const [x, z, ground, roof] of cells) { groundAt[z * W + x] = ground; rawRoof[z * W + x] = roof; }
const inFP = (x, z) => x >= 0 && z >= 0 && x < W && z < D && groundAt[z * W + x] >= 0;

// Lidar noise into flat tiers: median of a 5x5 neighbourhood, snapped to 2 blocks, at least one storey above ground.
const topAt = new Int16Array(W * D).fill(-1);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = z * W + x; if (groundAt[i] < 0) continue;
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inFP(x + dx, z + dz)) vals.push(rawRoof[(z + dz) * W + x + dx]);
  vals.sort((a, b) => a - b);
  topAt[i] = Math.max(2 * Math.round(vals[vals.length >> 1] / 2), groundAt[i] + 4);
}

const solid = (x, y, z) => inFP(x, z) && (y < groundAt[z * W + x] || y < topAt[z * W + x]);
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const exposedDir = (x, y, z) => DIRS.find(([dx, dz]) => !solid(x + dx, y, z + dz));
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

// Facade grammar on the shell: basalt base course, spandrels, transoms, a continuous shopfront, then glass between piers.
function facadeBlock(x, y, z, G, [dx, dz]) {
  if (y === G) return "polished_basalt";
  if (y % 4 === 0) return "light_gray_concrete";
  if (y % 4 === 3) return "white_concrete";
  if (y < G + 4) return "light_blue_stained_glass";
  const u = dz !== 0 ? x : z;
  if (u % 4 === 0) return "white_concrete";
  return hash(x, y, z) % 6 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass";
}

let facades = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = z * W + x, G = groundAt[i]; if (G < 0) continue;
  const T = topAt[i];
  for (let y = 0; y < T; y++) {
    if (y < G) { g.set(x, y, z, "polished_basalt"); continue; }       // foundation: solid from y 0 up to the ground
    const out = exposedDir(x, y, z);
    if (y === T - 1) { g.set(x, y, z, out ? "white_concrete" : "smooth_stone"); continue; }   // parapet edge, roof deck
    if (out) { g.set(x, y, z, facadeBlock(x, y, z, G, out)); facades++; continue; }
    if (y === G || y % 4 === 0) g.set(x, y, z, "smooth_stone");        // floor slab per storey; interior air between
  }
}

// Entrances: a recessed bay of three on a face, two iron doors at its centre, glass either side, a canopy overhead, lanterns.
function entranceSites(dx, dz) {
  const [ax, az] = dz !== 0 ? [1, 0] : [0, 1];
  const sites = [];
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const i = z * W + x, G = groundAt[i]; if (G < 0) continue;
    const y = G + 1; if (y + 4 >= topAt[i]) continue;
    let ok = true;
    for (const b of [-1, 0, 1]) {
      const bx = x + b * ax, bz = z + b * az;
      if (!inFP(bx, bz) || groundAt[bz * W + bx] !== G || topAt[bz * W + bx] <= y + 4) { ok = false; break; }
      if (solid(bx + dx, y, bz + dz) || !inFP(bx - dx, bz - dz)) { ok = false; break; }
    }
    if (ok) sites.push({ x, z, G, u: dz !== 0 ? x : z });
  }
  return sites;
}

function carveEntrance(site, [dx, dz, name]) {
  const { x, z, G } = site, [ax, az] = dz !== 0 ? [1, 0] : [0, 1];
  const at = (b, k) => [x + b * ax - k * dx, z + b * az - k * dz];   // k = 0 facade line, 1 recess back wall, 2 lobby
  for (const b of [-1, 0, 1]) {
    const [x0, z0] = at(b, 0), [x1, z1] = at(b, 1);
    g.set(x0, G + 1, z0, "air"); g.set(x0, G + 2, z0, "air");
    g.set(x0, G + 3, z0, "white_concrete"); g.set(x1, G + 3, z1, "white_concrete");   // canopy over the recess
  }
  for (const b of [-1, 1]) {
    const [x1, z1] = at(b, 1), [x0, z0] = at(b, 0);
    g.set(x1, G + 1, z1, "light_blue_stained_glass"); g.set(x1, G + 2, z1, "light_blue_stained_glass");
    g.set(x0, G + 2, z0, "lantern", { hanging: "true", waterlogged: "false" });   // hanging lanterns under the canopy
  }
  const [mx, mz] = at(0, 1);
  g.set(mx, G + 1, mz, "iron_door", { facing: name, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(mx, G + 2, mz, "iron_door", { facing: name, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Two entrances: the face with the most valid bays, and the next face round; each at its middle.
const faces = DIRS.map((d) => ({ d, sites: entranceSites(d[0], d[1]) })).filter((f) => f.sites.length)
  .sort((a, b) => b.sites.length - a.sites.length);
for (const f of faces.slice(0, 2)) {
  const s = f.sites.sort((a, b) => a.u - b.u);
  carveEntrance(s[s.length >> 1], f.d);
}

// Warm light: a glowstone behind some of the glass, in the air gap inside the window.
let lamps = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const i = z * W + x, G = groundAt[i]; if (G < 0) continue;
  const T = topAt[i];
  for (let y = G + 1; y < T - 1; y++) {
    if (y % 4 !== 1 && y % 4 !== 2) continue;
    const out = exposedDir(x, y, z); if (!out || hash(x, y, z) % 9 !== 0) continue;
    const [dx, dz] = out, ix = x - dx, iz = z - dz;
    if (!inFP(ix, iz) || exposedDir(ix, y, iz) || y === groundAt[iz * W + ix]) continue;
    g.set(ix, y, iz, "glowstone"); lamps++;
  }
}

// Roof plant room: a 12 x 6 enclosure on the highest tier, louvred on its long sides.
const hiTop = Math.max(...topAt);
const hi = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (topAt[z * W + x] === hiTop) hi.push([x, z]);
const cx = hi.reduce((s, p) => s + p[0], 0) / hi.length, cz = hi.reduce((s, p) => s + p[1], 0) / hi.length;
let plant = null;
for (const [x0, z0] of hi) {
  let whole = true;
  for (let dz = 0; dz < 6 && whole; dz++) for (let dx = 0; dx < 12 && whole; dx++) {
    const x = x0 + dx, z = z0 + dz; whole = inFP(x, z) && topAt[z * W + x] === hiTop;
  }
  if (!whole) continue;
  const d = Math.hypot(x0 + 6 - cx, z0 + 3 - cz);
  if (!plant || d < plant.d) plant = { x0, z0, d };
}
if (plant) {
  const { x0, z0 } = plant;
  for (let dz = 0; dz < 6; dz++) for (let dx = 0; dx < 12; dx++) {
    const x = x0 + dx, z = z0 + dz, edge = dx === 0 || dz === 0 || dx === 11 || dz === 5;
    for (let y = hiTop; y < hiTop + 3; y++) {
      if (!edge) { if (y === hiTop + 2) g.set(x, y, z, "smooth_stone"); continue; }
      const louvre = (dz === 0 || dz === 5) && dx % 2 === 1 && y === hiTop + 1;
      g.set(x, y, z, y === hiTop + 2 ? "smooth_stone" : louvre ? "iron_bars" : "light_gray_concrete");
    }
  }
}

// Green roofs on the mid tiers: 2 x 2 shrub clumps on the open roof decks, set in from the edges.
for (let z = 1; z < D - 1; z++) for (let x = 1; x < W - 1; x++) {
  const i = z * W + x, T = topAt[i];
  if (groundAt[i] < 0 || T < 20 || T > 40 || x % 8 < 3 || x % 8 > 4 || z % 8 < 3 || z % 8 > 4) continue;
  if (![[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => inFP(x + dx, z + dz) && topAt[(z + dz) * W + x + dx] === T)) continue;
  g.set(x, T, z, "oak_leaves", { persistent: "true", waterlogged: "false" });
}

const out = `${DIR}/way_822390017.nbt`;
const saved = g.save(out);
console.log(JSON.stringify({ file: out, facades, lamps, entrances: faces.slice(0, 2).map((f) => f.d[2]), plant: !!plant, ...saved }));
