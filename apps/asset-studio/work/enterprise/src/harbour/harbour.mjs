// The harbour district (Lordaeron first): what a town on the sea, or a town on a river, builds at its water. Two kinds
// of part:
//   buildings on the relief module set (ground 2, front south, as the forum's halls): the customs house, warehouses,
//     the fish market, the river customs booth
//   waterside parts on the dock contract: layer `water_line` is the water's surface, the deck stands at `deck`; the
//     placer runs each declared piling down from the water line to the bed. Authored with the water to the south (a
//     quay tile's z 0 is the land side) or, for piers and moles, running out along +z from the shore at z 0.
// Boats are decoration moored in the water: their `water_line` layer goes at the water's surface; everything under it
// is solid hull, so nothing floods.
import { Grid } from "../grid.mjs";
import { layoutOf, compose } from "../lordaeron/compose.mjs";
import { cupola } from "../lordaeron/forum-front.mjs";
import { hash } from "../lordaeron/earthworks.mjs";

const stairs = (b, f, half = "bottom") => `${b}_stairs[facing=${f},half=${half},shape=straight,waterlogged=false]`;
const slab = (b, t = "bottom", wet = false) => `${b}_slab[type=${t},waterlogged=${wet}]`;
const fence = (w, n = false, s = false, e = false, wst = false) => `${w}_fence[east=${e},north=${n},south=${s},waterlogged=false,west=${wst}]`;
const wallPost = (b) => `${b}_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]`;
const LANTERN = "lantern[hanging=false,waterlogged=false]", HANGING = "lantern[hanging=true,waterlogged=false]";
const BARREL = "enterprise:decor_barrel[facing=up,open=false]";

// ---- the quay: a waterside edge in stone (sea) or timber (river) ---------------------------------------------------
// width 1, depth 3: z 0 the quay's paving (deck), z 1 the edge (its face drops to the water), z 2 the face's fixtures
// in the water (ladders, fenders); unset cells there are left as they are. water_line 0, deck 2.
export const QUAY = {
  stone: { deck: (r) => (r < 0.7 ? "stone_bricks" : r < 0.88 ? "cobblestone" : "cracked_stone_bricks"), edge: "polished_andesite", face: (r) => (r < 0.6 ? "stone_bricks" : r < 0.85 ? "mossy_stone_bricks" : "cobblestone"),
    bollard: wallPost("andesite"), pile: "minecraft:stone_bricks", fender: "dark_oak_log[axis=y]", ladder: true },
  timber: { deck: (r) => (r < 0.8 ? "spruce_planks" : "stripped_spruce_wood[axis=y]"), edge: "stripped_spruce_log[axis=x]", face: () => "spruce_log[axis=y]",
    bollard: "spruce_log[axis=y]", pile: "minecraft:spruce_log", fender: null, ladder: true },
};

function quay(S, { seed, bollard = false, ladder = false, lamp = false, steps = false, crane = false }) {
  const g = new Grid([1, crane ? 9 : 6, 3]);
  // z 0: the paving on a course down to the water; z 1: the edge, its face coursed to the water line
  g.set(0, 0, 0, S.face(hash(seed, 0, 1))); g.set(0, 1, 0, S.face(hash(seed, 1, 1))); g.set(0, 2, 0, S.deck(hash(seed, 2)));
  g.set(0, 0, 1, S.face(hash(seed, 0, 2))); g.set(0, 1, 1, S.face(hash(seed, 1, 2))); g.set(0, 2, 1, S.edge);
  if (steps) { g.set(0, 2, 1, stairs("stone_brick", "north")); g.set(0, 1, 2, slab("stone_brick", "bottom", false)); g.set(0, 0, 2, "stone_bricks"); }
  if (bollard) g.set(0, 3, 1, S.bollard);
  if (lamp) { g.set(0, 3, 1, S.bollard); g.set(0, 4, 1, fence("spruce")); g.set(0, 5, 1, LANTERN); }
  if (ladder && S.ladder && !steps) { g.set(0, 0, 2, "ladder[facing=south,waterlogged=true]"); g.set(0, 1, 2, "ladder[facing=south,waterlogged=false]"); }
  if (S.fender && !ladder && !steps && hash(seed, 9) < 0.5) g.set(0, 1, 2, S.fender);
  if (crane) {
    // a timber crane at the edge: a post, a jib out over the water, the hoist chain and a crate on it
    for (let y = 3; y <= 7; y++) g.set(0, y, 0, "dark_oak_log[axis=y]");
    g.set(0, 8, 0, slab("dark_oak")); g.set(0, 7, 1, "dark_oak_log[axis=z]"); g.set(0, 7, 2, fence("dark_oak", true));
    g.set(0, 6, 2, "chain[axis=y,waterlogged=false]"); g.set(0, 5, 2, "chain[axis=y,waterlogged=false]"); g.set(0, 4, 2, BARREL);
    g.set(0, 6, 1, stairs("dark_oak", "north", "top")); g.set(0, 3, 1, LANTERN);
  }
  return { grid: g, pilings: [{ at: [0, 1], block: S.pile }, { at: [0, 0], block: S.pile }] };
}

