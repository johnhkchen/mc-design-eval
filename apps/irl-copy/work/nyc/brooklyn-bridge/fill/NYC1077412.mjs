import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1077412";
const W = 31, H = 46, D = 24;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const k = (x, z) => `${x},${z}`;
const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

// ---- footprint and lidar massing -------------------------------------------
const C = new Map();
for (const [x, z, gnd, roof] of cells) {
  C.set(k(x, z), { x, z, g: Math.max(0, Math.min(gnd, H - 12)), r: roof });
}

// smooth lidar noise with a 3x3 mean, then quantise to 4-block tiers
for (const c of C.values()) {
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const o = C.get(k(c.x + dx, c.z + dz));
    if (o) { s += o.r; n++; }
  }
  const t = Math.round((s / n) / 4) * 4;
  c.T = Math.min(44, Math.max(c.g + 6, t));
}

// distance from the outside edge (1 = perimeter cell)
const dist = new Map();
const queue = [];
for (const c of C.values()) {
  if (DIRS.some(d => !C.has(k(c.x + d.dx, c.z + d.dz)))) {
    dist.set(k(c.x, c.z), 1);
    queue.push(c);
  }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d0 = dist.get(k(c.x, c.z));
  for (const d of DIRS) {
    const key = k(c.x + d.dx, c.z + d.dz);
    if (C.has(key) && !dist.has(key)) {
      dist.set(key, d0 + 1);
      queue.push(C.get(key));
    }
  }
}

// one clean setback: the perimeter ring of tall parts steps down 4 blocks
for (const c of C.values()) {
  if (dist.get(k(c.x, c.z)) === 1 && c.T - c.g >= 16) {
    c.T = Math.max(c.g + 6, c.T - 4);
  }
}

// a voxel is wall if it is open to air (outside footprint, or above a lower neighbour)
function exposed(x, y, z) {
  const c = C.get(k(x, z));
  if (!c || y < c.g || y >= c.T) return null;
  for (const d of DIRS) {
    const o = C.get(k(x + d.dx, z + d.dz));
    if (!o || y >= o.T) return d;
  }
  return null;
}

// ---- facade -----------------------------------------------------------------
const lights = [];

function facade(c, y, face) {
  const h = y - c.g;
  const u = (face.name === "north" || face.name === "south") ? c.x : c.z;

  if (y === c.T - 1) return ["smooth_stone"];          // cornice / parapet
  if (h === 0) return ["polished_granite"];            // base course

  if (h <= 2) {                                        // commercial ground storey
    const m = u % 12;
    if (m === 6) {                                     // entrance door
      return ["oak_door", {
        facing: face.name,
        half: h === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      }];
    }
    if (m === 5 || m === 7) return ["polished_granite"]; // door surround pilasters
    if (u % 4 === 0) return ["bricks"];                // shopfront piers
    if (h === 1 && u % 8 === 2) lights.push(["in", c, y, face]);
    return ["glass"];
  }

  if (h === 3) return ["stone_bricks"];                // entrance lintel / floor band
  if (h % 2 === 1) return ["white_concrete"];          // floor string course / sills

  // upper residential storeys: window bays between brick piers
  if (u % 3 === 0) return ["bricks"];
  if (u % 6 === 1) lights.push(["in", c, y, face]);
  return ["glass"];
}

// ---- build ------------------------------------------------------------------
const g = new Voxels([W, H, D]);

for (const c of C.values()) {
  for (let y = 0; y < c.T; y++) {
    if (y < c.g) {
      g.set(c.x, y, c.z, "stone_bricks");
      continue;
    }
    const face = exposed(c.x, y, c.z);
    if (face) {
      const [block, props] = facade(c, y, face);
      if (props) g.set(c.x, y, c.z, block, props);
      else g.set(c.x, y, c.z, block);
      continue;
    }
    const h = y - c.g;
    if (y === c.T - 1) g.set(c.x, y, c.z, "stone");                    // light roof membrane
    else if (h === 0 || (h >= 3 && h % 2 === 1)) g.set(c.x, y, c.z, "smooth_stone"); // floor slab
    // else: air gap behind the glass
  }
}

// warm light behind some windows (inside the air gap, not on the facade)
for (const [, c, y, face] of lights) {
  const ix = c.x - face.dx;
  const iz = c.z - face.dz;
  const ic = C.get(k(ix, iz));
  if (!ic) continue;
  if (y < ic.g || y >= ic.T) continue;
  if (exposed(ix, y, iz)) continue;
  g.set(ix, y, iz, "glowstone");
}

// rooftop water tank on a flat, interior 2x2 patch near the centre of mass
{
  let cx = 0, cz = 0, n = 0;
  for (const c of C.values()) { cx += c.x; cz += c.z; n++; }
  cx /= n; cz /= n;

  let best = null, bestD = Infinity;
  for (const c of C.values()) {
    const quad = [[c.x, c.z], [c.x + 1, c.z], [c.x, c.z + 1], [c.x + 1, c.z + 1]];
    const cs = quad.map(([x, z]) => C.get(k(x, z)));
    if (cs.some(o => !o)) continue;
    if (cs.some(o => o.T !== c.T)) continue;
    if (cs.some(o => (dist.get(k(o.x, o.z)) ?? 0) < 3)) continue;
    if (c.T + 3 > H - 1 || c.T > 40) continue;
    const dd = Math.hypot(c.x + 0.5 - cx, c.z + 0.5 - cz);
    if (dd < bestD) { bestD = dd; best = { x: c.x, z: c.z, T: c.T }; }
  }
  if (best) {
    for (let y = best.T; y <= best.T + 2; y++) {
      for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) {
        g.set(best.x + dx, y, best.z + dz, "spruce_planks");
      }
    }
    for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) {
      g.set(best.x + dx, best.T + 3, best.z + dz, "spruce_slab", { type: "top", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
