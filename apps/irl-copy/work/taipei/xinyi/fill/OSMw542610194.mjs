import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${SRC}/OSMw542610194.cells.json`, "utf8"));

// Two-storey post-war Taipei commercial block: white tiled facade, granite base,
// shopfront at street level, punched window band above, flat roof with parapet cornice.
const W = 12, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  minG = Math.min(minG, gr);
}
const has = (x, z) => ground.has(key(x, z));

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

const exteriorFaces = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([name]) => name);

const isPerimeter = (x, z) => exteriorFaces(x, z).length > 0;

// Front = the exterior face with the most exposed cells (the street frontage).
const faceCount = { north: 0, south: 0, west: 0, east: 0 };
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  for (const f of exteriorFaces(x, z)) faceCount[f]++;
}
const front = Object.entries(faceCount).sort((a, b) => b[1] - a[1])[0][0];

// Door sits at the middle of the front face.
const frontCells = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (exteriorFaces(x, z).includes(front)) frontCells.push([x, z]);
}
frontCells.sort((a, b) =>
  (front === "north" || front === "south") ? a[0] - b[0] : a[1] - b[1]
);
const doorCell = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;

// Roof line: about 11 blocks above the lowest ground.
const roofTarget = minG + 11;

// Rooftop equipment sits on the interior cell nearest the centroid.
let cx = 0, cz = 0;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  cx += x; cz += z;
}
cx /= ground.size; cz /= ground.size;
let plantCell = null, bestD = Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (isPerimeter(x, z)) continue;
  const d = (x - cx) ** 2 + (z - cz) ** 2;
  if (d < bestD) { bestD = d; plantCell = [x, z]; }
}

for (const [x, z, b] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "gray_concrete");

  const perim = isPerimeter(x, z);
  // Floor slabs at b, b+5, roof deck at b+10; top of this column at the parapet.
  const top = Math.min(H - 1, Math.max(roofTarget, b + 11));

  if (!perim) {
    // Interior: floor slabs, roof deck, air between (no interiors).
    put(x, b, z, "smooth_stone");
    put(x, b + 5, z, "smooth_stone");
    put(x, b + 10, z, "light_gray_concrete");

    // Warm lights just inside the upper-storey window band, next to the facade.
    const nearFacade = exteriorFaces(x - 1, z).length || exteriorFaces(x + 1, z).length ||
      exteriorFaces(x, z - 1).length || exteriorFaces(x, z + 1).length;
    if (nearFacade && (x * 7 + z * 3) % 5 === 0) put(x, b + 7, z, "glowstone");

    if (plantCell && x === plantCell[0] && z === plantCell[1]) {
      put(x, b + 11, z, "stone_bricks");
      put(x, b + 12, z, "stone_bricks");
      put(x, b + 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  // Perimeter column: granite base course, pillars and shopfront glass, floor
  // lines, a window band on the upper storey, cornice and parapet.
  put(x, b, z, "polished_granite");
  for (let y = b + 1; y <= top; y++) {
    let id = "white_concrete";

    if (y <= b + 4) {
      // Ground storey: shopfront.
      if (y === b + 4) id = "light_gray_concrete";           // fascia band
      else if ((x + z) % 4 === 0) id = "light_gray_concrete"; // pillars
      else id = "glass";
    } else if (y === b + 5) {
      id = "smooth_stone";                                   // floor line
    } else if (y >= b + 6 && y <= b + 8) {
      // Upper storey window band.
      id = (x + z) % 3 === 0 ? "light_gray_concrete" : "glass";
    } else if (y === b + 10) {
      id = "smooth_stone";                                   // cornice
    } else if (y === top) {
      id = "smooth_stone";                                   // parapet cap
    }
    put(x, y, z, id);
  }

  // Entrance: double-height door block at the middle of the street frontage.
  if (doorCell && x === doorCell[0] && z === doorCell[1]) {
    const facing = front;
    put(x, b + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, b + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

g.save(`${SRC}/OSMw542610194.nbt`);
