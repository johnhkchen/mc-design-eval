import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001595.cells.json`, "utf8"));

const W = 6, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => `${x},${z}`;

// Footprint lookup and per-cell massing: foundation, storeys of 2 blocks, cornice cap
const cm = new Map();
for (const [x, z, gr, roof] of cells) cm.set(key(x, z), { gr: Math.round(gr), roof });
const has = (x, z) => cm.has(key(x, z));

const info = new Map();
for (const [k, c] of cm) {
  const gr = c.gr;
  let nS = clamp(Math.round((c.roof - gr - 1) / 2), 3, 6);
  nS = Math.min(nS, Math.floor((H - 3 - gr) / 2));
  info.set(k, { gr, nS, top: gr + 2 * nS });
}

const isExteriorCell = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Pass 1: solid masses, brownstone foundation, brick walls, stone cornice cap, parapet trim
for (const [k, { gr, top }] of info) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gr; y < top; y++) g.set(x, y, z, "bricks");
  g.set(x, top, z, "stone_bricks");
  if (isExteriorCell(x, z)) {
    g.set(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: facades. Windows are recessed openings with a stone sill, glass set back
// one block behind the face, and a warm lamp in some bays.
const dirs = [
  { dx: -1, dz: 0, facing: "west" },
  { dx: 1, dz: 0, facing: "east" },
  { dx: 0, dz: -1, facing: "north" },
  { dx: 0, dz: 1, facing: "south" },
];

// Street entrance: west face, cell nearest z = 10
let doorCell = null;
{
  let best = Infinity;
  for (const [k] of info) {
    const [x, z] = k.split(",").map(Number);
    if (has(x - 1, z)) continue;
    const d = Math.abs(z - 10);
    if (d < best) { best = d; doorCell = { x, z }; }
  }
}

for (const [k, { gr, nS }] of info) {
  const [x, z] = k.split(",").map(Number);
  for (const { dx, dz, facing } of dirs) {
    if (has(x + dx, z + dz)) continue; // not an exterior face
    const along = dx !== 0 ? z : x;
    const maxAlong = dx !== 0 ? D - 1 : W - 1;
    const hasInner = has(x - dx, z - dz);
    const ix = x - dx, iz = z - dz;
    const isDoor = doorCell && doorCell.x === x && doorCell.z === z && dx === -1;

    // Base course (brownstone) on the ground floor band
    g.set(x, gr, z, "polished_andesite");

    // Stone band at each storey line
    for (let f = 1; f < nS; f++) {
      g.set(x, gr + 2 * f, z, "stone_bricks");
    }

    if (isDoor) {
      // Door in a recessed bay, stone surround above and beside
      if (hasInner) {
        g.set(ix, gr, iz, "air");
        g.set(ix, gr + 1, iz, "air");
      }
      g.set(x, gr, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
      g.set(x, gr + 1, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
      g.set(x, gr + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    for (let f = 0; f < nS; f++) {
      const yS = gr + 2 * f;   // spandrel row
      const yW = yS + 1;       // window row
      const isWindowBay = along % 3 === 1 && along > 0 && along < maxAlong;
      if (!isWindowBay) continue;

      // Sill and recessed opening: face cell becomes air, glass sits one block back
      g.set(x, yS, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      if (hasInner) {
        g.set(x, yW, z, "air");
        g.set(ix, yW, iz, "glass");
        const warm = (along + f) % 4 === 1;
        if (warm) {
          // Lamp behind the glass, one more block in (only if footprint allows)
          const bx = ix - dx, bz = iz - dz;
          if (has(bx, bz)) g.set(bx, yW, bz, "shroomlight");
        }
      } else {
        g.set(x, yW, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/NYC3001595.nbt`);