// ---- piers and the mole ---------------------------------------------------------------------------------------------
/** A timber jetty segment for rivers and small harbours: 3 wide, 4 long, a plank deck on log piles, a rail one side. */
function jettySegment() {
  const g = new Grid([3, 5, 4]);
  for (let x = 0; x < 3; x++) for (let z = 0; z < 4; z++) g.set(x, 1, z, z === 0 || z === 3 ? "stripped_spruce_log[axis=x]" : "spruce_planks");
  for (const [x, z] of [[0, 0], [2, 0], [0, 3], [2, 3]]) g.set(x, 0, z, "spruce_log[axis=y]");
  for (let z = 0; z < 4; z++) g.set(2, 2, z, fence("spruce", z > 0, z < 3));
  g.set(0, 2, 1, "spruce_log[axis=y]"); g.set(0, 3, 1, LANTERN);                      // a mooring post with its lamp
  return { grid: g, pilings: [[0, 0], [2, 0], [0, 3], [2, 3]].map(([x, z]) => ({ at: [x, z], block: "minecraft:spruce_log" })) };
}

/** A jetty's head: 5 x 5, a bench and mooring posts, lamps, a ladder down to the water at its end. */
function jettyHead() {
  const g = new Grid([5, 5, 5]);
  for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) g.set(x, 1, z, x === 0 || x === 4 || z === 4 ? "stripped_spruce_log[axis=" + (z === 4 ? "x" : "z") + "]" : "spruce_planks");
  for (const [x, z] of [[0, 0], [4, 0], [0, 4], [4, 4], [2, 4]]) g.set(x, 0, z, "spruce_log[axis=y]");
  for (const [x, z] of [[0, 4], [4, 4]]) { g.set(x, 2, z, "spruce_log[axis=y]"); g.set(x, 3, z, LANTERN); }
  g.set(1, 2, 1, stairs("spruce", "east")); g.set(1, 2, 2, stairs("spruce", "east"));      // a bench facing the water
  g.set(3, 2, 1, BARREL); g.set(0, 2, 2, "spruce_log[axis=y]");
  return { grid: g, pilings: [[0, 0], [4, 0], [0, 4], [4, 4], [2, 4]].map(([x, z]) => ({ at: [x, z], block: "minecraft:spruce_log" })) };
}

/** The mole (a breakwater) for a sea harbour: 7 wide, 4 long, rubble sloping into the water both sides, a paved walk
 *  on top behind a parapet on the sea side (east). water_line 0, the walk at 3. */
function moleSegment(seed) {
  const g = new Grid([7, 6, 4]), rub = (r) => (r < 0.4 ? "cobblestone" : r < 0.65 ? "mossy_cobblestone" : r < 0.85 ? "stone" : "andesite");
  for (let z = 0; z < 4; z++) {
    // the sea side (x 6) and harbour side (x 0) slope down to the water: stairs over rubble
    g.set(0, 0, z, rub(hash(seed, 0, z))); g.set(0, 1, z, stairs("cobblestone", "east"));
    g.set(6, 0, z, rub(hash(seed, 6, z))); g.set(6, 1, z, rub(hash(seed, 6, z, 1))); g.set(6, 2, z, stairs("mossy_cobblestone", "west"));
    for (let x = 1; x <= 5; x++) for (let y = 0; y <= 2; y++) g.set(x, y, z, rub(hash(seed, x, y, z)));
    for (let x = 1; x <= 4; x++) g.set(x, 3, z, x === 1 ? "polished_andesite" : (x + z) % 3 ? "stone_bricks" : "cracked_stone_bricks");
    g.set(5, 3, z, "stone_bricks"); g.set(5, 4, z, `stone_brick_wall[east=none,north=${z > 0 ? "low" : "none"},south=${z < 3 ? "low" : "none"},up=${z === 1},waterlogged=false,west=none]`);
    g.set(1, 2, z, rub(hash(seed, 1, 2, z, 3)));
  }
  g.set(5, 5, 1, LANTERN);
  return { grid: g, pilings: [...Array(7).keys()].flatMap((x) => [0, 3].map((z) => ({ at: [x, z], block: "minecraft:cobblestone" }))) };
}

