import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Taipei commercial block, c. 1970s-80s: three storeys over a shopfront,
// white tiled-look quartz facade, flat roof with parapet and rooftop plant.
// Roof deck at height 16, parapet top at 17 above the lowest ground (y 0).
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw588121712.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw588121712.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 12, H = 29, D = 26;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const BANDS = [4, 9, 14];   // storey lines (sills / lintels / floor slabs)
const ROOF = 15;            // roof deck
const PAR = 16;             // parapet course
const SHOP = [1, 2, 3];     // ground-floor shopfront glazing
const UPPER = [5, 6, 7, 8, 10, 11, 12, 13];

const DIRS = [
  { name: "north", dx: 0, dz: -1, facing: "north", ns: true },
  { name: "south", dx: 0, dz: 1, facing: "south", ns: true },
  { name: "west", dx: -1, dz: 0, facing: "west", ns: false },
  { name: "east", dx: 1, dz: 0, facing: "east", ns: false },
];

function outwardFaces(x, z) {
  return DIRS.filter(d => !has(x + d.dx, z + d.dz));
}

function paneProps(ns) {
  return ns
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

for (const [x, z, gr] of cells) {
  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const faces = outwardFaces(x, z);
  const ext = faces.length > 0;
  const corner = faces.length > 1;

  for (let y = gr; y <= PAR; y++) {
    // roof deck
    if (y === ROOF) { g.set(x, y, z, "light_gray_concrete"); continue; }
    // parapet on exterior ring only
    if (y === PAR) { if (ext) g.set(x, y, z, "quartz_block"); continue; }
    // storey lines: exterior bands and interior floor slabs
    if (BANDS.includes(y)) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (!ext) continue; // interior: air gap behind glass

    const f = faces[0];
    const t = f.ns ? x : z;
    const last = f.ns ? W - 1 : D - 1;
    const pier = corner || t === 0 || t === last || t % 3 === 0;

    if (y === 0) { g.set(x, y, z, "granite"); continue; }

    // ground-floor entrance on the north street face, centre bay
    if (f.name === "north" && x === 6 && (y === gr || y === gr + 1)) {
      const upper = y === gr + 1;
      g.set(x, y, z, "oak_door", {
        facing: "south",
        half: upper ? "upper" : "lower",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (f.name === "north" && x === 6 && y === gr + 2 && gr + 2 <= 3) {
      g.set(x, y, z, "glass_pane", paneProps(true));
      continue;
    }

    if (SHOP.includes(y) || UPPER.includes(y)) {
      if (pier) {
        g.set(x, y, z, "quartz_block");
      } else {
        g.set(x, y, z, "glass_pane", paneProps(f.ns));
        // warm light behind glass, one air cell between, on some upper bays
        if ((y === 7 || y === 12) && ((t * 31 + (y === 7 ? 17 : 29) + (f.ns ? 7 : 3)) % 4 === 0)) {
          const px = x - f.dx * 2, pz = z - f.dz * 2;
          if (has(px, pz)) g.set(px, y, pz, "glowstone");
        }
      }
      continue;
    }
  }
}

// rooftop plant: penthouse block, water tank, antenna
for (let x = 4; x <= 7; x++) for (let z = 9; z <= 12; z++) {
  if (!has(x, z) || G.get(`${x},${z}`) > 16) continue;
  g.set(x, 16, z, "white_concrete");
  g.set(x, 17, z, "white_concrete");
}
for (let x = 9; x <= 10; x++) for (let z = 3; z <= 4; z++) {
  if (!has(x, z) || G.get(`${x},${z}`) > 16) continue;
  g.set(x, 16, z, "iron_block");
  g.set(x, 17, z, "iron_block");
}
if (has(5, 10) && G.get("5,10") <= 17) {
  g.set(5, 18, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(OUT);
