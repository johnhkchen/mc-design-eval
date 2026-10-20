import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538618827";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 14, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Two-storey, flat-roofed Xinyi-era commercial block: white tiled concrete,
// light-grey frames, blue-tinted glazing, shopfront glass at street level.
const WALL = "white_concrete";
const FRAME = "light_gray_concrete";
const PLINTH = "polished_andesite";
const FOUND = "stone_bricks";
const GLASS = "light_blue_stained_glass";
const SHOPGLASS = "glass";
const CAP = "smooth_quartz";
const GLOW = "glowstone";
const LAMP = "lantern";
const EQUIP = "smooth_stone";

const SLAB = 5;        // first floor line
const ROOF = 11;       // roof slab top level
const PARAPET = 12;    // parapet course above the roof slab

const key = (x, z) => `${x},${z}`;
const inside = new Map();
for (const [x, z, gr] of cells) inside.set(key(x, z), Math.round(gr));
const has = (x, z) => inside.has(key(x, z));

// Exposed faces: a neighbour outside the footprint means this cell is on that face.
const expo = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  e: !has(x + 1, z),
  w: !has(x - 1, z),
});
const isPerimeter = (x, z) => {
  const e = expo(x, z);
  return e.n || e.s || e.e || e.w;
};

// Pick one entrance: the northern-face cell with the smallest x (street side).
let door = null;
for (const [x, z] of [...inside.keys()].map((k) => k.split(",").map(Number))) {
  if (!expo(x, z).n) continue;
  if (!door || x < door[0]) door = [x, z];
}
if (!door) {
  for (const [x, z] of [...inside.keys()].map((k) => k.split(",").map(Number))) {
    if (isPerimeter(x, z)) { door = [x, z]; break; }
  }
}
const isDoor = (x, z) => door && door[0] === x && door[1] === z;

for (const [x, z, gr0] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.round(gr0);
  const e = expo(x, z);
  const perim = e.n || e.s || e.e || e.w;
  // Along-wall coordinate: x on north/south faces, z on east/west faces.
  const u = (e.n || e.s) ? x : z;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // First-floor slab across the whole footprint (only where it isn't inside the foundation).
  if (gr <= SLAB) g.set(x, SLAB, z, FRAME);

  // Flat roof slab on every cell.
  if (gr <= ROOF) g.set(x, ROOF, z, FRAME);

  if (perim) {
    // Walls from this cell's ground up to the roof.
    for (let y = gr; y < ROOF; y++) {
      let b = WALL;
      if (y === gr) {
        b = PLINTH;                                   // base course
      } else if (y < SLAB) {
        // Ground floor: shopfront glazing with frame pillars.
        if (isDoor(x, z) && y <= gr + 2) b = GLASS;   // entrance opening
        else if (u % 3 !== 0) b = SHOPGLASS;
        else b = FRAME;
      } else if (y === SLAB) {
        b = FRAME;                                    // storey line
      } else if (y === 6 || y === 10) {
        b = FRAME;                                    // window head/sill bands
      } else {
        // Upper storey, y 7..9: glazing between frame pillars.
        b = (u % 3 !== 0) ? GLASS : FRAME;
      }
      g.set(x, y, z, b);
    }
    // Parapet and cap on the perimeter.
    g.set(x, PARAPET, z, (gr <= ROOF) ? CAP : WALL);
  } else {
    // Interior: air gap behind the glass, a few warm lights.
    if (gr <= SLAB && gr + 1 <= 4 && (x + z) % 4 === 0) {
      g.set(x, gr + 1, z, LAMP);
    }
    if (gr <= 7 && (x * 7 + z * 3) % 5 === 0) {
      g.set(x, 8, z, GLOW);
    }
    // Roof plant on a few interior roof cells.
    if (gr <= ROOF && (x * 5 + z * 7) % 13 === 0) {
      g.set(x, PARAPET, z, EQUIP);
      g.set(x, PARAPET + 1, z, EQUIP);
    }
  }
}

g.save(`${dir}/${id}.nbt`);
