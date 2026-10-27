// Way 711259638: a two-storey brick commercial block (Edwardian/interwar Eden Terrace shop-and-flat), 22 x 17 footprint.
// The lidar roof is smoothed into four flat tiers: a low podium (roof 1-2), a single storey with a parapet (3-6),
// a single storey with a tall parapet (7-8), and the two-storey tower with its plant room (9-10). Storey lines sit at
// y 1 (ground floor), 4 (floor slab), 8 (upper deck). Walls are the footprint's edge cells; the rest is air behind.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_711259638.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([22, 23, 17]);

// lidar roof -> flat tier top (exclusive y)
const tierOf = (r) => (r <= 2 ? 2 : r <= 6 ? 6 : r <= 8 ? 8 : 10);

const at = new Map();
for (const [x, z, ground, roof] of cells) at.set(`${x},${z}`, { x, z, ground, T: tierOf(roof) });
const cellAt = (x, z) => at.get(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
for (const c of at.values()) {
  // a face is exposed when the neighbour is outside the footprint or stands on a different tier
  c.exposed = Object.keys(DIRS).filter((d) => {
    const n = cellAt(c.x + DIRS[d][0], c.z + DIRS[d][1]);
    return !n || n.T !== c.T;
  });
}

// the wall material at height y of an exposed cell
function wallBlock(c, y) {
  const { T, exposed, x, z } = c;
  if (y === T - 1) return "stone_bricks";                                 // cornice / parapet cap
  if (y === 4 || (T === 10 && y === 8)) return "smooth_stone";            // string course at each floor line
  const face = exposed.find((d) => !cellAt(x + DIRS[d][0], z + DIRS[d][1])) ?? exposed[0];   // the street-side face if any
  const along = "NS".includes(face) ? x : z;                              // position along that face
  if (y <= 3) {                                                           // ground floor: shopfront bays
    if (along % 3 === 0) return "stone_bricks";                           // pier
    return y === 1 ? "dark_oak_planks" : "glass_pane";                    // stall riser, then glass
  }
  if (T === 10) {                                                         // upper storey, y 5..7
    if (along % 3 === 0) return "bricks";
    return y === 5 ? "white_concrete" : "glass_pane";                     // sill, then glazing
  }
  if (T === 8) return along % 3 === 1 ? "white_concrete" : "bricks";      // tall parapet panels
  return "bricks";
}

for (const c of at.values()) {
  const { x, z, T, exposed } = c;
  g.set(x, 0, z, "stone_bricks");                                         // plinth / foundation
  if (T === 2) { g.set(x, 1, z, exposed.length ? "stone_bricks" : "smooth_stone"); continue; }
  g.set(x, 4, z, "smooth_stone");                                         // floor slab / low roof deck
  if (T === 10) g.set(x, 8, z, "smooth_stone");                           // upper deck
  if (!exposed.length) continue;                                          // interior: air, no rooms modelled
  for (let y = 1; y < T; y++) g.set(x, y, z, wallBlock(c, y));
}

// the entrance: one door on the south front, centred on the bays
const front = [...at.values()].filter((c) => c.exposed.length === 1 && c.exposed[0] === "S" && c.T >= 6 && !cellAt(c.x, c.z + 1));
const doorCell = front.filter((c) => c.x % 3 === 2).sort((a, b) => Math.abs(a.x - 10) - Math.abs(b.x - 10))[0];
if (doorCell) {
  const { x, z } = doorCell;
  g.set(x, 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, 3, z, "dark_oak_planks");                                       // lintel over the door
}

// warm light behind some glass: a glowstone in the room cell just inside a window bay
for (const c of at.values()) {
  if (c.exposed.length !== 1 || c.T < 6) continue;
  const f = c.exposed[0];
  const along = "NS".includes(f) ? c.x : c.z;
  const inner = cellAt(c.x - DIRS[f][0], c.z - DIRS[f][1]);
  if (!inner || inner.exposed?.length || inner.T !== c.T) continue;      // not a room cell
  if (c.T === 10 && along % 6 === 1) g.set(inner.x, 6, inner.z, "glowstone");
  if (along % 6 === 2) g.set(inner.x, 2, inner.z, "glowstone");
}

// roof plant room on the two-storey core: a solid block with a cap, for the lift overrun and the air handling
for (const c of at.values()) {
  if (c.T !== 10 || c.exposed.length || c.x < 10 || c.x > 13 || c.z < 5 || c.z > 8) continue;
  g.set(c.x, 9, c.z, "smooth_stone");
  g.set(c.x, 10, c.z, "smooth_stone");
  g.set(c.x, 11, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

const out = `${dir}/way_711259638.nbt`;
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, palette ${r.palette}`);
