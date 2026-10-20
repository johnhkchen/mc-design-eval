import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408131";
const W = 14, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, g] of cells) G.set(`${x},${z}`, g);
const inS = (x, z) => G.has(`${x},${z}`);
const groundAt = (x, z) => G.get(`${x},${z}`);

// Lowest ground under the footprint is y 0 by convention; use its actual value.
const L = Math.min(...G.values());
const TOP = L + 10; // top layer of roof deck / parapet, roof reads ~11 blocks above L

const NB = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
// inward step from an outer face
const INWARD = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };

function outFaces(x, z) {
  return Object.keys(NB).filter(d => !inS(x + NB[d][0], z + NB[d][1]));
}

// Primary facade for an edge cell: [direction, position along facade t]
function primary(x, z) {
  const f = outFaces(x, z);
  if (!f.length) return null;
  const d = f[0];
  const t = (d === "W" || d === "E") ? z : x;
  return { d, t };
}

function facadeBlock(rel, t, d) {
  const maxT = (d === "W" || d === "E") ? D - 1 : W - 1;
  const pier = t % 3 === 0 || t === maxT;
  if (rel === 0) return ["polished_andesite", null];          // base course
  if (rel >= 1 && rel <= 3) return pier                        // shopfront
    ? ["black_concrete", null] : ["glass", null];
  if (rel === 4) return ["light_gray_concrete", null];          // spandrel
  if (rel === 5) return ["smooth_quartz", null];                // storey line
  if (rel >= 6 && rel <= 8) return pier                         // upper floor
    ? ["smooth_quartz", null] : ["light_blue_stained_glass", null];
  if (rel === 9) return ["light_gray_concrete", null];          // cornice band
  if (rel === 10) return ["smooth_quartz", null];               // parapet
  return null;
}

const g = new Voxels([W, H, D]);

// Pass 1: foundations, shell, interior floor slabs and air gaps.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < Math.min(gr, H); y++) g.set(x, y, z, "stone_bricks");

  const p = primary(x, z);
  if (p) {
    for (let y = gr; y <= TOP && y < H; y++) {
      const b = facadeBlock(y - L, p.t, p.d);
      if (b) g.set(x, y, z, b[0]);
    }
  } else {
    // interior: storey floor slabs and roof deck, air between
    for (const y of [L, L + 5, TOP]) {
      if (y >= gr && y < H) {
        g.set(x, y, z, y === TOP ? "light_gray_concrete" : "smooth_stone");
      }
    }
  }
}

// Pass 2: warm lights behind selected upper and ground-floor windows.
for (const [x, z, gr] of cells) {
  const p = primary(x, z);
  if (!p) continue;
  const maxT = (p.d === "W" || p.d === "E") ? D - 1 : W - 1;
  if (p.t % 3 === 0 || p.t === maxT || p.t % 6 !== 4) continue;
  const ix = x + INWARD[p.d][0], iz = z + INWARD[p.d][1];
  if (!inS(ix, iz) || outFaces(ix, iz).length) continue;
  for (const rel of [2, 7]) {
    const y = L + rel;
    if (y >= groundAt(ix, iz) && y < H) g.set(ix, y, iz, "glowstone");
  }
}

// Pass 3: rooftop HVAC units on the deck, kept inside the footprint.
for (const [x, z] of [[4, 8], [5, 8], [4, 9], [5, 9], [9, 13], [10, 13]]) {
  if (inS(x, z) && !outFaces(x, z).length && TOP < H) {
    g.set(x, TOP, z, "iron_block");
  }
}

// Pass 4: entrance on the south face, nearest the middle, with lintel.
let door = null;
for (const [x, z] of cells) {
  if (!outFaces(x, z).includes("S")) continue;
  if (!door || Math.abs(x - 6.5) < Math.abs(door.x - 6.5)) door = { x, z };
}
if (door) {
  const gr = groundAt(door.x, door.z);
  const lower = { name: "dark_oak_door", half: "lower" };
  const upper = { name: "dark_oak_door", half: "upper" };
  const props = (h) => ({ facing: "south", half: h, hinge: "left", open: "false", powered: "false" });
  // Ensure the cell's foundation sits under the door.
  if (gr < H) g.set(door.x, gr, door.z, lower.name, props("lower"));
  if (gr + 1 < H) g.set(door.x, gr + 1, door.z, upper.name, props("upper"));
  if (gr + 2 < H) g.set(door.x, gr + 2, door.z, "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);
