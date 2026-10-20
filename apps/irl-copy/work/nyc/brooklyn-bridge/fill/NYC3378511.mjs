import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3378511.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3378511.nbt";
const W = 40, H = 19, D = 41;

// Parse footprint: [x, z, ground, roof] per cell (tolerates {x,z,ground,roof} objects)
const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells || raw.footprint || []);
const cells = [];
for (const c of list) {
  let x, z, g0, r0;
  if (Array.isArray(c)) [x, z, g0, r0] = c;
  else ({ x, z, ground: g0, roof: r0 } = c);
  x = Math.round(x); z = Math.round(z);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cells.push({ x, z, g0: Math.round(g0 ?? 0), r0: Math.round(r0 ?? 7) });
}

const key = (x, z) => `${x},${z}`;
const byKey = new Map(cells.map(c => [key(c.x, c.z), c]));
const has = (x, z) => byKey.has(key(x, z));

// Smooth ground: average over the 3x3 neighbourhood inside the footprint, then round
for (const c of cells) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = byKey.get(key(c.x + dx, c.z + dz));
    if (o) { sum += o.g0; n++; }
  }
  c.g = Math.max(0, Math.min(H - 4, Math.round(sum / n)));
}

// Uniform roof: median of lidar roof heights, so the parapet is one clean line
const rs = cells.map(c => c.r0).sort((a, b) => a - b);
const R = Math.max(7, Math.min(H, rs[Math.floor(rs.length / 2)]));
for (const c of cells) {
  c.top = Math.min(H - 1, Math.max(R, c.g + 3) - 1);
}

function sides(x, z) {
  return { N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) };
}

// Entrance: one door on the most central open street-facing wall
const northEdge = cells.filter(c => { const s = sides(c.x, c.z); return s.N && !(s.W || s.E); });
let doorFacing = null, doorCell = null;
const pickDoor = (arr, facing) => {
  const xs = arr.map(c => c.x).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  return { cell: arr.reduce((a, b) => (Math.abs(b.x - mid) < Math.abs(a.x - mid) ? b : a)), facing };
};
if (northEdge.length) {
  ({ cell: doorCell, facing: doorFacing } = pickDoor(northEdge, "north"));
} else {
  const southEdge = cells.filter(c => { const s = sides(c.x, c.z); return s.S && !(s.W || s.E); });
  if (southEdge.length) ({ cell: doorCell, facing: doorFacing } = pickDoor(southEdge, "south"));
}
const doorKey = doorCell ? key(doorCell.x, doorCell.z) : null;

const g = new Voxels([W, H, D]);

const BRICK = "bricks";
const FOUND = "stone_bricks";
const BASE = "polished_granite";
const STRING = "smooth_stone";
const CORNICE = "stone_bricks";
const ROOF = "smooth_stone";
const GLASS = "glass";
const LIGHT = "glowstone";

for (const c of cells) {
  const { x, z, g: gr, top } = c;
  const s = sides(x, z);
  const edge = s.N || s.S || s.W || s.E;
  const corner = (s.N || s.S) && (s.W || s.E);
  const u = (s.N || s.S) ? x : z;
  const pier = corner || (u % 3 === 0);

  // foundation up to smoothed ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  for (let y = gr; y <= top; y++) {
    const k = y - gr;
    if (y === top) {
      g.set(x, y, z, edge ? CORNICE : ROOF);
      continue;
    }
    if (!edge) {
      // interior: floor slabs on even storey rows, air behind glass, occasional lamp
      if (k % 2 === 0) g.set(x, y, z, "stone_bricks");
      else if (k >= 1 && ((x * 5 + z * 3 + y * 7) % 13 === 0)) g.set(x, y, z, LIGHT);
      continue;
    }
    // exterior wall
    if (k === 0) { g.set(x, y, z, BASE); continue; }
    if (k % 2 === 0) { g.set(x, y, z, STRING); continue; }

    // entrance: door at k=1..2, canopy slab at k=3 across the door and its neighbours
    if (key(x, z) === doorKey) {
      if (k === 1) { g.set(x, y, z, "dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (k === 2) { g.set(x, y, z, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    }
    if (k === 3 && doorCell) {
      const along = (doorFacing === "north" || doorFacing === "south") ? [x, z] : [z, x];
      const near = Math.abs(u - (doorCell.x === x && doorCell.z === z ? u : u)) <= 0; // placeholder, replaced below
    }
    if (k === 3 && doorCell && edge) {
      const uDoor = (doorFacing === "north" || doorFacing === "south") ? doorCell.x : doorCell.z;
      const sameWall = ((s.N || s.S) === ((doorFacing === "north" || doorFacing === "south")));
      if (sameWall && Math.abs(u - uDoor) <= 1) {
        g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
    }
    if (pier) g.set(x, y, z, BRICK);
    else g.set(x, y, z, GLASS);
  }
}

g.save(OUT);
