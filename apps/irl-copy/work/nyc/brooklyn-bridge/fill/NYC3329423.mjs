import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3329423";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 46, D = 22;
const g = new Voxels([W, H, D]);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const fp = new Map();
for (const [x, z, gr, r] of cells) fp.set(x + "," + z, { g: gr, r });
const inFP = (x, z) => fp.has(x + "," + z);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const mod = (a, n) => ((a % n) + n) % n;

const G0 = Math.min(...cells.map(c => c[2]));
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midX = Math.floor((minX + maxX) / 2);

// Snap lidar roof to 3-block storey tiers measured from the lowest ground,
// so setbacks step on storey lines instead of ragged single blocks.
const tierRoof = (gr, r) => {
  let R = G0 + 3 * Math.round((r - G0) / 3);
  R = Math.max(R, gr + 4);
  return Math.min(R, H - 5);
};

const hash = (x, z, y) => ((x * 7 + z * 13 + y * 3) % 5 + 5) % 5;

// Pass 1: foundation, shell, floors, windows, parapet
for (const [x, z, gr, rRaw] of cells) {
  const R = tierRoof(gr, rRaw);

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const exposed = DIRS.filter(([dx, dz]) => !inFP(x + dx, z + dz));
  const perim = exposed.length > 0;
  const corner = exposed.length >= 2;
  const face = exposed[0];

  for (let y = gr; y <= R - 1; y++) {
    const rel = mod(y - G0, 3);

    if (!perim) {
      if (rel === 0 || y === R - 1) put(x, y, z, "smooth_stone");
      continue;
    }

    if (corner) {
      put(x, y, z, "stone_bricks");
      continue;
    }

    const wallAlongX = face[1] !== 0;
    const along = wallAlongX ? x : z;
    const base = wallAlongX ? minX : minZ;
    const bay = along - base;
    const winCol = bay % 3 === 1;

    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }      // base course
    if (rel === 0) { put(x, y, z, "stone_bricks"); continue; }     // storey band / sill
    if (y === R - 1) { put(x, y, z, "smooth_stone"); continue; }   // cornice

    if (winCol) {
      const p = wallAlongX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, "glass_pane", p);

      if (rel === 1 && hash(x, z, y) === 0) {
        const ix = x - face[0], iz = z - face[1];
        if (inFP(ix, iz)) {
          const inner = DIRS.filter(([dx, dz]) => !inFP(ix + dx, iz + dz));
          if (inner.length < 2) put(ix, y, iz, "glowstone");
        }
      }
    } else {
      put(x, y, z, "bricks");
    }
  }

  if (perim) {
    put(x, R - 1, z, "smooth_stone");
    put(x, R, z, "stone_bricks");
    put(x, R + 1, z, "stone_bricks");
    put(x, R + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: entrance on the low-z street face, centre bay, with a stone lintel
for (const [x, z, gr] of cells) {
  const exposed = DIRS.filter(([dx, dz]) => !inFP(x + dx, z + dz));
  if (exposed.length === 1 && exposed[0][1] === -1 && x === midX) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // stone surround over the door, two bays wide at the storey line
    for (const dx of [-1, 0, 1]) {
      if (inFP(x + dx, z)) put(x + dx, gr + 3, z, "stone_bricks");
    }
    // flanking pier caps so the entrance reads as a portal
    for (const dx of [-1, 1]) {
      if (inFP(x + dx, z)) put(x + dx, gr + 1, z, "stone_bricks");
    }
    break;
  }
}

// Pass 3: rooftop water tank on one interior roof cell near the centre
const cx = Math.floor((minX + maxX) / 2), cz = Math.floor((minZ + maxZ) / 2);
let tankCell = null;
for (const [x, z] of [[cx, cz], [cx + 1, cz], [cx, cz + 1], [cx - 1, cz], [cx, cz - 1]]) {
  if (!inFP(x, z)) continue;
  const interior = DIRS.every(([dx, dz]) => inFP(x + dx, z + dz));
  if (interior) { tankCell = [x, z]; break; }
}
if (tankCell) {
  const [tx, tz] = tankCell;
  const cell = fp.get(tx + "," + tz);
  const R = tierRoof(cell.g, cell.r);
  for (let y = R; y <= R + 2; y++) put(tx, y, tz, "oak_planks");
}

g.save(`${DIR}/${ID}.nbt`);
