// A 1930s–50s reinforced-concrete commercial block (Stripped Classical, the Auckland office/shop type of the period):
// white concrete frame, smooth quartz string courses and cornice, a stone-base, glass shopfronts on the ground floor and
// ribbon-pier windows above, five storeys of 4 blocks. Lidar roof tiers are smoothed: a low wing, the 21-block main
// body, and a 25-block tower tier where the lidar is clearly higher. No interiors: an air gap behind the glass, a floor
// slab per storey, a roof membrane; warm lights sit in that gap.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_24020870.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_24020870.nbt`;

const X = 53, Y = 38, Z = 59;
const WING = 6, MAIN = 21, TOWER = 25;     // roof tiers (blocks above y 0): lower wing, main body, setback tower
const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(key(x, z), { g, r });
const inFp = (x, z) => fp.has(key(x, z));

// Outward faces of an edge cell: N = -z, S = +z, W = -x, E = +x. Interior cells have none.
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const outward = (x, z) => FACES.filter(([, dx, dz]) => !inFp(x + dx, z + dz));

// --- roof tiers: 5x5 median of the lidar roof, then clean tiers, then drop tower clusters too small to be a tower
const median = (x, z) => {
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const c = fp.get(key(x + dx, z + dz)); if (c) v.push(c.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tier = new Map();
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number), m = median(x, z);
  tier.set(k, m <= 12 ? WING : m >= 23 ? TOWER : MAIN);
}
const seen = new Set();
for (const [k, t] of tier) {
  if (t !== TOWER || seen.has(k)) continue;
  const comp = [], stack = [k]; seen.add(k);
  while (stack.length) {
    const q = stack.pop(); comp.push(q);
    const [x, z] = q.split(",").map(Number);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = key(x + dx, z + dz);
      if (tier.get(n) === TOWER && !seen.has(n)) { seen.add(n); stack.push(n); }
    }
  }
  if (comp.length < 30) for (const q of comp) tier.set(q, MAIN);
}

// --- placement with occupancy, so lights and equipment can ask whether a cell is air
const v = new Voxels([X, Y, Z]);
const occ = new Set();
const put = (x, y, z, block, state) => { v.set(x, y, z, block, state); occ.add(`${x},${y},${z}`); };
const isOcc = (x, y, z) => occ.has(`${x},${y},${z}`);

const paneState = (d) => (d === "N" || d === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// the facade of an edge cell at height y: parapet, cornice, base, string courses, ribbon windows on piers
function facade(x, y, z, H, faces) {
  if (y === H - 1) return ["white_concrete"];                 // parapet
  if (y === H - 2) return ["smooth_quartz"];                  // cornice
  if (y === 0) return ["stone_bricks"];                       // base course
  if (y % 4 === 0) return ["smooth_quartz"];                  // storey string course
  if (y % 4 === 3 || faces.length >= 2) return ["white_concrete"];  // spandrel; corners are piers
  const [[d]] = faces;
  const u = d === "N" || d === "S" ? x : z;
  if (u % 4 === 1 || u % 4 === 2) return ["glass_pane", paneState(d)];  // the window pair
  return ["white_concrete"];                                  // pier
}

// --- 1) the shell: facades on the edge cells, a floor slab per storey and a roof membrane inside
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number), H = tier.get(k), faces = outward(x, z);
  if (faces.length) {
    for (let y = 0; y < H; y++) {
      const [block, state] = facade(x, y, z, H, faces);
      put(x, y, z, block, state);
    }
    continue;
  }
  for (let y = 0; y <= H - 2; y++) {
    if (H === TOWER && y <= MAIN - 2) put(x, y, z, "white_concrete");    // solid core under the tower tier
    else if (y === H - 2) put(x, y, z, "smooth_stone");                  // roof membrane (light, so it reads from the air)
    else if (y % 4 === 0) put(x, y, z, "smooth_stone");                  // storey floor slab
  }
}

// --- 2) the entrance: a door in the south face, near x 26, opening into the air gap
const doorCands = [...fp.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => { const f = outward(x, z); return f.length === 1 && f[0][0] === "S" && tier.get(key(x, z)) >= 3; });
const [dx0, dz0] = doorCands.sort((a, b) => Math.abs(a[0] - 26) - Math.abs(b[0] - 26))[0];
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
put(dx0, 1, dz0, "oak_door", doorState("lower"));
put(dx0, 2, dz0, "oak_door", doorState("upper"));

// --- 3) warm lights behind the glass: lanterns in the shopfronts, glowstone in some upper windows (air gap cell in front)
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number), H = tier.get(k), faces = outward(x, z);
  if (faces.length !== 1) continue;
  const [[d, ox, oz]] = faces;
  const u = d === "N" || d === "S" ? x : z;
  if (!(u % 4 === 1 || u % 4 === 2)) continue;
  const xi = x - ox, zi = z - oz;                       // the cell behind the glass
  if (!inFp(xi, zi) || outward(xi, zi).length) continue;
  for (let s = 0; 4 * s + 1 < H - 2; s++) {
    const y = 4 * s + 1;
    if (isOcc(xi, y, zi)) continue;
    if (s === 0) { if (u % 8 === 1) put(xi, y, zi, "lantern", { hanging: "false", waterlogged: "false" }); }
    else if ((x * 31 + z * 17 + s * 7) % 5 === 0) put(xi, y, zi, "glowstone");
  }
}

// --- 4) roof plant: a 7x5 plant deck on the main roof (one block high), a 3x3 lift core stacked on it
let best = null, bestD = Infinity;
let cx = 0, cz = 0, n = 0;
for (const [k, t] of tier) if (t === MAIN) { const [x, z] = k.split(",").map(Number); cx += x; cz += z; n++; }
cx /= n; cz /= n;
for (const [k, t] of tier) {
  if (t !== MAIN) continue;
  const [x0, z0] = k.split(",").map(Number);
  let ok = true;
  for (let dz = 0; dz < 5 && ok; dz++) for (let dx = 0; dx < 7 && ok; dx++) {
    const x = x0 + dx, z = z0 + dz;
    if (tier.get(key(x, z)) !== MAIN || outward(x, z).length || isOcc(x, MAIN - 1, z)) ok = false;
  }
  if (!ok) continue;
  const d = Math.hypot(x0 + 3 - cx, z0 + 2 - cz);
  if (d < bestD) { bestD = d; best = [x0, z0]; }
}
if (best) {
  const [x0, z0] = best;
  for (let dz = 0; dz < 5; dz++) for (let dx = 0; dx < 7; dx++) put(x0 + dx, MAIN - 1, z0 + dz, "light_gray_concrete");
  for (let dz = 1; dz < 4; dz++) for (let dx = 2; dx < 5; dx++) for (let y = MAIN; y < MAIN + 3; y++) put(x0 + dx, y, z0 + dz, "stone_bricks");
}

const info = v.save(OUT);
console.log(`way_24020870: ${info.blocks} blocks, ${info.palette} palette entries; entrance at x${dx0} z${dz0}; plant ${best ? "placed" : "skipped"}`);
