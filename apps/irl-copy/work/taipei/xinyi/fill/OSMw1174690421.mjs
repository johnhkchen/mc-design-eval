import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 11 x 18 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, flat-roofed Xinyi-era commercial block: white concrete
// frame, stone-brick plinth and parapet, shopfront with glazing on the street face.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690421";
const W = 11, H = 23, D = 18;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint cells, with ground normalised so the lowest cell is y 0.
const cellsIn = raw.filter(([x, z]) => x >= 0 && x < W && z >= 0 && z < D);
const lowG = Math.min(...cellsIn.map(c => c[2]));
const ground = new Map();
for (const [x, z, gr] of cellsIn) ground.set(`${x},${z}`, gr - lowG);
const inside = (x, z) => ground.has(`${x},${z}`);
const maxRel = Math.max(...ground.values());

// B = first storey level (plinth top sits at B-1, uniform across the footprint).
const B = maxRel + 1;

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!inside(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior faces of a cell: dir is N(-z), S(+z), W(-x), E(+x).
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
function exteriorFaces(x, z) {
  const out = [];
  for (const [dir, [dx, dz]] of Object.entries(DIRS)) {
    if (!inside(x + dx, z + dz)) {
      const ns = dir === "N" || dir === "S";
      out.push({ dir, i: ns ? x : z, n: ns ? W : D });
    }
  }
  return out;
}

const pane = (dir) => {
  const ns = dir === "N" || dir === "S"; // N/S faces run along x, so connect east-west
  return {
    north: ns ? "false" : "true",
    south: ns ? "false" : "true",
    east: ns ? "true" : "false",
    west: ns ? "true" : "false",
    waterlogged: "false",
  };
};

// 1. Foundations and plinth: solid from y 0 up to B-1 under every cell.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < B; y++) {
    put(x, y, z, y <= gr ? "stone" : "stone_bricks");
  }
}

// 2. Floor slabs: second-storey floor at B+5, roof slab at B+10, full footprint.
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  put(x, B + 5, z, "smooth_stone");
  put(x, B + 10, z, "smooth_stone");
}

// 3. Perimeter walls, windows, shopfront, storey lines.
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const faces = exteriorFaces(x, z);
  if (faces.length === 0) continue;

  const front = faces.find(f => f.dir === "W"); // street-facing long side
  const main = front || faces[0];

  // Base course.
  put(x, B, z, "stone_bricks");

  // Storey 1: shopfront on the front, framed windows elsewhere.
  if (front) {
    const i = front.i, n = front.n;
    const ends = i === 0 || i === n - 1;
    for (let y = B + 1; y <= B + 4; y++) {
      if (ends) {
        put(x, y, z, "white_concrete");
      } else if (i === 9 && (y === B + 1 || y === B + 2)) {
        // Door is placed explicitly below; keep the opening clear here.
        put(x, y, z, "air");
      } else if (y === B + 4) {
        put(x, y, z, "light_gray_concrete"); // canopy / fascia band
      } else if (i % 4 === 0) {
        put(x, y, z, "white_concrete"); // pilaster
      } else {
        put(x, y, z, "glass");
      }
    }
  } else {
    const win = main.i % 3 === 1 && main.i > 0 && main.i < main.n - 1;
    for (let y = B + 1; y <= B + 4; y++) {
      if (win && (y === B + 2 || y === B + 3)) put(x, y, z, "glass_pane", pane(main.dir));
      else if (win && y === B + 1) put(x, y, z, "light_gray_concrete");
      else if (win && y === B + 4) put(x, y, z, "white_concrete");
      else put(x, y, z, "white_concrete");
    }
  }

  // Storey 2 windows and storey lines.
  const win2 = main.i % 3 === 1 && main.i > 0 && main.i < main.n - 1;
  for (let y = B + 6; y <= B + 9; y++) {
    if (win2 && (y === B + 7 || y === B + 8)) put(x, y, z, "glass_pane", pane(main.dir));
    else if (win2 && y === B + 6) put(x, y, z, "light_gray_concrete"); // sill
    else if (win2 && y === B + 9) put(x, y, z, "white_concrete");      // lintel
    else put(x, y, z, "white_concrete");
  }

  // Parapet on the perimeter, one course above the roof slab.
  put(x, B + 11, z, "stone_bricks");
}

// 4. Entrance door on the street face with a light band above.
{
  const dx = 0, dz = 9;
  put(dx, B + 1, dz, "oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, B + 2, dz, "oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// 5. Warm light behind the glass (shroomlights in the interior air cells next to the front).
for (let z = 0; z < D; z++) {
  if (z % 4 === 2 && inside(1, z)) {
    put(1, B + 2, z, "shroomlight");
    put(1, B + 7, z, "shroomlight");
  }
}

// 6. Roof equipment: a plant box and a lightning rod.
for (let x = 4; x <= 6; x++) {
  for (let z = 6; z <= 10; z++) {
    put(x, B + 11, z, "light_gray_concrete");
    put(x, B + 12, z, "light_gray_concrete");
  }
}
put(5, B + 13, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
