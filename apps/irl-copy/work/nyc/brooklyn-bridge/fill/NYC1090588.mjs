import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1090588.cells.json`, "utf8"));
const W = 5, H = 29, D = 15;
const g = new Voxels([W, H, D]);

// ---- footprint helpers -------------------------------------------------
const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr, roof] of cells) foot.set(key(x, z), { gr, roof });
const has = (x, z) => foot.has(key(x, z));

// One smoothed roof tier for the whole building: median lidar roof, even blocks.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const TOP = Math.min(2 * Math.round(medianRoof / 2), H - 5);

const isCorner = (x, z) => (x === 0 || x === 4) && (z === 0 || z === 14);
const isExt = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Window bays: pier every third cell on each facade; corners are piers.
const isWindow = (x, z) => {
  if (!isExt(x, z) || isCorner(x, z)) return false;
  if (x === 0 || x === 4) return z % 3 !== 0; // short faces
  return x % 3 !== 0;                          // long faces (z = 0 / 14)
};
const isDoor = (x, z) => x === 2 && z === 0;

// Flat roof tier per cell; only lifted where the ground is so high the tier would be too low.
const Tof = (x, z) => {
  const c = foot.get(key(x, z));
  return Math.max(TOP, c.gr + 6);
};

// Ground storey is 3 blocks (G..G+2); upper storeys 2 blocks.
// Spandrel (floor band) rows at G+3, G+5, ...; window rows between them.
const isSpandrel = (y, G) => y >= G + 3 && (y - (G + 3)) % 2 === 0;

const paneProps = (x, z) =>
  (x === 0 || x === 4)
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- build -------------------------------------------------------------
for (const [x, z, G] of cells) {
  const T = Tof(x, z);
  const ext = isExt(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  if (!ext) {
    // Interior: air gap, floor slab per storey, roof slab on top
    put(x, G, z, "smooth_stone");
    for (let y = G; y <= T - 2; y++) {
      if (y === G || isSpandrel(y, G)) put(x, y, z, "smooth_stone");
    }
    put(x, T - 1, z, "smooth_stone");
  } else {
    // Exterior shell
    for (let y = G; y <= T - 2; y++) {
      if (y === G) {
        put(x, y, z, "stone_bricks"); // base course
      } else if (y <= G + 2) {
        // Ground storey: commercial shopfronts and entrance
        if (isDoor(x, z)) {
          if (y === G + 1) put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          else put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else if (isWindow(x, z)) {
          put(x, y, z, "glass");
        } else {
          put(x, y, z, "dark_oak_planks");
        }
      } else if (isSpandrel(y, G)) {
        // Storey band; entrance canopy over the door
        if (y === G + 3 && z === 0 && x >= 1 && x <= 3) put(x, y, z, "dark_oak_planks");
        else put(x, y, z, "stone_bricks");
      } else {
        // Window row
        if (isWindow(x, z)) {
          put(x, y, z, "glass_pane", paneProps(x, z));
          // Warm light behind some panes, inside the air gap
          if ((x + z + y) % 4 === 0) {
            const ix = x === 0 ? 1 : x === 4 ? 3 : x;
            const iz = z === 0 ? 1 : z === 14 ? 13 : z;
            if (has(ix, iz) && y < Tof(ix, iz) - 1) put(ix, y, iz, "glowstone");
          }
        } else {
          put(x, y, z, "bricks");
        }
      }
    }
    // Cornice cap
    put(x, T - 1, z, "smooth_stone");
  }

  // Roof plant: one penthouse block on the central roof
  if (x >= 1 && x <= 3 && z >= 5 && z <= 9) {
    put(x, T, z, "stone_bricks"); // penthouse floor on the roof
    const ring = x === 1 || x === 3 || z === 5 || z === 9;
    const corner = (x === 1 || x === 3) && (z === 5 || z === 9);
    if (ring) put(x, T + 1, z, corner ? "stone_bricks" : "glass");
    put(x, T + 2, z, "smooth_stone"); // penthouse roof
  }
}

g.save(`${DIR}/NYC1090588.nbt`);
