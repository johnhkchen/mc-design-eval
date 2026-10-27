// Way 270735258: a two-storey 1920s-30s brick shop block on the Mt Eden / Eden Terrace slope (Auckland).
// Lidar: roof 10-11 over the main block (smoothed to one flat tier at 11), 7 on the single rear cell (a low wing).
// Ground 0 on the west edge (the downhill side, its shopfront has a full storey), 2 on the east (uphill, buried a little).
// Build: foundation to each cell's ground, a base course, a storey line at y4, a quartz cornice at y8, a brick parapet
// with a quartz cap, and a flat grey roof with a plant box. Walls are the footprint's outer ring; the interior is air,
// with a floor slab per storey and the roof deck.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_270735258.cells.json`, "utf8"));

const W = 12, D = 18, H = 24;
const STOREY = 4;                                    // the storey line (floor slab) for both levels
const cell = new Map();                              // "x,z" -> { g: ground, t: top (smoothed roof) }
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { g, t: r >= 9 ? 11 : 7 });

const OUT = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const inF = (x, z) => cell.has(`${x},${z}`);
const faces = (x, z) => Object.keys(OUT).filter((k) => !inF(x + OUT[k][0], z + OUT[k][1]));
const ring = (x, z) => faces(x, z).length > 0;

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);
const pane = (f) => (f === "W" || f === "E"
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });

// the along-face coordinate: the street-side index that sets the window bays
const along = (f, x, z) => (f === "W" || f === "E" ? z : x);

// one ring cell's wall block at height y, from its exposed faces
function wallAt(x, z, y, g, t, fs) {
  if (y === t - 1) return ["smooth_quartz", null];                     // parapet cap
  if (y === t - 2) return ["bricks", null];                            // parapet
  if (y === t - 3 || y === STOREY) return ["smooth_quartz", null];     // cornice / storey line
  if (fs.length > 1) return ["stone_bricks", null];                    // quoin at the corners
  const f = fs[0], u = along(f, x, z);
  if (y <= 3) {                                                        // ground storey
    if (f === "W") {                                                   // the shopfront (west frontage)
      if (y === 3) return ["dark_oak_planks", null];                   // fascia
      return u % 2 === 0 ? ["dark_oak_log", { axis: "y" }] : ["glass", null];
    }
    if (y === 3 || u % 3 === 0) return ["bricks", null];
    return ["glass_pane", pane(f)];
  }
  // upper storey: window bays on a pier grid, a quartz sill under each window
  if (u % 3 === 0) return ["bricks", null];
  if (y === 5) return ["smooth_quartz_slab", { type: "bottom", waterlogged: "false" }];
  return ["glass_pane", pane(f)];
}

for (const [key, { g, t }] of cell) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y <= g; y++) put(x, y, z, "stone_bricks");          // foundation to ground, then the base course
  const fs = faces(x, z);
  if (!fs.length) {                                                    // interior: floor slabs, the deck, the roof
    put(x, STOREY, z, "smooth_stone");
    put(x, t - 3, z, "smooth_stone");
    put(x, t - 2, z, "gray_concrete");
    continue;
  }
  for (let y = g + 1; y < t; y++) {                                    // the walls of the outer ring
    const [b, s] = wallAt(x, z, y, g, t, fs);
    put(x, y, z, b, s);
  }
}

// the entrance: a dark oak door on the west frontage, facing out, with a lantern just inside
const door = (y, half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
put(0, 1, 8, "dark_oak_door", door(1, "lower"));
put(0, 2, 8, "dark_oak_door", door(2, "upper"));
put(1, 3, 8, "lantern", { hanging: "true", waterlogged: "false" });

// warm light: lanterns in the shop and glowstone or lanterns behind some upper windows (interior cells only)
for (const [key, { t }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const fs = faces(x, z);
  if (!fs.length || fs.length > 1 || t !== 11) continue;
  const f = fs[0], u = along(f, x, z), [dx, dz] = OUT[f], ix = x - dx, iz = z - dz;
  if (!inF(ix, iz) || ring(ix, iz)) continue;
  if (u % 3 !== 0 && u % 6 === 1) put(ix, 6, iz, "glowstone");
  if (u % 3 !== 0 && u % 6 === 4) put(ix, 7, iz, "lantern", { hanging: "true", waterlogged: "false" });
}
for (let z = 0; z < D; z++) {
  if (inF(0, z) && z % 4 === 0 && z !== 8 && inF(1, z) && !ring(1, z)) put(1, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// rooftop plant: a 3 x 2 box on the main roof, with a vent on top
for (let x = 4; x <= 6; x++) for (let z = 5; z <= 6; z++) put(x, 10, z, "light_gray_concrete");
put(4, 11, 5, "iron_block");
put(5, 11, 5, "iron_block");

const stats = v.save(`${DIR}/way_270735258.nbt`);
console.log(JSON.stringify({ cells: cell.size, blocks: stats.blocks, palette: stats.palette }));
