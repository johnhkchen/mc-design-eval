import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280236";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 33, D = 18;
const g = new Voxels([W, H, D]);

const TOP = 20;   // last wall course; storey lines at y = 0, 5, 10, 15, 20
const ROOF = 21;  // roof surface

const key = (x, z) => `${x},${z}`;
const gm = new Map();
for (const [x, z, gr] of cells) gm.set(key(x, z), gr);
const has = (x, z) => gm.has(key(x, z));
const exposed = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});

// Entrance: centre of the south-most row (largest z), on the street side.
let maxZ = -Infinity;
for (const [, z] of cells) if (z > maxZ) maxZ = z;
const southXs = cells.filter(([, z]) => z === maxZ).map(([x]) => x).sort((a, b) => a - b);
const dx = southXs[Math.floor(southXs.length / 2)];
const gd = gm.get(key(dx, maxZ));

// Pass 1: foundation, shell, core, roof
for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const isEdge = ex.n || ex.s || ex.w || ex.e;

  // foundation under every footprint cell
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!isEdge) {
    // solid core so every floor slab has support
    for (let y = gr; y <= TOP; y++) g.set(x, y, z, "light_gray_concrete");
    g.set(x, ROOF, z, "gray_concrete");
    continue;
  }

  // shell: base course, storey lines, pillars, glass bays
  for (let y = gr; y <= TOP; y++) {
    const band = y % 5;
    let b;
    if (y === gr) {
      b = "polished_andesite";                       // base course
    } else if (band === 0 || band === 4) {
      b = "light_gray_concrete";                      // storey line / spandrel
    } else {
      const t = (ex.n || ex.s) ? x : z;               // position along the facade
      if (t % 3 === 0) b = "white_concrete";          // mullion pillar
      else if ((x + z + y) % 13 === 0) b = "glowstone"; // warm lit window
      else b = "cyan_stained_glass";
    }
    g.set(x, y, z, b);
  }

  // coping and parapet
  g.set(x, ROOF, z, "smooth_stone");
  g.set(x, ROOF + 1, z, "light_gray_concrete");
}

// Pass 2: roof plant box and antenna in the centre (interior cells only)
for (let x = 7; x <= 12; x++) {
  for (let z = 6; z <= 11; z++) {
    if (!has(x, z)) continue;
    const ex = exposed(x, z);
    if (ex.n || ex.s || ex.w || ex.e) continue;
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    g.set(x, ROOF + 2, z, "light_gray_concrete");
    g.set(x, ROOF + 3, z, "smooth_stone");
  }
}
if (has(9, 8)) g.set(9, ROOF + 4, 8, "lightning_rod");

// Pass 3: entrance on the street face: door, hanging lantern, recessed canopy
g.set(dx, gd, maxZ, "dark_oak_door", {
  facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
});
g.set(dx, gd + 1, maxZ, "dark_oak_door", {
  facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
});
if (gd + 3 <= TOP) {
  for (let x = dx - 1; x <= dx + 1; x++) {
    if (has(x, maxZ)) g.set(x, gd + 3, maxZ, "light_gray_concrete");
  }
  g.set(dx, gd + 2, maxZ, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
