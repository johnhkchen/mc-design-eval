import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "OSMw827011441";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 22, D = 17, H = 38;
const STOREYS = 5, STOREY_H = 5;          // 5 storeys x 5 blocks, parapet at L=25 -> roof 26 above lowest ground
const PARAPET_L = STOREYS * STOREY_H;     // 25

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// ---- footprint lookup -------------------------------------------------------
const ground = new Map();
for (const [x, z, g] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.round(g)));
}
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const fpKeys = [...ground.keys()].map((k) => k.split(",").map(Number));

const OUT = [
  [0, -1, "north"],
  [1, 0, "east"],
  [0, 1, "south"],
  [-1, 0, "west"],
];

function exteriorSides(x, z) {
  return OUT.filter(([dx, dz]) => !inFp(x + dx, z + dz));
}

// height sanity: highest base + 27 must fit the world height
let maxBase = 0;
for (const [, , g] of fpKeys.map((k) => [k[0], k[1], gAt(k[0], k[1])])) maxBase = Math.max(maxBase, g);
if (maxBase + PARAPET_L + 2 >= H) {
  throw new Error(`Building top ${maxBase + PARAPET_L + 2} exceeds world height ${H}`);
}

// ---- door: on the north face (lowest z), nearest the footprint's mean x -----
const meanX = fpKeys.reduce((s, [x]) => s + x, 0) / fpKeys.length;
const candidates = [];
for (const [x, z] of fpKeys) {
  for (const [dx, dz, name] of OUT) {
    if (!inFp(x + dx, z + dz)) candidates.push({ x, z, name });
  }
}
let pool = candidates.filter((c) => c.name === "north");
if (!pool.length) pool = candidates;
pool.sort((a, b) => a.z - b.z || Math.abs(a.x - meanX) - Math.abs(b.x - meanX));
const door = pool.length ? pool[0] : null;
const isDoorCell = (x, z) => door && door.x === x && door.z === z;

// ---- facade classification (absolute y) -------------------------------------
function facade(x, z, y) {
  const b = gAt(x, z);
  const L = y - b;
  if (L < 0 || L > PARAPET_L) return null;
  const ext = exteriorSides(x, z);
  if (!ext.length) return null;                      // interior cell
  if (isDoorCell(x, z) && L >= 1 && L <= 3) return { t: "door" };
  if (L === PARAPET_L) return { t: "solid", id: "smooth_quartz" };

  const k = Math.floor(L / STOREY_H);
  const o = L % STOREY_H;
  const corner = ext.length >= 2;

  if (k === 0) {
    if (o === 0) return { t: "solid", id: "polished_granite" };   // plinth
    if (o === 4) return { t: "solid", id: "smooth_quartz" };      // shopfront fascia
  } else {
    if (o === 0) return { t: "solid", id: "smooth_quartz" };      // storey line
    if (o === 4) return { t: "solid", id: "quartz_block" };       // spandrel
  }
  // o = 1..3: window zone
  if (corner || (x + z) % 3 === 0) return { t: "solid", id: "polished_andesite" };
  return { t: "pane", id: k === 0 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane" };
}

function paneProps(x, z, y) {
  const p = {};
  for (const [dx, dz, name] of OUT) {
    const n = facade(x + dx, z + dz, y);
    p[name] = n && (n.t === "pane" || n.t === "solid") ? "true" : "false";
  }
  p.waterlogged = "false";
  return p;
}

// ---- penthouse + roof equipment ---------------------------------------------
const inPenthouse = (x, z) => x >= 7 && x <= 14 && z >= 5 && z <= 11;

// ---- voxels -----------------------------------------------------------------
const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// pass 1: foundations, facades, interior slabs, roof
for (const [x, z] of fpKeys) {
  const b = gAt(x, z);
  const ext = exteriorSides(x, z);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  if (!ext.length) {
    // interior: floor slab per storey plus roof slab; air between
    for (const L of [0, 5, 10, 15, 20, 24]) put(x, b + L, z, "light_gray_concrete");
    if (inPenthouse(x, z)) {
      put(x, b + 25, z, "stone_bricks");
      put(x, b + 26, z, "stone_bricks");
      put(x, b + 27, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    } else if ((x * 3 + z * 5) % 7 === 0) {
      put(x, b + 25, z, "iron_block");                  // AC units on the roof
    }
    continue;
  }

  // perimeter walls
  for (let L = 0; L <= PARAPET_L; L++) {
    const y = b + L;
    const f = facade(x, z, y);
    if (!f) continue;
    if (f.t === "door") {
      if (L === 1) put(x, y, z, "oak_door", { facing: door.name, half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (L === 2) put(x, y, z, "oak_door", { facing: door.name, half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (L === 3) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (f.t === "pane") put(x, y, z, f.id, paneProps(x, z, y));
    else put(x, y, z, f.id);
  }
}

// pass 2: warm lights in some windows (glowstone just inside the glass)
for (const [x, z] of fpKeys) {
  const ext = exteriorSides(x, z);
  if (!ext.length) continue;
  const b = gAt(x, z);
  const [edx, edz] = [ext[0][0], ext[0][1]];
  const ix = x - edx, iz = z - edz;                   // inward neighbour
  if (!inFp(ix, iz) || exteriorSides(ix, iz).length) continue;
  if (gAt(ix, iz) !== b) continue;
  for (let L = 1; L <= PARAPET_L - 1; L++) {
    const k = Math.floor(L / STOREY_H), o = L % STOREY_H;
    if (o === 0 || o === 4) continue;
    const f = facade(x, z, b + L);
    if (!f || f.t !== "pane") continue;
    if (((x * 5 + z * 7 + k * 3 + o) % 9) === 0) {
      put(ix, b + L, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
