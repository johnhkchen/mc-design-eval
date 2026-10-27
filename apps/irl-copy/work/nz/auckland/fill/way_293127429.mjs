// Way 293127429, Mt Eden / Eden Terrace side of the CBD: a 1960s-70s concrete-frame office block, three storeys on a
// main block with a setback top storey, two lower wings, shopfronts on the ground floor, two entrances under canopies.
// Storey lines sit on absolute heights from y 0 (the lidar roof heights are absolute), and every floor, deck and wall
// stands on the slab below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const SIZE = [57, 28, 33];
const cells = JSON.parse(readFileSync(`${DIR}/way_293127429.cells.json`, "utf8"));

// [dx, dz, facing name] for the four sides
const NEIGH = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const cellKey = (x, z) => `${x},${z}`;
const voxKey = (x, y, z) => `${x},${y},${z}`;

const foot = new Map(cells.map(([x, z, g, r]) => [cellKey(x, z), { x, z, g, r }]));
const inFoot = (x, z) => foot.has(cellKey(x, z));
const cellAt = (x, z) => foot.get(cellKey(x, z));

// 1. Roof: a 3x3 median kills lidar noise (the zero and single-digit cells at the edges), then three flat tiers.
//    Main 15 = three storeys and a parapet; wing 11 = two storeys and a parapet; low 7 = one storey and a parapet.
for (const c of foot.values()) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = cellAt(c.x + dx, c.z + dz); if (n) v.push(n.r); }
  v.sort((a, b) => a - b); c.rs = v[v.length >> 1];
  c.tier = c.rs >= 13 ? "main" : c.rs >= 9 ? "wing" : "low";
}
const TOP = { main: 15, wing: 11, low: 7 };

// 2. Depth in from the outside edge: 1 = the outer shell, 2 = the terrace ring, 3 = the setback body (main only)
const queue = [];
for (const c of foot.values()) if (NEIGH.some(([dx, dz]) => !inFoot(c.x + dx, c.z + dz))) { c.p = 1; queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of NEIGH) { const n = cellAt(c.x + dx, c.z + dz); if (n && n.p === undefined) { n.p = c.p + 1; queue.push(n); } }
}
// the sides a cell faces outward (toward a shallower depth)
for (const c of foot.values()) c.faces = NEIGH.filter(([dx, dz]) => { const n = cellAt(c.x + dx, c.z + dz); return (n ? n.p : 0) < c.p; });

const plan = new Map();
const put = (x, y, z, block, state) => plan.set(voxKey(x, y, z), { x, y, z, block, state });
const got = (x, y, z) => plan.get(voxKey(x, y, z));

// Floors and decks per column: the ground slab, the floor lines, and the deck (main setback body only at 12)
const slabsOf = (c) => c.tier === "main" ? (c.p >= 3 ? [0, 4, 8, 12] : [0, 4, 8]) : c.tier === "wing" ? [0, 4, 8] : [0, 4];
const topSlab = (c) => slabsOf(c).at(-1);
const slabBlock = (c, y) => y === 0 ? "stone_bricks"
  : y === topSlab(c) ? (c.tier === "main" && c.p < 3 ? "smooth_stone" : "gray_concrete")   // terrace paving or roof membrane
  : "light_gray_concrete";                                                                    // floor line and string course

// Perimeter walls: storeys on the outer shell (p 1), the setback storey and its parapet on the body (p 3)
const wallAt = (c, y) => c.tier === "main" ? (y < 8 ? c.p === 1 : y < 15 && c.p === 3) : y < TOP[c.tier] && c.p === 1;
const isParapet = (c, y) => y >= ({ main: 13, wing: 9, low: 5 })[c.tier];

