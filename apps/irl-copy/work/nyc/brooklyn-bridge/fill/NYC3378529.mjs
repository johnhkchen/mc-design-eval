import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3378529.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3378529.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([7, 16, 7]);

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(key(x, z), { g: ground, roof });
const inFp = (x, z) => fp.has(key(x, z));

const grounds = cells.map((c) => c[2]);
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const gMax = Math.max(...grounds);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const R = Math.min(15, Math.max(gMax + 5, Math.round(medRoof)));

// Footprint bounds: the low-z side is the Hicks Street frontage
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const centreX = Math.floor((minX + maxX) / 2);

// Brownstone and terracotta-coloured trim, kept light enough to read against the brick
const BROWNSTONE = "chiseled_red_sandstone";
const BAND = "smooth_red_sandstone";
const BRICK = "bricks";
const CORNICE = "stone_brick_slab";

for (const [x, z, ground] of cells) {
  const gy = ground;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  const H = R - gy;
  const missX = !inFp(x - 1, z) || !inFp(x + 1, z);
  const missZ = !inFp(x, z - 1) || !inFp(x, z + 1);
  const edge = missX || missZ;
  const corner = missX && missZ;

  // Along-face index: position of this cell along the face it sits on
  const along = corner ? null : (missZ ? x : z);
  const onFront = edge && !corner && missZ && z === minZ;
  const isDoorCol = onFront && x === centreX;
  const isPier = corner || along === null || along % 2 === 0;

  for (let rel = 0; rel < H; rel++) {
    const y = gy + rel;
    if (y > 15) break;

    if (!edge) {
      // Interior: slabs at ground, storey lines and roof; air between (no interiors)
      if (rel === 0 || rel === H - 1 || rel % 2 === 0) {
        g.set(x, y, z, "smooth_stone");
      }
      continue;
    }

    if (rel === 0) { g.set(x, y, z, BROWNSTONE); continue; }      // base course
    if (rel === H - 1) { g.set(x, y, z, CORNICE, { type: "top", waterlogged: "false" }); continue; } // cornice
    if (rel % 2 === 0) { g.set(x, y, z, BAND); continue; }       // storey line / lintel band

    // Window rows (odd rel)
    if (isDoorCol && rel === 1) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoorCol && rel === 3) {
      // Lintel over the entrance
      g.set(x, y, z, BROWNSTONE);
      continue;
    }
    if (isPier) { g.set(x, y, z, BRICK); continue; }

    const warm = ((along + z + gy + rel) % 4) === 0;
    g.set(x, y, z, warm ? "glowstone" : "glass");
  }

  // Upper half of the entrance door
  if (isDoorCol && 2 < H - 1) {
    g.set(x, gy + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Corner piers rise one course above the cornice as a parapet
  if (corner && R + 1 <= 15) {
    g.set(x, R, z, BRICK);
  }
}

// Stepped entrance: a shallow stair hood over the door on the front centre column
// (sits on the storey-line band, so it is supported)
// Chimney stacks on interior roof cells
if (R + 2 <= 15) {
  for (const [cx, cz] of [[2, 2], [4, 4]]) {
    if (inFp(cx, cz)) {
      const cg = fp.get(key(cx, cz)).g;
      if (R - 1 > cg) {
        g.set(cx, R, cz, BRICK);
        g.set(cx, R + 1, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

g.save(OUT);
