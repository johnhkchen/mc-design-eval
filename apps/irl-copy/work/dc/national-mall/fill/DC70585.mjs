// DC70585: 950 Pennsylvania Avenue NW, the Justice Department block on the Mall's Pennsylvania Avenue frontage, read from the
// lidar record. A 1930s Stripped Classical federal office: a hollow block around an open court, four storeys (16 blocks)
// on the main wings, 12 and 14-block wings at the edges, the 18-block central tower with an attic band, and a plaza deck
// (roof 0-1) where the lidar sees ground. Limestone-pale walls (smooth stone spandrels, calcite piers), a granite base and
// cornice, glass bays in each storey, one granite-framed entrance on the south face, and air-conditioning plant on the decks.
//
// Storeys sit on absolute 4-block rhythms (floor line, two glass rows, head course), so neighbouring columns line up even
// where the ground steps. Each column fills from y 0 to its ground as foundation, then its storeys up to its tier, capped by
// a granite cornice. A facade is any cell with an open side (outside the footprint, or the court) or a neighbour lower than it,
// so every setback shows its own walls. Interior cells one step behind a glass bay are air at the glass rows, with a floor slab
// and ceiling per storey and a lamp standing on the floor where the glass shows it; cells deeper inside are solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC70585.cells.json`, "utf8"));
const W = 55, D = 76, H = 30;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: median of the 3x3 footprint neighbourhood (kills single-cell noise), then flat tiers on storey lines:
// plaza deck (1), 3 storeys (12), 3.5 with an attic (14), 4 storeys (16), the tower's 4 storeys and attic (18).
const rawMedian = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
const tierFor = (m) => (m <= 1 ? 1 : m <= 12 ? 12 : m <= 14 ? 14 : m <= 16 ? 16 : 18);
const topOf = new Map(cells.map(([x, z]) => [key(x, z), tierFor(rawMedian(x, z))]));
const top = (x, z) => topOf.get(key(x, z));

// Facade sides: open to the air (outside the footprint or the court), or the neighbour stands lower than this cell.
const faces = (x, z) => FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz) || top(x + dx, z + dz) < top(x, z)).map(([f]) => f);
// Piers every third cell along each face (by x on the north and south faces, by z on the east and west).
const isPier = (x, z, fs) => fs.some((f) => ((f === "N" || f === "S") ? x : z) % 3 === 0);

const ENTRY = { x: 27, z: 74 };                                        // south face, on a pier line; the portal is 26-28
const info = new Map();
for (const [x, z, G] of cells) {
  const fs = faces(x, z);
  const facade = fs.length > 0;
  const door = x === ENTRY.x && z === ENTRY.z;
  const portal = z === ENTRY.z && Math.abs(x - ENTRY.x) <= 1;
  info.set(key(x, z), { x, z, g: G, t: top(x, z), facade, door, portal, pier: facade && isPier(x, z, fs) });
}
const at = (x, z) => info.get(key(x, z));
// A bay is a glass facade cell (not pier, not door, not portal); a room is an interior cell one step behind a bay.
const isBay = (x, z) => { const c = at(x, z); return !!c && c.facade && !c.pier && !c.door && !c.portal; };
for (const c of info.values()) c.room = !c.facade && [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => isBay(c.x + dx, c.z + dz));

const FOUND = "stone", STONE = "smooth_stone", BASE = "polished_andesite", PIER = "calcite", GLASS = "glass_pane";
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
const LANTERN = { hanging: "false", waterlogged: "false" };

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { x, z, g: G, t: T } = c;
  const A = 4 * Math.floor(T / 4);                                     // attic: whatever stands above the last whole storey
  if (y < G) return [FOUND];                                           // foundation under the lowest ground
  if (c.door) {
    if (y === G) return ["iron_door", DOOR("lower")];
    if (y === G + 1) return ["iron_door", DOOR("upper")];
    if (y === G + 2) return [BASE];                                    // granite lintel over the door
  }
  if (!c.facade) {
    if (y === T - 1) return [STONE];                                   // roof deck
    const rel = y % 4;
    if (!c.room || y >= A || rel === 0 || rel === 3) return [STONE];   // floors, ceilings, and solid cells deeper in
    if (rel === 1) {                                                   // a lamp needs a floor under it (rel 0 is stone)
      const h = hash(x, y, z) % 19;
      if (h === 0) return ["lantern", LANTERN];
      if (h === 1) return ["shroomlight"];
      if (h === 2) return ["glowstone"];
    }
    return null;                                                       // air behind the glass
  }
  if (y === G) return [BASE];                                          // granite base course on the ground line
  if (y === T - 1) return [BASE];                                      // granite cornice or parapet
  if (c.portal && y < G + 4) return [c.door ? BASE : PIER];           // the portal: calcite jambs, granite lintel
  if (y >= A) return [STONE];                                          // attic band: solid, no windows
  const rel = y % 4;
  if (rel === 0 || rel === 3) return [STONE];                          // spandrels and head course
  if (c.pier) return [PIER];
  return [GLASS];
};

const g = new Voxels([W, H, D]);
const glass = [];
for (const c of info.values()) {
  for (let y = 0; y < c.t; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    if (b[0] === GLASS) { glass.push([c.x, y, c.z]); g.set(c.x, y, c.z, GLASS); continue; }
    g.set(c.x, y, c.z, b[0], b[1]);
  }
  // Air-handling plant on the 16 and 18 decks: two-high boxes standing on the roof deck, spaced so they read as plant.
  const plant = !c.facade && (c.t === 16 || c.t === 18) && (c.x + c.z) % 11 === 0 && c.x > 2 && c.x < 52;
  if (plant) { g.set(c.x, c.t, c.z, "light_gray_concrete"); g.set(c.x, c.t + 1, c.z, "light_gray_concrete"); }
}

// Panes join their neighbours and any solid, so the glazing reads as continuous bays framed by piers, not posts.
for (const [x, y, z] of glass) {
  const link = (dx, dz) => g.get(x + dx, y, z + dz) !== null;
  g.set(x, y, z, GLASS, {
    north: String(link(0, -1)), south: String(link(0, 1)), east: String(link(1, 0)), west: String(link(-1, 0)),
    waterlogged: "false",
  });
}

const out = `${DIR}/DC70585.nbt`;
const res = g.save(out);
console.log(`built ${out}: ${res.blocks} blocks, palette ${res.palette}`);
