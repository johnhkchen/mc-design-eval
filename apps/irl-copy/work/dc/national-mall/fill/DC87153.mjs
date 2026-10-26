import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87153.cells.json`, "utf8"));

const W = 11, H = 22, D = 11;
const g = new Voxels([W, H, D]);

// Footprint lookup: ground (g) and lidar roof height (r) per cell
const cm = new Map();
for (const [x, z, gr, rf] of cells) {
  cm.set(`${x},${z}`, { g: gr, r: Math.min(rf, H - 1) });
}
const has = (x, z) => cm.has(`${x},${z}`);
const missing = (x, z, dx, dz) => !has(x + dx, z + dz);

// Smooth lidar noise: one flat roof level for the whole block (median of cell roofs)
const roofs = [...cm.values()].map((c) => c.r).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const roofTop = Math.min(medianRoof - 1, H - 2); // top solid course index

// Storey banding is absolute (y0 = 0): string course every 3 blocks
const isStringRow = (y) => y % 3 === 0;

for (const [key, c] of cm) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < c.g; y++) g.set(x, y, z, "stone_bricks");

  const topY = Math.max(roofTop, c.g + 3);

  const mN = missing(x, z, 0, -1);
  const mS = missing(x, z, 0, 1);
  const mW = missing(x, z, -1, 0);
  const mE = missing(x, z, 1, 0);
  const edge = mN || mS || mW || mE;
  const corner = (mN || mS) && (mW || mE);

  for (let y = c.g; y <= topY; y++) {
    if (!edge) {
      // Interior: floor slabs per storey and a roof deck; no interior volume
      if (y === topY) g.set(x, y, z, "smooth_stone");
      else if (isStringRow(y) && y > c.g) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Facade cells
    let block;
    if (y === topY) {
      block = "calcite"; // cornice / parapet cap
    } else if (y === c.g) {
      block = "stone_bricks"; // base course
    } else if (corner) {
      block = "calcite"; // corner pilaster
    } else if (isStringRow(y)) {
      block = "calcite"; // string course at each floor line
    } else {
      // Bay rhythm: windows on odd bays, brick piers on even
      const u = (mN || mS) ? x : z;
      if (u % 2 === 1) {
        // Sparse warm lights: one lit window in several, varied by floor
        block = ((u + y * 2) % 9 === 1) ? "glowstone" : "glass_pane";
      } else {
        block = "bricks";
      }
    }
    g.set(x, y, z, block);
  }
}

// Entrance: centred on the south (+z) facade, ground floor
{
  const dx = 5, dz = 10;
  const c = cm.get(`${dx},${dz}`);
  if (c) {
    const yl = c.g + 1, yu = c.g + 2;
    g.set(dx, yl, dz, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(dx, yu, dz, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    if (cm.has(`4,${dz}`)) g.set(4, c.g + 2, dz, "lantern", { hanging: "false" });
    if (cm.has(`6,${dz}`)) g.set(6, c.g + 2, dz, "lantern", { hanging: "false" });
  }
}

// Roof equipment: low plant block on the flat roof, centre, sitting on the roof deck
for (let x = 4; x <= 6; x++) {
  for (let z = 4; z <= 6; z++) {
    if (!has(x, z)) continue;
    const c = cm.get(`${x},${z}`);
    if (c.g > roofTop) continue;
    g.set(x, roofTop + 1, z, "stone_bricks");
    if (x === 5 && z === 5) g.set(x, roofTop + 2, z, "calcite");
  }
}

g.save(`${DIR}/DC87153.nbt`);
