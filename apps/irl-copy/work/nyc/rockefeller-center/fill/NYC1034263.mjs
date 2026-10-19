// 34 West 46th Street: a 1914 Midtown commercial and office block (a brick loft-office with
// stone trim, the usual shape for a narrow lot between the avenues). Its 46th Street front is
// the z = 0 side (streets run along x), and the lidar roof steps down from about 6 storeys on
// the street to 1 at the rear. Materials for the period and the city: brick walls, buff
// sandstone bands and quoins (limestone trim), polished granite for the street base and
// shopfront piers, glass in plain sash openings, a stone parapet, a flat tar roof with a
// penthouse on the tallest part. The interior is solid, with a one-block air pocket behind each
// window (the glass reads as set back), and some pockets hold glowstone.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034263.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, y, z) => `${x},${y},${z}`;
const roof = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));

// Massing: the lidar roof, median-filtered over the 3x3 footprint neighbourhood (drops the noise
// and the no-return holes), then quantised to 3-block storeys. Each cell stands on y 0.
const occ = new Set();
const colTop = new Map();
for (const [x, z] of cells) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = roof.get(`${x + dx},${z + dz}`); if (r !== undefined) near.push(r);
  }
  near.sort((a, b) => a - b);
  const h = Math.max(3, Math.min(18, 3 * Math.round(near[near.length >> 1] / 3)));
  colTop.set(`${x},${z}`, h);
}
// Two lidar-noise cells on the west edge rise one tier above a street tier they belong to and
// read as a stray pillar; they take the tier.
for (const k of ["0,3", "0,4"]) colTop.set(k, 15);
for (const [k, h] of colTop) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < h; y++) occ.add(key(x, y, z));
}

// The penthouse stands on the 6-storey core, two cells by three, three storeys high.
const core = colTop.get("4,9");
for (let z = 9; z <= 10; z++) for (let x = 3; x <= 5; x++) {
  if (colTop.get(`${x},${z}`) !== core) continue;
  for (let y = core; y < core + 3; y++) occ.add(key(x, y, z));
}

const DIRS = [[0, 0, -1], [0, 0, 1], [-1, 0, 0], [1, 0, 0]];   // N (the 46th Street front), S, W, E
const WINDOW_Z = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const WINDOW_X = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// Classify every building voxel: facade (exposed on a side), roof (open on top), or core.
const put = new Map();     // key -> { block, state }
const facade = new Set();
const openings = [];       // window and door voxels, each with its outward normal
for (const k of occ) {
  const [x, y, z] = k.split(",").map(Number);
  const out = DIRS.filter(([dx, dy, dz]) => !occ.has(key(x + dx, y + dy, z + dz)));
  const capped = occ.has(key(x, y + 1, z));
  if (!out.length) {
    put.set(k, { block: capped ? "stone" : "smooth_stone" });   // core, or the tar roof open to the sky
    continue;
  }
  facade.add(k);
  const [dx, , dz] = out[0];
  const corner = out.length > 1;
  const u = dx !== 0 ? z : x;                       // position along the face
  const ground = y < 3;
  const street = dz === -1 && z === 0;               // the 46th Street front

  if (y === 0) put.set(k, { block: "polished_granite" });                 // base course
  else if (corner) put.set(k, { block: "smooth_sandstone" });            // quoins
  else if (y % 3 === 0) put.set(k, { block: "smooth_sandstone" });       // storey bands
  else if (u % 3 === 0) put.set(k, { block: ground ? "polished_granite" : "bricks" });   // piers
  else if (street && ground && u === 4) {                                // the entrance
    put.set(k, { block: "dark_oak_door", state: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } });
    openings.push({ x, y, z, dx, dz, door: true });
  } else {                                                               // sash window
    put.set(k, { block: "glass_pane", state: dz !== 0 ? WINDOW_Z : WINDOW_X });
    openings.push({ x, y, z, dx, dz, door: false });
  }
}

// Parapet on every facade top, joined to the neighbouring parapet or solid wall at its side.
const parapets = new Set();
for (const k of facade) {
  const [x, y, z] = k.split(",").map(Number);
  if (!occ.has(key(x, y + 1, z))) parapets.add(key(x, y + 1, z));
}
for (const p of parapets) {
  const [x, y, z] = p.split(",").map(Number);
  const side = (dx, dz) => (occ.has(key(x + dx, y, z + dz)) || parapets.has(key(x + dx, y, z + dz)) ? "low" : "none");
  put.set(p, { block: "stone_brick_wall", state: { up: "true", north: side(0, -1), south: side(0, 1), west: side(-1, 0), east: side(1, 0), waterlogged: "false" } });
}

// The air pocket behind each opening (one block in, never into another facade). Some hold glowstone.
for (const o of openings) {
  const inward = key(o.x - o.dx, o.y, o.z - o.dz);
  if (facade.has(inward)) continue;
  const lit = !o.door && (o.x * 5 + o.y * 7 + o.z * 3) % 7 === 0;   // about one window in seven
  put.set(inward, lit ? { block: "glowstone" } : { block: "air" });
}

const g = new Voxels([10, 24, 28]);
for (const [k, { block, state }] of put) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const { blocks, palette } = g.save(`${DIR}/NYC1034263.nbt`);
console.log(`NYC1034263: ${blocks} blocks, palette ${palette}, core top ${core}, storeys ${core / 3}`);
