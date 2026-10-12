// Shared vocabulary for the McMansion: palette names, site coordinates (plan.md), OPENINGS, and the plan's helpers.
// Helpers that place blocks take the grid (or the runParts view) as the first argument `g`.
// wallBlock() is pure: it returns the [block, state] pair for one exterior cell; spread it into g.set.
import { readFileSync } from "node:fs";
import { B, Grid, roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
export { B, Grid };

// ---- data version: mcd's latest release (26.3) -------------------------------------------------------------------
export const DATA_VERSION = 5023;
export const SITE_SIZE = [44, 15, 32];

// ---- palette (names from palette.json; the ids are checked there) --------------------------------------------------
export const PALETTE = JSON.parse(readFileSync(new URL("./palette.json", import.meta.url), "utf8"));
export const SIDING = "birch_planks";
export const VENEER_MIX = [["andesite", 40], ["stone", 30], ["cobblestone", 20], ["stone_bricks", 10]];
export const PLINTH = "stone_bricks";
export const BELT = "smooth_quartz";                 // belt course y5 and frieze y9 on exterior planes
export const TRIM = "quartz_block";                  // quoins, corner columns
export const SHUTTER = "black_concrete";
export const GLASS = "glass_pane";
export const INTERIOR_WALL = "white_concrete";
export const ROOF_MATERIAL = "dark-slate";           // roof palette name for the roof library
export const GRASS = "grass_block";
export const MULCH = "coarse_dirt";
export const LEAVES = "azalea_leaves";
export const FLOWER_LEAVES = "flowering_azalea_leaves";
export const DECK_PLANK = "spruce_planks";

// ---- site coordinates (block coordinates, inclusive) ---------------------------------------------------------------
export const MAIN = { x0: 18, y0: 0, z0: 11, x1: 35, y1: 9, z1: 25 };
export const WING = { x0: 35, y0: 0, z0: 12, x1: 42, y1: 9, z1: 24 };
export const TURRET = { x0: 38, y0: 0, z0: 8, x1: 42, y1: 9, z1: 12 };
export const GARAGE = { x0: 1, y0: 0, z0: 7, x1: 17, y1: 9, z1: 24 };
export const PORTICO = { x0: 22, y0: 0, z0: 7, x1: 31, y1: 9, z1: 10 };
export const CHIMNEY = { x0: 39, y0: 1, z0: 25, x1: 41, y1: 14, z1: 26 };
export const DECK_BOX = { x0: 19, y0: 1, z0: 26, x1: 34, y1: 2, z1: 31 };
export const ENTRANCE = [27, 1, 6];
export const ROOF_BASE_Y = 10;

// Rooms: inner air box [x0,y0,z0,x1,y1,z1] (plan.md ROOMS).
export const ROOMS = [
  { name: "Foyer", box: [24, 1, 12, 29, 8, 16] },
  { name: "Home office", box: [19, 1, 12, 22, 4, 16] },
  { name: "Formal dining room", box: [31, 1, 12, 34, 4, 16] },
  { name: "Kitchen and great room", box: [19, 1, 18, 34, 4, 24] },
  { name: "Family room", box: [36, 1, 13, 41, 4, 23] },
  { name: "Bay nook", box: [39, 1, 9, 41, 4, 11] },
  { name: "Mudroom and laundry", box: [2, 1, 19, 16, 4, 23] },
  { name: "Garage", box: [2, 1, 8, 16, 4, 17] },
  { name: "Gallery landing", box: [24, 6, 17, 29, 8, 24] },
  { name: "West passage", box: [19, 6, 18, 22, 8, 19] },
  { name: "East passage", box: [31, 6, 18, 34, 8, 19] },
  { name: "Bedroom 2", box: [19, 6, 12, 22, 8, 16] },
  { name: "Bedroom 3", box: [31, 6, 12, 34, 8, 16] },
  { name: "Bedroom 4", box: [19, 6, 21, 22, 8, 24] },
  { name: "Primary bedroom", box: [36, 6, 13, 41, 8, 19] },
  { name: "Primary sitting nook", box: [39, 6, 9, 41, 8, 11] },
  { name: "Primary bath", box: [36, 6, 21, 41, 8, 23] },
  { name: "Walk-in closet", box: [31, 6, 21, 34, 8, 24] },
  { name: "Bonus room", box: [2, 6, 8, 16, 8, 23] },
];

// OPENINGS: every opening in plan.md. Cell ranges are inclusive and absolute. kind: window | palladian | entry |
// carriage | arch | door | tunnel | cased. face: exterior outward direction, or null for interior openings.
// sh: flagged for black shutter strips (shutterCells).
const O = (name, kind, face, x, y, z, sh = false) => ({ name, kind, face, x, y, z, sh });
export const OPENINGS = [
  // north faces (z min)
  O("bonus front 1", "window", "north", [4, 5], [6, 8], [7, 7], true),
  O("bonus front 2", "window", "north", [9, 10], [6, 8], [7, 7], true),
  O("bonus front 3", "window", "north", [14, 15], [6, 8], [7, 7], true),
  O("carriage bay 1", "carriage", "north", [3, 6], [1, 3], [7, 7]),
  O("carriage bay 2", "carriage", "north", [8, 11], [1, 3], [7, 7]),
  O("carriage bay 3", "carriage", "north", [13, 16], [1, 3], [7, 7]),
  O("office", "window", "north", [20, 21], [2, 4], [11, 11], true),
  O("BR2 front", "window", "north", [20, 21], [6, 8], [11, 11], true),
  O("entry", "entry", "north", [25, 28], [1, 4], [11, 11]),
  O("palladian front", "palladian", "north", [25, 28], [6, 8], [11, 11]),
  O("dining", "window", "north", [32, 33], [2, 4], [11, 11], true),
  O("BR3 front", "window", "north", [32, 33], [6, 8], [11, 11], true),
  O("turret arch low", "arch", "north", [39, 41], [1, 3], [12, 12]),
  O("turret arch high", "arch", "north", [39, 41], [6, 8], [12, 12]),
  O("turret front low", "window", "north", [40, 40], [2, 4], [8, 8]),
  O("turret front high", "window", "north", [40, 40], [6, 8], [8, 8]),
  // turret side faces and wing east face (x max)
  O("turret west low", "window", "west", [38, 38], [2, 4], [10, 10]),
  O("turret west high", "window", "west", [38, 38], [6, 8], [10, 10]),
  O("turret east low", "window", "east", [42, 42], [2, 4], [10, 10]),
  O("turret east high", "window", "east", [42, 42], [6, 8], [10, 10]),
  O("family east low", "window", "east", [42, 42], [2, 4], [15, 16], true),
  O("family east 2", "window", "east", [42, 42], [2, 4], [19, 20], true),
  O("primary east", "window", "east", [42, 42], [6, 8], [15, 16], true),
  O("bath east", "window", "east", [42, 42], [7, 8], [21, 22]),
  // south faces (z max)
  O("family back", "window", "south", [37, 38], [2, 4], [24, 24]),
  O("bath back", "window", "south", [37, 38], [7, 8], [24, 24]),
  O("kitchen back", "window", "south", [20, 21], [2, 4], [25, 25], true),
  O("back door", "entry", "south", [25, 28], [1, 4], [25, 25]),
  O("nook back", "window", "south", [32, 33], [2, 4], [25, 25], true),
  O("BR4 back", "window", "south", [20, 21], [6, 8], [25, 25], true),
  O("hall palladian", "palladian", "south", [25, 28], [6, 8], [25, 25]),
  O("closet back", "window", "south", [32, 33], [7, 8], [25, 25]),
  O("garage back door", "door", "south", [12, 12], [1, 2], [24, 24]),
  O("mudroom back 1", "window", "south", [4, 5], [2, 3], [24, 24]),
  O("mudroom back 2", "window", "south", [8, 9], [2, 3], [24, 24]),
  O("bonus back 1", "window", "south", [4, 5], [6, 8], [24, 24]),
  O("bonus back 2", "window", "south", [11, 12], [6, 8], [24, 24]),
  // west face (x min): garage and bonus room
  O("garage west", "window", "west", [1, 1], [2, 3], [12, 13]),
  O("mudroom west", "window", "west", [1, 1], [2, 3], [20, 21]),
  O("bonus west 1", "window", "west", [1, 1], [6, 8], [10, 11]),
  O("bonus west 2", "window", "west", [1, 1], [6, 8], [19, 20]),
  // interior: ground floor (air until the room designers place doors)
  O("office door", "door", null, [23, 23], [1, 2], [14, 14]),
  O("dining door", "door", null, [30, 30], [1, 2], [14, 14]),
  O("kitchen door", "door", null, [33, 33], [1, 2], [17, 17]),
  O("mudroom door", "door", null, [15, 15], [1, 2], [18, 18]),
  O("mudroom tunnel", "tunnel", null, [17, 18], [1, 2], [21, 21]),
  O("family cased", "cased", null, [35, 35], [1, 3], [19, 22]),
  // interior: upper floor
  O("gallery to BR2", "door", null, [20, 20], [6, 7], [17, 17]),
  O("gallery to BR3", "door", null, [33, 33], [6, 7], [17, 17]),
  O("west passage door", "door", null, [23, 23], [6, 7], [18, 18]),
  O("east passage door", "door", null, [30, 30], [6, 7], [18, 18]),
  O("west passage to BR4", "door", null, [21, 21], [6, 7], [20, 20]),
  O("bonus tunnel", "tunnel", null, [17, 18], [6, 7], [18, 18]),
  O("east passage to primary", "tunnel", null, [35, 35], [6, 7], [18, 18]),
  O("bath door", "door", null, [38, 38], [6, 7], [20, 20]),
  O("bath to closet", "door", null, [35, 35], [6, 7], [22, 22]),
];
export const openingsOf = (...kinds) => OPENINGS.filter((o) => kinds.includes(o.kind));

// Corner quoins: corner cell [x,z], and the neighbour cells along each exposed face [x, z, face].
const QUOINS = [
  { c: [1, 7], n: [[2, 7, "north"], [1, 8, "west"]] },
  { c: [17, 7], n: [[16, 7, "north"], [17, 8, "east"]] },
  { c: [18, 11], n: [[19, 11, "north"]] },
  { c: [1, 24], n: [[2, 24, "south"], [1, 23, "west"]] },
  { c: [17, 24], n: [[16, 24, "south"]] },
  { c: [18, 25], n: [[19, 25, "south"]] },
  { c: [35, 25], n: [[34, 25, "south"]] },
  { c: [42, 24], n: [[41, 24, "south"], [42, 23, "east"]] },
];

const leaves = (name, extra = {}) => [name, { persistent: "true", ...extra }];
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;
const put = (g, [x, y, z], pair) => g.set(x, y, z, ...pair);
const mulchAt = (g, x, z) => { if (g.blockAt(x, 0, z) === "minecraft:grass_block") g.set(x, 0, z, MULCH); };

// ---- wallBlock(face, x, y, z): pure; the [block, state] pair for one exterior wall cell -------------------------------
// y0 plinth; y5 and y9 belt and frieze; y1..4 veneer on the north (front) plane, which the caller also passes for the
// corner wrap cells; siding everywhere else.
export function wallBlock(face, x, y, z) {
  if (y === 0) return [PLINTH];
  if (y === 5 || y === 9) return [BELT];
  if (face === "north" && y >= 1 && y <= 4) return [veneerAt(x, y, z)];
  return [SIDING];
}
function veneerAt(x, y, z) {
  let r = hash(x, y, z) % 100;
  for (const [block, w] of VENEER_MIX) { if (r < w) return block; r -= w; }
  return VENEER_MIX[0][0];
}

// ---- quoins(g): corner columns y1..9, neighbour cells alternate quartz (even y) and siding (odd y) -----------------
// y5 and y9 are the bands and are skipped on the neighbours. Lower-front veneer (north, y1..4) is kept.
export function quoins(g) {
  for (const { c: [cx, cz], n } of QUOINS) {
    for (let y = 1; y <= 9; y++) g.set(cx, y, cz, TRIM);
    for (const [nx, nz, f] of n) {
      for (let y = 1; y <= 9; y++) {
        if (y === 5 || y === 9) continue;
        if (f === "north" && y <= 4) continue;
        g.set(nx, y, nz, y % 2 === 0 ? TRIM : SIDING);
      }
    }
  }
}

// ---- shutterCells(g): black strips beside every sh window, over its y range ----------------------------------------
export function shutterCells(g) {
  for (const o of OPENINGS) {
    if (!o.sh) continue;
    for (let y = o.y[0]; y <= o.y[1]; y++) {
      if (o.face === "north" || o.face === "south") {
        g.set(o.x[0] - 1, y, o.z[0], SHUTTER);
        g.set(o.x[1] + 1, y, o.z[0], SHUTTER);
      } else {
        g.set(o.x[0], y, o.z[0] - 1, SHUTTER);
        g.set(o.x[0], y, o.z[1] + 1, SHUTTER);
      }
    }
  }
}

// ---- archWindow(g, a0, a1, yb, yt, plane, face): glass, arch springers, sill and hood ----------------------------
// For north/south faces the window runs along x (a0..a1 are x) at z = plane; for east/west it runs along z at x = plane.
// Springers face away from the window centre (west/east, or north/south on the x faces). Sill and hood sit on the
// outside plane (plane-1 for north and west, plane+1 for south and east).
export function archWindow(g, a0, a1, yb, yt, plane, face) {
  const alongX = face === "north" || face === "south";
  const at = (a, y, p) => (alongX ? [a, y, p] : [p, y, a]);
  const outside = face === "north" || face === "west" ? plane - 1 : plane + 1;
  const low = alongX ? "west" : "north", high = alongX ? "east" : "south";
  for (let a = a0; a <= a1; a++) for (let y = yb; y <= yt; y++) put(g, at(a, y, plane), [GLASS]);
  if (a0 === a1) put(g, at(a0, yt, plane), B.slab("quartz", "top"));
  else { put(g, at(a0, yt, plane), B.stairs("quartz", low, "top")); put(g, at(a1, yt, plane), B.stairs("quartz", high, "top")); }
  for (let a = a0; a <= a1; a++) {
    put(g, at(a, yb - 1, outside), B.slab("quartz", "top"));
    put(g, at(a, yt + 1, outside), B.slab("quartz", "bottom"));
  }
}

// archOpening(g, o): archWindow for an OPENINGS entry (face and ranges taken from the entry).
export function archOpening(g, o) {
  const alongX = o.face === "north" || o.face === "south";
  if (alongX) archWindow(g, o.x[0], o.x[1], o.y[0], o.y[1], o.z[0], o.face);
  else archWindow(g, o.z[0], o.z[1], o.y[0], o.y[1], o.x[0], o.face);
}

// ---- entryDoor(g, o): the 4-wide entry or back door at an OPENINGS entry (kind entry) ---------------------------
// Doors dark_oak_door at the two middle columns (hinges on the outer ends), sidelights, transom, fan and springers.
// The palladian window above is its own OPENINGS entry (kind palladian): archOpening.
export function entryDoor(g, o) {
  const [x0, x1] = o.x, [y0] = o.y, z = o.z[0], facing = o.face;
  const midLeft = x0 + 1, midRight = x0 + 2;
  for (const [x, hinge] of [[midLeft, "left"], [midRight, "right"]]) {
    g.set(x, y0, z, ...B.door("dark_oak", facing, "lower", hinge));
    g.set(x, y0 + 1, z, ...B.door("dark_oak", facing, "upper", hinge));
  }
  for (let y = y0; y <= y0 + 2; y++) { g.set(x0, y, z, GLASS); g.set(x1, y, z, GLASS); }
  g.set(midLeft, y0 + 2, z, GLASS); g.set(midRight, y0 + 2, z, GLASS);
  g.set(midLeft, y0 + 3, z, GLASS); g.set(midRight, y0 + 3, z, GLASS);
  put(g, [x0, y0 + 3, z], B.stairs("quartz", "west", "top"));
  put(g, [x1, y0 + 3, z], B.stairs("quartz", "east", "top"));
}

// plainDoor(g, o): a one-wide 2-high door (the garage back door) at an OPENINGS entry.
export function plainDoor(g, o) {
  g.set(o.x[0], o.y[0], o.z[0], ...B.door("dark_oak", o.face, "lower", "left"));
  g.set(o.x[0], o.y[0] + 1, o.z[0], ...B.door("dark_oak", o.face, "upper", "left"));
}

// ---- column(g, x, z): quartz base, shaft, chiseled capital (y1..8) -------------------------------------------------
export function column(g, x, z) {
  g.set(x, 1, z, ...B.slab("quartz", "bottom"));
  for (let y = 2; y <= 7; y++) g.set(x, y, z, ...B.pillar("quartz_pillar", "y"));
  g.set(x, 8, z, "chiseled_quartz_block");
}

// ---- portico(g): floor, four columns, half columns at the wall, entablature, ceiling, landing, hanging lanterns ----
export function portico(g) {
  g.fill([22, 0, 7], [31, 0, 10], "stone_bricks");
  g.fill([26, 0, 7], [27, 0, 10], BELT);
  for (const x of [23, 25, 28, 30]) column(g, x, 7);
  for (const x of [23, 30]) for (let y = 1; y <= 8; y++) g.set(x, y, 10, ...B.pillar("quartz_pillar", "y"));
  g.fill([22, 9, 7], [31, 9, 7], "quartz_block");
  g.fill([22, 9, 7], [22, 9, 10], "quartz_block");
  g.fill([31, 9, 7], [31, 9, 10], "quartz_block");
  g.fill([23, 9, 8], [30, 9, 10], SIDING);
  for (let x = 24; x <= 29; x++) put(g, [x, 1, 6], B.slab("stone_brick", "bottom"));
  g.set(26, 8, 8, ...B.lantern(true));
  g.set(27, 8, 8, ...B.lantern(true));
}

// ---- carriageDoor(g, x0): one 4-wide garage bay on the z=7 front (bracing trapdoors on z=6) ------------------------
export function carriageDoor(g, x0) {
  const z = 7, out = 6;
  for (let y = 1; y <= 2; y++) for (let x = x0; x <= x0 + 3; x++) g.set(x, y, z, INTERIOR_WALL);
  for (const x of [x0 + 1, x0 + 2]) for (let y = 1; y <= 2; y++) g.set(x, y, out, ...B.trapdoor("dark_oak", "north", "bottom", true));
  g.set(x0, 3, z, INTERIOR_WALL); g.set(x0 + 3, 3, z, INTERIOR_WALL);
  g.set(x0 + 1, 3, z, GLASS); g.set(x0 + 2, 3, z, GLASS);
  for (let x = x0; x <= x0 + 3; x++) put(g, [x, 4, out], B.slab("quartz", "bottom"));
}

// ---- lampPost(g, x, z): blackstone wall pier y1..3, lantern y4 ------------------------------------------------------
export function lampPost(g, x, z) {
  g.fill([x, 1, z], [x, 3, z], "blackstone_wall");
  g.set(x, 4, z, ...B.lantern(false));
}

// ---- shrub(g, x, z, { flower }): 3 wide x 1 deep x 2 high azalea on a mulch strip (x-1..x+3, z-1..z+1) ------------
export function shrub(g, x, z, { flower = false } = {}) {
  for (let dx = -1; dx <= 3; dx++) for (let dz = -1; dz <= 1; dz++) mulchAt(g, x + dx, z + dz);
  for (let dx = 0; dx <= 2; dx++) for (let y = 1; y <= 2; y++) g.set(x + dx, y, z, ...leaves(LEAVES));
  if (flower) g.set(x + 1, 2, z, ...leaves(FLOWER_LEAVES));
}

// ---- youngTree(g): oak trunk at (36,1..4,5), crown y4..7, two stakes, mulch ring -----------------------------------
export function youngTree(g) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) mulchAt(g, 36 + dx, 5 + dz);
  for (let y = 1; y <= 4; y++) g.set(36, y, 5, ...B.log("oak", "y"));
  g.set(35, 1, 5, ...B.fence("oak"));
  g.set(37, 1, 5, ...B.fence("oak"));
  const layer = (y, r) => {
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (r === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;   // the trimmed corners
      if (dx === 0 && dz === 0 && y <= 4) continue;                        // the trunk
      g.set(36 + dx, y, 5 + dz, ...leaves("oak_leaves"));
    }
  };
  layer(4, 2); layer(5, 2); layer(6, 1);
  g.set(36, 7, 5, ...leaves("oak_leaves"));
}

