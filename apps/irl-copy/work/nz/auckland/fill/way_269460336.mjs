// Auckland City Mission, the Maungawhau view. A two-storey mid-century block: the lidar roof is flat at 7 blocks over
// the whole footprint (the 3x3 median takes the three edge dips back to 7), so the massing is one clean box with a
// plinth, a storey line, a cornice and a roof core, not an invented tower.
// Walls are white concrete with light-grey piers every fourth bay; the glazing is state-connected panes between the
// piers; a 3-cell entrance with a dark-oak door and a lintel hood sits on the longest street face. Each glazed skin
// cell has an air gap behind it (no interiors), with glowstone and hanging lanterns in some gaps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269460336.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const roofRaw = new Map();
for (const [x, z, , roof] of cells) roofRaw.set(key(x, z), roof);
const inFp = (x, z) => roofRaw.has(key(x, z));

// The roof: the 3x3 median of the lidar roof height, so one-cell noise becomes the flat tier around it.
const median = (a) => [...a].sort((p, q) => p - q)[Math.floor(a.length / 2)];
const TOP = 7;                                                  // the roof surface at y 7; the cap course is y 6
for (const k of roofRaw.keys()) {
  const [x, z] = k.split(",").map(Number), near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) near.push(roofRaw.get(key(x + dx, z + dz)));
  if (median(near) !== TOP) throw new Error(`roof at ${k} is ${median(near)}, expected ${TOP}`);
}

// Exterior cells, and the side each faces. Every footprint column is solid from y 0 (the plinth, which is also the
// foundation where the ground is 1), so the downhill cells need no fill of their own.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const NAME = { N: "north", S: "south", W: "west", E: "east" };
const ORDER = ["N", "S", "W", "E"];
const outward = (x, z) => ORDER.find((d) => !inFp(x + DIRS[d][0], z + DIRS[d][1])) ?? null;
const skin = new Map();                                         // key -> outward side
for (const k of roofRaw.keys()) { const [x, z] = k.split(",").map(Number), d = outward(x, z); if (d) skin.set(k, d); }

// Street faces: the exterior cells on one side and one fixed coordinate, cut into straight runs with no gaps.
const alongOf = (d, x, z) => (d === "N" || d === "S" ? x : z);
const fixedOf = (d, x, z) => (d === "N" || d === "S" ? z : x);
const lines = new Map();
for (const [k, d] of skin) {
  const [x, z] = k.split(",").map(Number), lk = `${d}:${fixedOf(d, x, z)}`;
  if (!lines.has(lk)) lines.set(lk, []);
  lines.get(lk).push({ x, z, d, a: alongOf(d, x, z) });
}
const runs = [];
for (const line of lines.values()) {
  line.sort((p, q) => p.a - q.a);
  let run = [];
  for (const c of line) {
    if (run.length && c.a !== run[run.length - 1].a + 1) { runs.push(run); run = []; }
    run.push(c);
  }
  if (run.length) runs.push(run);
}
for (const run of runs) run.forEach((c, i) => { c.bay = i; });  // bay index from the run's start: a corner is a pier
const front = runs.reduce((best, r) => (r.length > best.length ? r : best), []);
const mid = front[Math.floor(front.length / 2)];
const entrance = new Set(front.filter((c) => Math.abs(c.bay - mid.bay) <= 1).map((c) => key(c.x, c.z)));
const doorKey = key(mid.x, mid.z);

// The plan records what is placed, so the pane connections and the float check can read it back.
const plan = new Map();
const g = new Voxels([25, 20, 33]);
const put = (x, y, z, block, state) => { plan.set(`${x},${y},${z}`, { block, state }); g.set(x, y, z, block, state); };
const carve = (x, y, z) => { plan.delete(`${x},${y},${z}`); g.set(x, y, z, "air"); };

// 1. The massing: plinth, solid storeys, storey line at y 3, roof membrane and cornice at the top.
for (const k of roofRaw.keys()) {
  const [x, z] = k.split(",").map(Number), edge = skin.has(k);
  put(x, 0, z, "stone_bricks");
  for (let y = 1; y <= 5; y++) put(x, y, z, "white_concrete");
  put(x, 3, z, edge ? "light_gray_concrete" : "white_concrete");
  put(x, 6, z, edge ? "light_gray_concrete" : "gray_concrete");
}

