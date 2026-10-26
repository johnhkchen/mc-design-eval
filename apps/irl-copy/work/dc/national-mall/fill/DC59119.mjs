// 1843 8th St NW (Shaw, DC): a two-storey red-brick educational building, 1880s-style school block with stone
// trim, a flat parapet roof, a low NE wing, a raised central attic pavilion (lidar 9), and a SW annex.
// Massing comes from the lidar roof heights per cell; walls are one block thick with an air pocket behind each
// window and a floor plate per storey, so nothing floats: every plate is held by the ring walls.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59119.cells.json", "utf8"));

const BRICK = "bricks", TRIM = "stone_bricks", CAP = "smooth_stone", ROOF = "stone", FLOOR = "stone_bricks";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const R = new Map();                               // "x,z" -> roof height (blocks above y 0)
for (const [x, z, , r] of cells) R.set(`${x},${z}`, r);
const roofAt = (x, z) => R.get(`${x},${z}`) ?? -1;

// which horizontal faces of cell (x, z) at height y face outside the massing (air, off the footprint, or lower)
function exposedSides(x, z, y) {
  const out = [];
  for (const [dx, dz] of DIRS) { const n = roofAt(x + dx, z + dz); if (n < 0 || n <= y) out.push([dx, dz]); }
  return out;
}

// the entrance: the north face (z 0), on the street-facing wall under the central bay
const DOOR = [7, 0];
const isDoorCell = (x, z) => x === DOOR[0] && z === DOOR[1];
const isHoodCell = (x, z) => z === 0 && x >= 6 && x <= 8;

const M = new Map();                               // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => M.set(`${x},${y},${z}`, { block, state });
const get = (x, y, z) => M.get(`${x},${y},${z}`);

// windows: ring cells of a storey with a room behind them (r >= 7), on a 3-cell rhythm with stone piers between
const isWindow = (x, z, y) => (y === 1 || y === 2 || y === 4 || y === 5) && (x + z) % 3 !== 0;
const hasPocket = (r, y) => r >= 7 && (y === 1 || y === 2 || y === 4 || y === 5) && y < r - 1;

for (const [x, z, , r] of cells) {
  for (let y = 0; y < r; y++) {
    const sides = exposedSides(x, z, y);
    const ring = sides.length > 0;
    const top = y === r - 1;
    if (y === 0) { put(x, y, z, ring ? TRIM : FLOOR); continue; }     // plinth on the ring, floor inside
    if (top) { put(x, y, z, ring ? CAP : ROOF); continue; }           // coping on the ring, roof cover inside
    if (ring) {
      if (isDoorCell(x, z) && (y === 1 || y === 2)) {
        put(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isHoodCell(x, z) && y === 4) { put(x, y, z, "stone_brick_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" }); continue; }
      if (y === 3 || y === 6) { put(x, y, z, TRIM); continue; }       // string course and cornice
      if (isWindow(x, z, y) && r >= 7 && !isHoodCell(x, z)) { put(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" }); continue; }
      put(x, y, z, BRICK); continue;
    }
    // inside the massing: floor plates at storey lines, air pockets behind windows, solid fill for low wings
    if (y === 3 || y === 6) { put(x, y, z, FLOOR); continue; }
    if (hasPocket(r, y)) {
      // a warm light in some pockets: lanterns on the floor, glowstone up under the storey line
      if (y === 1 && (x * 3 + z) % 4 === 0) put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      if (y === 4 && (x + 2 * z) % 5 === 0) put(x, y, z, "glowstone");
      continue;
    }
    put(x, y, z, BRICK);
  }
}

// roof equipment: two brick chimney stacks and a slab-topped plant box, each standing on the roof deck below
put(9, 7, 3, BRICK); put(9, 8, 3, BRICK);
put(4, 7, 9, BRICK);
put(10, 7, 14, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

// glass panes connect to panes and opaque walls along their face, as the game draws them
const OPAQUE = new Set([BRICK, TRIM, CAP, ROOF, FLOOR]);
const paneNeighbour = (x, y, z) => { const b = get(x, y, z); return b && (b.block === "glass_pane" || OPAQUE.has(b.block)); };
for (const [key, b] of M) {
  if (b.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  b.state = { north: String(paneNeighbour(x, y, z - 1)), south: String(paneNeighbour(x, y, z + 1)),
    east: String(paneNeighbour(x + 1, y, z)), west: String(paneNeighbour(x - 1, y, z)), waterlogged: "false" };
}

const g = new Voxels([14, 21, 20]);
for (const [key, b] of M) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, b.block, b.state);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59119.nbt");
