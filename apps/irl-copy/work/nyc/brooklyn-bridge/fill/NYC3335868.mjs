import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3335868";
const W = 24, H = 27, D = 29;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(key(x, z), { x, z, gr: Math.round(gr), roof: Math.round(roof), top: 0 });
}
const inside = (x, z) => map.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const GLASS = { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" };
const SLAB_B = { type: "bottom", waterlogged: "false" };

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// One flat roof tier for the whole building (median of lidar), stepping only with the slope
const roofs = [...map.values()].map(c => c.roof).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const T = Math.max(9, Math.min(22, medRoof));

// Wall depth: 1 = exterior skin, >=2 = interior
const depth = new Map();
const q = [];
for (const c of map.values()) {
  const outer = DIRS.some(([dx, dz]) => !inside(c.x + dx, c.z + dz));
  if (outer) { depth.set(key(c.x, c.z), 1); q.push(c); }
}
while (q.length) {
  const c = q.shift();
  const d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const nx = c.x + dx, nz = c.z + dz;
    if (!inside(nx, nz) || depth.has(key(nx, nz))) continue;
    depth.set(key(nx, nz), d + 1);
    q.push(map.get(key(nx, nz)));
  }
}

const outwardOf = (c) => DIRS.filter(([dx, dz]) => !inside(c.x + dx, c.z + dz));

// Street face = north (min z). Door at the middle of that face's span.
const northXs = [];
for (const c of map.values()) {
  if (outwardOf(c).some(([dx, dz]) => dx === 0 && dz === -1)) northXs.push(c.x);
}
const doorX = northXs.length
  ? Math.round((Math.min(...northXs) + Math.max(...northXs)) / 2)
  : null;

// Pass 1: massing, foundations, walls, floors, roof deck
for (const c of map.values()) {
  const { x, z, gr } = c;
  const maxN = Math.max(1, Math.floor((24 - gr) / 3));
  const n = Math.max(2, Math.min(maxN, Math.round((T - gr) / 3)));
  const top = gr + 3 * n;
  c.top = top;

  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const d = depth.get(key(x, z));
  const outs = outwardOf(c);
  const [odx, odz] = outs[0] || [0, 0];
  const idx = odx !== 0 ? z : x;

  if (d === 1) {
    put(x, gr, z, "stone_bricks");
    for (let y = gr + 1; y < top; y++) {
      const rel = y - gr;
      if (rel <= 2) {
        // Ground storefront: piers and glass, header beam on top row
        if (rel === 2) {
          put(x, y, z, idx % 3 === 0 ? "stone_bricks" : "dark_oak_planks");
        } else {
          if (idx % 3 === 0) put(x, y, z, "stone_bricks");
          else put(x, y, z, "glass_pane", GLASS);
        }
      } else {
        const k = Math.floor(rel / 3);
        const b = gr + 3 * k;
        const r = y - b;
        const win = idx % 3 === 1;
        if (r === 0) put(x, y, z, win ? "stone_brick_slab" : "bricks");
        else if (r === 1) {
          if (win) put(x, y, z, "glass_pane", GLASS);
          else put(x, y, z, "bricks");
        } else put(x, y, z, win ? "stone_bricks" : "bricks");
      }
    }
    // Cornice band and crenellated parapet
    put(x, top, z, "stone_bricks");
    if (top + 1 <= 25 && (x + z) % 2 === 0) put(x, top + 1, z, "bricks");
  } else {
    // Interior: floor slabs per storey, air elsewhere, roof deck at top
    for (let k = 1; k < n; k++) {
      put(x, gr + 3 * k, z, "spruce_slab", SLAB_B);
    }
    put(x, top, z, "smooth_stone");
  }
}

// Pass 2: entrance on the street face, framed by pilasters and a lintel
if (doorX !== null) {
  const dc = map.get(key(doorX, map.get(key(doorX, 0)) ? 0 : 0));
  // find the north-face cell at doorX
  let face = null;
  for (const c of map.values()) {
    if (c.x === doorX && outwardOf(c).some(([dx, dz]) => dx === 0 && dz === -1)) { face = c; break; }
  }
  if (face) {
    const { gr, top } = face;
    const z = face.z;
    // door
    put(doorX, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(doorX, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // pilasters and lintel on the neighbouring north-face cells
    for (const dx of [-1, 1]) {
      const nc = map.get(key(doorX + dx, z));
      if (!nc) continue;
      const ncGr = nc.gr;
      put(doorX + dx, ncGr + 1, z, "stone_bricks");
      put(doorX + dx, ncGr + 2, z, "stone_bricks");
    }
    for (let dx = -1; dx <= 1; dx++) {
      const nc = map.get(key(doorX + dx, z));
      if (nc) put(doorX + dx, gr + 3, z, "stone_bricks");
    }
    // Light either side of the door
    for (const dx of [-1, 1]) {
      const nc = map.get(key(doorX + dx, z));
      if (nc) put(doorX + dx, nc.gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Pass 3: warm lights behind some windows
for (const c of map.values()) {
  const { x, z, gr, top } = c;
  if (depth.get(key(x, z)) !== 1) continue;
  const outs = outwardOf(c);
  const [odx, odz] = outs[0] || [0, 0];
  const idx = odx !== 0 ? z : x;
  for (let k = 1; top - (gr + 3 * k) >= 2; k++) {
    const b = gr + 3 * k;
    if (idx % 3 !== 1) continue;
    if (((x * 7 + z * 3 + k) % 4) !== 0) continue;
    const ix = x - odx, iz = z - odz;
    if (inside(ix, iz) && (depth.get(key(ix, iz)) || 0) >= 2) {
      put(ix, b + 1, iz, "shroomlight");
    }
  }
}

// Pass 4: rooftop water tanks (3x3 timber tanks on legs, with a conical cap)
const tankCentres = [[6, 8], [17, 8], [6, 20], [17, 20]];
for (const [tx, tz] of tankCentres) {
  const c = map.get(key(tx, tz));
  if (!c) continue;
  let ok = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!inside(tx + dx, tz + dz)) ok = false;
  }
  if (!ok || c.top + 5 > 26) continue;
  // legs at corners
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    for (let y = c.top + 1; y <= c.top + 2; y++) put(tx + dx, y, tz + dz, "oak_fence");
  }
  // tank body
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    put(tx + dx, c.top + 3, tz + dz, "spruce_planks");
    put(tx + dx, c.top + 4, tz + dz, "spruce_planks");
  }
  // roof cap
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    put(tx + dx, c.top + 5, tz + dz, "spruce_slab", SLAB_B);
  }
}

g.save(`${DIR}/${ID}.nbt`);