// ---- deck(g): the back deck, posts, railing, steps, grill, AC unit, back shrub row (plan Part 6) --------------------
export function deck(g) {
  g.fill([19, 1, 26], [34, 1, 31], DECK_PLANK);
  for (let z = 26; z <= 31; z++) g.set(19, 2, z, ...B.fence("spruce"));
  for (let x = 19; x <= 34; x++) g.set(x, 2, 31, ...B.fence("spruce"));
  for (let z = 26; z <= 31; z++) if (z !== 28 && z !== 29) g.set(34, 2, z, ...B.fence("spruce"));   // gap: the side steps
  for (const [x, z] of [[19, 26], [34, 26], [19, 31], [34, 31], [26, 31], [19, 28], [34, 28]])
    for (let y = 0; y <= 2; y++) g.set(x, y, z, ...B.log("spruce", "y"));
  put(g, [26, 1, 26], B.stairs("spruce", "south", "bottom"));
  put(g, [27, 1, 26], B.stairs("spruce", "south", "bottom"));
  put(g, [35, 1, 28], B.stairs("spruce", "west", "bottom"));
  put(g, [35, 1, 29], B.stairs("spruce", "west", "bottom"));
  g.set(31, 2, 28, "cauldron");
  put(g, [31, 3, 28], B.trapdoor("iron", "north", "top", false));
  for (const x of [36, 37]) for (let y = 1; y <= 2; y++) g.set(x, y, 26, "iron_bars");
  for (let x = 3; x <= 13; x += 2) {
    g.set(x, 0, 25, MULCH);
    g.set(x, 1, 25, ...leaves(LEAVES));
  }
}

