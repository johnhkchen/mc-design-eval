// University Hall Apartments: a cream-plaster apartment block on a stone plinth. Four storeys (4-block storeys on
// absolute lines, so every floor is level across the site) with a set-back fifth storey over the high north-west
// side; the low east face carries the recessed entrance. Walls are a one-block skin with windows (glass panes, air
// behind them, warm glowstone in some), over a solid core, so nothing floats and there are no rooms to furnish.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_153707079.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 49, H = 32, D = 44;
const TOP_BODY = 16;     // four storeys
const TOP_TOWER = 19;    // the set-back fifth storey (lidar roof 19 on the high side)
const AXES = [[1, 0], [-1, 0], [0, 1], [0, -1]];   // E, W, S, N (z grows south)

const K = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [K(x, z), { g, r }]));
const inF = (x, z) => foot.has(K(x, z));
const cell = (x, z) => foot.get(K(x, z));
const key3 = (x, y, z) => `${x},${y},${z}`;

// steps from the outside edge, 4-neighbour: depth 0 is the skin ring
const depth = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (AXES.some(([dx, dz]) => !inF(x + dx, z + dz))) { depth.set(K(x, z), 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = depth.get(K(x, z));
  for (const [dx, dz] of AXES) {
    const nx = x + dx, nz = z + dz;
    if (!inF(nx, nz) || depth.has(K(nx, nz))) continue;
    depth.set(K(nx, nz), d + 1); queue.push([nx, nz]);
  }
}
const depthOf = (x, z) => depth.get(K(x, z)) ?? 0;

// the lidar roof smoothed over a 7 x 7 window of footprint cells: clean tiers, not noise
const smoothRoof = (x, z) => {
  let s = 0, n = 0;
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    const c = cell(x + dx, z + dz); if (c) { s += c.r; n++; }
  }
  return s / n;
};
const isTower = (x, z) => inF(x, z) && depthOf(x, z) >= 2 && smoothRoof(x, z) >= 17.5;
const topOf = (x, z) => (isTower(x, z) ? TOP_TOWER : TOP_BODY);

// occupied: the foundation under the ground, then the body up to its tier
const occ = (x, y, z) => { const c = cell(x, z); return !!c && y < topOf(x, z); };
// outward normal of a skin cell (first exposed side), or null for the core
const normalOf = (x, y, z) => {
  if (!occ(x, y, z)) return null;
  for (const n of AXES) if (!occ(x + n[0], y, z + n[1])) return n;
  return null;
};

// the entrance: the lowest east-facing skin cell nearest the middle of that face
const eastSkin = cells.filter(([x, z, g]) => { const n = normalOf(x, g, z); return n && n[0] === 1; });
const minG = Math.min(...eastSkin.map(c => c[2]));
const lowEast = eastSkin.filter(c => c[2] <= minG + 1);
const zMid = lowEast.reduce((s, c) => s + c[1], 0) / lowEast.length;
const [dxE, dzE, gE] = lowEast.reduce((a, b) => (Math.abs(b[1] - zMid) < Math.abs(a[1] - zMid) ? b : a));
const door = { x: dxE, z: dzE, y: gE };

