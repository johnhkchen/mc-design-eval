// DC71837: 450 5th St NW, a 1960s Commercial-Office block in Judiciary Square, read from the lidar record. A central
// core at 20 blocks (the tallest tier) with a 17-block main body round it, a 13-block east wing, and a penthouse on the
// core. Pale precast piers (smooth quartz), light-gray spandrels, glass bays in each storey, a polished-granite base
// course, a cream parapet, and one bronze-doored entrance on the west (5th St) face under a granite hood.
//
// Storeys sit on absolute 4-block rhythms (spandrel, two glass rows, head spandrel), so neighbouring columns line up
// where the ground steps. Each column fills from y 0 to its ground as foundation, then its storeys up to its tier.
// Every exposed face (outside, or a lower neighbouring tier) takes the facade treatment, so the setback walls read.
// Interior cells one step behind a glass bay are air at the glass rows, with a floor slab and ceiling per storey
// and a lamp standing on the floor where the glass shows it; cells deeper inside are solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC71837.cells.json`, "utf8"));
const W = 19, D = 39, H = 24;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: median of the 3x3 footprint neighbourhood (kills single-cell noise), then three flat tiers.
const tierOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const s = v[v.length >> 1];
  return s <= 14 ? 13 : s <= 18 ? 17 : 20;
};

const info = new Map();
for (const [x, z, G] of cells) info.set(key(x, z), { x, z, g: G, T: tierOf(x, z) });
const at = (x, z) => info.get(key(x, z));

// A face is exposed where the neighbour is outside the footprint or stands on a lower tier.
for (const c of info.values()) {
  c.fs = FACES.filter(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T < c.T; }).map(([f]) => f);
  c.facade = c.fs.length > 0;
  c.door = c.x === 0 && (c.z === 18 || c.z === 19);
  // Piers every third cell along each face (by x on the north and south faces, by z on the east and west); corners always.
  c.pier = c.facade && (c.fs.length >= 2 || c.fs.some((f) => ((f === "N" || f === "S") ? c.x : c.z) % 3 === 0));
}
// A bay is a glass facade cell (not pier, not door); a room is an interior cell one step behind a bay.
const isBay = (x, z) => { const c = at(x, z); return !!c && c.facade && !c.pier && !c.door; };
for (const c of info.values()) c.room = !c.facade && FACES.some(([, dx, dz]) => isBay(c.x + dx, c.z + dz));

// The core's penthouse: a two-storey box on the 20-block core, with glass on its perimeter and a cap.
const penthouse = (x, z) => { const c = at(x, z); return !!c && c.T === 20 && x >= 6 && x <= 10 && z >= 13 && z <= 19; };
const PENT_EDGE = (x, z) => x === 6 || x === 10 || z === 13 || z === 19;

const FOUND = "stone", SPANDREL = "light_gray_concrete", PIER = "smooth_quartz", GRANITE = "polished_granite";
const CAP = "smooth_quartz", ROOF = "gray_concrete", GLASS = "glass_pane";
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
const HOOD = { facing: "west", half: "top", shape: "straight", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };

// The block for one cell at height y: [id, state] or null for air. Glass is placed here and linked afterwards.
const blockAt = (c, y) => {
  const { x, z, g: G, T } = c;
  if (y < G) return [FOUND];
  if (penthouse(x, z) && y >= T) {
    if (y === 22) return [CAP];                                         // cap over the penthouse
    if (y === 21 && PENT_EDGE(x, z)) return [GLASS];                    // glazed perimeter
    return [PIER];
  }
  if (c.door) {
    if (y === G) return ["iron_door", DOOR("lower")];
    if (y === G + 1) return ["iron_door", DOOR("upper")];
    if (y === G + 2) return ["polished_granite_stairs", HOOD];          // granite hood over the entrance
    if (y === G + 3) return [PIER];                                     // solid header holds the hood
  }
  if (!c.facade) {
    if (y === T - 1) return [ROOF];                                     // roof deck
    const rel = y % 4;
    if (rel === 0 || rel === 3) return [FOUND];                         // floor slab and ceiling
    if (!c.room) return [FOUND];
    if (rel === 1) {                                                    // a lamp needs a floor under it
      const h = hash(x, y, z) % 19;
      if (h === 0) return ["lantern", LANTERN];
      if (h === 1) return ["shroomlight"];
      if (h === 2) return ["glowstone"];
    }
    return null;                                                        // air behind the glass
  }
  if (y === T - 1) return [CAP];                                        // parapet course
  if (y === G) return [GRANITE];                                        // base course
  const rel = y % 4;
  if (rel === 0 || rel === 3) return [SPANDREL];                        // spandrels and floor lines
  if (c.pier) return [PIER];
  return [GLASS];
};

const g = new Voxels([W, H, D]);
const glass = [];
// Roof plant: two-high boxes on the decks of the core and the main body, away from the edges.
const roofPlant = (c) => !c.facade && (c.T === 17 || c.T === 20) && c.x > 2 && c.x < 16 && (c.x * 3 + c.z * 7) % 13 === 0 && !penthouse(c.x, c.z);
for (const c of info.values()) {
  for (let y = 0; y < c.T; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    if (b[0] === GLASS) { glass.push([c.x, y, c.z]); g.set(c.x, y, c.z, GLASS); continue; }
    g.set(c.x, y, c.z, b[0], b[1]);
  }
  if (penthouse(c.x, c.z)) for (let y = c.T; y <= 22; y++) { const b = blockAt(c, y); if (b) { if (b[0] === GLASS) { glass.push([c.x, y, c.z]); g.set(c.x, y, c.z, GLASS); } else g.set(c.x, y, c.z, b[0], b[1]); } }
  if (roofPlant(c)) { g.set(c.x, c.T, c.z, "stone_bricks"); g.set(c.x, c.T + 1, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); }
}

// Panes join their neighbours and any solid, so the glazing reads as continuous bays with frames, not posts.
for (const [x, y, z] of glass) {
  const link = (dx, dz) => g.get(x + dx, y, z + dz) !== null;
  const state = {
    north: String(link(0, -1)), south: String(link(0, 1)), east: String(link(1, 0)), west: String(link(-1, 0)),
    waterlogged: "false",
  };
  g.set(x, y, z, GLASS, state);
}

// No floating blocks: every block above y 0 must have something under it (air-behind-glass cells are not blocks).
let floating = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 1; y < H; y++) {
  if (g.get(x, y, z) && !g.get(x, y - 1, z)) floating++;
}
if (floating) console.warn(`warning: ${floating} blocks stand on air`);

const out = `${DIR}/DC71837.nbt`;
const res = g.save(out);
console.log(`built ${out}: ${res.blocks} blocks, palette ${res.palette}`);
