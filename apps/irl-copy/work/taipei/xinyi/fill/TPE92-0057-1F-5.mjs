import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0057-1F-5";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 2003 Xinyi mid-rise: four storeys of 5 blocks, white-tiled frame with
// blue-glass bays, stone base, corner pilasters, a deeper cornice and a
// rooftop plant room.
const W = 13, H = 33, D = 23;
const ROOF = 21;

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const set = (x, y, z, b) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  g.set(x, y, z, b);
};

const DIRV = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };
const outward = (x, z) => {
  const f = [];
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  return f;
};

// Main entrance: middle of the south-facing street frontage.
const southCells = cells
  .filter(([x, z]) => outward(x, z).includes("south"))
  .sort((a, b) => a[0] - b[0]);
const entrance = southCells.length
  ? [southCells[Math.floor(southCells.length / 2)][0], southCells[Math.floor(southCells.length / 2)][1]]
  : null;
const isEntrance = (x, z) => entrance && entrance[0] === x && entrance[1] === z;

for (const [x, z, gr] of cells) {
  // Foundation up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) set(x, y, z, "stone_bricks");

  const faces = outward(x, z);
  const perim = faces.length > 0;
  const corner = faces.length >= 2;
  const f = faces[0];

  for (let y = gr; y < ROOF; y++) {
    const band = y % 5;

    if (!perim) {
      // Interior: floor slab per storey, otherwise air.
      if (band === 0) set(x, y, z, "smooth_quartz");
      continue;
    }

    // Corner pilasters run the full height.
    if (corner) { set(x, y, z, "polished_andesite"); continue; }

    // Entrance: clear glass door, three blocks high, framed by piers.
    if (isEntrance(x, z) && y < gr + 3) { set(x, y, z, "glass"); continue; }

    if (y === gr) { set(x, y, z, "polished_granite"); continue; }      // base course
    if (band === 0) { set(x, y, z, "smooth_quartz"); continue; }       // storey line
    if (band === 4) { set(x, y, z, "light_gray_concrete"); continue; } // spandrel

    const along = (f === "west" || f === "east") ? z : x;
    if (along % 3 === 0) { set(x, y, z, "white_concrete"); continue; } // mullion pier

    set(x, y, z, "light_blue_stained_glass");

    // Warm light behind a few bays only.
    const [dx, dz] = DIRV[f];
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && outward(ix, iz).length === 0 && band === 2 && ((x * 5 + z * 3 + y) % 23 === 0)) {
      set(ix, y, iz, "glowstone");
    }
  }

  // Roof slab over every footprint cell.
  if (gr < ROOF) set(x, ROOF, z, "light_gray_concrete");

  // Cornice and parapet on the perimeter; corners stand a block higher.
  if (perim) {
    set(x, ROOF + 1, z, "white_concrete");
    if (corner) set(x, ROOF + 2, z, "polished_andesite");
  }
}

// Canopy over the entrance, cantilevered from the header with a lit soffit.
if (entrance) {
  const [ex, ez] = entrance;
  const eg = gOf(ex, ez);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = 1; dz <= 2; dz++) {
      set(ex + dx, eg + 3, ez + dz, dz === 1 ? "smooth_quartz" : "white_concrete");
    }
  }
  set(ex, eg + 2, ez, "glowstone");
}

// Rooftop plant room and a lightning-rod crown on the interior.
for (let x = 4; x <= 8; x++) {
  for (let z = 7; z <= 15; z++) {
    if (!has(x, z) || outward(x, z).length) continue;
    set(x, ROOF + 1, z, "light_gray_concrete");
    set(x, ROOF + 2, z, "smooth_quartz");
  }
}
if (has(6, 11) && outward(6, 11).length === 0) {
  for (let y = ROOF + 3; y <= ROOF + 5; y++) set(6, y, 11, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
