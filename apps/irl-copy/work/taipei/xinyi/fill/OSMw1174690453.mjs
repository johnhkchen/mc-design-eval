import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1174690453.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1174690453.nbt";

const W = 23, H = 23, D = 20;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Lowest ground under the footprint is y0; roof sits ~11 blocks above it.
const minG = Math.min(...cells.map(c => c[2]));
const L0 = minG;          // ground storey floor line
const L1 = minG + 5;      // second storey floor line
const L2 = minG + 10;     // third line (roof band)
const TOP = minG + 11;    // roof deck level (lidar height)

const set = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => set.has(`${x},${z}`);

function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Entrance sits on the south face near the centre line.
const ENTRANCE_X = Math.floor(W / 2);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const mW = !has(x - 1, z);
  const mE = !has(x + 1, z);
  const mN = !has(x, z - 1);
  const mS = !has(x, z + 1);
  const perim = mW || mE || mN || mS;
  const corner = (mW || mE) && (mN || mS);
  const alongX = (mN || mS) && !(mW || mE); // wall runs along x
  const u = alongX ? x : z;                 // coordinate along the face
  // Inward offset from a facade cell to its interior neighbour.
  const dx = mW ? 1 : mE ? -1 : 0;
  const dz = mN ? 1 : mS ? -1 : 0;

  for (let y = gr; y < TOP; y++) {
    if (!perim) {
      // Interior: floor slabs only, air elsewhere (no fit-out).
      if ((y === L1 || y === L2) && y >= gr) put(x, y, z, "light_gray_concrete");
      // A warm light sitting on the second-storey floor.
      if (y === L1 + 1 && x % 7 === 3 && z % 7 === 3) put(x, y, z, "glowstone");
      continue;
    }

    if (corner) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    if (y === gr) {
      put(x, y, z, "polished_andesite");                 // base course
    } else if (y === L1 || y === L2) {
      put(x, y, z, "light_gray_concrete");              // storey line
    } else if (y > L0 && y < L0 + 4) {
      // Ground-floor shopfront.
      const isDoorFace = mS && !mW && !mE && Math.abs(x - ENTRANCE_X) <= 0;
      if (isDoorFace && (y === L0 + 1 || y === L0 + 2)) {
        put(x, y, z, "iron_door", {
          facing: "south",
          half: y === L0 + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (u % 3 === 0) {
        put(x, y, z, "smooth_quartz");                  // mullion
      } else {
        put(x, y, z, "light_blue_stained_glass");       // shopfront glass
      }
    } else if (y === L0 + 4) {
      // Canopy line over the entrance, spandrel elsewhere.
      if (mS && !mW && !mE && Math.abs(x - ENTRANCE_X) <= 1) {
        put(x, y, z, "dark_gray_concrete");
      } else {
        put(x, y, z, "white_concrete");
      }
    } else if ((y > L1 && y < L1 + 4) || (y > L2 && y < L2 + 4)) {
      // Upper-storey window grid with frames.
      const storeyBase = y > L2 ? L2 : L1;
      if (u % 3 === 0) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "light_blue_stained_glass");
        // Warm light behind some windows (inside the air gap).
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && u % 6 === 2 && y === storeyBase + 2) {
          put(ix, y, iz, "glowstone");
        }
      }
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Roof: cornice and parapet on the perimeter, deck and plant inside.
  if (perim && !corner) {
    put(x, TOP, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    put(x, TOP + 1, z, "white_concrete");
  } else if (corner) {
    put(x, TOP, z, "smooth_quartz");
    put(x, TOP + 1, z, "smooth_quartz");
  } else if (gr <= TOP) {
    put(x, TOP, z, "light_gray_concrete");
    // Rooftop plant: a few compact units.
    if (x % 5 === 2 && z % 5 === 2) put(x, TOP + 1, z, "iron_block");
  }
}

g.save(OUT);
