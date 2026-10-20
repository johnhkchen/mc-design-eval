import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538461850";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 23, D = 26;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground (relative to lowest ground, y 0)
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(10, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);

// Outward / inward directions. N = toward z-1 (the street frontage side).
const DIRS = {
  N: { dx: 0, dz: -1, inX: 0, inZ: 1 },
  S: { dx: 0, dz: 1, inX: 0, inZ: -1 },
  W: { dx: -1, dz: 0, inX: 1, inZ: 0 },
  E: { dx: 1, dz: 0, inX: -1, inZ: 0 },
};

// Materials
const FOUNDATION = "stone_bricks";
const SLAB = "smooth_stone";
const ROOF = "light_gray_concrete";
const WALL = "white_concrete";
const TRIM = "light_gray_concrete";
const BASE = "gray_concrete";
const GLASS = "light_blue_stained_glass";
const SHOP_GLASS = "glass";
const SHOP_KICK = "polished_andesite";
const SIGN = "red_concrete";
const PLANT = "iron_block";
const LIGHT = "glowstone";

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

  // Floor slabs: ground floor deck, first-floor deck, roof deck
  g.set(x, gr, z, SLAB);
  g.set(x, gr + 5, z, SLAB);
  g.set(x, gr + 10, z, ROOF);

  const miss = Object.entries(DIRS).filter(([, d]) => !has(x + d.dx, z + d.dz)).map(([k]) => k);
  const isBoundary = miss.length > 0;

  if (isBoundary) {
    // Wall columns, parapet on top
    for (const y of [gr + 1, gr + 2, gr + 3, gr + 4, gr + 6, gr + 7, gr + 8, gr + 9]) {
      g.set(x, y, z, WALL);
    }
    g.set(x, gr + 11, z, TRIM);
    g.set(x, gr + 1, z, BASE);

    if (miss.length === 1) {
      const face = miss[0];
      const idx = (face === "N" || face === "S") ? x : z;
      const frontage = face === "N";
      const isDoor = frontage && idx === 4;

      if (frontage) {
        // Shopfront on ground floor, entrance at centre
        if (isDoor) {
          g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          g.set(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          g.set(x, gr + 3, z, SHOP_GLASS);
        } else {
          g.set(x, gr + 1, z, SHOP_KICK);
          g.set(x, gr + 2, z, SHOP_GLASS);
          g.set(x, gr + 3, z, SHOP_GLASS);
        }
        g.set(x, gr + 4, z, SIGN);
        // Upper frontage: spandrel, windows with lintel
        g.set(x, gr + 6, z, TRIM);
        const win = idx % 3 === 1;
        g.set(x, gr + 7, z, win ? GLASS : WALL);
        g.set(x, gr + 8, z, win ? GLASS : WALL);
        g.set(x, gr + 9, z, TRIM);
      } else {
        // Ordinary facade: window bays every 3 blocks
        const win = idx % 3 === 1;
        g.set(x, gr + 2, z, win ? GLASS : WALL);
        g.set(x, gr + 3, z, win ? GLASS : WALL);
        g.set(x, gr + 4, z, TRIM);
        g.set(x, gr + 6, z, TRIM);
        g.set(x, gr + 7, z, win ? GLASS : WALL);
        g.set(x, gr + 8, z, win ? GLASS : WALL);
        g.set(x, gr + 9, z, TRIM);
      }

      // Warm light behind some windows (inside cell, only if truly interior)
      const d = DIRS[face];
      const ix = x + d.inX, iz = z + d.inZ;
      if (win_check(idx, frontage) && has(ix, iz) && isInterior(ix, iz)) {
        if (idx % 6 === 1) g.set(ix, gr + 2, iz, LIGHT);
        if (idx % 6 === 4) g.set(ix, gr + 7, iz, LIGHT);
      }
    } else {
      // Corner / pier cell: solid, no windows
      g.set(x, gr + 2, z, WALL);
      g.set(x, gr + 3, z, WALL);
      g.set(x, gr + 4, z, TRIM);
      g.set(x, gr + 7, z, WALL);
      g.set(x, gr + 8, z, WALL);
    }
  }
}

// Roof plant: a low equipment block in the middle of the roof
for (let x = 3; x <= 5; x++) {
  for (let z = 10; z <= 15; z++) {
    if (!has(x, z)) continue;
    if (!isInterior(x, z)) continue;
    const gr = ground.get(`${x},${z}`);
    g.set(x, gr + 11, z, PLANT);
  }
}

function win_check(idx, frontage) {
  // Window bays on a facade are at idx % 3 === 1
  return idx % 3 === 1;
}

function isInterior(x, z) {
  return has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
}

g.save(`${DIR}/${ID}.nbt`);
