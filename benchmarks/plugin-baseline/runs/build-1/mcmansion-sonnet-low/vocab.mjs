// vocab.mjs: the shared vocabulary for the McMansion. Palette names (palette.json ids only), site coordinates from
// plan.md, and one helper per plan.md VOCABULARY item. Every helper takes the grid first and integer cells, and
// places real blocks with correct states through the build library. Stair facing = the tall BACK side, so a stair
// rises toward its facing (client jar: oak_stairs facing=east has its full half on the east). plan.md's notes say
// "low side"; that is inverted against the game, so every facing here follows the geometry plan.md describes.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// ---- palette (ids from palette.json only) -----------------------------------------------------------------------
export const STONE_BRICKS = "stone_bricks";
export const CHISELED_STONE_BRICKS = "chiseled_stone_bricks";
export const STONE_BRICK_SLAB = "stone_brick_slab";
export const STONE_BRICK_WALL = "stone_brick_wall";
export const COBBLESTONE = "cobblestone";
export const BIRCH_PLANKS = "birch_planks";
export const SMOOTH_QUARTZ = "smooth_quartz";
export const WHITE_CONCRETE = "white_concrete";
export const QUARTZ_PILLAR = "quartz_pillar";
export const DEEPSLATE_TILES = "deepslate_tiles";
export const LIGHTNING_ROD = "lightning_rod";
export const IRON_TRAPDOOR = "iron_trapdoor";
export const GLASS_PANE = "glass_pane";
export const WHITE_STAINED_GLASS_PANE = "white_stained_glass_pane";
export const GLASS = "glass";
export const DARK_OAK_DOOR = "dark_oak_door";
export const SPRUCE_PLANKS = "spruce_planks";
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
export const SPRUCE_FENCE = "spruce_fence";
export const GRAY_CONCRETE = "gray_concrete";
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";
export const POLISHED_ANDESITE = "polished_andesite";
export const GRASS_BLOCK = "grass_block";
export const OAK_LEAVES = "oak_leaves";
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";
export const OAK_LOG = "oak_log";
export const OAK_FENCE = "oak_fence";
export const OAK_PLANKS = "oak_planks";
export const LANTERN = "lantern";
export const IRON_BARS = "iron_bars";

// ---- site (plan.md SITE, ROOFS, RESERVED, OPENINGS; x 0..43, y 0..14, z 0..31; front = north, z0) -----------------
export const SIZE = [44, 15, 32];
export const GARAGE = { x0: 0, x1: 18, y0: 0, y1: 10, z0: 5, z1: 22 };
export const MAIN = { x0: 18, x1: 43, y0: 1, y1: 10, z0: 7, z1: 28 };
export const ENTRY = { x0: 26, x1: 35, y0: 1, y1: 13, z0: 4, z1: 9 };     // portico z4..6, front wall z7
export const BAY = { x0: 37, x1: 41, y0: 1, y1: 9, z0: 4, z1: 7 };        // opens into M at z7 x38..40
export const DECK = { x0: 30, x1: 42, y: 1, z0: 29, z1: 31 };
export const PATH = { x0: 30, x1: 31, z0: 0, z1: 2 };                     // steps x28..33 z3 y1
export const DRIVEWAY = { x0: 1, x1: 16, z0: 0, z1: 4 };                  // flares to x0..17 at z0..1
export const TREE = { x: 8, z: 2 };
export const DOUBLE_DOOR = { x: 30, z: 7 };                               // x30..31, y2..5
export const CHIMNEY = { x0: 40, x1: 42, z0: 24, z1: 26, y0: 2, y1: 14 };
export const CARRIAGE_X = [2, 7, 12];                                     // doors x..x+3 on z5, y1..4
export const LAMP_POSTS = [1, 6, 11, 16];                                 // carriage lamps at z4
export const DORMERS = [                                                  // front plane z, step dz, cells deep
  { x: 21, z: 7, dz: 1, depth: 4 },
  { x: 39, z: 7, dz: 1, depth: 4 },
  { x: 29, z: 28, dz: -1, depth: 3 },
];
export const MAIN_STAIR = { x: [27, 28], z0: 8, y0: 2, steps: 5, landing: { x: [27, 28], y: 6, z: 13 } };
export const PORTICO_COLUMNS = [26, 29, 32, 35];                          // at z4, y1..9
export const QUOINS = [[0, 5], [0, 22], [18, 5], [18, 22], [43, 7], [43, 28], [18, 7], [18, 28]];

