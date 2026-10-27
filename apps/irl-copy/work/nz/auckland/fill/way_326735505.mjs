// Way 326735505: a three-storey brick commercial block from the 1920s, on the slope below Maungawhau. Solid brick
// masonry on a stone foundation, cream plaster strings and cornice, pilasters every third block, a shopfront
// with a timber door and a hood on the north (street) face, sash windows above, and a lower two-storey wing on the
// west where the lidar roof sits at 13. Window pockets are one block deep with air behind the glass; a few panes
// have a glowstone behind them. No interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735505.cells.json", "utf8"));

const W = 17, D = 10, H = 28;
const g = new Voxels([W, H, D]);

// footprint, keyed "x,z" -> { ground, roof }
const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => F.has(`${x},${z}`);

// outward normal and inward step per face; the along-face run index
const OUT = { N: [0, -1], W: [-1, 0], E: [1, 0], S: [0, 1] };
const IN = { N: [0, 1], W: [1, 0], E: [-1, 0], S: [0, -1] };
const RUN = { N: (x) => x, S: (x) => x, W: (_, z) => z, E: (_, z) => z };
const FACE_ORDER = ["N", "W", "E", "S"];   // N and W are the street and shopfront faces

const exposed = (f, x, z) => !inF(x + OUT[f][0], z + OUT[f][1]);
const primaryFace = (x, z) => FACE_ORDER.find((f) => exposed(f, x, z)) ?? null;

// Storey bands (absolute y): shopfront 3..5 under a fascia at 6, storey two windows 7..9 under a string at 10,
// storey three windows 11..13 under a cornice at 14 (main block). The wing stops at 12 (cornice) after 11 frieze.
const SHOP = [3, 4, 5], S2 = [7, 8, 9], S3 = [11, 12, 13];
const MAIN_TOP = 14, WING_TOP = 12;

// Lidar roof 13 above y0 in the north-west corner (x <= 4) is a lower wing; everything else is the main block at 14.
const isWing = (x, roof) => roof <= 13 && x <= 4;
const topOf = (x, roof) => (isWing(x, roof) ? WING_TOP : MAIN_TOP);

// 1. Solid massing: stone foundation to the cell's ground, brick above, roof membrane on top of each tier.
for (const [k, { ground, roof }] of F) {
  const [x, z] = k.split(",").map(Number);
  const T = topOf(x, roof);
  const perim = primaryFace(x, z) !== null;
  for (let y = 0; y <= T; y++) {
    let b;
    if (y <= ground) b = "stone_bricks";                       // foundation down to the ground under the cell
    else if (y <= 2 && perim) b = "polished_andesite";         // stone base course on the face
    else b = "bricks";
    if (y === T && !perim) b = "gray_concrete";                // roof membrane over the interior
    g.set(x, y, z, b);
  }
  if (perim) g.set(x, T + 1, z, "bricks");                     // parapet on the perimeter
}

// 2. Facade: strings, pilasters, shopfront, windows (air pockets one block deep behind the glass).
const pocketable = (x, z, f) => inF(x + IN[f][0], z + IN[f][1]);
const carve = (x, z, f, y) => g.set(x + IN[f][0], y, z + IN[f][1], "air");

// The door sits in the north face, the cell closest to the middle of the building.
const northCells = [...F.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => exposed("N", x, z) && pocketable(x, z, "N"));
const doorCell = northCells.reduce((best, c) => (best === null || Math.abs(c[0] - 8) < Math.abs(best[0] - 8) ? c : best), null);

for (const [k, { ground, roof }] of F) {
  const [x, z] = k.split(",").map(Number);
  const f = primaryFace(x, z);
  if (!f) continue;
  const T = topOf(x, roof);
  const run = RUN[f](x, z);
  const street = f === "N" || f === "W";
  for (let y = Math.max(ground + 1, 3); y <= T; y++) {
    let b = null;
    if (y === 6 || y === 10 || y === T) b = "smooth_quartz";    // fascia, string course, cornice
    else if (run % 3 === 0) b = "stone_bricks";                // pilaster every third block
    const band = SHOP.includes(y) ? "shop" : S2.includes(y) ? "s2" : (S3.includes(y) && T === MAIN_TOP) ? "s3" : null;
    if (b === null && band !== null && pocketable(x, z, f)) {
      const mid = band === "shop" ? 4 : band === "s2" ? 8 : 12;
      if (band === "shop" && street) {
        b = "glass";                                           // shopfront glass on the street faces
      } else if (y === mid) {
        b = "white_concrete";                                  // transom across each sash
      } else {
        b = "glass_pane";
      }
      carve(x, z, f, y);
      if (y === mid && b === "white_concrete" && (run + (band === "shop" ? 0 : 1)) % 4 === 1) {
        g.set(x + IN[f][0], y, z + IN[f][1], "glowstone");     // a warm light behind one sash in four
      }
    }
    if (b !== null) g.set(x, y, z, b);
  }
}

// 3. Entrance: a dark oak door in the middle of the north face, with a glass transom and a hood over it.
if (doorCell) {
  const [dx, dz] = doorCell;
  const st = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  g.set(dx, 3, dz, "dark_oak_door", st("lower"));
  g.set(dx, 4, dz, "dark_oak_door", st("upper"));
  g.set(dx, 5, dz, "glass_pane");
  for (const ex of [dx - 1, dx, dx + 1]) {
    if (exposed("N", ex, dz)) g.set(ex, 6, dz, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 4. Roof: a plant box on the main roof, standing on the membrane.
for (const [x, z] of [[11, 3], [12, 3], [11, 4], [12, 4]]) {
  if (inF(x, z) && !exposed("N", x, z) && !exposed("E", x, z) && !exposed("S", x, z) && !exposed("W", x, z)) {
    g.set(x, 15, z, "stone_bricks");
    g.set(x, 16, z, "iron_block");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326735505.nbt";
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