const glowSpots = [];
for (const c of foot.values()) {
  const slabs = slabsOf(c);
  for (const y of slabs) put(c.x, y, c.z, slabBlock(c, y));
  for (let y = 1; y < TOP[c.tier]; y++) {
    if (slabs.includes(y) || !wallAt(c, y)) continue;
    if (isParapet(c, y)) { put(c.x, y, c.z, y === TOP[c.tier] - 1 ? "smooth_stone" : "white_concrete"); continue; }
    const ground = y < 4, k = y % 4, corner = c.faces.length > 1, [dx, dz] = c.faces[0];
    if (k === 3) { put(c.x, y, c.z, ground ? "smooth_stone" : "light_gray_concrete"); continue; }   // fascia
    const along = dz !== 0 ? c.x : c.z;                                                         // the run of the wall
    const pier = corner || along % 4 === 0;                                                     // 3-block bays, a pier every 4
    if (pier) { put(c.x, y, c.z, ground ? "stone_bricks" : "white_concrete"); continue; }
    put(c.x, y, c.z, ground ? "light_blue_stained_glass" : "light_blue_stained_glass_pane");
    // warm light: a glowstone one cell inside some upper windows (air behind the glass otherwise)
    if (!ground && !corner && (along + y) % 5 === 0) glowSpots.push({ x: c.x - dx, y, z: c.z - dz });
  }
}
for (const g of glowSpots) if (inFoot(g.x, g.z) && !got(g.x, g.y, g.z)) put(g.x, g.y, g.z, "glowstone");

// Terrace railing on the outer edge of the main block's setback
for (const c of foot.values()) if (c.tier === "main" && c.p === 1) put(c.x, 9, c.z, "stone_brick_wall");

// Plant room on the main roof, set in from the parapet
const main = [...foot.values()].filter((c) => c.tier === "main");
const mx = main.reduce((s, c) => s + c.x, 0) / main.length, mz = main.reduce((s, c) => s + c.z, 0) / main.length;
for (const c of main) if (c.p >= 6 && Math.abs(c.x - mx) <= 4 && Math.abs(c.z - mz) <= 2) {
  put(c.x, 13, c.z, "light_gray_concrete");
  put(c.x, 14, c.z, "smooth_stone");
}

// Entrances: the longest outer face of each of two sides, the middle ground-level cell, a door and a canopy
const byFace = new Map();
for (const c of foot.values()) {
  if (c.p !== 1 || c.faces.length !== 1 || c.g !== 0 || c.tier === "low") continue;
  const f = c.faces[0][2];
  if (!byFace.has(f)) byFace.set(f, []);
  byFace.get(f).push(c);
}
const faces = [...byFace.entries()].filter(([, cs]) => cs.length >= 3).sort((a, b) => b[1].length - a[1].length).slice(0, 2);
for (const [, cs] of faces) {
  const along = (c) => cs[0].faces[0][1] !== 0 ? c.z : c.x;
  const d = cs.sort((a, b) => along(a) - along(b))[cs.length >> 1];
  const [dx, dz, face] = d.faces[0];
  put(d.x, 0, d.z, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(d.x, 1, d.z, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(d.x, 2, d.z, "light_blue_stained_glass_pane");
  for (const dist of [1, 2]) for (const a of [-1, 0, 1]) {
    const x = dz !== 0 ? d.x + a : d.x + dx * dist, z = dz !== 0 ? d.z + dz * dist : d.z + a;
    if (!inFoot(x, z) && !got(x, 3, z)) put(x, 3, z, "black_concrete");
  }
}

// Panes join to whatever solid sits beside them on the same course
const solid = (x, y, z) => { const e = got(x, y, z); return !!e && e.block !== "glowstone"; };
for (const e of plan.values()) if (e.block.endsWith("_glass_pane")) {
  e.state = {
    north: String(solid(e.x, e.y, e.z - 1)), south: String(solid(e.x, e.y, e.z + 1)),
    east: String(solid(e.x + 1, e.y, e.z)), west: String(solid(e.x - 1, e.y, e.z)),
  };
}

const g = new Voxels(SIZE);
for (const e of plan.values()) g.set(e.x, e.y, e.z, e.block, e.state);
const stats = g.save(`${DIR}/way_293127429.nbt`);
console.log(JSON.stringify({ ...stats, faces: faces.map(([f, cs]) => [f, cs.length]) }));
