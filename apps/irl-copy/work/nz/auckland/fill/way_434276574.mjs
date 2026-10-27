// Way 434276574: a long two-storey brick shop terrace on a diagonal strip, with one-storey rear wings.
// Reading the lidar: the cells on the west edge (the frontage) run 9-11 blocks high (two storeys with a parapet),
// the body behind them 5 (one storey). Tiers are two flat masses: tall (top y10) and low (top y4), smoothed by a
// majority vote over each cell and its footprint neighbours so single noisy cells do not leave notches.
// Ground: each cell is solid from y0 (foundation) up, so the strip stands on the lowest ground, not on a slope.
// Storeys: base course y1, ground storey y2-3 (shopfront glass with piers), storey line y4, upper storey y5-8
// (sill y5, lintel y8, windows y6-7), cornice y9, parapet/roof y10. Interior cells are air between floor slabs.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_434276574.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const SIZE = [15, 23, 49];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];   // +x, -x, +z, -z
const DOOR = [6, 21];                              // the entrance on the tall frontage's west face

const foot = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { x, z, g, r }]));
const inF = (x, z) => foot.has(`${x},${z}`);

// Tiers: a lidar roof >= 7 marks a two-storey cell. The lidar alternates 5 and 11 cell by cell along the frontage, so
// the tier is decided over a window (2 across, 3 along, footprint cells only): a cell is tall when at least 20% of
// that window is tall. That gives a long two-storey shop band with its one-storey wing behind, not single towers.
const tallRaw = (c) => (c.r >= 7 ? 1 : 0);
const tall = new Map();
for (const c of foot.values()) {
  const win = [...foot.values()].filter((n) => Math.abs(n.x - c.x) <= 2 && Math.abs(n.z - c.z) <= 3);
  const share = win.reduce((s, n) => s + tallRaw(n), 0) / win.length;
  tall.set(`${c.x},${c.z}`, share >= 0.2);
}
const topOf = (x, z) => (tall.get(`${x},${z}`) ? 10 : 4);
// a neighbour is part of the envelope at height y when its column reaches that high
const closed = (x, y, z) => inF(x, z) && y <= topOf(x, z);

// what a footprint cell is at height y
function kindAt(c, y) {
  const top = topOf(c.x, c.z);
  if (y === 0) return "found";
  if (y === 1) return "base";
  if (y === top) return "top";
  if (y === 4 || y === 9) return "band";
  const exposed = DIRS.some(([dx, dz]) => !closed(c.x + dx, y, c.z + dz));
  if (!exposed) return "air";
  return y === 5 || y === 8 ? "trim" : "wall";
}
const isAir = (x, y, z) => { const c = foot.get(`${x},${z}`); return !!c && y <= topOf(x, z) && kindAt(c, y) === "air"; };

const MAT = { found: "stone", base: "stone_bricks", band: "smooth_stone", top: "stone_bricks", trim: "smooth_stone", wall: "bricks" };
const blocks = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });

for (const c of foot.values()) {
  const top = topOf(c.x, c.z);
  for (let y = 0; y <= top; y++) {
    const kind = kindAt(c, y);
    if (kind === "air") continue;
    if (kind !== "wall") { put(c.x, y, c.z, MAT[kind]); continue; }
    // a wall: a window where the cell behind the face is air (so the glass has a room behind it), piers between bays
    const faces = DIRS.filter(([dx, dz]) => !closed(c.x + dx, y, c.z + dz));
    const glazed = faces.some(([dx, dz]) => isAir(c.x - dx, y, c.z - dz) && (dx !== 0 ? c.z : c.x) % 3 !== 0);
    if (c.x === DOOR[0] && c.z === DOOR[1] && (y === 2 || y === 3)) {
      put(c.x, y, c.z, "oak_door", { facing: "west", half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    } else if (glazed) {
      put(c.x, y, c.z, "glass_pane", { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" });
    } else {
      put(c.x, y, c.z, MAT.wall);
    }
  }
}

// warm light: lanterns standing on the ground floor, glowstone on the upper floor slab, both in interior air
for (const c of foot.values()) {
  if (isAir(c.x, 2, c.z) && (c.x + c.z) % 5 === 0) put(c.x, 2, c.z, "lantern", { hanging: "false", waterlogged: "false" });
  if (isAir(c.x, 5, c.z) && (c.x + c.z) % 4 === 0 && topOf(c.x, c.z) === 10) put(c.x, 5, c.z, "glowstone");
}

// roof plant: two small units on the tall roof, standing on the parapet course
const roofUnits = [...foot.values()].filter((c) => topOf(c.x, c.z) === 10 && DIRS.every(([dx, dz]) => closed(c.x + dx, 10, c.z + dz)) && (c.x * 2 + c.z) % 17 === 0).slice(0, 2);
for (const c of roofUnits) put(c.x, 11, c.z, "iron_block");

// pane connections: a glass pane joins its horizontal neighbours that are solid or glass, as in the game
const pane = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
for (const [k, v] of blocks) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  for (const [dx, dz, side] of pane) v.state[side] = blocks.has(`${x + dx},${y},${z + dz}`) ? "true" : "false";
}

const g = new Voxels(SIZE);
for (const [k, v] of blocks) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
// the entrance's upper half is set in the same pass; the lower half sits below it at y2 as written above
const counts = g.save(`${DIR}/way_434276574.nbt`);
console.log("saved", counts, "tall cells", [...tall.values()].filter(Boolean).length, "of", foot.size);
