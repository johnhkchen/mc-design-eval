// Windsor Towers, Mt Eden side of the CBD: a 1970s-era concrete apartment block, eight storeys on a stone plinth
// with a nine-storey core (lidar roof 32 and 36 above the lowest ground; 28 on the east wings). Tiers are the lidar
// roof rounded to whole storeys (4 blocks), so every floor slab sits on the one below. The plinth is solid from y 0,
// so the downhill north side shows its extra storey and the entrance sits on the uphill west side at ground level.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24234444.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24234444.nbt";

const W = 28, H = 49, D = 23;
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

// footprint: ground g (lidar, from y 0) and the tier top T (lidar roof rounded to whole 4-block storeys)
const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, T: 4 * Math.round(r / 4) });
const at = (x, z) => foot.get(`${x},${z}`);
const outsideDirs = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !at(x + dx, z + dz)).map(([d]) => d);
// a shell cell is a wall: on the outline, or beside a lower tier (the core's walls stepping down to the podium)
const isShell = (x, z, c) => Object.values(DIRS).some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.T < c.T; });

const ENTRANCE = { x: 1, z: 11, facing: "west" };      // uphill west face, ground 4 = the storey-1 floor, no steps
const SLAB = "light_gray_concrete", PIER = "white_concrete", PLINTH = "stone_bricks", CAP = "smooth_stone";
const GLASS = ["light_blue_stained_glass", "cyan_stained_glass"];
const LAMP = "glowstone";

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const stats = { shell: 0, glass: 0, lamps: 0 };

for (const [key, c] of foot) {
  const [x, z] = key.split(",").map(Number);
  const out = outsideDirs(x, z);
  const shell = isShell(x, z, c);
  if (shell) stats.shell++;

  // plinth and foundation: solid from y 0 up to the storey-1 floor
  for (let y = 0; y < 4; y++) put(x, y, z, PLINTH);

  for (let y = 4; y <= c.T - 2; y++) {
    if (y % 4 === 0) { put(x, y, z, SLAB); continue; }        // floor slab per storey (the storey lines)
    if (!shell) continue;                                     // interior: an air gap, no interior
    const ground = y < 8;                                     // storey 1: a glazed lobby, no piers
    const pier = !ground && (x + z) % 4 === 0;                // a concrete pier every fourth cell: the bays read as a grid
    if (y % 4 === 3) { put(x, y, z, SLAB); continue; }        // sill / spandrel band
    if (pier) { put(x, y, z, PIER); continue; }
    put(x, y, z, GLASS[(y >> 2) % 3 === 2 ? 1 : 0]); stats.glass++;   // tint by storey band, not by cell: no checkerboard
    // a warm lamp behind some panes, in the air gap just inside the wall
    if (out.length && y % 4 === 2 && (3 * x + z + (y >> 2)) % 7 === 0) {
      const [dx, dz] = DIRS[out[0]];
      const inside = at(x - dx, z - dz);
      if (inside && !isShell(x - dx, z - dz, inside)) { put(x - dx, y, z - dz, LAMP); stats.lamps++; }
    }
  }

  // roof: a cap on every column, a parapet on the outline
  put(x, c.T - 1, z, CAP);
  if (out.length) put(x, c.T, z, "stone_brick_wall");
}

// entrance: a glazed double door on the west face, a lintel canopy over it
const { x: ex, z: ez, facing } = ENTRANCE;
put(ex, 4, ez, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex, 5, ez, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
for (const dz of [-1, 0, 1]) put(ex, 6, ez + dz, SLAB);

// roof plant: two gray boxes on the core
for (const [x, z] of [[9, 9], [10, 9], [9, 10], [10, 10]]) { put(x, 36, z, "gray_concrete"); put(x, 37, z, "gray_concrete"); }

const { blocks, palette } = g.save(OUT);
console.log(JSON.stringify({ footprint: foot.size, shell: stats.shell, glass: stats.glass, lamps: stats.lamps, blocks, palette }));
