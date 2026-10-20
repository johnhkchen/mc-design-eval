import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Lidar roof about 11 blocks above the lowest ground.
// Read: a two-storey (plus parapet) 1980s-90s Taipei street-front commercial block.
// Reinforced concrete frame, white ceramic-tile facade with light-grey concrete piers,
// stone-brick base, tinted glass shopfront with a single central door, quartz cornice,
// and simple rooftop plant. Storey lines sit at y 5 and y 10.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541864111";
const W = 13, D = 8, H = 23;
const ROOF = 10; // top of the cornice course; roof surface is y 11

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.round(gy));

const g = new Voxels([W, H, D]);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`) ?? 0;

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Which facade a perimeter cell belongs to, and its position along that facade.
function facade(x, z) {
  if (!has(x, z - 1)) return { face: "front", t: x, max: W - 1 };
  if (!has(x, z + 1)) return { face: "back", t: x, max: W - 1 };
  if (!has(x - 1, z)) return { face: "side", t: z, max: D - 1 };
  return { face: "side", t: z, max: D - 1 };
}

const GLASS = "light_blue_stained_glass";
const PIER = "light_gray_concrete";
const TILE = "white_terracotta";
const TRIM = "smooth_quartz";
const BASE = "stone_bricks";

// 1. Foundation, floor slabs and the shell, cell by cell.
for (const [x, z, _] of cells) {
  const gy = gnd(x, z);
  const edge = isEdge(x, z);

  // Foundation from y 0 up to the cell's own ground.
  for (let y = 0; y < gy; y++) put(x, y, z, BASE);

  if (!edge) {
    // Interior: floor slabs at ground, at the storey line and at the roof deck.
    put(x, gy, z, "smooth_stone");
    if (gy < 5) put(x, 5, z, "smooth_stone");
    put(x, ROOF, z, PIER); // roof deck
    continue;
  }

  const { face, t, max } = facade(x, z);
  const pier = t % 3 === 0 || t === max;

  // Base course.
  put(x, gy, z, BASE);

  // Ground storey (shopfront).
  for (let y = gy + 1; y <= 4; y++) {
    if (face === "front") {
      if (x === 6 && y <= gy + 2) continue; // door handled below
      if (x === 6) { put(x, y, z, PIER); continue; } // lintel over door
      put(x, y, z, pier ? PIER : GLASS);
    } else {
      put(x, y, z, pier ? PIER : TILE);
    }
  }

  // Storey line / spandrel at y 5.
  if (gy < 5) put(x, 5, z, PIER);

  // Upper storey, y 6 to 9: piers, sill and head, glass between.
  for (let y = 6; y <= 9; y++) {
    if (y < gy + 1) continue;
    if (pier) put(x, y, z, PIER);
    else if (y === 6 || y === 9) put(x, y, z, TRIM);
    else put(x, y, z, GLASS);
  }

  // Cornice course at the top of the walls.
  put(x, ROOF, z, TRIM);
}

// 2. Central entrance on the front (z = 0, x = 6).
const doorGy = gnd(6, 0);
if (has(6, 0)) {
  put(6, doorGy + 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(6, doorGy + 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// 3. Warm light behind some glass (one block inside the air gap).
const lightSpots = [
  [1, 7, 1], [4, 7, 1], [8, 7, 1], [11, 7, 1],
  [3, 2, 1], [9, 2, 1],
];
for (const [x, yRel, z] of lightSpots) {
  const gy = gnd(x, z);
  const y = yRel === 2 ? gy + 2 : yRel;
  if (has(x, z) && y > gy && y < ROOF) put(x, y, z, "glowstone");
}

// 4. Rooftop plant on the deck at y 10: two AC units, a water tank, a lightning rod.
const roofBox = (x0, x1, z0, z1, y0, y1, block, props) => {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      if (has(x, z))
        for (let y = y0; y <= y1; y++) put(x, y, z, block, props);
};
roofBox(2, 3, 2, 3, 11, 11, PIER);      // AC unit A
roofBox(7, 8, 5, 6, 11, 11, PIER);      // AC unit B
roofBox(10, 11, 1, 2, 11, 12, "smooth_stone"); // water tank housing
if (has(1, 1)) put(1, 11, 1, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
if (has(1, 1)) put(1, 12, 1, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