const inBox = (b, x, z) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
const onRing = (b, x, z) => inBox(b, x, z) && (x === b.x0 || x === b.x1 || z === b.z0 || z === b.z1);
/** Stair facing for a ring cell: the tall back points inward (toward the box centre), so the roof rises inward. */
const inward = (b, x, z) => (x === b.x0 ? "east" : x === b.x1 ? "west" : z === b.z0 ? "south" : "north");
/** The box shrunk by `inset` cells on every side. */
const shrink = (b, inset) => ({ x0: b.x0 + inset, x1: b.x1 - inset, z0: b.z0 + inset, z1: b.z1 - inset });

// ---- walls --------------------------------------------------------------------------------------------------------
/** Beige siding fill over the inclusive box [x0,y0,z0,x1,y1,z1]. */
export function wallSiding(g, [x0, y0, z0, x1, y1, z1]) {
  g.fill([x0, y0, z0], [x1, y1, z1], BIRCH_PLANKS);
}

/** Stone veneer fill over the box; every 7th block (scan order) is chiseled. */
export function wallStone(g, [x0, y0, z0, x1, y1, z1]) {
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    n++;
    g.set(x, y, z, n % 7 === 0 ? CHISELED_STONE_BRICKS : STONE_BRICKS);
  }
}

/** The stone cap row: stone_brick_slab, top half, along x0..x1 at z and y (plan: y4 on the front faces). */
export function stoneCap(g, x0, x1, z, y = 4) {
  for (let x = x0; x <= x1; x++) g.set(x, y, z, ...B.slab("stone_brick", "top"));
}

/** Outer corner column: smooth_quartz on even y, siding on odd y, for y0..y1 (plan: quoins y1..10). */
export function quoin(g, x, z, y0 = 1, y1 = 10) {
  for (let y = y0; y <= y1; y++) g.set(x, y, z, y % 2 === 0 ? SMOOTH_QUARTZ : BIRCH_PLANKS);
}

// ---- openings -----------------------------------------------------------------------------------------------------
/**
 * Tall arched window, 3 wide x 3 tall, centred on c. side: "north"|"south" (wall plane z = plane, spans x) or
 * "east"|"west" (wall plane x = plane, spans z). glass_pane on all 9 cells except the two top corners, which are
 * smooth_quartz_stairs (top half) facing away from the window centre.
 */
export function archWindow(g, side, c, y0, plane) {
  const alongX = side === "north" || side === "south";
  const cell = (a, y) => (alongX ? [c + a, y, plane] : [plane, y, c + a]);
  // the solid back of each top corner stair faces away from the centre, which leaves the arch open toward the centre
  const away = alongX ? { "-1": "west", "1": "east" } : { "-1": "north", "1": "south" };
  for (const a of [-1, 0, 1]) for (const dy of [0, 1, 2]) {
    const [x, y, z] = cell(a, y0 + dy);
    if (dy === 2 && a !== 0) g.set(x, y, z, ...B.stairs("smooth_quartz", away[String(a)], "top"));
    else g.set(x, y, z, GLASS_PANE);
  }
}

/** Black shutters: open iron trapdoors, one per row, 3 tall, at c-2 and c+2 in the outer air cell, facing outward. */
export function shutters(g, side, c, y0, plane) {
  const alongX = side === "north" || side === "south";
  const d = { north: -1, south: 1, west: -1, east: 1 }[side];
  for (const a of [-2, 2]) for (let y = y0; y <= y0 + 2; y++) {
    const [x, z] = alongX ? [c + a, plane + d] : [plane + d, c + a];
    g.set(x, y, z, ...B.trapdoor("iron", side, "bottom", true));
  }
}

/**
 * Carriage door: planks y1..3 and glass y4 across x..x+3 on the wall z (default 5), with closed spruce trapdoor
 * panels layered on the outer face z-1 (= z4): edges at y1..2, centre at y3.
 */
export function carriageDoor(g, x, z = 5) {
  g.fill([x, 1, z], [x + 3, 3, z], SPRUCE_PLANKS);
  g.fill([x, 4, z], [x + 3, 4, z], GLASS_PANE);
  const panel = () => B.trapdoor("spruce", "north", "bottom", false);
  for (let y = 1; y <= 2; y++) { g.set(x, y, z - 1, ...panel()); g.set(x + 3, y, z - 1, ...panel()); }
  for (let xx = x + 1; xx <= x + 2; xx++) g.set(xx, 3, z - 1, ...panel());
}

