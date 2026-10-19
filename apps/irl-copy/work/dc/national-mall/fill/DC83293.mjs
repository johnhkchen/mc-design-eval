// DC83293: a 1960s-70s brick residential block (880 New Jersey Ave SE, Capitol Hill edge), read from the lidar record.
// A diagonal slab that follows the avenue rises to a 33-block crown, with a 28-block middle tier and 16-block
// wings at the west and north-east ends. Red brick walls with white precast sill bands, stone-brick base course,
// glass bays in each storey, brick piers, one dark-oak entrance on the north face under a stone lintel, roof plant on the
// wings and mid tier.
//
// Storeys sit on absolute 4-block rhythms (sill band, two glass rows, head spandrel), so neighbouring columns line up
// even where the ground steps. Each column fills from y 0 to its ground as foundation, then its storeys up to its
// lidar tier, capped by a solid parapet. Interior cells one step behind a glass bay are air at the glass rows, with a
// floor slab and ceiling per storey and a lamp standing on the floor where the glass shows it; cells deeper inside are solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC83293.cells.json`, "utf8"));
const W = 34, D = 29, H = 36;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: median of the 3x3 footprint neighbourhood (kills single-cell noise), then three flat tiers:
// 16-block wings, a 28-block middle, and the 33-block crown.
const tierOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const s = v[v.length >> 1];
  return s <= 18 ? 16 : s <= 29 ? 28 : 33;
};

const faces = (x, z) => FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([f]) => f);
// Brick piers every third cell along each face (by x on the north and south faces, by z on the east and west).
const isPier = (x, z, fs) => fs.some((f) => ((f === "N" || f === "S") ? x : z) % 3 === 0);

const ENTRY = { x: 5, z: 0 };
const info = new Map();
for (const [x, z, G] of cells) {
  const fs = faces(x, z);
  const facade = fs.length > 0;
  const door = x === ENTRY.x && z === ENTRY.z;
  const lintel = z === 0 && (x === 5 || x === 6);                       // stone lintel over the entrance bay
  info.set(key(x, z), { x, z, g: G, T: tierOf(x, z), facade, door, lintel, pier: facade && isPier(x, z, fs) });
}
const at = (x, z) => info.get(key(x, z));
// A bay is a glass facade cell (not pier, not door, not lintel); a room is an interior cell one step behind a bay.
const isBay = (x, z) => { const c = at(x, z); return !!c && c.facade && !c.pier && !c.door && !c.lintel; };
for (const c of info.values()) c.room = !c.facade && FACES.some(([, dx, dz]) => isBay(c.x + dx, c.z + dz));

const FOUND = "stone", BASE = "stone_bricks", WALL = "bricks", SILL = "white_concrete", GLASS = "light_blue_stained_glass_pane";
const PLANT = "light_gray_concrete";
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const SLAB_TOP = { type: "top", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { x, z, g: G, T } = c;
  if (y < G) return [c.facade ? BASE : FOUND];
  if (y === T - 1) return [c.facade ? "smooth_stone" : FOUND];          // parapet course and roof deck
  if (c.door) {
    if (y === G) return ["dark_oak_door", DOOR("lower")];
    if (y === G + 1) return ["dark_oak_door", DOOR("upper")];
  }
  if (c.lintel && y === G + 2) return ["stone_brick_slab", SLAB_TOP];   // stone lintel: the hood over the door
  if (c.lintel && y === G + 3) return ["smooth_stone"];                 // header, so the lintel is held from above
  const rel = y % 4;
  const ground = y < 4;
  if (!c.facade) {
    if (rel === 0 || rel === 3) return [FOUND];                        // floor slab and ceiling
    if (!c.room) return [FOUND];
    const lightOK = rel === 1 || y - 1 < G;                           // a lamp needs a floor under it
    if (lightOK) {
      const h = hash(x, y, z) % 9;                                    // about one room in three shows a lamp at dusk
      if (h === 0 || h === 3) return ["lantern", LANTERN];
      if (h === 1) return ["glowstone"];
      if (h === 2) return ["shroomlight"];
    }
    return null;                                                       // air behind the glass
  }
  if (rel === 0) return [ground ? BASE : SILL];                        // sill band of white precast
  if (rel === 3) return [ground ? BASE : WALL];                        // head spandrel in brick
  if (c.pier) return [ground ? BASE : WALL];
  return [GLASS];
};

const g = new Voxels([W, H, D]);
const glass = [];
// Roof plant: two-high boxes on the wings and the middle tier, kept off the parapet edge.
const roofPlant = (c) => !c.facade && (c.T === 16 || c.T === 28) && (c.x * 3 + c.z * 5) % 13 === 0;
for (const c of info.values()) {
  for (let y = 0; y < c.T; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    if (b[0] === GLASS) { glass.push([c.x, y, c.z]); g.set(c.x, y, c.z, GLASS); continue; }
    g.set(c.x, y, c.z, b[0], b[1]);
  }
  if (roofPlant(c)) {
    g.set(c.x, c.T, c.z, PLANT); g.set(c.x, c.T + 1, c.z, PLANT);
  }
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

const out = `${DIR}/DC83293.nbt`;
const res = g.save(out);
console.log(`built ${out}: ${res.blocks} blocks, palette ${res.palette}`);
