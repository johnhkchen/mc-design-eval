// 32 Eden: a 1980s reinforced-concrete office block with ground-floor shopfronts, 15 storeys of white precast
// concrete spandrels, pale string courses and mullions, and tinted glass in ribbon windows. The lidar roof sits at 60
// blocks (50 m) over a flat core, with a 56 block ring stepping down at the edges and a 52 block wing on the low corner.
// Built as a solid shell on the footprint (foundation fill from y 0 to each cell's ground), with an air gap behind each
// pane and a glowstone in some of them, so the glass reads at dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588389.cells.json", "utf8"));
const X = 32, Z = 36, Y = 74;
const key = (x, z) => x + "," + z;
const cell = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inFp = (x, z) => cell.has(key(x, z));

// roof tiers: the lidar's 3x3 median smooths the noise, then each cell takes the nearest 4-block storey line
const median = (a) => a.slice().sort((p, q) => p - q)[a.length >> 1];
const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const boundary = (x, z) => dirs.some(([dx, dz]) => !inFp(x + dx, z + dz));
const dist = new Map();
{
  const q = [];
  for (const [k] of cell) { const [x, z] = k.split(",").map(Number); if (boundary(x, z)) { dist.set(k, 0); q.push([x, z]); } }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i], d = dist.get(key(x, z));
    for (const [dx, dz] of dirs) { const k = key(x + dx, z + dz); if (inFp(x + dx, z + dz) && !dist.has(k)) { dist.set(k, d + 1); q.push([x + dx, z + dz]); } }
  }
}
const top = new Map();   // H: the building's top block is H - 1; the roof surface is at H
for (const [k, { r }] of cell) {
  const [x, z] = k.split(",").map(Number);
  const nb = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) nb.push(cell.get(key(x + dx, z + dz)).r);
  const q = Math.round(median(nb) / 4) * 4;
  let H = q >= 60 ? 60 : q === 56 ? 56 : 52;
  if (H === 60 && dist.get(k) <= 1) H = 56;      // the edge ring steps down a storey line
  top.set(k, H);
}
const H = (x, z) => (inFp(x, z) ? top.get(key(x, z)) : -1);
const G = (x, z) => cell.get(key(x, z)).g;

// the intended block at each cell; null = air
const out = new Map();
const put = (x, y, z, block, state) => out.set(`${x},${y},${z}`, block ? { block, state } : null);

for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number), h = top.get(k), g = G(x, z);
  for (let y = 0; y < h; y++) {
    const isEdgeTop = y === h - 1 && boundary(x, z);
    let b = "white_concrete";
    if (y < g || y === 0) b = "stone_bricks";                                  // foundation and base course
    else if (y === h - 1) b = boundary(x, z) ? "light_gray_concrete" : "gray_concrete";   // parapet and roof membrane
    else if (y === h - 2 && boundary(x, z)) b = "light_gray_concrete";                    // cornice course
    put(x, y, z, b);
  }
}

// the facade: each exposed face (a neighbour that is outside the footprint or lower than this block)
const doorCands = [];
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number), h = top.get(k), g = G(x, z);
  for (const [dx, dz] of dirs) {
    const nh = H(x + dx, z + dz);
    for (let y = Math.max(g, 0); y < h; y++) {
      if (!(nh < 0 || nh <= y)) continue;
      if (y >= h - 2) continue;   // cornice and parapet already set
      if (dz === 1 && y <= 1 && g <= 1) doorCands.push([x, y, z]);
    }
  }
}
// the entrance: a south-facing door bay on the ground floor, nearest the footprint's middle
const xs = [...new Set(doorCands.map(([x]) => x))].sort((a, b) => a - b);
const midX = xs.length ? xs[xs.length >> 1] : 16;
let doorX = null, doorZ = null;
{
  const cand = cells.filter(([x, z, g]) => g <= 1 && !inFp(x, z + 1) && z + 1 >= 0).sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
  if (cand.length) { doorX = cand[0][0]; doorZ = cand[0][1]; }
}

