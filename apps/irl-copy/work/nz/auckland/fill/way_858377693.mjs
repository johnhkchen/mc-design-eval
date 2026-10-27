import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Swanson House: a 1980s office block on a stone plinth. The lidar roof sets three tiers: 65 over the wings,
// 69 round a ring, 72 on the core (smoothed into clean tiers). Each column is solid from y 0 to its ground,
// then body from its ground to its top. Storeys are 4 blocks: a slab line at y % 4 == 0 (from y 8), two rows
// of glazing between concrete piers, a spandrel row. The ground two storeys are a shopfront plinth. Exterior
// walls are the cells a column shares with nothing (the footprint edge, or a neighbour that stops lower);
// interior cells stay air, so each pane has an air gap behind it.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const W = 30, D = 27, H = 85;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FRAME = "light_gray_concrete", SPAN = "white_concrete", GLASS = "cyan_stained_glass_pane";
const PLINTH = "polished_andesite", FOUND = "stone_bricks", FLOOR = "smooth_stone", ROOF = "smooth_quartz";

const cells = JSON.parse(readFileSync(`${DIR}/way_858377693.cells.json`, "utf8"));
const at = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, g, r] of cells) at[x][z] = { g, r, T: 0 };
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && at[x][z] !== null;
const cellsList = cells.map(([x, z]) => [x, z]);

// lidar holes (roof 0 or 1 where the scan missed): the median of the valid neighbours
for (const [x, z] of cellsList) {
  const c = at[x][z]; if (c.r >= 50) continue;
  const nb = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at[x + dx]?.[z + dz]; if (n && n.r >= 50) nb.push(n.r); }
  nb.sort((a, b) => a - b); c.r = nb[nb.length >> 1] ?? 65;
}
// tiers from the roof, then one majority pass on the 3x3 so the setbacks have no notches
const tierOf = (r) => (r >= 70 ? 72 : r >= 67 ? 69 : 65);
for (const [x, z] of cellsList) at[x][z].T = tierOf(at[x][z].r);
const smoothT = cellsList.map(([x, z]) => {
  const count = {};
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = at[x + dx]?.[z + dz]; if (n) count[n.T] = (count[n.T] || 0) + 1; }
  const best = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 4 ? Number(best[0]) : at[x][z].T;
});
cellsList.forEach(([x, z], i) => { at[x][z].T = smoothT[i]; });

// a column's body is open to the sky on a side where the neighbour is missing or stops below this row
const top = (x, z) => at[x]?.[z]?.T ?? -1;
const openDirs = (x, z, y) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz) || y >= top(x + dx, z + dz));
// piers every third cell along a face: a face runs along z when its normal is x, and along x otherwise
const isPier = (dirs, x, z) => dirs.some(([dx, dz]) => ((dx !== 0 ? z : x) % 3) === 0);

// the entrance: a south-facing bay of three cells, on the lowest ground (so the door is never sunk)
const southFace = (x, z) => inFp(x, z) && !inFp(x, z + 1);
const entrance = cellsList
  .filter(([x, z]) => southFace(x - 1, z) && southFace(x, z) && southFace(x + 1, z))
  .sort((a, b) => at[a[0]][a[1]].g - at[b[0]][b[1]].g || Math.abs(a[0] - 14) - Math.abs(b[0] - 14))[0];
if (!entrance) throw new Error("no south-facing entrance bay on this footprint");
const [DX, DZ] = entrance;
const bay = new Set([`${DX - 1},${DZ}`, `${DX},${DZ}`, `${DX + 1},${DZ}`]);

const v = new Voxels([W, H, D]);
const panes = [];
const put = (x, y, z, b) => { v.set(x, y, z, b); if (b === GLASS) panes.push([x, y, z]); };