// 2. The skin: piers every fourth bay, panes between, the entrance on the longest street face.
for (const run of runs) for (const c of run) {
  const { x, z, d } = c, k = key(x, z);
  if (k === doorKey) {
    put(x, 1, z, "dark_oak_door", { facing: NAME[d], half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "dark_oak_door", { facing: NAME[d], half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, "polished_andesite");                           // the lintel hood over the door
    continue;
  }
  const pier = run.length >= 4 && c.bay % 4 === 0 && !entrance.has(k);   // short steps of the outline stay glazed
  const glass = entrance.has(k) ? "glass_pane" : "light_blue_stained_glass_pane";
  for (const y of [1, 2, 4, 5]) put(x, y, z, pier ? "light_gray_concrete" : glass);
}

// 3. The air gap behind each glazed or door cell: one interior cell, emptied on the window rows (no rooms).
const gaps = [];
for (const run of runs) for (const c of run) {
  const k = key(c.x, c.z);
  const [dx, dz] = DIRS[c.d], ix = c.x - dx, iz = c.z - dz;     // the cell one step inward
  if (!inFp(ix, iz) || skin.has(key(ix, iz))) continue;          // thin wall: keep it solid
  const isPier = run.length >= 4 && c.bay % 4 === 0 && !entrance.has(k);
  if (isPier && k !== doorKey) continue;
  const rows = k === doorKey ? [1, 2] : [1, 2, 4, 5];
  for (const y of rows) carve(ix, y, iz);
  gaps.push({ x: ix, z: iz, rows, face: k });
}

// 4. Warm light in some gaps: a glowstone on the sill of a ground-floor gap, a hanging lantern under the upper ceiling.
gaps.forEach((gap, i) => {
  if (gap.rows.includes(1) && gap.rows.length === 4 && i % 3 === 0) put(gap.x, 1, gap.z, "glowstone");
  if (gap.rows.includes(5) && i % 3 === 1) put(gap.x, 5, gap.z, "lantern", { hanging: "true", waterlogged: "false" });
  if (gap.rows.includes(4) && gap.rows.length === 4 && i % 3 === 2) put(gap.x, 4, gap.z, "glowstone");
});

// 5. Pane connections: a pane joins the neighbour along its face when that neighbour is a pane or a solid.
const solidAt = (x, y, z) => { const p = plan.get(`${x},${y},${z}`); return !!p && !/door/.test(p.block); };
for (const [pk, p] of [...plan.entries()]) {
  if (!/_pane$/.test(p.block)) continue;
  const [x, y, z] = pk.split(",").map(Number), d = skin.get(key(x, z));
  const state = d === "N" || d === "S"
    ? { north: "false", south: "false", east: String(solidAt(x + 1, y, z)), west: String(solidAt(x - 1, y, z)) }
    : { north: String(solidAt(x, y, z - 1)), south: String(solidAt(x, y, z + 1)), east: "false", west: "false" };
  put(x, y, z, p.block, { ...state, waterlogged: "false" });
}

// 6. Roof equipment: a stair and lift core on a 3x3 interior patch near the centre, and a plant box beside it.
const interior = (x, z) => [-1, 0, 1].every((i) => [-1, 0, 1].every((j) => inFp(x + i, z + j) && !skin.has(key(x + i, z + j))));
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length, cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
const coreAt = [...roofRaw.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => interior(x, z))
  .sort((p, q) => (p[0] - cx) ** 2 + (p[1] - cz) ** 2 - ((q[0] - cx) ** 2 + (q[1] - cz) ** 2))[0];
if (coreAt) {
  const [X, Z] = coreAt;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    put(X + i, 7, Z + j, "white_concrete");
    put(X + i, 8, Z + j, "light_gray_concrete");
  }
  const boxAt = [...roofRaw.keys()].map((k) => k.split(",").map(Number))
    .filter(([x, z]) => [0, 1].every((i) => [0, 1].every((j) => inFp(x + i, z + j) && !skin.has(key(x + i, z + j)))) && Math.abs(x - X) > 3)[0];
  if (boxAt) for (let i = 0; i <= 1; i++) for (let j = 0; j <= 1; j++) put(boxAt[0] + i, 7, boxAt[1] + j, "stone_bricks");
}

// 7. Float check: every block above y 0 rests on a placed block below it, hangs from one above (lanterns), or is a
// lintel or cornice spanning between solid neighbours at its own height (the piers either side carry it).
const structural = (x, y, z) => { const p = plan.get(`${x},${y},${z}`); return !!p && !/pane|door|lantern|glowstone|glass/.test(p.block); };
const floats = [];
for (const [pk, p] of plan) {
  const [x, y, z] = pk.split(",").map(Number);
  if (y === 0) continue;
  const hanging = p.state && p.state.hanging === "true";
  const support = hanging ? plan.has(`${x},${y + 1},${z}`) : plan.has(`${x},${y - 1},${z}`);
  const spans = structural(x - 1, y, z) || structural(x + 1, y, z) || structural(x, y, z - 1) || structural(x, y, z + 1);
  const doorUpper = /door/.test(p.block) && p.state && p.state.half === "upper";
  if (!support && !spans && !doorUpper) floats.push(pk);
}
if (floats.length) throw new Error(`floating blocks: ${floats.slice(0, 8).join(" ")} (${floats.length})`);

const counts = {};
for (const p of plan.values()) counts[p.block] = (counts[p.block] || 0) + 1;
console.log("entrance:", [...entrance].join(" "), "| gaps:", gaps.length, "| core:", coreAt ? coreAt.join(",") : "none");
console.log("blocks:", plan.size, counts);
g.save(`${DIR}/way_269460336.nbt`);
