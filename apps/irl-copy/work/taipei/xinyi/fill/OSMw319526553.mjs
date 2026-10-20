import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw319526553";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 63, H = 138, D = 92;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, gr | 0));
  bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x);
  bz0 = Math.min(bz0, z); bz1 = Math.max(bz1, z);
}

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  const G = Math.max(0, gr | 0);
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Tiers (absolute heights). Storey lines fall on multiples of 5.
//    Podium 0-14, tower 15-94, tower 95-119, crown 120-124, parapet 125 (roof top 126).
const tiers = [
  { y0: 0,   y1: 14,  inset: 0  },
  { y0: 15,  y1: 94,  inset: 6  },
  { y0: 95,  y1: 119, inset: 14 },
  { y0: 120, y1: 124, inset: 20 },
  { y0: 125, y1: 125, inset: 26 },
];

let podiumCells = null;

for (const t of tiers) {
  const tierCells = cells
    .map(([x, z]) => [x, z, ground.get(key(x, z))])
    .filter(([x, z]) =>
      x - bx0 >= t.inset && bx1 - x >= t.inset &&
      z - bz0 >= t.inset && bz1 - z >= t.inset);
  const set = new Set(tierCells.map(([x, z]) => key(x, z)));
  const has = (x, z) => set.has(key(x, z));
  const isRing = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  const ringSet = new Set(tierCells.filter(([x, z]) => isRing(x, z)).map(([x, z]) => key(x, z)));
  const nearRing = (x, z) =>
    ringSet.has(key(x - 1, z)) || ringSet.has(key(x + 1, z)) ||
    ringSet.has(key(x, z - 1)) || ringSet.has(key(x, z + 1));

  if (t.y0 === 0) podiumCells = tierCells;

  for (let y = t.y0; y <= t.y1; y++) {
    for (const [x, z] of tierCells) {
      const gr = ground.get(key(x, z));
      if (y < gr) continue;
      const floorRow = (y === t.y1) || (y % 5 === 0);
      if (floorRow) {
        g.set(x, y, z, "light_gray_concrete");
        continue;
      }
      if (isRing(x, z)) {
        const r = y % 5;
        if (r === 4) { g.set(x, y, z, "gray_concrete"); continue; }
        const missX = !has(x - 1, z) || !has(x + 1, z);
        const missZ = !has(x, z - 1) || !has(x, z + 1);
        const corner = missX && missZ;
        // Vertical bays: mullions every 3 blocks, and glass alternates
        // between two blues so the flat walls break into panels.
        if (corner || (x + z) % 3 === 0) {
          g.set(x, y, z, "white_concrete");
        } else {
          const bay = Math.floor((x + z) / 3) % 2 === 0;
          g.set(x, y, z, bay ? "light_blue_stained_glass" : "cyan_stained_glass");
        }
      } else {
        // Warm lights just behind the glass, sparse and deterministic.
        if (y % 5 === 2 && nearRing(x, z) && ((x * 7 + z * 3 + y * 5) % 13 === 0)) {
          g.set(x, y, z, "glowstone");
        }
      }
    }
  }
}

// 3. Entrance on the south (max z) face of the podium: a recessed
//    stone surround, a light lintel, two-high door and a hanging lantern.
{
  let zm = -Infinity;
  for (const [, z] of podiumCells) zm = Math.max(zm, z);
  const row = podiumCells.filter(([, z]) => z === zm).map(([x]) => x).sort((a, b) => a - b);
  if (row.length) {
    const xm = row[Math.floor(row.length / 2)];
    const gr = ground.get(key(xm, zm));
    const inPodium = (x, z) => podiumCells.some(([px, pz]) => px === x && pz === z);

    // Surround: stone jambs beside the door, lintel above, over the ring cells.
    for (const dx of [-1, 1]) {
      if (inPodium(xm + dx, zm)) {
        for (let y = gr; y <= gr + 3; y++) g.set(xm + dx, y, zm, "stone_bricks");
      }
    }
    for (const dx of [-1, 0, 1]) {
      if (inPodium(xm + dx, zm)) g.set(xm + dx, gr + 3, zm, "light_gray_concrete");
    }
    // Dark recessed opening behind the door line.
    if (inPodium(xm, zm)) {
      g.set(xm, gr, zm, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(xm, gr + 1, zm, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(xm, gr + 2, zm, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
