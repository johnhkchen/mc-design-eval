// 6 West 48th Street (NYC1034487), 1918 Commercial & Office. A Beaux-Arts commercial block: a buff sandstone
// facade on a limestone plinth, storey string courses, paired-pane window bays, quoined corners, a shopfront
// with a recessed door on the 48th Street (north, low z) face, a stepped roof from the lidar (43/46/48) with a
// cornice and parapet, and a small penthouse on the high core. Interior is air behind the glass with a floor slab
// per storey and a few warm lights standing on the floors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 15, D = 28, H = 60;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034487.cells.json`, "utf8"));

const raw = new Map();
for (const [x, z, , roof] of cells) raw.set(`${x},${z}`, roof);
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && raw.has(`${x},${z}`);

// Lidar noise (a one-cell hole at roof 1, a speckled west edge): a 3x3 median, then three roof tiers.
const median = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) v.push(raw.get(`${x + dx},${z + dz}`));
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const tierOf = (s) => (s < 45 ? 43 : s < 47 ? 46 : 48);
const top = new Map();
for (const k of raw.keys()) { const [x, z] = k.split(",").map(Number); top.set(k, tierOf(median(x, z))); }
const T = (x, z) => (inFp(x, z) ? top.get(`${x},${z}`) : 0);

const M = {
  foundation: "stone_bricks", floor: "stone", base: "calcite", wall: "smooth_sandstone", quoin: "cut_sandstone",
  roof: "stone_bricks", glass: "light_blue_stained_glass_pane", shop: "glass", door: "dark_oak_door",
};
const FLOORS = [1]; for (let f = 5; f < H; f += 3) FLOORS.push(f);          // ground floor 1..4, then 3-block storeys
const floorOf = (y) => { let f = 1; for (const q of FLOORS) if (q <= y) f = q; return f; };

const g = new Voxels([W, H, D]);

// Exposed faces: a neighbour that is off the footprint or whose roof is below this height.
const faces = (x, y, z) => ({
  n: T(x, z - 1) < y, s: T(x, z + 1) < y, w: T(x - 1, z) < y, e: T(x + 1, z) < y,
});
const isShell = (x, y, z) => { const f = faces(x, y, z); return f.n || f.s || f.w || f.e; };

const pane = (zFace) => (zFace
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

function place(x, y, z) {
  const t = T(x, z);
  const f = faces(x, y, z);
  const shell = f.n || f.s || f.w || f.e;
  const zFace = f.n || f.s, xFace = f.w || f.e;
  if (y === t - 1) return g.set(x, y, z, M.roof);                          // roof cover over the whole footprint
  if (y === t) return shell && g.set(x, y, z, M.base);                      // parapet ring
  if (y === t - 2) return shell && g.set(x, y, z, M.base);                  // cornice
  if (!shell) return FLOORS.includes(y) && g.set(x, y, z, M.floor);       // interior: a slab per storey, air between
  if (zFace && xFace) return g.set(x, y, z, M.quoin);                       // quoined corners, full height
  if (FLOORS.includes(y)) return g.set(x, y, z, M.base);                    // storey string courses
  const F = floorOf(y), rel = y - F;
  if (rel === 3) return g.set(x, y, z, M.wall);                             // ground-floor transom band
  const idx = zFace ? x : z;
  if (F === 1 && f.n && (x === 7)) {                                        // recessed door, centred on 48th Street
    if (rel === 1 || rel === 2) g.set(x, y, z, M.door, { facing: "south", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    return;
  }
  if (F === 1 && f.n && (x === 6 || x === 8 || x % 4 === 0)) return g.set(x, y, z, M.base);   // shopfront piers
  if (F === 1 && f.n) return g.set(x, y, z, M.shop);                        // display glass
  if (idx % 2 === 1) return g.set(x, y, z, M.glass, pane(zFace));           // window bays
  return g.set(x, y, z, M.wall);                                            // piers between bays
}

// Foundation and the building itself, cell by cell.
for (const [x, z] of [...raw.keys()].map((k) => k.split(",").map(Number))) {
  g.set(x, 0, z, M.foundation);
  for (let y = 1; y <= T(x, z); y++) place(x, y, z);
}

// Penthouse on the high core (roof 48): a small box of walls and glass on the roof cover.
const PX = [6, 10], PZ = [15, 18];
let penthouse = true;
for (let z = PZ[0]; z <= PZ[1]; z++) for (let x = PX[0]; x <= PX[1]; x++) if (T(x, z) !== 48) penthouse = false;
if (penthouse) {
  for (let z = PZ[0]; z <= PZ[1]; z++) for (let x = PX[0]; x <= PX[1]; x++) {
    const edgeX = x === PX[0] || x === PX[1], edgeZ = z === PZ[0] || z === PZ[1];
    if (!edgeX && !edgeZ) continue;
    const zFace = edgeZ && !edgeX;
    g.set(x, 48, z, M.base);
    for (const y of [49, 50]) {
      if (edgeX && edgeZ) g.set(x, y, z, M.quoin);
      else if ((zFace ? x : z) % 2 === 1) g.set(x, y, z, M.glass, pane(zFace));
      else g.set(x, y, z, M.wall);
    }
  }
  for (let z = PZ[0]; z <= PZ[1]; z++) for (let x = PX[0]; x <= PX[1]; x++) g.set(x, 51, z, M.roof);
}

// Warm light: some windows show a glowstone or lantern standing on the floor just inside the glass.
for (const [x, z] of [...raw.keys()].map((k) => k.split(",").map(Number))) {
  for (let y = 2; y <= T(x, z) - 3; y++) {
    if (isShell(x, y, z) === false) continue;
    const f = faces(x, y, z);
    if (f.n === f.s && f.w === f.e) continue;                               // corners and single-face-free cells
    if (floorOf(y) === y || y - floorOf(y) !== 1) continue;                  // only the lower window row
    if (f.n || f.s) {
      if ((x + z * 3 + y) % 7 !== 0) continue;
      const dz = f.n ? 1 : -1;
      if (x % 2 === 0 || x === 0 || x === W - 1 || g.get(x, y, z)?.block !== "minecraft:light_blue_stained_glass_pane") continue;
      if (!inFp(x, z + dz) || isShell(x, y, z + dz) || T(x, z + dz) < y) continue;
      g.set(x, y, z + dz, (x + z + y) % 3 === 0 ? "lantern" : "glowstone");
    } else if (f.w || f.e) {
      if ((z * 5 + y) % 7 !== 0) continue;
      const dx = f.w ? 1 : -1;
      if (z % 2 === 0 || z === 0 || z === D - 1 || g.get(x, y, z)?.block !== "minecraft:light_blue_stained_glass_pane") continue;
      if (!inFp(x + dx, z) || isShell(x + dx, y, z) || T(x + dx, z) < y) continue;
      g.set(x + dx, y, z, (z + y) % 3 === 0 ? "lantern" : "glowstone");
    }
  }
}

const out = g.save(`${DIR}/NYC1034487.nbt`);
console.log(JSON.stringify({ size: g.size, ...out, penthouse }));
