import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042398769";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(([, , g]) => g));

const ground = new Map();
for (const [x, z, g] of raw) ground.set(`${x},${z}`, g - minG);

const SX = 27, SY = 23, SZ = 17;
const ROOF = 11;          // roof/parapet top, about 11 blocks above lowest ground
const g = new Voxels([SX, SY, SZ]);

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Mid-century/1990s Xinyi commercial block: white concrete wall, quartz piers and
// cornice, blue glass window bands, stone-brick base, shopfront entrance on the z=0 face.
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gr = gnd(x, z);

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  if (!isPerim(x, z)) {
    // Interior: floor slab at ground and storey line, air gap otherwise, roof slab on top.
    g.set(x, gr, z, "smooth_stone");
    if (5 > gr) g.set(x, 5, z, "smooth_stone");
    g.set(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  // Perimeter wall.
  const zEdge = !has(x, z - 1) || !has(x, z + 1);
  const xEdge = !has(x - 1, z) || !has(x + 1, z);
  const along = zEdge ? x : z;
  const isPier = (zEdge && xEdge) || along % 3 === 0;
  const front = z === 0 && !has(x, -1);

  for (let y = gr; y <= ROOF; y++) {
    let id;
    if (y === gr) id = "stone_bricks";                       // base course
    else if (y === ROOF) id = "stone_bricks";                // parapet cap
    else if (y === 10) id = "smooth_quartz";                 // cornice
    else if (y === 6) id = "quartz_block";                   // upper sill
    else if (y === 5) id = "smooth_quartz";                  // storey line
    else if (y === 4) id = "light_gray_concrete";            // spandrel band
    else if (isPier) id = "white_concrete";                  // piers
    else if ((y > gr && y <= 3) || (y >= 7 && y <= 9))
      id = "light_blue_stained_glass";                       // window bands
    else id = "white_concrete";
    g.set(x, y, z, id);
  }

  // Shopfront entrance on the street face: glass flanks, central door, quartz lintel.
  if (front && x >= 12 && x <= 14) {
    for (let y = gr + 1; y <= gr + 3; y++) {
      g.set(x, y, z, x === 13 ? "quartz_block" : "light_blue_stained_glass");
    }
    if (x === 13) {
      g.set(x, gr + 1, z, "dark_oak_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, gr + 2, z, "dark_oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
    }
  }
}

// Warm lights behind the glass: glowstone in the ground storey, shroomlight upstairs.
for (let x = 1; x <= 25; x += 6) {
  const gr = gnd(x, 1);
  if (has(x, 1) && !isPerim(x, 1) && gr + 2 < 5) g.set(x, gr + 2, 1, "glowstone");
  if (has(x, SZ - 2) && !isPerim(x, SZ - 2)) g.set(x, 8, SZ - 2, "shroomlight");
}

// Roof plant: AC boxes on the roof slab and a lightning rod.
const boxes = [[4, 7, 4, 6], [18, 21, 9, 11]];
for (const [x0, x1, z0, z1] of boxes) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    for (let y = ROOF + 1; y <= ROOF + 2; y++) g.set(x, y, z, "light_gray_concrete");
  }
}
if (has(13, 8)) {
  g.set(13, ROOF + 1, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
