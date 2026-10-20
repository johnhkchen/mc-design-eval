import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source record. Decision: a 2-storey Taipei commercial block of the late
// 1990s/2000s type: stone-faced plinth, white concrete piers, tinted glass bays,
// quartz cornice bands and a parapet with a small roof plant room.
// Roof deck sits 10 blocks above the floor datum and the parapet tops out at 11.

const W = 16, H = 23, D = 16;
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1241583930.cells.json", "utf8"));

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inFp = new Set();
let F = 0;
for (const [x, z, gr] of cells) {
  inFp.add(key(x, z));
  if (gr > F) F = gr;
}

// Highest y used: F + 11 (parapet). Keep within the 23-high volume.
if (F + 11 > H - 1) throw new Error(`building needs y up to ${F + 11}, volume is ${H} high`);

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];

const put = (x, y, z, id, props) => g.set(x, y, z, id, props);
const slabBottom = { type: "bottom", waterlogged: "false" };

// Pass 1: foundation, floor slabs, roof deck, walls and openings
for (const [x, z, ground] of cells) {
  // Foundation: solid from y 0 up to the datum, so nothing floats on the slope.
  for (let y = 0; y < F; y++) put(x, y, z, "stone_bricks");

  const out = DIRS.filter((d) => !inFp.has(key(x + d.dx, z + d.dz)));
  const isWall = out.length > 0;
  const corner = out.length >= 2;
  const face = out[0];

  // Floor slabs (ground, first, roof deck): one full slab per storey line.
  put(x, F, z, "light_gray_concrete");
  put(x, F + 5, z, "light_gray_concrete");
  put(x, F + 10, z, "light_gray_concrete");

  if (!isWall) {
    // Interior: air cavities F+1..F+4 and F+6..F+9 are left empty behind the glass.
    continue;
  }

  // Position along the wall face, used for the bay rhythm.
  const t = face.dz !== 0 ? x : z;
  const isPier = corner || t % 3 === 0;
  const isEntrance = !corner && face.n === "south" && t === 7;

  // Storey lines: cornice bands at F+5 and F+10, parapet cap at F+11.
  put(x, F + 5, z, "quartz_block");
  put(x, F + 10, z, "quartz_block");
  put(x, F + 11, z, "quartz_slab", slabBottom);

  // Ground storey (shopfront): tinted glass bays between white concrete piers.
  if (isEntrance) {
    put(x, F + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, F + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, F + 3, z, "light_blue_stained_glass");
    put(x, F + 4, z, "white_concrete");
  } else if (isPier) {
    for (let y = F + 1; y <= F + 4; y++) put(x, y, z, "white_concrete");
  } else {
    for (let y = F + 1; y <= F + 3; y++) put(x, y, z, "light_blue_stained_glass");
    put(x, F + 4, z, "white_concrete");
  }

  // Upper storey: window grid of glass panes with concrete mullions.
  for (let y = F + 6; y <= F + 9; y++) {
    if (isPier) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane");
  }
}

// Pass 2: warm lights behind selected glass (inside the cavity, one block in from the face)
for (const [x, z] of cells) {
  const out = DIRS.filter((d) => !inFp.has(key(x + d.dx, z + d.dz)));
  if (out.length !== 1) continue;
  const face = out[0];
  const t = face.dz !== 0 ? x : z;
  if (t % 3 !== 1) continue;
  const ix = x - face.dx;
  const iz = z - face.dz;
  if (!inFp.has(key(ix, iz))) continue;
  const innerOut = DIRS.filter((d) => !inFp.has(key(ix + d.dx, iz + d.dz)));
  if (innerOut.length > 0) continue; // inner cell is itself a wall cell
  if (t % 6 === 1) {
    put(ix, F + 7, iz, "glowstone");
  } else {
    put(ix, F + 2, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: roof plant room on the deck, near the centre of the footprint
for (const [x, z] of cells) {
  const out = DIRS.filter((d) => !inFp.has(key(x + d.dx, z + d.dz)));
  if (out.length > 0) continue;
  if (x >= 6 && x <= 9 && z >= 6 && z <= 9) {
    put(x, F + 11, z, "smooth_stone");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1241583930.nbt");
