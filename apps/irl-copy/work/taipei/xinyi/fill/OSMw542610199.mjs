import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Lowest-ground-relative record: roof ~11 blocks above lowest ground.
// Read as a two-storey Xinyi-era commercial block: white concrete and
// tile-grey bands, stone plinth, shopfront at street level, glazed upper
// storey, cornice and parapet, rooftop plant.
const W = 20, H = 23, D = 25;
const ROOF_Y = 11;   // roof slab / parapet top level
const FLOOR_Y = 5;   // storey line between ground and upper floor
const CORNICE_Y = 10;

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542610199.cells.json", "utf8")
);

const g = new Voxels([W, H, D]);
const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, p) => {
  if (!inB(x, y, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const S = new Set();
const G = new Map();
for (const [x, z, gr] of cells) {
  S.add(x + "," + z);
  G.set(x + "," + z, gr);
}
const has = (x, z) => S.has(x + "," + z);

// Outward faces of a footprint cell
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  return f;
}

// Pass 1: foundations, floors, walls, interior floors, roof.
for (const [x, z] of cells) {
  const k = x + "," + z;
  const gr = G.get(k);
  const f = faces(x, z);
  const isWall = f.length > 0;
  const corner = f.length >= 2;
  const along = f.includes("n") || f.includes("s") ? x : z;

  // Foundation up to this cell's ground, then floor slab at ground level
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, isWall ? "stone_bricks" : "smooth_stone");

  // Interior storey line at FLOOR_Y
  if (!isWall && FLOOR_Y > gr) put(x, FLOOR_Y, z, "light_gray_concrete");

  if (isWall) {
    const pier = corner || along % 3 === 0;
    for (let y = gr + 1; y <= CORNICE_Y; y++) {
      let id;
      if (y === FLOOR_Y) id = "light_gray_concrete";           // storey line
      else if (y === CORNICE_Y) id = "light_gray_concrete";    // cornice
      else if (y < FLOOR_Y) id = pier ? "white_concrete" : "glass_pane"; // shopfront
      else id = pier ? "white_concrete" : "glass_pane";        // upper glazing
      put(x, y, z, id);
    }
    // Parapet
    put(x, ROOF_Y, z, "white_concrete");
  } else {
    put(x, ROOF_Y, z, "light_gray_concrete");
  }
}

// Pass 2: entrance on the north (min z) front, centred on its width.
const front = cells.filter(([x, z]) => !has(x, z - 1));
if (front.length) {
  const xs = front.map(([x]) => x).sort((a, b) => a - b);
  const dx = xs[Math.floor(xs.length / 2)];
  const dz = front.find(([x]) => x === dx)[1];
  const gr = G.get(dx + "," + dz);
  const dy = gr + 1;
  // Door frame and lintel with a warm lamp
  put(dx, dy, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dy + 1, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx - 1, dy, dz, "stone_bricks");
  put(dx + 1, dy, dz, "stone_bricks");
  put(dx - 1, dy + 1, dz, "stone_bricks");
  put(dx + 1, dy + 1, dz, "stone_bricks");
  put(dx, dy + 2, dz, "glowstone");
  put(dx - 1, dy + 2, dz, "stone_bricks");
  put(dx + 1, dy + 2, dz, "stone_bricks");
  // Interior light behind the entrance glass
  if (dz + 1 < D && has(dx, dz + 1)) put(dx, dy + 1, dz + 1, "shroomlight");
}

// Pass 3: warm lights behind some upper-floor windows (air gap, inside).
for (const [x, z] of cells) {
  if (faces(x, z).length > 0) continue;
  if (faces(x, z - 1).includes("n") && x % 3 === 1) {
    put(x, 8, z, "shroomlight");
  }
  if (faces(x, z + 1).includes("s") && x % 3 === 2) {
    put(x, 7, z, "shroomlight");
  }
}

// Pass 4: rooftop plant, stair housing and a mast, all on the roof slab.
const plant = [];
for (let x = 4; x <= 7; x++) for (let z = 4; z <= 7; z++) plant.push([x, z]);
for (let x = 11; x <= 13; x++) for (let z = 15; z <= 17; z++) plant.push([x, z]);
for (const [x, z] of plant) {
  if (!has(x, z) || faces(x, z).length > 0) continue;
  put(x, ROOF_Y + 1, z, "light_gray_concrete");
  put(x, ROOF_Y + 2, z, "light_gray_concrete");
}
// Stair housing
for (let y = ROOF_Y + 1; y <= ROOF_Y + 4; y++) {
  if (has(9, 10) && faces(9, 10).length === 0) put(9, y, 10, "white_concrete");
  if (has(10, 10) && faces(10, 10).length === 0) put(10, y, 10, "white_concrete");
}
// Mast on the centre of the roof
const mx = 10, mz = 12;
if (has(mx, mz) && faces(mx, mz).length === 0) {
  for (let y = ROOF_Y + 1; y <= ROOF_Y + 6; y++) put(mx, y, mz, "iron_bars");
  put(mx, ROOF_Y + 7, mz, "lightning_rod");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542610199.nbt");
