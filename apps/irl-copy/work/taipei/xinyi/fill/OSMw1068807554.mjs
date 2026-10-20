import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1068807554.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1068807554.nbt";

const W = 21, H = 33, D = 23;
const ROOF = 20;      // roof deck / cornice level
const PARAPET = 21;   // top of parapet, about 21 blocks above lowest ground

// Palette: 1990s-era Taipei mid-rise, white tiled concrete frame, aluminium-framed glazing,
// light grey spandrels, dark shopfronts at street level.
const BODY = "white_concrete";
const BAND = "light_gray_concrete";
const PIER = "smooth_quartz";
const GLASS = "light_blue_stained_glass";
const SHOP = "glass";
const SHOP_PIER = "dark_oak_planks";
const PLINTH = "polished_andesite";
const FOUNDATION = "stone";
const TANK = "iron_block";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);

const inFp = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);
const isPerim = (x, z) => !inFp(x + 1, z) || !inFp(x - 1, z) || !inFp(x, z + 1) || !inFp(x, z - 1);

const g = new Voxels([W, H, D]);

// Wall material for a perimeter cell at height y.
// Returns [id, props?]
function wallBlock(x, y, z, gr) {
  if (y === gr) return [PLINTH];                 // base course
  if (y === ROOF) return [BAND];                 // cornice
  if (y < 5) {                                   // ground storey: shopfront
    if (y === 4) return [BAND];                  // shop lintel
    if ((x + z) % 3 === 0) return [SHOP_PIER];
    return [SHOP];
  }
  const r = y % 5;
  if (r === 0 || r === 4) return [BAND];         // storey lines / spandrels
  if ((x + z) % 3 === 0) return [PIER];          // mullions
  return [GLASS];                                // window glass
}

// Pass 1: foundations, walls, floor slabs, parapet.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);
  if (gr > ROOF) continue;
  const perim = isPerim(x, z);
  for (let y = gr; y <= ROOF; y++) {
    if (perim) {
      const [id, props] = wallBlock(x, y, z, gr);
      if (props) g.set(x, y, z, id, props);
      else g.set(x, y, z, id);
    } else if (y === gr || y % 5 === 0) {
      g.set(x, y, z, BAND);                      // interior floor slab per storey
    }
  }
  if (perim) g.set(x, PARAPET, z, BODY);         // parapet ring
}

// Pass 2: rooftop water tank (steel drum) on the roof deck.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  if (gr > ROOF || isPerim(x, z)) continue;
  if ((x - 10) ** 2 + (z - 11) ** 2 <= 4) {
    for (let y = PARAPET; y <= PARAPET + 2; y++) g.set(x, y, z, TANK);
  }
}

// Pass 3: entrance on the south face (+z), nearest to the footprint centre line.
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
let door = null;
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  if (gr > 4 || inFp(x, z + 1)) continue;
  if (!door || Math.abs(x - cx) < Math.abs(door.x - cx)) door = { x, z, gr };
}
if (door) {
  const { x, z, gr } = door;
  const dProps = { facing: "south", hinge: "left", open: "false", powered: "false" };
  g.set(x, gr + 1, z, "oak_door", { ...dProps, half: "lower" });
  g.set(x, gr + 2, z, "oak_door", { ...dProps, half: "upper" });
  g.set(x, gr + 3, z, BAND);                     // lintel over the door
  if (inFp(x, z - 1) && !isPerim(x, z - 1)) {
    g.set(x, gr + 1, z - 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 4: warm light behind some upper-floor windows (lamps in the air gap inside).
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  if (gr > ROOF || !isPerim(x, z)) continue;
  for (let s = 1; s <= 3; s++) {
    const y = s * 5 + 2;
    if (y <= gr || y >= ROOF) continue;
    if ((x + 2 * z + s) % 4 !== 0 || (x + z) % 3 === 0) continue;
    const inward = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dz]) => [x + dx, z + dz])
      .find(([nx, nz]) => inFp(nx, nz) && !isPerim(nx, nz));
    if (inward) g.set(inward[0], y, inward[1], (s + x + z) % 2 ? "shroomlight" : "glowstone");
  }
}

g.save(OUT);
