// DC56940: a 1930s Stripped-Classical federal office on the Mall's east side, read from the lidar record. A hollow
// four-storey block open to the south, with two 18-block pavilions on the wings and 14-block low wings at the edges.
// Limestone walls (calcite piers, smooth stone spandrels), a dark stone-brick base course, glass bays in each storey,
// one bronze-doored entrance on the north face under a stone hood, and roof plant on the 16-block deck.
//
// Storeys sit on absolute 4-block rhythms (spandrel, two glass rows, head spandrel), so neighbouring columns line up
// even where the ground steps. Each column fills from y 0 to its ground as foundation, then its storeys up to its
// lidar tier, capped by a solid parapet. Interior cells one step behind a glass bay are air at the glass rows, with a
// floor slab and ceiling per storey and a lamp standing on the floor where the glass shows it; cells deeper inside are solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC56940.cells.json`, "utf8"));
const W = 30, D = 39, H = 20;

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
  return s <= 15 ? 14 : s <= 17 ? 16 : 18;
};

const faces = (x, z) => FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([f]) => f);
// Piers every third cell along each face (by x on the north and south faces, by z on the east and west).
const isPier = (x, z, fs) => fs.some((f) => ((f === "N" || f === "S") ? x : z) % 3 === 0);

const ENTRY = { x: 14, z: 0 };
const info = new Map();
for (const [x, z, G] of cells) {
  const fs = faces(x, z);
  const facade = fs.length > 0;
  const door = x === ENTRY.x && z === ENTRY.z;
  info.set(key(x, z), { x, z, g: G, T: tierOf(x, z), facade, door, pier: facade && isPier(x, z, fs) });
}
const at = (x, z) => info.get(key(x, z));
// A bay is a glass facade cell (not pier, not door); a room is an interior cell one step behind a bay.
const isBay = (x, z) => { const c = at(x, z); return !!c && c.facade && !c.pier && !c.door; };
for (const c of info.values()) c.room = !c.facade && FACES.some(([, dx, dz]) => isBay(c.x + dx, c.z + dz));

const FOUND = "stone", STONE = "smooth_stone", BASE = "stone_bricks", PIER = "calcite", GLASS = "glass_pane";
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const HOOD = { facing: "north", half: "top", shape: "straight", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { x, z, g: G, T } = c;
  if (y < G) return [c.facade ? BASE : FOUND];
  if (y === T - 1) return [STONE];                                     // parapet course and roof deck
  const hood = z === 0 && x >= 13 && x <= 15;                          // stone hood over the entrance, on the north face
  if (c.door) {
    if (y === G) return ["iron_door", DOOR("lower")];
    if (y === G + 1) return ["iron_door", DOOR("upper")];
  }
  if (hood && y === G + 2) return ["stone_brick_stairs", HOOD];        // upper half-step lip: the canopy
  if (hood && y === G + 3) return [STONE];                             // solid header, so the hood is held from above
  const rel = y % 4;
  const ground = y < 4;
  if (!c.facade) {
    if (rel === 0 || rel === 3) return [STONE];                        // floor slab and ceiling
    if (!c.room) return [STONE];
    const lightOK = rel === 1 || y - 1 < G;                           // a lamp needs a floor under it
    if (lightOK) {
      const h = hash(x, y, z) % 19;
      if (h === 0) return ["lantern", LANTERN];
      if (h === 1) return ["shroomlight"];
      if (h === 2) return ["glowstone"];
    }
    return null;                                                       // air behind the glass
  }
  if (rel === 0 || rel === 3) return [ground ? BASE : STONE];        // spandrels and floor lines
  if (c.pier) return [ground ? BASE : PIER];
  return [GLASS];
};

const g = new Voxels([W, H, D]);
const glass = [];
const roofPlant = (c) => !c.facade && c.T === 16 && (c.x + c.z) % 11 === 0 && c.x > 2 && c.x < 27;
for (const c of info.values()) {
  for (let y = 0; y < c.T; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    if (b[0] === GLASS) { glass.push([c.x, y, c.z]); g.set(c.x, y, c.z, GLASS); continue; }
    g.set(c.x, y, c.z, b[0], b[1]);
  }
  if (roofPlant(c)) {                                                  // roof plant: two-high boxes on the 16-block deck
    g.set(c.x, c.T, c.z, "light_gray_concrete"); g.set(c.x, c.T + 1, c.z, "light_gray_concrete");
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

const out = `${DIR}/DC56940.nbt`;
const res = g.save(out);
console.log(`built ${out}: ${res.blocks} blocks, palette ${res.palette}`);