/** The mole's head with the lighthouse: 9 x 9, a round stone tower 5 across, its lantern room in glass under a slate
 *  cap, a gallery round it. The tower is hollow, with a ladder and lamps every few rungs. water_line 0, the platform 3. */
function lighthouse() {
  const W = 9, g = new Grid([W, 26, W]), c = 4, rub = (r) => (r < 0.5 ? "cobblestone" : r < 0.8 ? "mossy_cobblestone" : "stone");
  const inTower = (x, z) => { const dx = Math.abs(x - c), dz = Math.abs(z - c); return dx <= 2 && dz <= 2 && dx + dz <= 3; };
  const ring = (x, z) => inTower(x, z) && !(Math.abs(x - c) <= 1 && Math.abs(z - c) <= 1 && Math.abs(x - c) + Math.abs(z - c) <= 1);
  for (let x = 0; x < W; x++) for (let z = 0; z < W; z++) {
    const edge = x === 0 || z === 0 || x === W - 1 || z === W - 1;
    for (let y = 0; y <= 2; y++) g.set(x, y, z, edge && y === 2 ? stairs("cobblestone", x === 0 ? "east" : x === W - 1 ? "west" : z === 0 ? "south" : "north") : rub(hash(x, y, z)));
    if (!edge) g.set(x, 3, z, (x + z) % 2 ? "stone_bricks" : "polished_andesite");
  }
  // the platform's parapet with lamps at its corners
  for (let x = 1; x < W - 1; x++) for (let z = 1; z < W - 1; z++) if (x === 1 || z === 1 || x === W - 2 || z === W - 2) if (!(z === 1 && x === c)) g.set(x, 4, z, `stone_brick_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]`);
  for (const [x, z] of [[1, 1], [W - 2, 1], [1, W - 2], [W - 2, W - 2]]) g.set(x, 5, z, LANTERN);
  // the tower: white-banded stone, 14 high, hollow, a door to the land (north), a ladder up the inside
  const T0 = 4, T1 = 17;
  for (let y = T0; y <= T1; y++) for (let x = 0; x < W; x++) for (let z = 0; z < W; z++) {
    if (!inTower(x, z)) continue;
    if (ring(x, z)) g.set(x, y, z, (y - T0) % 5 === 4 ? "calcite" : (y + x + z) % 7 === 0 ? "mossy_stone_bricks" : "stone_bricks");
    else g.set(x, y, z, "air");
  }
  g.set(c, T0, c - 2, "spruce_door[facing=north,half=lower,hinge=left,open=false,powered=false]"); g.set(c, T0 + 1, c - 2, "spruce_door[facing=north,half=upper,hinge=left,open=false,powered=false]");
  for (let y = T0; y <= T1 + 1; y++) g.set(c, y, c + 1, "ladder[facing=north,waterlogged=false]");
  for (const y of [T0 + 2, T0 + 7, T0 + 12]) g.set(c - 2, y, c, "sea_lantern");                 // lamps set in the shaft's wall
  // windows up the shaft
  for (const y of [T0 + 5, T0 + 10]) { g.set(c, y, c + 2, "glass_pane[east=true,north=false,south=false,waterlogged=false,west=true]"); g.set(c + 2, y, c, "glass_pane[east=false,north=true,south=true,waterlogged=false,west=false]"); }
  // the gallery: a floor out to 2 round the tower's top, a rail, then the lantern room: glass round a lit core
  const G = T1 + 1;
  for (let x = c - 3; x <= c + 3; x++) for (let z = c - 3; z <= c + 3; z++) {
    const dx = Math.abs(x - c), dz = Math.abs(z - c); if (dx + dz > 4) continue;
    g.set(x, G, z, dx + dz === 4 || Math.max(dx, dz) === 3 ? "stone_brick_slab[type=top,waterlogged=false]" : "stone_bricks");
    if (dx + dz === 4 || Math.max(dx, dz) === 3) g.set(x, G + 1, z, "iron_bars[east=false,north=false,south=false,waterlogged=false,west=false]");
  }
  for (let y = G + 1; y <= G + 3; y++) for (let x = c - 1; x <= c + 1; x++) for (let z = c - 1; z <= c + 1; z++) g.set(x, y, z, x === c && z === c ? (y === G + 2 ? "glowstone" : "dark_oak_log[axis=y]") : "glass");
  g.set(c, G + 1, c, "air"); g.set(c, G + 1, c + 1, "ladder[facing=north,waterlogged=false]"); g.set(c, G + 2, c + 1, "glass");
  for (let x = c - 2; x <= c + 2; x++) for (let z = c - 2; z <= c + 2; z++) {
    const dx = Math.abs(x - c), dz = Math.abs(z - c); if (dx + dz > 3) continue;
    g.set(x, G + 4, z, dx === 2 || dz === 2 ? stairs("deepslate_tile", dx === 2 ? (x < c ? "east" : "west") : (z < c ? "south" : "north")) : "deepslate_tiles");
  }
  g.set(c, G + 5, c, "deepslate_tile_slab[type=bottom,waterlogged=false]"); g.set(c, G + 6, c, "end_rod[facing=up]");
  return { grid: g, pilings: [[0, 0], [W - 1, 0], [0, W - 1], [W - 1, W - 1], [c, c]].map(([x, z]) => ({ at: [x, z], block: "minecraft:cobblestone" })) };
}

