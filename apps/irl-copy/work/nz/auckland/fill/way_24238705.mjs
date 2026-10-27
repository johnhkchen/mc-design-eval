// Way 24238705, Mt Eden side of the CBD: a 1960s-70s reinforced-concrete office block, four storeys over a basalt
// plinth. The lidar's roof heights are smoothed into flat tiers (3, 7, 11, 15, 19); the 19-tier is the body of the
// block, the lower tiers are the stepped wings and the low north forecourt. Each storey is 4 rows: a floor slab, two
// rows of glass in pale concrete piers on a 3-block bay, and a lintel band; the top storey's cap is the parapet.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_24238705.cells.json`, "utf8"));
const SIZE = [19, 32, 46];

const key = (x, y, z) => `${x},${y},${z}`;
const FP = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const tierOf = (r) => (r <= 5 ? 3 : r <= 9 ? 7 : r <= 13 ? 11 : r <= 17 ? 15 : 19);
const topOf = (x, z) => tierOf(FP.get(`${x},${z}`).r);
const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// the faces of a cell at row y that look out on air: off the footprint, or onto a neighbour whose roof is below y
function exposed(x, z, y) {
  return DIRS.filter(([, dx, dz]) => {
    const n = FP.get(`${x + dx},${z + dz}`);
    return !n || tierOf(n.r) <= y;
  }).map(([d]) => d);
}

function blockAt(x, z, y, g, T) {
  if (y < g) return ["deepslate"];                                  // foundation, down to the lowest ground
  if (y < 3) return ["deepslate_tiles"];                            // basalt base course to the 3-block floor line
  if (y === T - 1) return [exposed(x, z, y).length ? "white_concrete" : "light_gray_concrete"]; // parapet / roof
  const o = (y - 3) % 4;                                            // 0 floor slab, 1-2 glass, 3 lintel
  const ex = exposed(x, z, y);
  if (o === 0) return [ex.length ? "light_gray_concrete" : "smooth_stone"];
  if (!ex.length) return null;                                      // interior air behind the glass
  if (o === 3) return ["light_gray_concrete"];
  const exZ = ex.some((d) => d === "N" || d === "S");
  const exX = ex.some((d) => d === "W" || d === "E");
  const pier = (exZ && exX) || (exZ && x % 3 === 0) || (exX && z % 3 === 0);
  return [pier ? "white_concrete" : "light_blue_stained_glass_pane"];
}

const placed = new Map();
const put = (x, y, z, block, state) => placed.set(key(x, y, z), { block, state });

for (const [k, { g, r }] of FP) {
  const [x, z] = k.split(",").map(Number);
  const T = tierOf(r);
  for (let y = 0; y < T; y++) {
    const b = blockAt(x, z, y, g, T);
    if (b) put(x, y, z, b[0], b[1]);
  }
}

// the entrance: an iron door on the west face (the north forecourt is only a podium), a canopy band over it
for (const y of [4, 5]) {
  put(0, y, 20, "iron_door", { facing: "west", half: y === 4 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
}
for (const z of [19, 20, 21]) put(0, 6, z, "stone_brick_slab", { type: "top", waterlogged: "false" });

// warm light behind some glass: lanterns stand on the ground-floor slab, glowstone and shroomlight above it
for (const [k, { r }] of FP) {
  const [x, z] = k.split(",").map(Number);
  const T = tierOf(r);
  for (let f = 3; f + 4 <= T; f += 4) {
    const y = f + 1;
    const cur = placed.get(key(x, y, z));
    if (!cur || !cur.block.endsWith("glass_pane")) continue;
    const ex = exposed(x, z, y);
    if (!ex.length || (x * 5 + z * 3 + f) % 5 !== 0) continue;
    const [dx, dz] = ex[0] === "N" ? [0, 1] : ex[0] === "S" ? [0, -1] : ex[0] === "W" ? [1, 0] : [-1, 0];
    const ix = x + dx, iz = z + dz;
    if (!FP.has(`${ix},${iz}`) || placed.has(key(ix, y, iz))) continue;
    if (f === 3) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    else put(ix, y, iz, (x + z + f) % 2 ? "glowstone" : "shroomlight");
  }
}

// glass panes connect to the neighbours they meet (panes and solid walls), as the game would draw them
const NOT_WALL = /door|lantern|glowstone|shroomlight|slab/;
for (const [k, v] of placed) {
  if (!v.block.endsWith("glass_pane")) continue;
  const [x, y, z] = k.split(",").map(Number);
  const meets = (dx, dz) => {
    const n = placed.get(key(x + dx, y, z + dz));
    return !!n && (n.block.endsWith("glass_pane") || !NOT_WALL.test(n.block));
  };
  v.state = { north: meets(0, -1), south: meets(0, 1), west: meets(-1, 0), east: meets(1, 0), waterlogged: "false" };
}

// a block with nothing under it and nothing beside it at its own row would hang in the air: count them
let floating = 0;
for (const [k, v] of placed) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 0) continue;
  const below = placed.has(key(x, y - 1, z));
  const beside = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => placed.has(key(x + dx, y, z + dz)));
  if (!below && !beside && v.block !== "lantern") floating++;
}

const g = new Voxels(SIZE);
for (const [k, v] of placed) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = `${DIR}/way_24238705.nbt`;
const { blocks, palette } = g.save(out);
console.log(`way_24238705: ${blocks} blocks, palette ${palette}, unsupported ${floating} -> ${out}`);