/** Lantern post between carriage doors: spruce fence y1..3 and a standing lantern at y4 (z default 4). */
export function carriageLamp(g, x, z = 4) {
  g.fill([x, 1, z], [x, 3, z], SPRUCE_FENCE);
  g.set(x, 4, z, ...B.lantern(false));
}

/** Double front door x30..31 at z7, y2..3 (dark oak, hinged left and right, facing north). */
export function doorDouble(g, x = 30, z = 7) {
  for (const [y, half] of [[2, "lower"], [3, "upper"]]) {
    g.set(x, y, z, ...B.door("dark_oak", "north", half, "left"));
    g.set(x + 1, y, z, ...B.door("dark_oak", "north", half, "right"));
  }
}

/** Fanlight over the double door: white pane at y4, glass pane at y5, arched corners at y5 (x-1 and x+2). */
export function fanlight(g, x = 30, z = 7) {
  g.set(x, 4, z, WHITE_STAINED_GLASS_PANE);
  g.set(x + 1, 4, z, WHITE_STAINED_GLASS_PANE);
  g.set(x, 5, z, GLASS_PANE);
  g.set(x + 1, 5, z, GLASS_PANE);
  g.set(x - 1, 5, z, ...B.stairs("smooth_quartz", "west", "top"));
  g.set(x + 2, 5, z, ...B.stairs("smooth_quartz", "east", "top"));
}

// ---- entry portico ------------------------------------------------------------------------------------------------
/** Portico column at (x, z=4): smooth_quartz base y1, quartz_pillar shaft y2..8, smooth_quartz capital y9. */
export function column(g, x, z = 4) {
  g.set(x, 1, z, SMOOTH_QUARTZ);
  for (let y = 2; y <= 8; y++) g.set(x, y, z, ...B.pillar(QUARTZ_PILLAR, "y"));
  g.set(x, 9, z, SMOOTH_QUARTZ);
}

/** Quartz beam at y9 across the portico front, x26..35 at z4. */
export function beam(g) {
  g.fill([26, 9, 4], [35, 9, 4], SMOOTH_QUARTZ);
}

/** Pediment infill (white_concrete) on the z4 plane: y10 x27..34, y11 x28..33, y12 x29..32, y13 x30..31. */
export function pediment(g) {
  const rows = [[10, 27, 34], [11, 28, 33], [12, 29, 32], [13, 30, 31]];
  for (const [y, xa, xb] of rows) g.fill([xa, y, 4], [xb, y, 4], WHITE_CONCRETE);
}

/** Round pediment window: glass_pane at (30..31, y11, z4). Call after pediment(). */
export function pedimentWindow(g) {
  g.set(30, 11, 4, GLASS_PANE);
  g.set(31, 11, 4, GLASS_PANE);
}

// ---- roofs (deepslate tiles) --------------------------------------------------------------------------------------
/**
 * Entry gable over x26..35, rows z4..9: eave stairs at y10 (x26/x35), then one step in per row up to y13, the ridge at
 * y14 (x30..31, full tiles) and y13 full tiles under it. Each stair's back faces the ridge. Call pediment() after this.
 */
export function roofGable(g) {
  for (let z = 4; z <= 9; z++) {
    const steps = [[26, 10, "east"], [27, 11, "east"], [28, 12, "east"], [29, 13, "east"],
      [35, 10, "west"], [34, 11, "west"], [33, 12, "west"], [32, 13, "west"]];
    for (const [x, y, facing] of steps) g.set(x, y, z, ...B.stairs("deepslate_tile", facing, "bottom"));
    g.fill([30, 13, z], [31, 13, z], DEEPSLATE_TILES);
    g.fill([30, 14, z], [31, 14, z], DEEPSLATE_TILES);
  }
}

/**
 * Hip roof over the footprint x0..x1, z0..z1: stair ring at y11 (inset 0) and y12 (inset 1), each facing its low
 * inner side, then a full deck at y13 inset 2. minX skips cells left of it (M's ring starts at x19; G owns x18).
 */
