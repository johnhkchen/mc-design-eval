import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456432";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// ---- footprint helpers -------------------------------------------------------
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Exterior face of a perimeter cell: N (dz=-1), S (dz=+1), E (dx=+1), W (dx=-1).
// N/S take priority so corners use the x-running pattern.
function faceOf(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x + 1, z)) return "E";
  if (!has(x - 1, z)) return "W";
  return null;
}

// ---- storey lines (absolute, relative to lowest ground) ----------------------
const Y = {
  base: minG,          // plinth / ground slab
  s1lo: minG + 1,      // ground floor glazing (shopfront) bottom
  s1hi: minG + 3,
  fascia1: minG + 4,   // ground floor fascia
  floor2: minG + 5,    // storey line / 2nd floor slab
  s2lo: minG + 6,      // upper storey windows
  s2hi: minG + 9,
  cornice: minG + 10,  // roof slab / cornice
  parapet: minG + 11,  // parapet cap
};

// ---- door: on the south face if possible, near its middle --------------------
const perim = cells.filter(([x, z]) => faceOf(x, z) !== null);
let doorCandidates = perim.filter(([x, z]) => faceOf(x, z) === "S");
if (doorCandidates.length === 0) doorCandidates = perim.filter(([x, z]) => faceOf(x, z) === "N");
if (doorCandidates.length === 0) doorCandidates = perim;
const tOf = (x, z, f) => (f === "N" || f === "S" ? x : z);
const meanT = doorCandidates.reduce((s, [x, z]) => s + tOf(x, z, faceOf(x, z)), 0) / doorCandidates.length;
let doorCell = null;
for (const [x, z] of doorCandidates) {
  const f = faceOf(x, z);
  const d = Math.abs(tOf(x, z, f) - meanT);
  if (!doorCell || d < doorCell.d) doorCell = { x, z, f, d };
}
const doorKey = doorCell ? `${doorCell.x},${doorCell.z}` : null;
const doorFacing = doorCell ? (doorCell.f === "N" ? "north" : doorCell.f === "S" ? "south" : doorCell.f === "E" ? "east" : "west") : null;

// ---- 1. foundation fill from y 0 up to each cell's ground --------------------
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// ---- 2. floor slabs at each cell's ground, storey line and roof level -------
for (const [x, z, gr] of cells) {
  put(x, gr, z, "smooth_stone");
  if (Y.floor2 >= gr) put(x, Y.floor2, z, "smooth_stone");
  if (Y.cornice >= gr) put(x, Y.cornice, z, "light_gray_concrete");
}

// ---- 3. facade walls on perimeter cells, cell by cell -----------------------
for (const [x, z, gr] of cells) {
  const f = faceOf(x, z);
  if (f === null) continue;
  const t = tOf(x, z, f);
  const isNS = f === "N" || f === "S";
  const pier = t % 3 === 0;
  const isDoor = `${x},${z}` === doorKey;
  const glassProps = isNS
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = Math.max(gr, 0); y <= Y.parapet; y++) {
    if (y === Y.parapet) { put(x, y, z, "white_concrete"); continue; }
    if (y === Y.cornice) { put(x, y, z, "smooth_stone"); continue; }
    if (y === Y.fascia1 || y === Y.floor2) { put(x, y, z, "light_gray_concrete"); continue; }
    if (y === Y.base) { put(x, y, z, "stone_bricks"); continue; }
    if (isDoor && (y === Y.s1lo || y === Y.s1lo + 1)) {
      const half = y === Y.s1lo ? "lower" : "upper";
      put(x, y, z, "oak_door", { facing: doorFacing, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const inBand = (y >= Y.s1lo && y <= Y.s1hi) || (y >= Y.s2lo && y <= Y.s2hi);
    if (!inBand) { put(x, y, z, "white_concrete"); continue; }
    if (pier && !isDoor) { put(x, y, z, "white_concrete"); continue; }
    if (isDoor && y <= Y.s1lo + 1) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "glass_pane", glassProps);
  }
  // Shopfront canopy-style dark fascia above door at the ground band top
  if (isDoor) put(x, Y.s1hi + 1, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

// ---- 4. interior depth maps for lights and roof kit -------------------------
const interior1 = cells.filter(([x, z]) => has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));
const in1 = new Set(interior1.map(([x, z]) => `${x},${z}`));
const interior2 = interior1.filter(([x, z]) => in1.has(`${x + 1},${z}`) && in1.has(`${x - 1},${z}`) && in1.has(`${x},${z + 1}`) && in1.has(`${x},${z - 1}`));

// ---- 5. warm hanging lanterns in both storeys -------------------------------
for (const [x, z] of interior2) {
  if (x % 4 === 1 && z % 4 === 1) {
    put(x, Y.fascia1, z, "lantern", { hanging: "true", waterlogged: "false" });
    put(x, Y.s2hi, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// ---- 6. roof equipment: AC plant boxes and a central mast -------------------
for (const [x, z, gr] of interior1) {
  if (x % 6 === 2 && z % 6 === 3) {
    put(x, Y.parapet, z, "light_gray_concrete");
    put(x, Y.parapet + 1, z, "light_gray_concrete");
  }
}
if (interior1.length > 0) {
  const cx = interior1.reduce((s, c) => s + c[0], 0) / interior1.length;
  const cz = interior1.reduce((s, c) => s + c[1], 0) / interior1.length;
  let best = interior1[0];
  for (const c of interior1) {
    if (Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz)) best = c;
  }
  for (let y = Y.parapet; y <= Y.parapet + 5; y++) put(best[0], y, best[1], "iron_bars");
  put(best[0], Y.parapet + 6, best[1], "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
