import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109973";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 13 x 26 footprint, roof deck ~21 blocks above lowest ground, 4 storeys of ~5 blocks,
// 1990s Taipei mid-rise: white tiled concrete frame, quartz storey lines, blue glazing.
const W = 13, H = 33, D = 26;
const g = new Voxels([W, H, D]);

const SLABS = [5, 10, 15, 20];   // floor slabs / roof deck at storey lines
const PARAPET_Y = 21;            // parapet band 21..22
const TOP_Y = 22;

const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), Math.round(gr));
const has = (x, z) => groundOf.has(key(x, z));
const gr = (x, z) => groundOf.get(key(x, z));

const NB = [["west", -1, 0], ["east", 1, 0], ["north", 0, -1], ["south", 0, 1]];
const outs = (x, z) => NB.filter(([, dx, dz]) => !has(x + dx, z + dz)).map(([n]) => n);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pillars every 3 blocks on each facade, corners always.
function isPillar(x, z, o) {
  if (o.length >= 2) return true;
  const d = o[0];
  if (d === "north" || d === "south") return x % 3 === 0;
  return z % 3 === 0;
}

// Pass 1: foundation, floor slabs, perimeter envelope.
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const G = Math.max(0, Math.min(gr(x, z), H - 30));
  const o = outs(x, z);
  const perim = o.length > 0;

  for (let y = 0; y < G; y++) put(x, y, z, perim ? "stone_bricks" : "stone");

  if (!perim) {
    for (const y of SLABS) if (y >= G) put(x, y, z, y === 20 ? "gray_concrete" : "light_gray_concrete");
    continue;
  }

  const pillar = isPillar(x, z, o);
  for (let y = G; y <= TOP_Y; y++) {
    const r = y % 5;
    let id;
    if (y >= PARAPET_Y) id = "smooth_quartz";              // parapet cap
    else if (pillar) id = "white_concrete";                // structural fins
    else if (r === 0) id = "smooth_quartz";                // storey line
    else if (r === 4) id = "light_gray_concrete";          // spandrel
    else if (y < 5) id = "light_blue_stained_glass";       // shopfront glazing
    else id = "light_blue_stained_glass_pane";             // window
    put(x, y, z, id);
  }
}

// Pass 2: entrance on the largest street-facing elevation.
const perimCells = cells
  .map(([x, z]) => [x, z, outs(x, z)])
  .filter(([, , o]) => o.length === 1 && !isPillar(0, 0, []) );
const byFace = {};
for (const [x, z, o] of perimCells) {
  if (isPillar(x, z, o)) continue;
  (byFace[o[0]] ||= []).push([x, z]);
}
let bestFace = null;
for (const f of Object.keys(byFace)) {
  if (!bestFace || byFace[f].length > byFace[bestFace].length) bestFace = f;
}
if (bestFace) {
  const list = byFace[bestFace].sort((a, b) =>
    (bestFace === "north" || bestFace === "south") ? a[0] - b[0] : a[1] - b[1]);
  const [dx, dz] = list[Math.floor(list.length / 2)];
  const G = Math.max(0, Math.min(gr(dx, dz), H - 30));
  const doorProps = (half) => ({ facing: bestFace, half, hinge: "left", open: "false", powered: "false" });
  put(dx, G, dz, "dark_oak_door", doorProps("lower"));
  put(dx, G + 1, dz, "dark_oak_door", doorProps("upper"));
  // Warm light over the entrance, held inside the shopfront.
  put(dx, G + 3, dz, "smooth_quartz");
}

// Pass 3: warm lights behind some glazed windows (interior air cell beside the pane).
const DIRV = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const o = outs(x, z);
  if (o.length !== 1) continue;
  const G = Math.max(0, Math.min(gr(x, z), H - 30));
  if (isPillar(x, z, o)) continue;
  const [ix, iz] = [x - DIRV[o[0]][0], z - DIRV[o[0]][1]];
  if (!has(ix, iz) || outs(ix, iz).length > 0) continue;
  for (let y = Math.max(G, 1); y <= 20; y++) {
    const r = y % 5;
    if (r < 1 || r > 3) continue;
    if (((x * 5 + z * 7 + y) % 9) !== 0) continue;
    if (y < gr(ix, iz)) continue;
    put(ix, y, iz, "glowstone");
  }
}

// Pass 4: roof plant on deep interior cells, with a lightning rod mast.
const deep = (x, z) => {
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    if (!has(x + dx, z + dz)) return false;
  }
  return true;
};
const plant = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => deep(x, z) && x >= 4 && x <= 8 && (z % 6) < 4);
for (const [x, z] of plant) {
  put(x, 21, z, "smooth_stone");
  put(x, 22, z, "smooth_stone");
}
if (plant.length) {
  const [mx, mz] = plant[Math.floor(plant.length / 2)];
  for (let y = 23; y <= 25; y++) {
    put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
