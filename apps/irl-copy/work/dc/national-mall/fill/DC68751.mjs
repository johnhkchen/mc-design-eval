// DC68751: the Department of Agriculture South Building (1930s, Stripped Classical federal office on Independence Avenue).
// A pale limestone-clad block of four storeys over a stone base, with a 13-block cornice on the main body, lower
// wings stepping down to two storeys and one, and a roof deck behind a parapet. The lidar roof is median-smoothed
// on the 3x3 footprint neighbourhood, then quantised to five clean tiers (3, 6, 10, 12, 13) so each setback is flat.
//
// Storeys sit on absolute 3-block rhythms: a band row (floor line, quartz; the base course at y 0) and two glass rows.
// Facade cells are the outer skin: quartz pillars every third cell along each face (corners always), glass between.
// The cell one step in is a room, air behind the glass with a floor slab per storey and a lamp standing on the floor
// in some bays; deeper cells are solid. Each column fills from y 0 to its ground as foundation, then its storeys, and
// the top row is a parapet (smooth quartz on the skin, smooth stone on the roof deck). The entrance sits on the north
// face nearest the middle of the footprint, with iron doors and a stone hood over them; roof plant stands on the deck.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC68751.cells.json`, "utf8"));
const W = 121, D = 62, H = 16;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const N4 = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: median of the 3x3 footprint neighbourhood (kills single-cell noise), then five flat tiers.
const med = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const tierOf = (r) => (r >= 13 ? 13 : r >= 11 ? 12 : r >= 9 ? 10 : r >= 5 ? 6 : 3);

// Distance in cells from the outside: 0 is the skin, 1 a room behind the glass, 2+ solid core.
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (N4.some(([, dx, dz]) => !inside(x + dx, z + dz))) { dist.set(key(x, z), 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const [, dx, dz] of N4) {
    const k = key(x + dx, z + dz);
    if (inside(x + dx, z + dz) && !dist.has(k)) { dist.set(k, d + 1); queue.push([x + dx, z + dz]); }
  }
}

const faces = (x, z) => N4.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([f]) => f);
const info = new Map();
for (const [x, z, G] of cells) {
  const fs = faces(x, z);
  info.set(key(x, z), { x, z, g: G, T: tierOf(med(x, z)), d: dist.get(key(x, z)), fs });
}

// Pillars: every third cell along each face, and every corner.
const isPier = (c) => c.fs.length >= 2 || c.fs.some((f) => ((f === "N" || f === "S") ? c.x : c.z) % 3 === 0);

// Entrance: the north-facing skin cell nearest the middle of the footprint, on a tier of at least two storeys.
const midX = Math.round(cells.reduce((s, c) => s + c[0], 0) / cells.length);
let ENTRY = null;
for (const c of info.values()) {
  if (c.d !== 0 || !c.fs.includes("N") || c.T < 10) continue;
  if (!ENTRY || Math.abs(c.x - midX) < Math.abs(ENTRY.x - midX) || (Math.abs(c.x - midX) === Math.abs(ENTRY.x - midX) && c.z < ENTRY.z)) ENTRY = c;
}
const hoodCell = (c) => ENTRY && c.z === ENTRY.z && Math.abs(c.x - ENTRY.x) <= 1 && c.fs.includes("N");

const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const HOOD = { facing: "north", half: "top", shape: "straight", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };
const PILLAR = { axis: "y" };
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);

// The block for one cell at height y: [id, state?] or null for air.
const blockAt = (c, y) => {
  const { x, z, g: G, T, d } = c;
  if (y >= T) {
    // Roof plant: a few 2-block mechanical boxes on the core deck of the taller tiers.
    if (d >= 2 && T >= 12 && y === T && x % 16 >= 5 && x % 16 <= 6 && z % 12 >= 5 && z % 12 <= 6) return ["iron_block"];
    return null;
  }
  if (y < G) return [d === 0 ? "stone_bricks" : "stone"];               // foundation
  if (y === T - 1) return [d === 0 ? "smooth_quartz" : "smooth_stone"]; // parapet on the skin, roof deck inside
  if (d >= 2) return ["stone"];                                         // solid core
  const rel = y % 3;
  if (d === 1) {                                                        // room behind the glass
    if (rel === 0) return ["smooth_stone"];                             // floor slab / ceiling per storey
    if (rel === 1 && y >= 1) {
      const h = hash(x, y, z) % 19;
      if (h === 0) return ["lantern", LANTERN];
      if (h === 1) return ["shroomlight"];
      if (h === 2) return ["glowstone"];
    }
    return null;                                                        // air behind the glass
  }
  // The skin.
  if (y === 0) return ["stone_bricks"];                                 // base course
  if (y === T - 2 && rel !== 0) return ["smooth_quartz"];               // lintel under the parapet (no half storey)
  if (rel === 0) return ["smooth_quartz"];                              // storey lines
  if (ENTRY && c.z === ENTRY.z && c.x === ENTRY.x && (y === 1 || y === 2)) {
    return ["iron_door", DOOR(y === 1 ? "lower" : "upper")];
  }
  if (hoodCell(c) && y === 3) return ["stone_brick_stairs", HOOD];      // stone hood over the entrance
  if (hoodCell(c) && (y === 1 || y === 2)) return ["quartz_pillar", PILLAR]; // the door bay framed by pillars
  if (isPier(c)) return ["quartz_pillar", PILLAR];
  return ["glass_pane"];
};

const out = new Voxels([W, H, D]);
for (const c of info.values()) {
  for (let y = 0; y < H; y++) {
    const b = blockAt(c, y);
    if (b) out.set(c.x, y, c.z, b[0], b[1]);
  }
}
const stats = out.save(`${DIR}/DC68751.nbt`);
console.log(`DC68751.nbt: ${stats.blocks} blocks, ${stats.palette} palette entries; entrance at x${ENTRY.x} z${ENTRY.z}`);
