import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58090.cells.json`, "utf8"));

const W = 25, H = 29, D = 16;
const g = new Voxels([W, H, D]);

// Palette: 1970s-80s Downtown DC office, pale stone-clad piers and spandrels, tinted glass bays
const BASE = "stone_bricks";
const BAND = "stone_brick_slab";
const WALL = "smooth_quartz";
const PIER = "quartz_pillar";
const GLASS = "light_blue_stained_glass";
const LIGHT = "glowstone";
const FLOOR = "smooth_stone";
const ROOF = "smooth_stone";
const MECH = "light_gray_concrete";
const MECH_CAP = "smooth_quartz_slab";

const cellSet = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => cellSet.has(`${x},${z}`);

// Base level = highest ground under the footprint; storeys stand on this common line
const base = Math.max(...cells.map((c) => c[2]));

// Entrance: on the minimum-z (street) face, nearest the middle of that face
const minZ = Math.min(...cells.map((c) => c[1]));
const streetCells = cells.filter(([x, z]) => z === minZ);
const meanX = streetCells.length
  ? streetCells.reduce((s, c) => s + c[0], 0) / streetCells.length
  : 0;
let ex = -1, ez = -1;
if (streetCells.length) {
  const best = [...streetCells].sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX))[0];
  ex = best[0];
  ez = best[1];
}

for (const [x, z, ground, roof] of cells) {
  const miss = [has(x + 1, z), has(x - 1, z), has(x, z + 1), has(x, z - 1)].filter((v) => !v).length;
  const edge = miss > 0;
  const corner = miss >= 2;

  // Storeys of about 3 blocks, stepped from the lidar roof; each column ends at its own level
  const n = Math.min(6, Math.max(1, Math.round((roof - base - 1) / 3)));
  const top = base + 3 * n;

  // Foundation: solid from y0 up through ground to the common base line
  for (let y = 0; y < base; y++) g.set(x, y, z, BASE);

  for (let k = 0; k < n; k++) {
    const f = base + 3 * k;

    // Floor slab / storey line; a stone band course reads the storey lines on the facade
    if (edge) g.set(x, f, z, k === 0 ? BASE : BAND, k === 0 ? {} : { type: "bottom", waterlogged: "false" });
    else g.set(x, f, z, FLOOR);
    if (!edge) continue;

    // Entrance on the street face, ground storey only
    if (k === 0 && x === ex && z === ez) {
      g.set(x, f, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, f + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, f + 2, z, GLASS);
      continue;
    }

    // Window band: ground storey is a glazed lobby with corner piers; upper storeys have a pier grid
    for (const dy of [1, 2]) {
      const y = f + dy;
      let block;
      if (k === 0) {
        block = corner ? PIER : GLASS;
      } else {
        block = (corner || (x + z) % 3 === 0) ? PIER : GLASS;
      }
      // Sparse warm lights, lit offices only
      if (dy === 1 && block === GLASS && (x * 7 + z * 5 + k * 3) % 11 === 0) block = LIGHT;

      if (block === PIER) g.set(x, y, z, PIER, { axis: "y" });
      else g.set(x, y, z, block);
    }
  }

  // Roof slab at the top of the column
  g.set(x, top, z, edge ? WALL : ROOF);

  if (edge) {
    // Parapet coping: a stone cap line with a lighter top
    g.set(x, top + 1, z, BAND, { type: "bottom", waterlogged: "false" });
  } else if ((x * 3 + z * 5) % 11 === 0) {
    // Sparse, low roof plant on a few interior cells, lighter than the parapet
    g.set(x, top + 1, z, MECH);
    g.set(x, top + 2, z, MECH_CAP, { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC58090.nbt`);