// ---- buildings on the module set ------------------------------------------------------------------------------------
/** The customs house: 13 x 10, 2 storeys, stone; an open arcade on the quay where goods are inspected and weighed, the
 *  collector's office above (desks, ledgers, the strongroom's chests), a lantern cupola with the harbour flag. */
export function customsHouse() {
  const L = layoutOf({ W: 13, D: 10, storeys: 2, roof: "gable_x", arcade: true, fitout: ({ put, top }) => {
    for (const x of [2, 3, 6, 7]) put(0, "cask", [x, 2]);
    put(0, "hay", [2, 3]); put(0, "goods_kelp", [3, 3]); put(0, "goods_wool", [6, 3]); put(0, "goods_pot", [7, 3]);
    put(0, "desk", [4, 6]); put(0, "goods_chain", [5, 6]);                               // the weighing beam
    for (const [x, z] of [[3, 4], [7, 4], [3, 7], [7, 7], [9, 7]]) put(0, "lantern", [x, z], top);
    put(1, "desk", [2, 3]); put(1, "desk", [2, 6]); for (const x of [1, 2, 3]) put(1, "shelf", [x, 1]);
    for (const x of [6, 7, 8]) put(1, "chest", [x, 8]); put(1, "table", [5, 4]); put(1, "bench", [5, 3]); put(1, "candles", [5, 4], 2);
    for (const [x, z] of [[3, 3], [6, 3], [3, 7], [6, 6], [9, 7]]) put(1, "lantern", [x, z], top);
  } });
  let g = compose(L);
  g = cupola(g);
  // the harbour flag on the cupola's finial
  const cx = Math.floor(g.size[0] / 2), cz = Math.floor(g.size[2] / 2); let y = g.size[1] - 1; while (y > 0 && !g.get(cx, y, cz)) y--;
  const G = new Grid([g.size[0], y + 4, g.size[2]]); G.paste(g, 0, 0, 0);
  G.set(cx, y + 1, cz, fence("dark_oak")); G.set(cx, y + 2, cz, fence("dark_oak")); G.set(cx, y + 2, cz + 1, "blue_wool"); G.set(cx, y + 3, cz, fence("dark_oak"));
  return { layout: L, grid: G };
}

/** A warehouse on the quay: 13 x 7, 2 storeys, open loading bays to the quay, stock stacked inside, a hoist beam out
 *  from the loft's gable (river: 10 x 7, 1 storey). */
