// Way 269467618, Auckland: a 1930s brick commercial block on a sloping site (2 storeys + parapet, shopfront on the
// downhill side), with a stepped 18-block tower set back from the body, copper cap. The lidar roof is smoothed into
// three flat tiers (body top 10, tower tiers top 14 and 18); the tower sits on the highest part of the lidar roof.
// No interiors: a solid core behind the facade, with one air cell in front of each window (the gap behind the glass).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269467618.cells.json`, "utf8"));
const OUT = `${DIR}/way_269467618.nbt`;

const W = 44, H = 30, D = 21;
const BODY_TOP = 9;                       // the body's roof deck (solid); its parapet cornice is at y=9 too
const K = (x, z) => `${x},${z}`;
const FOOT = new Map(cells.map(([x, z, g, r]) => [K(x, z), { g, r }]));
const footSet = new Set(FOOT.keys());
const rect = (x, z, w, h) => { const s = new Set(); for (let i = x; i < x + w; i++) for (let j = z; j < z + h; j++) s.add(K(i, j)); return s; };
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
const faceOut = (S, x, z) => Object.keys(DIRS).filter((f) => !S.has(K(x + DIRS[f][0], z + DIRS[f][1])));
const isEdge = (S, x, z) => faceOut(S, x, z).length > 0;
const cellsOf = (S) => [...S].map((k) => k.split(",").map(Number));

const vox = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => vox.set(x, y, z, block, state);
const panes = [];                          // glass cells of the facades: { x, y, z, face, S }, placed last

// one row of the body's wall by height (g = the cell's ground)
function bodyKind(y, g) {
  if (y < g) return null;                                       // foundation is stone, painted apart
  if (y === g) return "plinth";
  if (y === BODY_TOP) return "cornice";
  if (y === 4) return "string";                                 // storey line
  if (g === 0 && (y === 1 || y === 2)) return "shop";           // downhill: the shopfront
  if (g === 0 && y === 3) return "lintel";
  if (y >= 5 && y <= 7) return "win";
  if (y === 8) return "lintel";
  return "wall";
}
// the tower's tiers: string course at the base, windows between, cornice on top
const tierKind = (a, b) => (y) => (y === a ? "string" : y === b ? "cornice" : "win");

// the block of one wall cell; idx counts along its face so the window and pier rhythm carries round the building
function wallBlock(kind, faces, idx, corn) {
  switch (kind) {
    case "plinth": return "stone_bricks";
    case "string": return "white_terracotta";
    case "lintel": return "smooth_stone";
    case "cornice": return corn;
    case "wall": return "bricks";
    default: break;                                              // win / shop
  }
  if (faces.length > 1) return "bricks";                         // corner: a solid pier
  const m = idx % 4;
  if (m === 1 || m === 2) return "glass";                        // two panes, then a pier
  return m === 0 ? "white_terracotta" : "bricks";                // pilaster, brick pier
}

// the walls of one set of cells, row by row; glass goes in the list and is placed last
function paintWalls(S, yLo, yHi, kindAt, corn) {
  for (const [x, z] of cellsOf(S)) {
    const faces = faceOut(S, x, z);
    if (!faces.length) continue;
    const idx = faces[0] === "N" || faces[0] === "S" ? x : z;
    for (let y = yLo; y <= yHi; y++) {
      const kind = kindAt(y, x, z);
      if (!kind) continue;
      const b = wallBlock(kind, faces, idx, corn);
      if (b === "glass") { panes.push({ x, y, z, face: faces[0], S }); continue; }
      put(x, y, z, b);
    }
  }
}

// a solid core behind the walls of one set: every interior cell from y0 up to roof (the top cell is the roof)
function core(S, y0, roof, roofBlock) {
  for (const [x, z] of cellsOf(S)) {
    if (isEdge(S, x, z)) continue;
    for (let y = y0; y < roof; y++) put(x, y, z, "bricks");
    put(x, roof, z, roofBlock);
  }
}

// 1. foundation: solid from y 0 up to each cell's ground, so nothing floats on the slope
for (const [x, z, g] of cells) for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

// 2. the body: walls on the edge cells, a solid core inside, the roof deck on top
paintWalls(footSet, 0, BODY_TOP, (y, x, z) => bodyKind(y, FOOT.get(K(x, z)).g), "smooth_stone");
core(footSet, 0, BODY_TOP, "smooth_stone");