// ---- chimney(g): stone shaft x39..41 z25..26, y1..14: base, shoulders, andesite courses, cap and two pots -----------
export function chimney(g) {
  const { x0, x1, z0, z1 } = CHIMNEY;
  g.fill([x0, 1, z0], [x1, 2, z1], "stone_bricks");
  g.fill([x0, 3, z0], [x1, 13, z1], "stone_bricks");
  for (let x = x0; x <= x1; x++) put(g, [x, 3, z1], B.stairs("stone_brick", "north", "bottom"));
  g.fill([x0, 6, z0], [x1, 6, z1], "andesite");
  g.fill([x0, 10, z0], [x1, 10, z1], "andesite");
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(g, [x, 14, z], B.slab("stone_brick", "top"));
  g.set(39, 14, 25, "stone_brick_wall");
  g.set(41, 14, 25, "stone_brick_wall");
}

// ---- roofSpec(g): the five roofs in plan order (chimney last); the vent and its frame sit on the entry gable ------
export function roofSpec(g) {
  roof(g, [[22, 7, 31, 18]], "gable", { y: ROOF_BASE_Y, pitch: 1.0, maxHeight: 5, ridgeAxis: "z", overhang: 1,
    eave: "cornice", material: ROOF_MATERIAL, gable: SIDING, verge: "quartz" });
  for (let x = 26; x <= 27; x++) for (let y = 11; y <= 12; y++) g.set(x, y, 7, GLASS);
  for (const [x, y] of [[25, 11], [25, 12], [28, 11], [28, 12], [26, 10], [27, 10], [26, 13], [27, 13]]) g.set(x, y, 7, TRIM);
  roof(g, [[18, 11, 35, 25]], "hip", { y: ROOF_BASE_Y, pitch: 0.55, maxHeight: 4, overhang: 1, eave: "cornice",
    ridge: "slab", material: ROOF_MATERIAL, dormers: { face: ["south", "north"], count: 1, style: "gable" } });
  roof(g, [[35, 12, 42, 24]], "hip", { y: ROOF_BASE_Y, pitch: 0.5, maxHeight: 3, overhang: 1, eave: "cornice",
    ridge: "slab", material: ROOF_MATERIAL, dormers: { face: "north", count: 1, style: "gable" } });
  roof(g, [[1, 7, 17, 24]], "hip", { y: ROOF_BASE_Y, pitch: 0.5, maxHeight: 3, overhang: 1, eave: "cornice",
    ridge: "slab", material: ROOF_MATERIAL, dormers: { face: "north", count: 2, style: "gable" } });
  roof(g, [[38, 8, 42, 12]], "tower-cap", { y: ROOF_BASE_Y, material: ROOF_MATERIAL, finial: "lightning_rod" });
  chimney(g);
}
