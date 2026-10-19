// NYC1089023: 1166 Avenue of the Americas, a 1975 Midtown commercial and office block. Two storeys of 3 blocks, a
// granite-look base, a shopfront at street level, pale precast piers with tinted gray glass above, a dark spandrel
// band at each floor line, a cornice and coping. Lidar roof (3x3 mean, quantised to 7/8/9 flat tiers) gives the
// stepped roof. Shell only: the window bays are glass over an air gap, with a floor slab and roof deck per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1089023.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inFp = (x, z) => cell.has(key(x, z));

// Flat roof tiers: the lidar's 3x3 mean, rounded to the nearest of 7, 8, 9 (the noise becomes one stepped roof).
const top = new Map();
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number);
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = cell.get(key(x + dx, z + dz)); if (c) { s += c.r; n++; }
  }
  top.set(k, Math.min(9, Math.max(7, Math.round(s / n))));
}

const g = new Voxels([10, 20, 28]);
const FOUNDATION = "gray_concrete", BASE = "polished_andesite", CORNICE = "polished_andesite", SPANDREL = "gray_concrete";
const PIER_UP = "light_gray_concrete", PIER_GROUND = "black_concrete", GLASS_UP = "gray_stained_glass", GLASS_GROUND = "light_blue_stained_glass";
const DECK = "gray_concrete";

// Doors and lights, by cell: the avenue entrance (west face, z 7) and the cross-street lobby (south face, x 7).
const doors = new Map([
  [key(0, 7), { facing: "east", hinge: "left" }],
  [key(7, 27), { facing: "south", hinge: "left" }],
]);
const canopy = [[0, 4, 6], [0, 4, 7], [0, 4, 8], [6, 4, 27], [7, 4, 27], [8, 4, 27]];
const lanterns = [[0, 2, 4], [0, 2, 10]];

const faces = (x, z) => [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([dx, dz]) => !inFp(x + dx, z + dz));

for (const [k, { g: ground }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const H = top.get(k), gl = Math.max(ground, 1);
  const fs = faces(x, z), exterior = fs.length > 0;
  // A bay is a pier when its along-face coordinate is a multiple of 3 (aligned across corners), or on a corner.
  const pier = fs.length > 1 || fs.some(([dx, dz]) => (dx ? z : x) % 3 === 0);

  if (!exterior) {
    // Interior: the foundation, a floor slab at the second-storey line, and a roof deck at the lower tier and the top.
    for (let y = 0; y < gl; y++) g.set(x, y, z, FOUNDATION);
    if (ground === 0) g.set(x, 0, z, FOUNDATION);
    for (const y of [4, 7, H - 1]) g.set(x, y, z, DECK);
    continue;
  }

  for (let y = 0; y < H; y++) {
    let b;
    if (y < ground) b = FOUNDATION;
    else if (y === ground && ground === 0) b = BASE;
    else if (y === gl) b = BASE;
    else if (y === H - 1) b = CORNICE;
    else if (y === 4) b = SPANDREL;
    else if (y <= 3) b = pier ? PIER_GROUND : GLASS_GROUND;
    else if (y === 7) b = PIER_UP;
    else b = pier ? PIER_UP : GLASS_UP;
    g.set(x, y, z, b);
  }
  // Coping on the parapet line.
  g.set(x, H, z, "polished_andesite_slab", { type: "bottom", waterlogged: "false" });

  // Warm light in some upper windows, lanterns standing on the storefront base.
  for (const y of [5, 6]) if (!pier && (x * 5 + z * 7 + y) % 13 === 0) g.set(x, y, z, "glowstone");
  if (lanterns.some(([lx, ly, lz]) => lx === x && lz === z)) g.set(x, 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  if (canopy.some(([cx, cy, cz]) => cx === x && cz === z)) g.set(x, 4, z, "black_concrete");
  if (doors.has(k)) {
    const { facing, hinge } = doors.get(k);
    g.set(x, 2, z, "iron_door", { facing, half: "lower", hinge, open: "false", powered: "false" });
    g.set(x, 3, z, "iron_door", { facing, half: "upper", hinge, open: "false", powered: "false" });
  }
}

const out = g.save(`${dir}/NYC1089023.nbt`);
console.log("blocks", out.blocks, "palette", out.palette);
