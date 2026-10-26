import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87181.cells.json`, "utf8"));

// Church of the Epiphany, G St NW: Gothic Revival, stone nave with a gabled slate roof
// and a square corner tower on the street (north) front.
const W = 12, H = 25, D = 21;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const fp = new Map();
let base = Infinity;
for (const c of cells) {
  const [x, z, gr, rf] = c;
  const ground = Math.round(gr);
  fp.set(key(x, z), { gr: ground, rf });
  base = Math.min(base, ground);
}
if (!isFinite(base)) base = 0;
const inFp = (x, z) => fp.has(key(x, z));
const gAt = (x, z) => fp.get(key(x, z)).gr;

const WT = base + 7;      // nave wall top (cornice course)
const RIDGE = base + 13;  // lidar roof height (~13 above lowest ground)
const TT = base + 17;     // tower wall top

function put(x, y, z, b, p) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
}
const stairs = (facing, half) => ({ facing, half, shape: "straight", waterlogged: "false" });
const pane = (ns) => ns
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Pilasters: vertical chiseled-stone bands dividing the bays of the nave walls.
function isPilaster(x, z) {
  if ((x === 0 || x === W - 1) && [4, 8, 12, 16].includes(z)) return true;
  if (z === D - 1 && x === 5) return true;
  return false;
}

// One glass column in a 3-cell-wide bay: glass band with pointed stair cap.
function windowAt(x, z, outward, nsPane, lit, gr) {
  if (gr + 5 >= WT) return;
  for (let y = gr + 2; y <= gr + 4; y++) put(x, y, z, "glass_pane", pane(nsPane));
  if (lit) put(x, gr + 3, z, "glowstone");
  put(x, gr + 5, z, "stone_brick_stairs", stairs(outward, "top"));
}

// 1. Foundations, walls, ceilings, roof for every footprint cell
for (const [k, { gr }] of fp) {
  const [x, z] = k.split(",").map(Number);
  const exterior = !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
  const gableEnd = exterior && (z === 0 || z === D - 1);

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (exterior) {
    const wallMat = (!gableEnd && isPilaster(x, z)) ? "chiseled_stone_bricks" : "stone_bricks";
    put(x, gr, z, "smooth_sandstone");                 // base course
    for (let y = gr + 1; y < WT; y++) put(x, y, z, wallMat);
    put(x, WT, z, "smooth_sandstone");                 // cornice
  } else {
    put(x, WT, z, "stone_bricks");                     // nave ceiling slab
  }

  // roof: gable running along z, eave at WT+1, ridge at RIDGE
  const d = Math.min(x, W - 1 - x);
  const surf = WT + 1 + d;
  const fill = gableEnd ? "stone_bricks" : "deepslate_tiles";
  if (d === 5) {
    for (let y = WT + 1; y <= surf; y++) put(x, y, z, fill);
  } else {
    for (let y = WT + 1; y < surf; y++) put(x, y, z, fill);
    const facing = x <= 5 ? "west" : "east";
    put(x, surf, z, gableEnd ? "stone_brick_stairs" : "deepslate_tile_stairs", stairs(facing, "bottom"));
  }
}

// 2. Nave windows: 3-cell bays between pilasters
for (const [k, { gr }] of fp) {
  const [x, z] = k.split(",").map(Number);
  const exterior = !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
  if (!exterior) continue;
  // side walls: bay centres at z = 2, 6, 10, 14, 18
  if ((x === 0 || x === W - 1) && [2, 6, 10, 14, 18].some(c => Math.abs(z - c) <= 1)) {
    const c = [2, 6, 10, 14, 18].find(c => Math.abs(z - c) <= 1);
    const lit = (c / 4) % 2 === 0 || c === 10;
    windowAt(x, z, x === 0 ? "west" : "east", false, lit && z === c, gr);
  }
  // back wall: bay centres at x = 2 and 9
  if (z === D - 1 && [2, 9].some(c => Math.abs(x - c) <= 1)) {
    const c = [2, 9].find(c => Math.abs(x - c) <= 1);
    windowAt(x, z, "south", true, c === 9 && x === c, gr);
  }
  // front wall (outside tower): bay centres at x = 2 and 9
  if (z === 0 && [2, 9].some(c => Math.abs(x - c) <= 1)) {
    const c = [2, 9].find(c => Math.abs(x - c) <= 1);
    windowAt(x, z, "north", true, c === 2 && x === c, gr);
  }
}

// 3. Tower on the street front (cells x 4..7, z 0..3)
const towerOk = [4, 5, 6, 7].every(x => [0, 1, 2, 3].every(z => inFp(x, z)));
if (towerOk) {
  for (let x = 4; x <= 7; x++) {
    for (let z = 0; z <= 3; z++) {
      const gr = gAt(x, z);
      const shell = x === 4 || x === 7 || z === 0 || z === 3;
      if (shell) {
        put(x, gr, z, "smooth_sandstone");
        for (let y = gr + 1; y <= TT; y++) put(x, y, z, "stone_bricks");
      } else {
        for (let y = gr; y < TT; y++) put(x, y, z, "air");
        put(x, TT, z, "stone_bricks");                 // belfry ceiling
      }
    }
  }
  // Tower string course and belfry louvres
  for (let x = 4; x <= 7; x++) put(x, TT - 4, 0, "smooth_sandstone");
  for (const z of [1, 2]) {
    for (const x of [4, 7]) {
      const gr = gAt(x, z);
      for (let y = TT - 3; y <= TT - 1; y++) put(x, y, z, "iron_bars");
      windowAt(x, z, x === 4 ? "west" : "east", false, z === 1, gr);
    }
  }
  for (const x of [4, 7]) for (let y = TT - 3; y <= TT - 1; y++) put(x, y, 0, "iron_bars");

  // Entrance: double-height doorway in the street front, with a stone canopy
  const gDoor = gAt(5, 0);
  put(5, gDoor, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(5, gDoor + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(6, gDoor, 0, "smooth_sandstone");
  put(6, gDoor + 1, 0, "smooth_sandstone");
  put(4, gDoor + 2, 0, "smooth_sandstone");
  put(5, gDoor + 2, 0, "smooth_sandstone");
  put(6, gDoor + 2, 0, "smooth_sandstone");
  put(7, gDoor + 2, 0, "smooth_sandstone");
  put(4, gDoor + 1, 0, "lantern", { hanging: "false", waterlogged: "false" });
  put(7, gDoor + 1, 0, "lantern", { hanging: "false", waterlogged: "false" });

  // Pyramidal spire
  for (let x = 4; x <= 7; x++) {
    for (let z = 0; z <= 3; z++) {
      const ring = x === 4 || x === 7 || z === 0 || z === 3;
      if (ring) {
        const facing = x === 4 ? "west" : x === 7 ? "east" : z === 0 ? "north" : "south";
        put(x, TT + 1, z, "stone_brick_stairs", stairs(facing, "bottom"));
      } else {
        put(x, TT + 1, z, "stone_bricks");
      }
    }
  }
  for (let x = 5; x <= 6; x++) for (let z = 1; z <= 2; z++) put(x, TT + 2, z, "stone_bricks");
  put(5, TT + 3, 1, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/DC87181.nbt`);
