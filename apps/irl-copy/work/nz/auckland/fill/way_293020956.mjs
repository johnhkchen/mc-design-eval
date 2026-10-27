// Way 293020956, Mt Eden / Newton: a 1960s-70s concrete office block. A two-storey wing on the south, a four-storey
// podium and a five-storey tower core on the north, on three flat tiers smoothed from the lidar roof. Concrete piers
// and spandrels, recessed glazing with panes set two deep, a plinth and string courses, a shopfront with a door and
// canopy on the north face, a roof membrane with plant and a lift overrun, and warm lights behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293020956.cells.json`, "utf8"));   // [x, z, ground, roof] per cell
const SIZE = [34, 34, 36];
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];   // E, W, S, N
const key = (x, z) => `${x},${z}`;

// the lidar roof, smoothed by a 3x3 median and cut into three flat tiers: wing 10, podium 18, tower 22
const roof = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const median = (v) => { const s = [...v].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const topOf = new Map();
for (const [x, z] of cells) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (roof.has(key(x + dx, z + dz))) vals.push(roof.get(key(x + dx, z + dz)));
  const m = median(vals);
  topOf.set(key(x, z), m >= 20 ? 22 : m >= 15 ? 18 : 10);
}
const T = (x, z) => topOf.get(key(x, z)) ?? 0;                       // 0 outside the footprint
const occ = (x, z, y) => y >= 0 && T(x, z) > y;                    // a solid volume cell in this column
const G = (x, z) => cells.find(([a, b]) => a === x && b === z)?.[2] ?? 0;

// depth: steps from the outside wall at this height (1 = the envelope, 2 = behind it, ...), by multi-source BFS per y
const depth = new Map();
const D = (x, z, y) => depth.get(`${x},${z},${y}`) ?? 0;
for (let y = 0; y < 24; y++) {
  const q = [];
  for (const [x, z] of cells) {
    if (!occ(x, z, y) || !NB.some(([dx, dz]) => !occ(x + dx, z + dz, y))) continue;
    depth.set(`${x},${z},${y}`, 1); q.push([x, z]);
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i], d = D(x, z, y);
    for (const [dx, dz] of NB) {
      const a = x + dx, b = z + dz;
      if (occ(a, b, y) && !depth.has(`${a},${b},${y}`)) { depth.set(`${a},${b},${y}`, d + 1); q.push([a, b]); }
    }
  }
}

// the envelope cell a deeper cell sits behind, and the outward direction of that wall
const facade = (x, z, y) => {
  let a = x, b = z, d = D(x, z, y);
  while (d > 1) { const [dx, dz] = NB.find(([dx, dz]) => D(a + dx, b + dz, y) === d - 1); a += dx; b += dz; d--; }
  const [dx, dz] = NB.find(([dx, dz]) => !occ(a + dx, b + dz, y));
  return { x: a, z: b, dx, dz };
};
const storey = (y) => Math.floor((y - 2) / 4);                      // storeys start at y 2 and are 4 tall
const along = (c) => (c.dz !== 0 ? c.x : c.z);                      // position along the wall
// piers on a 3-block bay grid above, a 6-block grid for the glazed shopfront
const isPier = (c, y) => along(c) % (storey(y) === 0 ? 6 : 3) === 0;

// the main door: the north-facing ground-floor window bay nearest the middle of the north face
const northBays = cells.filter(([x, z, g]) => g <= 3 && D(x, z, 3) === 1 && !occ(x, z - 1, 3) && !isPier({ x, z, dz: -1 }, 3));
const xs = northBays.map(([x]) => x).sort((a, b) => a - b);
const midX = xs[Math.floor(xs.length / 2)];
const door = northBays.length ? northBays.reduce((best, c) => (Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best)) : null;
const doorAt = door ? { x: door[0], z: door[1] } : null;

const blocks = new Map();
const put = (x, y, z, name, state) => blocks.set(`${x},${y},${z}`, { name, state });
const hasBlock = (x, y, z) => blocks.has(`${x},${y},${z}`);
// the door's frame: piers two cells either side of it, so the canopy above is carried, not hung
const doorPier = (x, y, z) => doorAt && Math.abs(x - doorAt.x) === 2 && (z === doorAt.z || z === doorAt.z + 1) && (y === 3 || y === 4);

