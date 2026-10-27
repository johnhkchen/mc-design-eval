import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1970s concrete office block (9 storeys over a basalt plinth, the NW edge a lift-core strip rising to 56 blocks).
// White concrete frame and spandrels, light-blue glass ribbon windows between concrete mullions, a glazed ground floor
// with a door, plant on the roof, and warm glow behind some windows. Storeys are 4 blocks: y%4==0 floor deck,
// y%4==3 beam/spandrel (solid across the footprint, so every storey stands on the one below), y%4 in {1,2} the window
// band, air inside the envelope (no interiors).

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_170800701.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_170800701.nbt";
const W = 36, D = 32, H = 69;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const idx = (x, z) => z * W + x;
const raw = new Int16Array(W * D), on = new Uint8Array(W * D);
for (const [x, z, , r] of cells) { on[idx(x, z)] = 1; raw[idx(x, z)] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && on[idx(x, z)] === 1;

// Roof tiers: a 3x3 median of the lidar roof (zero = no return, left out), then down to whole storeys (4 blocks).
const roof = new Int16Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && raw[idx(nx, nz)] > 0) v.push(raw[idx(nx, nz)]);
  }
  v.sort((a, b) => a - b);
  const med = v.length ? v[v.length >> 1] : 36;
  roof[idx(x, z)] = Math.max(4, Math.floor(med / 4) * 4);
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the outward sides of a cell at height y: off the footprint, or beside a neighbour that stops below y
const sidesAt = (x, z, y) => DIRS.filter(([dx, dz]) => { const nx = x + dx, nz = z + dz; return !inside(nx, nz) || y >= roof[idx(nx, nz)]; });

// The entrance: the south-most flush face cell, nearest the middle of the block.
let door = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z) || inside(x, z + 1) || !inside(x - 1, z) || !inside(x + 1, z) || inside(x - 1, z + 1) || inside(x + 1, z + 1)) continue;
  if (!door || z > door.z || (z === door.z && Math.abs(x - 18) < Math.abs(door.x - 18))) door = { x, z };
}

const plan = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => { const e = { x, y, z, block, state }; plan.set(key(x, y, z), e); return e; };
const glass = [];

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const r = roof[idx(x, z)];
  for (let y = 0; y < r; y++) {
    if (y === 0) { put(x, y, z, "polished_basalt"); continue; }
    if (y % 4 === 0) { put(x, y, z, "light_gray_concrete"); continue; }     // floor deck / string course
    if (y % 4 === 3) { put(x, y, z, "white_concrete"); continue; }         // beam and spandrel
    const sides = sidesAt(x, z, y);
    if (!sides.length) continue;                                           // inside: air behind the glass
    const [dx, dz] = sides[0];
    const ground = y < 4;
    const corner = sides.length > 1;
    const along = dz !== 0 ? x : z;                                        // position along the face
    if (door && x === door.x && z === door.z) {                           // the entrance door, both halves
      const half = y === 1 ? "lower" : "upper";
      put(x, y, z, "iron_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const pilaster = door && z === door.z && Math.abs(x - door.x) === 1;   // stone either side of the door
    const pier = corner || pilaster || (!ground && along % 3 === 0);       // concrete mullions, corners
    if (pier) { put(x, y, z, "white_concrete"); continue; }
    const e = put(x, y, z, "light_blue_stained_glass_pane", {});
    glass.push({ e, dx, dz });
  }
  if (sidesAt(x, z, r - 1).length) put(x, r, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });   // parapet
}

// Panes join their in-plane neighbours that are panes or solid concrete, as a real window grid does.
for (const { e, dx, dz } of glass) {
  const across = dz !== 0 ? [["east", 1, 0], ["west", -1, 0]] : [["south", 0, 1], ["north", 0, -1]];
  const st = { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" };
  for (const [name, ox, oz] of across) {
    const nb = plan.get(key(e.x + ox, e.y, e.z + oz));
    if (nb && (nb.block === "light_blue_stained_glass_pane" || nb.block === "white_concrete")) st[name] = "true";
  }
  e.state = st;
}

// Warm light: a glowstone behind about one pane in eight, and a lantern inside the entrance.
for (const { e, dx, dz } of glass) {
  if ((e.x * 5 + e.y * 3 + e.z * 7) % 8 !== 0) continue;
  const ix = e.x - dx, iz = e.z - dz;
  if (!inside(ix, iz) || sidesAt(ix, e.y, iz).length || roof[idx(ix, iz)] <= e.y || plan.has(key(ix, e.y, iz))) continue;
  put(ix, e.y, iz, "glowstone");
}
if (door && inside(door.x, door.z - 1)) put(door.x, 1, door.z - 1, "lantern", { hanging: "false", waterlogged: "false" });

// Plant on the roof: two 3 x 2 units on the flat top of the body, kept off the edges.
let units = 0;
for (let z = 1; z < D - 2 && units < 2; z++) for (let x = 1; x < W - 3 && units < 2; x++) {
  let ok = true;
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) {
    const cx = x + dx, cz = z + dz;
    if (!inside(cx, cz) || roof[idx(cx, cz)] !== 36 || sidesAt(cx, cz, 35).length) ok = false;
  }
  if (!ok) continue;
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 3; dx++) {
    put(x + dx, 36, z + dz, "smooth_stone");
    put(x + dx, 37, z + dz, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
  units++; x += 5;
}

const g = new Voxels([W, H, D]);
for (const e of plan.values()) g.set(e.x, e.y, e.z, e.block, e.state);
console.log(g.save(OUT));
