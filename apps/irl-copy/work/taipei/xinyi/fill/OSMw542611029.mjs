import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542611029";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 33;
const g = new Voxels([W, H, D]);

// Two-storey late-20th-century commercial block: cream quartz walls, light-blue glass
// bands in stone-brick piers, a stone base course, a light-grey storey line and
// roof parapet, a stone entrance bay on the south front and a small roof penthouse.
const ROOF = 10;   // roof slab level (flat for every cell)
const PARA = 11;   // parapet course on the perimeter
const FLOOR = 5;   // storey line between the two floors

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const FACES = {
  N: [0, -1],
  S: [0, 1],
  W: [-1, 0],
  E: [1, 0],
};

// Pass 1: foundations, roof slab, floor lines, walls and facades.
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Roof slab over every footprint cell.
  g.set(x, ROOF, z, "light_gray_concrete");

  const perim = isPerim(x, z);

  if (!perim) {
    // Interior: a floor slab at the storey line, air elsewhere (no interiors).
    if (FLOOR >= gr) g.set(x, FLOOR, z, "smooth_stone");
    continue;
  }

  // Exterior body in quartz, then parapet.
  for (let y = gr; y < ROOF; y++) g.set(x, y, z, "quartz_block");
  g.set(x, PARA, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // Facades for each open side.
  const openFaces = Object.keys(FACES).filter(([f]) => false) ; // placeholder replaced below
  for (const f of Object.keys(FACES)) {
    const [dx, dz] = FACES[f];
    if (has(x + dx, z + dz)) continue;

    const along = f === "N" || f === "S" ? x : z;
    const isWin = along % 3 !== 0; // every third column is a stone-brick pier
    const ix = x - dx, iz = z - dz; // inward neighbour

    for (let y = gr; y < ROOF; y++) {
      let id;
      if (y === gr) id = "smooth_stone";            // base course
      else if (y === FLOOR) id = "smooth_stone";    // storey line
      else if (y === FLOOR - 1 || y === ROOF - 1) id = "light_gray_concrete"; // lintels
      else id = isWin ? "light_blue_stained_glass_pane" : "stone_bricks";     // windows / piers
      g.set(x, y, z, id, id.endsWith("pane") ? { waterlogged: "false" } : undefined);
    }

    // Warm light behind a few upper-floor windows.
    if (isWin && along % 4 === 1 && has(ix, iz) && !isPerim(ix, iz)) {
      const gi = gOf(ix, iz);
      if (gi <= 7) g.set(ix, 7, iz, "glowstone");
    }
  }
}

// Pass 2: south-front entrance bay (two-cell opening, stone frame, canopy).
for (const [x, z, gr] of cells) {
  if (has(x, z + 1)) continue;          // only the south perimeter
  if (x < 8 || x > 11) continue;
  if (x === 8 || x === 11) {
    for (let y = gr + 1; y <= gr + 3; y++) g.set(x, y, z, "stone_bricks");
  } else {
    for (let y = gr + 1; y <= gr + 3; y++) g.set(x, y, z, "air");
    // soffit / canopy over the entrance
    g.set(x, gr + 4, z, "light_gray_concrete");
    // hanging lantern under the canopy
    g.set(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 3: roof penthouse (mechanical room) on the central roof.
for (const [x, z, gr] of cells) {
  if (x < 7 || x > 12 || z < 11 || z > 21) continue;
  if (!has(x, z)) continue;
  for (let y = ROOF + 1; y <= ROOF + 2; y++) {
    g.set(x, y, z, "quartz_block");
  }
  g.set(x, ROOF + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
