import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038703660";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground
const key = (x, z) => `${x},${z}`;
const inFp = new Set();
let minG = Infinity;
for (const [x, z, ground] of cells) {
  inFp.add(key(x, z));
  minG = Math.min(minG, ground);
}

// Missing cardinal neighbours mark the outer wall
const miss = (x, z) => ({
  n: !inFp.has(key(x, z - 1)),
  s: !inFp.has(key(x, z + 1)),
  w: !inFp.has(key(x - 1, z)),
  e: !inFp.has(key(x + 1, z)),
});
const isWall = (m) => m.n || m.s || m.w || m.e;
const isPier = (m, x, z) => {
  const count = [m.n, m.s, m.w, m.e].filter(Boolean).length;
  return count >= 2 || (x + z) % 3 === 0;
};

// Relative levels (rel 0 = minG): 0 base, 1-4 shopfront, 5 floor line,
// 6-9 upper storey, 10 roof slab, 11 parapet top (about 11 blocks above lowest ground)
const SHOP_BULK = "dark_oak_planks";
const SHOP_GLASS = "glass";
const PIER = "white_concrete";
const FLOOR = "smooth_stone";
const ROOF = "light_gray_concrete";
const FOUND = "stone_bricks";

const cellSet = new Map();
for (const [x, z, ground] of cells) cellSet.set(key(x, z), ground);

for (const [x, z, ground] of cells) {
  const m = miss(x, z);
  const wall = isWall(m);
  const pier = wall && isPier(m, x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, FOUND);

  for (let rel = 0; rel <= 11; rel++) {
    const y = minG + rel;
    if (y < ground || y >= H) continue;

    if (rel === 0) {
      g.set(x, y, z, wall ? FOUND : FLOOR);
    } else if (rel === 5) {
      g.set(x, y, z, FLOOR);
    } else if (rel === 10) {
      g.set(x, y, z, ROOF);
    } else if (rel === 11) {
      if (wall) g.set(x, y, z, FOUND);
      else if (x >= 6 && x <= 9 && z >= 7 && z <= 10) g.set(x, y, z, FOUND); // rooftop plant box
    } else if (wall) {
      if (rel <= 4) {
        // Ground floor shopfront
        if (pier) g.set(x, y, z, PIER);
        else if (rel === 1) g.set(x, y, z, SHOP_BULK);
        else g.set(x, y, z, SHOP_GLASS);
      } else {
        // Upper storey: sill, glazing, lintel
        if (pier) g.set(x, y, z, PIER);
        else if (rel === 6 || rel === 9) g.set(x, y, z, ROOF);
        else g.set(x, y, z, SHOP_GLASS);
      }
    }
    // interior non-wall cells above the floor stay air
  }
}

// Warm lights just behind some upper-storey windows
for (const [x, z, ground] of cells) {
  const m = miss(x, z);
  if (!isWall(m) || isPier(m, x, z)) continue;
  if ((x + z) % 6 !== 1) continue;
  const rel = 7;
  const y = minG + rel;
  if (y < ground) continue;
  const missing = [m.n, m.s, m.w, m.e].filter(Boolean).length;
  if (missing !== 1) continue;
  const dx = m.w ? 1 : m.e ? -1 : 0;
  const dz = m.n ? 1 : m.s ? -1 : 0;
  const ix = x + dx, iz = z + dz;
  if (!inFp.has(key(ix, iz))) continue;
  const im = miss(ix, iz);
  if (isWall(im)) continue;
  g.set(ix, y, iz, "shroomlight");
}

// Entrance door on the street (z = 0) wall
for (const [x, z, ground] of cells) {
  if (z !== 0 || x !== 9) continue;
  const lowY = minG + 1;
  const upY = minG + 2;
  if (lowY < ground) continue;
  g.set(x, lowY, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, upY, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
