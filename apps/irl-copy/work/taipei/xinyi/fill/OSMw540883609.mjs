import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 12 x 10, roof ~11 blocks above lowest ground.
// Read as a two-storey (5 blocks per storey) 1980s Taipei commercial block:
// pale smooth-quartz facade with white concrete piers, a polished andesite
// plinth, a ground-floor shopfront with a central entrance, a flat roof with
// parapet and a rooftop water tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883609";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 10;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const g0 = Math.min(...cells.map((c) => c[2]));

// Absolute storey levels (shared by every cell so the roof is level)
const PLINTH = g0 + 1;     // ground floor starts here
const FLOOR1 = g0 + 6;     // second floor slab / spandrel
const ROOF = g0 + 11;      // roof slab
const TOP = g0 + 12;       // parapet course
const TANK_TOP = g0 + 13;  // rooftop tank

const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const facadeOf = (x, z) => dirs.filter(([dx, dz]) => !has(x + dx, z + dz));

for (const [x, z, G] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= G; y++) g.set(x, y, z, "stone_bricks");

  const outs = facadeOf(x, z);
  const perimeter = outs.length > 0;

  for (let y = G + 1; y <= TOP; y++) {
    // Floor and roof slabs across the whole footprint
    if (y === PLINTH && !perimeter) { g.set(x, y, z, "smooth_stone"); continue; }
    if (y === FLOOR1 && !perimeter) { g.set(x, y, z, "smooth_stone"); continue; }
    if (y === ROOF) { g.set(x, y, z, "smooth_stone"); continue; }
    if (!perimeter) continue; // interior stays air behind the glass

    if (y === TOP) { g.set(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y === PLINTH) { g.set(x, y, z, "polished_andesite"); continue; }
    if (y === g0 + 5 || y === FLOOR1 || y === g0 + 10) { g.set(x, y, z, "smooth_quartz"); continue; }

    // Window rows: g0+2..g0+4 (shopfront) and g0+7..g0+9 (upper floor)
    const [ox, oz] = outs[0];
    const f = ox !== 0 ? z : x;
    const end = f === 0 || f === (ox !== 0 ? 9 : 11);
    const pier = outs.length > 1 || end || f % 3 === 0;
    if (pier) { g.set(x, y, z, "white_concrete"); continue; }
    g.set(x, y, z, "light_blue_stained_glass");
  }

  // Warm light behind some windows (interior cell just inside the glass)
  if (perimeter) {
    const [ox, oz] = outs[0];
    const f = ox !== 0 ? z : x;
    for (const y of [g0 + 3, g0 + 8]) {
      if (y <= G) continue;
      const ix = x - ox, iz = z - oz;
      if (!has(ix, iz)) continue;
      const isPier = outs.length > 1 || f === 0 || f === (ox !== 0 ? 9 : 11) || f % 3 === 0;
      if (isPier) continue;
      if ((f + y) % 2 === 0) g.set(ix, y, iz, "glowstone");
    }
  }
}

// Central entrance on the north (z = 0) face, at x = 5
g.set(5, g0 + 2, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(5, g0 + 3, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(5, g0 + 4, 0, "light_blue_stained_glass");
g.set(5, g0 + 2, 1, "glowstone"); // warm light inside the lobby

// Rooftop water tank and plant box on the roof (interior cells only)
for (let x = 4; x <= 6; x++) {
  for (let z = 3; z <= 5; z++) {
    if (!has(x, z)) continue;
    g.set(x, TOP, z, "light_gray_concrete");
    g.set(x, TANK_TOP, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
