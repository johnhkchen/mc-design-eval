import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764242682";
const W = 31, H = 81, D = 36;
const MAXY = 72;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) ground.set(key(x, z), Math.round(g));
const has = (x, z) => ground.has(key(x, z));

// Chebyshev distance from each footprint cell to the nearest missing cell (1 = outer ring)
const dist = new Map();
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  let r = 1;
  while (r < 60) {
    let miss = false;
    for (let dx = -r; dx <= r && !miss; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        if (!has(x + dx, z + dz)) { miss = true; break; }
      }
    }
    if (miss) break;
    r++;
  }
  dist.set(k, r);
}
const d = (x, z) => dist.get(key(x, z)) ?? 0;

// Setback tiers: podium (full footprint), mid block (inset 2), tower (inset 4), plant crown (inset 6)
const minD = y => (y < 20 ? 1 : y < 46 ? 3 : y < 70 ? 5 : y <= MAXY ? 7 : Infinity);
const ok = (x, z, y) => d(x, z) >= minD(y);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const SHOP = "cyan_stained_glass";
const TOWER_GLASS = "light_blue_stained_glass";

const g3 = new Voxels([W, H, D]);

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g3.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= MAXY; y++) {
    if (!ok(x, z, y)) continue;

    // Roof / ledge cap wherever the tier above is set back
    if (!ok(x, z, y + 1)) {
      g3.set(x, y, z, "smooth_stone");
      continue;
    }

    const exposed = DIRS.some(([dx, dz]) => !ok(x + dx, z + dz, y));
    const k5 = y % 5;

    if (!exposed) {
      // Interior: solid plant crown, otherwise floor slabs only (air between)
      if (y >= 70) g3.set(x, y, z, "light_gray_concrete");
      else if (k5 === 0) g3.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Facade
    let id;
    if (y < gr + 1) id = "polished_granite";                 // base course
    else if (k5 === 0) id = "white_concrete";                 // storey line / floor band
    else if (k5 === 4) id = y >= 70 ? "light_gray_concrete" : "gray_concrete"; // spandrel
    else if ((x + z) % 3 === 0) id = "white_concrete";        // mullion / pier
    else {
      id = y < 20 ? SHOP : TOWER_GLASS;                       // glazing
      if (k5 === 2 && (x * 5 + z * 7 + Math.floor(y / 5) * 3) % 13 === 0) {
        id = "glowstone";                                     // lit window at dusk
      }
    }
    g3.set(x, y, z, id);
  }
}

// Main entrance on the north (min z) face, centred on its frontage
let minZ = Infinity;
for (const k of ground.keys()) minZ = Math.min(minZ, Number(k.split(",")[1]));
const frontXs = [...ground.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([, z]) => z === minZ)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const mid = frontXs[Math.floor(frontXs.length / 2)];
const gAt = (x, z) => ground.get(key(x, z));

// Double doors
for (const x of [mid - 1, mid]) {
  const gr = gAt(x, minZ);
  if (gr === undefined) continue;
  const hinge = x === mid - 1 ? "left" : "right";
  g3.set(x, gr + 1, minZ, "dark_oak_door",
    { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  g3.set(x, gr + 2, minZ, "dark_oak_door",
    { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}

// Canopy slab over the entrance bay
for (let x = mid - 2; x <= mid + 1; x++) {
  const gr = gAt(x, minZ);
  if (gr === undefined) continue;
  g3.set(x, gr + 3, minZ, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

g3.save(`${DIR}/${ID}.nbt`);
