import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339401646";
const W = 8, H = 24, D = 21;

// Materials: 1980s-style white-tiled concrete shophouse with stone bands,
// glazed shopfront on the ground storey, and a rooftop water tank.
const WALL = "white_concrete";
const MULLION = "light_gray_concrete";
const GLASS = "glass";
const BAND = "smooth_stone";
const PARAPET = "stone_bricks";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const TANK = "iron_block";

// Storey lines (local y; y 0 = lowest ground, roof surface at 11, parapet top at 12)
const GROUND_LINTEL_Y = 4;
const FLOOR2_Y = 5;
const UPPER_BAND_Y = 9;
const ROOF_Y = 10;
const PARAPET_Y = 11;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(c => c[2]));

const cellMap = new Map();
for (const [x, z, gr] of raw) cellMap.set(`${x},${z}`, gr - minG);
const has = (x, z) => cellMap.has(`${x},${z}`);
const gnd = (x, z) => cellMap.get(`${x},${z}`);

const unique = [...cellMap.keys()].map(k => k.split(",").map(Number));

function miss(x, z) {
  return { N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) };
}
function isPerim(x, z) {
  const m = miss(x, z);
  return m.N || m.S || m.W || m.E;
}
function isCorner(x, z) {
  const m = miss(x, z);
  return (m.N || m.S) && (m.E || m.W);
}

const g = new Voxels([W, H, D]);

// ---- Pass 1: foundations, floors, walls, roof ----
for (const [x, z] of unique) {
  const gr = gnd(x, z);
  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  if (!isPerim(x, z)) {
    // interior: floor slabs per storey, no walls, air inside
    for (const y of [gr, FLOOR2_Y, ROOF_Y]) {
      if (y >= gr && y <= ROOF_Y) g.set(x, y, z, FLOOR);
    }
    continue;
  }

  const m = miss(x, z);
  const corner = isCorner(x, z);
  // base course on the perimeter, floor slab underneath everything
  g.set(x, gr, z, BASE);

  for (let y = gr + 1; y <= PARAPET_Y; y++) {
    if (y === GROUND_LINTEL_Y || y === FLOOR2_Y || y === UPPER_BAND_Y) {
      g.set(x, y, z, BAND);
    } else if (y === ROOF_Y || y === PARAPET_Y) {
      g.set(x, y, z, PARAPET);
    } else {
      // window rows: ground 1..3 (shopfront), upper 6..8
      if (corner) {
        g.set(x, y, z, MULLION);
      } else {
        const t = (m.N || m.S) ? x : z;
        g.set(x, y, z, t % 3 === 0 ? MULLION : GLASS);
      }
    }
  }
  // interior floor slabs at storey lines, also under the perimeter ring
  if (FLOOR2_Y >= gr) g.set(x, FLOOR2_Y, z, BAND);
}

// ---- Pass 2: entrance on the north (z-min) street face ----
const frontCands = unique.filter(([x, z]) => {
  const m = miss(x, z);
  return m.N && !isCorner(x, z);
});
let door = null, doorFacing = "north", doorDir = null;
if (frontCands.length) {
  const mid = (Math.min(...unique.map(c => c[0])) + Math.max(...unique.map(c => c[0]))) / 2;
  frontCands.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid));
  door = frontCands[0];
  doorDir = { dx: 0, dz: 1 }; // inward
} else {
  const any = unique.find(([x, z]) => isPerim(x, z) && !isCorner(x, z));
  if (any) {
    door = any;
    const m = miss(...any);
    if (m.S) { doorFacing = "south"; doorDir = { dx: 0, dz: -1 }; }
    else if (m.W) { doorFacing = "west"; doorDir = { dx: 1, dz: 0 }; }
    else { doorFacing = "east"; doorDir = { dx: -1, dz: 0 }; }
  }
}
if (door) {
  const [dx, dz] = door;
  const gr = gnd(dx, dz);
  g.set(dx, gr + 1, dz, "dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, gr + 2, dz, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // recessed entry: step over the base course in front of the door
  g.set(dx, gr, dz, BASE);
}

// ---- Pass 3: warm lights behind glass (inside the air gap) ----
for (const [x, z] of unique) {
  if (!isPerim(x, z) || isCorner(x, z)) continue;
  if (door && x === door[0] && z === door[1]) continue;
  const m = miss(x, z);
  const t = (m.N || m.S) ? x : z;
  if (t % 3 === 0) continue; // mullion
  // inward neighbour (must be interior air)
  let ix = x, iz = z;
  if (m.N) iz = z + 1;
  else if (m.S) iz = z - 1;
  else if (m.W) ix = x + 1;
  else if (m.E) ix = x - 1;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const gr = gnd(x, z);
  if (t % 6 === 1 && FLOOR2_Y >= gnd(ix, iz)) {
    // upper storey lantern standing on the second-floor slab
    g.set(ix, FLOOR2_Y + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  } else if (t % 6 === 2) {
    // ground storey lantern on the ground floor slab
    g.set(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// ---- Pass 4: rooftop water tank (2x2, interior, on the roof slab) ----
let best = null;
for (let x0 = 1; x0 <= W - 3; x0++) {
  for (let z0 = 1; z0 <= D - 3; z0++) {
    const quad = [[x0, z0], [x0 + 1, z0], [x0, z0 + 1], [x0 + 1, z0 + 1]];
    if (!quad.every(([x, z]) => has(x, z) && !isPerim(x, z) && gnd(x, z) <= ROOF_Y)) continue;
    const d = Math.abs(x0 - (W - 2) / 2) + Math.abs(z0 - (D - 2) / 2);
    if (!best || d < best.d) best = { x0, z0, d };
  }
}
if (best) {
  const { x0, z0 } = best;
  for (let y = PARAPET_Y; y <= PARAPET_Y + 1; y++) {
    for (const [x, z] of [[x0, z0], [x0 + 1, z0], [x0, z0 + 1], [x0 + 1, z0 + 1]]) {
      g.set(x, y, z, TANK);
    }
  }
  for (const [x, z] of [[x0, z0], [x0 + 1, z0], [x0, z0 + 1], [x0 + 1, z0 + 1]]) {
    g.set(x, PARAPET_Y + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