const faces = [];   // [x, y, z, dx, dz] for every exposed facade block
for (const [k] of cell) {
  const [x, z] = k.split(",").map(Number), h = top.get(k), g = G(x, z);
  for (const [dx, dz] of dirs) {
    const nh = H(x + dx, z + dz);
    for (let y = g; y < h - 2; y++) if (nh < 0 || nh <= y) faces.push([x, y, z, dx, dz]);
  }
}
const seen = new Set();
const pane = new Set();
for (const [x, y, z, dx, dz] of faces) {
  const k = `${x},${y},${z}`;
  if (seen.has(k)) continue;                 // a corner takes its first face
  seen.add(k);
  const u = dx !== 0 ? z : x;                // the coordinate that runs along the facade
  const sideOut = (du) => { const nx = dx !== 0 ? x : x + du, nz = dx !== 0 ? z + du : z; return !inFp(nx, nz) || H(nx, nz) <= y; };
  const corner = sideOut(-1) || sideOut(1);
  let block;
  if (y === 0) block = "stone_bricks";                                          // base course
  else if (x === doorX && z === doorZ && (y === 1 || y === 2)) {                // the entrance, on the south face
    put(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    put(x, y, z - 1, "air");                                                     // a hall behind the door
    continue;
  }
  else if (y % 4 === 0) block = "light_gray_concrete";                         // string course at each storey line
  else if (y % 4 === 3) block = "white_concrete";                              // spandrel below each window
  else if (corner || u % 3 === 0) block = "light_gray_concrete";              // mullions, corners
  else block = "light_blue_stained_glass_pane";
  if (block === "light_blue_stained_glass_pane") {
    pane.add(k);
    put(x, y, z, block);
    // an air gap behind the glass, with a glowstone in some of them
    const ix = x - dx, iz = z - dz;
    if (inFp(ix, iz) && y < H(ix, iz)) {
      const hsh = ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
      put(ix, y, iz, hsh % 5 === 0 && y > 1 ? "glowstone" : null);
    }
  } else put(x, y, z, block);
}

// pane connections to their in-plane neighbours
for (const k of pane) {
  const [x, y, z] = k.split(",").map(Number);
  const isSolid = (xx, yy, zz) => { const v = out.get(`${xx},${yy},${zz}`); return !!v; };
  const st = {};
  if (isSolid(x, y, z - 1) || isSolid(x, y, z + 1)) { st.north = isSolid(x, y, z - 1) ? "true" : "false"; st.south = isSolid(x, y, z + 1) ? "true" : "false"; }
  if (isSolid(x - 1, y, z) || isSolid(x + 1, y, z)) { st.west = isSolid(x - 1, y, z) ? "true" : "false"; st.east = isSolid(x + 1, y, z) ? "true" : "false"; }
  const state = { north: st.north ?? "false", south: st.south ?? "false", east: st.east ?? "false", west: st.west ?? "false" };
  out.set(k, { block: "light_blue_stained_glass_pane", state });
}

// roof plant: two low boxes on the flat core, standing on the roof surface
const core = cells.filter(([x, z]) => top.get(key(x, z)) === 60 && dist.get(key(x, z)) >= 3).map(([x, z]) => [x, z]);
const cx = Math.round(core.reduce((s, [x]) => s + x, 0) / core.length), cz = Math.round(core.reduce((s, [, z]) => s + z, 0) / core.length);
const boxes = [[cx - 3, cz - 2, 6, 4], [cx + 1, cz + 2, 4, 3]];
for (const [bx, bz, w, d] of boxes) {
  let ok = true;
  for (let x = bx; x < bx + w; x++) for (let z = bz; z < bz + d; z++) if (!inFp(x, z) || top.get(key(x, z)) !== 60 || dist.get(key(x, z)) < 2) ok = false;
  if (!ok) continue;
  for (let x = bx; x < bx + w; x++) for (let z = bz; z < bz + d; z++) {
    for (let y = 60; y <= 61; y++) put(x, y, z, y === 61 ? "light_gray_concrete" : "white_concrete");
  }
  // a louvred front on the box's south side
  for (let x = bx + 1; x < bx + w - 1; x++) put(x, 60, bz + d - 1, "light_gray_concrete");
}

const g = new Voxels([X, Y, Z]);
for (const [k, v] of out) {
  if (!v) continue;
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588389.nbt");
console.log(JSON.stringify({ cells: cells.length, door: [doorX, doorZ], core: [cx, cz], ...info }));
