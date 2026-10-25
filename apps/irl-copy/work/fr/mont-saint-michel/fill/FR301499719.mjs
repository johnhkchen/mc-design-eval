import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Maison et jardin du Curé: presbytery-style commercial house in the walled village.
// Granite-rubble walls (mossy plinth), smooth stone string courses, slate roof,
// shopfront glazing on the ground floor, warm lanterns behind some windows.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499719.cells.json`, "utf8"));

const W = 33, H = 36, D = 36;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(key(x, z), { gr, rf });

// [dx, dz, facing name of the outward normal]
const DIRS = [
  [1, 0, "east"],
  [-1, 0, "west"],
  [0, 1, "south"],
  [0, -1, "north"],
];

const WALL = "stone_bricks";
const PLINTH = "mossy_stone_bricks";
const BAND = "smooth_stone";
const FLOOR = "smooth_stone";
const FLOOR_SLAB = { type: "bottom", waterlogged: "false" };
const ROOF = "deepslate_tiles";
const ROOF_SLAB = "deepslate_tile_slab";

// Smoothed roof heights: average the lidar roof over the 3x3 neighbourhood,
// then snap to 3-block tiers so the massing reads as clean stepped storeys.
const topOf = new Map();
for (const [x, z, gr, rf] of cells) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const c = map.get(key(x + dx, z + dz));
      if (c) { sum += c.rf; n++; }
    }
  }
  const avg = sum / n;
  let top = Math.round(avg / 3) * 3;
  top = Math.max(top, gr + 6);
  top = Math.min(top, H - 4);
  topOf.set(key(x, z), top);
}

// Pick the door: non-corner facade cell nearest the south-east street side.
let doorCell = null;
{
  let best = Infinity;
  for (const [x, z, gr] of cells) {
    const faces = DIRS.filter(([dx, dz]) => !map.has(key(x + dx, z + dz)));
    if (faces.length !== 1) continue;
    const score = Math.abs(x - 16) + Math.abs(z - 35) * 0.5 + (faces[0][2] === "south" ? 0 : 4);
    if (score < best) {
      best = score;
      doorCell = { x, z, gr, face: faces[0] };
    }
  }
}

for (const [x, z, gr] of cells) {
  const top = topOf.get(key(x, z));
  const faces = DIRS.filter(([dx, dz]) => !map.has(key(x + dx, z + dz)));
  const facade = faces.length > 0;
  const corner = faces.length > 1;
  const face = faces.length === 1 ? faces[0] : null;

  // Foundation: solid from 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, PLINTH);

  if (!facade) {
    // Interior cell: ground floor, storey floors, roof cap.
    g.set(x, gr, z, FLOOR);
    for (let fy = gr + 5; fy < top; fy += 5) {
      g.set(x, fy, z, "smooth_stone_slab", FLOOR_SLAB);
    }
    g.set(x, top, z, ROOF);
    // Sparse chimney stacks.
    if (x % 7 === 3 && z % 7 === 3 && top + 3 < H) {
      g.set(x, top + 1, z, WALL);
      g.set(x, top + 2, z, WALL);
      g.set(x, top + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
    continue;
  }

  // Facade cell: full wall from ground to just under the roof.
  for (let y = gr; y < top - 1; y++) g.set(x, y, z, WALL);

  // Storey string courses.
  for (let fy = gr + 5; fy < top - 1; fy += 5) g.set(x, fy, z, BAND);

  // Cornice band and roof edge.
  g.set(x, top - 1, z, BAND);
  g.set(x, top, z, ROOF_SLAB, FLOOR_SLAB);

  // Windows and shopfront on non-corner facade cells.
  if (face && !corner) {
    const [dx, dz] = face;
    const along = dx !== 0 ? z : x;
    for (let fy = gr; fy < top - 2; fy += 5) {
      const ground = fy === gr;
      const yEnd = Math.min(fy + (ground ? 2 : 3), top - 2);
      for (let y = fy + 1; y <= yEnd; y++) {
        const isWindow = ground ? (along % 4 !== 0) : (along % 4 === 1 || along % 4 === 2);
        if (isWindow) g.set(x, y, z, "glass");
      }
      // Warm lights behind some upper windows.
      if (!ground && (along + fy) % 5 === 0) {
        const ix = x - dx, iz = z - dz;
        const innerOk = map.has(key(ix, iz)) &&
          !DIRS.some(([ddx, ddz]) => !map.has(key(ix + ddx, iz + ddz)));
        if (innerOk) g.set(ix, fy + 2, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
    // Shopfront lintel.
    if (gr + 3 < top - 1) g.set(x, gr + 3, z, BAND);
  }
}

// Ground-level floor under every footprint cell.
for (const [x, z, gr] of cells) g.set(x, gr, z, FLOOR);

// Entrance door, with a dark oak hood on the wall above it.
if (doorCell) {
  const { x, z, gr, face } = doorCell;
  const [, , outName] = face;
  g.set(x, gr, z, "oak_door", {
    facing: outName, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, gr + 1, z, "oak_door", {
    facing: outName, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Hood sits on the door's own wall, so nothing hangs in the air.
  g.set(x, gr + 2, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/FR301499719.nbt`);
