import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 640 Massachusetts Ave NW: a 1920s-30s Neoclassical limestone office block. Four storeys on a granite base over a
// 12-block main body (cornice at y 12), a 2-block central penthouse crowning the lidar's 15, and low single- and
// two-storey wings on the south-east tail. Piers of calcite every 3 cells, spandrels of smooth sandstone on each storey
// line, glass in the window rows, a dark-oak canopy and doors on the west (street) face, a granite base course.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC64751.cells.json`, "utf8"));

const W = 28, H = 27, D = 34;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, gr, roof]) => [key(x, z), { gr: Math.max(0, gr), roof }]));

// ---- massing: a 5x5 smoothed roof, quantised to three tiers (the lidar's wings are kept by their raw height) ----
const tier = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const o = raw.get(key(x + dx, z + dz)); if (o) { sum += o.roof; n++; }
  }
  const sm = sum / n;
  let T = 13;                                    // main body: cornice line at y 12
  if (c.roof <= 4) T = 4;                        // single-storey annex
  else if (c.roof <= 8) T = 6;                   // two-storey wing
  else if (sm >= 14.5) T = 15;                   // central penthouse: 2 blocks over the main roof
  tier.set(k, { gr: c.gr, T });
}
const cell = (x, z) => tier.get(key(x, z));

// ---- storey lines (absolute y): spandrels here; windows fill the two rows above each ----
const SPAN = new Set([4, 7, 10, 12, 13]);          // 12 and 13 are the main roof line and the penthouse floor
const FLOOR = new Set([4, 7, 10, 12, 13]);         // interior slabs at the same lines

const FOUND = "stone_bricks", BASE = "polished_granite", PIER = "calcite", SPANDREL = "smooth_sandstone";
const CORNICE = "stone_bricks", SLAB = "smooth_stone", GLASS = "light_blue_stained_glass_pane";
const ROOFBOX = "polished_andesite";

// the faces of a cell: a missing neighbour is the street-facing side; a neighbour lower than y exposes an upper wall
const DIRS = [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]];
function wallFace(x, z, y) {
  const missing = DIRS.filter(([dx, dz]) => !cell(x + dx, z + dz));
  const exposed = DIRS.filter(([dx, dz]) => { const n = cell(x + dx, z + dz); return n && n.T <= y; });
  if (missing.length) return { dir: missing[0], corner: missing.length > 1 };
  if (exposed.length) return { dir: exposed[0], corner: false };
  return null;
}

// ---- pass 1: foundation, then each cell's walls and interior slabs ----
for (const [k, { gr, T }] of tier) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  for (let y = gr; y < T; y++) {
    const face = wallFace(x, z, y);
    if (!face) {
      if (y === gr || y === T - 1 || FLOOR.has(y)) g.set(x, y, z, SLAB);
      continue;
    }
    const [dx, dz, side] = face.dir;
    const along = side === "N" || side === "S" ? x : z;

    let m, state;
    if (y === gr) m = BASE;
    else if (y === T - 1) m = CORNICE;
    else if (SPAN.has(y)) m = SPANDREL;
    else if (face.corner || along % 3 === 0) m = PIER;
    else {
      // glass panes join their neighbours along the face; a warm room shows through every few storeys
      m = GLASS;
      const across = side === "N" || side === "S" ? ["north", "south"] : ["east", "west"];
      const alongFace = side === "N" || side === "S" ? ["east", "west"] : ["north", "south"];
      state = { [across[0]]: "false", [across[1]]: "false", [alongFace[0]]: "true", [alongFace[1]]: "true", waterlogged: "false" };
      if (along % 12 === 4 && (y === 5 || y === 8 || y === 11)) { m = "glowstone"; state = undefined; }
    }
    g.set(x, y, z, m, state);
  }
}

// ---- pass 2: the street face (west, x = 0) entrance at the middle of its run, with a dark-oak canopy and lanterns ----
{
  const zs = [];
  for (let z = 0; z < D; z++) if (cell(0, z)) zs.push(z);
  const zc = zs[Math.floor(zs.length / 2)];
  const { gr } = cell(0, zc);
  g.set(0, gr + 1, zc, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(0, gr + 2, zc, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dz of [-1, 1]) {
    g.set(0, gr + 1, zc + dz * 2, "lantern", { hanging: "false" });
  }
  // canopy: a dark slab band over the entrance, out over the first wall cell inboard
  for (let dz = -2; dz <= 2; dz++) {
    if (!cell(0, zc + dz)) continue;
    g.set(0, gr + 3, zc + dz, "dark_oak_slab", { type: "top", waterlogged: "false" });
    if (cell(1, zc + dz)) g.set(1, gr + 3, zc + dz, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
}

// ---- pass 3: roof plant on the main roof (not the penthouse, not the edge): two small boxes ----
for (const [k, { T }] of tier) {
  if (T !== 13) continue;
  const [x, z] = k.split(",").map(Number);
  const inset = [[-2, 0], [2, 0], [0, -2], [0, 2]].every(([dx, dz]) => cell(x + dx, z + dz));
  if (!inset) continue;
  if ((x >= 6 && x <= 8 && z >= 9 && z <= 10) || (x >= 18 && x <= 19 && z >= 22 && z <= 23)) {
    g.set(x, 13, z, ROOFBOX); g.set(x, 14, z, ROOFBOX);
  }
}

g.save(`${DIR}/DC64751.nbt`);