for (const [x, z, g] of cells) {
  const t = T(x, z), base = Math.max(g, 2);
  for (let y = 0; y < t; y++) {
    if (y < base) { put(x, y, z, "stone_bricks"); continue; }          // plinth and base course, down to the ground
    const d = D(x, z, y), r = (y - 2) % 4, k = storey(y), topStorey = 2 + 4 * (k + 1) === t;
    if (r === 0) { put(x, y, z, d <= 2 ? "white_concrete" : "stone"); continue; }   // string course and floor slab
    if (r === 1 || r === 2) {
      if (d === 1 || d === 2) {
        const c = facade(x, z, y), pier = isPier(c, y) || doorPier(x, y, z);
        if (pier) put(x, y, z, "light_gray_concrete");
        else if (d === 2) put(x, y, z, "light_blue_stained_glass_pane", {});   // panes two deep, recessed one
      } else if (d === 4) {
        const c = facade(x, z, y);
        if (r === 1 && !isPier(c, y) && (along(c) * 3 + k * 5) % 7 === 0) put(x, y, z, "glowstone");   // warm light behind some panes
      }
      continue;
    }
    // r === 3: spandrel and parapet on the envelope, the roof membrane over the top storey
    if (d === 1 || d === 2) put(x, y, z, "white_concrete");
    else if (topStorey) put(x, y, z, "smooth_stone");
  }
  // cornice on the edge of each column top, where no taller neighbour stands
  if (NB.some(([dx, dz]) => T(x + dx, z + dz) < t)) put(x, t, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// canopy over the door (dark band at y 5 on the envelope and behind it), the door, and its hanging lanterns
if (doorAt) {
  for (let x = doorAt.x - 2; x <= doorAt.x + 2; x++) for (const z of [doorAt.z, doorAt.z + 1]) {
    if (hasBlock(x, 5, z)) put(x, 5, z, "black_concrete");
  }
  const lower = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
  put(doorAt.x, 3, doorAt.z, "iron_door", lower);
  put(doorAt.x, 4, doorAt.z, "iron_door", { ...lower, half: "upper" });
  for (const dx of [-2, 2]) {
    const x = doorAt.x + dx;
    if (!hasBlock(x, 4, doorAt.z) && D(x, doorAt.z, 4) === 1 && !isPier({ x, z: doorAt.z, dz: -1 }, 4)) {
      put(x, 4, doorAt.z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// roof plant: a 2x2 box on the wing and on the podium roof, and a lift overrun over the tower core
for (const t of [10, 18]) {
  for (const [x, z] of cells) {
    if (x % 8 !== 4 || z % 7 !== 3) continue;
    const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
    if (!quad.every(([a, b]) => T(a, b) === t && D(a, b, t - 1) >= 3)) continue;
    for (const [a, b] of quad) { put(a, t, b, "light_gray_concrete"); put(a, t + 1, b, "light_gray_concrete"); }
  }
}
const tower = cells.filter(([x, z]) => T(x, z) === 22);
if (tower.length) {
  const cx = Math.round(tower.reduce((s, [x]) => s + x, 0) / tower.length);
  const cz = Math.round(tower.reduce((s, [, z]) => s + z, 0) / tower.length);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz;
    if (T(x, z) === 22 && D(x, z, 21) >= 3) { put(x, 22, z, "light_gray_concrete"); put(x, 23, z, "light_gray_concrete"); }
  }
}

// glass panes connect to the solid or pane neighbours in their wall plane
const PANE = "light_blue_stained_glass_pane";
for (const [k, b] of blocks) {
  if (b.name !== PANE) continue;
  const [x, y, z] = k.split(",").map(Number);
  const side = (dx, dz) => (hasBlock(x + dx, y, z + dz) ? "true" : "false");
  b.state = { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" };
}

const g = new Voxels(SIZE);
for (const [k, b] of blocks) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, b.name, b.state);
}
const out = `${DIR}/way_293020956.nbt`;
const info = g.save(out);
console.log(JSON.stringify({ file: out, ...info, columns: cells.length, tiers: { wing: 10, podium: 18, tower: 22 } }));
