import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 世貿新城 (Taipei World Trade Center complex): a 1990s glazed office block
// with a white-concrete floor-band grid, blue-tinted glass, a shopfront
// ground storey with a central entrance, and a plant-topped roof.
// ~13 storeys of 5 blocks to a flat roof at y = 64.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245236";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 70, H = 76, D = 18;
const ROOF = 64;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Exposed faces of a footprint cell (missing neighbour = outside).
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}
const isExt = (x, z) => faces(x, z).length > 0;
const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Deterministic pseudo-random for scattering warm lights.
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

function facade(x, z, y, face, gr) {
  const longSide = face === "north" || face === "south";
  const along = longSide ? x : z;
  const yy = y % 5;

  // Ground storey: shopfront with a central entrance on the long faces.
  if (y < gr + 5) {
    if (y === gr + 4) { g.set(x, y, z, "white_concrete"); return; }
    if (longSide && along >= 32 && along <= 37) {
      if (along === 35) {
        const props = (half) => ({ facing: face, half, hinge: "left", open: "false", powered: "false" });
        if (y === gr + 1) { g.set(x, y, z, "dark_oak_door", props("lower")); return; }
        if (y === gr + 2) { g.set(x, y, z, "dark_oak_door", props("upper")); return; }
      }
      g.set(x, y, z, "light_blue_stained_glass");
      return;
    }
    if (along % 3 === 0) g.set(x, y, z, "gray_concrete");
    else g.set(x, y, z, "light_blue_stained_glass");
    return;
  }

  // Upper storeys: window bays of glass between white mullions.
  if (along % 3 === 0) {
    g.set(x, y, z, "white_concrete");
    return;
  }
  g.set(x, y, z, "light_blue_stained_glass");

  // Warm light in the room behind some windows.
  if (yy === 2 && along % 3 === 1 && hash(x, y, z) % 3 === 0) {
    const [dx, dz] = OUT[face];
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && !isExt(ix, iz)) g.set(ix, y, iz, "glowstone");
  }
}

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const ext = isExt(x, z);
  const f = faces(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  for (let y = gr; y < ROOF; y++) {
    if (y === gr || y % 5 === 0) {
      g.set(x, y, z, "white_concrete"); // floor slab per storey
      continue;
    }
    if (ext) facade(x, z, y, f[0], gr);
    // interior: air behind the glass
  }

  // Roof slab.
  g.set(x, ROOF, z, ext ? "white_concrete" : "light_gray_concrete");

  // Parapet on the perimeter.
  if (ext) g.set(x, ROOF + 1, z, "white_concrete");

  // Roof plant rooms, set back from the edges.
  if (!ext && x % 16 >= 4 && x % 16 <= 9 && z >= 5 && z <= 12) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      g.set(x, y, z, y === ROOF + 3 ? "iron_block" : "gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
