import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951309";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Footprint lookup: key -> ground level under that cell
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inF = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// Exposed faces of a cell: n = -z, s = +z, w = -x, e = +x
function faces(x, z) {
  const f = [];
  if (!inF(x, z - 1)) f.push("n");
  if (!inF(x, z + 1)) f.push("s");
  if (!inF(x - 1, z)) f.push("w");
  if (!inF(x + 1, z)) f.push("e");
  return f;
}

// Corner cells and pillar cells on the faces (every third block along each wall)
function isPillar(x, z, f) {
  if (f.length > 1) return true;
  if (f.length === 0) return false;
  const face = f[0];
  const coord = (face === "n" || face === "s") ? x : z;
  return coord % 3 === 0;
}

// Inward neighbour for a given exposed face
function inward(x, z, face) {
  if (face === "n") return [x, z + 1];
  if (face === "s") return [x, z - 1];
  if (face === "w") return [x + 1, z];
  return [x - 1, z];
}

const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const WALL = "white_concrete";
const PILLAR = "smooth_quartz";
const FLOOR = "light_gray_concrete";
const CORNICE = "red_terracotta";
const PARAPET = "white_concrete";
const GLASS = "light_blue_stained_glass";
const LAMP = "glowstone";

// Pass 1: foundation, base course, perimeter walls, storey line, floors, roof deck
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  const perim = f.length > 0;

  // Foundation from y=0 up to ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  if (perim) {
    // Base course
    g.set(x, gr, z, BASE);
    // Walls from base to roof-cornice level
    for (let y = gr + 1; y <= 9; y++) {
      g.set(x, y, z, isPillar(x, z, f) ? PILLAR : WALL);
    }
    // Storey line
    g.set(x, 5, z, PILLAR);
    // Cornice ring and parapet
    g.set(x, 10, z, CORNICE);
    g.set(x, 11, z, PARAPET);
  } else {
    // Interior floor slab at storey line and roof deck
    if (gr < 5) g.set(x, 5, z, FLOOR);
    g.set(x, 10, z, FLOOR);
  }
}

// Pass 2: windows and shopfronts on exposed faces
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  if (f.length === 0) continue;
  if (isPillar(x, z, f)) continue;

  // Storey 1 shopfront glazing
  for (let y = gr + 1; y <= Math.min(gr + 3, 4); y++) g.set(x, y, z, GLASS);
  // Storey 2 ribbon windows with mullion-free glass
  for (let y = 6; y <= 8; y++) g.set(x, y, z, GLASS);

  // Warm light behind some upper windows
  const coord = (f[0] === "n" || f[0] === "s") ? x : z;
  if (coord % 6 === 1) {
    const [ix, iz] = inward(x, z, f[0]);
    if (inF(ix, iz) && faces(ix, iz).length === 0 && gnd(ix, iz) <= 6) {
      g.set(ix, 7, iz, LAMP);
    }
  }
}

// Pass 3: main entrance on the north (z-min) face, nearest the middle
{
  let best = null;
  for (const [x, z, gr] of cells) {
    const f = faces(x, z);
    if (!f.includes("n")) continue;
    if (isPillar(x, z, f)) continue;
    const d = Math.abs(x - 7);
    if (!best || d < best.d) best = { x, z, gr, d };
  }
  if (best) {
    const { x, z, gr } = best;
    const doorProps = (half) => ({
      facing: "south", half, hinge: "left", open: "false", powered: "false"
    });
    g.set(x, gr + 1, z, "oak_door", doorProps("lower"));
    g.set(x, gr + 2, z, "oak_door", doorProps("upper"));
    // Small canopy over the door in tile
    g.set(x, gr + 3, z, "red_terracotta_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 4: rooftop mechanical box, antenna, and parapet accents
for (let x = 4; x <= 9; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!inF(x, z) || faces(x, z).length) continue;
    g.set(x, 11, z, FLOOR);
    g.set(x, 12, z, FLOOR);
  }
}

// Lightning rod on the first corner cell found
for (const [x, z] of cells) {
  const f = faces(x, z);
  if (f.length > 1) {
    for (let y = 11; y <= 13; y++) {
      g.set(x, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
    break;
  }
}

g.save(`${DIR}/${ID}.nbt`);
