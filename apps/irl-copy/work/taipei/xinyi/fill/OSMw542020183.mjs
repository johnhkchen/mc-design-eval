import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no OSM tags. Read as a 1980s-90s two-storey concrete shophouse with a
// shopfront ground floor, tiled-white walls, tinted upper windows, a cornice and
// parapet, and a small rooftop plant box. Roof ~11 blocks above lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020183";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 23, D = 6;
const g = new Voxels([W, H, D]);

const gm = new Map();
for (const [x, z, gr] of cells) gm.set(`${x},${z}`, gr);
const inF = (x, z) => gm.has(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const panes = new Set();
const pane = (x, y, z) => {
  panes.add(`${x},${y},${z}`);
  put(x, y, z, "light_blue_stained_glass_pane");
};

for (const [x, z, gr] of cells) {
  const ex = {
    n: !inF(x, z - 1),
    s: !inF(x, z + 1),
    w: !inF(x - 1, z),
    e: !inF(x + 1, z),
  };
  const nExp = Object.values(ex).filter(Boolean).length;
  const perimeter = nExp > 0;
  const corner = nExp >= 2;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perimeter) {
    // Interior: floor slabs per storey and roof deck, air between.
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");
    // Rooftop plant box on two interior cells.
    if ((x === 2 || x === 3) && z === 2) {
      for (let y = gr + 11; y <= gr + 12; y++) put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  // ---- Perimeter cell ----
  const single = nExp === 1;
  const along = (ex.n || ex.s) ? x : z;
  const isWin = single && along % 2 === 1;
  const entrance = ex.s && !corner && x === 3 && z === D - 1;

  // Base course.
  put(x, gr, z, "stone_bricks");

  // Storey 1 (ground floor, shopfront).
  if (entrance) {
    put(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "light_blue_stained_glass");
  } else {
    const ground = corner ? "white_concrete" : (isWin ? "light_blue_stained_glass" : "white_concrete");
    for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, ground);
  }
  put(x, gr + 4, z, "white_concrete");

  // Storey line.
  put(x, gr + 5, z, "light_gray_concrete");

  // Storey 2: tinted window bands with frames.
  if (corner || !isWin) {
    for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "white_concrete");
  } else {
    put(x, gr + 6, z, "white_concrete");
    for (let y = gr + 6; y <= gr + 8; y++) pane(x, y, z);
    put(x, gr + 9, z, "light_gray_concrete");

    // Warm light behind the glass: inward cell, if it is interior.
    const inward = ex.n ? [x, z + 1] : ex.s ? [x, z - 1] : ex.w ? [x + 1, z] : [x - 1, z];
    const inGr = gm.get(`${inward[0]},${inward[1]}`);
    if (inGr !== undefined) {
      const ii = [inward[0] - 0, inward[1]];
      const innerPerimeter = !inF(ii[0], ii[1] - 1) || !inF(ii[0], ii[1] + 1) ||
        !inF(ii[0] - 1, ii[1]) || !inF(ii[0] + 1, ii[1]);
      if (!innerPerimeter && (x + z) % 3 === 0) {
        put(ii[0], inGr + 7, ii[1], "glowstone");
      }
    }
  }

  // Cornice and parapet.
  put(x, gr + 10, z, "light_gray_concrete");
  put(x, gr + 11, z, "white_concrete");
}

// Connect glass panes to neighbouring panes on the same level.
for (const key of panes) {
  const [x, y, z] = key.split(",").map(Number);
  const has = (dx, dz) => panes.has(`${x + dx},${y},${z + dz}`);
  put(x, y, z, "light_blue_stained_glass_pane", {
    north: has(0, -1) ? "true" : "false",
    south: has(0, 1) ? "true" : "false",
    east: has(1, 0) ? "true" : "false",
    west: has(-1, 0) ? "true" : "false",
    waterlogged: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);
