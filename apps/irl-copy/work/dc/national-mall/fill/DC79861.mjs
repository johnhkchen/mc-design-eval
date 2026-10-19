// DC79861: 300 Indiana Avenue NW, a 1970s municipal office block (Judiciary Square side of the Mall), read from the lidar.
// A ring of 14-block office wings around a low court, a 10-block wing on the west and north-west, a 16-block plant core
// set back in the middle of the main deck, and a 6-block low hall in the court. Precast light-gray concrete piers, pale
// smooth-stone spandrels, a stone-brick base course and cornice, and dark tinted glazing in a two-block storey rhythm
// (spandrel, glass row), so the bays read as ribbon windows like the era's curtain-wall offices.
//
// Storeys sit on absolute two-block rows, so neighbouring columns line up where the ground steps. Each column fills from
// y 0 to its ground as foundation, then its storeys up to its lidar tier, capped by a stone-brick cornice. Interior cells
// one step behind a glass bay are air in the glass row, with a floor slab and ceiling per storey, and a lamp standing on
// the floor where the glass shows it; cells deeper inside are solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC79861.cells.json`, "utf8"));
const W = 50, D = 34, H = 26;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: median of the 3x3 footprint neighbourhood (kills single-cell noise), then four flat tiers.
const tierOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const s = v[v.length >> 1];
  return s <= 7 ? 6 : s <= 11 ? 10 : s <= 14 ? 14 : 16;
};

const faces = (x, z) => FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([f]) => f);
// Piers every third cell along each face (by x on the north and south faces, by z on the east and west).
const isPier = (x, z, fs) => fs.some((f) => ((f === "N" || f === "S") ? x : z) % 3 === 0);

const ENTRY = { x: 11, z: 0 };
const info = new Map();
for (const [x, z, G] of cells) {
  const fs = faces(x, z);
  const facade = fs.length > 0;
  const door = x === ENTRY.x && z === ENTRY.z;
  if (door && !fs.includes("N")) throw new Error("entrance cell must be on the north face");
  info.set(key(x, z), { x, z, g: G, T: tierOf(x, z), facade, door, pier: facade && isPier(x, z, fs) });
}
const at = (x, z) => info.get(key(x, z));
// A bay is a glass facade cell (not pier, not door); a room is an interior cell one step behind a bay.
const isBay = (x, z) => { const c = at(x, z); return !!c && c.facade && !c.pier && !c.door; };
for (const c of info.values()) c.room = !c.facade && FACES.some(([, dx, dz]) => isBay(c.x + dx, c.z + dz));

const FOUND = "stone_bricks", BASE = "stone_bricks", CORNICE = "stone_bricks", SPANDREL = "smooth_stone";
const PIER = "light_gray_concrete", GLASS = "gray_stained_glass_pane", DECK = "smooth_stone";
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const LANTERN = { hanging: "false", waterlogged: "false" };

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { x, z, g: G, T } = c;
  if (y < G) return [c.facade ? BASE : FOUND];
  if (y === T - 1) return [c.facade ? CORNICE : DECK];                 // cornice course and roof deck
  if (c.door) {
    if (y === G) return ["iron_door", DOOR("lower")];
    if (y === G + 1) return ["iron_door", DOOR("upper")];
  }
  if (c.facade && y === G) return [BASE];                              // plinth course at the foot of the facade
  const rel = y % 2;                                                   // even: floor line / spandrel, odd: glass row
  if (!c.facade) {
    if (rel === 0) return [PIER];                                      // floor slab and ceiling
    if (!c.room) return [PIER];
    const lightOK = y - 1 >= G;                                        // a lamp needs a floor under it
    if (lightOK) {
      const h = hash(x, y, z) % 17;
      if (h === 0) return ["lantern", LANTERN];
      if (h === 1) return ["shroomlight"];
      if (h === 2) return ["glowstone"];
    }
    return null;                                                       // air behind the glass
  }
  if (rel === 0) return [SPANDREL];
  if (c.pier) return [PIER];
  return [GLASS];
};

const g = new Voxels([W, H, D]);
const glass = [];
// Roof plant in clusters: 2x2 two-high boxes set in from the parapet on every 8-cell grid, so they read as plant rooms.
const roofPlant = (c) => !c.facade && (c.T === 14 || c.T === 16) && c.x % 8 >= 4 && c.x % 8 <= 5 && c.z % 8 >= 4 && c.z % 8 <= 5;
for (const c of info.values()) {
  for (let y = 0; y < c.T; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    if (b[0] === GLASS) { glass.push([c.x, y, c.z]); g.set(c.x, y, c.z, GLASS); continue; }
    g.set(c.x, y, c.z, b[0], b[1]);
  }
  if (roofPlant(c)) {                                                  // roof plant: two-high boxes on the deck
    g.set(c.x, c.T, c.z, "iron_block"); g.set(c.x, c.T + 1, c.z, "light_gray_concrete");
  }
}

// Panes join their neighbours and any solid, so the glazing reads as continuous bands with frames, not posts.
for (const [x, y, z] of glass) {
  const link = (dx, dz) => g.get(x + dx, y, z + dz) !== null;
  const state = {
    north: String(link(0, -1)), south: String(link(0, 1)), east: String(link(1, 0)), west: String(link(-1, 0)),
    waterlogged: "false",
  };
  g.set(x, y, z, GLASS, state);
}

const out = `${DIR}/DC79861.nbt`;
const res = g.save(out);
console.log(`built ${out}: ${res.blocks} blocks, palette ${res.palette}`);
