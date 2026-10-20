import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3326012";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 20, D = 9;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Per-cell ground kept (foundation follows the slope); roof flattened to one
// median tier so the cornice reads as a clean level line from the street.
const rawRoofs = [];
for (const c of cells) {
  const [x, z, , roof] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  rawRoofs.push(Math.round(roof));
}
rawRoofs.sort((a, b) => a - b);
const medianRoof = rawRoofs.length ? rawRoofs[Math.floor(rawRoofs.length / 2)] : 8;

const cellMap = new Map();
for (const c of cells) {
  const [x, z, ground] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = clamp(Math.round(ground), 0, H - 10);
  const T = clamp(medianRoof, gr + 8, H);
  cellMap.set(`${x},${z}`, { gr, T });
}

const has = (x, z) => cellMap.has(`${x},${z}`);
const isWall = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

// Window positions on each facade; door on the street (z = 0) face.
function isWindow(x, z) {
  if (isCorner(x, z) || !isWall(x, z)) return false;
  if (z === 0 || z === D - 1) return x === 1 || x === 3;
  return z % 2 === 1; // x-walls: odd z
}

const DOOR = { x: 2, z: 0 };
const doorFacing = "south"; // outward face is -z (north side)

const lit = [];

for (const [key, { gr, T }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const wall = isWall(x, z);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < T; y++) {
    const t = y - gr;
    const top = y === T - 1;

    if (!wall) {
      if (top) g.set(x, y, z, "smooth_stone");               // roof deck
      else if (t % 2 === 0) g.set(x, y, z, "spruce_planks"); // storey floor slab
      continue;
    }

    // Exterior wall cells
    if (top) {
      g.set(x, y, z, "smooth_stone"); // cornice cap
      continue;
    }
    if (y === gr) {
      g.set(x, y, z, "brown_terracotta"); // ground course
      continue;
    }
    if (t % 2 === 0) {
      g.set(x, y, z, "brown_terracotta"); // storey line / spandrel band
      continue;
    }

    // Window row (odd t)
    if (isWindow(x, z)) {
      // Panes on street/back walls run east-west; panes on side walls run north-south.
      const alongX = z === 0 || z === D - 1;
      g.set(x, y, z, "glass_pane", {
        north: alongX ? "false" : "true",
        south: alongX ? "false" : "true",
        east: alongX ? "true" : "false",
        west: alongX ? "true" : "false",
        waterlogged: "false",
      });
      if (((x + z + t) % 3) === 0) lit.push([x, y, z]);
    } else {
      g.set(x, y, z, "bricks");
    }
  }

  // Roof stair bulkhead on one interior cell
  if (x === 2 && z === 4 && T + 2 <= H - 1) {
    g.set(x, T, z, "bricks");
    g.set(x, T + 1, z, "bricks");
    g.set(x, T + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

// Entrance: dark oak door in the brownstone base, hanging lantern above.
if (has(DOOR.x, DOOR.z)) {
  const { gr, T } = cellMap.get(`${DOOR.x},${DOOR.z}`);
  g.set(DOOR.x, gr, DOOR.z, "dark_oak_door", {
    facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(DOOR.x, gr + 1, DOOR.z, "dark_oak_door", {
    facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  if (gr + 2 < T - 1) {
    g.set(DOOR.x, gr + 2, DOOR.z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Warm lights just inside the lit windows.
for (const [x, y, z] of lit) {
  let ix = x, iz = z;
  if (x === 0) ix = 1;
  else if (x === W - 1) ix = W - 2;
  else if (z === 0) iz = 1;
  else if (z === D - 1) iz = D - 2;
  if (isWall(ix, iz) || !has(ix, iz)) continue;
  const { gr, T } = cellMap.get(`${ix},${iz}`);
  if (y >= gr && y < T - 1) g.set(ix, y, iz, "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);
