// 21 West 47th Street, 1939: a seven-storey Art Deco commercial and office block between the Fifth and Sixth Avenue
// frontages, 8 x 27 cells. Long faces (west, x 0, and east, x 7) run along z; the north and south ends are the short faces.
// Massing: lidar roofs median-smoothed over 3x3 (light-well zeros and single-cell noise filled from neighbours), then
// snapped to storey tiers: 6 (two-storey lobby at the north-west corner), 12, 18 (lower wing), 21 (seven storeys with a
// cornice), 23 (the raised side parapets that run the length of the east and west faces).
// Materials: polished granite base and bulkhead, cream calcite walls, smooth quartz string courses and quartz pillars at
// the bays, dark polished andesite spandrels, glass panes in the windows, a light-grey tar roof.
// Interior is air behind the glazing with a floor slab per storey (no rooms); a few windows carry warm light.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034482.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 8, L = 27, Y = 35;
const roof = Array.from({ length: L }, () => Array(W).fill(0));                  // [z][x]
for (const [x, z, , r] of cells) roof[z][x] = r;

// Median of the non-zero roofs in the 3 x 3 neighbourhood: a light-well zero or a single noisy cell takes its neighbours' height.
function smoothed(x, z) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const xx = x + dx, zz = z + dz;
    if (xx >= 0 && xx < W && zz >= 0 && zz < L && roof[zz][xx] > 0) v.push(roof[zz][xx]);
  }
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
}
// Storey tiers: 3 blocks a storey, so the tops land on storey lines; 23 is the parapet that stands over the storeys.
const tier = (v) => (v >= 22 ? 23 : v >= 19 ? 21 : v >= 15 ? 18 : v >= 10 ? 12 : 6);
const H = Array.from({ length: L }, (_, z) => Array.from({ length: W }, (_, x) => tier(smoothed(x, z))));

const g = new Voxels([W, Y, L]);
const perim = (x, z) => x === 0 || x === W - 1 || z === 0 || z === L - 1;
const corner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === L - 1);
const longFace = (x) => x === 0 || x === W - 1;                                 // the west and east faces run along z
const pane = (axisZ) => ({ north: String(axisZ), south: String(axisZ), east: String(!axisZ), west: String(!axisZ), waterlogged: "false" });

// Entrances on the two long faces: a pair of iron doors in the ground storey, between piers.
const DOORS = new Map([["0,13", "east"], ["7,19", "west"]]);
const lit = (x, y, z) => longFace(x) && y % 3 === 1 && y >= 4 && ((z + y) % 8 === 3) && z > 0 && z < L - 1;

for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
  const h = H[z][x];
  if (!perim(x, z)) {
    // Interior: a base slab, a floor slab per storey, a tar roof; air between, so the glazing looks into a void.
    g.set(x, 0, z, "polished_andesite");
    for (let y = 3; y <= h - 2; y += 3) g.set(x, y, z, "smooth_stone");
    g.set(x, h - 1, z, "light_gray_concrete");
    continue;
  }
  g.set(x, 0, z, "polished_granite");                                           // base course
  const u = longFace(x) ? z : x;                                                // position along the face
  const pier = !corner(x, z) && u % 3 === 0;                                    // bays of 3 with a quartz pier
  for (let y = 1; y < h - 1; y++) {
    if (corner(x, z)) { g.set(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
    const door = DOORS.get(`${x},${z}`);
    if (y <= 2) {                                                               // ground storey: bulkhead, then glass
      if (pier) { g.set(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
      if (door) { g.set(x, y, z, "iron_door", { facing: door, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === 1) { g.set(x, y, z, "polished_granite"); continue; }           // bulkhead
      g.set(x, y, z, "glass_pane", pane(longFace(x)));
      continue;
    }
    if (y % 3 === 0) {                                                          // storey line: string course
      g.set(x, y, z, (y === 3 && x === 0 && (z === 13 || z === 14)) ? "polished_granite" : "smooth_quartz");   // dark canopy over the west door
      continue;
    }
    if (pier) { g.set(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
    if (y % 3 === 2) { g.set(x, y, z, "polished_andesite"); continue; }        // spandrel
    g.set(x, y, z, "glass_pane", pane(longFace(x)));                           // window
  }
  g.set(x, h - 1, z, "smooth_quartz");                                          // parapet cap
}

// Warm light: glowstone standing behind some windows in the air gap (on the floor slab), lanterns in the ground-floor shopfronts.
for (let z = 1; z < L - 1; z++) for (let x = 0; x < W; x++) {
  const h = H[z][x];
  for (let y = 1; y < h - 1; y++) if (lit(x, y, z)) g.set(x === 0 ? 1 : W - 2, y, z, "glowstone");   // the air cell behind the glass
}
g.set(1, 1, 6, "lantern", { hanging: "false", waterlogged: "false" });
g.set(6, 1, 20, "lantern", { hanging: "false", waterlogged: "false" });

// Roof plant: two small housings on the flat tar roof of the seven-storey block, standing on the roof slab.
for (const [x0, z0] of [[2, 6], [4, 18]]) {
  const h = H[z0][x0];
  if (h !== 21) continue;
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) {
    g.set(x0 + dx, h, z0 + dz, "stone_bricks");
    g.set(x0 + dx, h + 1, z0 + dz, "smooth_stone_slab", { type: "top" });
  }
}

const out = `${DIR}/NYC1034482.nbt`;
const stats = g.save(out);
console.log(`wrote ${out}: ${stats.blocks} blocks, ${stats.palette} palette entries`);
