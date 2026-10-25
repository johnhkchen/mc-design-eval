import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${dir}/FR301499503.cells.json`, "utf8"));

const W = 15, D = 10, H = 17;
const g = new Voxels([W, H, D]);

// Indifférencié: lime-render house on a stone plinth with a dark slate roof.
const WALL = "calcite";
const BASE = "stone_bricks";
const TRIM = "stone_brick_slab";
const ROOF = "deepslate_tiles";
const ROOF_EDGE = "deepslate_brick_slab";
const WINDOW = "glass";
const LIT = "glowstone";
const SILL = "smooth_stone_slab";

const map = new Map();
const roofs = [];
for (const [x, z, gr, rf] of cells) {
  map.set(`${x},${z}`, [gr, rf]);
  roofs.push(Math.round(rf));
}

// Lidar noise: take one clean roof height for the whole building, then
// let each cell only follow its own ground level (the foundation).
roofs.sort((a, b) => a - b);
const medRf = Math.min(H - 1, roofs[Math.floor(roofs.length / 2)]);

const windowX = new Set([2, 5, 8, 11]);
const doorX = 7;

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = map.get(`${x},${z}`);
    if (!c) continue;
    const gr = Math.max(0, Math.round(c[0]));

    // Wall height: three storey-scale courses above the ground, eave under the roof.
    const eave = Math.max(gr + 3, medRf - 2);
    const rise = Math.max(1, medRf - eave);
    const d = Math.min(z, D - 1 - z);            // 0 at the front/back faces, 4 at the ridge
    const top = Math.min(H - 1, eave + Math.round((rise * d) / 4));
    const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    const front = z === 0 || z === D - 1;

    // Foundation up to this cell's ground
    for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);

    // Solid walls from ground to eave
    for (let y = gr; y < eave; y++) g.set(x, y, z, WALL);

    // Plinth course at ground level on the perimeter
    if (perim) g.set(x, gr, z, BASE);

    // Cornice under the roof on the perimeter
    if (perim) g.set(x, eave - 1, z, TRIM);

    // Slate roof: a clean gable stepping up toward the ridge along x
    for (let y = eave; y < top; y++) {
      const edge = (d <= 1 && y === eave);
      g.set(x, y, z, edge ? ROOF_EDGE : ROOF);
    }
    // Ridge capstone
    if (d === 4 && top < H) g.set(x, top, z, ROOF_EDGE);

    // Front and back facades: windows, sills, central door under a lintel
    if (front && x >= 1 && x <= W - 2) {
      const fy1 = gr + 1, fy2 = gr + 2;
      const limit = eave - 1;

      if (x === doorX && z === 0) {
        if (fy1 < limit) g.set(x, fy1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        if (fy2 < limit) g.set(x, fy2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        // lintel over the door
        if (fy2 + 1 < limit) g.set(x, fy2 + 1, z, TRIM);
      } else if (windowX.has(x)) {
        const lit = (x === 5 || x === 8) && z === 0;
        // sill below the window
        if (fy1 - 1 >= gr) g.set(x, fy1 - 1, z, SILL, { type: "bottom", waterlogged: "false" });
        if (fy1 < limit) g.set(x, fy1, z, lit ? LIT : WINDOW);
        if (fy2 < limit) g.set(x, fy2, z, WINDOW);
      }
    }
  }
}

// Canopy over the entrance on the front face: a slab projecting from the lintel line.
const cy = medRf > 0 ? Math.max(1, medRf - 3) : 3;
const gr0 = Math.max(0, Math.round((map.get(`${doorX},0`) || [0])[0]));
for (let x = doorX - 1; x <= doorX + 1; x++) {
  const y = gr0 + 3;
  if (y < H && map.get(`${x},0`) && y < medRf - 2) {
    g.set(x, y, 0, TRIM, { type: "top", waterlogged: "false" });
  }
}

g.save(`${dir}/FR301499503.nbt`);
