import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Taipei commercial/office block, c. 1980s-90s: stone-clad plinth,
// white concrete bays with blue-tinted glazing, quartz cornice, roof-top
// penthouse with a lightning-rod mast.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169559";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 41, D = 16;
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

// footprint: "x,z" -> ground
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, Math.round(gr));

// exterior faces of a cell with respect to a set of cells
function exteriorDirs(set, x, z) {
  return Object.keys(DIRS).filter(d => !set.has(`${x + DIRS[d][0]},${z + DIRS[d][1]}`));
}

// penthouse footprint: cells whose whole 9x9 neighbourhood lies inside the footprint
const PH = new Map();
for (const [key, gr] of fp) {
  const [x, z] = key.split(",").map(Number);
  let ok = true;
  for (let dx = -4; dx <= 4 && ok; dx++)
    for (let dz = -4; dz <= 4 && ok; dz++)
      if (!fp.has(`${x + dx},${z + dz}`)) ok = false;
  if (ok) PH.set(key, gr);
}

// single corner-free south-face cell nearest the face centre -> entrance
const southCells = [...fp.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([x, z]) => {
    const d = exteriorDirs(fp, x, z);
    return d.length === 1 && d[0] === "S";
  });
let doorKey = null;
if (southCells.length) {
  const mx = southCells.reduce((s, [x]) => s + x, 0) / southCells.length;
  southCells.sort((a, b) => Math.abs(a[0] - mx) - Math.abs(b[0] - mx));
  doorKey = `${southCells[0][0]},${southCells[0][1]}`;
}

// window bay: glazed panes in the wall plane, piers every third bay and at corners
function facade(set, x, z, dirs) {
  if (dirs.length >= 2) return ["white_concrete"];
  const along = (dirs[0] === "N" || dirs[0] === "S") ? x : z;
  if (along % 3 === 0) return ["white_concrete"];
  const runsEW = dirs[0] === "N" || dirs[0] === "S";
  return ["light_blue_stained_glass_pane", {
    north: runsEW ? "false" : "true",
    south: runsEW ? "false" : "true",
    east: runsEW ? "true" : "false",
    west: runsEW ? "true" : "false",
    waterlogged: "false",
  }];
}

function penthouse(x, y, z) {
  const key = `${x},${z}`;
  if (!PH.has(key)) return null;
  const dirs = exteriorDirs(PH, x, z);
  const per = dirs.length > 0;
  if (y === 29) return per ? ["light_gray_concrete"] : ["gray_concrete"];
  if (y >= 30 && y <= 32) return per ? facade(PH, x, z, dirs) : null;
  if (y === 33) return ["light_gray_concrete"];
  return null;
}

function classify(x, y, z) {
  const key = `${x},${z}`;
  const gr = fp.get(key);
  if (gr === undefined) return null;
  const dirs = exteriorDirs(fp, x, z);
  const per = dirs.length > 0;

  if (y < gr) return ["stone_bricks"];                          // foundation
  if (y === gr) return per ? ["stone_bricks"] : ["smooth_stone"]; // plinth / ground floor slab
  if (y >= 29) return penthouse(x, y, z);                       // roof level
  if (y === 28) return per ? ["light_gray_concrete"] : ["gray_concrete"]; // parapet / roof deck
  if (y === 27) return per ? ["smooth_quartz"] : null;          // cornice
  if (y === 26) return per ? ["smooth_quartz"] : ["light_gray_concrete"]; // cornice / ceiling

  if (y < 6) {                                                  // ground floor shopfronts
    if (y === 5) return per ? ["polished_andesite"] : null;     // lintel
    if (!per) return null;
    const isDoor = key === doorKey;
    if (isDoor && (y === gr + 1 || y === gr + 2)) {
      return ["dark_oak_door", {
        facing: "south",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      }];
    }
    if (isDoor && y === 4) return ["lantern", { hanging: "true", waterlogged: "false" }];
    return facade(fp, x, z, dirs);
  }

  // upper storeys: floor line at 6, 11, 16, 21; glass rows 1-3; spandrel row 4
  if ((y - 6) % 5 === 0) return per ? ["white_concrete"] : ["smooth_stone"];
  if (!per) return null;
  if ((y - 6) % 5 === 4) return ["light_gray_concrete"];
  return facade(fp, x, z, dirs);
}

// classify everything once
const res = new Map();
const put = (x, y, z, v) => { if (v) res.set(`${x},${y},${z}`, v); };
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < 34; y++) put(x, y, z, classify(x, y, z));
}

// lightning-rod mast on the penthouse, centred
if (PH.size) {
  const pk = [...PH.keys()].map(k => k.split(",").map(Number));
  const cx = pk.reduce((s, [x]) => s + x, 0) / pk.length;
  const cz = pk.reduce((s, [, z]) => s + z, 0) / pk.length;
  pk.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz));
  const [mx, mz] = pk[0];
  for (let y = 34; y <= 37; y++) put(mx, y, mz, ["lightning_rod"]);
}

// warm light behind some glazed bays (glowstone in the air gap inside the glass)
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  const dirs = exteriorDirs(fp, x, z);
  if (dirs.length !== 1) continue;
  const gr = fp.get(key);
  const [dx, dz] = DIRS[dirs[0]];
  const ix = x - dx, iz = z - dz;
  const ik = `${ix},${iz}`;
  if (!fp.has(ik) || exteriorDirs(fp, ix, iz).length > 0) continue;
  for (let y = gr + 1; y <= 33; y++) {
    const cur = res.get(`${x},${y},${z}`);
    if (!cur || !cur[0].includes("pane")) continue;
    if (((x * 5 + y * 3 + z * 7) % 9) !== 0) continue;
    if (!res.has(`${ix},${y},${iz}`)) put(ix, y, iz, ["glowstone"]);
  }
}

// write the structure
const out = new Voxels([W, H, D]);
for (const [k, [id, props]] of res) {
  const [x, y, z] = k.split(",").map(Number);
  if (props) out.set(x, y, z, id, props);
  else out.set(x, y, z, id);
}
out.save(`${DIR}/${ID}.nbt`);
