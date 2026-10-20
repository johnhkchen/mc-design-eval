import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const raw = JSON.parse(readFileSync(`${dir}/NYC3001472.cells.json`, "utf8"));

const W = 8, H = 18, D = 6;
const g = new Voxels([W, H, D]);

// One flat roof level for the whole building (lidar noise smoothed away):
// six blocks above the lowest ground under the footprint.
const g0 = Math.min(...raw.map(r => r[2]));
const R = Math.min(g0 + 6, H - 1);

const list = raw.map(([x, z, gr]) => ({
  x, z,
  g: Math.max(0, Math.min(gr, R - 3)),
}));
const M = new Map(list.map(c => [`${c.x},${c.z}`, c]));
const has = (x, z) => M.has(`${x},${z}`);
const faces = c => ({
  n: !has(c.x, c.z - 1),
  s: !has(c.x, c.z + 1),
  w: !has(c.x - 1, c.z),
  e: !has(c.x + 1, c.z),
});
const isBoundary = c => {
  const f = faces(c);
  return f.n || f.s || f.w || f.e;
};

// Street front = low-z side (north face). Door on the middle front cell.
const frontCells = list.filter(c => faces(c).n);
let doorKey = null;
if (frontCells.length) {
  const avgX = frontCells.reduce((s, c) => s + c.x, 0) / frontCells.length;
  const door = frontCells.reduce((best, c) =>
    Math.abs(c.x - avgX) < Math.abs(best.x - avgX) ? c : best);
  doorKey = `${door.x},${door.z}`;
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

for (const c of list) {
  const { x, z } = c;
  const f = faces(c);
  const bnd = isBoundary(c);
  const isDoor = f.n && `${x},${z}` === doorKey;

  // Stone foundation from y 0 up to this cell's ground.
  for (let y = 0; y < c.g; y++) g.set(x, y, z, "stone_bricks");

  // Walls, floors and openings on the shared storey grid (absolute, from g0).
  for (let y = c.g; y <= R - 2; y++) {
    const o = y - g0;

    if (!bnd) {
      // Interior: floor slab on each storey line, air otherwise.
      if (((o % 3) + 3) % 3 === 0) g.set(x, y, z, "oak_planks");
      continue;
    }

    if (isDoor) {
      if (y === c.g) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (y === c.g + 1) {
        g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (y === c.g + 2) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      } else {
        g.set(x, y, z, "calcite");
      }
      continue;
    }

    if (((o % 3) + 3) % 3 === 0) {
      // Storey line: calcite sill / lintel band.
      g.set(x, y, z, "calcite");
      continue;
    }

    // Window rows: punched glass on alternate cells along each face.
    const alongPos = (f.n || f.s) ? x : z;
    const isWin = alongPos % 2 === 1;
    if (isWin) {
      g.set(x, y, z, "glass");
      if ((x + y) % 3 === 0) {
        for (const [dx, dz] of DIRS) {
          const nx = x + dx, nz = z + dz;
          if (!has(nx, nz)) continue;
          const nc = M.get(`${nx},${nz}`);
          if (isBoundary(nc)) continue;
          if (y >= nc.g && y <= R - 2) g.set(nx, y, nz, "glowstone");
        }
      }
    } else {
      g.set(x, y, z, "bricks");
    }
  }

  // Cornice row at the roof line; interior roof cap at the same level.
  if (bnd) {
    g.set(x, R - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    g.set(x, R - 1, z, "stone_bricks");
  }
}

g.save(`${dir}/NYC3001472.nbt`);
