// DC68090: a narrow Beaux-Arts office block on the Mall's edge (1920s-30s): a 15-block limestone tower of five storeys
// on a granite base, a dark-glazed window grid with stone piers and string courses, a 3-high annex on the east side
// and a 2-high shopfront wing with a door and canopy at the south end. Hollow only at the ground storey (air behind
// the glass); upper storeys are solid masonry with warm glowstone and shroomlight behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68090.cells.json", "utf8"));
const X = 3, Z = 7, Y = 27;
const roof = Array.from({ length: X }, () => Array(Z).fill(0));
const ground = Array.from({ length: X }, () => Array(Z).fill(0));
for (const [x, z, gnd, r] of cells) { ground[x][z] = gnd; roof[x][z] = r; }

const WIN = new Set([1, 2, 4, 5, 7, 8, 10, 11, 13]);   // window rows (storeys of 3 blocks, ground storey y0-2)
const STR = new Set([3, 6, 9, 12]);                      // floor-line string courses
const GLOW = new Set(["1,1,1", "1,4,1", "1,7,1", "1,10,2", "1,13,1", "1,0,5"]);   // warm lights behind some panes
const SHROOM = new Set(["1,7,1"]);
const inEnv = (x, z, y) => x >= 0 && x < X && z >= 0 && z < Z && y >= 0 && y < roof[x][z];
const skin = (x, z) => x === 0 || x === 2 || z === 0 || z === 6;

const plan = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });

// Band rule per cell: ground foundation, door, hollow ground storey (air behind the glass), cap, wing shopfront,
// base, string courses, window grid on the tower and annex faces, piers at the corners, limestone body.
function blockAt(x, y, z) {
  const R = roof[x][z], top = R - 1;
  if (y < ground[x][z]) return { block: "polished_granite" };
  if (x === 1 && z === 6 && y <= 1) return { block: "dark_oak_door", state: { facing: "south", half: y ? "upper" : "lower", hinge: "left", open: "false", powered: "false" } };
  if (x === 1 && z >= 1 && z <= 5 && y < top && inEnv(0, z, y) && inEnv(2, z, y)) return null;   // hollow ground storey
  if (y === top) return { block: "polished_granite" };                                               // cornice cap
  if (z >= 4 && R === 2) {                                                                          // shopfront wing
    if (x === 1) return null;
    return z === 5 ? { block: "light_blue_stained_glass_pane" } : { block: "quartz_pillar", state: { axis: "y" } };
  }
  if (y === 0) return { block: "polished_granite" };                                                  // base course
  if (STR.has(y) && R >= 5) return { block: "stone_bricks" };                                        // storey lines
  const win = WIN.has(y);
  if (win && ((x === 0 && (z === 1 || z === 2)) || (z === 0 && x === 1) || (x === 2 && (z === 1 || z === 2)))) return { block: "light_blue_stained_glass_pane" };
  if (skin(x, z) && ((x !== 1 && z === 3) || (x === 2 && z === 0))) return { block: "quartz_pillar", state: { axis: "y" } };
  return { block: "calcite" };
}

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) for (let y = 0; y < roof[x][z]; y++) {
  const b = blockAt(x, y, z);
  const k = `${x},${y},${z}`;
  if (GLOW.has(k)) { put(x, y, z, SHROOM.has(k) ? "shroomlight" : "glowstone"); continue; }   // also lights the hollow shopfront
  if (b) put(x, y, z, b.block, b.state);
}
// Lintel-level canopy over the wing door: sits on the wing's cap and on the door's top
for (const [x, z] of [[0, 5], [1, 5], [2, 5], [0, 6], [1, 6], [2, 6]]) put(x, 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
// Parapet on the tower's west and north edges; the east side of the top is a terrace with a rooftop unit
for (const [x, z] of [[0, 1], [0, 2], [0, 3], [1, 0], [2, 0]]) put(x, 15, z, "stone_brick_wall");
put(1, 15, 1, "iron_block");

// Glass panes and walls take their connections from their neighbours (so panes join each other and their piers)
const has = (x, y, z) => plan.has(`${x},${y},${z}`);
for (const [k, v] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  if (v.block === "light_blue_stained_glass_pane") {
    const onXFace = x === 0 || x === 2;
    v.state = { north: String(onXFace && has(x, y, z - 1)), south: String(onXFace && has(x, y, z + 1)),
      east: String(!onXFace && has(x + 1, y, z)), west: String(!onXFace && has(x - 1, y, z)), waterlogged: "false" };
  }
  if (v.block === "stone_brick_wall") {
    const w = (dx, dz) => (has(x + dx, y, z + dz) && plan.get(`${x + dx},${y},${z + dz}`).block === "stone_brick_wall") ? "low" : "none";
    v.state = { north: w(0, -1), south: w(0, 1), east: w(1, 0), west: w(-1, 0), up: "true", waterlogged: "false" };
  }
}

const g = new Voxels([X, Y, Z]);
for (const [k, v] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68090.nbt");
console.log("blocks", g.count(), "palette", g.palette.length);
