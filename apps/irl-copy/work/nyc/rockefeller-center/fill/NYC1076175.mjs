// 141 West 53rd Street, a 1988 commercial and office building: a 138-block setback office tower in the 1980s Midtown
// manner. Massing from the lidar, smoothed by a 5 x 5 median and snapped to tier tops that are multiples of 3 (so the
// storey lines sit on y = 0, 3, 6...): a low stone podium of 9 to 30 blocks around the lot, a 129-block blue-glass
// shoulder ring, the 138-block tower core and a 6-block mechanical penthouse (to 144) on its centre. Every tier is a
// stacked column from y 0, so nothing floats. A granite base course and clear-glass shopfronts on the ground floor; the
// lobby door on the north face (low z, the 53rd Street frontage) under a dark canopy. Each storey is a spandrel row,
// then two rows of glass between mullions in front of a one-block air gap with a floor slab at each storey line, then a
// stone core (no interiors). The top storey of each tier is solid behind its glass. Glowstone sits behind some panes.
// Open lidar-0 ground stays open; a granite parapet caps every roof edge.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1076175.cells.json`, "utf8"));
const X = 54, Y = 150, Z = 54;

// Lidar roof per footprint cell; roof 0 is open ground. Smooth with the median of the built cells in a 5 x 5 window,
// then snap to a tier top. Anything above 131 is the tower; the 9-30 range is the podium.
const roof = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const built = (x, z) => (roof.get(`${x},${z}`) ?? 0) > 0;
const tierOf = (r) => (r <= 10 ? 9 : r <= 16 ? 15 : r <= 22 ? 21 : r <= 28 ? 27 : r <= 112 ? 30 : r <= 131 ? 129 : 138);

const top = new Uint16Array(X * Z);                       // tier top per cell, index z * X + x; 0 = open ground
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!built(x, z)) continue;
  const v = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const r = roof.get(`${x + dx},${z + dz}`) ?? 0; if (r > 0) v.push(r); }
  v.sort((a, b) => a - b);
  top[z * X + x] = tierOf(v[v.length >> 1]);
}
const T = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : top[z * X + x]);
// Lidar edge noise leaves one-cell spikes: a tall cell with at most one neighbour as tall drops to its tallest lower
// neighbour (or to open ground), twice, so a spike cannot survive a second pass.
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];
for (let pass = 0; pass < 2; pass++) {
  const next = top.slice();
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const t = top[z * X + x];
    if (t < 27) continue;
    const nb = NB.map(([dx, dz]) => T(x + dx, z + dz));
    if (nb.filter((n) => n >= t).length <= 1) next[z * X + x] = Math.max(0, ...nb.filter((n) => n < t));
  }
  top.set(next);
}
// Mechanical penthouse on the tower's centre (the 138 core), two storeys of louvres.
for (let z = 20; z <= 33; z++) for (let x = 20; x <= 33; x++) if (top[z * X + x] === 138) top[z * X + x] = 144;

const MAT = {
  podium: { spandrel: "calcite", mullion: "polished_andesite", glass: "light_blue_stained_glass_pane" },
  tower: { spandrel: "light_gray_concrete", mullion: "polished_andesite", glass: "light_blue_stained_glass_pane" },
  mech: { spandrel: "light_gray_concrete", mullion: "light_gray_concrete", glass: "gray_concrete" },
};
const styleOf = (t) => (t === 144 ? "mech" : t >= 129 ? "tower" : "podium");
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane in a face along x
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane in a face along z
const DIRS = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];

const g = new Voxels([X, Y, Z]);
const depth = new Int16Array(X * Z);
const D = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? -1 : depth[z * X + x]);

for (let y = 0; y < 144; y++) {
  const occ = (x, z) => T(x, z) > y;
  const s = Math.floor(y / 3), rel = y % 3;
  depth.fill(-1);

  // Depth 0 is the skin: a cell with a side open to the air or the lot's edge. Depth 1 is the air gap behind the
  // skin, depth 2 and deeper is the core. Breadth-first inward from the skin, one layer at a time.
  const q = [];
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    if (occ(x, z) && DIRS.some(([dx, dz]) => !occ(x + dx, z + dz))) { depth[z * X + x] = 0; q.push(z * X + x); }
  }
  for (let i = 0; i < q.length; i++) {
    const k = q[i], x = k % X, z = (k - x) / X;
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (!occ(nx, nz) || depth[nz * X + nx] >= 0) continue;
      depth[nz * X + nx] = depth[k] + 1; q.push(nz * X + nx);
    }
  }

  for (const k of q) {
    const x = k % X, z = (k - x) / X, d = depth[k], t = T(x, z), style = styleOf(t), m = MAT[style];
    if (d >= 2) { g.set(x, y, z, "stone"); continue; }

    if (d === 1) {
      // The air gap: a floor slab at the storey line, air in the two rows above it, a cap on the top storey.
      if (rel === 0 || y >= t - 3) { g.set(x, y, z, "stone"); continue; }
      if (rel !== 1 || style === "mech") continue;
      const out = DIRS.find(([dx, dz]) => D(x + dx, z + dz) === 0);
      const along = out[2] === "N" || out[2] === "S";
      const u = along ? x : z;
      if (u % 3 !== 0 && (u * 7 + s * 5 + (along ? 0 : 2)) % 5 === 0) g.set(x, y, z, "glowstone");
      continue;
    }

    // The skin. Rows: a spandrel (the storey floor line), then two rows of glass; the base course on storey 0.
    if (rel === 0) { g.set(x, y, z, y < 3 ? "polished_granite" : m.spandrel); continue; }
    const faces = DIRS.filter(([dx, dz]) => !occ(x + dx, z + dz));
    const mullion = s === 0 ? "polished_granite" : m.mullion;
    if (faces.length > 1) { g.set(x, y, z, mullion); continue; }
    const [face] = faces, along = face[2] === "N" || face[2] === "S";
    const u = along ? x : z;
    if (u % 3 === 0) { g.set(x, y, z, mullion); continue; }
    const pane = along ? PANE_NS : PANE_EW;
    if (style === "mech") g.set(x, y, z, m.glass);
    else if (s === 0) g.set(x, y, z, "glass_pane", pane);                         // clear shopfront glass
    else g.set(x, y, z, m.glass, pane);
  }
}

// Roof edges: a granite parapet on each cell whose neighbour is lower (or the lot's edge), on top of the tier.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const t = T(x, z);
  if (t && NB.some(([dx, dz]) => T(x + dx, z + dz) < t)) g.set(x, t, z, "polished_granite");
}

// The lobby on the north face: a dark oak door at x 26 under a black canopy band at storey 1, and a lamp inside.
if (T(26, 0) <= 3) throw new Error("no wall at the lobby door");
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(26, 1, 0, "dark_oak_door", { ...DOOR, half: "lower" });
g.set(26, 2, 0, "dark_oak_door", { ...DOOR, half: "upper" });
for (let x = 24; x <= 28; x++) for (let z = 0; z <= 1; z++) g.set(x, 3, z, "black_concrete");
g.set(26, 1, 1, "glowstone");

const { blocks, palette } = g.save(`${DIR}/NYC1076175.nbt`);
const tops = {}; for (let i = 0; i < top.length; i++) if (top[i]) tops[top[i]] = (tops[top[i]] ?? 0) + 1;
console.log(JSON.stringify({ blocks, palette, tiers: tops }));
