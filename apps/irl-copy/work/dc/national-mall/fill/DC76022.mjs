// DC76022: 400 C Street SW, a Commercial-Office-Large on the Mall's south side, read from the lidar record. Two masses on one
// footprint: 12-block wings all round, and a 14-block core rising from the middle of the north half with a small plant
// enclosure on its roof. Read as a mid-century federal office: white precast piers, light-grey spandrels, stone
// plinth and floor lines, glass bays with the piers as frames, and a stone-headed entrance on the north face.
// Storeys are 4 blocks on absolute rhythms (plinth, spandrel, two glass rows, spandrel) so neighbouring columns line up.
// Each column fills from y 0 to its ground (zero here: the site is flat), then its storeys up to its tier, capped by a
// stone top course. Interior cells one step behind a glass bay are air at the glass rows, with a floor slab and ceiling
// per storey and a lamp standing on the floor where the glass shows it; cells deeper inside are solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC76022.cells.json`, "utf8"));
const W = 24, D = 51, H = 16;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: median of the 3x3 neighbourhood (kills single-cell noise), then two flat tiers: wings 12, core 14.
const tierOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  return v[v.length >> 1] >= 14 ? 14 : 12;
};
// A cell is deep when the whole 5x5 around it is footprint: the plant enclosure sits there, clear of every edge.
const deep = (x, z) => { for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (!inside(x + dx, z + dz)) return false; return true; };

const faces = (x, z) => FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([f]) => f);
// Piers every third cell along each face (by x on the north and south faces, by z on the east and west).
const isPier = (x, z, fs) => fs.some((f) => ((f === "N" || f === "S") ? x : z) % 3 === 0);

const ENTRY = { x: 16, z: 0 };
const info = new Map();
for (const [x, z, G] of cells) {
  const fs = faces(x, z);
  const facade = fs.length > 0;
  const door = x === ENTRY.x && z === ENTRY.z;
  info.set(key(x, z), { x, z, g: G, T: tierOf(x, z), facade, door, pier: facade && !door && isPier(x, z, fs) });
}
const at = (x, z) => info.get(key(x, z));
// A bay is a glass facade cell (not pier, not door); a room is an interior cell one step behind a bay.
const isBay = (x, z) => { const c = at(x, z); return !!c && c.facade && !c.pier && !c.door; };
for (const c of info.values()) c.room = !c.facade && FACES.some(([, dx, dz]) => isBay(c.x + dx, c.z + dz));

const PLINTH = "stone_bricks", FOUND = "stone", FLOOR = "smooth_stone", SPANDREL = "light_gray_concrete";
const PIER = "white_concrete", GLASS = "glass_pane", PLANT = "light_gray_concrete";
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const LANTERN = { hanging: "false", waterlogged: "false" };

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { x, z, g: G, T } = c;
  if (y < G) return [c.facade ? PLINTH : FOUND];
  if (y === T - 1) return [c.facade ? FLOOR : FOUND];                  // stone top course, the parapet
  if (c.door) {
    if (y === G) return ["iron_door", DOOR("lower")];
    if (y === G + 1) return ["iron_door", DOOR("upper")];
  }
  if (z === 0 && x >= 15 && x <= 17 && y === 2) return [FLOOR];         // stone header over the entrance, the canopy band
  const rel = y % 4;
  const ground = y < 4;
  if (!c.facade) {
    if (rel === 0 || rel === 3) return [FOUND];                         // floor slab and ceiling
    if (!c.room) return [FOUND];
    const lightOK = rel === 1 || y - 1 < G;                            // a lamp needs a floor under it
    if (lightOK) {
      const h = hash(x, y, z) % 19;
      if (h === 0) return ["lantern", LANTERN];
      if (h === 1) return ["shroomlight"];
      if (h === 2) return ["glowstone"];
    }
    return null;                                                        // air behind the glass
  }
  if (y === 0) return [PLINTH];                                         // plinth course
  if (rel === 3) return [SPANDREL];                                     // spandrel under each floor
  if (rel === 0) return [FLOOR];                                        // floor line
  if (c.pier) return [ground ? PLINTH : PIER];
  return [GLASS];
};

const g = new Voxels([W, H, D]);
const glass = [];
// Wing roofs (12) carry two solid plant pads, two blocks high (not scattered posts); the core (14) carries a deep enclosure rising to 16.
const PADS = [[3, 5, 3, 5], [14, 18, 36, 39]];                          // x0,x1,z0,z1 on the wing decks
const wingPlant = (c) => c.T === 12 && !c.facade && PADS.some(([x0, x1, z0, z1]) => c.x >= x0 && c.x <= x1 && c.z >= z0 && c.z <= z1);
const corePlant = (c) => c.T === 14 && deep(c.x, c.z) && c.x >= 15 && c.x <= 18 && c.z >= 6 && c.z <= 12;
for (const c of info.values()) {
  for (let y = 0; y < c.T; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    if (b[0] === GLASS) { glass.push([c.x, y, c.z]); g.set(c.x, y, c.z, GLASS); continue; }
    g.set(c.x, y, c.z, b[0], b[1]);
  }
  if (wingPlant(c)) { g.set(c.x, c.T, c.z, PLANT); g.set(c.x, c.T + 1, c.z, PLANT); }
  if (corePlant(c)) { for (let y = c.T; y < c.T + 2; y++) g.set(c.x, y, c.z, y === c.T + 1 ? FLOOR : PLANT); }
}

// Panes join their neighbours and any solid, so the glazing reads as continuous bays framed by the piers, not posts.
for (const [x, y, z] of glass) {
  const link = (dx, dz) => g.get(x + dx, y, z + dz) !== null;
  const state = {
    north: String(link(0, -1)), south: String(link(0, 1)), east: String(link(1, 0)), west: String(link(-1, 0)),
    waterlogged: "false",
  };
  g.set(x, y, z, GLASS, state);
}

const out = `${DIR}/DC76022.nbt`;
const res = g.save(out);
console.log(`built ${out}: ${res.blocks} blocks, palette ${res.palette}`);