export function warehouse({ W = 13, storeys = 2 } = {}) {
  const L = layoutOf({ W, D: 7, storeys, roof: "gable_x", arcade: "front", noCore: storeys === 1, fitout: ({ put, top }) => {
    const n = W - 2;
    for (let x = 1; x <= n; x++) { put(0, x % 3 === 0 ? "hay" : "cask", [x, 1]); if (x % 2) put(0, x % 4 === 1 ? "goods_wool" : "cask", [x, 2]); }
    for (let x = 2; x < n; x += 3) put(0, "lantern", [x, 4], top);
    if (storeys > 1) { for (let x = 1; x <= 6; x++) put(1, x % 2 ? "goods_wool" : "hay", [x, 1]); for (const [x, z] of [[2, 3], [5, 3], [3, 5], [8, 2], [9, 6], [7, 5]]) put(1, "lantern", [x, z], top); }
  } });
  const g0 = compose(L), g = new Grid([g0.size[0] + 2, g0.size[1], g0.size[2]]);
  g.paste(g0, 0, 0, 0);
  // the hoist: a beam out from the east gable at the loft, a chain and a bale
  let y = g0.size[1] - 1; const ez = Math.floor(g0.size[2] / 2);
  while (y > 0 && !g0.get(g0.size[0] - 1, y, ez)) y--;
  const hy = Math.max(6, y - 2);
  g.set(g0.size[0], hy, ez, "dark_oak_log[axis=x]"); g.set(g0.size[0] + 1, hy, ez, fence("dark_oak", false, false, false, true));
  g.set(g0.size[0] + 1, hy - 1, ez, "chain[axis=y,waterlogged=false]"); g.set(g0.size[0] + 1, hy - 2, ez, "hay_block[axis=y]");
  return { layout: L, grid: g };
}

/** The fish market: 10 x 7, 1 storey, open arcades to the quay, windowed sides, tables of fish on ice, barrels, kelp. */
export function fishMarket() {
  const L = layoutOf({ W: 10, D: 7, storeys: 1, roof: "gable_x", arcade: "front", noCore: true, fitout: ({ put, top }) => {
    for (const x of [2, 3, 5, 6]) put(0, "table", [x, 3]);
    for (const x of [1, 8]) { put(0, "cask", [x, 1]); put(0, "cask", [x, 2]); }
    put(0, "goods_kelp", [4, 1]); put(0, "goods_kelp", [5, 1]); put(0, "hay", [2, 1]);
    for (const [x, z] of [[2, 2], [6, 2], [4, 4], [8, 4]]) put(0, "lantern", [x, z], top);
  } });
  const g = compose(L);
  // fish on ice along the tables' fronts
  for (const x of [2, 3, 5, 6]) if (!g.get(x + 1, 3, 4 + 1)) g.set(x + 1, 3, 4 + 1, "packed_ice");
  return { layout: L, grid: g };
}

/** The river customs: a booth at a river landing or a bridge's head, 7 x 5: a stone room with a counter window to the
 *  water, the collector's desk and chest, a scale, a lamp; a chain-and-post boom along the water's edge. Ground 2. */
export function riverCustoms() {
  const W = 7, D = 5, g = new Grid([W, 10, D]);
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, x < 5 ? "stone_bricks" : "cobblestone"); }
  for (let x = 0; x < 5; x++) for (let z = 0; z < D; z++) {
    const wall = x === 0 || x === 4 || z === 0 || z === D - 1; if (!wall) continue;
    for (let y = 3; y <= 6; y++) g.set(x, y, z, (x === 0 || x === 4) && (z === 0 || z === D - 1) ? "stone_bricks" : y === 6 ? "stripped_spruce_log[axis=x]" : "calcite");
  }
  g.set(2, 4, D - 1, "glass_pane[east=true,north=false,south=false,waterlogged=false,west=true]");
  g.set(4, 4, 2, slab("spruce", "top")); g.set(4, 5, 2, "air");                          // the counter window to the water (east)
  g.set(2, 3, 0, "spruce_door[facing=north,half=lower,hinge=left,open=false,powered=false]"); g.set(2, 4, 0, "spruce_door[facing=north,half=upper,hinge=left,open=false,powered=false]");
  for (let z = 1; z < D - 1; z++) for (let x = 1; x < 4; x++) g.set(x, 2, z, "spruce_planks");
  g.set(1, 3, 3, "enterprise:decor_lectern[facing=east]"); g.set(3, 3, 3, "chest[facing=west,type=single,waterlogged=false]");
  g.set(3, 3, 1, fence("spruce")); g.set(3, 4, 1, "light_weighted_pressure_plate[power=0]");                // the scale
  g.set(2, 6, 2, HANGING);
  // the roof: a granite pyramid of stairs, a slab ridge
  for (let x = 0; x < 5; x++) for (let z = 0; z < D; z++) g.set(x, 7, z, x === 0 ? stairs("granite", "east") : x === 4 ? stairs("granite", "west") : z === 0 ? stairs("granite", "south") : z === D - 1 ? stairs("granite", "north") : "granite");
  for (let x = 1; x < 4; x++) g.set(x, 8, 2, slab("granite"));
  // the boom along the water (x 6): posts with a chain between, a lamp on the first
  for (let z = 0; z < D; z++) g.set(6, 3, z, z % 2 === 0 ? "spruce_log[axis=y]" : "chain[axis=z,waterlogged=false]");
  g.set(6, 4, 0, LANTERN); g.set(5, 3, 4, BARREL);
  return { grid: g };
}

