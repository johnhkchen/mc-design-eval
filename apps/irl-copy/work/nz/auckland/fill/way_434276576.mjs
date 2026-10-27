// Auckland, Eden Terrace / Newton edge: a two-storey red-brick Edwardian shop block with a stone parapet, cream
// dressings (string courses, quoins), a shopfront with a dark-oak door under a canopy, and a three-storey wing on the
// north side. The lidar roof reads 9 over most of the footprint, 11 on the north wing; smoothed into two tiers: 9 and 12
// (the wing's 11 plus its coping). Walls are one block thick with an air gap behind glass; interiors are hollow except
// a floor slab per storey and the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_434276576.cells.json", "utf8"));

const X = 14, Z = 9, Y = 24;
const BODY_TOP = 9, WING_TOP = 12;
const FLOOR_ROWS = [4, 8];                       // storey lines: string course (a wall) or floor slab (inside)

// footprint: ground (third number), top (smoothed tier)
const fp = new Map();
for (const [x, z, ground, roof] of cells) {
  const wing = roof >= 11 && x <= 6 && z <= 2;   // the north wing lidar reads 11 over x 1..6, z 0..1
  fp.set(`${x},${z}`, { ground, top: wing ? WING_TOP : BODY_TOP, roof });
}
const cellAt = (x, z) => fp.get(`${x},${z}`);
const topAt = (x, z) => cellAt(x, z)?.top ?? 0;

// a wall side is exposed at height y when the cell beside it is outside the footprint or stands lower than y
const DIRS = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };
function exposed(x, y, z) {
  return Object.entries(DIRS).filter(([, [dx, dz]]) => {
    const n = cellAt(x + dx, z + dz);
    return !n || n.top <= y;
  }).map(([d]) => d);
}

const g = new Voxels([X, Y, Z]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);

// the shopfront door: south face, ground floor, between the windows
const DOOR = [10, 7];

for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const { ground: G, top: T } = c;

  // foundation to the ground, plinth course, then the building
  for (let y = 0; y < G; y++) set(x, y, z, "stone_bricks");

  for (let y = G; y < T; y++) {
    const dirs = exposed(x, y, z);
    const wall = dirs.length > 0;

    if (y === G) { set(x, y, z, wall ? "polished_andesite" : "smooth_stone"); continue; }     // plinth / ground-floor slab
    if (y === T - 1) { set(x, y, z, wall ? "stone_bricks" : "smooth_stone"); continue; }     // parapet coping / roof slab
    if (!wall) {                                                                             // hollow interior
      if (FLOOR_ROWS.includes(y)) set(x, y, z, "smooth_stone");
      continue;
    }
    if (FLOOR_ROWS.includes(y)) { set(x, y, z, "smooth_quartz"); continue; }                 // dressed string course

    const corner = dirs.length > 1;
    const dir = dirs[0];
    const p = dir === "E" || dir === "W" ? z : x;
    const win = !corner && p % 3 === 1;
    const ground = y <= 3;

    if (corner) { set(x, y, z, "smooth_quartz"); continue; }                                 // quoins
    if (ground && z === DOOR[1] && x === DOOR[0] && dir === "S") {                            // the door, lower then upper
      set(x, y, z, "dark_oak_door", { facing: "south", half: y === G + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (ground) { set(x, y, z, win ? "glass" : "bricks"); continue; }                           // shopfront glass or pier
    set(x, y, z, win ? "glass_pane" : "bricks");
  }
}

// canopy over the door: dark-oak slabs on the string course, three cells wide
for (const x of [DOOR[0] - 1, DOOR[0], DOOR[0] + 1]) set(x, 4, DOOR[1], "dark_oak_slab", { type: "top", waterlogged: "false" });

// warm light behind the glass: lanterns hang under the first-floor slab in the shop, glowstone and shroomlight on the
// upper floor's inside, sitting on the slab so nothing floats
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const { ground: G } = c;
  if (exposed(x, 3, z).length === 0 && (x + z) % 4 === 0) {                    // shop interior, hung from the slab at y 4
    set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {                          // upper-floor window: light inside it
    if (!exposed(x, 5, z).includes(d)) continue;
    const p = d === "E" || d === "W" ? z : x;
    if (p % 3 !== 1) continue;
    const ix = x - dx, iz = z - dz;                                            // the cell inside this window
    if (!cellAt(ix, iz) || exposed(ix, 5, iz).length) continue;
    set(ix, 5, iz, (p + G) % 2 ? "glowstone" : "shroomlight");
  }
}

// roof plant: a dark iron box on the body roof, and pinnacles on the wing corners
set(7, 9, 4, "iron_block"); set(8, 9, 4, "iron_block");
set(1, WING_TOP, 0, "stone_brick_wall");
set(6, WING_TOP, 1, "stone_brick_wall");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_434276576.nbt");
console.log(`built ${g.count()} blocks, ${g.palette.length - 1} block states`);
