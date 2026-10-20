import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764466773";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 38, D = 19;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const inside = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (!inside(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
// Perimeter cell: any side open to outside the footprint
const edge = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

const ROOF_DECK = 25;   // roof slab, top of 5th storey
const PARAPET = 26;     // parapet top = roof height ~26 above lowest ground
const TOP_WALL = 24;    // last wall row under the roof deck
const ENTR_X = 10;      // entrance column on south face
const ENTR_Z = D - 1;

// ---- Pass 1: foundations, floor plates, roof deck ----
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(25, gr0));
  // foundation from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // upper floor slabs (interior); perimeter overwritten in pass 2
  for (let k = 1; k <= 4; k++) {
    const fy = 5 * k;
    if (fy >= gr) put(x, fy, z, "smooth_stone");
  }
  // roof deck
  if (ROOF_DECK >= gr) put(x, ROOF_DECK, z, "smooth_stone");
}

// ---- Pass 2: facade on perimeter cells ----
for (const [x, z, gr0] of cells) {
  if (!edge(x, z)) continue;
  const gr = Math.max(0, Math.min(25, gr0));
  const corner = (x === 0 || x === W - 1 || z === 0 || z === D - 1);
  const pier = corner || ((x + z) % 3 === 0);

  for (let y = gr; y <= TOP_WALL; y++) {
    const lvl = Math.floor(y / 5);
    const r = y % 5;
    if (r === 0) {
      // floor line / spandrel course at storey base
      put(x, y, z, lvl === 0 ? "light_gray_concrete" : "white_concrete");
      continue;
    }
    if (lvl === 0) {
      // ground floor: shopfront with stone piers
      if (r === 4) { put(x, y, z, "light_gray_concrete"); continue; }
      if (pier && !(z === ENTR_Z && Math.abs(x - ENTR_X) === 1)) {
        put(x, y, z, "light_gray_concrete");
        continue;
      }
      if (z === ENTR_Z && x === ENTR_X) {
        if (r === 1) {
          put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (r === 2) {
          put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else {
          put(x, y, z, "light_gray_concrete");
        }
        continue;
      }
      put(x, y, z, "light_blue_stained_glass");
      continue;
    }
    // upper storeys: spandrel, glass bays, lintel
    if (r === 1 || r === 4) { put(x, y, z, "white_concrete"); continue; }
    if (pier) put(x, y, z, "light_gray_concrete");
    else put(x, y, z, "light_blue_stained_glass");
  }

  // parapet with cornice
  put(x, PARAPET, z, "light_gray_concrete");
}

// ---- Pass 3: warm light behind some upper-floor glass ----
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (!edge(x, z)) continue;
  const gr = Math.max(0, Math.min(25, ground.get(`${x},${z}`)));
  for (let k = 1; k <= 4; k++) {
    const yg = 5 * k + 2;
    if (yg <= gr) continue;
    const pier = (corner(x, z)) || ((x + z) % 3 === 0);
    if (pier) continue;
    if ((x + z + k) % 4 !== 0) continue;
    const nbrs = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]];
    for (const [nx, nz] of nbrs) {
      if (has(nx, nz) && !edge(nx, nz)) {
        put(nx, yg, nz, "glowstone");
        break;
      }
    }
  }
}
function corner(x, z) { return x === 0 || x === W - 1 || z === 0 || z === D - 1; }

// ---- Pass 4: roof plant room and mast ----
for (let x = 7; x <= 13; x++) {
  for (let z = 6; z <= 12; z++) {
    if (!has(x, z)) continue;
    for (let y = 26; y <= 28; y++) put(x, y, z, "light_gray_concrete");
    put(x, 29, z, "stone_bricks");
  }
}
if (has(10, 9)) {
  for (let y = 30; y <= 33; y++) put(10, y, 9, "iron_block");
  put(10, 34, 9, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