// ---- boats ---------------------------------------------------------------------------------------------------------
/** A cog, the sea trader: 7 x 19, bow north (z 0); a clinker hull, castles fore and aft, a mast with a square sail, cargo
 *  on deck, lamps. water_line 1: layer 0 is the keel under the water. */
export function cog() {
  const W = 7, L = 19, g = new Grid([W, 20, L]), WL = 1;
  const half = (z) => (z <= 0 || z >= L - 1 ? 0 : z <= 1 || z >= L - 2 ? 1 : z <= 3 || z >= L - 4 ? 2 : 3);       // the hull's half-width at z
  for (let z = 0; z < L; z++) {
    const h = half(z), x0 = 3 - h, x1 = 3 + h;
    if (z >= 2 && z <= L - 3) for (let x = 2; x <= 4; x++) g.set(x, 0, z, "dark_oak_planks");            // the keel
    for (let x = Math.max(x0, 1); x <= Math.min(x1, 5); x++) g.set(x, WL, z, "spruce_planks");
    // the hull's sides to the deck (layer 3), clinker strakes, the deck inside
    for (let y = WL + 1; y <= 3; y++) { g.set(x0, y, z, y === 2 ? "stripped_dark_oak_log[axis=z]" : "spruce_planks"); g.set(x1, y, z, y === 2 ? "stripped_dark_oak_log[axis=z]" : "spruce_planks"); }
    for (let x = x0 + 1; x < x1; x++) { g.set(x, 2, z, "spruce_planks"); g.set(x, 3, z, "oak_planks"); }
    if (h === 0) for (let y = WL; y <= 5; y++) g.set(3, y, z, "dark_oak_log[axis=y]");                      // stem and sternpost
  }
  // the castles: decks raised fore (z 1-4) and aft (z 13-17) to layer 5, the waist's rail at 4
  for (let z = 1; z < L - 1; z++) {
    const h = half(z), x0 = 3 - h, x1 = 3 + h, castle = z <= 4 || z >= 13;
    if (castle) for (let x = x0; x <= x1; x++) g.set(x, 4, z, x === x0 || x === x1 ? "spruce_planks" : "oak_planks");
    const railY = castle ? 5 : 4;
    g.set(x0, railY, z, fence("dark_oak", true, true)); g.set(x1, railY, z, fence("dark_oak", true, true));
  }
  for (const z of [4, 13]) for (let x = 1; x <= 5; x++) g.set(x, 5, z, fence("dark_oak", false, false, x < 5, x > 1));   // castle breastwork rails
  for (const [x, z] of [[3, 5], [3, 12]]) { g.set(x, 4, z, stairs("spruce", z === 5 ? "south" : "north")); }       // ladders up as stairs
  // the mast amidships, its square sail on a yard (fence) forward of it, a crow's nest, a pennant
  const mz = 9;
  for (let y = 4; y <= 17; y++) g.set(3, y, mz, "dark_oak_log[axis=y]");
  for (let x = 0; x < W; x++) g.set(x, 15, mz - 1, fence("spruce", false, false, x < W - 1, x > 0));
  for (let x = 0; x < W; x++) for (let y = 8; y <= 14; y++) if (!(y === 8 && (x === 0 || x === W - 1))) g.set(x, y, mz - 1, x === 3 && y === 11 ? "red_wool" : "white_wool");
  for (const [dx, dz, f] of [[-1, 0, "east"], [1, 0, "west"], [0, -1, "south"], [0, 1, "north"]]) g.set(3 + dx, 16, mz + dz, `spruce_trapdoor[facing=${f},half=bottom,open=true,powered=false,waterlogged=false]`);
  g.set(3, 18, mz, LANTERN); g.set(3, 17, mz + 1, "blue_wool");
  // cargo and lamps
  for (const [x, z] of [[2, 6], [4, 6], [2, 7], [2, 11], [4, 11]]) g.set(x, 4, z, BARREL);
  g.set(4, 4, 7, "hay_block[axis=z]"); g.set(4, 5, 7, BARREL);
  for (const [x, z] of [[2, 8], [4, 10]]) g.set(x, 4, z, LANTERN);                             // on the waist's deck
  for (const [x, z] of [[3, 15], [3, 2], [2, 16], [4, 14]]) g.set(x, 5, z, LANTERN);           // on the castles' decks
  return { grid: g };
}

