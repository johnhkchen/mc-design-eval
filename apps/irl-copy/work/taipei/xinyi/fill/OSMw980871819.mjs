import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw980871819";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 19 x 31 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey 1980s Taipei commercial block: reinforced concrete frame,
// white wall tiles with light-grey storey bands, a shopfront ground floor,
// a stone-brick parapet and a rooftop water tank.
const W = 19, H = 23, D = 31;
const ROOF_Y = 11;
const PARAPET_Y = 12;
const STOREY_Y = 5;
const CORNICE_Y = 10;

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, e] of cells) ground.set(`${x},${z}`, e);
const has = (x, z) => ground.has(`${x},${z}`);
const groundOf = (x, z) => ground.get(`${x},${z}`);

// [dx, dz, facing name]; +z is south in Minecraft.
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

const isPerimeter = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
const outwardOf = (x, z) => DIRS.find(([dx, dz]) => !has(x + dx, z + dz));

// Pick a position along the wall for window rhythm.
const alongIndex = (x, z, dx) => (dx !== 0 ? z : x);

// 1. Foundation, base course, walls, cornice and parapet on the perimeter.
for (const [x, z, e] of cells) {
  // Solid foundation from y 0 up to the cell's own ground.
  for (let y = 0; y < e; y++) g.set(x, y, z, "stone_bricks");

  if (isPerimeter(x, z)) {
    const [dx, dz] = outwardOf(x, z);
    const idx = alignIndex(x, z, dx);
    for (let y = e; y <= PARAPET_Y; y++) {
      let block;
      if (y === e) {
        block = "polished_andesite";                       // base course
      } else if (y === PARAPET_Y) {
        block = "stone_bricks";                            // parapet cap
      } else if (y === ROOF_Y) {
        block = "light_gray_concrete";                     // cornice
      } else if (y === STOREY_Y || y === CORNICE_Y) {
        block = "light_gray_concrete";                     // storey lines
      } else if (y <= STOREY_Y - 1) {
        // Ground floor: shopfront with stone piers and glass.
        block = idx % 3 === 0 ? "stone_bricks" : "glass_pane";
      } else if (y <= CORNICE_Y - 1) {
        // Upper floor: window grid.
        block = idx % 3 !== 0 ? "glass_pane" : "white_concrete";
      } else {
        block = "white_concrete";
      }
      g.set(x, y, z, block);
    }
  } else {
    // Interior: floor deck at the storey line and roof deck, air between.
    if (e <= STOREY_Y) g.set(x, STOREY_Y, z, "light_gray_concrete");
    g.set(x, ROOF_Y, z, "gray_concrete");
  }
}

// Helper used above (kept below so the main flow reads first).
function alignIndex(x, z, dx) {
  return alongIndex(x, z, dx);
}

// 2. Main entrance on the north (street-side) edge, centred along the front.
const frontCells = cells
  .filter(([x, z]) => !has(x, z - 1))
  .map(([x, z, e]) => [x, z, e])
  .sort((a, b) => a[0] - b[0]);
const front = frontCells.length
  ? frontCells[Math.floor(frontCells.length / 2)]
  : cells.find(([x, z]) => isPerimeter(x, z));

if (front) {
  const [fx, fz, fe] = front;
  const facing = "north";
  const base = fe + 1;
  if (base + 1 <= STOREY_Y - 1) {
    g.set(fx, base, fz, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(fx, base + 1, fz, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  // Small entrance canopy band over the door, on the storey line above.
  g.set(fx, STOREY_Y - 1, fz, "light_gray_concrete");
}

// 3. Warm lights behind some glass: glowstone in upper floors, shroomlights on the ground floor.
for (const [x, z, e] of cells) {
  if (!isPerimeter(x, z)) continue;
  const [dx, dz] = outwardOf(x, z);
  const idx = alongIndex(x, z, dx);
  const ix = x - dx, iz = z - dz;      // inward neighbour
  if (!has(ix, iz) || isPerimeter(ix, iz)) continue;
  const ei = groundOf(ix, iz);

  if (idx % 6 === 1) {
    g.set(ix, 8, iz, "glowstone");      // upper-floor glow behind glass
  }
  if (idx % 6 === 4 && ei + 2 <= STOREY_Y - 1) {
    g.set(ix, ei + 2, iz, "shroomlight"); // ground-floor shop light
  }
}

// 4. Rooftop water tank: a 3x3 box on the roof deck, placed nearest the centroid.
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length;
const cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
let best = null, bestD = Infinity;
for (const [x, z] of cells) {
  let ok = true;
  for (let i = -2; i <= 2 && ok; i++) {
    for (let j = -2; j <= 2 && ok; j++) {
      if (!has(x + i, z + j) || isPerimeter(x + i, z + j)) ok = false;
    }
  }
  if (!ok) continue;
  const d = (x - cx) ** 2 + (z - cz) ** 2;
  if (d < bestD) { bestD = d; best = [x, z]; }
}
if (best) {
  const [tx, tz] = best;
  for (let x = tx - 1; x <= tx + 1; x++) {
    for (let z = tz - 1; z <= tz + 1; z++) {
      for (let y = PARAPET_Y; y <= PARAPET_Y + 2; y++) {
        g.set(x, y, z, "dark_oak_planks");
      }
    }
  }
  for (let x = tx - 1; x <= tx + 1; x++) {
    for (let z = tz - 1; z <= tz + 1; z++) {
      g.set(x, PARAPET_Y + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
