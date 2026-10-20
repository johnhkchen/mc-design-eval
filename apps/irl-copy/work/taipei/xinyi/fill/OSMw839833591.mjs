import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise two-storey commercial block: white concrete frame, quartz cornice,
// glass-pane shopfront and upper window bands with air behind the glass,
// a central entrance, and a small roof penthouse with a lightning rod.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833591";
const W = 19, H = 23, D = 20;
const TOP = 10;              // roof deck (top of the 11-block massing)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const k = (x, z) => `${x},${z}`;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(k(x, z), Math.max(0, Math.min(TOP - 2, Math.round(gr))));
}

const g = new Voxels([W, H, D]);

// Footprint centroid
let sx = 0, sz = 0;
for (const kk of ground.keys()) { const [x, z] = kk.split(",").map(Number); sx += x; sz += z; }
const cx = sx / Math.max(1, ground.size);
const cz = sz / Math.max(1, ground.size);

// Depth from the outside: 0 = facade ring, 1 = air-gap ring, 2+ = solid core
const depth = new Map();
const queue = [];
for (const kk of ground.keys()) {
  const [x, z] = kk.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => !ground.has(k(x + dx, z + dz)))) {
    depth.set(kk, 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(k(x, z));
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz, nk = k(nx, nz);
    if (ground.has(nk) && !depth.has(nk)) {
      depth.set(nk, d + 1);
      queue.push([nx, nz]);
    }
  }
}

// Facade info for a depth-0 cell: outward normal and position along the wall
function facade(x, z) {
  if (depth.get(k(x, z)) !== 0) return null;
  const outs = DIRS.filter(([dx, dz]) => !ground.has(k(x + dx, z + dz)));
  if (outs.length !== 1) return { corner: true };
  const [dx, dz] = outs[0];
  return { corner: false, dx, dz, t: dx !== 0 ? z : x };
}

// Entrance: facade cell nearest the footprint's centre, preferring south-facing walls
let doorKey = null;
{
  const facades = [];
  for (const kk of ground.keys()) {
    const [x, z] = kk.split(",").map(Number);
    const f = facade(x, z);
    if (f && !f.corner && f.t % 3 !== 0) facades.push({ x, z, f });
  }
  const pref = facades.filter(o => o.f.dz === 1);
  const pool = pref.length ? pref : facades;
  pool.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx));
  if (pool.length) doorKey = k(pool[0].x, pool[0].z);
}
const doorCell = doorKey ? doorKey.split(",").map(Number) : null;
const doorFacing = doorCell ? FACING[(() => {
  const f = facade(doorCell[0], doorCell[1]);
  return f && !f.corner ? `${f.dx},${f.dz}` : "0,1";
})()] : "south";

function glassRow(gr, y) {
  return (y > gr && y < gr + 4) || (y > gr + 5 && y < TOP);
}

function glassAt(x, z, y) {
  const f = facade(x, z);
  if (!f || f.corner) return false;
  if (f.t % 3 === 0) return false;
  if (k(x, z) === doorKey) return false;
  return glassRow(ground.get(k(x, z)), y);
}

function panelProps(f) {
  const alongX = f.dz !== 0; // wall runs east-west
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
}

function doorProps(half) {
  return {
    facing: doorFacing,
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  };
}

function cellBlock(x, z, y, gr, d, f) {
  const st = gr + 5;
  if (y === TOP) return d === 0 ? ["smooth_quartz"] : ["gray_concrete"];

  if (d === 0) {
    if (y === gr) return ["polished_granite"];      // base course
    if (y === st) return ["smooth_quartz"];         // storey line
    if (f.corner || f.t % 3 === 0) return ["white_concrete"]; // pilasters / corners
    const isDoor = k(x, z) === doorKey;
    if (isDoor && (y === gr + 1 || y === gr + 2)) {
      return ["oak_door", doorProps(y === gr + 1 ? "lower" : "upper")];
    }
    if (isDoor && y === gr + 3) return ["polished_andesite"]; // door hood
    if (glassRow(gr, y)) return ["glass_pane", panelProps(f)];
    return ["smooth_stone"];                        // lintel band
  }

  if (y === gr || y === st) return ["white_concrete"]; // floor slabs

  if (d === 1) {
    let behind = false;
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (ground.has(k(nx, nz)) && depth.get(k(nx, nz)) === 0 && glassAt(nx, nz, y)) {
        behind = true;
      }
    }
    if (behind) {
      if (y === gr + 1 && (x + z) % 6 === 0) return ["glowstone"];
      if (y === st + 1 && (x + z) % 6 === 3) return ["shroomlight"];
      return null; // air gap behind the glass
    }
  }
  return ["white_concrete"];
}

// Build columns
const penthouse = [];
for (const [kk, gr] of ground) {
  const [x, z] = kk.split(",").map(Number);
  const d = depth.get(kk);
  const f = facade(x, z);

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= TOP; y++) {
    const spec = cellBlock(x, z, y, gr, d, f);
    if (!spec) continue;
    if (spec[1]) g.set(x, y, z, spec[0], spec[1]);
    else g.set(x, y, z, spec[0]);
  }

  // Parapet on the facade ring
  if (d === 0) g.set(x, TOP + 1, z, "quartz_slab", { type: "bottom", waterlogged: "false" });

  // Roof penthouse: central core on the roof deck
  if (d >= 3 && Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2) {
    penthouse.push([x, z]);
    g.set(x, TOP + 1, z, "light_gray_concrete");
    g.set(x, TOP + 2, z, "light_gray_concrete");
  }
}

// Lightning rod on the penthouse cell nearest the centre
if (penthouse.length) {
  penthouse.sort((a, b) => (Math.hypot(a[0] - cx, a[1] - cz)) - (Math.hypot(b[0] - cx, b[1] - cz)));
  const [rx, rz] = penthouse[0];
  g.set(rx, TOP + 3, rz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
