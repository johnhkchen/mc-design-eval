// 43 West 47th Street, 1920 commercial and office building: a five-storey brick loft-office on a granite base, a
// shopfront with a recessed-door entrance at ground level, and a flat roof with a parapet and a brick bulkhead at the
// south end. Footprint 7 x 24 (x across the street front at z 0, low z = the 47th Street face). The lidar roof is
// 16-19 blocks, so it is read as one flat tier at 19 (parapet) with the roof deck at 18; no setbacks, the lidar
// noise is smoothed out. Massing per row: y 0 granite base course, 1-3 shopfront, 4 sandstone band, then storeys of
// two window rows under sandstone belt courses at 7, 10, 13 and 16, a sandstone cornice at 17, a brick parapet at 18.
// Only the ring of walls is solid above the floors; floors are full slabs (no interiors), and each window has air
// behind the glass. Some windows carry a glowstone behind them. Every block stands on the one below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034475.cells.json`, "utf8"));
const X = 7, Y = 22, Z = 24;

const WALL = "bricks", STONE = "smooth_sandstone", BASE = "polished_granite", PANE = "gray_stained_glass_pane";
const FLOORS = [4, 7, 10, 13, 16];               // floor slabs, which are the belt courses on the facade
const WIN_ROWS = [5, 6, 8, 9, 11, 12, 14, 15];  // two window rows per storey, under each belt course
const WIN_COLS = [1, 2, 4, 5];                  // street and rear bays: two panes each side of the centre pier

const want = new Map();
const put = (x, y, z, block, state) => want.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => want.get(`${x},${y},${z}`);
const sturdy = (d) => !!d && [WALL, STONE, BASE, PANE].includes(d.block);

const ring = (x, z) => x === 0 || x === X - 1 || z === 0 || z === Z - 1;
const sideWin = (x, z) => (x === 0 || x === X - 1) && z >= 1 && z <= Z - 2 && z % 3 !== 0;
const windowable = (x, y, z) => {
  if (!WIN_ROWS.includes(y) || !ring(x, z)) return false;
  if (z === 0 || z === Z - 1) return WIN_COLS.includes(x);
  return sideWin(x, z);
};

// Footprint: base course, floor slabs, a tar-and-gravel roof deck on the interior, and the ring of walls.
if (cells.length !== X * Z) throw new Error(`expected ${X * Z} footprint cells, got ${cells.length}`);
for (const [x, z] of cells) {
  put(x, 0, z, BASE);
  for (const f of FLOORS) put(x, f, z, STONE);
  put(x, 17, z, ring(x, z) ? STONE : "gravel");
  if (ring(x, z)) for (const y of [1, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 18]) put(x, y, z, WALL);
}

// Street front (z 0): shopfront glass at x 1, 2, 4, 5 with a recessed-door entrance at x 3.
for (const x of [1, 2, 4, 5]) for (const y of [1, 2, 3]) put(x, y, 0, "glass");
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
put(3, 1, 0, "dark_oak_door", doorState("lower"));
put(3, 2, 0, "dark_oak_door", doorState("upper"));
put(3, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });   // hangs from the sandstone band above the door

// Windows: grey panes in the brick, set between the belt courses; air behind them (no interiors).
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (const y of WIN_ROWS) {
  if (!windowable(x, y, z)) continue;
  const st = (dir) => (dir ? "true" : "false");
  const facade = z === 0 || z === Z - 1;
  const conn = facade
    ? { north: "false", south: "false", east: st(sturdy(at(x + 1, y, z))), west: st(sturdy(at(x - 1, y, z))) }
    : { north: st(sturdy(at(x, y, z - 1))), south: st(sturdy(at(x, y, z + 1))), east: "false", west: "false" };
  put(x, y, z, PANE, conn);
}

// Warm light in a few windows (about one in nine): a glowstone just behind the glass, in the air of the room behind it.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (const y of WIN_ROWS) {
  if (!windowable(x, y, z) || (x * 5 + y * 3 + z * 7) % 9 !== 0) continue;
  const inside = z === 0 ? [x, y, 1] : z === Z - 1 ? [x, y, Z - 2] : x === 0 ? [1, y, z] : [X - 2, y, z];
  if (!at(...inside)) put(...inside, "glowstone");
}

// Roof: a brick bulkhead over the stair and lift, at the south end of the roof, standing on the roof deck.
for (let x = 2; x <= 4; x++) for (let z = 17; z <= 20; z++) {
  for (const y of [18, 19, 20]) put(x, y, z, WALL);
  put(x, 21, z, STONE);
}

const g = new Voxels([X, Y, Z]);
for (const [key, { block, state }] of want) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/NYC1034475.nbt`);
console.log(`NYC1034475: ${out.blocks} blocks, ${out.palette} palette entries`);
