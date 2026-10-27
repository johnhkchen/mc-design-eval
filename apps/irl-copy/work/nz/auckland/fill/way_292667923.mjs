// Park Residences: a 1990s-2000s apartment tower on a stepped podium, Auckland CBD edge. The lidar roof reads as
// four clean tiers (a 4-storey north wing, a 10-storey shoulder, a 16-storey wing, a 24-storey mid-tier) under a
// 31-storey tower with a small crown. Walls are one block thick with an air gap behind the glass and a floor slab
// per storey, so the shell reads as glazed concrete from the street and the roofs read from the air.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292667923.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const g = new Voxels([43, 142, 30]);

// The lidar roof height (blocks above y 0) snapped to clean flat tiers: 4-block storeys, the tower's crown at 130.
function tierTop(r) {
  if (r <= 2) return 1;      // ground-level deck (the plaza strip on the east edge)
  if (r < 24) return 16;     // north wing, 4 storeys
  if (r < 52) return 40;     // 10 storeys
  if (r < 80) return 64;     // 16-storey wings
  if (r < 110) return 96;    // 24-storey shoulder
  if (r < 128) return 124;   // 31-storey tower
  return 130;                // crown
}

const col = new Map();   // "x,z" -> { ground, top }
for (const [x, z, ground, roof] of cells) col.set(`${x},${z}`, { ground, top: Math.max(tierTop(roof), ground) });
const topAt = (x, z) => col.get(`${x},${z}`)?.top ?? 0;      // outside the footprint is open air

// A face is exposed at height y when a horizontal neighbour is air there (outside the footprint, or a lower tier).
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const faceAt = (x, y, z) => DIRS.find(([dx, dz]) => topAt(x + dx, z + dz) <= y) ?? null;

// The entrance: the north wing's street face, a door with two lanterns under the spandrel.
const DOOR = { x: 7, z: 0 };

// Facade grammar per storey (4 blocks): string course at the floor line, two rows of glass in concrete frames
// (mullions every third bay), a spandrel below the next floor; a plinth at the base; a coping at the top.
function facadeBlock(x, y, z, [dx, dz], c) {
  if (y === c.top - 1) return "smooth_stone";                  // coping
  if (y === 0) return "stone_bricks";                          // plinth
  const k = y % 4;
  if (k === 0) return "light_gray_concrete";                   // string course at the floor line
  if (k === 3) return "white_concrete";                        // spandrel
  const along = dx !== 0 ? z : x;                              // bay position along the face
  if (along % 3 === 0) return "light_gray_concrete";           // mullion
  if ((x * 7 + y * 13 + z * 5) % 9 === 0) return "glowstone";  // a warm lit room behind the glass
  return "light_blue_stained_glass";
}

const overrides = new Map();   // "x,y,z" -> { block, state }
for (const [key, c] of col) {
  const [x, z] = key.split(",").map(Number);
  const kinds = new Array(c.top).fill(null);
  const facing = new Array(c.top).fill(false);
  for (let y = 0; y < c.top; y++) {
    const f = faceAt(x, y, z);
    if (y < c.ground) kinds[y] = "stone_bricks";                 // foundation: fill up to the ground
    else if (f) { kinds[y] = facadeBlock(x, y, z, f, c); facing[y] = true; }
    else if (y === c.top - 1) kinds[y] = "light_gray_concrete";  // flat roof over the tier
    else if (y % 4 === 0) kinds[y] = "white_concrete";           // floor slab per storey
  }
  // A facade stands on something: extend its wall down to the first solid block below it (a lower roof or a slab).
  for (let y = 1; y < c.top; y++) {
    if (!facing[y] || kinds[y - 1] !== null) continue;
    for (let k = y - 1; k >= 0 && kinds[k] === null; k--) kinds[k] = "white_concrete";
  }
  for (let y = 0; y < c.top; y++) if (kinds[y]) g.set(x, y, z, kinds[y]);
  // Roof plant on the flat roofs of the interior (not the edges): a few iron units on the tier tops.
  const interior = DIRS.every(([dx, dz]) => topAt(x + dx, z + dz) >= c.top);   // the roof reaches every side
  if (interior && c.top >= 16 && (x * 3 + z * 5) % 17 === 0) g.set(x, c.top, z, "iron_block");
  // Lanterns on the tower's coping, standing on the parapet.
  if (faceAt(x, c.top - 1, z) && c.top === 124 && (x + z) % 9 === 0) overrides.set(`${x},${c.top},${z}`, { block: "lantern", state: { hanging: "false", waterlogged: "false" } });
}

// Entrance: a dark oak door (two halves) in the north wing, a lantern hung from the lintel beside it (the east
// neighbour is outside the footprint, so the lantern sits on the wing's west side only).
const d = DOOR;
g.set(d.x, 1, d.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(d.x, 2, d.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(d.x - 1, 3, d.z, "lantern", { hanging: "true", waterlogged: "false" });
for (const [key, o] of overrides) { const [x, y, z] = key.split(",").map(Number); g.set(x, y, z, o.block, o.state); }

g.save(`${DIR}/way_292667923.nbt`);
