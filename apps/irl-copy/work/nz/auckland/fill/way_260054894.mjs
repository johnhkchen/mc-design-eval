import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Lord Nelson Apartments, Mt Eden. A mid-century (1960s-70s) reinforced-concrete apartment block: white concrete walls
// with light-grey floor bands, grey frames in 3-block glazed bays, a stone plinth on the downhill side, parapets on each
// tier, and an eight-storey stair-and-lift core rising above the seven-storey main block.

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_260054894.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const FLOOR0 = 6;                                  // the ground storey's slab row: above the highest grade, so the downhill side shows a plinth
const DIRS = [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]];
const k = (x, z) => `${x},${z}`;
const ground = new Map(), roofRaw = new Map();
for (const [x, z, gr, r] of cells) { ground.set(k(x, z), gr); roofRaw.set(k(x, z), r); }
const inFp = (x, z) => ground.has(k(x, z));
const mod3 = (v) => ((v % 3) + 3) % 3;

// Each cell's deck row: the lidar roof, median-smoothed over the 3x3 footprint neighbourhood (kills the edge noise),
// then snapped to a storey line with a 2-block parapet above it.
const top = new Map();
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) near.push(roofRaw.get(k(x + dx, z + dz)));
  near.sort((a, b) => a - b);
  const storeys = Math.min(8, Math.max(4, Math.round((near[(near.length - 1) >> 1] - 8) / 4)));
  top.set(key, FLOOR0 + 4 * storeys);
}
const T = (x, z) => top.get(k(x, z));

// Faces of a cell that open onto air at row y: a neighbour outside the footprint, or one whose deck is below y.
const outside = (x, z) => DIRS.filter(([, dx, dz]) => !inFp(x + dx, z + dz));
const faces = (x, z, y) => DIRS.filter(([, dx, dz]) => !inFp(x + dx, z + dz) || T(x + dx, z + dz) < y);
const edge = (x, z) => DIRS.some(([, dx, dz]) => !inFp(x + dx, z + dz) || T(x + dx, z + dz) < T(x, z));
const along = (dir, x, z) => (dir === "east" || dir === "west" ? z : x);

// Entrance: the street-side face is the one with the most outside cells; the door sits mid-face on a plain (non-corner) cell.
const count = {}, phase = {};
for (const [name] of DIRS) { count[name] = 0; phase[name] = Infinity; }
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (const [name, dx, dz] of DIRS) if (!inFp(x + dx, z + dz)) { count[name]++; phase[name] = Math.min(phase[name], along(name, x, z)); }
}
const front = DIRS.map((d) => d[0]).sort((a, b) => count[b] - count[a])[0];
const [, fdx, fdz] = DIRS.find((d) => d[0] === front);
const doorList = [...ground.keys()].map((s) => s.split(",").map(Number))
  .filter(([x, z]) => !inFp(x + fdx, z + fdz) && outside(x, z).length === 1)
  .sort((a, b) => along(front, a[0], a[1]) - along(front, b[0], b[1]));
const [dxCell, dzCell] = doorList[doorList.length >> 1];
const doorIdx = along(front, dxCell, dzCell);

const g = new Voxels([36, 54, 27]);
const windows = [];
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = ground.get(key), t = T(x, z), rim = edge(x, z), out = outside(x, z);

  // Below the ground storey: solid foundation under grade, a plinth with a base course on the outside.
  for (let y = 0; y < FLOOR0; y++) {
    if (y < gr || !out.length) g.set(x, y, z, "stone");
    else if (y === FLOOR0 - 1) g.set(x, y, z, "smooth_stone");
    else if ((y === 2 || y === 3) && out.length === 1 && mod3(along(out[0][0], x, z) - phase[out[0][0]]) !== 0) g.set(x, y, z, "light_blue_stained_glass");
    else g.set(x, y, z, "stone_bricks");
  }

  for (let y = FLOOR0; y <= t + 1; y++) {
    const m = (y - FLOOR0) % 4;   // 0 floor slab (or deck), 1-2 glazing, 3 lintel band
    if (y === t + 1) { if (rim) g.set(x, y, z, "white_concrete"); continue; }   // parapet on the rim only
    if (m === 0) { g.set(x, y, z, y === t && !rim ? "gray_concrete" : "light_gray_concrete"); continue; }   // every storey's floor slab, full footprint
    const ex = faces(x, z, y);
    if (!ex.length) continue;                       // interior air behind the glass
    if (m === 3) { g.set(x, y, z, "white_concrete"); continue; }
    const [name, dx, dz] = ex[0], ii = along(name, x, z);
    if (name === front && ex.length === 1 && x === dxCell && z === dzCell && y <= FLOOR0 + 2) {   // the entrance door
      g.set(x, y, z, "dark_oak_door", { facing: name, half: y === FLOOR0 + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const flank = name === front && ex.length === 1 && y <= FLOOR0 + 2 && Math.abs(ii - doorIdx) === 1;
    const framed = mod3(ii - phase[name]) === 0 || flank;   // corners glaze on the bay rhythm too: a thin tip would read as a solid dark column
    g.set(x, y, z, framed ? "gray_concrete" : "light_blue_stained_glass");
    if (!framed) windows.push([x, y, z, dx, dz]);
  }
}

// Warm light behind one glass pane in seven: glowstone in the air gap just inside the glazing.
let lit = 0;
for (const [x, y, z, dx, dz] of windows) {
  if ((x * 7 + z * 13 + y * 5) % 7 !== 0) continue;
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || g.get(ix, y, iz)) continue;
  g.set(ix, y, iz, "glowstone"); lit++;
}

// Roof plant on the main block's deck: 2x2 boxes, two blocks high, set well inside the roof.
let plant = 0;
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (T(x, z) !== 34 || x % 7 !== 2 || z % 6 !== 2) continue;
  const quad = [[0, 0], [1, 0], [0, 1], [1, 1]];
  if (!quad.every(([a, b]) => inFp(x + a, z + b) && T(x + a, z + b) === 34 && !edge(x + a, z + b))) continue;
  for (const [a, b] of quad) for (const y of [35, 36]) g.set(x + a, y, z + b, "light_gray_concrete");
  plant++;
}

const saved = g.save(`${FILL}/way_260054894.nbt`);
const storeys = {}; for (const t of top.values()) storeys[t] = (storeys[t] || 0) + 1;
console.log(JSON.stringify({ ...saved, front, door: [dxCell, dzCell], lit, plant, deckRows: storeys }));
