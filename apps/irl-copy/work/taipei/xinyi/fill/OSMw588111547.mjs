import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588111547";
const W = 25, H = 34, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint --------------------------------------------------------------
const foot = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  foot.set(`${x},${z}`, Math.floor(gr));
}
const has = (x, z) => foot.has(`${x},${z}`);
const ground = (x, z) => foot.get(`${x},${z}`);

const list = [...foot.keys()].map(k => k.split(",").map(Number));
const minX = Math.min(...list.map(c => c[0])), maxX = Math.max(...list.map(c => c[0]));
const minZ = Math.min(...list.map(c => c[1])), maxZ = Math.max(...list.map(c => c[1]));
const gVals = [...foot.values()];
const minG = Math.min(...gVals), maxG = Math.max(...gVals);

// ---- vertical plan ----------------------------------------------------------
// Floors sit at the highest ground so every storey is level; the foundation
// runs down on the downhill side. Roof target: 22 blocks above lowest ground.
const F = maxG;
const roofTarget = Math.min(minG + 22, H - 3);
let N = Math.max(2, Math.floor((roofTarget - F - 2) / 5));
while (F + 5 * N + 2 > H - 2 && N > 2) N--;
const TOP = F + 5 * N; // roof slab row

// ---- helpers ----------------------------------------------------------------
const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
function put(x, y, z, id, props) {
  if (!inB(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const zMissing = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const xMissing = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const perim = (x, z) => zMissing(x, z) || xMissing(x, z);
const corner = (x, z) => zMissing(x, z) && xMissing(x, z);
// A pier sits on every third bay of each face, and at every corner.
function pier(x, z) {
  if (corner(x, z)) return true;
  if (zMissing(x, z)) return (x - minX) % 3 === 0;
  if (xMissing(x, z)) return (z - minZ) % 3 === 0;
  return false;
}

// Entrance: the front (minZ) face, centred on the frontage.
const frontXs = list.filter(([x, z]) => z === minZ).map(c => c[0]).sort((a, b) => a - b);
const cx = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : Math.round((minX + maxX) / 2);

// ---- foundation: solid from y 0 up to each cell's ground, then to floor level ----
for (const [x, z] of list) {
  const gr = ground(x, z);
  for (let y = 0; y < F; y++) put(x, y, z, y < gr ? "stone" : "stone_bricks");
  for (let y = F; y < gr; y++) put(x, y, z, "stone"); // uphill ground under the building
}

// ---- storeys ----------------------------------------------------------------
const GLASS = "light_blue_stained_glass";
const BAND = "white_concrete";
const PIER = "light_gray_concrete";

for (let s = 0; s < N; s++) {
  const base = F + 5 * s;
  for (const [x, z] of list) {
    if (!perim(x, z)) {
      // interior: floor slab only, air above (no interiors)
      put(x, base, z, BAND);
      continue;
    }
    // base row
    put(x, base, z, s === 0 ? "stone_bricks" : BAND);

    const isFront = z === minZ;
    const inEntrance = s === 0 && isFront && Math.abs(x - cx) <= 1;

    for (let k = 1; k <= 4; k++) {
      const y = base + k;
      if (inEntrance) {
        if (x === cx && k === 1) {
          put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (x === cx && k === 2) {
          put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else if (k <= 2) {
          put(x, y, z, GLASS);
        } else if (k === 3) {
          put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); // hood over entrance
        } else {
          put(x, y, z, GLASS);
        }
        continue;
      }
      if (pier(x, z)) {
        put(x, y, z, PIER);
      } else if (k === 2 && (x * 3 + z * 5 + s) % 11 === 0) {
        put(x, y, z, "glowstone"); // warm light behind glass
      } else {
        put(x, y, z, GLASS);
      }
    }
  }
}

// ---- roof, parapet, equipment ----------------------------------------------
for (const [x, z] of list) {
  if (perim(x, z)) {
    put(x, TOP, z, "smooth_quartz"); // cornice
    put(x, TOP + 1, z, PIER);        // parapet
    put(x, TOP + 2, z, PIER);
    if (corner(x, z)) {
      put(x, TOP + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  } else {
    put(x, TOP, z, "gray_concrete");
  }
}

// Rooftop plant box, inboard and set back from the parapet.
for (const [x, z] of list) {
  if (perim(x, z)) continue;
  if (x >= minX + 4 && x <= maxX - 4 && z >= minZ + 3 && z <= maxZ - 4) {
    put(x, TOP + 1, z, "stone_bricks");
    put(x, TOP + 2, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
