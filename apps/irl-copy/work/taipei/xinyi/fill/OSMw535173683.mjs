import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535173683";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: roof ~11 blocks above lowest ground, 2 storeys of ~5 blocks + parapet.
// 1990s Xinyi-style mid-rise: pale tiled concrete, tinted glass shopfront,
// ribbon windows with light concrete pillars, quartz parapet and cornice.
const ROOF_Y = 11;
const SHOP_TOP = 4;     // ground storey band y = ground..4
const FLOOR1 = 5;       // storey line
const FLOOR2 = 10;      // second floor slab / parapet course

const g = new Voxels([20, 23, 16]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.round(gr));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const north = !has(x, z - 1);
  const south = !has(x, z + 1);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const perim = north || south || west || east;
  const corner = (north || south) && (west || east);
  const i = x + z;
  const pillar = corner || i % 3 === 0;

  // Floor slabs at storey lines, all footprint cells (interior air sits between).
  for (const fy of [FLOOR1, FLOOR2]) {
    if (fy >= ground) g.set(x, fy, z, fy === FLOOR1 ? "light_gray_concrete" : "smooth_quartz");
  }

  // Roof slab over every cell.
  if (ROOF_Y >= ground) g.set(x, ROOF_Y, z, "light_gray_concrete");

  if (!perim) continue;

  for (let y = ground; y < ROOF_Y; y++) {
    if (y === FLOOR1) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (y === FLOOR2) { g.set(x, y, z, "smooth_quartz"); continue; }

    if (y === ROOF_Y - 1) { g.set(x, y, z, "smooth_quartz"); continue; }

    if (y <= SHOP_TOP) {
      // Ground storey: plinth, shopfront glazing, lintel.
      if (y === ground) { g.set(x, y, z, "stone_bricks"); continue; }
      if (y === SHOP_TOP) { g.set(x, y, z, "smooth_quartz"); continue; }
      if (pillar) { g.set(x, y, z, "light_gray_concrete"); continue; }
      g.set(x, y, z, "light_blue_stained_glass");
      continue;
    }

    // Upper storey: window grid with pillars and spandrels.
    if (y === 9) { g.set(x, y, z, "white_concrete"); continue; }
    if (pillar) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (y === 7 && (x * 5 + z * 3) % 13 === 0) {
      g.set(x, y, z, "glowstone");   // warm lit window
      continue;
    }
    g.set(x, y, z, "light_blue_stained_glass");
  }

  // Parapet cap / cornice on the roof edge.
  if (ROOF_Y >= ground) {
    g.set(x, ROOF_Y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Entrance on the north (street) face, two bays wide at the centre.
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.round(gr));
  if (z !== minZ) continue;
  if (x < 9 || x > 10) continue;
  if (ground > 0) continue;
  // Clear the glazing where the door sits, then place the door.
  g.set(x, 0, z, "iron_door", { facing: "south", half: "lower", hinge: x === 9 ? "left" : "right", open: "false", powered: "false" });
  g.set(x, 1, z, "iron_door", { facing: "south", half: "upper", hinge: x === 9 ? "left" : "right", open: "false", powered: "false" });
}

// Rooftop plant: a light concrete box with vents, sitting on the roof slab.
const roofCell = (x, z) => has(x, z) && Math.max(0, Math.round(gmap.get(`${x},${z}`))) <= ROOF_Y;
for (let x = 8; x <= 11; x++) {
  for (let z = 5; z <= 9; z++) {
    if (!roofCell(x, z)) continue;
    g.set(x, ROOF_Y + 1, z, "light_gray_concrete");
    if (x >= 9 && x <= 10 && z >= 6 && z <= 8) {
      g.set(x, ROOF_Y + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