/** A fishing boat: 3 x 8, a short mast with its sail furled, nets and baskets, a lamp. water_line 1. */
export function fishingBoat() {
  const g = new Grid([3, 8, 8]);
  for (let z = 0; z < 8; z++) {
    const end = z === 0 || z === 7;
    if (!end) g.set(1, 0, z, "spruce_planks");
    for (let x = 0; x < 3; x++) { if (end && x !== 1) continue; g.set(x, 1, z, "spruce_planks"); }
    if (end) { g.set(1, 2, z, "dark_oak_log[axis=y]"); continue; }
    g.set(0, 2, z, "spruce_slab[type=bottom,waterlogged=false]"); g.set(2, 2, z, "spruce_slab[type=bottom,waterlogged=false]");
  }
  for (let y = 2; y <= 5; y++) g.set(1, y, 3, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]");
  g.set(1, 6, 3, "white_wool"); g.set(1, 6, 4, "white_carpet");
  g.set(1, 2, 5, BARREL); g.set(1, 2, 6, "spruce_trapdoor[facing=north,half=bottom,open=false,powered=false,waterlogged=false]");
  g.set(1, 2, 1, LANTERN);
  return { grid: g };
}

/** A river barge: 4 x 11, flat and low, a load of hay and barrels under a cloth, a tiller, a lamp on a post. water_line 1. */
export function barge() {
  const W = 4, L = 11, g = new Grid([W, 6, L]);
  for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
    g.set(x, 0, z, "dark_oak_planks"); g.set(x, 1, z, x === 0 || x === W - 1 || z === 0 || z === L - 1 ? "spruce_planks" : "dark_oak_planks");
    if (x === 0 || x === W - 1 || z === 0 || z === L - 1) g.set(x, 2, z, "spruce_slab[type=bottom,waterlogged=false]");
  }
  for (let z = 2; z <= 6; z++) { g.set(1, 2, z, z % 2 ? "hay_block[axis=z]" : BARREL); g.set(2, 2, z, z % 2 ? BARREL : "hay_block[axis=z]"); g.set(1, 3, z, "brown_carpet"); g.set(2, 3, z, "brown_carpet"); }
  g.set(1, 2, L - 2, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); g.set(1, 3, L - 2, LANTERN);
  g.set(2, 2, L - 1, "spruce_trapdoor[facing=north,half=bottom,open=true,powered=false,waterlogged=false]");     // the tiller
  g.set(2, 2, 1, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); g.set(2, 3, 1, LANTERN);
  return { grid: g };
}

