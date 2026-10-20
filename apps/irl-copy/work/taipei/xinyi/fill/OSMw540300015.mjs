import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300015";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, D = 21, H = 23;
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, gr);
}
const minG = Math.min(...ground.values());

// Record: roof about 11 blocks above lowest ground -> roof deck is the 11th block (rel 10).
const ROOF = minG + 10;

const doorProps = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

// Lit interior cells (warm light behind glass)
const upperLit = new Set([3, 7, 9]);
const shopLit = new Set([2, 4, 8]);

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (gr > ROOF) continue;

  const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const front = z === 0;

  for (let y = 0; y <= ROOF; y++) {
    // Foundation: solid from y 0 up to this cell's ground
    if (y < gr) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    const r = y - minG;

    if (!perim) {
      // Interior: air gap, floor slabs per storey, roof deck, warm lights behind glass
      if (y === gr) {
        g.set(x, y, z, "smooth_stone");
      } else if (r === 5) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (y === ROOF) {
        g.set(x, y, z, "gray_concrete");
      } else if (z === 2 && front) {
        if (r === 7 && upperLit.has(x) && x % 2 === 1) g.set(x, y, z, "glowstone");
        if (r === 2 && shopLit.has(x)) g.set(x, y, z, "glowstone");
      }
      continue;
    }

    // Perimeter shell
    if (y === ROOF) {
      g.set(x, y, z, "smooth_quartz"); // parapet coping
      continue;
    }
    if (r === 0) {
      g.set(x, y, z, "stone_bricks"); // base course
      continue;
    }
    if (r === 5) {
      g.set(x, y, z, "smooth_quartz"); // storey cornice
      continue;
    }

    if (r >= 1 && r <= 4) {
      // Ground floor: shopfront on the street face, glazed walls elsewhere
      if (front) {
        if (r === 4) {
          // Canopy frieze over shopfront
          g.set(x, y, z, x === 0 || x === W - 1 ? "white_concrete" : "red_concrete");
          continue;
        }
        if (x === 0 || x === W - 1 || x === 1 || x === W - 2) {
          g.set(x, y, z, "light_gray_concrete"); // pilasters
          continue;
        }
        if (x === 5) {
          if (r === 1) { g.set(x, y, z, "oak_door", doorProps("lower")); continue; }
          if (r === 2) { g.set(x, y, z, "oak_door", doorProps("upper")); continue; }
          g.set(x, y, z, "glass_pane");
          continue;
        }
        g.set(x, y, z, "glass_pane");
        continue;
      } else {
        const idx = (x === 0 || x === W - 1) ? z : x;
        const len = (x === 0 || x === W - 1) ? D : W;
        const inner = idx >= 1 && idx <= len - 2;
        if (inner && idx % 2 === 1) g.set(x, y, z, "glass_pane");
        else g.set(x, y, z, "white_concrete");
        continue;
      }
    }

    if (r >= 6 && r <= 9) {
      // Upper storey window grid
      const idx = (front || z === D - 1) ? x : z;
      const len = (front || z === D - 1) ? W : D;
      const inner = idx >= 1 && idx <= len - 2;
      if (inner && idx % 2 === 1) g.set(x, y, z, "glass_pane");
      else if (inner) g.set(x, y, z, "light_gray_concrete");
      else g.set(x, y, z, "white_concrete");
      continue;
    }

    g.set(x, y, z, "white_concrete");
  }
}

// Roof equipment: a small plant box on the roof deck, if the cells allow it
if (ROOF + 1 < H) {
  for (let x = 3; x <= 6; x++) {
    for (let z = 8; z <= 11; z++) {
      const gr = ground.get(`${x},${z}`);
      if (gr !== undefined && gr <= ROOF) {
        g.set(x, ROOF + 1, z, "light_gray_concrete");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
