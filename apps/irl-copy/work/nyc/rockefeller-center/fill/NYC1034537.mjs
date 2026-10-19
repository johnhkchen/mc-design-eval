// 5 West 53 Street, 1982 multi-family elevator building (PLUTO class: Multi-Family Elevator Buildings). A 20 x 31 slab
// about 162 blocks (about 180 m) to the roof: a 1980s Midtown apartment tower on a granite base, with pale precast
// spandrels and piers, tinted glass in between, and a stepped roof: the tower at 162, a wing at 150 and a low corner
// strip at 144 (lidar tiers, smoothed with a 3 x 3 median so the noise cells of 7 to 30 are outvoted). Storeys are 3
// blocks, so every tier is a whole number of storeys. Ground is 0 under every cell, so there is no foundation fill.
// Frontage is the low-z face (53rd Street): a shopfront along its ground storey and a two-door entrance at x 9-10
// under a stone canopy, with lanterns hung from it. The glass is one block out from a solid core, with an air gap
// behind it and a floor slab per storey (no interiors). Warm glowstone sits in some of the gaps behind the glass. A
// mechanical penthouse with a louvred band stands on the tower roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034537.cells.json`, "utf8"));
const X = 20, Y = 174, Z = 31;

const lidar = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const inFoot = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && lidar.has(`${x},${z}`);

// Clean roof tops (block tops above y 0), from the median of each cell's 3 x 3 lidar neighbourhood.
const medianLidar = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (inFoot(x + dx, z + dz) && lidar.get(`${x + dx},${z + dz}`) >= 100) v.push(lidar.get(`${x + dx},${z + dz}`));
  }
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const TOP = new Map();
for (const key of lidar.keys()) {
  const [x, z] = key.split(",").map(Number);
  const m = medianLidar(x, z);
  TOP.set(key, m >= 157 ? 162 : m >= 147 ? 150 : 144);   // tower 162 (54 storeys), wing 150, low corner strip 144
}
const top = (x, z) => TOP.get(`${x},${z}`) ?? 0;
const solid = (x, y, z) => inFoot(x, z) && top(x, z) > y;

// Depth inside the shell at height y: 1 = facade (touches outside or a lower tier), 2 = the gap behind the facade,
// 3 and deeper = the solid core. A breadth-first walk inward from the facade, so the setbacks read on every tier.
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function depthLayer(y) {
  const D = new Uint8Array(X * Z);
  let front = [];
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    if (solid(x, y, z) && N4.some(([dx, dz]) => !solid(x + dx, y, z + dz))) { D[z * X + x] = 1; front.push([x, z]); }
  }
  for (let d = 2; front.length; d++) {
    const next = [];
    for (const [x, z] of front) for (const [dx, dz] of N4) {
      const nx = x + dx, nz = z + dz;
      if (nx < 0 || nz < 0 || nx >= X || nz >= Z || D[nz * X + nx] || !solid(nx, y, nz)) continue;
      D[nz * X + nx] = d; next.push([nx, nz]);
    }
    front = next;
  }
  return D;
}

const uOf = (x, z) => (z === 0 || z === Z - 1 ? x : z);   // position along the face the cell is on

// The facade block at a facade cell (depth 1, below its top). kind says what sits behind it.
function facadeOf(x, y, z) {
  const u = uOf(x, z);
  if (y === 0) return { kind: "base", block: "polished_granite" };
  if (z === 0 && y <= 2) {                                   // street frontage: shopfront and entrance
    if (x === 9 || x === 10) return { kind: "entry", block: "dark_oak_door", state: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 9 ? "left" : "right", open: "false", powered: "false" } };
    if (x === 8 && y === 2) return { kind: "entry", block: "lantern", state: { hanging: "true", waterlogged: "false" } };
    if (x === 8 || x === 11) return { kind: "entry", block: "glass" };
    if (u % 3 === 0) return { kind: "pier", block: "smooth_stone" };
    return { kind: "entry", block: "glass" };
  }
  if (z === 0 && y === 3 && x >= 7 && x <= 12) return { kind: "canopy", block: "polished_andesite" };
  if (y % 3 === 0) return { kind: "spandrel", block: "smooth_quartz" };
  if (u % 3 === 0) return { kind: "pier", block: "light_gray_concrete" };
  const blue = (u * 7 + y) % 11 === 0;
  return { kind: "glass", block: blue ? "light_blue_stained_glass" : "gray_stained_glass" };
}
const lit = (u, y) => (u * 5 + y * 7) % 13 === 0;   // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);
const maxTop = Math.max(...TOP.values());
for (let y = 0; y < maxTop; y++) {
  const D = depthLayer(y);
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const d = D[z * X + x];
    if (!d) continue;
    if (y === top(x, z) - 1) { g.set(x, y, z, "smooth_stone"); continue; }   // cornice and roof cover on every top
    if (d === 1) { const f = facadeOf(x, y, z); g.set(x, y, z, f.block, f.state); continue; }
    if (y === 0) { g.set(x, y, z, "smooth_stone"); continue; }             // lobby and plinth floor
    if (d === 2 && y === 3 && z === 1 && x >= 7 && x <= 12) { g.set(x, y, z, "polished_andesite"); continue; }   // canopy depth
    if (d === 2 && y % 3 !== 0) {                                          // the gap behind a window row
      let glass = null;
      for (const [dx, dz] of N4) {
        const nx = x + dx, nz = z + dz;
        if (nx < 0 || nz < 0 || nx >= X || nz >= Z || D[nz * X + nx] !== 1) continue;
        const f = facadeOf(nx, y, nz);
        if (f.kind === "glass" || f.kind === "entry") { glass = { f, u: uOf(nx, nz) }; break; }
      }
      if (glass) {
        if (glass.f.kind === "glass" && lit(glass.u, y)) g.set(x, y, z, "glowstone");   // warm light behind the pane
        continue;                                                           // air: the room behind the glass
      }
    }
    g.set(x, y, z, "light_gray_concrete");   // floor slabs (every third row) and the solid core
  }
}

// Mechanical penthouse on the tower roof (x 7-12, z 13-19): a precast box with a louvred band and a cap.
for (let z = 13; z <= 19; z++) for (let x = 7; x <= 12; x++) {
  const ring = x === 7 || x === 12 || z === 13 || z === 19;
  for (let y = 162; y <= 164; y++) {
    if (y === 164) g.set(x, y, z, "smooth_stone");
    else if (ring && y === 163) g.set(x, y, z, "iron_bars");
    else g.set(x, y, z, "light_gray_concrete");
  }
}

const out = g.save(`${DIR}/NYC1034537.nbt`);
console.log(JSON.stringify({ ...out, size: g.size, tops: [...new Set(TOP.values())] }));
