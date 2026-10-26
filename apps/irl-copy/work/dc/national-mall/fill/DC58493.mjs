import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 701 18th St NW: vacant, 1900s-1920s downtown commercial row building.
// Load-bearing brick on a stone foundation, calcite belt courses and pilasters,
// 4-block storeys, boarded and lit windows, stone cornice and parapet.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC58493.cells.json`, "utf8"));

const W = 22, H = 32, D = 41;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const NEIGH8 = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];

// Raw per-cell values
const raw = new Map();
for (const [x, z, gr, rf] of cells) {
  raw.set(key(x, z), { x, z, gr: Math.max(0, Math.round(gr)), rfRaw: rf });
}

// Smooth the roof: average over the cell and its footprint neighbours,
// then snap to even heights so the massing reads as clean flat tiers.
const cell = new Map();
for (const c of raw.values()) {
  let sum = c.rfRaw, n = 1;
  for (const [dx, dz] of NEIGH8) {
    const o = raw.get(key(c.x + dx, c.z + dz));
    if (o) { sum += o.rfRaw; n++; }
  }
  let roof = Math.round((sum / n) / 2) * 2;
  if (roof < c.gr + 4) roof = c.gr + 4;
  if (roof > H - 2) roof = H - 2;
  cell.set(key(c.x, c.z), { x: c.x, z: c.z, gr: c.gr, rf: roof });
}

const exposedDirs = (x, z) => DIRS.filter(([dx, dz]) => !cell.has(key(x + dx, z + dz)));

// Facade element for an exposed cell at height y.
function faceEl(dir, x, z, y, gr, rf) {
  const along = dir[0] !== 0 ? z : x;
  const rel = y - gr;
  const r = rel % 4;
  const s = Math.floor(rel / 4);
  if (y === rf - 1) return "stone_bricks";                 // cornice course
  if (rel === 0) return "polished_andesite";               // base course
  if (r === 0) return "calcite";                           // storey belt
  if (r === 3) return "bricks";                            // spandrel
  if (along % 3 === 0) return "calcite";                   // pilaster
  if (r === 1 && s === 0 && dir[1] === -1) {               // shopfront transom
    return "glass_pane";
  }
  if (r === 1 && (along + s) % 5 === 0) return "spruce_planks"; // boarded
  if (r === 1 && (along * 2 + s * 3 + x + z) % 9 === 4) return "glowstone";
  return "glass_pane";
}

// Pass 1: foundations, walls, cornice.
for (const c of cell.values()) {
  const { x, z, gr, rf } = c;
  const faces = exposedDirs(x, z);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gr; y < rf; y++) {
    let block = "bricks";
    if (y === rf - 1) block = faces.length ? "stone_bricks" : "smooth_stone";
    else if (faces.length) block = faceEl(faces[0], x, z, y, gr, rf);
    g.set(x, y, z, block);
  }
}

// Pass 2: air gaps behind glass (only where the inner cell is solid interior),
// then re-apply facade, parapets, and a few roof units.
for (const c of cell.values()) {
  const { x, z, gr, rf } = c;
  const faces = exposedDirs(x, z);

  for (const dir of faces) {
    const [dx, dz] = dir;
    const inner = cell.get(key(x - dx, z - dz));
    const innerIsInterior = inner && exposedDirs(inner.x, inner.z).length === 0;
    for (let y = gr + 1; y < rf - 1; y++) {
      const r = (y - gr) % 4;
      if (r !== 1 && r !== 2) continue;
      const el = faceEl(dir, x, z, y, gr, rf);
      if (innerIsInterior && (el === "glass_pane" || el === "glowstone")) {
        g.set(inner.x, y, inner.z, "air");
      }
    }
    for (let y = gr; y < rf - 1; y++) {
      g.set(x, y, z, faceEl(dir, x, z, y, gr, rf));
    }
  }

  if (faces.length) {
    g.set(x, rf, z, "stone_brick_wall"); // parapet
  }
}

// Pass 3: a few roof units, spaced so they do not scatter.
for (const c of cell.values()) {
  const { x, z, rf } = c;
  if (exposedDirs(x, z).length === 0 && x % 6 === 3 && z % 8 === 4 && rf + 2 < H) {
    g.set(x, rf, z, "iron_block");
  }
}

// Pass 4: entrance on the street (north) face, near the middle of the frontage.
const northFace = [...cell.values()].filter(c => !cell.has(key(c.x, c.z - 1)));
if (northFace.length) {
  const xs = northFace.map(c => c.x).sort((a, b) => a - b);
  const mx = xs[Math.floor(xs.length / 2)];
  const door = northFace.reduce((best, c) => (Math.abs(c.x - mx) < Math.abs(best.x - mx) ? c : best));
  const { x, z, gr, rf } = door;
  // Calcite door surround: pilasters beside, lintel above.
  for (const dx of [-1, 1]) {
    if (cell.has(key(x + dx, z))) {
      g.set(x + dx, gr, z, "calcite");
      g.set(x + dx, gr + 1, z, "calcite");
      g.set(x + dx, gr + 2, z, "calcite");
      g.set(x + dx, gr + 3, z, "calcite");
    }
  }
  g.set(x, gr, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "stone_brick_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" });
  g.set(x, gr + 3, z, "stone_bricks");
  if (gr + 4 < rf) g.set(x, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/DC58493.nbt`);
