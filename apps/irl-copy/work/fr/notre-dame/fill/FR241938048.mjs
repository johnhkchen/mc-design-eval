// FR241938048: a 5 x 7 Indifférencié building on the Île de la Cité's quai side, read as a stone-and-render
// Haussmann-era block: a commercial stone base with a glazed shopfront, three storeys of render with stone
// string courses and window sills, and a dark mansard attic. The lidar roof steps (5 to 19) are flattened into four
// tiers (one, two, three storeys and an attic), so every storey stands on the one below. Walls are one cell thick
// with an air gap behind the glass; the interior is hollow except for the floor slabs and a few lamps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR241938048.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const W = 5, H = 41, D = 7;
const FLOORS = [5, 10, 15];                 // storey lines: floor slabs inside, string courses outside
const DOOR = [2, 1];                        // the north entrance
const CHIMNEYS = [[1, 1], [3, 6]];          // roof stacks on the attic
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// lidar roof height -> flat tier top (inclusive): one storey, two, three, and the attic. A roof of 0 is no building.
const tierTop = (roof) => (roof <= 5 ? 5 : roof <= 10 ? 10 : roof <= 14 ? 15 : 19);
const cell = new Map();
for (const [x, z, ground, roof] of cells) if (roof > 0) cell.set(`${x},${z}`, { ground, top: tierTop(roof) });

const at = (x, z) => cell.get(`${x},${z}`);
// the sides of a column that face air at height y: a missing footprint neighbour, or a lower tier
const outDirs = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.top < y; });
const footSides = (x, z) => DIRS.filter(([dx, dz]) => !at(x + dx, z + dz)).length;
const corner = (x, z) => footSides(x, z) >= 2;
const isDoor = (x, z) => x === DOOR[0] && z === DOOR[1];
const windowBand = (y) => (y >= 7 && y <= 9) || (y >= 12 && y <= 14) || (y >= 16 && y <= 17);

// a window pane: a non-corner facade column, not the door, in a window band below the roof
const pane = (x, y, z) => {
  const c = at(x, z);
  return !!c && y >= c.ground && y < c.top && windowBand(y) && !corner(x, z) && !isDoor(x, z) && outDirs(x, z, y).length > 0;
};
// a pane with a warm lamp behind it (some windows only, so the street reads lit at dusk)
const lit = (x, y, z) => pane(x, y, z) && (y === 8 || y === 13) && (2 * x + 3 * z) % 3 === 0;
// a hollow cell behind a lit pane: the pane's outward side points back at it
const lampAt = (x, y, z) => DIRS.some(([dx, dz]) => lit(x + dx, y, z + dz) && outDirs(x + dx, z + dz, y).some(([ex, ez]) => ex === dx && ez === dz));
// a solid neighbour (walls, caps, slabs, panes), used to join panes in their own wall
const solidAt = (x, y, z) => {
  const c = at(x, z);
  if (!c || y < 0 || y > c.top) return false;
  return y < c.ground || y === c.top || FLOORS.includes(y) || outDirs(x, z, y).length > 0;
};

function paneSpec(x, y, z) {
  const side = (dx, dz) => (solidAt(x + dx, y, z + dz) ? "true" : "false");
  const alongZ = outDirs(x, z, y).some(([dx]) => dx !== 0);   // a wall facing x runs along z
  const joins = alongZ
    ? { north: side(0, -1), south: side(0, 1), east: "false", west: "false" }
    : { north: "false", south: "false", east: side(1, 0), west: side(-1, 0) };
  return { block: "glass_pane", state: { ...joins, waterlogged: "false" } };
}

function spec(x, y, z) {
  if (y >= 20 && y <= 21 && CHIMNEYS.some(([cx, cz]) => cx === x && cz === z)) return { block: "stone_brick_wall" };
  const c = at(x, z);
  if (!c) return null;
  if (y < c.ground) return { block: "stone" };                                   // foundation under the lowest ground
  if (y === c.top + 1 && c.top < 19 && outDirs(x, z, c.top).length) return { block: "iron_bars" };   // terrace railing
  if (y > c.top) return null;
  if (y === c.top) return { block: c.top === 19 ? "deepslate_tiles" : "stone_bricks" };   // roof cap or cornice
  if (!outDirs(x, z, y).length) {                                                // hollow room
    if (FLOORS.includes(y)) return { block: "stone_bricks" };
    return lampAt(x, y, z) ? { block: "glowstone" } : null;
  }
  if (corner(x, z)) return { block: "stone_bricks" };                            // quoins
  if (isDoor(x, z)) {
    const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
    if (y === 1) return { block: "oak_door", state: { ...door, half: "lower" } };
    if (y === 2) return { block: "oak_door", state: { ...door, half: "upper" } };
    if (y === 3) return { block: "stone_bricks" };                               // lintel over the door
  }
  if (y === 1 || FLOORS.includes(y) || y === 6 || y === 11) return { block: "stone_bricks" };   // base, string, sill
  if (y <= 4) return { block: "glass" };                                         // glazed shopfront
  if (pane(x, y, z)) return paneSpec(x, y, z);
  if (y >= 16) return { block: "deepslate_bricks" };                             // mansard attic wall
  return { block: "white_concrete" };                                            // render
}

const g = new Voxels([W, H, D]);
let placed = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) {
  const s = spec(x, y, z);
  if (!s) continue;
  g.set(x, y, z, s.block, s.state);
  placed++;
}
const out = g.save(`${DIR}/FR241938048.nbt`);
console.log(JSON.stringify({ placed, ...out }));
