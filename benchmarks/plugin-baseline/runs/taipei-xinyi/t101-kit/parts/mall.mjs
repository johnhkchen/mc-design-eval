// P4 Podium mall (plot 0): three stepped masses on the # footprint of the site map (base deck y35, middle y46, NW block
// y68), polished_diorite piers every 8 with glass bays, the shopfront storey, the four street openings, the north
// entrance's slab ramp, and the parapets with quartz coping. Plot-local coordinates. Writes go only into air, so the
// ground, earlier parts and the openings are left alone.
import { slabRamp } from "../vocab.mjs";

// The site map: one character per 5 x 5 block cell (column = x / 5, row = z / 5); # is footprint.
const MAP = [
  "..............######...................",
  ".............#######...................",
  "#################################......",
  "#################################......",
  "#################################......",
  "##################################.....",
  "###################################....",
  "###################################....",
  "###################################....",
  "###################################....",
  "#################################......",
  "#################################......",
  "#################################......",
  "###############################........",
  "###############################........",
  "###############################........",
  "###############################........",
  ".##############################........",
  "..#############################........",
  "..#############################........",
  ".###################################...",
  "####################################...",
  "####################################...",
  "####################################...",
  "####################################...",
  "####################################...",
  "####################################...",
  "######################################.",
  "#######################################",
  "#######################################",
  "#####################################..",
  "####################################...",
  "####################################...",
  "###########......###################...",
  "###########.......##################...",
  "###########.......##################...",
  "...####...........##################...",
  "....###...........##################...",
  ".........................###...........",
  ".........................###...........",
  ".........................###...........",
  ".......................................",
];

const DECK = { base: 35, middle: 46, nw: 68 };
const MIDDLE_RECTS = [
  { x0: 10, x1: 129, z0: 15, z1: 94 },
  { x0: 10, x1: 84, z0: 95, z1: 164 },
];
const NW_RECT = { x0: 10, x1: 74, z0: 20, z1: 84 };
// Street openings (air), from plan.md OPENINGS: north Xinyi entrance, west, south, east doors.
const OPENINGS = [
  { x0: 74, x1: 90, y0: 3, y1: 10, z0: 10, z1: 10 },
  { x0: 0, x1: 0, y0: 5, y1: 12, z0: 60, z1: 69 },
  { x0: 22, x1: 31, y0: 3, y1: 10, z0: 189, z1: 189 },
  { x0: 174, x1: 174, y0: 3, y1: 10, z0: 30, z1: 37 },
];

const inRect = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const has = (x, z) => {
  if (x < 0 || z < 0) return false;
  const r = Math.floor(z / 5), c = Math.floor(x / 5);
  return r < MAP.length && c < MAP[r].length && MAP[r][c] === "#";
};
// The whole mall base: the # cells with z <= 101 or x <= 95 (the pedestal and its plaza are not mall), no north forecourt
// (x 65..99, z 0..9: open paving), and z <= 189 as the base box.
const baseIn = (x, z) => has(x, z) && z <= 189 && !(x >= 65 && x <= 99 && z <= 9) && (z <= 101 || x <= 95);
const MASS = {
  base: baseIn,
  middle: (x, z) => baseIn(x, z) && MIDDLE_RECTS.some((r) => inRect(r, x, z)),
  nw: (x, z) => baseIn(x, z) && inRect(NW_RECT, x, z),
};

const isOpening = (x, y, z) => OPENINGS.some((o) => x >= o.x0 && x <= o.x1 && y >= o.y0 && y <= o.y1 && z >= o.z0 && z <= o.z1);

// The face a ring cell looks out of, and the along-face coordinate (x on north and south, z on east and west).
function faceOf(inside, x, z) {
  if (!inside(x, z - 1)) return "north";
  if (!inside(x, z + 1)) return "south";
  if (!inside(x - 1, z)) return "west";
  return "east";
}
// One cell inside the wall from a face (the way a shopfront's light looks in).
const INWARD = { north: [0, 0, 1], south: [0, 0, -1], west: [1, 0, 0], east: [-1, 0, 0] };

// The wall block at height y for a bay or pier cell: plinth, piers, shopfront glass, fascia, then 11-course storeys
// (spandrel 3 courses at each floor line, 13 + 11k, then glass).
function wallBlock(y, pier) {
  if (y === 2) return "minecraft:polished_andesite";
  if (pier) return "minecraft:polished_diorite";
  if (y <= 10) return "minecraft:glass";
  if (y <= 12) return "minecraft:smooth_quartz";
  return (y - 13) % 11 <= 2 ? "minecraft:smooth_stone" : "minecraft:light_blue_stained_glass";
}

function mass(g, inside, { y0, deck, parapet, plinth = false, shop = false }) {
  const cells = [];
  for (let x = 0; x <= 192; x++) for (let z = 0; z <= 205; z++) if (inside(x, z)) cells.push([x, z]);
  const ring = new Map();
  for (const [x, z] of cells) {
    if (!inside(x, z - 1) || !inside(x, z + 1) || !inside(x - 1, z) || !inside(x + 1, z)) ring.set(`${x},${z}`, faceOf(inside, x, z));
  }
  const put = (x, y, z, block, state) => {
    if (!g.isAir(x, y, z)) return 0;
    g.set(x, y, z, block, state);
    return 1;
  };
  let n = 0;
  // walls: the ring, course by course
  for (const [key, face] of ring) {
    const [x, z] = key.split(",").map(Number);
    const along = face === "north" || face === "south" ? x : z;
    const pier = along % 8 < 2;
    for (let y = y0; y < deck; y++) {
      if (isOpening(x, y, z)) continue;
      n += put(x, y, z, wallBlock(y, pier));
    }
    // shopfront light: one warm froglight in the middle of each bay, one cell inside the glass
    if (shop && !pier && along % 8 === 4 && !isOpening(x, 6, z)) {
      const [dx, dy, dz] = INWARD[face];
      if (inside(x + dx, z + dz) && !ring.has(`${x + dx},${z + dz}`)) n += put(x + dx, 6, z + dz, "minecraft:ochre_froglight");
    }
    for (let y = deck + 1; y <= deck + parapet; y++) n += put(x, y, z, "minecraft:smooth_quartz");
  }
  // plinth under the whole base (the east side stands on y 1 ground), interior floors as slabs
  for (const [x, z] of cells) {
    const isRing = ring.has(`${x},${z}`);
    if (plinth && !isRing) n += put(x, 2, z, "minecraft:polished_andesite");
    for (let y = y0 + 1; y < deck; y++) {
      if ((y - 13) % 11 === 0 && !isRing) n += put(x, y, z, "minecraft:smooth_stone_slab", { type: "bottom" });
    }
    // the deck: coping on the edge, smooth stone within
    n += put(x, deck, z, isRing ? "minecraft:smooth_quartz" : "minecraft:smooth_stone");
  }
  return n;
}

export function build(g) {
  let n = 0;
  n += mass(g, MASS.base, { y0: 2, deck: DECK.base, parapet: 1, plinth: true, shop: true });
  n += mass(g, MASS.middle, { y0: DECK.base + 1, deck: DECK.middle, parapet: 1 });
  n += mass(g, MASS.nw, { y0: DECK.middle + 1, deck: DECK.nw, parapet: 2 });
  // the Xinyi Road entrance: half step up from the forecourt, then a level landing (plan OPENINGS)
  slabRamp(g, { face: "north", from: 72, to: 92, y: 2, slab: 8, landing: 9 });
  return n;
}
