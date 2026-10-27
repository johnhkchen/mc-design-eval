// Way 1095570509, Mt Eden / Eden Terrace: a 1930s stripped-classical brick commercial block, three storeys on a
// stepped plan. Storeys are 4 blocks (floors at y 0, 4, 8; roof at the lidar height). Lidar roof heights are
// smoothed into three flat tiers: 12 (three storeys), 10 (two storeys and a deep cornice band), 7 (two storeys, low wing).
// Shell cells carry the walls; interior cells hold only floor slabs and a roof membrane, with air between.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570509.cells.json", "utf8"));
const W = 12, D = 9, H = 25;
const g = new Voxels([W, H, D]);

// lidar roof heights -> clean tiers (11-12 -> 12, 9-10 -> 10, 7-8 -> 7)
const tierOf = (roof) => (roof >= 11 ? 12 : roof >= 9 ? 10 : 7);
const TIER = new Map();
for (const [x, z, , roof] of cells) TIER.set(`${x},${z}`, tierOf(roof));
const R = (x, z) => TIER.get(`${x},${z}`);
const DIRS = [["N", 0, -1], ["E", 1, 0], ["S", 0, 1], ["W", -1, 0]];

// shell: an edge cell, or one beside a different tier; interior: all four neighbours in the same tier
const isShell = (x, z) => DIRS.some(([, dx, dz]) => R(x + dx, z + dz) !== R(x, z));
// the face the storey pattern reads from: the street side first, then a setback (a lower neighbour)
function faceOf(x, z) {
  const r = R(x, z);
  const street = DIRS.find(([, dx, dz]) => R(x + dx, z + dz) === undefined);
  if (street) return { n: street[0], dx: street[1], dz: street[2] };
  const set = DIRS.find(([, dx, dz]) => R(x + dx, z + dz) < r);
  return set ? { n: set[0], dx: set[1], dz: set[2] } : null;
}

const grid = new Map();
const put = (x, y, z, block, state) => grid.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => grid.has(`${x},${y},${z}`);

// the entrance: on the street-side (north, z = 0) face, under the tower
const ENTRANCE = [2, 0];

for (const [key, r] of TIER) {
  const [x, z] = key.split(",").map(Number);
  const shell = isShell(x, z);
  const face = faceOf(x, z);
  // base course at y 0 (every cell's ground is y 0, so there is no foundation to fill)
  put(x, 0, z, shell ? "polished_andesite" : "smooth_stone");

  for (let y = 1; y < r; y++) {
    const rel = y % 4;
    if (rel === 0) { put(x, y, z, shell ? "smooth_quartz" : "smooth_stone"); continue; }   // floor slab / string course
    if (!shell) continue;                                                              // interior air
    const base = y - rel, ground = base === 0;
    const idx = face ? (face.dx === 0 ? x : z) : 0;
    const bay = idx % 3 !== 2;                                                         // two glass bays, one pier
    if (face && ENTRANCE[0] === x && ENTRANCE[1] === z && face.n === "N") {
      if (rel === 3) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "dark_oak_door", { facing: "north", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (rel === 3) put(x, y, z, bay ? "smooth_quartz" : "bricks");                     // lintel band over the bays
    else if (bay) put(x, y, z, "glass_pane");
    else put(x, y, z, ground ? "dark_oak_planks" : "bricks");                          // shopfront mullion / brick pier
  }
  // parapet cap (perimeter) or roof membrane (interior)
  put(x, r, z, shell ? "stone_brick_wall" : "smooth_stone");
}

// warm light behind some ground and upper glass: inside, on the floor slab, where the interior is air
for (const [key, r] of TIER) {
  const [x, z] = key.split(",").map(Number);
  if (!isShell(x, z)) continue;
  const face = faceOf(x, z);
  if (!face) continue;
  const idx = face.dx === 0 ? x : z;
  if (idx % 4 !== 0) continue;
  const ix = x - face.dx, iz = z - face.dz;
  for (let y = 1; y < r; y += 4) {                                                    // the first glass row of each storey
    if (grid.get(`${x},${y},${z}`)?.block !== "glass_pane") continue;
    if (R(ix, iz) === r && !isShell(ix, iz) && !has(ix, y, iz)) put(ix, y, iz, "glowstone");
  }
}

// rooftop plant on the two-storey wing: a gray box with a lantern on it
for (const [key, r] of TIER) {
  const [x, z] = key.split(",").map(Number);
  if (isShell(x, z) || r !== 7) continue;
  if ((3 * x + z) % 7 === 0) {
    put(x, r + 1, z, "gray_concrete");
    put(x, r + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// block states that connect to neighbours
const solid = (x, y, z) => has(x, y, z);
for (const [k, e] of grid) {
  const [x, y, z] = k.split(",").map(Number);
  if (e.block === "glass_pane") {
    e.state = {
      north: String(solid(x, y, z - 1)), south: String(solid(x, y, z + 1)),
      east: String(solid(x + 1, y, z)), west: String(solid(x - 1, y, z)), waterlogged: "false",
    };
  } else if (e.block === "stone_brick_wall") {
    const c = (dx, dz) => (solid(x + dx, y, z + dz) ? "low" : "none");
    e.state = { up: "true", north: c(0, -1), east: c(1, 0), south: c(0, 1), west: c(-1, 0) };
  }
}

for (const [k, e] of grid) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, e.block, e.state);
}
const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095570509.nbt");
console.log(JSON.stringify(info));
