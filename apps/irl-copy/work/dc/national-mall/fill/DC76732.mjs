// 1221 Massachusetts Ave NW: a 1920s red-brick Colonial Revival apartment block with limestone trim. Four
// storeys of 3 blocks on the 12-block body, a stepped penthouse (14) with a higher core (15), and a one-storey
// shop wing (2) on the south side. Massing follows the lidar roof per cell; the shell is hollow with air behind
// the glass and a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76732.cells.json`, "utf8"));   // [x, z, ground, roof]

const X = 25, Y = 27, Z = 18;
const g = new Voxels([X, Y, Z]);

const BRICK = "bricks", TRIM = "smooth_quartz", BASE = "stone_bricks", ROOF = "smooth_stone", FLOOR = "stone";
const GLASS = "glass_pane";
const FLOOR_LINES = [3, 6, 9];                  // storey lines on the body: slab inside, string course outside

// footprint: each cell's ground and top surface. Lidar 13s are noise between 12s, so they read as 12
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, top: roof === 13 ? 12 : roof });
const cell = (x, z) => fp.get(`${x},${z}`);

// [outward dx, dz, face name]
const FACES = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];

// faces of cell (x, z) at row y that are exterior: the neighbour is off the footprint, or its top is at or below y
function exposed(x, z, y) {
  return FACES.filter(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || n.top <= y; });
}

// rows 1,2,4,5,7,8,10 on the body, the penthouse rows, the shop row of the one-storey wing
function windowRow(T, y) {
  if (T === 2) return y === 0;
  if (y >= 12) return y < T - 1;
  return y > 0 && y % 3 !== 0 && y < T - 1;
}

const windows = [];                              // for the warm lights behind the glass
for (const [key, { ground, top: T }] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < T; y++) {
    if (y < ground) { g.set(x, y, z, BASE); continue; }   // foundation: solid from y 0 up to the cell's ground
    const ex = exposed(x, z, y);
    if (!ex.length) {                            // interior: a floor slab per storey, a roof deck, air otherwise
      if (y === T - 1) g.set(x, y, z, ROOF);
      else if (FLOOR_LINES.includes(y)) g.set(x, y, z, FLOOR);
      continue;
    }
    if (y === T - 1) { g.set(x, y, z, TRIM); continue; }        // cornice / parapet coping
    if (ex.length > 1) { g.set(x, y, z, TRIM); continue; }      // quoins at the corners
    if (FLOOR_LINES.includes(y)) { g.set(x, y, z, TRIM); continue; }   // string course, the sill of the window above
    const [dx, dz] = ex[0];
    const u = dz === 0 ? z : x;                  // position along the face
    if (windowRow(T, y) && (T === 2 ? u % 2 === 0 : u % 4 === 1 || u % 4 === 2)) {   // two-wide bays, two-wide brick piers
      const axis = dz === 0 ? { east: "true", west: "true", north: "false", south: "false" }
                            : { east: "false", west: "false", north: "true", south: "true" };
      g.set(x, y, z, GLASS, axis);
      windows.push({ x, y, z, inX: x - dx, inZ: z - dz });
    } else g.set(x, y, z, y === 0 && T > 2 ? BASE : BRICK);     // plinth at grade, piers between bays
  }
}

// entrance on the north face of the north-east block: quartz pilasters, a glass transom, a dark oak door
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
for (const y of [0, 1, 2]) { g.set(17, y, 0, TRIM); g.set(19, y, 0, TRIM); }
g.set(18, 0, 0, "dark_oak_door", { ...DOOR, half: "lower" });
g.set(18, 1, 0, "dark_oak_door", { ...DOOR, half: "upper" });
g.set(18, 2, 0, GLASS, { east: "true", west: "true", north: "false", south: "false" });
g.set(18, 0, 1, "lantern", { hanging: "false", waterlogged: "false" });   // lobby light, standing on grade

// warm light behind some glass on the upper storeys (only where the room behind is air)
for (const w of windows) {
  if (![4, 7].includes(w.y) || (w.x * 31 + w.z * 17 + w.y * 7) % 5 !== 0) continue;
  if (cell(w.inX, w.inZ) && g.val(w.inX, w.y, w.inZ) === 0) g.set(w.inX, w.y, w.inZ, "glowstone");
}

// roof plant: iron boxes on the body's flat roof, well inside the block so they stand on the deck
let plant = 0;
for (const [key, { top: T }] of fp) {
  if (T !== 12 || plant >= 4) continue;
  const [x, z] = key.split(",").map(Number);
  const inside = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => cell(x + dx, z + dz)?.top === 12);
  if (inside && (x * 7 + z * 3) % 11 === 0) { g.set(x, 12, z, "iron_block"); plant++; }
}

// the core's lightning rod, standing on its roof deck
g.set(16, 15, 8, "lightning_rod", { facing: "up", powered: "false" });

const stats = g.save(`${DIR}/DC76732.nbt`);
console.log("DC76732.nbt", stats, { windows: windows.length, plant });
