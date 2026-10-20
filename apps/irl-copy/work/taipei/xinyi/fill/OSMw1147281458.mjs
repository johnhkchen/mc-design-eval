import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
import { readFileSync } from "node:fs";

// Record: no name. Footprint 103 x 16. Roof ~21 blocks above lowest ground.
// Read as a 1980s-90s Taipei commercial block: four storeys of white-tiled
// concrete frame and blue-tinted glazing, a shopfront ground floor on the
// street side, a concrete parapet and a plant penthouse with a mast.

const W = 103, H = 33, D = 16;
const ROOF = 21;      // roof surface sits at y=21 above lowest ground
const PARAPET = 20;   // top floor-line course
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1147281458";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

for (const [x, z, gr] of cells) {
  const g0 = Math.max(0, Math.round(gr));
  const ext = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

  // Foundation from y=0 up to this cell's ground.
  for (let y = 0; y < g0 && y < H; y++) put(x, y, z, "stone_bricks");

  // Building shell from ground to parapet.
  for (let y = g0; y <= PARAPET; y++) {
    // Floor-line courses at every fifth block, and the parapet.
    if (y % 5 === 0) {
      if (ext) {
        put(x, y, z, y === g0 ? "polished_granite" : "white_concrete");
      } else {
        put(x, y, z, "smooth_quartz");
      }
      continue;
    }

    if (ext) {
      const street = z === 0 || z === 15;
      if (y < 5) {
        // Ground-floor shopfront.
        if (x % 6 === 0) {
          put(x, y, z, "polished_granite");
        } else if (street && x % 24 === 9 && (y === 1 || y === 2) && g0 <= 1) {
          // Entrance doors on the street faces.
          const facing = z === 0 ? "north" : "south";
          const half = y === 1 ? "lower" : "upper";
          put(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
        } else {
          put(x, y, z, "light_blue_stained_glass");
        }
      } else {
        // Upper storeys: lintel band, piers and glazing.
        if (y % 5 === 4) {
          put(x, y, z, "light_gray_concrete");
        } else if (x % 6 === 0) {
          put(x, y, z, "white_concrete");
        } else {
          put(x, y, z, "light_blue_stained_glass");
        }
      }
    } else {
      // Interior: air gap behind the glass, with warm light in some bays.
      if ((z === 1 || z === 14) && x % 6 === 3 && y % 5 === 2 && ((x / 6) | 0) % 2 === 0) {
        put(x, y, z, "glowstone");
      }
    }
  }

  // Floor slabs inside the shell and the roof surface.
  for (let y = g0; y <= PARAPET; y++) {
    if (!ext && y % 5 === 0 && y > g0) put(x, y, z, "smooth_quartz");
  }
  put(x, ROOF, z, "light_gray_concrete");
}

// Rooftop plant: two mechanical boxes, a penthouse, and a mast.
for (let x = 10; x <= 18; x++)
  for (let z = 5; z <= 10; z++)
    for (let y = 22; y <= 23; y++) put(x, y, z, "gray_concrete");
for (let x = 84; x <= 92; x++)
  for (let z = 5; z <= 10; z++)
    for (let y = 22; y <= 23; y++) put(x, y, z, "gray_concrete");

for (let x = 42; x <= 60; x++)
  for (let z = 4; z <= 11; z++) {
    const edge = x === 42 || x === 60 || z === 4 || z === 11;
    for (let y = 22; y <= 24; y++) {
      if (edge) {
        put(x, y, z, (x % 6 === 0 || x === 60) ? "white_concrete" : "light_blue_stained_glass");
      }
    }
    put(x, 25, z, "light_gray_concrete");
  }

for (let y = 22; y <= 28; y++) put(51, y, 8, "iron_bars");

g.save(`${DIR}/${ID}.nbt`);
