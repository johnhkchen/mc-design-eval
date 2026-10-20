import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE091-0093-9F";

// Shin Kong Mitsukoshi A9 (2002): podium department store with setback glass tower,
// rooftop plant room. Roughly 9 storeys of 5 blocks to a roof near y 45.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 46, H = 57, D = 199;

const K = (x, z) => x * 1000 + z;
const RAW = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  RAW.set(K(x, z), gr);
  if (gr < minG) minG = gr;
}
const FP = new Set(RAW.keys());
const groundOf = (k) => RAW.get(k) - minG;

// Erosion: cells whose whole Chebyshev neighbourhood of radius d lies in the footprint.
function inset(d) {
  const s = new Set();
  for (const k of FP) {
    const x = Math.floor(k / 1000), z = k % 1000;
    let ok = true;
    for (let i = -d; i <= d && ok; i++)
      for (let j = -d; j <= d && ok; j++)
        if (!FP.has(K(x + i, z + j))) ok = false;
    if (ok) s.add(k);
  }
  return s;
}
const I3 = inset(3), I7 = inset(7), I12 = inset(12);

// Tier footprint by absolute height.
function tier(y) {
  if (y < 10) return FP;      // podium, two storeys
  if (y < 40) return I3;      // tower
  if (y < 45) return I7;      // upper tower
  if (y < 49) return I12;     // rooftop plant room
  return null;
}
const inT = (y, x, z) => { const t = tier(y); return !!t && t.has(K(x, z)); };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const perim = (y, x, z) => inT(y, x, z) && DIRS.some(([a, b]) => !inT(y, x + a, z + b));
const tierTop = (y) => y === 9 || y === 39 || y === 44 || y === 48;

// Bounds and entrance on the west face near the middle.
let minX = Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of FP) {
  const x = Math.floor(k / 1000), z = k % 1000;
  if (x < minX) minX = x;
  if (z < minZ) minZ = z;
  if (z > maxZ) maxZ = z;
}
const midZ = Math.floor((minZ + maxZ) / 2);
const isEntrance = (x, z) => x === minX && (z === midZ || z === midZ + 1);
const isPortal = (x, z) => x === minX && z >= midZ - 1 && z <= midZ + 2;

const g = new Voxels([W, H, D]);

const doorProps = (half) => ({
  facing: "west", half, hinge: "left", open: "false", powered: "false",
});

for (const k of FP) {
  const x = Math.floor(k / 1000), z = k % 1000;
  const gr = groundOf(k);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "gray_concrete");

  for (let y = gr; y < 49; y++) {
    if (!inT(y, x, z)) continue;
    const p = perim(y, x, z);

    // Tier tops: roof deck inside, coping on the edge.
    if (tierTop(y)) {
      g.set(x, y, z, p ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    // Entrance portal: doors on the ground storey, quartz lintel above.
    if (p && y < 10 && isEntrance(x, z) && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "dark_oak_door", doorProps(y === gr ? "lower" : "upper"));
      continue;
    }
    if (p && y < 10 && isPortal(x, z) && y === gr + 2) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    // Podium base course.
    if (p && y === gr && y < 10) {
      g.set(x, y, z, "polished_granite");
      continue;
    }

    // Storey floor slabs and spandrels.
    if (y % 5 === 0) {
      g.set(x, y, z, p ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    if (!p) continue; // interior air behind the glass

    // Facade: shopfront at the podium, glass curtain wall above.
    const mullion = (x + z) % 4 === 0;
    if (y < 10 && y < gr + 4) {
      g.set(x, y, z, mullion ? "smooth_quartz" : "cyan_stained_glass");
    } else {
      g.set(x, y, z, mullion ? "smooth_quartz" : "light_blue_stained_glass");
    }

    // Warm light behind some windows, placed on an interior neighbour.
    if (((x * 7 + z * 3 + y) % 11) === 0) {
      for (const [a, b] of DIRS) {
        const nx = x + a, nz = z + b;
        if (inT(y, nx, nz) && !perim(y, nx, nz)) {
          g.set(nx, y, nz, "glowstone");
          break;
        }
      }
    }
  }

  // Vestibule lantern just inside the doors.
  if (isEntrance(x, z) && z === midZ) {
    const gy = gr + 1;
    if (inT(gy, x + 1, z)) g.set(x + 1, gy, z, "lantern", { hanging: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
