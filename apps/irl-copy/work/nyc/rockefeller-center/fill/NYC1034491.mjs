// 22 West 48th Street, 1940 commercial and office building, Moderne (Art Deco setback) in buff brick-and-stone, on a
// diorite base. Footprint 18 x 28; x runs across the 48th Street frontage (the z = 0 face has the shopfronts and the
// recessed entrance), z = 27 is the rear, x = 0 and x = 17 are the party-wall flanks. The lidar roof is median-smoothed
// over a 3 x 3 window (a 0 is no return, not a court) and quantised into five flat setback tiers (9, 21, 33, 45, 57
// blocks); every column is solid from y 0 to its tier, so no storey or tier floats. Facades are a pier grid (x or z
// = 1 mod 3, plus the corners) with 3-block storeys: a spandrel course on each y = 0 mod 3, two rows of glass between.
// Glass sits one block out from a solid core with an air gap behind it, a solid floor slab at each storey line, and a
// few panes have glowstone in the gap. The 57-block tower carries a stepped crown of smooth sandstone, capped in
// oxidised copper with a lantern. Top rows are parapets. No interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034491.cells.json`, "utf8"));
const X = 18, Z = 28, Y = 64;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && cell.has(`${x},${z}`);

// Lidar smoothing: the median of the cells around (and including) this one that have a return.
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const smooth = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = cell.get(`${x + dx},${z + dz}`); if (c && c.roof > 0) v.push(c.roof);
  }
  return v.length ? median(v) : 0;
};
// Flat setback tiers: the base (2-3 storeys), the wings, the mid-rise, the upper setback and the 57-block tower.
const tierOf = (h) => (h < 15 ? 9 : h < 27 ? 21 : h < 39 ? 33 : h < 51 ? 45 : 57);
const topMap = new Map();
for (const k of cell.keys()) { const [x, z] = k.split(",").map(Number); topMap.set(k, tierOf(smooth(x, z))); }
const topAt = (x, z) => (inFoot(x, z) ? topMap.get(`${x},${z}`) : 0);
const groundAt = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).ground : 0);

// A face is open at height y when the cell beside it is outside the footprint or its tier is at or below y.
const open = (x, y, z) => topAt(x, z) <= y;
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];   // N = 48th Street frontage (low z)
const exposed = (x, y, z) => DIRS.filter(([, dx, dz]) => open(x + dx, y, z + dz));

const g = new Voxels([X, Y, Z]);
const set = (x, y, z, block, state) => { if (y >= 0 && y < Y) g.set(x, y, z, block, state); };
const PANE = (d) => (d === "N" || d === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const lit = (x, y, z) => (x * 7 + y * 5 + z * 3) % 13 === 0;   // sparse, deterministic warm windows

const base = (y) => y < 9;   // the diorite base zone: the first three storeys

// Pass 1: the solid massing, foundation to the tier top; the core is light concrete, with stone under the ground.
for (const k of cell.keys()) {
  const [x, z] = k.split(",").map(Number), T = topAt(x, z), G = groundAt(x, z);
  for (let y = 0; y < T; y++) set(x, y, z, y < G ? "stone_bricks" : "light_gray_concrete");
  set(x, T - 1, z, "gray_concrete");   // tar and gravel roof on the tier top
}

// Pass 2: the facade skin, on every solid cell that an open face exposes.
const air = [], glow = [], parapet = [];
for (const k of cell.keys()) {
  const [x, z] = k.split(",").map(Number), T = topAt(x, z);
  for (let y = 0; y < T; y++) {
    const ex = exposed(x, y, z);
    if (!ex.length) continue;
    const [name, dx, dz] = ex[0];
    const u = name === "N" || name === "S" ? x : z;
    const pier = ex.length > 1 || u % 3 === 1;   // the corners are where two faces meet
    const isGlassRow = y % 3 !== 0 && y < T - 1;
    const mat = base(y) ? "polished_diorite" : "smooth_sandstone";
    if (y === T - 1 || !isGlassRow || pier) {
      set(x, y, z, mat);                                       // spandrel, pier, corner or the top course
      if (y === T - 1) parapet.push([x, T, z]);
      continue;
    }
    if (name === "N" && base(y) && (y === 1 || y === 2)) { set(x, y, z, "glass"); continue; }   // shopfront
    set(x, y, z, "light_blue_stained_glass_pane", PANE(name));
    const ix = x - dx, iz = z - dz;                            // the cell behind the glass
    const inside = inFoot(ix, iz) && y < topAt(ix, iz) && !exposed(ix, y, iz).length;
    if (inside && y <= T - 2) { if (lit(x, y, z)) glow.push([ix, y, iz]); else air.push([ix, y, iz]); }
  }
}
for (const [x, y, z] of air) set(x, y, z, "air");
for (const [x, y, z] of glow) set(x, y, z, "glowstone");
for (const [x, y, z] of parapet) {
  if (inFoot(x, z) && exposed(x, y - 1, z).length) set(x, y, z, "smooth_sandstone");
}

// The entrance: a recess on the 48th Street frontage (x 8-9, three storeys tall) under a diorite soffit, with iron doors.
for (let y = 1; y <= 3; y++) {
  for (const x of [8, 9]) { set(x, y, 0, "air"); set(x, y, 1, "air"); set(x, y, 2, "polished_diorite"); }
  for (const x of [7, 10]) set(x, y, 1, "polished_diorite");
}
for (let x = 7; x <= 10; x++) for (let z = 0; z <= 1; z++) set(x, 4, z, "polished_diorite");   // soffit
for (const x of [8, 9]) {
  const hinge = x === 8 ? "left" : "right";
  set(x, 1, 0, "iron_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  set(x, 2, 0, "iron_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  set(x, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// The tower crown: a stepped smooth-sandstone drum on the 57-block tier, capped in oxidised copper with a lantern.
for (let x = 6; x <= 11; x++) for (let z = 11; z <= 16; z++) {
  if (topAt(x, z) !== 57) throw new Error(`crown at ${x},${z} would float on tier ${topAt(x, z)}`);
  set(x, 57, z, "smooth_sandstone"); set(x, 58, z, "smooth_sandstone");
}
for (let x = 7; x <= 10; x++) for (let z = 12; z <= 15; z++) { set(x, 59, z, "smooth_sandstone"); set(x, 60, z, "smooth_sandstone"); }
for (let x = 8; x <= 9; x++) for (let z = 13; z <= 14; z++) set(x, 61, z, "oxidized_cut_copper");
set(8, 62, 13, "lantern", { hanging: "false", waterlogged: "false" });

const { blocks, palette } = g.save(`${DIR}/NYC1034491.nbt`);
console.log(`NYC1034491.nbt: ${blocks} blocks, palette ${palette}`);
