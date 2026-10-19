// DC74596: 700 2nd St NE, Commercial-Office-Large, read from the lidar record (footprint 10 x 40, roof about 18 blocks above
// its lowest ground). Inferred, not checked against a survey: a mid-rise office of the 1960s-80s, brick walls between
// tinted-glass bays with light-grey concrete spandrels, a stone shopfront band, a stone parapet, and a set-back plant
// penthouse where the lidar stands highest. The lower south-west wing (13) is one storey lower.
//
// Four-block storeys on the absolute rhythm (spandrel, two glass rows, spandrel), as in the neighbouring kits, so storey
// lines run across the whole block where the ground steps. Each column fills from y 0 to its ground as foundation, then
// up to its tier, so nothing floats. Entrance on the north face: dark-oak doors under a stone canopy. Interior cells one
// step behind an opening are air between floor slabs, with a few lamps; deeper cells are solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC74596.cells.json`, "utf8"));
const W = 10, D = 40, H = 19;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: median of the 3x3 neighbourhood (kills single-cell noise), then three flat tiers: 13 (wing), 16 (deck), 18 (penthouse).
const tierOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  const s = v[v.length >> 1];
  return s <= 14 ? 13 : s <= 17 ? 16 : 18;
};

const outerCell = (x, z) => FACES.some(([, dx, dz]) => !inside(x + dx, z + dz));
const info = new Map();
for (const [x, z, G] of cells) {
  let T = tierOf(x, z);
  const outer = outerCell(x, z);
  if (T === 18 && outer) T = 16;                                        // the penthouse steps back from the outer walls
  info.set(key(x, z), { x, z, g: G, T, outer, door: x === 7 && z === 0, canopy: z === 0 && x >= 6 && x <= 8 });
}
const at = (x, z) => info.get(key(x, z));

// The faces of a cell at height y that look onto air: outside the footprint, or onto a neighbour whose top is at or below y.
const openFaces = (x, z, y) => FACES.filter(([, dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.T <= y; }).map(([f]) => f);
// Piers every third cell along each face: x on the north and south faces, z on the east and west.
const isPier = (x, z, faces) => faces.some((f) => ((f === "N" || f === "S") ? x : z) % 3 === 0);
// A storey's glass rows: the shopfront below y 3, then rows 1 and 2 of each four-block storey, under the cap.
const glassRow = (c, y) => y >= c.g && y < c.T - 1 && (y < 3 || y % 4 === 1 || y % 4 === 2);
const isOpening = (c, y) => {
  if (!glassRow(c, y) && !c.door) return false;
  if (c.door) return y === c.g || y === c.g + 1;
  const faces = openFaces(c.x, c.z, y);
  return faces.length > 0 && !isPier(c.x, c.z, faces) && !c.canopy;
};
// A room is an interior cell one step behind an opening at the same height.
const room = (c, y) => !openFaces(c.x, c.z, y).length && FACES.some(([, dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !!n && isOpening(n, y); });

const FOUND = "stone", FOUND_FACE = "stone_bricks", STONE = "smooth_stone", SPAND = "white_concrete", PIER = "bricks";
const GLASS = "light_blue_stained_glass_pane";
const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const HOOD = { facing: "north", half: "top", shape: "straight", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };

// The block for one cell at height y: [id, state] or null for air. Air only where a room or lobby stands behind an opening.
const blockAt = (c, y) => {
  const { x, z, g: G, T } = c;
  if (y < G) return [c.outer ? FOUND_FACE : FOUND];
  if (y === T) {                                                       // parapet on the outer edge of a deck
    if (!c.outer) return null;
    const arm = (dx, dz) => { const n = at(x + dx, z + dz); return n && n.outer && n.T === T ? "low" : "none"; };
    const N = arm(0, -1), S = arm(0, 1), W = arm(-1, 0), E = arm(1, 0);
    const up = [N, S, W, E].every((a) => a === "none") ? "true" : "false";
    return ["stone_brick_wall", { north: N, south: S, west: W, east: E, up, waterlogged: "false" }];
  }
  if (y > T) return null;
  if (y === T - 1) return [STONE];                                     // cornice and roof deck course
  if (c.door) {
    if (y === G) return ["dark_oak_door", DOOR("lower")];
    if (y === G + 1) return ["dark_oak_door", DOOR("upper")];
  }
  if (c.canopy && y === G + 2) return ["stone_brick_stairs", HOOD];   // stone canopy over the entrance
  if (c.canopy && y === G + 3) return [STONE];                         // solid lintel holding the canopy from above
  const faces = openFaces(x, z, y);
  const rel = y % 4;
  if (faces.length) {                                                  // an exposed wall cell
    if (y === 3) return [STONE];                                       // shopfront header
    if (rel === 0 || rel === 3) return [y < 4 ? STONE : SPAND];         // spandrels and floor lines
    if (isPier(x, z, faces)) return [PIER];
    return [GLASS];
  }
  if (rel === 0 || rel === 3) return [FOUND];                          // floor slabs and ceilings
  if (!room(c, y)) return [FOUND];
  const lightOK = y - 1 < G || rel === 1;                              // a lamp needs a floor under it
  if (lightOK) {
    const h = hash(x, y, z) % 14;
    if (h === 0) return ["lantern", LANTERN];
    if (h === 1) return ["shroomlight"];
    if (h === 2) return ["glowstone"];
  }
  return null;                                                         // air behind the glass
};

// Roof plant: two-high boxes on interior cells of the 16-block deck, kept off the edges and the penthouse.
const roofPlant = (c) => !c.outer && c.T === 16 && (c.x + c.z) % 11 === 0 && c.x > 2 && c.z > 2;

const g = new Voxels([W, H, D]);
const glass = [];
for (const c of info.values()) {
  for (let y = 0; y < H; y++) {
    const b = blockAt(c, y);
    if (!b) continue;
    if (b[0] === GLASS) { glass.push([c.x, y, c.z]); g.set(c.x, y, c.z, GLASS); continue; }
    g.set(c.x, y, c.z, b[0], b[1]);
  }
  if (roofPlant(c)) {
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

const out = `${DIR}/DC74596.nbt`;
const res = g.save(out);
console.log(`built ${out}: ${res.blocks} blocks, palette ${res.palette}`);
