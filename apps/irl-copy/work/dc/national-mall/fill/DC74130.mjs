// DC74130: a 1960s-70s Commercial-Office-Large at 501 3rd St NW, read from the lidar record. An 18-block tower
// (about six storeys at 3 blocks each) stepping down by setbacks to 16, 14 and 12-block wings. Red-brick piers, pale
// stone spandrels every storey, glass ribbon windows between, a dark stone base course and cornice. The entrance on the
// north face is a stone canopy over one iron door, with a glass shopfront storey. Roof plant (a brick-walled
// mechanical room) sits on the 18-block deck.
//
// Storeys sit on absolute 3-block rhythms (spandrel, two glass rows), so neighbouring columns line up where the
// ground steps. Each column fills from y 0 to its ground, then its storeys up to its lidar tier, capped by a cornice
// and a parapet slab. Cells one step behind a glass bay are air at the glass rows, with a floor slab per storey and a
// lamp standing on the floor where the glass shows it; cells deeper inside are solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC74130.cells.json`, "utf8"));
const W = 15, D = 28, H = 30;

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
  return s <= 12.5 ? 12 : s <= 14.5 ? 14 : s <= 16.5 ? 16 : 18;
};

const info = new Map();
for (const [x, z, G] of cells) info.set(key(x, z), { x, z, g: G, t: tierOf(x, z) });
const at = (x, z) => info.get(key(x, z));

// A cell is facade where the outside, or a lower tier, is next to it: the setback faces are walls too.
for (const c of info.values()) {
  c.faces = FACES.filter(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.t < c.t; }).map(([f]) => f);
  c.facade = c.faces.length > 0;
  c.entrance = c.z === 0 && c.x >= 6 && c.x <= 8;                                  // the north-face entrance bay
  c.door = c.entrance && c.x === 7;
  c.pier = c.facade && !c.entrance && c.faces.some((f) => ((f === "N" || f === "S") ? c.x : c.z) % 3 === 0);
  c.plant = !c.facade && c.t === 18 && c.x >= 4 && c.x <= 9 && c.z >= 9 && c.z <= 14;  // roof plant room
  c.edge = c.x === 4 || c.x === 9 || c.z === 9 || c.z === 14;
}
// A bay is a glass facade cell (not pier, not entrance); a room is an interior cell one step behind a bay.
const isBay = (x, z) => { const c = at(x, z); return !!c && c.facade && !c.pier && !c.entrance; };
for (const c of info.values()) c.room = !c.facade && FACES.some(([, dx, dz]) => isBay(c.x + dx, c.z + dz));

const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const CANOPY = { facing: "north", half: "top", shape: "straight", waterlogged: "false" };
const CAP = { type: "bottom", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);

// The entrance: a door in the middle bay, solid stone piers either side, a stone canopy one storey up, then the
// glass rows above it. Above the canopy the header is solid so the glass does not hang over it.
const entranceAt = (c, y) => {
  const { x, g: G } = c;
  if (c.door && y === G) return ["iron_door", DOOR("lower")];
  if (c.door && y === G + 1) return ["iron_door", DOOR("upper")];
  if (y <= G + 1) return ["stone_bricks"];
  if (y === G + 2) return ["stone_brick_stairs", CANOPY];
  if (y === G + 3) return ["smooth_stone"];
  return facadeAt(c, y);
};

// A facade cell at height y: base course, brick piers, storey spandrels and glass ribbon, cornice and cap.
const facadeAt = (c, y) => {
  const { g: G, t: T } = c;
  if (y === G) return ["stone_bricks"];                                  // base course
  if (y === T - 1) return ["stone_brick_slab", CAP];                     // parapet cap
  if (y === T - 2) return ["stone_bricks"];                              // cornice band
  if (c.pier) return ["bricks"];
  if (y % 3 === 0) return ["smooth_stone"];                              // storey spandrel
  return ["glass_pane"];
};

// An interior cell at height y: a room behind a bay gets floor slabs and air at the glass rows; anything deeper is solid.
const interiorAt = (c, y) => {
  const { x, z, g: G, t: T } = c;
  if (y === T - 1) return ["smooth_stone"];                              // roof deck
  if (!c.room) return ["smooth_stone"];
  if (y % 3 === 0) return ["smooth_stone"];                              // floor slab per storey
  if (y % 3 === 1 && y > G) {                                             // a lamp needs a floor under it
    const h = hash(x, y, z) % 12;
    if (h === 0) return ["lantern", LANTERN];
    if (h === 1) return ["shroomlight"];
    if (h === 2) return ["glowstone"];
  }
  return null;                                                           // air behind the glass
};

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { g: G, t: T } = c;
  if (y >= T) {
    if (!c.plant) return null;
    if (y === T) return [c.edge ? "stone_bricks" : "iron_block"];         // plant room floor and walls
    if (y === T + 1 && c.edge) return ["stone_bricks"];
    return null;
  }
  if (y < G) return [c.facade ? "stone_bricks" : "smooth_stone"];        // foundation
  if (c.entrance) return entranceAt(c, y);
  return c.facade ? facadeAt(c, y) : interiorAt(c, y);
};

const g = new Voxels([W, H, D]);
for (const c of info.values()) {
  for (let y = 0; y < H; y++) {
    const b = blockAt(c, y);
    if (b) g.set(c.x, y, c.z, b[0], b[1]);
  }
}
const { blocks, palette } = g.save(`${DIR}/DC74130.nbt`);
console.log(`DC74130.nbt: ${blocks} blocks, ${palette} palette entries`);
