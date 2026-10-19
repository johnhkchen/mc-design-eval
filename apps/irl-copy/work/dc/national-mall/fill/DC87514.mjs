// DC87514: a 1960s precast-concrete chancery on the Pennsylvania Avenue side, read from the lidar record. A hollow-court
// block around an open light-well, stepping from a 14-block core down to 9-block wings, with a 4-block dark plinth.
// White precast fins and mullions frame dark bronze-tinted glass in three-block storeys; one glazed-and-canopied
// entrance on the north face; roof plant on the 14-block deck.
//
// Storeys sit on an absolute 3-block rhythm (fin, two glass rows), so neighbouring columns line up where the ground steps.
// Each column fills from y 0 to its ground as foundation, then its storeys up to its lidar tier, capped by a concrete
// cap course. Interior cells one step behind a glass bay are air at the glass rows, with a floor slab per storey and
// a lamp standing on the floor where the glass shows it; cells deeper inside are solid core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87514.cells.json`, "utf8"));
const W = 24, D = 36, H = 26;

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
  return s <= 9 ? 9 : s <= 10 ? 10 : s <= 12 ? 12 : 14;
};

const faces = (x, z) => FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([f]) => f);
// Mullions every third cell: by x on the north and south faces, by z on the east and west.
const isPier = (x, z, fs) => fs.some((f) => ((f === "N" || f === "S") ? x : z) % 3 === 0);

const ENTRY = { x: 10, z: 0 };
const info = new Map();
for (const [x, z, G] of cells) {
  const fs = faces(x, z);
  const facade = fs.length > 0;
  const door = facade && x === ENTRY.x && z === ENTRY.z;
  const canopy = z <= 1 && x >= 8 && x <= 13;                       // entrance canopy over the door, two cells deep
  info.set(key(x, z), { x, z, g: G, T: tierOf(x, z), fs, facade, door, canopy, pier: facade && isPier(x, z, fs) });
}
const at = (x, z) => info.get(key(x, z));
// A bay is a glass facade cell (not pier, not door, not canopy); a room is an interior cell one step behind a bay.
const isBay = (x, z) => { const c = at(x, z); return !!c && c.facade && !c.pier && !c.door && !c.canopy; };
for (const c of info.values()) c.room = !c.facade && FACES.some(([, dx, dz]) => isBay(c.x + dx, c.z + dz));

const FOUND = "stone_bricks", BASE = "polished_andesite", CONC = "white_concrete", DEEP = "light_gray_concrete";
const GLASS = "gray_stained_glass_pane", GLASS_BLUE = "light_blue_stained_glass_pane";
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const LANTERN = { hanging: "false", waterlogged: "false" };

// Glass panes connect along the face they sit in, so a bay reads as one continuous glazed wall.
const paneState = (c) => {
  const ns = c.fs.some((f) => f === "N" || f === "S");
  const ew = c.fs.some((f) => f === "W" || f === "E");
  return { north: String(ew), south: String(ew), east: String(ns), west: String(ns), waterlogged: "false" };
};

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { x, z, g: G, T } = c;
  if (y < G) return [FOUND];                                           // foundation: solid from y 0 up to the ground
  if (y === T - 1) return [c.facade || c.canopy ? CONC : DEEP];        // cap course on the walls, deck inside
  if (c.facade) {
    if (c.door && y === G) return ["iron_door", DOOR("lower")];
    if (c.door && y === G + 1) return ["iron_door", DOOR("upper")];
    if (x === ENTRY.x + 1 && z === ENTRY.z && y === G) return ["iron_door", { ...DOOR("lower"), hinge: "right" }];
    if (x === ENTRY.x + 1 && z === ENTRY.z && y === G + 1) return ["iron_door", { ...DOOR("upper"), hinge: "right" }];
    if (c.canopy && y === G + 2) return [CONC];                        // the canopy: a concrete slab across the entrance
    if (y === G) return [BASE];                                        // dark plinth course
    if (c.pier || y % 3 === 0) return [CONC];                          // mullions and storey fins
    const blue = hash(x, y, z) % 5 === 0;
    return [blue ? GLASS_BLUE : GLASS, paneState(c)];
  }
  if (c.canopy && y === G + 2) return [CONC];
  if (!c.room) return [DEEP];                                          // solid core
  if (y === G || y % 3 === 0) return [DEEP];                           // floor slab per storey
  const h = hash(x, y, z) % 40;                                        // a lamp standing on the floor behind the glass
  if (h === 0) return ["lantern", LANTERN];
  if (h === 1) return ["shroomlight"];
  if (h === 2) return ["glowstone"];
  return null;                                                         // air behind the glass
};

const g = new Voxels([W, H, D]);
let placed = 0;
for (const c of info.values()) {
  for (let y = 0; y < c.T; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    g.set(c.x, y, c.z, b[0], b[1]);
    placed++;
  }
}

// Roof plant on the 14-block deck: a few units standing on the deck, with iron grilles on top.
for (const c of info.values()) {
  if (c.facade || c.canopy || c.T !== 14) continue;
  if (c.x % 5 !== 2 || c.z % 5 !== 2) continue;
  g.set(c.x, c.T, c.z, DEEP);
  g.set(c.x, c.T + 1, c.z, "iron_bars");
}

const out = `${DIR}/DC87514.nbt`;
const { blocks, palette } = g.save(out);
console.log(`DC87514: ${placed} cells filled, ${blocks} blocks, palette ${palette} -> ${out}`);
