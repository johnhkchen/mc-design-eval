// 2035 P St NW: a two-storey red-brick Store-Misc block (c. 1910-1930 DC commercial front, sandstone trim) on a 4 x 7
// footprint with a notched rear. The street front (z 0) is the tallest tier (7 blocks: a plinth, a shop storey with a
// door and a shopfront, a string course with a red awning over the shop, an upper storey of windows, a cornice). The rear
// wings drop to 5 and 6 blocks as one-storey tiers with flat roofs. Every column is solid
// from y 0 to its top, with floor slabs on y 0 and y 3, so nothing floats. Interiors are air with a floor slab per storey;
// glass has air behind it (or a light in it), and the corner columns are sandstone quoins.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC59003.cells.json`, "utf8"));

const W = 4, H = 19, D = 7;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { ground, roof });
const has = (x, z) => cell.has(key(x, z));

// The lidar roof of each cell is already flat (7 at the street front, 5 and 6 behind), so the tiers are taken as read.
// Blocks: [id, state] pairs, kept in one map so the panes can be connected to their neighbours afterwards.
const grid = new Map();
const pk = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => grid.set(pk(x, y, z), { block, state });
const at = (x, y, z) => grid.get(pk(x, y, z));

const BRICK = "bricks", SAND = "smooth_sandstone", BASE = "stone_bricks", FLOOR = "smooth_stone";
const GLASS = "glass_pane";

// Each cell's open sides: a side is exterior when the neighbouring cell is not part of the footprint.
const exterior = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });

for (const [k, { roof }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const ex = exterior(x, z);
  const shell = ex.n || ex.s || ex.w || ex.e;
  const front = z === 0;                                  // the street face (north side of the building)
  const corner = (ex.n || ex.s) && (ex.w || ex.e) && (z === 0 || z === D - 1);   // quoins on the front and rear corners only
  const top = roof - 1;

  for (let y = 0; y < roof; y++) {
    if (y === top) { put(x, y, z, shell ? SAND : FLOOR); continue; }     // cornice / coping, or a roof deck inside
    if (y === 0) { put(x, y, z, shell ? BASE : FLOOR); continue; }       // plinth, or the ground floor's slab
    if (y === 3) {                                                       // string course, or the upper floor's slab
      const awning = shell && front && (x === 1 || x === 2);
      put(x, y, z, !shell ? FLOOR : awning ? "red_concrete" : SAND);
      continue;
    }
    if (!shell) continue;                                                // interior: air, behind the glass
    if (corner) { put(x, y, z, SAND); continue; }                        // quoins
    if (front) {
      if (x === 0 || x === 3) put(x, y, z, BRICK);
      else if (y <= 2 && x === 1) {                                      // the shop door
        put(x, y, z, "oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else put(x, y, z, GLASS);                                        // shop glass, then the upper windows
      continue;
    }
    // side and rear faces: a window on each odd row of the street-side cells, brick elsewhere
    put(x, y, z, z % 2 === 1 ? GLASS : BRICK);
  }
}

// Lights: a glowstone behind the shop glass and a hanging lantern in the shop, under the floor slab above.
put(2, 1, 1, "glowstone");
put(1, 1, 2, "lantern", { hanging: "true", waterlogged: "false" });

// A roof unit on the low rear wing, sitting on its coping.
put(0, 5, 6, "iron_block");

// Glass panes connect to the neighbours in their wall (a pane or any solid block), as the game would draw them.
const solid = (x, y, z) => { const c = at(x, y, z); return !!c && c.block !== "lantern"; };
const isPane = (x, y, z) => at(x, y, z)?.block === GLASS;
for (const [p, c] of grid) {
  if (c.block !== GLASS) continue;
  const [x, y, z] = p.split(",").map(Number);
  const joins = (dx, dz) => (isPane(x + dx, y, z + dz) || solid(x + dx, y, z + dz) ? "true" : "false");
  c.state = { north: joins(0, -1), south: joins(0, 1), east: joins(1, 0), west: joins(-1, 0), waterlogged: "false" };
}

for (const [p, c] of grid) {
  const [x, y, z] = p.split(",").map(Number);
  g.set(x, y, z, c.block, c.state);
}

g.save(`${DIR}/DC59003.nbt`);
console.log("DC59003.nbt", { blocks: g.count(), palette: g.palette.length });
