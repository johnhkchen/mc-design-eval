import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0040-46F";
const W = 166, H = 309, D = 109;

// Storey grid: 5 blocks per storey, aligned to absolute y so floor lines line up across the footprint.
const FLOOR = 5;
const PODIUM_TOP = 30;   // ~6 storeys of podium, full footprint
const SET1 = 180;        // first setback: outer ring ends, terrace
const SET2 = 240;        // second setback: inner ring ends, terrace
const ROOF = 297;        // roof plane (exclusive top of solid), per lidar
const MAST_TOP = 308;    // lightning rod tip, inside H = 309

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// ---- footprint map ----
const ground = new Map();
for (const [x, z, gy] of cells) {
  const xi = Math.round(x), zi = Math.round(z);
  if (xi < 0 || xi >= W || zi < 0 || zi >= D) continue;
  ground.set(`${xi},${zi}`, Math.max(0, Math.min(H - 1, Math.round(gy))));
}
const inFoot = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

// ---- 4-neighbour distance from the footprint edge (edge = 1) ----
const dist = new Map();
const queue = [];
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (NB.some(([dx, dz]) => !inFoot(x + dx, z + dz))) {
    dist.set(key, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(`${x},${z}`);
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    const k = `${nx},${nz}`;
    if (inFoot(nx, nz) && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push([nx, nz]);
    }
  }
}
const distAt = (x, z) => dist.get(`${x},${z}`) ?? 1;

// ---- solidity of the tower body at absolute y ----
function solidAt(x, y, z) {
  if (!inFoot(x, z)) return false;
  const g = groundAt(x, z);
  if (y < g || y >= ROOF) return false;
  const d = distAt(x, z);
  if (y < SET1) return true;                 // podium + tower shaft, full footprint
  if (y < SET2) return d >= 9;               // first setback: inner ring rises
  return d >= 17;                            // crown: innermost core only
}

// exposure: a neighbour at the same height is air
function exposure(x, y, z) {
  const ex = !solidAt(x - 1, y, z) || !solidAt(x + 1, y, z);
  const ez = !solidAt(x, y, z - 1) || !solidAt(x, y, z + 1);
  return { ex, ez, any: ex || ez };
}

// deterministic pseudo-random for sparse warm lights
const rnd = (x, y, z) => ((x * 7919 + y * 104729 + z * 1299709) % 97 + 97) % 97;

const g = new Voxels([W, H, D]);

// ---- street edge: find the minimum-z row and the entrance centre on it ----
let minZ = Infinity;
for (const key of ground.keys()) minZ = Math.min(minZ, Number(key.split(",")[1]));
const edgeXs = [];
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (z === minZ) edgeXs.push(x);
}
const cxEdge = edgeXs.reduce((a, b) => a + b, 0) / edgeXs.length;
const edgeMin = Math.min(...edgeXs), edgeMax = Math.max(...edgeXs);
const entranceCx = Math.round(cxEdge);
const doorXs = [entranceCx, entranceCx + 1].filter((x) => edgeXs.includes(x));   // two-leaf door
const glazedXs = edgeXs.filter((x) => Math.abs(x - entranceCx - 0.5) <= 3 && !doorXs.includes(x));
const pilasterXs = new Set([entranceCx - 4, entranceCx + 5].filter((x) => edgeXs.includes(x)));
const doorSet = new Set(doorXs.map((x) => `${x},${minZ}`));

// ---- build ----
for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone");

  const top = (() => { let t = gy; while (t < ROOF && solidAt(x, t, z)) t++; return t; })();
  if (top <= gy) continue;

  const d = distAt(x, z);
  const onStreetEdge = z === minZ && edgeXs.includes(x);

  for (let y = gy; y < top; y++) {
    const { ex, ez, any } = exposure(x, y, z);
    const roofHere = !solidAt(x, y + 1, z);
    const podium = y < PODIUM_TOP;

    if (any) {
      if (podium) {
        // podium: stone base course, stone pilasters on a 4-cell rhythm, glazed shopfront bays between
        if (y < gy + 2) {
          g.set(x, y, z, "polished_andesite");                    // base course
        } else if (y % FLOOR === 0) {
          g.set(x, y, z, "stone_bricks");                         // podium storey band
        } else if ((ex && z % 4 === 0) || (ez && x % 4 === 0)) {
          g.set(x, y, z, "stone_brick_wall");                     // pilaster
        } else {
          g.set(x, y, z, "light_blue_stained_glass");
        }
      } else {
        // tower facade: storey spandrel, mullion frame, glazing
        if (y % FLOOR === 0) {
          g.set(x, y, z, "light_gray_concrete");                  // storey line
        } else if ((ex && z % 4 === 0) || (ez && x % 4 === 0)) {
          g.set(x, y, z, "white_concrete");                       // mullion frame
        } else {
          g.set(x, y, z, "light_blue_stained_glass");             // glazing
        }
      }

      // street entrance: lantern-lit glazed bays flanking the doors, stone pilasters at the outer edges
      if (onStreetEdge && gy <= y && y < gy + 4) {
        if (pilasterXs.has(x)) {
          g.set(x, y, z, "polished_andesite");
        } else if (glazedXs.includes(x) && y < gy + 3) {
          g.set(x, y, z, "light_blue_stained_glass");
        }
      }
    } else {
      // enclosed interior: floor slab per storey, air gap behind glass, sparse warm lights
      if (y % FLOOR === 0) {
        g.set(x, y, z, "smooth_quartz");
      } else if (d === 2 && (y % FLOOR) >= 1 && (y % FLOOR) <= 3 && rnd(x, y, z) < 5) {
        g.set(x, y, z, "glowstone");
      }
    }

    if (roofHere) {
      if (any) {
        g.set(x, y, z, "light_gray_concrete");                    // roof edge / cornice
        if (y + 1 < H) g.set(x, y + 1, z, "stone_bricks");        // parapet
      } else {
        g.set(x, y, z, "smooth_quartz");                          // roof or terrace slab
      }
    }
  }

  // the entrance: double doors, a warm lamp just inside the glazing
  if (doorSet.has(key) && gy + 1 < top) {
    const facing = "north";
    g.set(x, gy, z, "dark_oak_door", { facing, half: "lower", hinge: x === doorXs[0] ? "left" : "right", open: "false", powered: "false" });
    g.set(x, gy + 1, z, "dark_oak_door", { facing, half: "upper", hinge: x === doorXs[0] ? "left" : "right", open: "false", powered: "false" });
    // a dark lintel above the doors, then the lobby glow behind it
    if (gy + 2 < top) g.set(x, gy + 2, z, "stone_bricks");
    if (inFoot(x, minZ + 1) && gy + 3 < top && distAt(x, minZ + 1) >= 2) {
      g.set(x, gy + 1, minZ + 1, "glowstone");
    }
  }
}

// ---- roof terraces: a few planters on the first setback terrace ----
for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);
  const d = distAt(x, z);
  if (d >= 2 && d <= 8 && (x + z) % 23 === 0 && gy < SET1) {
    if (solidAt(x, SET1 - 1, z) && !solidAt(x, SET1, z)) {
      g.set(x, SET1, z, "oak_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
    }
  }
}

// ---- crown mast on the deepest core cell ----
let best = null, bestD = -1;
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const d = distAt(x, z);
  if (d > bestD) { bestD = d; best = [x, z]; }
}
if (best && bestD >= 17) {
  const [mx, mz] = best;
  for (let y = ROOF; y < MAST_TOP; y++) g.set(mx, y, mz, "white_concrete");
  g.set(mx, MAST_TOP, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
