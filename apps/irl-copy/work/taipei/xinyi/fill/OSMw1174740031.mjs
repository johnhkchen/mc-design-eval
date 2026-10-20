import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174740031";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 32 x 23, roof about 11 blocks above lowest ground: two storeys of ~5 blocks,
// a 1990s-2000s commercial block in white tile and grey concrete with a shopfront base,
// a light-blue glass band per storey, and a parapet with roof plant.
const W = 32, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const minG = Math.min(...ground.values());
const R = minG + 10;            // roof deck layer
const TOP = R + 1;              // parapet layer (minG + 11)

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isPerim = (x, z) =>
  !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// Front = south face (largest z). Entrance sits at the south-face cell nearest the middle.
const southCells = cells.filter(([x, z]) => !has(x, z + 1));
let entX = -1;
if (southCells.length) {
  const xs = southCells.map(c => c[0]);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  entX = southCells.reduce((best, c) =>
    Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best)[0];
}

const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const perim = isPerim(x, z);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-floor base / floor slab
  put(x, gr, z, perim ? "polished_andesite" : "smooth_stone");

  // Storey slabs (interior floors and perimeter string courses)
  for (const f of [5, 10]) {
    const yy = gr + f;
    if (yy < R) put(x, yy, z, perim ? "light_gray_concrete" : "smooth_stone");
  }

  // Roof deck for every cell
  put(x, R, z, "light_gray_concrete");

  // Parapet on the perimeter
  if (perim) put(x, TOP, z, "white_concrete");

  if (!perim) continue;

  // Outward faces of this cell
  const faces = [];
  if (!has(x, z - 1)) faces.push({ n: "north", dx: 0, dz: -1, idx: x, axisX: true });
  if (!has(x, z + 1)) faces.push({ n: "south", dx: 0, dz: 1, idx: x, axisX: true });
  if (!has(x - 1, z)) faces.push({ n: "west", dx: -1, dz: 0, idx: z, axisX: false });
  if (!has(x + 1, z)) faces.push({ n: "east", dx: 1, dz: 0, idx: z, axisX: false });
  const face = faces.find(f => f.n === "south") ?? faces[0];

  const isEntrance = face.n === "south" && x === entX;

  // Walls, shopfront and windows
  for (let rel = 1; gr + rel < R; rel++) {
    const y = gr + rel;
    const m = rel % 5;
    if (m === 0) continue;               // storey line already placed
    if (m === 4) { put(x, y, z, "white_concrete"); continue; }   // lintel row

    // window rows 1..3 of each storey
    if (face.idx % 3 === 0) {
      put(x, y, z, "gray_concrete");     // mullion / pier
    } else if (isEntrance && rel <= 2) {
      put(x, y, z, "dark_oak_door", {
        facing: "north", half: rel === 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      });
    } else if (isEntrance && rel === 3) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", face.axisX ? paneNS : paneEW);
    }

    // warm light behind some upper-storey glass, in the interior air gap
    if (m === 2 && face.idx % 6 === 2 && y >= gr + 5) {
      const ix = x - face.dx, iz = z - face.dz;
      if (has(ix, iz) && !isPerim(ix, iz)) put(ix, y, iz, "shroomlight");
    }
  }
}

// Roof plant: a small mechanical box on interior roof cells
let plantCells = [];
for (const [x, z, gr] of cells) {
  if (isPerim(x, z)) continue;
  if (x >= 10 && x <= 14 && z >= 8 && z <= 13) plantCells.push([x, z]);
}
for (const [x, z] of plantCells) {
  put(x, R + 1, z, "gray_concrete");
  put(x, R + 2, z, "light_gray_concrete");
}

// Lightning rod on an interior roof cell away from the plant
for (const [x, z] of cells) {
  if (isPerim(x, z) || plantCells.some(([px, pz]) => px === x && pz === z)) continue;
  if (x <= 8) {
    put(x, R + 1, z, "lightning_rod", { facing: "up", powered: "false" });
    break;
  }
}

g.save(`${DIR}/${ID}.nbt`);
