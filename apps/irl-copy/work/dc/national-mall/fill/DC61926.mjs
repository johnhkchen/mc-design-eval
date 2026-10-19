// DC61926: a 1930s Stripped-Classical federal office block on the Mall's north side, read from the lidar record.
// The footprint is three ranges: a broad north block with an open light court cut in from its north edge, a central
// spine running south, and a south block. Lidar roof heights are median-filtered over 3x3 and snapped to five flat
// tiers (7 two-storey wings, 11 three-storey rim, 13 four-storey body, 15 five-storey spine, 17 the small tower).
//
// Limestone walls (white concrete), a dark stone-brick foundation and base course, calcite piers every third cell,
// smooth-stone spandrels on a 3-block storey rhythm (floor band, two glass rows), a cornice and a parapet cap.
// Two iron doors sit in glass-and-pier bays on the north and south faces, with a stone lintel above.
// Rooms sit one cell behind the skin: air behind the glass, floor and ceiling slabs per storey, a few standing lanterns
// behind the windows. Interiors deeper than that are solid. Every column fills from y 0 to its roof; no slab floats.
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
import { readFileSync } from "node:fs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC61926.cells.json`, "utf8"));
const W = 80, D = 87, H = 29;

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// Lidar roof: median of the 3x3 neighbourhood, then snapped to the nearest flat tier.
const snap = (v) => (v <= 8 ? 7 : v <= 12 ? 11 : v <= 14 ? 13 : v <= 16 ? 15 : 17);
const tierOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).r);
  v.sort((a, b) => a - b);
  return snap(v[v.length >> 1]);
};

// Per footprint cell: ground G, roof tier T, whether it is on the skin (a neighbour is outside), whether it is a room
// (one cell behind the skin), and whether it is a pier column (every third cell on each face).
const info = new Map();
for (const [x, z, G] of cells) {
  const fs = FACES.filter(([, dx, dz]) => !inside(x + dx, z + dz)).map(([f]) => f);
  const facade = fs.length > 0;
  const pier = facade && fs.some((f) => ((f === "N" || f === "S") ? x : z) % 3 === 0);
  info.set(key(x, z), { x, z, G, T: tierOf(x, z), facade, pier, room: false, fs });
}
for (const c of info.values()) {
  if (c.facade) continue;
  c.room = FACES.some(([, dx, dz]) => info.get(key(c.x + dx, c.z + dz))?.facade);
}

// Entrances: one on the north face and one on the south face, at x 40, in a recessed bay of glass and piers.
const DOORS = [{ x: 40, z: 0, facing: "north" }, { x: 40, z: 86, facing: "south" }];
const doorBay = (x, z) => DOORS.some((d) => Math.abs(x - d.x) <= 2 && z === d.z);
const isDoor = (x, z) => DOORS.some((d) => d.x === x && d.z === z);

// Rooftop plant: a 2x2 block of grey concrete on the 13-tier and taller interior roofs, on a 9-cell grid.
const plant = (c, y) => y === c.T && c.T >= 13 && !c.facade && c.x % 9 >= 4 && c.x % 9 <= 5 && c.z % 9 >= 4 && c.z % 9 <= 5;

const FOUND = "stone_bricks", FLOOR = "smooth_stone", CORE = "white_concrete", PIER = "calcite";
const CAP = { stone_brick_slab: { type: "bottom", waterlogged: "false" } };
const DOOR = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
const LANTERN = { hanging: "false", waterlogged: "false" };

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { x, z, G, T } = c;
  if (y >= T) return plant(c, y) ? ["gray_concrete"] : null;
  if (y < G) return c.facade ? [FOUND] : ["stone"];
  if (y === T - 1) return c.facade ? ["stone_brick_slab", CAP.stone_brick_slab] : ["stone"];   // parapet / roof deck
  if (c.facade) {
    const d = DOORS.find((dd) => dd.z === z && Math.abs(x - dd.x) <= 2);
    if (d && y <= G + 2) {                                                                  // entrance bay
      if (isDoor(x, z) && y === G + 1) return ["iron_door", DOOR(d.facing, "lower")];
      if (isDoor(x, z) && y === G + 2) return ["iron_door", DOOR(d.facing, "upper")];
      if (x === d.x) return [PIER];
      if (Math.abs(x - d.x) === 1 || x === d.x + 2) return [PIER];
      return ["glass"];
    }
    if (d && y === G + 3) return [FOUND];                                                   // lintel over the door
    if (y === T - 2) return [FOUND];                                                        // cornice
    if (y === G) return [FOUND];                                                            // base course
    if (c.pier) return [PIER];
    if (y % 3 === 1) return [FLOOR];                                                        // spandrel / sill band
    if (y < G + 3) return ["glass"];                                                        // ground floor storefront
    return ["glass_pane"];
  }
  if (c.room) {
    if (y <= G || y % 3 === 1 || y >= T - 1) return [FLOOR];                                // floor and ceiling slabs
    // Warm light: a standing lantern on the floor slab behind some upper windows.
    if (y % 3 === 2 && y > G + 2 && (x * 31 + z * 17 + y) % 11 === 0) return ["lantern", LANTERN];
    return null;                                                                             // air behind the glass
  }
  return [CORE];
};

const g = new Voxels([W, H, D]);
for (const c of info.values()) {
  for (let y = 0; y <= c.T; y++) {
    const b = blockAt(c, y);
    if (b) g.set(c.x, y, c.z, b[0], b[1]);
  }
}

// Entrance lobby lamp hanging from the ceiling slab behind each door.
for (const d of DOORS) {
  const c = info.get(key(d.x, d.z + (d.z === 0 ? 1 : -1)));
  if (c) g.set(d.x, 3, c.z, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/DC61926.nbt`);
console.log(`DC61926: ${g.count()} blocks, ${g.palette.length - 1} distinct states`);
