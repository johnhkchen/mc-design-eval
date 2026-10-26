// 750 9th St NW, Commercial-Office-Large: a brick-and-limestone office block, five storeys on a stone plinth with a
// central two-storey setback tower and a lower four-storey wing on the south-east. Storeys are 3 blocks (belt courses
// at y = 3, 6, 9, 12, 15), glass in the window bays between brick piers, a stone cornice and parapet at each tier top.
// The massing follows the lidar roof: 17 (tower) -> 15 (main) -> 12 (wing), with the tower's rectangle taken from the
// roof-17 plateau so the setback is one clean step. Walls are shells with an air gap behind the glass; each storey has
// a floor slab; the roof is a membrane cap with roof plant on the main tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC55460.cells.json`, "utf8"));

const W = 23, D = 27, H = 29;
const g = new Voxels([W, H, D]);

// Tier per footprint column: T = top of the solid body (the parapet sits on row T).
const key = (x, z) => `${x},${z}`;
const col = new Map();
for (const [x, z, ground, roof] of cells) {
  const inTower = roof >= 16 && x >= 3 && x <= 15 && z >= 3 && z <= 18;
  const T = inTower ? 16 : roof >= 15 ? 15 : 12;
  col.set(key(x, z), { x, z, gr: ground, T });
}
const at = (x, z) => col.get(key(x, z));
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];                 // north, south, west, east (z-1 is north)
const exposed = (c) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T !== c.T; });
const isPerimeter = (c) => exposed(c).length > 0;

const STOREY_LINES = [3, 6, 9, 12, 15];
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // on a north/south facade
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // on an east/west facade
const GLASS = "light_blue_stained_glass_pane";

// The door: centred on the north face (z = 0), where the main tier is tallest and the street frontage reads.
const DOOR_X = 11;
const isDoorCell = (c, y) => c.z === 0 && c.x >= 10 && c.x <= 12 && y >= c.gr && y <= c.gr + 1;

// Facade block for a perimeter column at height y (rows at or above its ground, below its parapet).
function facade(c, y) {
  if (y === c.T) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];      // parapet
  if (y === c.T - 1) return ["stone_bricks"];                                                 // cornice course
  if (isDoorCell(c, y) && c.x === DOOR_X) {
    const lower = y === c.gr;
    return ["dark_oak_door", { facing: "south", half: lower ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (c.z === 0 && y === 4 && c.x >= 10 && c.x <= 12) return ["stone_brick_slab", { type: "top", waterlogged: "false" }];  // door hood
  if (c.z === 0 && c.x >= 10 && c.x <= 12 && y <= c.gr + 1) return ["bricks"];                 // door surround
  if (STOREY_LINES.includes(y) && y < c.T - 1) return ["smooth_stone"];                       // belt course / sill
  const { alongX, idx } = faceOf(c);
  if (idx % 3 === 0) return ["bricks"];                                                       // brick pier
  return [GLASS, alongX ? PANE_NS : PANE_EW];                                                 // glass bay
}

// The wall's face, its bay index along the wall, and the inward neighbour (the air gap behind the glass).
function faceOf(c) {
  const face = exposed(c).find(([dx, dz]) => dz !== 0) ?? exposed(c)[0];
  return { alongX: face[1] !== 0, idx: face[1] !== 0 ? c.x : c.z, inward: { x: c.x - face[0], z: c.z - face[1] } };
}

for (const c of col.values()) {
  const perimeter = isPerimeter(c);
  for (let y = 0; y <= c.T; y++) {
    if (y < c.gr) { g.set(c.x, y, c.z, "stone_bricks"); continue; }                  // foundation: nothing floats on a slope
    if (perimeter) {
      const [block, state] = facade(c, y);
      g.set(c.x, y, c.z, block, state);
    } else if (y === c.T - 1) {
      g.set(c.x, y, c.z, "gray_concrete");                                          // roof membrane cap
    } else if (STOREY_LINES.includes(y) && y < c.T - 1) {
      g.set(c.x, y, c.z, "stone");                                                  // floor slab per storey
    }
  }
}

// Warm light in some glass bays: glowstone and shroomlight one cell back, in the air gap behind the pane.
for (const c of col.values()) {
  if (!isPerimeter(c)) continue;
  const { idx, inward } = faceOf(c), inner = at(inward.x, inward.z);
  if (!inner || isPerimeter(inner) || (c.z === 0 && c.x >= 10 && c.x <= 12)) continue;
  for (let y = c.gr + 1; y < c.T - 1; y++) {
    if (STOREY_LINES.includes(y) || idx % 3 === 0 || (idx + y) % 9 !== 0) continue;   // sparse: a few lit bays, not speckle
    if (y >= inner.T - 1) continue;
    g.set(inward.x, y, inward.z, (idx + y) % 10 === 0 ? "shroomlight" : "glowstone");
  }
}

// Entrance lanterns hung in the lobby behind the door surround.
for (const x of [10, 12]) {
  const c = at(x, 1);
  if (c) g.set(x, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
}
g.set(DOOR_X, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });

// Roof plant on the main tier: two boxes on the membrane cap, kept in from the edges.
const PLANT = [[4, 20], [5, 20], [4, 21], [5, 21], [12, 20], [13, 20], [12, 21], [13, 21]];
for (const [x, z] of PLANT) {
  const c = at(x, z);
  if (!c || c.T !== 15 || isPerimeter(c)) continue;
  g.set(x, 15, z, "light_gray_concrete");
  g.set(x, 16, z, "light_gray_concrete");
}

g.save(`${dir}/DC55460.nbt`);
console.log("wrote DC55460.nbt", g.count(), "blocks");
