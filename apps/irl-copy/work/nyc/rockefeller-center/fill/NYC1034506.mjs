// 600 5 Avenue, 1949 commercial and office building (NYC individual landmark). Footprint 54 x 26 (x along the 54-block
// front, low z = north = the street frontage with the entrance, low x = the Fifth Avenue end with shopfronts).
// Read as a mid-century modern office block in limestone and glass: a 13-storey limestone podium on the west and
// north-west, 9-storey wings on the east and south, a 95-block setback on the mid-block and east, and a 101-block
// tower in the middle, with a 104-block mechanical penthouse on it. Lidar roof is quantised into those tiers (roof 0
// is a light court, filled where the lidar lost a single cell in a roof). Storeys are 3 blocks: a solid spandrel band
// at y % 3 == 0 carries every floor slab, and the window band between is glass in iron frames, one block out from a
// solid core with an air gap behind (no interiors). Shopfronts sit on the north and west ground floors, a recessed
// entrance on the north face (x 22-25), and warm glowstone shows behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034506.cells.json`, "utf8"));
const X = 54, Y = 113, Z = 26;
const idx = (x, z) => z * X + x;
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N, S, W, E
const inGrid = (x, z) => x >= 0 && z >= 0 && x < X && z < Z;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));

// Lidar roof, with single missing cells inside a roof filled from their neighbours (3 or more built sides).
const roofOf = (x, z) => {
  const r = cell.get(`${x},${z}`).roof;
  if (r > 0) return r;
  const vs = NB.map(([dx, dz]) => cell.get(`${x + dx},${z + dz}`)?.roof ?? 0).filter((v) => v > 0);
  return vs.length >= 3 ? Math.round(vs.reduce((a, b) => a + b, 0) / vs.length) : 0;
};
// Tiers: 27 (wings), 40 (podium), 95 (setback), 101 (tower). 0 = open court.
const tierOf = (r) => (r <= 0 ? 0 : r < 33 ? 27 : r < 50 ? 40 : r < 98 ? 95 : 101);
const CROWN = { x0: 20, x1: 27, z0: 9, z1: 14, top: 104 };
const ENTRY = { x0: 22, x1: 25 };   // north-face entrance: calcite ends, glass doors, under the storey-3 slab

const TOP = new Int16Array(X * Z);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const t = tierOf(roofOf(x, z));
  TOP[idx(x, z)] = t === 101 && x >= CROWN.x0 && x <= CROWN.x1 && z >= CROWN.z0 && z <= CROWN.z1 ? CROWN.top : t;
}
const inFoot = (x, z) => inGrid(x, z) && cell.has(`${x},${z}`);

// Depth of each built cell from the open air at each height: 1 = the facade, 2 = the air gap behind it, 3+ = core.
// Outside the footprint and open courts count as open. Breadth-first from the edge cells of each level.
const depthAt = [];
for (let y = 0; y < Y; y++) {
  const d = new Int8Array(X * Z), q = [];
  const open = (x, z) => !inGrid(x, z) || TOP[idx(x, z)] <= y;
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    if (TOP[idx(x, z)] <= y) continue;
    if (NB.some(([dx, dz]) => open(x + dx, z + dz))) { d[idx(x, z)] = 1; q.push(idx(x, z)); }
  }
  for (let h = 0; h < q.length; h++) {
    const i = q[h], x = i % X, z = (i - x) / X;
    for (const [dx, dz] of NB) {
      const nx = x + dx, nz = z + dz;
      if (!inGrid(nx, nz) || TOP[idx(nx, nz)] <= y || d[idx(nx, nz)]) continue;
      d[idx(nx, nz)] = d[i] + 1; q.push(idx(nx, nz));
    }
  }
  depthAt.push(d);
}
const faceAt = (x, y, z) => {
  const dirs = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
  for (const [d, dx, dz] of dirs) {
    const nx = x + dx, nz = z + dz;
    if (!inGrid(nx, nz) || TOP[idx(nx, nz)] <= y) return d;
  }
  return null;
};

// Materials per block kind. The window band takes the pane and an iron frame; spandrels are the slabs in the storey lines.
const KIND = (top) => (top === CROWN.top ? "crown" : top === 27 ? "wing" : top === 40 ? "podium" : "tower");
const MAT = {
  wing: { spandrel: "smooth_stone", cap: "smooth_stone", pane: "light_gray_stained_glass_pane" },
  podium: { spandrel: "calcite", cap: "calcite", pane: "light_gray_stained_glass_pane" },
  tower: { spandrel: "light_gray_concrete", cap: "calcite", pane: "cyan_stained_glass_pane" },
  crown: { spandrel: "smooth_quartz", cap: "smooth_quartz", pane: "cyan_stained_glass_pane" },
};
// Pane and frame state: a pane on a face along x connects east-west, one on a face along z connects north-south.
const PANE = (face) => (face === "N" || face === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 11 === 0;   // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const { ground } = cell.get(`${x},${z}`), top = TOP[idx(x, z)];
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");   // foundation: nothing floats on the slope
  if (!top) { g.set(x, ground, z, "smooth_stone"); continue; }  // open court: paving
  const m = MAT[KIND(top)];

  // Parapet: the roof edge where a neighbour is lower, or the footprint ends.
  if (NB.some(([dx, dz]) => !inGrid(x + dx, z + dz) || TOP[idx(x + dx, z + dz)] < top)) g.set(x, top, z, "calcite");

  for (let y = ground; y < top; y++) {
    const d = depthAt[y][idx(x, z)];
    if (y === top - 1) { g.set(x, y, z, d === 1 ? m.cap : "stone"); continue; }    // roof covering
    if (y === ground) { g.set(x, y, z, d === 1 ? "polished_granite" : "stone"); continue; }   // base course
    if (y % 3 === 0) { g.set(x, y, z, d === 1 ? m.spandrel : "stone"); continue; }   // storey line: floor slab
    if (d === 2) { if (lit(x, y, z)) g.set(x, y, z, "glowstone"); continue; }        // air gap; warm light behind glass
    if (d !== 1) { g.set(x, y, z, "stone"); continue; }                              // core
    const face = faceAt(x, y, z), u = face === "N" || face === "S" ? x : z;
    if (y < 3 && (face === "N" || face === "W")) {                                   // shopfronts, entrance on the north
      const entry = face === "N" && x >= ENTRY.x0 && x <= ENTRY.x1;
      g.set(x, y, z, entry ? (x === ENTRY.x0 || x === ENTRY.x1 ? "calcite" : "glass") : u % 3 === 0 ? "calcite" : "glass");
      continue;
    }
    g.set(x, y, z, u % 3 === 0 ? "iron_bars" : m.pane, PANE(face));                  // mullion or pane
  }
}

const out = `${DIR}/NYC1034506.nbt`;
const { blocks, palette } = g.save(out);
console.log(`wrote ${out}: ${blocks} blocks, ${palette} palette entries`);
