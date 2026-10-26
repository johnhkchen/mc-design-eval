// 1615 Rhode Island Ave NW: a 1920s Beaux-Arts hotel in red brick on a stone base, stone quoins and string courses,
// four storeys over a ground floor, a 14-block tower in the middle, shoulders stepping down to the edges, and a
// one-storey dining wing behind. Built column by column from the lidar roof heights; exposed faces (footprint edge, or
// a neighbouring column that stops lower) get the facade, the interior is solid core with an air gap behind the windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86736.cells.json", "utf8"));
const W = 22, D = 16, H = 26;

// roof height per footprint cell (0 = outside the footprint), [z][x]
const R = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, , r] of cells) R[z][x] = r;

// smooth the lidar: the central cluster is one flat 14-block tower, not a ragged 13/14 mix
for (let z = 3; z <= 5; z++) for (let x = 7; x <= 13; x++) if (R[z][x] >= 13) R[z][x] = 14;

const inFoot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && R[z][x] > 0;
const height = (x, z) => (inFoot(x, z) ? R[z][x] : 0);
const DIRS = [
  { n: "N", dx: 0, dz: -1 }, { n: "S", dx: 0, dz: 1 },
  { n: "W", dx: -1, dz: 0 }, { n: "E", dx: 1, dz: 0 },
];
// the sides of column (x, z) at height y that face air or a lower neighbour
const exposed = (x, z, y) => DIRS.filter((d) => height(x + d.dx, z + d.dz) <= y);

const STRINGS = new Set([3, 6, 9, 12]);              // limestone string courses = floor lines
const FRONT_DOORS = new Set(["6,1", "7,1", "16,1", "17,1"]);  // the two recessed entrances on the north side

const g = new Voxels([W, H, D]);
const glassState = (d) => (d.dz !== 0
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// what the outer skin of column (x, z) is at height y, given its exposed sides
function facade(x, z, y, dirs) {
  const top = y === R[z][x] - 1;
  // quoins only at the building's own corners (two sides on open ground); a setback's edge is just a face
  const quoin = dirs.length >= 2 && dirs.every((d) => height(x + d.dx, z + d.dz) === 0);
  if (top || quoin || STRINGS.has(y)) return { block: "smooth_quartz" };   // cornice, quoins, floor lines
  const d = dirs.find((e) => e.dz !== 0) ?? dirs[0], u = d.dz !== 0 ? x : z;     // bays run along the face: x on north/south, z on east/west
  if (y <= 2 && d.n === "N" && FRONT_DOORS.has(`${x},${z}`)) {
    return { door: true, half: y === 1 ? "lower" : "upper", hinge: x % 2 === 0 ? "left" : "right" };
  }
  if (u % 3 === 0) return { block: "bricks" };       // brick piers between the windows
  if (y <= 2 || y <= R[z][x] - 2) return { win: true, d, block: "glass_pane", state: glassState(d) };
  return { block: "bricks" };
}

const windows = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const top = R[z][x];
  if (!top) continue;
  for (let y = 0; y < top; y++) {
    const dirs = exposed(x, z, y);
    if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }   // base course, the foundation everywhere
    if (!dirs.length) { g.set(x, y, z, y === top - 1 ? "smooth_stone" : "bricks"); continue; }   // core, roof tar
    const f = facade(x, z, y, dirs);
    if (f.door) { g.set(x, y, z, "oak_door", { facing: "north", half: f.half, hinge: f.hinge, open: "false", powered: "false" }); continue; }
    if (f.win) { g.set(x, y, z, f.block, f.state); windows.push({ x, y, z, d: f.d }); continue; }
    g.set(x, y, z, f.block);
  }
}

// the air gap behind each window: one cell in, only where that cell is solid core; every ninth or so window
// carries a glowstone there instead, warm light behind the glass
for (const { x, y, z, d } of windows) {
  const ix = x - d.dx, iz = z - d.dz;
  if (!inFoot(ix, iz) || height(ix, iz) <= y || exposed(ix, iz, y).length) continue;
  if ((x * 3 + y * 5 + z) % 9 === 0) g.set(ix, y, iz, "glowstone");
  else g.set(ix, y, iz, "air");
}

// roof equipment: two brick chimney stacks on the main roof, standing on the roof tar
for (const [x, z] of [[5, 4], [15, 6]]) {
  const top = R[z][x];
  g.set(x, top, z, "bricks"); g.set(x, top + 1, z, "bricks"); g.set(x, top + 2, z, "smooth_quartz");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86736.nbt");
