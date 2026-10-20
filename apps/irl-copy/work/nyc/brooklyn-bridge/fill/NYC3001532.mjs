import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 46 Hicks Street, Brooklyn Heights, 1879: a five-storey Italianate-era brick walk-up
// with brownstone (brown terracotta) stringcourses, a stone cornice and a stone foundation.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001532";
const W = 8, H = 23, D = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cmap = new Map();
for (const [x, z, gr, roof] of cells) cmap.set(key(x, z), { g: gr, r: roof });
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && cmap.has(key(x, z));

// Exposed faces: N = -z (street side), S = +z, W = -x, E = +x.
const exposed = (x, z) => ({
  N: !inside(x, z - 1),
  S: !inside(x, z + 1),
  W: !inside(x - 1, z),
  E: !inside(x + 1, z),
});
const isPerim = (x, z) => {
  const e = exposed(x, z);
  return e.N || e.S || e.W || e.E;
};

// Flat roof: smooth the lidar roof heights to one tier (median), kept sane.
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const maxGround = Math.max(...cells.map((c) => c[2]));
let R = Math.round(medRoof);
R = Math.min(H - 6, Math.max(R, maxGround + 5));

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pass 1: massing, foundation, floors, facade.
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.min(gr, R - 5));
  const e = exposed(x, z);
  const perim = isPerim(x, z);

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: no rooms, just floor slabs and the roof deck.
    put(x, ground, z, "smooth_stone");
    for (let k = 2; ground + k <= R - 2; k += 2) put(x, ground + k, z, "smooth_stone");
    put(x, R - 1, z, "smooth_stone");
    continue;
  }

  // Facade cell.
  put(x, ground, z, "stone_bricks"); // plinth course
  for (let k = 1; ground + k <= R - 2; k++) {
    const y = ground + k;
    if (k % 2 === 0) {
      // Floor line / stringcourse in brownstone-coloured terracotta.
      put(x, y, z, "brown_terracotta");
    } else {
      // Window row: glass between brick piers, with brick at corners.
      const corner = (e.N || e.S) && (e.W || e.E);
      let window = false;
      if (!corner) {
        if (e.N || e.S) window = x % 2 === 1;
        else if (e.W || e.E) window = z % 2 === 1;
      }
      put(x, y, z, window ? "glass" : "bricks");
    }
  }
  // Full-block stone parapet at the top of the wall, flush with the roof deck.
  put(x, R - 1, z, "stone_bricks");
}

// Pass 2: entrance, lantern, and warm lights behind some windows.
const frontCells = cells.filter(([x, z]) => z === 0 && isPerim(x, z)).map(([x, z, gr]) => ({ x, z, gr }));
const doorX = 3;
const doorCell = frontCells.find((c) => c.x === doorX);
if (doorCell) {
  const gy = Math.max(0, Math.min(doorCell.gr, R - 5));
  put(doorX, gy + 1, 0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(doorX, gy + 2, 0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Hanging lantern over the entrance, in the window row above the door.
  put(doorX, gy + 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

// Warm glow behind a sample of windows (interior air cell just inside the glass).
const inwardOf = (e) => {
  if (e.N) return [0, 1];
  if (e.S) return [0, -1];
  if (e.W) return [1, 0];
  if (e.E) return [-1, 0];
  return null;
};
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const e = exposed(x, z);
  const ground = Math.max(0, Math.min(gr, R - 5));
  const inward = inwardOf(e);
  if (!inward) continue;
  const [dx, dz] = inward;
  const nx = x + dx, nz = z + dz;
  if (!inside(nx, nz) || isPerim(nx, nz)) continue;
  for (let k = 1; ground + k <= R - 2; k += 2) {
    if ((x + z + k) % 4 === 0 && !(z === 0 && x === doorX)) {
      const isGlowstone = (x + k) % 2 === 0;
      put(nx, ground + k, nz, isGlowstone ? "glowstone" : "shroomlight");
    }
  }
}

// Roof: a low stair bulkhead on the interior deck, capped in stone.
// Kept to two blocks so it reads as a stair housing, not a chimney.
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  if (x >= 2 && x <= 4 && z >= 1 && z <= 3) {
    put(x, R, z, "bricks");
    if (z === 2 && x === 3) {
      // Doorway opening on the bulkhead front, kept as air.
      continue;
    }
    put(x, R + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