export function roofHip(g, x0, z0, x1, z1, minX = x0) {
  const b = { x0, x1, z0, z1 };
  for (const [y, inset] of [[11, 0], [12, 1]]) {
    const r = shrink(b, inset);
    for (let x = r.x0; x <= r.x1; x++) for (let z = r.z0; z <= r.z1; z++) {
      if (x < minX || !onRing(r, x, z)) continue;
      g.set(x, y, z, ...B.stairs("deepslate_tile", inward(r, x, z), "bottom"));
    }
  }
  const d = shrink(b, 2);
  for (let x = d.x0; x <= d.x1; x++) for (let z = d.z0; z <= d.z1; z++) {
    if (x < minX) continue;
    g.set(x, 13, z, DEEPSLATE_TILES);
  }
}

/**
 * Bay cone: stair ring y10 on x37..41 z4..7, stair ring y11 on x38..40 z5..6, full tiles y12 on x39..40 z5..6,
 * y13 at (39,5), and the lightning-rod finial at (39,14,5).
 */
export function roofCone(g) {
  const ring10 = shrink(BAY, 0);
  for (let x = ring10.x0; x <= ring10.x1; x++) for (let z = ring10.z0; z <= ring10.z1; z++) {
    if (onRing(ring10, x, z)) g.set(x, 10, z, ...B.stairs("deepslate_tile", inward(ring10, x, z), "bottom"));
  }
  const ring11 = { x0: 38, x1: 40, z0: 5, z1: 6 };
  for (let x = ring11.x0; x <= ring11.x1; x++) for (let z = ring11.z0; z <= ring11.z1; z++) {
    if (onRing(ring11, x, z)) g.set(x, 11, z, ...B.stairs("deepslate_tile", inward(ring11, x, z), "bottom"));
  }
  g.fill([39, 12, 5], [40, 12, 6], DEEPSLATE_TILES);
  g.set(39, 13, 5, DEEPSLATE_TILES);
  g.set(39, 14, 5, LIGHTNING_ROD, { facing: "up", powered: "false" });
}

/**
 * Gabled dormer: front wall on plane z, x..x+2, walls y11..12 in birch with a 1-wide glass window at x+1; side walls
 * run `depth` cells deep in direction dz; gable of deepslate-tile stairs at y13 (backs toward the ridge) with a tile
 * ridge at x+1. dz = 1 for the street side, -1 for the rear.
 */
export function dormer(g, x, z, dz = 1, depth = 4) {
  for (let k = 0; k < depth; k++) {
    const zz = z + dz * k;
    for (const y of [11, 12]) {
      if (k === 0) {
        g.set(x, y, zz, BIRCH_PLANKS);
        g.set(x + 1, y, zz, GLASS_PANE);
        g.set(x + 2, y, zz, BIRCH_PLANKS);
      } else {
        g.set(x, y, zz, BIRCH_PLANKS);
        g.set(x + 2, y, zz, BIRCH_PLANKS);
      }
    }
    g.set(x, 13, zz, ...B.stairs("deepslate_tile", "east", "bottom"));
    g.set(x + 1, 13, zz, DEEPSLATE_TILES);
    g.set(x + 2, 13, zz, ...B.stairs("deepslate_tile", "west", "bottom"));
  }
}

// ---- bay and chimney ----------------------------------------------------------------------------------------------
/**
 * Turret bay x37..41 z4..7, walls y1..9: smooth_quartz corners, stone y1..3, siding above, glass in the three
 * cardinal faces at y3..5 and y7..9. The z7 opening into the main block (x38..40, y2..5 and y7..9) is left as air.
 * Floors: spruce y1 and oak y6 across the inner x38..40 z5..6.
 */
export function bay(g) {
  for (let x = BAY.x0; x <= BAY.x1; x++) for (let z = BAY.z0; z <= BAY.z1; z++) {
    const edge = x === BAY.x0 || x === BAY.x1 || z === BAY.z0 || z === BAY.z1;
    if (!edge) continue;
    const corner = (x === BAY.x0 || x === BAY.x1) && (z === BAY.z0 || z === BAY.z1);
    for (let y = BAY.y0; y <= BAY.y1; y++) {
      if (z === BAY.z1 && x >= 38 && x <= 40 && y !== 1 && y !== 6) continue;
      let block = corner ? SMOOTH_QUARTZ : y <= 3 ? STONE_BRICKS : BIRCH_PLANKS;
      const glassY = (y >= 3 && y <= 5) || (y >= 7 && y <= 9);
      const glassFace = (z === 4 && x >= 38 && x <= 40) || ((x === 37 || x === 41) && z >= 5 && z <= 6);
      if (!corner && glassY && glassFace) block = GLASS;
      g.set(x, y, z, block);
    }
  }
  g.fill([38, 1, 5], [40, 1, 6], SPRUCE_PLANKS);
  g.fill([38, 6, 5], [40, 6, 6], OAK_PLANKS);
}

