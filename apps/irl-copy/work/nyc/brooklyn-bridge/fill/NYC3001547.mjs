import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001547.cells.json`, "utf8"));

const W = 5, H = 22, D = 14;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const has = (x, z) => cellMap.has(key(x, z));
const isEdge = (x, z) => !(has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z));

// Ground per cell from lidar; one flat roof tier for the whole building
const cellMap = new Map();
let roofSum = 0, roofN = 0;
for (const [x, z, gr, roof] of cells) {
  cellMap.set(key(x, z), { gr: Math.max(0, Math.round(gr)) });
  roofSum += roof; roofN++;
}
const topY = Math.min(H - 1, Math.max(8, Math.round(roofSum / roofN)));

for (const [k, c] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const gr = c.gr;
  const top = Math.max(topY, gr + 5);

  // Foundation
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // Interior: floor slabs every storey, air between, roof deck on top
    for (let y = gr; y < top - 1; y++) {
      const off = y - gr;
      if (off % 2 === 0) g.set(x, y, z, "spruce_planks");
    }
    g.set(x, top - 1, z, "smooth_stone");
    continue;
  }

  const nN = has(x, z - 1), nS = has(x, z + 1);
  const zFace = !nN || !nS;
  const isDoorCell = x === 2 && z === 0 && !nN;

  for (let y = gr; y < top; y++) {
    const off = y - gr;

    // Entrance door, two blocks high
    if (isDoorCell && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "oak_door", {
        facing: "north",
        half: y === gr ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // Parapet / cornice course, flat roof edge
    if (y === top - 1) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Lintel course over the entrance: stone slab across the door bay
    if (off === 2 && z === 0 && x >= 1 && x <= 3) {
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    // Base course on top of foundation
    if (y === gr) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Storey band: windows on odd offsets where the facade allows, brick otherwise
    const windowRow = off % 2 === 1 && y < top - 2;
    let windowed = false;
    if (zFace) {
      windowed = (x === 1 || x === 3);
    } else {
      windowed = (z % 2 === 1 && z > 1 && z < D - 2);
    }

    if (windowRow && windowed) {
      g.set(x, y, z, "glass");
    } else {
      g.set(x, y, z, "bricks");
    }
  }
}

// Warm lights placed inside, behind some glazed bays (interior cells only)
for (const [k, c] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const nN = has(x, z - 1), nS = has(x, z + 1);
  const zFace = !nN || !nS;
  const gr = c.gr;
  const top = Math.max(topY, gr + 5);
  for (let y = gr + 1; y < top - 2; y++) {
    const off = y - gr;
    if (off % 2 !== 1) continue;
    let windowed, dx = 0, dz = 0;
    if (zFace) {
      windowed = (x === 1 || x === 3);
      dz = z === 0 ? 1 : -1;
    } else {
      windowed = (z % 2 === 1 && z > 1 && z < D - 2);
      dx = x === 0 ? 1 : -1;
    }
    if (!windowed) continue;
    if ((x + z + y) % 5 !== 0) continue;
    const ix = x + dx, iz = z + dz;
    if (ix < 0 || ix >= W || iz < 0 || iz >= D) continue;
    if (!has(ix, iz) || isEdge(ix, iz)) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

g.save(`${DIR}/NYC3001547.nbt`);
