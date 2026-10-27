// Bankside Waldorf Apartments: a 1970s concrete apartment tower on a brick podium, stepping back in three setbacks
// (16, 32, 48 blocks) to the lidar roof at 59. Built on the footprint cells only: [x, z, ground, roof] per cell.
// Storey rows are counted from each cell's own ground, so a slope keeps its storeys level on the building.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147112318.cells.json", "utf8"));
const g = new Voxels([29, 72, 20]);

const key = (x, z) => `${x},${z}`;
const B = new Map();
for (const [x, z, G, R] of cells) B.set(key(x, z), { x, z, G, R });
const at = (x, z) => B.get(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// inset depth: 0 on the outline, one more per block inward
const depth = new Map(), queue = [];
for (const c of B.values()) if (DIRS.some(([dx, dz]) => !at(c.x + dx, c.z + dz))) { depth.set(key(c.x, c.z), 0); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) { const n = at(c.x + dx, c.z + dz); if (n && !depth.has(key(n.x, n.z))) { depth.set(key(n.x, n.z), d + 1); queue.push(n); } }
}

// tiers: the lidar's tall mass (roof >= 40) steps back at each tier; low cells (wings) take their roof, rounded to storeys
const TIER = [16, 32, 48, 59];
for (const c of B.values()) {
  c.d = depth.get(key(c.x, c.z));
  const cap = TIER[Math.min(c.d, 3)];
  c.T = c.R >= 40 ? cap : Math.min(cap, Math.max(c.G + 4, Math.round(c.R / 4) * 4));
}

// a neighbour's open side (no building, or the building's top is below this height)
const open = (x, z, y) => { const n = at(x, z); return !n || y >= n.T; };
const exposed = (c, y) => DIRS.filter(([dx, dz]) => open(c.x + dx, c.z + dz, y));

// the main entrance: the face with most ground-storey walls, its middle cell
const faceCount = {};
const faceCells = {};
for (const c of B.values()) for (const [dx, dz] of exposed(c, c.G + 1)) {
  const k = DIR_NAME[`${dx},${dz}`]; (faceCells[k] ??= []).push(c);
}
const faceKey = Object.keys(faceCells).sort((a, b) => faceCells[b].length - faceCells[a].length)[0];
const faceList = faceCells[faceKey].sort((a, b) => (faceKey === "north" || faceKey === "south" ? a.x - b.x : a.z - b.z));
const door = faceList[Math.floor(faceList.length / 2)];
const [DX, DZ] = Object.entries(DIR_NAME).find(([, v]) => v === faceKey)[0].split(",").map(Number);
const alongIdx = (c) => (DX !== 0 ? c.z : c.x);
const doorIdx = alongIdx(door);

const GLASS = "light_blue_stained_glass";
const WALL = (y) => (y < 16 ? "bricks" : "white_concrete");
const CORNER = (y) => (y < 16 ? "stone_bricks" : "light_gray_concrete");

for (const c of B.values()) {
  const { x, z, G, T } = c;
  // foundation down to the lowest ground, then a plinth course at this cell's own ground
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, G, z, "polished_andesite");
  // floor slabs at each storey line (solid across the footprint, so the air between them is enclosed)
  for (let L = G + 4; L < T - 1; L += 4) g.set(x, L, z, "light_gray_concrete");
  // the outer walls: windows in 2-block rows, spandrels below, piers between, quoins at corners
  for (let y = G + 1; y <= T - 2; y++) {
    if ((y - G) % 4 === 0) continue;          // a storey line: the slab above already is the string course
    const E = exposed(c, y);
    if (!E.length) continue;                  // interior air
    const r = (y - G) % 4, ground = y - G < 4;
    if (E.length >= 2) { g.set(x, y, z, CORNER(y)); continue; }
    const [dx, dz] = E[0], idx = dx !== 0 ? z : x, pier = idx % 3 === 0;
    const isDoorFace = DIR_NAME[`${dx},${dz}`] === faceKey && Math.abs(idx - doorIdx) <= 1;
    if (isDoorFace && idx === doorIdx && ground && r <= 2) {
      g.set(x, y, z, "oak_door", { facing: faceKey, half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoorFace && ground) { g.set(x, y, z, "stone_bricks"); continue; }   // the lintel and the pilasters either side of the door
    if (r === 3) { g.set(x, y, z, ground ? "stone_bricks" : (pier ? WALL(y) : "gray_concrete")); continue; }
    if (pier) { g.set(x, y, z, WALL(y)); continue; }
    g.set(x, y, z, GLASS);
    // a warm light behind some glass: the cell just inside the window, in the air gap
    if (r === 2 && (x * 3 + z * 5 + y) % 5 === 0) {
      const ix = x - dx, iz = z - dz, n = at(ix, iz);
      if (n && y > n.G && y <= n.T - 2 && (y - n.G) % 4 !== 0) g.set(ix, y, iz, (x + y) % 2 ? "glowstone" : "shroomlight");
    }
  }
  // the roof: a membrane over the top, a parapet on the outer edge
  g.set(x, T - 1, z, "gray_concrete");
  if (exposed(c, T).length || DIRS.some(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.T < T; })) g.set(x, T, z, "smooth_stone");
}

// roof plant: a 3x3 box on the tower's top, on the deepest flat patch
let best = null;
for (const c of B.values()) {
  if (c.T !== 59) continue;
  let ok = true;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (at(c.x + i, c.z + j)?.T !== 59) ok = false;
  if (ok && (!best || c.d > best.d)) best = c;
}
if (best) {
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const x = best.x + i, z = best.z + j, rim = i !== 0 || j !== 0;
    for (const y of [59, 60]) g.set(x, y, z, rim ? "light_gray_concrete" : "gray_concrete");
    g.set(x, 61, z, "gray_concrete");
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_147112318.nbt";
const r = g.save(out);
console.log(JSON.stringify({ cells: cells.length, entrance: [door.x, door.z, faceKey], plant: best ? [best.x, best.z] : null, ...r }));
