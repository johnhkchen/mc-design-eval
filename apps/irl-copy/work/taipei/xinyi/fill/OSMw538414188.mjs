import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538414188.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538414188.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

const W = 23, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Materials: late-20th-century Taipei commercial block, granite base,
// pale tiled piers, tinted glass bays, parapet roof with plant box.
const FOUND = "stone_bricks";
const BASE = "polished_granite";
const FLOOR = "smooth_stone";
const PIER = "smooth_quartz";
const SHOP = "light_blue_stained_glass";
const GLASS = "gray_stained_glass";
const CAP = "stone_brick_wall";
const ROOF = "smooth_stone";
const PLANT = "light_gray_concrete";
const DOOR = "dark_oak_door";

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint map: "x,z" -> ground
const fp = new Map();
let yF = 0; // common floor datum = highest cell ground
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  fp.set(`${x},${z}`, gr);
  yF = Math.max(yF, gr);
}
const isFp = (x, z) => fp.has(`${x},${z}`);

// Storey height: two storeys under an ~11-block parapet line
const sh = Math.max(3, Math.min(5, Math.floor((11 - yF) / 2)));
const top = yF + 2 * sh; // cornice / roof slab level

// Outward faces of a footprint cell
const faces = (x, z) => [
  [0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"],
].filter(([dx, dz]) => !isFp(x + dx, z + dz));

const perim = (x, z) => faces(x, z).length > 0;

// Foundation, floor datum and walls
for (const [key, ground] of fp) {
  const [x, z] = key.split(",").map(Number);
  const fc = faces(x, z);
  const per = fc.length > 0;

  // Foundation fill from y 0 up to the datum (solid under every cell)
  for (let y = 0; y < yF; y++) put(x, y, z, FOUND);

  // Ground floor slab / base course
  put(x, yF, z, per ? BASE : FLOOR);

  // Second floor slab (interior) and roof slab (interior)
  if (!per) {
    put(x, yF + sh, z, FLOOR);
    put(x, top, z, ROOF);
    continue;
  }

  // Perimeter wall column
  const [dx0, dz0, f0] = fc[0];
  const along = (f0 === "north" || f0 === "south") ? x : z;
  const corner = fc.length >= 2;
  const pier = corner || (along % 3 === 0);

  for (let y = yF + 1; y <= top + 1; y++) {
    let id;
    if (y === top + 1) id = CAP;
    else if (y === top) id = PIER;
    else if (y === yF + sh) id = PIER;          // storey string course
    else if (y === yF + sh - 1 || y === top - 1) id = PIER; // lintels
    else if (pier) id = PIER;
    else id = y < yF + sh ? SHOP : GLASS;
    put(x, y, z, id);
  }
}

// Warm light behind some bays (inside the air gap)
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  const fc = faces(x, z);
  if (!fc.length || fc.length > 1) continue;
  const [dx, dz, f] = fc[0];
  const along = (f === "north" || f === "south") ? x : z;
  if (along % 3 === 0) continue; // pier
  const ix = x - dx, iz = z - dz;
  if (!isFp(ix, iz) || perim(ix, iz)) continue;
  if (along % 2 === 0) put(ix, yF + 2, iz, "glowstone");
  else put(ix, yF + sh + 2, iz, "shroomlight");
}

// Entrance: north-facing perimeter cell nearest the centre line
let sx = 0, sz = 0, n = 0;
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  sx += x; sz += z; n++;
}
const cx = sx / n, cz = sz / n;
let best = null, bestD = Infinity;
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  const fc = faces(x, z);
  const north = fc.find(f => f[2] === "north");
  if (!north) continue;
  const d = Math.abs(x - cx);
  if (d < bestD) { bestD = d; best = { x, z, facing: "north" }; }
}
if (!best) {
  for (const key of fp.keys()) {
    const [x, z] = key.split(",").map(Number);
    const fc = faces(x, z);
    if (!fc.length) continue;
    const d = Math.hypot(x - cx, z - cz);
    if (d < bestD) { bestD = d; best = { x, z, facing: fc[0][2] }; }
  }
}
if (best) {
  const { x, z, facing } = best;
  put(x, yF + 1, z, DOOR, { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, yF + 2, z, DOOR, { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Roof plant box and antenna, centred on the footprint
const x0 = Math.floor(W * 0.35), x1 = Math.floor(W * 0.65);
const z0 = Math.floor(D * 0.35), z1 = Math.floor(D * 0.65);
for (let x = x0; x <= x1; x++) {
  for (let z = z0; z <= z1; z++) {
    if (!isFp(x, z) || perim(x, z)) continue;
    put(x, top + 1, z, PLANT);
    if (x === Math.floor(W / 2) || z === Math.floor(D / 2)) put(x, top + 2, z, PLANT);
  }
}
put(Math.floor(W / 2), top + 3, Math.floor(D / 2), "lightning_rod");

g.save(OUT);
