import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000076.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000076.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const W = 15, H = 23, D = 6;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const c of cells) map.set(key(c[0], c[1]), c);

const DIRS = [
  { d: "n", dx: 0, dz: -1, facing: "north" },
  { d: "s", dx: 0, dz: 1, facing: "south" },
  { d: "w", dx: -1, dz: 0, facing: "west" },
  { d: "e", dx: 1, dz: 0, facing: "east" },
];

const exposure = new Map();
for (const c of cells) {
  const ex = DIRS.filter(o => !map.has(key(c[0] + o.dx, c[1] + o.dz)));
  exposure.set(key(c[0], c[1]), ex);
}

// Smooth lidar roofs into clean tiers: snap to the nearest 3-block (one and a half storey) step,
// keep at least one storey above the local ground.
const tierTop = new Map();
for (const c of cells) {
  const gr = Math.round(c[2]);
  let snapped = Math.round(c[3] / 3) * 3;
  if (snapped < gr + 3) snapped = gr + 3;
  if (snapped > H - 3) snapped = H - 3;
  tierTop.set(key(c[0], c[1]), snapped - 1);
}

// Entrance: south face preferred, near the middle of the frontage
let doorKey = null, doorDir = null;
for (const want of ["s", "n"]) {
  const cands = cells.filter(c => {
    const ex = exposure.get(key(c[0], c[1]));
    return ex.length === 1 && ex[0].d === want;
  });
  if (cands.length) {
    const along = c => (want === "s" || want === "n") ? c[0] : c[1];
    const mid = (Math.min(...cands.map(along)) + Math.max(...cands.map(along))) / 2;
    cands.sort((a, b) => Math.abs(along(a) - mid) - Math.abs(along(b) - mid));
    doorKey = key(cands[0][0], cands[0][1]);
    doorDir = DIRS.find(o => o.d === want);
    break;
  }
}

for (const c of cells) {
  const [x, z] = c;
  const gr = Math.round(c[2]);
  const top = tierTop.get(key(x, z));
  const k = key(x, z);
  const ex = exposure.get(k);
  const isFacade = ex.length > 0;
  const isCorner = ex.length > 1;

  // Foundation up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  for (let y = gr; y <= top && y < H; y++) {
    const rel = y - gr;

    // Flat roof / parapet cap on every cell
    if (y === top) {
      g.set(x, y, z, isFacade ? "stone_bricks" : "smooth_stone");
      continue;
    }

    if (!isFacade) {
      // Interior: floor slabs only, air otherwise
      if (rel === 3 || rel === 6) g.set(x, y, z, "smooth_stone");
      continue;
    }

    const primary = ex[0];
    const along = (primary.d === "n" || primary.d === "s") ? x : z;
    const winRow = (rel >= 1 && rel <= 2) || (rel >= 4 && rel <= 5) || (rel >= 7 && rel <= 8);
    // Pilaster columns every 4 blocks break up the flat wall; windows fill the bays between
    const pilaster = along % 4 === 0 || isCorner;
    const winSlot = !pilaster && (along % 4 === 1 || along % 4 === 2);
    const isDoorCol = doorKey === k && doorDir && primary.d === doorDir.d;

    if (rel === 0) {
      g.set(x, y, z, "stone_bricks");
    } else if (rel === 3 || rel === 6) {
      // Storey string courses; the door bay gets a stone lintel instead
      g.set(x, y, z, "smooth_stone");
    } else if (rel === 9 && y < top) {
      g.set(x, y, z, "stone_bricks");
    } else if (isDoorCol && (rel === 1 || rel === 2)) {
      g.set(x, y, z, "oak_door", {
        half: rel === 1 ? "lower" : "upper",
        facing: doorDir.facing,
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (isDoorCol && rel === 0) {
      g.set(x, y, z, "stone_bricks");
    } else if (winRow && winSlot) {
      g.set(x, y, z, "glass");
    } else if (pilaster) {
      // Pilasters are stone-capped brick
      g.set(x, y, z, rel % 2 === 0 ? "stone_bricks" : "bricks");
    } else {
      g.set(x, y, z, "bricks");
    }

    // Warm light just inside some lit windows
    if (winRow && winSlot && !isDoorCol && (rel === 4 || rel === 7) && along % 8 === 1) {
      const ix = x - primary.dx, iz = z - primary.dz;
      const inner = map.get(key(ix, iz));
      if (inner) {
        const iGr = Math.round(inner[2]);
        if (y >= iGr && y < tierTop.get(key(ix, iz))) g.set(ix, y, iz, "glowstone");
      }
    }
  }

  // Chimney stack standing on an interior roof, one per building
  if (!isFacade && x === 4 && z === 2 && top + 2 < H) {
    g.set(x, top + 1, z, "bricks");
    g.set(x, top + 2, z, "stone_bricks");
  }
}

// Entrance: a lantern at each side of the door on the lower storey, set inside the bay
if (doorKey && doorDir) {
  const cell = cells.find(c => key(c[0], c[1]) === doorKey);
  const gr = Math.round(cell[2]);
  const [dx0, dz0] = [cell[0], cell[1]];
  const side = (doorDir.d === "s" || doorDir.d === "n") ? [1, 0] : [0, 1];
  for (const s of [-1, 1]) {
    const lx = dx0 + side[0] * s, lz = dz0 + side[1] * s;
    if (map.has(key(lx, lz))) {
      // Light sits in the air just inside the bay, behind the glass line
      const ix = lx - doorDir.dx, iz = lz - doorDir.dz;
      if (map.has(key(ix, iz))) g.set(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(OUT);
