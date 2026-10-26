// 10 Thomas Circle NW: a 1910s-20s Beaux-Arts apartment-hotel in red brick on a limestone-trimmed plinth, with a
// 7-block corner tower on the middle of the block, 11-block shoulders, 4- and 2-block low wings and a penthouse on the
// main roof. Massing comes from the lidar roof (3x3 median, snapped to flat tiers 2/4/7/11/13/15), so nothing floats:
// every column is solid from y 0 up to its tier. Storeys are 3 rows: a stone string course (the floor slab, solid all
// the way through) over two rows of windows; glass panes sit on the outer face with one free air cell behind them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86711.cells.json`, "utf8"));

const W = 30, H = 27, D = 44;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { gr, roof });
const inFP = (x, z) => raw.has(key(x, z));

// ---- massing: 3x3 median of the lidar roof over the footprint, snapped to flat tiers ----
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const tierOf = (v) => (v <= 2.5 ? 2 : v <= 4.5 ? 4 : v <= 8 ? 7 : v <= 11.5 ? 11 : v <= 13.5 ? 13 : 15);
const top = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = raw.get(key(x + dx, z + dz)); if (c) near.push(c.roof);
  }
  top.set(key(x, z), tierOf(median(near)));
}
const T = (x, z) => top.get(key(x, z)) ?? 0;

// ---- penthouse: a 5 x 3 box of the 11-block roof, inset from its edge, lifted two tiers to 13 ----
// chosen nearest the footprint centre so it reads as the hotel's roof structure, not a stray lump
const interiorRoof = (x, z) => T(x, z) === 11 && [-1, 0, 1].every((a) => [-1, 0, 1].every((b) => T(x + a, z + b) >= 11));
let best = null;
for (let x0 = 0; x0 < W; x0++) for (let z0 = 0; z0 < D; z0++) {
  let ok = true;
  for (let i = 0; i < 5 && ok; i++) for (let j = 0; j < 3 && ok; j++) ok = interiorRoof(x0 + i, z0 + j);
  if (!ok) continue;
  const d = Math.hypot(x0 + 2 - 14.5, z0 + 1 - 22);
  if (!best || d < best.d) best = { x0, z0, d };
}
if (best) for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) top.set(key(best.x0 + i, best.z0 + j), 13);

// ---- exposure: a wall face is exposed where the neighbour is off the footprint or lower than this row ----
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const exposed = (x, z, y) => Object.entries(DIRS).filter(([, [dx, dz]]) => {
  const nx = x + dx, nz = z + dz;
  return !inFP(nx, nz) || T(nx, nz) <= y;
}).map(([d]) => d);

// ---- the cell map: block per (x, y, z); pocket air is the absence of a cell ----
const cellOf = new Map();
const put = (x, y, z, block, state) => cellOf.set(`${x},${y},${z}`, { block, state });
const STONE = "smooth_stone", BRICK = "bricks", QUOIN = "stone_bricks", ROOF = "deepslate_tiles";

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    const ex = exposed(x, z, y);
    if (y === t - 1 && ex.length === 0) { put(x, y, z, ROOF); continue; }             // roof membrane, not the stone cornice
    if (y === 0 || y === t - 1 || (y % 3 === 0)) { put(x, y, z, STONE); continue; }   // plinth, cornice, floor slabs
    if (ex.length === 0) { put(x, y, z, BRICK); continue; }                           // solid mass behind the skin
    if (ex.length >= 2) { put(x, y, z, QUOIN); continue; }                            // corner quoins
    const [d] = ex; const [dx, dz] = DIRS[d];
    const along = dx !== 0 ? z : x;                                                   // position along the face
    if (along % 3 === 0) { put(x, y, z, BRICK); continue; }                           // brick piers between the bays
    const axis = dx !== 0 ? { north: "true", south: "true", east: "false", west: "false" }
      : { north: "false", south: "false", east: "true", west: "true" };
    put(x, y, z, "glass_pane", axis);
  }
}

// the air gap behind each pane: the free cell inside the wall, opposite the exposed side; warm light in some of them
let panes = 0, lights = 0;
for (const [k, c] of [...cellOf.entries()]) {
  if (c.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const [d] = exposed(x, z, y);
  const [dx, dz] = DIRS[d];
  const ix = x - dx, iz = z - dz;                                                     // the cell inside
  if (!inFP(ix, iz) || T(ix, iz) <= y || exposed(ix, iz, y).length) continue;         // only a free interior cell
  cellOf.delete(`${ix},${y},${iz}`);                                                  // air behind the glass
  panes++;
  const h = (x * 7 + y * 3 + z * 5) % 9;
  if (h === 0) { put(ix, y, iz, "glowstone"); lights++; }
  else if (h === 4) { put(ix, y, iz, "shroomlight"); lights++; }
}

// ---- the entrance: the largest exposed face at street level; a dark oak door in a stone surround, two-high air ----
const faceCount = Object.fromEntries(Object.keys(DIRS).map((d) => [d, []]));
for (const [x, z] of cells.map(([x, z]) => [x, z])) if (T(x, z) >= 7) for (const d of exposed(x, z, 1)) faceCount[d].push([x, z]);
const [face, list] = Object.entries(faceCount).sort((a, b) => b[1].length - a[1].length)[0];
const sorted = list.sort((a, b) => (DIRS[face][0] !== 0 ? a[1] - b[1] : a[0] - b[0]));
const [ex0, ez0] = sorted[Math.floor(sorted.length / 2)];
const [edx, edz] = DIRS[face];
const FACING = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };  // the inward normal (z+ is south)
const facing = FACING[`${-edx},${-edz}`];
const DOOR = { facing, hinge: "left", open: "false", powered: "false" };
const alongX = edx !== 0 ? 0 : 1, alongZ = 1 - alongX;
for (const y of [1, 2, 3]) {                                                             // the surround: stone jambs and head
  for (const s of [-1, 1]) put(ex0 + s * alongX, y, ez0 + s * alongZ, QUOIN);
  if (y === 3) put(ex0, y, ez0, STONE);
  else put(ex0, y, ez0, "dark_oak_door", { ...DOOR, half: y === 1 ? "lower" : "upper" });
}
for (const y of [1, 2]) cellOf.delete(`${ex0 - edx},${y},${ez0 - edz}`);                 // two-high air inside the door

// ---- roof plant on the penthouse roof: two iron boxes on its deck, the only non-stone on the top ----
if (best) for (const i of [1, 3]) put(best.x0 + i, 13, best.z0 + 1, "iron_block");

// ---- write ----
for (const [k, c] of cellOf) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, c.block, c.state);
}
const counts = g.save(`${DIR}/DC86711.nbt`);
console.log("saved DC86711.nbt", counts, "panes", panes, "lights", lights, "penthouse", best, "entrance", face, [ex0, ez0]);
