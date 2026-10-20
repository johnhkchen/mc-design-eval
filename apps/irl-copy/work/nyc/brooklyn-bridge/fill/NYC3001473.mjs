import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001473.cells.json`, "utf8"));

const W = 5, H = 18, D = 8;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inF = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inF.has(key(x, z));

const DIRS = [
  { dx: 0, dz: -1, facing: "north" },
  { dx: 0, dz: 1, facing: "south" },
  { dx: -1, dz: 0, facing: "west" },
  { dx: 1, dz: 0, facing: "east" },
];
const facesOf = (x, z) => DIRS.filter(d => !has(x + d.dx, z + d.dz));
const isExt = (x, z) => facesOf(x, z).length > 0;

// One storey grid for the whole building: lowest ground, and a flat roof at the lidar median
const grounds = cells.map(c => Math.round(c[2]));
const G = Math.min(...grounds);
const rfs = cells.map(c => c[3]).sort((a, b) => a - b);
const R = Math.round(rfs[Math.floor(rfs.length / 2)]);
const T = Math.min(16, Math.max(R, G + 6));

// Street face: north (min z) exterior cell nearest the middle
const front = cells
  .filter(([x, z]) => has(x, z) && !has(x, z - 1))
  .sort((a, b) => Math.abs(a[0] - 2) - Math.abs(b[0] - 2));
const doorCell = front.length ? front[0] : null;

const lights = [];

for (const [x, z, grRaw] of cells) {
  const gr = Math.round(grRaw);
  const top = Math.min(16, Math.max(T, gr + 3));
  const faces = facesOf(x, z);
  const ext = faces.length > 0;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top - 1; y++) {
    const rel = y - G; // common storey grid
    if (!ext) {
      // Interior: floor slabs on the storey grid, otherwise air
      if (rel % 2 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (rel % 2 === 0) {
      g.set(x, y, z, "stone_bricks"); // string course / floor line
    } else {
      let placed = false;
      if (faces.length === 1) {
        const f = faces[0];
        const along = f.dz !== 0 ? x : z;
        if (along % 2 === 1) {
          const props = f.dz !== 0
            ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
            : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
          g.set(x, y, z, "glass_pane", props);
          placed = true;
          if (((x + 2 * z + rel) % 3 + 3) % 3 === 0) {
            lights.push({ x: x - f.dx, y, z: z - f.dz });
          }
        }
      }
      if (!placed) g.set(x, y, z, "bricks");
    }
  }

  // Roof deck across the whole footprint at top-1, cornice on the exterior ring
  if (ext) {
    g.set(x, top - 1, z, "stone_bricks");
    g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    g.set(x, top - 1, z, "stone");
  }
}

// Warm light behind some windows, interior cells only
for (const { x, y, z } of lights) {
  if (has(x, z) && !isExt(x, z) && y < H - 1) g.set(x, y, z, "glowstone");
}

// Entrance: oak door on the street face, stone lintel above
if (doorCell) {
  const [dx, dz, dgr] = doorCell;
  const gr = Math.round(dgr);
  g.set(dx, gr, dz, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, gr + 1, dz, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  const lintelY = gr + 2;
  if (lintelY < H) g.set(dx, lintelY, dz, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/NYC3001473.nbt`);
