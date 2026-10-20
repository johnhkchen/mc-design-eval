import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109960";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 33, D = 21;
const g = new Voxels([W, H, D]);

// Era: 1990s Xinyi office/commercial block. Four storeys of about 5 blocks,
// white tiled concrete piers, light-grey slabs, blue-tinted glazing, a
// penthouse plant box and a short antenna on the roof.
const ROOF = 21;
const PARAPET = 22;
const FLOORS = [6, 11, 16];

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const GLASS = "light_blue_stained_glass_pane";
const PIER = "white_concrete";
const SLAB = "light_gray_concrete";
const DOOR = "minecraft:oak_door";

// Outward-facing normals mapped to the inward offset (into the building).
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

for (const [x, z, gr0] of cells) {
  const gr = Math.min(Math.max(0, gr0), 19);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const miss = [];
  if (!has(x, z - 1)) miss.push("N");
  if (!has(x, z + 1)) miss.push("S");
  if (!has(x - 1, z)) miss.push("W");
  if (!has(x + 1, z)) miss.push("E");
  const perim = miss.length > 0;

  // Ground floor slab / base course.
  g.set(x, gr, z, perim ? "polished_andesite" : "smooth_stone");

  // Storey slabs and roof, across the whole footprint.
  for (const f of FLOORS) if (f > gr) g.set(x, f, z, SLAB);
  g.set(x, ROOF, z, SLAB);

  if (!perim) continue;

  const corner = miss.length >= 2;
  const face = miss[0];
  const idx = face === "N" || face === "S" ? x : z;
  const inw = INWARD[face];

  const bands = [gr, ...FLOORS.filter((f) => f > gr), ROOF];

  for (let y = gr + 1; y <= PARAPET; y++) {
    if (y === PARAPET) {
      g.set(x, y, z, PIER);
      continue;
    }
    if (bands.includes(y)) {
      g.set(x, y, z, SLAB);
      continue;
    }
    // Find the band this row sits in.
    let lo = gr;
    for (let i = 0; i < bands.length - 1; i++) {
      if (bands[i] < y && y < bands[i + 1]) { lo = bands[i]; break; }
    }
    const rel = y - lo;

    if (corner || idx % 3 === 0 || rel >= 4) {
      g.set(x, y, z, PIER);
      continue;
    }

    // Window bay.
    g.set(x, y, z, GLASS);

    // Warm light behind some panes, in the air gap just inside.
    if (rel === 2 && (x + z + y) % 5 === 0) {
      const ix = x + inw[0], iz = z + inw[1];
      if (has(ix, iz) && !isPerim(ix, iz)) {
        g.set(ix, y, iz, (x + y) % 2 === 0 ? "glowstone" : "shroomlight");
      }
    }
  }
}

// Entrance: a door on the south face, centred, in the window band.
if (has(10, 20)) {
  const gr = gAt(10, 20);
  const doorProps = (half) => ({
    facing: "south",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  g.set(10, gr + 1, 20, DOOR, doorProps("lower"));
  g.set(10, gr + 2, 20, DOOR, doorProps("upper"));
  // Flanking warm lights either side of the entrance.
  if (has(9, 19) && !isPerim(9, 19)) g.set(9, gr + 1, 19, "lantern", { hanging: "false", waterlogged: "false" });
  if (has(11, 19) && !isPerim(11, 19)) g.set(11, gr + 1, 19, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof penthouse: a 7x7 plant box, stood on the roof slab.
const PX0 = 7, PX1 = 13, PZ0 = 7, PZ1 = 13;
let phOk = true;
for (let x = PX0; x <= PX1; x++)
  for (let z = PZ0; z <= PZ1; z++)
    if (!has(x, z)) phOk = false;

if (phOk) {
  for (let x = PX0; x <= PX1; x++) {
    for (let z = PZ0; z <= PZ1; z++) {
      const ring = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
      if (ring) {
        g.set(x, 22, z, SLAB);
        for (const y of [23, 24]) {
          g.set(x, y, z, (x + z + y) % 2 === 0 ? GLASS : PIER);
        }
        g.set(x, 25, z, PIER);
      } else {
        g.set(x, 22, z, SLAB); // interior plant floor, air above
      }
      g.set(x, 26, z, SLAB); // penthouse cap
    }
  }
  g.set(10, 23, 10, "glowstone");
}

// Short antenna on the roof, centre of the footprint.
if (has(10, 10)) {
  const base = phOk ? 27 : 22;
  for (let y = base; y < base + 4; y++) {
    g.set(10, y, 10, "iron_bars");
  }
}

g.save(`${DIR}/${ID}.nbt`);
