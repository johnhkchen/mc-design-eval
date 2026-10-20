import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001552.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001552.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const g = new Voxels([5, 19, 17]);

const key = (x, z) => `${x},${z}`;
const info = new Map(cells.map(([x, z, gr, rf]) => [key(x, z), { g: gr, r: rf }]));
const has = (x, z) => info.has(key(x, z));
const edge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Smooth the lidar roof into one flat parapet height (median of cell roofs)
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const R = roofs[Math.floor(roofs.length / 2)];

// Door on the street (x = 0) face, at the middle of that face
const frontZ = cells.filter(c => c[0] === 0).map(c => c[1]).sort((a, b) => a - b);
const doorZ = frontZ.length ? frontZ[Math.floor(frontZ.length / 2)] : -1;

const TRIM = "smooth_sandstone";
const WIN = (z) => z >= 1 && z <= 15 && ((z - 1) % 4) < 2;
const WIN_X = (x) => x === 1 || x === 3;

// Pass 1: foundations, perimeter shell, interior slabs, roof deck
for (const [x, z, G] of cells) {
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  const isEdge = edge(x, z);
  for (let y = G; y < R; y++) {
    if (isEdge) {
      g.set(x, y, z, y === R - 1 ? TRIM : "bricks");
    } else if (y === R - 1) {
      g.set(x, y, z, "smooth_stone");
    } else if (y === R - 2 || (y < R - 2 && (y - G) % 2 === 0)) {
      if (!(x === 1 && z === doorZ && y === G)) g.set(x, y, z, "oak_planks");
    }
  }
}

// Pass 2: street, rear and end facades
for (const [x, z, G] of cells) {
  const streetFace = x === 0 && !has(-1, z);
  const rearFace = x === 4 && !has(5, z);
  const endFace = (!has(x, z - 1) || !has(x, z + 1)) && !streetFace && !rearFace;
  if (!streetFace && !rearFace && !endFace) continue;

  for (let y = G; y <= R - 2; y++) {
    const off = y - G;
    if (off === 0) {
      g.set(x, y, z, TRIM);                       // ground course
    } else if (off % 2 === 0) {
      g.set(x, y, z, TRIM);                       // storey string course
    } else if (streetFace || rearFace) {
      g.set(x, y, z, WIN(z) ? "glass_pane" : "bricks");
    } else if (endFace) {
      g.set(x, y, z, WIN_X(x) ? "glass_pane" : "bricks");
    }
  }

  // warm light behind a few panes on the second storey
  if (streetFace || rearFace) {
    if (WIN(z) && (z % 8) === 3 && has(streetFace ? 1 : 3, z)) {
      const ly = G + 3;
      if (ly <= R - 3) g.set(streetFace ? 1 : 3, ly, z, "shroomlight");
    }
  }
}

// Street entrance: dark oak door with a sandstone surround and a lantern inside
if (doorZ >= 0 && has(0, doorZ)) {
  const { g: G } = info.get(key(0, doorZ));
  if (R - 1 > G + 1) {
    g.set(0, G, doorZ, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(0, G + 1, doorZ, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
    for (const dz of [-1, 1]) {
      if (has(0, doorZ + dz)) {
        g.set(0, G + 1, doorZ + dz, TRIM);
        g.set(0, G + 2, doorZ + dz, TRIM);
      }
    }
    g.set(0, G + 2, doorZ, TRIM);                 // lintel over the door
    if (has(1, doorZ)) g.set(1, G + 2, doorZ, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Roof equipment: one brick chimney stack on an interior roof cell
const interiorCells = cells.filter(([x, z]) => !edge(x, z));
if (interiorCells.length) {
  const [cx, cz] = interiorCells.reduce((best, c) => (c[1] > best[1] ? c : best));
  for (let y = R; y <= R + 2; y++) g.set(cx, y, cz, "bricks");
  g.set(cx, R + 3, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(OUT);
