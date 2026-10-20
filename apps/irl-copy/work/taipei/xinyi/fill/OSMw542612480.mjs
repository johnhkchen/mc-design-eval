import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612480";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 35;
const g = new Voxels([W, H, D]);

// Record: roof ~11 blocks above lowest ground. Reads as a 1990s-2000s
// Taipei office/retail block: 2 storeys of 5 blocks, white-tiled concrete,
// tinted glass, granite base, parapet and cornice.
const FLOOR = 5;     // storey line between the two floors
const LINTEL = 10;   // head band above upper windows
const ROOF = 11;     // roof deck level
const CAP = 13;      // parapet cap (bottom slab)

const key = (x, z) => `${x},${z}`;
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(key(x, z), gr);
const has = (x, z) => gmap.has(key(x, z));

const isPerim = (x, z) =>
  has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));
const isRing = (x, z) =>
  has(x, z) && !isPerim(x, z) &&
  (isPerim(x - 1, z) || isPerim(x + 1, z) || isPerim(x, z - 1) || isPerim(x, z + 1));
const isCore = (x, z) => has(x, z) && !isPerim(x, z) && !isRing(x, z);

function put(x, y, z, id, props) {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Entrance: on the z-minimum face, the non-corner cell nearest x = 5.5.
let doorX = null;
{
  let best = Infinity;
  for (const [x, z] of gmap.keys().map((k) => k.split(",").map(Number))) {
    if (!has(x, z - 1) && has(x - 1, z) && has(x + 1, z)) {
      const d = Math.abs(x - 5.5);
      if (d < best) { best = d; doorX = x; }
    }
  }
}
const doorZ = (() => {
  let zmin = Infinity;
  for (const k of gmap.keys()) zmin = Math.min(zmin, Number(k.split(",")[1]));
  return zmin;
})();

function buildCell(x, z, gr) {
  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (isCore(x, z)) {
    for (let y = gr; y < ROOF; y++) put(x, y, z, "light_gray_concrete");
    put(x, ROOF, z, "light_gray_concrete");
    return;
  }

  if (isRing(x, z)) {
    // Air gap behind the glass, with floor slab and roof slab.
    put(x, FLOOR, z, "light_gray_concrete");
    put(x, ROOF, z, "light_gray_concrete");
    return;
  }

  // Perimeter cell.
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const corner = xFace && zFace;
  const u = xFace ? z : x;
  const inDx = xFace ? (!has(x - 1, z) ? 1 : -1) : 0;
  const inDz = zFace && !xFace ? (!has(x, z - 1) ? 1 : -1) : 0;
  const isDoor = doorX !== null && x === doorX && z === doorZ && !corner;
  const bayGlass = !corner && u % 3 !== 0;
  const glassProps = xFace
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  const doorProps = (half) => ({
    facing: "north", half, hinge: "left", open: "false", powered: "false",
  });

  for (let y = gr; y <= CAP; y++) {
    if (y === gr) { put(x, y, z, "polished_granite"); continue; }
    if (y === CAP) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (y >= ROOF) { put(x, y, z, "white_concrete"); continue; }
    if (isDoor) {
      if (y === gr + 1) { put(x, y, z, "iron_door", doorProps("lower")); continue; }
      if (y === gr + 2) { put(x, y, z, "iron_door", doorProps("upper")); continue; }
      if (y === gr + 3) { put(x, y, z, "light_gray_concrete"); continue; }
    }
    if (y === FLOOR || y === LINTEL) { put(x, y, z, "light_gray_concrete"); continue; }
    const groundFloor = y > gr && y < FLOOR;
    const upperFloor = y > FLOOR && y < LINTEL;
    if (bayGlass && (groundFloor || upperFloor) && !isDoor) {
      put(x, y, z, "light_blue_stained_glass_pane", glassProps);
      // Warm light behind selected upper-floor windows.
      if (upperFloor && y === FLOOR + 1 && u % 6 === 1) {
        const ix = x + inDx, iz = z + inDz;
        if (isRing(ix, iz)) put(ix, y, iz, "glowstone");
      }
      continue;
    }
    put(x, y, z, "white_concrete");
  }
}

for (const [x, z, gr] of cells) buildCell(x, z, gr);

// Rooftop plant: AC boxes on core cells, and a lightning rod mast.
for (const [x, z, gr] of cells) {
  if (!isCore(x, z)) continue;
  if ((x === 3 || x === 8) && z % 8 === 3) {
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}
{
  let mid = null;
  for (const [x, z] of gmap.keys().map((k) => k.split(",").map(Number))) {
    if (isCore(x, z) && (x === 5 || x === 6) && z === 17) mid = [x, z];
  }
  if (mid) for (let y = ROOF + 1; y <= ROOF + 3; y++) {
    put(mid[0], y, mid[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
