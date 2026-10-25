import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Produits Regionaux LEFRANC: two-storey granite shop-house with a hipped slate roof,
// shopfront on the ground floor, a framed entrance, warm lights behind some glass.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR2000258768";
const W = 33, H = 25, D = 40;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const K = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, ground, roof] of cells) info.set(K(x, z), { ground, roof });
const inside = (x, z) => info.has(K(x, z));

const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const VEC = { east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1] };

// Distance (in cells) from the outer edge of the footprint; edge cells = 1.
const dist = new Map();
let frontier = [];
for (const k of info.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz))) {
    dist.set(k, 1);
    frontier.push([x, z]);
  }
}
while (frontier.length) {
  const next = [];
  for (const [x, z] of frontier) {
    const d = dist.get(K(x, z));
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz, nk = K(nx, nz);
      if (inside(nx, nz) && !dist.has(nk)) {
        dist.set(nk, d + 1);
        next.push([nx, nz]);
      }
    }
  }
  frontier = next;
}

// Smoothed lidar roof per cell (3x3 mean), then one building-wide roof tier
// so the eaves and ridge read as clean flat courses.
function roofAt(x, z) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const k = K(x + dx, z + dz);
    if (info.has(k)) { s += info.get(k).roof; n++; }
  }
  return s / n;
}
const roofVals = [];
for (const k of info.keys()) {
  const [x, z] = k.split(",").map(Number);
  roofVals.push(roofAt(x, z));
}
roofVals.sort((a, b) => a - b);
const roofTier = Math.round(roofVals[roofVals.length >> 1]);

// Outward facade direction of an edge cell (first outside neighbour), or null.
function facadeDir(x, z) {
  for (const [dx, dz, name] of DIRS) if (!inside(x + dx, z + dz)) return name;
  return null;
}

// Per-cell massing profile.
const groundMin = Math.min(...[...info.values()].map(v => v.ground));
const wt = Math.max(groundMin + 6, roofTier - 3); // common eave height (absolute)
const prof = [];
for (const [k, { ground }] of info) {
  const [x, z] = k.split(",").map(Number);
  const g = ground;
  const wtCell = Math.max(g + 6, wt);
  const rise = Math.max(2, roofTier - wtCell);
  const d = dist.get(k) ?? 1;
  prof.push({ x, z, g, wt: wtCell, rise, d });
}

// Entrance: south-facing facade cell nearest the middle of the front.
let doorX = null;
{
  let best = Infinity;
  for (const p of prof) {
    if (p.d === 1 && facadeDir(p.x, p.z) === "south" && Math.abs(p.x - (W >> 1)) < best) {
      best = Math.abs(p.x - (W >> 1));
      doorX = p.x;
    }
  }
}
const doorZ = doorX === null ? null : (() => {
  let z = -1;
  for (const p of prof) if (p.x === doorX && p.d === 1 && facadeDir(p.x, p.z) === "south") z = Math.max(z, p.z);
  return z;
})();

const out = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) out.set(x, y, z, b, p); else out.set(x, y, z, b);
};

// Facade block for a wall cell at relative height r.
function facadeBlock(p, fac, r) {
  const t = (fac === "north" || fac === "south") ? p.x : p.z;
  const m = r % 5;
  if (m === 0) return "stone_bricks";                      // floor course
  if (m === 4) return r < 5 ? "dark_oak_planks" : "polished_granite"; // shop fascia / lintel
  const isEntrance = fac === "south" && p.z === doorZ && Math.abs(p.x - doorX) <= 1;
  if (isEntrance) {
    if (p.x === doorX) {
      if (r === 1) return "door_lower";
      if (r === 2) return "door_upper";
      return "stone_bricks";                                // lintel above door
    }
    return r < 5 ? "dark_oak_planks" : "granite";           // door jambs
  }
  if (t % 4 === 0 || t % 4 === 3) return r < 5 ? "spruce_planks" : "granite";
  return "glass";
}

// Pass 1: foundation, walls, floors, ceilings.
for (const p of prof) {
  const { x, z, g: gr, wt: wtc, d } = p;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  const fac = d === 1 ? facadeDir(x, z) : null;
  for (let y = gr; y < wtc; y++) {
    const r = y - gr;
    if (d === 1 && fac) {
      const b = facadeBlock(p, fac, r);
      if (b === "door_lower") {
        put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (b === "door_upper") {
        put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, b);
      }
    } else {
      if (r % 5 === 0) put(x, y, z, "smooth_stone");          // storey floor slab
      else if (y === wtc - 1) put(x, y, z, "smooth_stone");   // ceiling under roof
    }
  }
}

// Pass 2: hipped roof of stepped stairs over solid cores; each column stands on its wall top.
for (const p of prof) {
  const { x, z, wt: wtc, rise, d } = p;
  const top = wtc + Math.min(d, rise);
  for (let y = wtc; y <= top - 2; y++) put(x, y, z, "stone_bricks");
  if (d < rise) {
    let facing = null;
    for (const [dx, dz, name] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (!inside(nx, nz)) { if (d === 1) { facing = name; break; } continue; }
      if (dist.get(K(nx, nz)) === d - 1) { facing = name; break; }
    }
    if (facing) {
      put(x, top - 1, z, "deepslate_tile_stairs",
        { facing, half: "bottom", shape: "straight", waterlogged: "false" });
    } else {
      put(x, top - 1, z, "deepslate_tiles");
    }
  } else {
    put(x, top - 1, z, "deepslate_tiles");
  }
}

// Pass 3: entrance lanterns on the ceiling line inside the door, warm glow behind some glass.
if (doorX !== null) {
  const ix = doorX, iz = doorZ - 1;
  if (inside(ix, iz)) put(ix, (prof.find(p => p.x === ix && p.z === iz).g) + 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
}
for (const p of prof) {
  const { x, z, g: gr, wt: wtc, d } = p;
  if (d !== 1) continue;
  const fac = facadeDir(x, z);
  if (!fac) continue;
  if (((x * 7 + z * 3) % 5) !== 0) continue;
  const t = (fac === "north" || fac === "south") ? x : z;
  if (t % 4 === 0 || t % 4 === 3) continue;
  const [vx, vz] = VEC[fac];
  const ix = x - vx, iz = z - vz;
  if (!inside(ix, iz)) continue;
  for (const r of [2, 7]) {
    const y = gr + r;
    if (y < wtc - 1 && y % 5 !== 0 && r % 5 !== 4) put(ix, y, iz, "glowstone");
  }
}

// Pass 4: chimneys on the flat part of the roof.
function nearestPlateau(tx, tz) {
  let best = null, bd = Infinity;
  for (const p of prof) {
    if (p.d < p.rise) continue;
    const dd = Math.abs(p.x - tx) + Math.abs(p.z - tz);
    if (dd < bd) { bd = dd; best = p; }
  }
  return best;
}
for (const [tx, tz] of [[8, 12], [25, 27]]) {
  const p = nearestPlateau(tx, tz);
  if (!p) continue;
  const top = p.wt + p.rise;
  for (let y = top; y < top + 3; y++) put(p.x, y, p.z, "stone_bricks");
  put(p.x, top + 3, p.z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

out.save(`${DIR}/${ID}.nbt`);