// body: foundation, floor, storeys, roof
for (const [x, z] of cellsList) {
  const { g, T } = at[x][z];
  for (let y = 0; y < g; y++) put(x, y, z, FOUND);
  for (let y = g; y < T; y++) {
    const dirs = openDirs(x, z, y), ext = dirs.length > 0;
    let b = null;
    if (y === g) b = ext ? PLINTH : FLOOR;
    else if (y === T - 1) b = ROOF;
    else if (y < 8) {
      if (ext) {
        if (bay.has(`${x},${z}`) && y <= g + 2) b = FRAME;          // door frame, door set below
        else if (bay.has(`${x},${z}`) && y === g + 3) b = FRAME;    // lintel over the entrance
        else b = isPier(dirs, x, z) ? FRAME : GLASS;
      }
    } else if (y % 4 === 0) b = FRAME;                              // storey slab, under every cell
    else if (ext) b = y % 4 === 3 ? SPAN : (isPier(dirs, x, z) ? FRAME : GLASS);
    if (b) put(x, y, z, b);
  }
}

// parapet on the outer edge of the top
for (const [x, z] of cellsList) {
  if (!inFp(x + 1, z) || !inFp(x - 1, z) || !inFp(x, z + 1) || !inFp(x, z - 1)) put(x, top(x, z), z, FRAME);
}

// the core's penthouse: cells whose eight neighbours are all on the 72 tier; a glazed band, roof at 75
const key = (x, z) => `${x},${z}`;
const t72 = (x, z) => inFp(x, z) && at[x][z].T === 72;
const pent = new Set(cellsList.filter(([x, z]) => {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (!t72(x + dx, z + dz)) return false;
  return true;
}).map(([x, z]) => key(x, z)));
for (const k of pent) {
  const [x, z] = k.split(",").map(Number);
  const edge = DIRS.some(([dx, dz]) => !pent.has(key(x + dx, z + dz)));
  if (edge) { put(x, 72, z, FRAME); put(x, 73, z, GLASS); put(x, 74, z, FRAME); }
  put(x, 75, z, ROOF);
}

// two plant boxes on the wings: 2 x 2 cells, all on the 65 tier, away from the edge and the penthouse
const t65 = (x, z) => inFp(x, z) && at[x][z].T === 65 && !pent.has(key(x, z));
const plant = [];
for (const [x, z] of cellsList) {
  if (plant.length >= 2) break;
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  const inside = quad.every(([a, b]) => t65(a, b) && t65(a - 1, b) && t65(a + 1, b) && t65(a, b - 1) && t65(a, b + 1));
  if (!inside || plant.some(([px, pz]) => Math.abs(px - x) < 3 && Math.abs(pz - z) < 3)) continue;
  plant.push([x, z]);
  for (const [a, b] of quad) for (let y = 65; y <= 66; y++) put(a, y, b, "gray_concrete");
}

// warm lights: hanging lanterns in the top row of every other storey's interior, under the slab above
for (const [x, z] of cellsList) {
  if (x % 4 !== 2 || z % 4 !== 2) continue;
  const { g, T } = at[x][z];
  for (let L = 16; L + 4 < T; L += 8) {
    const y = L + 3;
    if (y <= g || openDirs(x, z, y).length > 0 || v.val(x, y, z) !== 0 || v.val(x, y + 1, z) === 0) continue;
    v.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// the pane connections: a pane joins any neighbour that is a block (not air, a door or a lantern)
const NOCON = new Set(["minecraft:dark_oak_door", "minecraft:lantern"]);
const joins = (x, y, z) => { const c = v.get(x, y, z); return !!c && !NOCON.has(c.block); };
for (const [x, y, z] of panes) {
  v.set(x, y, z, GLASS, {
    north: String(joins(x, y, z - 1)), south: String(joins(x, y, z + 1)),
    east: String(joins(x + 1, y, z)), west: String(joins(x - 1, y, z)), waterlogged: "false",
  });
}

// the entrance door (faces out, south), two blocks high on the bay's middle cell
const g0 = at[DX][DZ].g;
v.set(DX, g0 + 1, DZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(DX, g0 + 2, DZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

const stats = v.save(`${DIR}/way_858377693.nbt`);
const top_ = Math.max(...cellsList.map(([x, z]) => at[x][z].T));
console.log(JSON.stringify({ cells: cellsList.length, tiers: [...new Set(cellsList.map(([x, z]) => at[x][z].T))], topY: top_, penthouse: pent.size, plant: plant.length, entrance, panes: panes.length, ...stats }));
