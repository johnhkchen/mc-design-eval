// 425 3rd St SW (Commercial-Office-Large), the Southwest office block by L'Enfant Plaza. Read from the lidar record:
// a 1970s-style concrete-and-tinted-glass office. A 20-block main body on the east and south, an 18-block wing on the
// north-west and a one-cell 15-block strip on the east edge, each stepping down from the one behind it. Storeys are 3
// blocks: two window rows between a floor slab; a glass lobby on the street face (west) with a double door; white
// concrete piers, tinted panes between, a stone cornice and a parapet. Behind the glass an air gap one cell deep, then
// the floor slabs; warm glowstone sits in some of those gaps. Roof plant on the 20-block deck.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC57482.cells.json`, "utf8"));
const W = 16, D = 26, H = 31;   // the footprint is 16 x 26; the template's height

const k = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [k(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(k(x, z));

// Lidar roof per cell: the median of its 3x3 footprint neighbours (kills single-cell noise), then snapped to three flat
// tiers: 15 (the east strip), 18 (the north-west wing), 20 (the main body).
const snap = (r) => (r <= 16 ? 15 : r <= 18 ? 18 : 20);
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = byXZ.get(k(x + dx, z + dz)); if (c) v.push(c.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const roofOf = new Map(cells.map(([x, z]) => [k(x, z), snap(median(x, z))]));

// Exposed faces of a cell: a side with no footprint cell beyond it.
const OFF = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const faces = (x, z) => Object.keys(OFF).filter((f) => !inside(x + OFF[f][0], z + OFF[f][1]));
// Piers on each facade: every third cell along the face (z on the east and west faces, x on the north and south).
const pierOn = (fs, x, z) => fs.some((f) => (f === "W" || f === "E" ? z % 3 === 0 : x % 3 === 0));

// Storey rows from the ground up: plinth at 0, window rows 1-2 of each 3-block storey, a floor slab on the 3s, a cornice
// two below the roof, a deck under the roof, a parapet on the edge.
const rowKind = (y, t) => {
  if (y === 0) return "plinth";
  if (y === t - 1) return "deck";
  if (y === t - 2 && t - 2 >= 3) return "cornice";
  if (y % 3 === 0) return "slab";
  return "window";
};

const B = new Map();                                    // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });

for (const [x, z] of cells) {
  const t = roofOf.get(k(x, z)), fs = faces(x, z), edge = fs.length > 0;
  // The plinth is the base course on every cell, the lowest one included (its wall would hang over air otherwise).
  put(x, 0, z, "polished_granite");
  for (let y = 1; y < t; y++) {
    const kind = rowKind(y, t);
    if (kind === "slab") put(x, y, z, "light_gray_concrete");
    else if (kind === "cornice") put(x, y, z, "smooth_stone");
    else if (kind === "deck") put(x, y, z, "gray_concrete");
    else if (edge) {                                    // window row on the facade
      const door = y <= 2 && x === 0 && (z === 11 || z === 12) && fs.includes("W");
      if (door) {
        const hinge = z === 11 ? "left" : "right";
        const st = (half) => ({ facing: "west", half, hinge, open: "false", powered: "false" });
        put(x, y, z, "iron_door", st(y === 1 ? "lower" : "upper"));
      } else if (pierOn(fs, x, z)) put(x, y, z, "white_concrete");
      else if (y <= 2) put(x, y, z, "light_blue_stained_glass");      // lobby glass
      else put(x, y, z, "gray_stained_glass_pane");                   // panes; connections set below
    }
  }
  if (edge) put(x, t, z, "smooth_stone");                             // parapet on the edge
}

// Warm light in some glass bays: a glowstone in the air gap directly behind the glass, sitting on the slab below it.
for (const [x, z] of cells) {
  const t = roofOf.get(k(x, z)), fs = faces(x, z);
  if (!fs.length) continue;
  for (let y = 1; y < t - 2; y += 3) {                  // rows 1, 4, 7 ... the window row above each slab
    const v = B.get(`${x},${y},${z}`);
    if (!v || v.block === "white_concrete" || v.block === "iron_door") continue;
    if ((x + z + y) % 4 !== 0) continue;
    const f = fs[0], [dx, dz] = OFF[f];
    const ix = x - dx, iz = z - dz;                       // one cell in from the glass
    if (!inside(ix, iz) || faces(ix, iz).length) continue;
    if (rowKind(y, roofOf.get(k(ix, iz))) !== "window") continue;
    put(ix, y, iz, "glowstone");
  }
}

// Panes join their neighbours in the same facade (panes or piers), so the grid reads as framed glass.
for (const [key, v] of B) {
  if (v.block !== "gray_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const link = (dx, dz) => {
    const n = B.get(`${x + dx},${y},${z + dz}`);
    return n && (n.block === "gray_stained_glass_pane" || n.block === "white_concrete") ? "true" : "false";
  };
  v.state = { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0), waterlogged: "false" };
}

// Roof plant: 2 x 2 x 2 mechanical boxes on the 20-block deck, away from the edge and from each other.
const plant = [];
for (let x = 1; x < W - 2 && plant.length < 3; x++) for (let z = 1; z < D - 2 && plant.length < 3; z++) {
  const sq = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!sq.every(([a, b]) => inside(a, b) && !faces(a, b).length && roofOf.get(k(a, b)) === 20)) continue;
  if (plant.some(([px, pz]) => Math.abs(px - x) < 5 && Math.abs(pz - z) < 5)) continue;
  plant.push([x, z]);
}
for (const [x, z] of plant) for (let y = 20; y < 22; y++) for (const dx of [0, 1]) for (const dz of [0, 1]) put(x + dx, y, z + dz, "iron_block");

const g = new Voxels([W, H, D]);
for (const [key, { block, state }] of B) { const [x, y, z] = key.split(",").map(Number); g.set(x, y, z, block, state); }
const out = g.save(`${DIR}/DC57482.nbt`);
console.log(JSON.stringify({ cells: cells.length, roofs: Object.fromEntries([15, 18, 20].map((t) => [t, [...roofOf.values()].filter((r) => r === t).length])), plant: plant.length, ...out }));
