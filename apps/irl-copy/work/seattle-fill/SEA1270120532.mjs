// SEA1270120532 - 5th Ave N mid/high-rise sliver (The Century, 101 Taylor Ave N). Box [498,384,503,503], 6 x 120, heightBlocks 37.
// Footprint from manifest: x=0 column only for z 0..20; x 1..5 full length. West setback above y30 (x=1, z>=21 removed).
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 6, D = 120, HMAX = 43;
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/SEA1270120532.nbt";
const g = new Voxels([W, HMAX, D]);

const FLOORS = new Set([2, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36]);
const inRecess = (x, y, z) => x === 0 && z >= 8 && z <= 12 && y >= 2 && y <= 4;
const inF = (x, y, z) => {
  if (x < 0 || x >= W || z < 0 || z >= D) return false;
  if (x === 0 && z > 20) return false;             // footprint x=0 column is z 0..20 only
  if (y >= 31 && x === 1 && z >= 21) return false; // west setback above the tower's 30 line
  if (inRecess(x, y, z)) return false;             // entrance recess
  return true;
};
// outward faces, priority W > N > S > E
function faces(x, y, z) {
  const f = [];
  if (!inF(x - 1, y, z)) f.push("W");
  if (!inF(x, y, z - 1)) f.push("N");
  if (!inF(x, y, z + 1)) f.push("S");
  if (!inF(x + 1, y, z)) f.push("E");
  return f;
}

function faceMat(face, u, y) {
  const pier = u % 4 === 0;
  const win = u % 4 === 1 || u % 4 === 2;
  if (y <= 1) return ["stone_bricks"];
  if (y === 2) return ["polished_andesite"];                       // plinth course
  if (y === 36) return ["white_concrete"];                         // top cornice
  if (FLOORS.has(y)) return [y === 6 || y === 9 ? "smooth_stone" : "light_gray_concrete"]; // spandrel bands
  if (y === 37) return ["white_concrete"];                         // parapet
  if (y === 38) return ["smooth_quartz_slab", { type: "bottom", waterlogged: "false" }];   // crown cap
  if (y <= 5) {                                                     // storefront
    if (y === 5) return ["stone_bricks"];
    if (pier) return ["white_concrete"];
    return ["glass"];
  }
  if (y <= 11) {                                                    // podium: stone with punched glazing
    if (pier) return ["white_concrete"];
    return win ? ["light_blue_stained_glass"] : ["stone_bricks"];
  }
  // tower curtain wall
  if (pier) return ["white_concrete"];
  if (face === "E") return win ? ["light_blue_stained_glass"] : ["white_concrete"]; // flatter east side
  return ["light_blue_stained_glass"];
}

// 1. shell, floors, foundation
for (let y = 0; y <= 38; y++) for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inF(x, y, z)) continue;
  if (y <= 1) { g.set(x, y, z, "stone_bricks"); continue; }
  const fs = faces(x, y, z);
  if (fs.length) {
    const face = fs[0];
    const u = face === "N" || face === "S" ? x : z;
    const [blk, st] = faceMat(face, u, y);
    g.set(x, y, z, blk, st);
  } else if (FLOORS.has(y)) {
    g.set(x, y, z, "light_gray_concrete");
  }
}

// 2. west setback parapet on the terrace (y31, x=1)
for (let z = 21; z < D; z++) g.set(1, 31, z, "white_concrete");

// 3. balconies: recessed loggias with iron rail and open upper row
const rail = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const loggias = [[16, 41, 43], [16, 81, 83], [16, 105, 107], [25, 61, 63]];
for (const [y0, za, zb] of loggias) for (let z = za; z <= zb; z++) {
  g.set(1, y0, z, "iron_bars", rail);
  g.set(1, y0 + 1, z, "air");
}

// 4. entrance: recessed double door under a canopy, lantern, jambs, sidelights
for (let y = 2; y <= 4; y++) { g.set(0, y, 7, "stone_bricks"); g.set(0, y, 13, "stone_bricks"); }
for (let z = 7; z <= 13; z++) g.set(0, 5, z, "light_gray_concrete");
g.set(0, 4, 10, "lantern", { hanging: "true", waterlogged: "false" });
for (const z of [9, 10]) {
  const hinge = z === 9 ? "left" : "right";
  g.set(1, 2, z, "dark_oak_door", { facing: "west", half: "lower", hinge, open: "false", powered: "false" });
  g.set(1, 3, z, "dark_oak_door", { facing: "west", half: "upper", hinge, open: "false", powered: "false" });
  g.set(1, 4, z, "stone_bricks");
}
g.set(1, 2, 11, "stone_bricks");
for (const y of [3, 4]) g.set(1, y, 11, "glass");

// 5. penthouse with louvred walls and a roof slab (x 2..4, z 44..60)
for (let x = 2; x <= 4; x++) for (let z = 44; z <= 60; z++) {
  g.set(x, 40, z, "smooth_stone");
  const ring = x === 2 || x === 4 || z === 44 || z === 60;
  if (!ring) continue;
  for (let y = 37; y <= 39; y++) {
    if (y === 38 && z % 3 === 0) g.set(x, y, z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
    else g.set(x, y, z, "light_gray_concrete");
  }
}

// 6. antenna mast on the penthouse roof
g.set(3, 41, 52, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
g.set(3, 42, 52, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// 7. cooling units on the roof (2x2 iron block plinth, grille on top)
for (const [x0, z0] of [[3, 26], [3, 32], [3, 100], [3, 110]]) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
  g.set(x0 + dx, 37, z0 + dz, "iron_block");
  g.set(x0 + dx, 38, z0 + dz, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
}

// 8. skylight in the roof slab
for (let x = 2; x <= 3; x++) for (let z = 80; z <= 81; z++) g.set(x, 36, z, "glass");

g.save(OUT);
console.log("saved", OUT, "size", [W, HMAX, D], "blocks", g.count());
