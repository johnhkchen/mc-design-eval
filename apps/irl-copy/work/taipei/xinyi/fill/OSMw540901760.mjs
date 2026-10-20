import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540901760";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 10 x 17 footprint, roof about 11 blocks above lowest ground.
// Two storeys of ~5 blocks (ground storey y1-4, upper y6-9), roof slab at y10,
// parapet at y11, rooftop plant above. Tiled white-concrete mid-rise, 1990s-2000s
// Xinyi commercial look: blue-tinted glass bands, light-grey base and cornice.
const W = 10, H = 23, D = 17;
const ROOF = 11;
const vox = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const perim = (x, z) => !inside(x + 1, z) || !inside(x - 1, z) || !inside(x, z + 1) || !inside(x, z - 1);
const corner = (x, z) =>
  (!inside(x - 1, z) || !inside(x + 1, z)) && (!inside(x, z - 1) || !inside(x, z + 1));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

const minZ = Math.min(...cells.map(([, z]) => z));
const GLASS = "light_blue_stained_glass";
const FRAME = "white_concrete";
const TRIM = "light_gray_concrete";
const BASE = "stone_bricks";

// Pass 1: foundations, floor slabs, walls, windows, base course, cornice.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, BASE);

  // Floor slab (y5) and roof deck (y10) across the whole footprint above ground.
  if (5 > gr) put(x, 5, z, TRIM);
  if (10 > gr) put(x, 10, z, TRIM);

  if (!perim(x, z)) continue;
  const cor = corner(x, z);
  const front = z === minZ;

  for (let y = gr + 1; y <= ROOF; y++) {
    if (y === ROOF) { put(x, y, z, TRIM); continue; }        // parapet cap
    if (y === 10) { put(x, y, z, TRIM); continue; }          // cornice / roof edge
    if (y === 5) { put(x, y, z, TRIM); continue; }           // storey line
    if (y === gr + 1 && y <= 1) { put(x, y, z, BASE); continue; } // base course
    if (y <= 0) continue;

    const band = (y >= 2 && y <= 4) || (y >= 7 && y <= 9);
    if (!band || cor) { put(x, y, z, FRAME); continue; }
    if ((x + z) % 3 === 0) { put(x, y, z, FRAME); continue; } // mullion
    put(x, y, z, GLASS);
  }
  // Ground-floor shopfront on the street face: lower glazing band.
  if (front && gr + 1 <= 2) {
    for (let y = gr + 1; y <= 2; y++) {
      if (!cor && (x + z) % 3 !== 0) put(x, y, z, GLASS);
      else put(x, y, z, FRAME);
    }
  }
}

// Pass 2: entrance on the street face (lower-centre, two-wide oak doors) and lintel.
for (const [x, z, gr] of cells) {
  if (z !== minZ || !perim(x, z)) continue;
  if (x >= 3 && x <= 6) put(x, 3, z, TRIM); // lintel band over entrance
  if ((x === 4 || x === 5) && gr + 2 <= 3) {
    const yb = gr + 1;
    const hinge = x === 4 ? "left" : "right";
    put(x, yb, z, "oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    put(x, yb + 1, z, "oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  }
}

// Pass 3: warm interior lights behind the street-face glazing (air gap kept elsewhere).
for (const [x, z, gr] of cells) {
  if (perim(x, z)) continue;
  if (z !== minZ + 1) continue;
  if (x % 4 === 1) {
    if (3 > gr) put(x, 3, z, "glowstone");
    if (8 > gr) put(x, 8, z, "glowstone");
  }
}

// Pass 4: rooftop plant room with a lightning rod and cap slab.
for (let x = 3; x <= 6; x++) {
  for (let z = 6; z <= 10; z++) {
    if (!inside(x, z)) continue;
    const edge = x === 3 || x === 6 || z === 6 || z === 10;
    for (let y = 11; y <= 12; y++) put(x, y, z, edge ? TRIM : "air");
    put(x, 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
put(4, 14, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

vox.save(`${DIR}/${ID}.nbt`);
