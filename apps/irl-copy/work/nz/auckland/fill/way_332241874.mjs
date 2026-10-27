// Mt Eden / Newton street block: a four-storey brick-and-plaster commercial building of the 1930s, one
// volume on a sloping site. Storey lines are absolute (the ground floor sits at y 4 wherever the ground is),
// so the lower ground shows the plinth and the tall side shows the extra storeys. Massing comes from the lidar
// roof: 16 over most of the footprint, 12 on a lower wing, 8 for a one-storey annex (lidar noise smoothed away).
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332241874.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const W = 16, H = 30, FLOORS = [4, 8, 12];
const DIRS = [{ dx: 0, dz: -1, name: "north" }, { dx: 0, dz: 1, name: "south" }, { dx: 1, dz: 0, name: "east" }, { dx: -1, dz: 0, name: "west" }];
const DOOR = { x: 5, z: 0, dir: DIRS[0] };   // on the north face, ground floor

// footprint: ground and the roof surface, tiered (>=15 tower, >=11 wing, else one-storey annex); top = last solid layer
const F = new Map();
for (const [x, z, g, r] of cells) {
  const surface = r >= 15 ? 16 : r >= 11 ? 12 : 8;
  F.set(`${x},${z}`, { g, top: surface - 1 });
}
const cell = (x, z) => F.get(`${x},${z}`);
// a ring cell is a wall: a neighbour is outside the footprint or lower, so its sides are exposed
function ring(x, z) {
  const c = cell(x, z);
  return DIRS.some(({ dx, dz }) => { const n = cell(x + dx, z + dz); return !n || n.top < c.top; });
}
function solid(x, y, z) {
  const c = cell(x, z); if (!c || y < 0 || y > c.top) return false;
  if (y <= 3 || y === c.top) return true;                 // foundation and plinth, roof surface
  if (ring(x, z)) return true;                            // walls run from the plinth to the roof
  return FLOORS.includes(y);                              // interior floor plates
}
// an outer face: the neighbour is outside the footprint, or stands below this height (so the sky shows)
const exposed = (x, y, z) => DIRS.filter(({ dx, dz }) => { const n = cell(x + dx, z + dz); return !n || y > n.top; });

function paneState(d) {
  return d.dz !== 0 ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
}

function blockAt(x, y, z) {
  const c = cell(x, z), ex = exposed(x, y, z), isRing = ring(x, z);
  if (y <= 3) {
    if (y < c.g) return { block: "stone" };                                   // buried fill under the ground
    if (ex.length && y === 3) return { block: "smooth_stone" };               // base course
    return { block: ex.length ? "stone_bricks" : "stone" };                    // plinth
  }
  if (y === c.top) return { block: isRing ? "smooth_quartz" : "stone" };      // parapet and roof surface
  if (!isRing) return { block: "smooth_stone" };                              // interior floor plates
  if (ex.length === 0) return { block: "bricks" };
  if (FLOORS.includes(y)) return { block: ex.length >= 2 ? "stone_bricks" : "smooth_quartz" };  // storey lines
  if (ex.length >= 2) return { block: "stone_bricks" };                       // corner piers
  const d = ex[0], ground = y < 8, o = (y - 4) % 4, t = d.dx !== 0 ? z : x;
  if (x === DOOR.x && z === DOOR.z && d === DOOR.dir) {
    if (y === 4 || y === 5) {
      const half = y === 4 ? "lower" : "upper";
      return { block: "oak_door", state: { facing: d.name, half, hinge: "left", open: "false", powered: "false" } };
    }
    if (y === 6) return { block: "dark_oak_planks" };                          // canopy lintel over the door
  }
  if (o === 3) return { block: ground ? "dark_oak_planks" : "bricks" };        // shop fascia / spandrel
  if (t % 3 === 0) return { block: "stone_bricks" };                          // pilaster between bays
  return ground ? { block: "glass" } : { block: "glass_pane", state: paneState(d) };
}

const g = new Voxels([W, H, 16]);
let windows = [];
for (const [key, c] of F) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y <= c.top; y++) {
    if (!solid(x, y, z)) continue;
    const b = blockAt(x, y, z); g.set(x, y, z, b.block, b.state);
    // remember the glazed bays so a few get a light just inside the glass
    if ((y - 4) % 4 === 1 && y >= 4 && b.block.startsWith("glass")) {
      const d = exposed(x, y, z)[0]; if (d) windows.push({ x, y, z, d });
    }
  }
}
// warm light in some windows: the lower pane there is glowstone (the footprint is one-cell walls, so there is
// no room inside the glass for a lamp)
let lit = 0;
for (const { x, y, z, d } of windows) {
  if ((x + z + y) % 4 !== 0) continue;
  g.set(x, y, z, "glowstone"); lit++;
}
// roof plant: a 2x2 air-handling block on the tower roof, standing on the roof surface
let plant = null;
const tops = [...F].filter(([k, c]) => c.top === 15).map(([k]) => k.split(",").map(Number));
for (const [x, z] of tops.sort((a, b) => Math.hypot(a[0] - 7.5, a[1] - 7.5) - Math.hypot(b[0] - 7.5, b[1] - 7.5))) {
  const four = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (four.every(([a, b]) => cell(a, b)?.top === 15 && !ring(a, b))) { plant = four; break; }
}
if (plant) {
  for (const [a, b] of plant) g.set(a, 16, b, "iron_block");
  g.set(plant[0][0], 17, plant[0][1], "iron_block");
}

const out = `${DIR}/way_332241874.nbt`;
const stats = g.save(out);
console.log(JSON.stringify({ cells: F.size, lanterns: lit, plant: !!plant, ...stats }));