// per-key overrides: entrance pieces and the lobby air behind the door
const over = new Map();
const lobby = new Set();
over.set(key3(door.x, door.y, door.z), { block: "oak_door", state: { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" } });
over.set(key3(door.x, door.y + 1, door.z), { block: "oak_door", state: { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" } });
for (const dz of [-1, 0, 1]) {
  over.set(key3(door.x, door.y + 2, door.z + dz), { block: "smooth_stone" });                       // lintel over the porch
  if (dz !== 0) {
    over.set(key3(door.x, door.y, door.z + dz), { block: "stone_bricks" });                         // plinth either side
    over.set(key3(door.x, door.y + 1, door.z + dz), { block: "glass_pane", state: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" } });
  }
  for (const y of [door.y, door.y + 1]) lobby.add(key3(door.x - 1, y, door.z + dz));                 // lobby air behind the glass
}
over.set(key3(door.x - 1, door.y + 1, door.z), { block: "lantern", state: { hanging: "true", waterlogged: "false" } });

// the air gap behind each window: the inner cell, when it is core; a warm glowstone in about one in five
const pockets = new Map();
const windowKeys = new Set();
for (const [x, z, g] of cells) for (let y = g; y < topOf(x, z); y++) {
  const n = normalOf(x, y, z); if (!n) continue;
  const along = n[0] !== 0 ? z : x, m = ((along % 4) + 4) % 4;
  const isWindow = y !== topOf(x, z) - 1 && y % 4 !== 0 && y !== g && (m === 1 || m === 2);
  if (!isWindow) continue;
  const ix = x - n[0], iz = z - n[1];
  if (!occ(ix, y, iz) || normalOf(ix, y, iz) || y < (cell(ix, iz)?.g ?? 0) || lobby.has(key3(ix, y, iz))) continue;
  windowKeys.add(key3(x, y, z));
  pockets.set(key3(ix, y, iz), (x * 7 + y * 13 + z * 5) % 5 === 0 ? "glowstone" : null);
}

// roof plant: 2 x 2 units on the body terraces, one on the tower roof, all on solid roof
const plant = [];
for (const [x, z] of cells) {
  if (isTower(x, z) || depthOf(x, z) < 3) continue;
  if (x % 8 !== 3 || z % 7 !== 2) continue;
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (quad.every(([a, b]) => inF(a, b) && !isTower(a, b) && depthOf(a, b) >= 2)) {
    for (const [a, b] of quad) over.set(key3(a, TOP_BODY, b), { block: "light_gray_concrete" });
  }
}
const towerCells = cells.filter(([x, z]) => isTower(x, z) && depthOf(x, z) >= 3).sort((a, b) => depthOf(b[0], b[1]) - depthOf(a[0], a[1]));
for (const [x, z] of towerCells) {
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (quad.every(([a, b]) => isTower(a, b))) {
    for (const [a, b] of quad) over.set(key3(a, TOP_TOWER, b), { block: "light_gray_concrete" });
    break;
  }
}

// the volume
const v = new Voxels([W, H, D]);
for (const [x, z, g] of cells) {
  const top = topOf(x, z);
  for (let y = 0; y < top; y++) {
    const k = key3(x, y, z);
    if (over.has(k)) { const o = over.get(k); v.set(x, y, z, o.block, o.state); continue; }
    if (lobby.has(k)) continue;
    if (pockets.has(k)) { const p = pockets.get(k); if (p) v.set(x, y, z, p); continue; }
    if (y < g) { v.set(x, y, z, "stone_bricks"); continue; }                    // foundation under the ground
    const n = normalOf(x, y, z);
    if (!n) { v.set(x, y, z, y === top - 1 ? "stone_bricks" : "white_concrete"); continue; }   // core; roof membrane on top
    if (y === top - 1) { v.set(x, y, z, "smooth_stone"); continue; }             // cornice / parapet
    if (y === g) { v.set(x, y, z, "stone_bricks"); continue; }                   // base course on the ground
    if (y % 4 === 0) { v.set(x, y, z, "smooth_stone"); continue; }              // storey line
    const along = n[0] !== 0 ? z : x, m = ((along % 4) + 4) % 4;
    if (m === 0) { v.set(x, y, z, "gray_concrete"); continue; }                  // window frame
    if (m === 3) { v.set(x, y, z, "white_concrete"); continue; }                 // pier
    if (windowKeys.has(k)) {
      const state = n[0] !== 0
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      v.set(x, y, z, "glass_pane", state);
    } else v.set(x, y, z, "white_concrete");
  }
}

const out = `${DIR}/way_153707079.nbt`;
const r = v.save(out);
console.log(`footprint ${cells.length} cells; door at x${door.x} z${door.z} y${door.y}; ${r.blocks} blocks, ${r.palette} palette -> ${out}`);
