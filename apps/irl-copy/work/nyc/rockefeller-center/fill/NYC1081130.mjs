// 21 West 53rd Street, 1963: a glass-and-spandrel International Style office block on a grey stone base.
// Footprint 13 x 31 (x 0..12, z 0..30). The lidar gives a 28-block tower over z 9..24, a 24-block wing at both ends
// (z 0..8 and z 25..30) and a small roof box (26) over x 7..10, z 5..8. Lidar holes (roof 0 or noise at (11,4), (11,7),
// (11,11), (2,12)) are smoothed to their tier. Each storey is 3 blocks: a spandrel course, then two rows of tinted glass
// with iron mullions every third bay. Shell cells (the outer ring and the faces stepped down from the tower) are the
// skin; the inside is air behind the glass with a floor slab per storey and a structural core in the middle, so every
// floor is carried at both ends. Lit windows are glowstone set behind the glass.
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
import { readFileSync } from "node:fs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1081130.cells.json", "utf8"));

const W = 13, D = 31, H = 36;
const gnd = Array.from({ length: D }, () => Array(W).fill(0));
const roof = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, g0] of cells) gnd[z][x] = g0;
// Tiers from the lidar, smoothed: tower 28 over z 9..24, wings 24 (lidar 23-24), roof box 24 + 2 (lidar 26) below.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) roof[z][x] = z >= 9 && z <= 24 ? 28 : 24;

const edge = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const shell = (x, z) => {
  if (edge(x, z)) return true;
  const R = roof[z][x];
  return roof[z][x - 1] < R || roof[z][x + 1] < R || roof[z - 1][x] < R || roof[z + 1][x] < R;
};
// The facade a shell cell belongs to: z-faces run along x (index = x), x-faces along z (index = z).
const facade = (x, z) => {
  const R = roof[z][x];
  const zFace = z === 0 || z === D - 1 || roof[z - 1][x] < R || roof[z + 1][x] < R;
  return { zFace, idx: zFace ? x : z };
};
const core = (x, z) => x >= 5 && x <= 7 && z >= 2 && z <= 28;
const corner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

const g = new Voxels([W, H, D]);
const GLASS = "light_blue_stained_glass", SPANDREL = "light_gray_concrete", MULLION = "iron_block";
const BASE = "polished_andesite", CORNICE = "smooth_stone", SLAB = "stone_bricks";

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const gr = gnd[z][x], R = roof[z][x], sh = shell(x, z);
  const { zFace, idx } = facade(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);                     // foundation under the lower ground
  for (let y = gr; y < R; y++) {
    const k = Math.floor(y / 3), r = y % 3;
    if (y === R - 1) { g.set(x, y, z, sh ? CORNICE : SPANDREL); continue; }   // cornice / roof slab
    if (!sh) {                                                                 // inside: core and floor slabs only
      if (core(x, z) || y === gr || (k >= 1 && r === 0)) g.set(x, y, z, SLAB);
      continue;
    }
    if (y === gr || (k === 0 && y === 3)) { g.set(x, y, z, BASE); continue; } // base course and ground-floor band
    if (r === 0) { g.set(x, y, z, SPANDREL); continue; }                       // storey spandrel
    if (corner(x, z) || idx % 3 === 0) { g.set(x, y, z, MULLION); continue; }  // mullions every third bay
    g.set(x, y, z, GLASS);
    // Lit office behind the glass: a few bays on the outer faces get glowstone on the floor slab in the air gap.
    if (edge(x, z) && k >= 1 && r === 1 && (idx * 5 + k * 7) % 13 === 0) {
      const bx = x === 0 ? 1 : x === W - 1 ? W - 2 : x;
      const bz = z === 0 ? 1 : z === D - 1 ? D - 2 : z;
      g.set(bx, y, bz, "glowstone");
    }
  }
}

// Ground floor: entrances on both short ends, centred on x 4..8, glass doors at x 6, a stone canopy band over them.
for (const z of [0, D - 1]) {
  for (let x = 4; x <= 8; x++) g.set(x, 3, z, CORNICE);
  g.set(6, 1, z, "dark_oak_door", { facing: z === 0 ? "north" : "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(6, 2, z, "dark_oak_door", { facing: z === 0 ? "north" : "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}
g.set(6, 2, D - 2, "lantern", { hanging: "true", waterlogged: "false" });   // lobby lantern under the slab at y 3

// Mechanical penthouses on the roofs: solid boxes on the cap with a stone top and iron corners.
const penthouse = (x0, x1, z0, z1, y0, y1) => {
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const corn = (x === x0 || x === x1) && (z === z0 || z === z1);
    g.set(x, y, z, y === y1 ? CORNICE : corn ? MULLION : SPANDREL);
  }
};
penthouse(4, 8, 12, 18, 28, 29);   // tower roof (cap at 27)
penthouse(7, 10, 5, 8, 24, 25);    // lidar's 26 box over the wing (cap at 23)

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1081130.nbt");
console.log("NYC1081130", g.count(), "blocks", g.palette.length, "palette");
