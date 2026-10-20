import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC3395560.cells.json`, "utf8"));

const W = 13, H = 16, D = 9;
const g = new Voxels([W, H, D]);

// Raw lidar records per footprint cell.
const raw = new Map();
for (const [x, z, gr, roof] of cells) {
  raw.set(`${x},${z}`, { ground: Math.round(gr), roof: Math.round(roof) });
}
const has = (x, z) => raw.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Smooth the roof: median of the 3x3 neighbourhood of lidar roof heights, so noise
// becomes flat tiers instead of stepped stair-like bumps.
const info = new Map();
for (const [key, { ground, roof }] of raw) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const n = raw.get(`${x + dx},${z + dz}`);
      if (n) vals.push(n.roof);
    }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  const gr = Math.max(0, Math.min(H - 2, ground));
  const r = Math.max(gr + 2, Math.min(H, med));
  info.set(key, { ground: gr, top: r - 1 });
}

// Materials
const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const BAND = "smooth_stone";
const PIER = "light_gray_concrete";
const PILASTER = "polished_andesite";
const SLAB = "light_gray_concrete";
const OPEN = "iron_bars";
const LIGHT = "glowstone";
const CAP = "smooth_stone_slab";

const isPilasterCol = (x, z) => {
  // Full-height pilasters at the corners and every fourth column on the street faces.
  const onFace = z === 0 || z === D - 1 || x === 0 || x === W - 1;
  return onFace && (x % 4 === 0 || x === W - 1 || z === 0 && false);
};

for (const [key, { ground, top }] of info) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, FOUND);

  if (!edge) g.set(x, ground, z, SLAB); // garage floor under interior bays

  for (let y = ground; y <= top; y++) {
    if (edge) {
      if (y === ground) {
        g.set(x, y, z, BASE);
      } else if (y === top) {
        g.set(x, y, z, CAP); // parapet cap course
      } else if (isPilasterCol(x, z)) {
        g.set(x, y, z, PILASTER); // full-height pilaster
      } else if (y % 2 === 0) {
        g.set(x, y, z, BAND); // storey line
      } else if ((x + z) % 2 === 0) {
        g.set(x, y, z, PIER); // concrete pier between slots
      } else if ((x + z) % 6 === 1 && y > ground + 1) {
        g.set(x, y, z, LIGHT); // warm light in an open slot
      } else {
        g.set(x, y, z, OPEN); // open parking slot
      }
    } else {
      // Interior: floor slabs per storey, roof deck, column grid.
      if (y === top) g.set(x, y, z, SLAB);
      else if (y > ground && y % 2 === 0) g.set(x, y, z, SLAB);
      if (x % 4 === 0 && z % 4 === 0 && y > ground && y < top) g.set(x, y, z, PIER);
    }
  }
}

// Entrance on the Front Street face (low z), centred between pilasters at x=4 and x=8.
const ent = info.get("6,0");
if (ent) {
  const { ground } = ent;
  // Stone surround: pilasters step in around the doorway.
  g.set(5, ground + 1, 0, "stone_bricks");
  g.set(5, ground + 2, 0, "stone_bricks");
  g.set(7, ground + 1, 0, "stone_bricks");
  g.set(7, ground + 2, 0, "stone_bricks");
  // Door
  g.set(6, ground + 1, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(6, ground + 2, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lintel slab over the doorway with flanking lanterns.
  g.set(6, ground + 3, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
  g.set(5, ground + 3, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
  g.set(7, ground + 3, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
  g.set(4, ground + 2, 0, "lantern", { hanging: "false" });
  g.set(8, ground + 2, 0, "lantern", { hanging: "false" });
}

g.save(`${dir}/NYC3395560.nbt`);
