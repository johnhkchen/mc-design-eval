import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building OSMw839833535: 21 x 21 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey concrete shophouse-style block (c. 1970s-80s): stone-clad
// shopfront at street level, white concrete upper floor with a window grid,
// a smooth-stone cornice, parapet, and roof plant. Lit windows at dusk.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833535";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 21, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const ROOF = 10;   // roof slab top level (absolute)
const PARAPET = 11;
const STOREY = 5;  // floor line between storeys

const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.min(10, gr)));
const has = (x, z) => ground.has(key(x, z));

function place(x, y, z, id, st) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
}

// Which outward faces a footprint cell sits on
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("n");
  if (!has(x, z + 1)) f.push("s");
  if (!has(x - 1, z)) f.push("w");
  if (!has(x + 1, z)) f.push("e");
  return f;
}

// Door sits at the middle of the south (+z) street face
const southXs = cells.filter(([x, z]) => !has(x, z + 1)).map(([x]) => x);
const doorX = southXs.length
  ? Math.floor((Math.min(...southXs) + Math.max(...southXs)) / 2)
  : -1;

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const G = ground.get(key(x, z));

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) place(x, y, z, "stone_bricks");

  // Floor at ground level
  const f = faces(x, z);
  const perim = f.length > 0;
  place(x, G, z, perim ? "polished_andesite" : "light_gray_concrete");

  // Interior storey slab and roof slab
  if (!perim) {
    if (G < STOREY) place(x, STOREY, z, "light_gray_concrete");
    if (G < ROOF) place(x, ROOF, z, "smooth_stone");
    continue;
  }

  // Perimeter storey line and cornice
  if (G < STOREY) place(x, STOREY, z, "light_gray_concrete");
  if (G < ROOF) place(x, ROOF, z, "smooth_stone");

  // Parapet
  place(x, PARAPET, z, "white_concrete");

  const face = f[0];
  const t = (face === "n" || face === "s") ? x : z;
  const isDoor = f.includes("s") && x === doorX;

  // Ground storey (shopfront)
  for (let y = G + 1; y <= 4; y++) {
    if (y === 4) {
      place(x, y, z, "white_concrete"); // lintel / canopy band
      continue;
    }
    if (isDoor && y <= G + 2) {
      const half = y === G + 1 ? "lower" : "upper";
      place(x, y, z, "oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (((t % 3) + 3) % 3 === 0) {
      place(x, y, z, "polished_andesite"); // stone pillar
    } else {
      place(x, y, z, "glass"); // shopfront glazing
    }
  }

  // Upper storey: sill, windows, lintel, cornice
  for (let y = Math.max(G + 1, 6); y <= 9; y++) {
    if (y === 6) {
      place(x, y, z, "light_gray_concrete"); // sill band
      continue;
    }
    if (y === 9) {
      place(x, y, z, "white_concrete"); // lintel band
      continue;
    }
    // y = 7, 8: window band
    if (((t % 3) + 3) % 3 === 0) {
      place(x, y, z, "white_concrete"); // mullion pier
    } else if (y === 7 && ((t % 6) + 6) % 6 === 1) {
      place(x, y, z, "glowstone"); // warm lit window behind glass
    } else {
      place(x, y, z, "light_blue_stained_glass");
    }
  }
}

// Roof plant: central equipment block and a small unit on top
for (const [x, z, G] of cells) {
  if (G > ROOF) continue;
  if (x >= 8 && x <= 12 && z >= 8 && z <= 12) {
    place(x, PARAPET, z, "light_gray_concrete");
    place(x, PARAPET + 1, z, "light_gray_concrete");
  }
  if (x >= 9 && x <= 11 && z >= 9 && z <= 11) {
    place(x, PARAPET + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
