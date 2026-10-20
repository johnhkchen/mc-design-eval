import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711373";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 38, H = 23, D = 24;
const g = new Voxels([W, H, D]);

// Two-storey 1980s Taipei commercial block: stone plinth, white tiled concrete walls,
// grey pier frames, light-blue glazing, a red shop sign band, storey lines at y=5 and y=10,
// stone parapet at y=11, and rooftop plant at y=12.
const WALL = "white_concrete";
const PIER = "gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const SHOP_GLASS = "glass";
const SILL = "light_gray_concrete";
const SLAB = "light_gray_concrete";
const BASE = "stone_bricks";
const STOREY_LINE = "smooth_stone";
const PARAPET = "stone_bricks";
const ROOF = "gray_concrete";
const SIGN = "red_concrete";
const PLANT = "iron_block";

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Exposed faces: N = -z side, S = +z side, W = -x side, E = +x side.
function exposure(x, z) {
  const e = [];
  if (!has(x, z - 1)) e.push("N");
  if (!has(x, z + 1)) e.push("S");
  if (!has(x - 1, z)) e.push("W");
  if (!has(x + 1, z)) e.push("E");
  return e;
}

// Inward offset for a face (toward the building interior).
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const glowSpots = [];
const doorCandidates = [];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);

  const ex = exposure(x, z);
  const edge = ex.length > 0;

  for (let y = gr; y <= 11; y++) {
    if (!edge) {
      if (y === 5 || y === 10) g.set(x, y, z, SLAB);       // floor slabs
      else if (y === 11) g.set(x, y, z, ROOF);              // roof deck
      continue;
    }

    // Parapet, storey lines, base course.
    if (y === 11) { g.set(x, y, z, PARAPET); continue; }
    if (y === 10 || y === 5) { g.set(x, y, z, STOREY_LINE); continue; }
    if (y === gr) { g.set(x, y, z, BASE); continue; }

    // Corner pilasters.
    if (ex.length >= 2) { g.set(x, y, z, PIER); continue; }

    const face = ex[0];
    const t = (face === "N" || face === "S") ? x : z;
    const m = ((t % 4) + 4) % 4;

    // Shopfront on the north (street) face where the ground is low enough.
    if (face === "N" && gr <= 3) {
      if (y === 4) { g.set(x, y, z, SIGN); continue; }
      if (m === 0) { g.set(x, y, z, PIER); continue; }
      g.set(x, y, z, SHOP_GLASS);
      continue;
    }

    const windowRows = [2, 3, 7, 8];
    const sillRows = [1, 4, 6, 9];

    if (windowRows.includes(y) && (m === 1 || m === 2)) {
      g.set(x, y, z, GLASS);
      // Warm light behind some panes.
      if (((t + y) % 4) === 0) {
        const [dx, dz] = INWARD[face];
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && gAt(ix, iz) <= y) glowSpots.push([ix, y, iz]);
      }
    } else if (sillRows.includes(y) && (m === 1 || m === 2)) {
      g.set(x, y, z, SILL);
    } else if (m === 0) {
      g.set(x, y, z, PIER);
    } else {
      g.set(x, y, z, WALL);
    }
  }

  // Roof plant on interior roof cells.
  if (!edge && gr <= 11 && (x * 7 + z * 3) % 23 === 0) {
    g.set(x, 12, z, PLANT);
  }

  // Door candidates: single-face north cells on low ground.
  if (ex.length === 1 && ex[0] === "N" && gr <= 2) {
    doorCandidates.push([x, z, gr]);
  }
}

// Glowstone behind glass (interior air cells).
for (const [ix, y, iz] of glowSpots) g.set(ix, y, iz, "glowstone");

// Entrance door on the street face, nearest the middle of the frontage.
if (doorCandidates.length) {
  doorCandidates.sort((a, b) => Math.abs(a[0] - 18.5) - Math.abs(b[0] - 18.5));
  const [dx, dz, gr] = doorCandidates[0];
  const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
  g.set(dx, gr + 1, dz, "oak_door", { ...base, half: "lower" });
  g.set(dx, gr + 2, dz, "oak_door", { ...base, half: "upper" });
}

g.save(`${DIR}/${ID}.nbt`);