/** Stone chimney shaft x40..42 z24..26 from y2 to y13, cap row y14 (walls at x40/x42 z25, slabs elsewhere). */
export function chimney(g) {
  g.fill([CHIMNEY.x0, CHIMNEY.y0, CHIMNEY.z0], [CHIMNEY.x1, 13, CHIMNEY.z1], STONE_BRICKS);
  for (let x = CHIMNEY.x0; x <= CHIMNEY.x1; x++) for (let z = CHIMNEY.z0; z <= CHIMNEY.z1; z++) {
    if (z === 25 && (x === CHIMNEY.x0 || x === CHIMNEY.x1)) g.set(x, 14, z, ...B.wall("stone_brick"));
    else g.set(x, 14, z, ...B.slab("stone_brick", "bottom"));
  }
}

// ---- site ---------------------------------------------------------------------------------------------------------
/** Foundation shrub at (x, z): oak leaves at y1, flowering azalea leaves at y2. */
export function shrub(g, x, z) {
  g.set(x, 1, z, OAK_LEAVES);
  g.set(x, 2, z, FLOWERING_AZALEA_LEAVES);
}

/** Young oak at (x, z): log spine y1..4, leaves 5x5 minus corners at y4..5, 3x3 at y6, one at y7, stake at x+1. */
export function youngTree(g, x = TREE.x, z = TREE.z) {
  for (let y = 1; y <= 4; y++) g.set(x, y, z, ...B.log("oak", "y"));
  for (const y of [4, 5]) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
    if (y === 4 && dx === 0 && dz === 0) continue;
    g.set(x + dx, y, z + dz, OAK_LEAVES);
  }
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) g.set(x + dx, 6, z + dz, OAK_LEAVES);
  g.set(x, 7, z, OAK_LEAVES);
  g.fill([x + 1, 1, z], [x + 1, 2, z], OAK_FENCE);
}

/** Back deck x30..42 z29..31 at y1 with spruce rails at y2 and the step at (29,1,30) rising east to the deck. */
export function deck(g) {
  g.fill([DECK.x0, DECK.y, DECK.z0], [DECK.x1, DECK.y, DECK.z1], SPRUCE_PLANKS);
  for (let x = DECK.x0; x <= DECK.x1; x++) g.set(x, 2, DECK.z1, SPRUCE_FENCE);
  for (let z = DECK.z0; z <= DECK.z1 - 1; z++) {
    g.set(DECK.x0, 2, z, SPRUCE_FENCE);
    g.set(DECK.x1, 2, z, SPRUCE_FENCE);
  }
  g.set(DECK.x0 - 1, 1, 30, ...B.stairs("spruce", "east", "bottom"));
}

/** Lamp post at (x, z): spruce fence y1..3 and a standing lantern at y4. */
export function lamp(g, x, z) {
  carriageLamp(g, x, z);
}

/** Driveway: gray concrete x1..16 z0..4 flared to x0..17 at z0..1, with a polished-andesite slab joint at z2. */
export function driveway(g) {
  g.fill([DRIVEWAY.x0, 0, DRIVEWAY.z0], [DRIVEWAY.x1, 0, DRIVEWAY.z1], GRAY_CONCRETE);
  g.fill([0, 0, 0], [17, 0, 1], GRAY_CONCRETE);
  for (let x = DRIVEWAY.x0; x <= DRIVEWAY.x1; x++) g.set(x, 0, 2, ...B.slab("polished_andesite", "bottom"));
}

/** Main staircase: spruce steps at (27..28, 2+k, 8+k), k 0..4, rising south (facing south), plus the y6 landing. */
export function mainStair(g) {
  for (let k = 0; k < MAIN_STAIR.steps; k++) {
    for (const x of MAIN_STAIR.x) g.set(x, MAIN_STAIR.y0 + k, MAIN_STAIR.z0 + k, ...B.stairs("spruce", "south", "bottom"));
  }
  const L = MAIN_STAIR.landing;
  for (const x of L.x) g.set(x, L.y, L.z, OAK_PLANKS);
}
