import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC65845";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 31, H = 27, D = 24;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const S = new Map();
for (const c of cells) S.set(key(c[0], c[1]), { x: c[0], z: c[1], ground: Math.round(c[2]), roof: Math.round(c[3]) });
const has = (x, z) => S.has(key(x, z));

// Street-facing (north = z-min, south = z-max) entrance positions
const edgeX = { N: [], S: [] };
for (const c of S.values()) {
  if (!has(c.x, c.z - 1)) edgeX.N.push(c.x);
  if (!has(c.x, c.z + 1)) edgeX.S.push(c.x);
}
const doorX = {};
for (const f of ["N", "S"]) {
  const xs = edgeX[f];
  if (xs.length) {
    const mn = Math.min(...xs), mx = Math.max(...xs);
    doorX[f] = Math.round((mn + mx) / 2);
  }
}

for (const c of S.values()) {
  const { x, z } = c;
  const ground = c.ground;

  // Massing: storeys from lidar roof height, snapped to clean 3-block tiers
  const nS = Math.max(1, Math.round((c.roof - ground - 1) / 3));
  const T = Math.min(24, ground + 1 + 3 * nS); // wall top; roof deck at T-1

  // Foundation
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  const perim = missN || missS || missW || missE;
  const corner = (missN || missS) && (missW || missE);

  let face;
  if (missN) face = "N"; else if (missS) face = "S"; else if (missW) face = "W"; else face = "E";
  const along = (face === "N" || face === "S") ? x : z;

  // Entrance on either street face
  const doorFace = (missN && x === doorX.N && !corner) ? "N"
                 : (missS && x === doorX.S && !corner) ? "S" : null;
  const canopyFace = (missN && Math.abs(x - (doorX.N ?? -99)) <= 1 && !corner) ? "N"
                   : (missS && Math.abs(x - (doorX.S ?? -99)) <= 1 && !corner) ? "S" : null;

  if (!perim) {
    // Solid core so every slab and roof deck is supported: no floating storeys
    g.set(x, ground, z, "smooth_stone");
    for (let y = ground + 1; y <= T - 2; y++) {
      const slab = y >= ground + 4 && (y - (ground + 4)) % 3 === 0;
      g.set(x, y, z, slab ? "white_concrete" : "light_gray_concrete");
    }
    g.set(x, T - 1, z, "light_gray_concrete"); // roof deck
    if (x % 8 === 4 && z % 8 === 4) {
      g.set(x, T, z, "gray_concrete");
      g.set(x, T + 1, z, "gray_concrete");
    }
    continue;
  }

  for (let y = ground; y <= T; y++) {
    let b = null;
    if (y === ground) {
      b = "polished_andesite"; // base course
    } else if (y === T) {
      b = "polished_andesite"; // parapet
    } else if (y === T - 1) {
      b = "smooth_stone"; // cornice
    } else if (y <= ground + 3) {
      // ground floor: shopfront with entrance
      if (doorFace && (y === ground + 1 || y === ground + 2)) {
        g.set(x, y, z, "dark_oak_door", {
          facing: doorFace === "N" ? "north" : "south",
          half: y === ground + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      } else if (canopyFace && y === ground + 3) {
        b = "black_concrete";
      } else if (corner || along % 3 === 0) {
        b = "white_concrete";
      } else {
        b = "light_blue_stained_glass";
      }
    } else {
      const rel = (y - (ground + 4)) % 3;
      if (rel === 0) {
        b = "light_gray_concrete"; // storey spandrel
      } else if (corner || along % 3 === 0) {
        b = "white_concrete"; // pier
      } else {
        b = ((along + y) % 11 === 0) ? "glowstone" : "light_blue_stained_glass";
      }
    }
    if (b) g.set(x, y, z, b);
  }
}

g.save(`${DIR}/${ID}.nbt`);
