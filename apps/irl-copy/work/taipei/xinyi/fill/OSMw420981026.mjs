import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw420981026";
const cells = JSON.parse(readFileSync(`${BASE}.cells.json`, "utf8"));

// 超然亭: two-storey Chinese-style pavilion. White plaster walls on a stone
// base, dark timber mullions, red lacquered corner and door-flank columns,
// a stone corbel cornice, and a hipped stone-tile roof that steps in over
// two layers to a flat cap with ridge lanterns.
const W = 9, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midX = Math.round((minX + maxX) / 2);

// [facing name, dx, dz]; north is -z
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const outward = (x, z) => DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz)).map(([n]) => n);

// inset distance from the outer edge (edge cells = 0)
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (outward(x, z).length > 0) { dist.set(`${x},${z}`, 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(`${x},${z}`);
  for (const [, dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz, k = `${nx},${nz}`;
    if (has(nx, nz) && !dist.has(k)) { dist.set(k, d + 1); queue.push([nx, nz]); }
  }
}
const dOf = (x, z) => dist.get(`${x},${z}`) ?? 0;

// true building corners come from the bounding box, not from stepped outline cells
const isBoxCorner = (x, z) => (x === minX || x === maxX) && (z === minZ || z === maxZ);

// pick the dominant outward face for a cell (prefer the bounding-box face)
function faceOf(x, z) {
  const out = outward(x, z);
  if (out.length === 0) return null;
  if (out.includes("north") && z === minZ) return "north";
  if (out.includes("south") && z === maxZ) return "south";
  if (out.includes("west") && x === minX) return "west";
  if (out.includes("east") && x === maxX) return "east";
  return out[0];
}

const stairs = (facing) => ({ facing, half: "bottom", shape: "straight", waterlogged: "false" });

const FOUND = "stone_bricks";
const WALL_TOP = 8;   // top wall course y
const ROOF0 = 9;      // roof eave layer
const LINE = 5;       // storey line / 2nd floor slab

for (const [x, z, gr] of cells) {
  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const face = faceOf(x, z);

  // interior: floor slab at the storey line, nothing else
  if (!face) {
    g.set(x, LINE, z, "smooth_stone");
    continue;
  }

  const corner = isBoxCorner(x, z);
  const ns = face === "north" || face === "south";
  const idx = ns ? x : z;
  const isFront = face === "north" && z === minZ;
  const isDoorCol = isFront && idx === midX;
  const flank = isFront && Math.abs(idx - midX) === 1;

  for (let y = gr; y <= WALL_TOP; y++) {
    // red lacquered columns at the true corners and beside the door
    if (corner || flank) { g.set(x, y, z, "red_concrete"); continue; }

    // door on the central bay of the entrance wall
    if (isDoorCol && (y === gr || y === gr + 1)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    // lantern over the door
    if (isDoorCol && y === gr + 2) {
      g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    if (y < 2) { g.set(x, y, z, "stone_bricks"); continue; }              // base course
    if (y === LINE) { g.set(x, y, z, "smooth_stone"); continue; }         // storey line
    if (y === WALL_TOP) {                                                  // corbel cornice
      g.set(x, y, z, "stone_brick_stairs", stairs(face));
      continue;
    }

    const winRow = (y >= 2 && y <= 3) || (y >= 6 && y <= 7);
    const bay = idx % 3 === 1;
    if (winRow && bay && !isDoorCol) {
      g.set(x, y, z, "glass_pane", ns
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    } else if (winRow) {
      g.set(x, y, z, "dark_oak_planks");   // timber mullions
    } else {
      g.set(x, y, z, "white_concrete");    // plaster wall
    }
  }

  // warm light just inside a few upper windows
  if (!corner && idx % 3 === 1 && idx === midX - 3 || (!corner && idx === midX + 3 && !isFront)) {
    const [, dx, dz] = DIRS.find(([n]) => n === face);
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz)) g.set(ix, 6, iz, "glowstone");
  }
}

// Roof: two stepped layers over a solid cap
for (const [x, z] of cells) {
  const d = dOf(x, z);

  // layer 0 at y=9: eave ring of stairs facing outward, solid inside
  if (d === 0) {
    const face = faceOf(x, z);
    g.set(x, ROOF0, z, "stone_brick_stairs", stairs(face));
  } else {
    g.set(x, ROOF0, z, "stone_bricks");
  }

  // layer 1 at y=10: inset by one, stairs on its outer ring
  if (d >= 1) {
    if (d === 1) {
      const nb = DIRS.find(([, dx, dz]) => has(x + dx, z + dz) && dOf(x + dx, z + dz) === 0);
      const facing = nb ? nb[0] : "north";
      g.set(x, ROOF0 + 1, z, "stone_brick_stairs", stairs(facing));
    } else {
      g.set(x, ROOF0 + 1, z, "stone_bricks");
    }
  }

  // layer 2 at y=11: flat cap, inset by two
  if (d >= 2) {
    g.set(x, ROOF0 + 2, z, "stone_bricks");
  }
}

// ridge lanterns along the centreline of the cap
const cz = Math.round((minZ + maxZ) / 2);
for (const z of [cz - 6, cz, cz + 6]) {
  if (dOf(midX, z) >= 2) g.set(midX, ROOF0 + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${BASE}.nbt`);