// ---- the set -------------------------------------------------------------------------------------------------------
export function harbourParts() {
  const out = [], dock = (id, r, meta) => out.push({ id, grid: r.grid, meta: { contract: "dock", water_line: 0, pilings: r.pilings || [], ...meta } });
  const S = QUAY.stone, T = QUAY.timber;
  for (const v of ["a", "b", "c"]) dock(`quay_stone_1${v}`, quay(S, { seed: v.charCodeAt(0) * 7 }), { deck: 2, width: 1, depth: 3, use: ["sea", "river"], tags: ["quay"] });
  dock("quay_stone_bollard_1", quay(S, { seed: 11, bollard: true }), { deck: 2, width: 1, depth: 3, use: ["sea", "river"], tags: ["quay", "bollard"] });
  dock("quay_stone_lamp_1", quay(S, { seed: 13, lamp: true }), { deck: 2, width: 1, depth: 3, use: ["sea", "river"], tags: ["quay", "lamp"] });
  dock("quay_stone_ladder_1", quay(S, { seed: 17, ladder: true }), { deck: 2, width: 1, depth: 3, use: ["sea", "river"], tags: ["quay", "ladder"] });
  dock("quay_stone_steps_1", quay(S, { seed: 19, steps: true }), { deck: 2, width: 1, depth: 3, use: ["sea", "river"], tags: ["quay", "steps"] });
  dock("quay_stone_crane_1", quay(S, { seed: 23, crane: true }), { deck: 2, width: 1, depth: 3, use: ["sea"], tags: ["quay", "crane", "lamp"] });
  for (const v of ["a", "b"]) dock(`quay_timber_1${v}`, quay(T, { seed: v.charCodeAt(0) * 5 }), { deck: 2, width: 1, depth: 3, use: ["river"], tags: ["quay", "timber"] });
  dock("quay_timber_lamp_1", quay(T, { seed: 29, lamp: true }), { deck: 2, width: 1, depth: 3, use: ["river"], tags: ["quay", "timber", "lamp"] });
  dock("quay_timber_ladder_1", quay(T, { seed: 31, ladder: true }), { deck: 2, width: 1, depth: 3, use: ["river"], tags: ["quay", "timber", "ladder"] });
  dock("quay_timber_crane_1", quay(T, { seed: 37, crane: true }), { deck: 2, width: 1, depth: 3, use: ["river"], tags: ["quay", "timber", "crane", "lamp"] });
  dock("jetty_timber_3x4", jettySegment(), { deck: 1, width: 3, depth: 4, use: ["river", "sea"], tags: ["pier", "timber", "lamp"], repeat: "along +z from the quay's edge" });
  dock("jetty_head_timber_5x5", jettyHead(), { deck: 1, width: 5, depth: 5, use: ["river", "sea"], tags: ["pier", "head", "timber", "lamp"] });
  for (const v of ["a", "b"]) dock(`mole_7x4${v}`, moleSegment(v.charCodeAt(0)), { deck: 3, width: 7, depth: 4, use: ["sea"], tags: ["mole"], repeat: "along +z out from the shore; the sea on its east side" });
  dock("mole_head_lighthouse_9x9", lighthouse(), { deck: 3, width: 9, depth: 9, use: ["sea"], tags: ["mole", "head", "lighthouse", "lamp"] });
  const boat = (id, r, meta) => out.push({ id, grid: r.grid, meta: { contract: "boat", water_line: 1, ...meta } });
  boat("boat_cog_7x19", cog(), { width: 7, depth: 19, use: ["sea"], tags: ["boat", "trader"], moor: "alongside a quay or pier, its side 1 off the edge, bow toward the open water" });
  boat("boat_fishing_3x8", fishingBoat(), { width: 3, depth: 8, use: ["sea", "river"], tags: ["boat", "fishing"], moor: "beside a jetty or quay ladder" });
  boat("boat_barge_4x11", barge(), { width: 4, depth: 11, use: ["river"], tags: ["boat", "barge"], moor: "alongside a timber quay or wharf, under its crane" });
  return out;
}

export function harbourBuildings() {
  return [
    { id: "customs_house_13x10", ...customsHouse(), meta: { slot: "harbour:customs_house", use: ["sea"], storeys: 2, faces: "the quay (front, south)", note: "the arcade on the quay where cargo is inspected and weighed, the collector's office above, a cupola with the harbour flag" } },
    { id: "warehouse_13x7", ...warehouse(), meta: { slot: "harbour:warehouse", use: ["sea"], storeys: 2, faces: "the quay (front, south)", note: "open loading bays to the quay, stock inside, a hoist from the loft's east gable (2 past the wall)" } },
    { id: "warehouse_10x7", ...warehouse({ W: 10, storeys: 1 }), meta: { slot: "harbour:warehouse", use: ["river"], storeys: 1, faces: "the wharf (front, south)", note: "the river's store: loading bays to the wharf, a hoist from the east gable" } },
    { id: "fish_market_10x7", ...fishMarket(), meta: { slot: "harbour:fish_market", use: ["sea", "river"], storeys: 1, faces: "the quay (front, south)", note: "open arcades to the quay, tables of fish on ice, barrels, drying kelp" } },
    { id: "river_customs_7x5", ...riverCustoms(), meta: { slot: "harbour:river_customs", use: ["river"], storeys: 1, faces: "the water (east)", note: "a booth at a river landing or a bridge's head: a counter window to the water, a chain boom along the edge" } },
  ];
}
