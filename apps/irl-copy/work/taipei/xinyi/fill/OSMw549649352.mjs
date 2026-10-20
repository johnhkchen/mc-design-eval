import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: lidar roof ~11 blocks above lowest ground, 24 x 16 footprint.
// Read as a two-storey Xinyi-era commercial block: white tiled concrete
// frame, dark tinted glazing, a stone base course, shopfront at grade,
// a stone cornice and parapet, and rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw549649352";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => map.has(key(x, z));

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Centre of footprint, used for the entrance and roof plant.
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;

// Entrance: the south-facing perimeter cell nearest the centre line.
const southCells = cells.filter(([x, z]) => !has(x, z + 1));
let entKey = null;
if (southCells.length) {
  let best = Infinity;
  for (const [x, z] of southCells) {
    const d = Math.abs(x - cx);
    if (d < best) { best = d; entKey = key(x, z); }
  }
}

const facingOf = (dx, dz) => (dz === 1 ? "south" : dz === -1 ? "north" : dx === 1 ? "east" : "west");
const paneX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const nZmin = !has(x, z - 1), nZmax = !has(x, z + 1);
  const nXmin = !has(x - 1, z), nXmax = !has(x + 1, z);
  const faceZ = nZmin || nZmax;
  const faceX = nXmin || nXmax;
  const perimeter = faceZ || faceX;
  const corner = faceZ && faceX;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground, second floor, roof.
  put(x, gr, z, "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");
  put(x, gr + 10, z, perimeter ? "stone_bricks" : "smooth_stone");

  if (!perimeter) {
    // Interior: air gaps per storey, lanterns standing on the floor slabs.
    if ((x + z) % 5 === 0) put(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    if ((x + z) % 7 === 3) put(x, gr + 6, z, "lantern", { hanging: "false", waterlogged: "false" });
    // Rooftop plant on the central roof area.
    if (Math.abs(x - cx) <= 2.5 && Math.abs(z - cz) <= 1.5 && (x + z) % 2 === 0) {
      put(x, gr + 11, z, "iron_block");
    }
    continue;
  }

  if (corner) {
    // Corner piers run full height.
    for (let y = gr + 1; y <= gr + 9; y++) put(x, y, z, "white_concrete");
    put(x, gr + 1, z, "polished_andesite");
    put(x, gr + 10, z, "stone_bricks");
    put(x, gr + 11, z, "white_concrete");
    continue;
  }

  // Single-face perimeter cell.
  const outDx = faceX ? (nXmax ? 1 : -1) : 0;
  const outDz = faceZ ? (nZmax ? 1 : -1) : 0;
  const idx = faceZ ? x : z;
  const pier = idx % 3 === 0;
  const isWindowBay = !pier;
  const isEnt = key(x, z) === entKey;
  const pane = faceZ ? paneX : paneZ;
  const dirFacing = facingOf(outDx, outDz);

  // Base course.
  put(x, gr + 1, z, "polished_andesite");

  // Ground floor: shopfront glass with white piers, entrance door.
  if (isEnt) {
    put(x, gr + 1, z, "dark_oak_door", { facing: dirFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: dirFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "gray_stained_glass_pane", pane);
  } else {
    put(x, gr + 2, z, isWindowBay ? "gray_stained_glass_pane" : "white_concrete", isWindowBay ? pane : undefined);
    put(x, gr + 3, z, isWindowBay ? "gray_stained_glass_pane" : "white_concrete", isWindowBay ? pane : undefined);
  }

  // Fascia, string course.
  put(x, gr + 4, z, "white_concrete");
  put(x, gr + 5, z, "smooth_stone");

  // Upper floor: window bays with dark glazing and occasional warm light behind.
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (isWindowBay) put(x, y, z, "gray_stained_glass_pane", pane);
    else put(x, y, z, "white_concrete");
  }
  if (isWindowBay && idx % 2 === 0 && (outDx || outDz)) {
    const ix = x - outDx, iz = z - outDz;
    if (has(ix, iz)) put(ix, gr + 6, iz, "glowstone");
  }

  // Lintel, cornice, parapet.
  put(x, gr + 9, z, "white_concrete");
  put(x, gr + 10, z, "stone_bricks");
  put(x, gr + 11, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