// 3. the entrance: on the downhill side, the lowest cell with an edge facing south or east
let door = null;
for (const [x, z, g] of cells) {
  const f = faceOut(footSet, x, z);
  if (f.length !== 1 || !(f[0] === "S" || f[0] === "E") || g > 1) continue;
  const score = (g === 0 ? 100 : 0) + x + z;
  if (!door || score > door.score) door = { x, z, face: f[0], score };
}
const [dx, dz] = DIRS[door.face];
const doorState = (half) => ({ facing: FACING[door.face], half, hinge: "left", open: "false", powered: "false" });
panes.splice(0, panes.length, ...panes.filter((p) => !(p.x === door.x && p.z === door.z && p.y <= 2)));
put(door.x, 1, door.z, "oak_door", doorState("lower"));
put(door.x, 2, door.z, "oak_door", doorState("upper"));
// the air in front of the door, so it opens into the shop; the lintel above it is the canopy band
for (const y of [1, 2]) put(door.x - dx, y, door.z - dz, "air");

// 4. the tower: 10 x 8 cells on the body's interior where the lidar roof is highest, stepping in twice
const TW = 10, TD = 8;
let best = null;
for (let x0 = 2; x0 <= W - TW - 2; x0++) for (let z0 = 2; z0 <= D - TD - 2; z0++) {
  let s = 0, ok = true;
  for (let x = x0; x < x0 + TW && ok; x++) for (let z = z0; z < z0 + TD; z++) {
    if (!footSet.has(K(x, z)) || isEdge(footSet, x, z)) { ok = false; break; }
    s += FOOT.get(K(x, z)).r - BODY_TOP;
  }
  if (ok && (!best || s > best.s)) best = { x0, z0, s };
}
const T = rect(best.x0, best.z0, TW, TD);
const R2 = rect(best.x0 + 1, best.z0 + 1, TW - 2, TD - 2);     // tier 2: 10..13
const R3 = rect(best.x0 + 2, best.z0 + 2, TW - 4, TD - 4);     // tier 3: 14..17, copper cap
paintWalls(R2, 10, 13, tierKind(10, 13), "smooth_stone");
paintWalls(R3, 14, 17, tierKind(14, 17), "oxidized_copper");
core(R2, 10, 13, "smooth_stone");
core(R3, 14, 17, "smooth_stone");

// 5. roof plant: a 3 x 2 two-storey plant room on the body roof, clear of the tower and its margin
const nearT = (x, z) => [-1, 0, 1].some((i) => [-1, 0, 1].some((j) => T.has(K(x + i, z + j))));
const clearOfTower = (x, z) => footSet.has(K(x, z)) && !isEdge(footSet, x, z) && !nearT(x, z);
let plant = null;
for (let x0 = 2; x0 <= W - 5 && !plant; x0++) for (let z0 = 2; z0 <= D - 4 && !plant; z0++) {
  const P = rect(x0, z0, 3, 2);
  if (cellsOf(P).every(([x, z]) => clearOfTower(x, z))) plant = P;
}
if (plant) for (const [x, z] of cellsOf(plant)) {
  put(x, BODY_TOP + 1, z, "bricks");
  put(x, BODY_TOP + 2, z, "bricks");
  put(x, BODY_TOP + 3, z, "smooth_stone");
}

// 6. the air gap behind each window (one cell in from the glass), then the glass, then the lamps
for (const p of panes) {
  const [ox, oz] = DIRS[p.face];
  put(p.x - ox, p.y, p.z - oz, "air");
}
for (const p of panes) {
  if ((p.x * 7 + p.z * 13 + p.y * 3) % 5 !== 0) continue;
  if (![1, 5, 11, 15].includes(p.y)) continue;                  // the lowest window row of its storey: stands on the core
  const [ox, oz] = DIRS[p.face];
  put(p.x - ox, p.y, p.z - oz, "glowstone");
}
for (const p of panes) {
  const n = (dx2, dz2) => vox.get(p.x + dx2, p.y, p.z + dz2) !== null;
  put(p.x, p.y, p.z, "glass_pane", {
    north: String(n(0, -1)), south: String(n(0, 1)), east: String(n(1, 0)), west: String(n(-1, 0)), waterlogged: "false",
  });
}

// 7. nothing hangs: every block above y 0 has a block under it
let floating = 0;
vox.forEachCell((i) => {
  const [X, Y] = vox.size, x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  if (y > 0 && !vox.get(x, y - 1, z)) floating++;
});

const stats = vox.save(OUT);
console.log(JSON.stringify({
  tower: { x0: best.x0, z0: best.z0, tiers: [[10, 13], [14, 17]] },
  door: { x: door.x, z: door.z, face: door.face, ground: FOOT.get(K(door.x, door.z)).g },
  plant: !!plant, panes: panes.length, floating, ...stats,
}));
