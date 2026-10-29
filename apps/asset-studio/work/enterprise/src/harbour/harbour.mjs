// The harbour district: what a town on the sea, or on a river, builds at its water, in each kingdom's dress (one
// geometry, a style per kingdom, as the earthworks and bridges). Two kinds of part:
//   buildings on the kingdom's shell (ground 2, front south, facing the quay): the customs house, warehouses, the fish
//     market (Lordaeron's and Stormwind's on the relief module set in their palettes, Dalaran's on its platform halls
//     under hipped roofs), and the river customs booth
//   waterside parts on the dock contract: layer `water_line` is the water's surface, the deck stands at `deck`; the
//     placer runs each declared piling down from the water line to the bed. Authored with the water to the south (a
//     quay tile's z 0 is the land side) or, for piers and moles, running out along +z from the shore at z 0.
// Boats are decoration moored in the water: their `water_line` layer goes at the water's surface; everything under it
// is solid hull, so nothing floods.
import { Grid } from "../grid.mjs";
import { layoutOf, compose } from "../lordaeron/compose.mjs";
import { cupola } from "../lordaeron/forum-front.mjs";
import { hash } from "../lordaeron/earthworks.mjs";
import { dalaranLayout } from "../dalaran/compose.mjs";

const stairs = (b, f, half = "bottom") => `${b}_stairs[facing=${f},half=${half},shape=straight,waterlogged=false]`;
const slab = (b, t = "bottom") => `${b}_slab[type=${t},waterlogged=false]`;
const fence = (w, n = false, s = false, e = false, wst = false) => `${w}_fence[east=${e},north=${n},south=${s},waterlogged=false,west=${wst}]`;
const wallPost = (b) => `${b}_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]`;
const LANTERN = "lantern[hanging=false,waterlogged=false]";
const BARREL = "enterprise:decor_barrel[facing=up,open=false]";
const IRON = "iron_bars[east=false,north=false,south=false,waterlogged=false,west=false]";

// ---- the kingdoms' dress ------------------------------------------------------------------------------------------
export const HARBOUR = {
  lordaeron: {
    stone: { deck: (r) => (r < 0.7 ? "stone_bricks" : r < 0.88 ? "cobblestone" : "cracked_stone_bricks"), edge: "polished_andesite", face: (r) => (r < 0.6 ? "stone_bricks" : r < 0.85 ? "mossy_stone_bricks" : "cobblestone"),
      bollard: wallPost("andesite"), pile: "minecraft:stone_bricks", stair: "stone_brick" },
    timber: { wood: "spruce", deck: (r) => (r < 0.8 ? "spruce_planks" : "stripped_spruce_wood[axis=y]"), edge: "stripped_spruce_log[axis=x]", face: () => "spruce_log[axis=y]", bollard: "spruce_log[axis=y]", pile: "minecraft:spruce_log" },
    lamp_post: fence("spruce"), crane: "dark_oak", parapet: "stone_brick_wall", walk: ["stone_bricks", "cracked_stone_bricks", "polished_andesite"],
    tower: { wall: (r) => (r < 0.85 ? "stone_bricks" : "mossy_stone_bricks"), band: "calcite", rail: IRON, cap: "deepslate_tile", door: "spruce" },
    ship: { hull: "spruce_planks", wale: "stripped_dark_oak_log[axis=z]", deck: "oak_planks", keel: "dark_oak_planks", post: "dark_oak_log[axis=y]", rail: "dark_oak", mast: "dark_oak_log[axis=y]", yard: "spruce",
      sail: (x, y, w, h) => (x === Math.floor(w / 2) && y === Math.floor(h / 2) ? "red_wool" : "white_wool"), pennant: "blue_wool", nest: "spruce" },
    flag: "blue_wool", roof: "granite", pal: { customs: "stone", warehouse: "brick", river_warehouse: "brick", fish: "stone" },
  },
  // Dalaran: polished andesite and dressed stone, dark oak and red mangrove, violet tile, red sails on dark battens
  dalaran: {
    stone: { deck: (r) => (r < 0.6 ? "polished_andesite" : r < 0.9 ? "stone_bricks" : "cracked_stone_bricks"), edge: "polished_andesite", face: (r) => (r < 0.75 ? "stone_bricks" : r < 0.9 ? "cracked_stone_bricks" : "mossy_stone_bricks"),
      bollard: fence("mangrove"), pile: "minecraft:stone_bricks", stair: "polished_andesite" },
    timber: { wood: "dark_oak", deck: (r) => (r < 0.85 ? "dark_oak_planks" : "stripped_dark_oak_wood[axis=y]"), edge: "stripped_dark_oak_log[axis=x]", face: () => "dark_oak_log[axis=y]", bollard: "stripped_mangrove_log[axis=y]", pile: "minecraft:dark_oak_log" },
    lamp_post: fence("dark_oak"), crane: "dark_oak", parapet: null, walk: ["polished_andesite", "stone_bricks", "polished_andesite"],
    tower: { wall: (r) => (r < 0.85 ? "stone_bricks" : "cracked_stone_bricks"), band: "stripped_mangrove_wood[axis=y]", rail: fence("dark_oak"), cap: "purpur", door: "dark_oak" },
    ship: { hull: "dark_oak_planks", wale: "stripped_mangrove_log[axis=z]", deck: "spruce_planks", keel: "dark_oak_planks", post: "stripped_mangrove_log[axis=y]", rail: "dark_oak", mast: "dark_oak_log[axis=y]", yard: "dark_oak",
      sail: () => "red_wool", batten: true, pennant: "yellow_wool", nest: "dark_oak" },
    flag: "red_wool", roof: "purpur", pal: null,       // Dalaran's buildings carry its own materials (the platform halls)
  },
  // Stormwind: white stone and smooth quartz, oak, blue-grey slate, white sails with its blue and gold
  stormwind: {
    stone: { deck: (r) => (r < 0.7 ? "stone_bricks" : r < 0.9 ? "smooth_stone" : "cracked_stone_bricks"), edge: "smooth_quartz", face: (r) => (r < 0.8 ? "stone_bricks" : r < 0.93 ? "cracked_stone_bricks" : "chiseled_stone_bricks"),
      bollard: wallPost("stone_brick"), pile: "minecraft:stone_bricks", stair: "quartz" },
    timber: { wood: "oak", deck: (r) => (r < 0.85 ? "oak_planks" : "stripped_oak_wood[axis=y]"), edge: "stripped_oak_log[axis=x]", face: () => "oak_log[axis=y]", bollard: "oak_log[axis=y]", pile: "minecraft:oak_log" },
    lamp_post: fence("oak"), crane: "oak", parapet: "stone_brick_wall", walk: ["smooth_stone", "stone_bricks", "smooth_quartz"],
    tower: { wall: () => "stone_bricks", band: "smooth_quartz", rail: IRON, cap: "deepslate_tile", door: "oak" },
    ship: { hull: "oak_planks", wale: "stripped_spruce_log[axis=z]", deck: "birch_planks", keel: "spruce_planks", post: "spruce_log[axis=y]", rail: "spruce", mast: "spruce_log[axis=y]", yard: "spruce",
      sail: (x, y, w, h) => (Math.abs(x - Math.floor(w / 2)) <= 1 ? (y === Math.floor(h / 2) ? "yellow_wool" : "blue_wool") : "white_wool"), pennant: "yellow_wool", nest: "spruce" },
    flag: "blue_wool", roof: "deepslate_tile", pal: { customs: "stone", warehouse: "daub", river_warehouse: "daub", fish: "daub" },   // aliases: daub -> goldshire
  },
};

// ---- the quay: a waterside edge in stone (sea) or timber (river) ---------------------------------------------------
// width 1, depth 3: z 0 the quay's paving (deck), z 1 the edge (its face drops to the water), z 2 the face's fixtures
// in the water (ladders, steps); unset cells there are left as they are. water_line 0, deck 2.
function quay(K, Q, { seed, bollard = false, ladder = false, lamp = false, steps = false, crane = false }) {
  const g = new Grid([1, crane ? 9 : 6, 3]);
  g.set(0, 0, 0, Q.face(hash(seed, 0, 1))); g.set(0, 1, 0, Q.face(hash(seed, 1, 1))); g.set(0, 2, 0, Q.deck(hash(seed, 2)));
  g.set(0, 0, 1, Q.face(hash(seed, 0, 2))); g.set(0, 1, 1, Q.face(hash(seed, 1, 2))); g.set(0, 2, 1, Q.edge);
  if (steps) { const st = Q.stair || "stone_brick"; g.set(0, 2, 1, stairs(st, "north")); g.set(0, 1, 2, slab(st)); g.set(0, 0, 2, "stone_bricks"); }
  if (bollard) g.set(0, 3, 1, Q.bollard);
  if (lamp) { g.set(0, 3, 1, Q.bollard); g.set(0, 4, 1, K.lamp_post); g.set(0, 5, 1, LANTERN); }
  if (ladder && !steps) { g.set(0, 0, 2, "ladder[facing=south,waterlogged=true]"); g.set(0, 1, 2, "ladder[facing=south,waterlogged=false]"); }
  if (crane) {
    // a timber crane at the edge: a post, a jib out over the water, the hoist chain and a crate on it
    const w = K.crane;
    for (let y = 3; y <= 7; y++) g.set(0, y, 0, `${w}_log[axis=y]`);
    g.set(0, 8, 0, slab(w)); g.set(0, 7, 1, `${w}_log[axis=z]`); g.set(0, 7, 2, fence(w, true));
    g.set(0, 6, 2, "chain[axis=y,waterlogged=false]"); g.set(0, 5, 2, "chain[axis=y,waterlogged=false]"); g.set(0, 4, 2, BARREL);
    g.set(0, 6, 1, stairs(w, "north", "top")); g.set(0, 3, 1, LANTERN);
  }
  return { grid: g, pilings: [{ at: [0, 1], block: Q.pile }, { at: [0, 0], block: Q.pile }] };
}

// ---- piers and the mole ---------------------------------------------------------------------------------------------
/** A timber jetty segment: 3 wide, 4 long, a plank deck on log piles, a rail one side, a mooring post with its lamp. */
function jettySegment(K) {
  const w = K.timber.wood, g = new Grid([3, 5, 4]);
  for (let x = 0; x < 3; x++) for (let z = 0; z < 4; z++) g.set(x, 1, z, z === 0 || z === 3 ? `stripped_${w}_log[axis=x]` : `${w}_planks`);
  for (const [x, z] of [[0, 0], [2, 0], [0, 3], [2, 3]]) g.set(x, 0, z, `${w}_log[axis=y]`);
  for (let z = 0; z < 4; z++) g.set(2, 2, z, fence(w, z > 0, z < 3));
  g.set(0, 2, 1, K.timber.bollard); g.set(0, 3, 1, LANTERN);
  return { grid: g, pilings: [[0, 0], [2, 0], [0, 3], [2, 3]].map(([x, z]) => ({ at: [x, z], block: K.timber.pile })) };
}

/** A jetty's head: 5 x 5, a bench and mooring posts, lamps. */
function jettyHead(K) {
  const w = K.timber.wood, g = new Grid([5, 5, 5]);
  for (let x = 0; x < 5; x++) for (let z = 0; z < 5; z++) g.set(x, 1, z, x === 0 || x === 4 || z === 4 ? `stripped_${w}_log[axis=${z === 4 ? "x" : "z"}]` : `${w}_planks`);
  for (const [x, z] of [[0, 0], [4, 0], [0, 4], [4, 4], [2, 4]]) g.set(x, 0, z, `${w}_log[axis=y]`);
  for (const [x, z] of [[0, 4], [4, 4]]) { g.set(x, 2, z, K.timber.bollard); g.set(x, 3, z, LANTERN); }
  g.set(1, 2, 1, stairs(w, "east")); g.set(1, 2, 2, stairs(w, "east"));
  g.set(3, 2, 1, BARREL); g.set(0, 2, 2, K.timber.bollard);
  return { grid: g, pilings: [[0, 0], [4, 0], [0, 4], [4, 4], [2, 4]].map(([x, z]) => ({ at: [x, z], block: K.timber.pile })) };
}

/** The mole (a breakwater): 7 wide, 4 long, rubble sloping into the water both sides, a paved walk on top behind a
 *  parapet on the sea side (east; Dalaran's a dark oak rail on red posts). water_line 0, the walk at 3. */
function moleSegment(K, seed) {
  const g = new Grid([7, 6, 4]), rub = (r) => (r < 0.4 ? "cobblestone" : r < 0.65 ? "mossy_cobblestone" : r < 0.85 ? "stone" : "andesite");
  for (let z = 0; z < 4; z++) {
    g.set(0, 0, z, rub(hash(seed, 0, z))); g.set(0, 1, z, stairs("cobblestone", "east"));
    g.set(6, 0, z, rub(hash(seed, 6, z))); g.set(6, 1, z, rub(hash(seed, 6, z, 1))); g.set(6, 2, z, stairs("mossy_cobblestone", "west"));
    for (let x = 1; x <= 5; x++) for (let y = 0; y <= 2; y++) g.set(x, y, z, rub(hash(seed, x, y, z)));
    for (let x = 1; x <= 4; x++) g.set(x, 3, z, x === 1 ? K.walk[2] : (x + z) % 3 ? K.walk[0] : K.walk[1]);
    g.set(5, 3, z, "stone_bricks");
    g.set(5, 4, z, K.parapet ? `${K.parapet}[east=none,north=${z > 0 ? "low" : "none"},south=${z < 3 ? "low" : "none"},up=${z === 1},waterlogged=false,west=none]`
      : fence(z === 1 ? "mangrove" : "dark_oak", true, true));
    g.set(1, 2, z, rub(hash(seed, 1, 2, z, 3)));
  }
  g.set(5, 5, 1, LANTERN);
  return { grid: g, pilings: [...Array(7).keys()].flatMap((x) => [0, 3].map((z) => ({ at: [x, z], block: "minecraft:cobblestone" }))) };
}

/** The mole's head with the lighthouse: 9 x 9, a round tower 5 across in the kingdom's stone and bands, hollow (a
 *  ladder, lamps set in its wall), a gallery and a glass lantern room round a lit core under the kingdom's cap. */
function lighthouse(K) {
  const T = K.tower, W = 9, g = new Grid([W, 26, W]), c = 4, rub = (r) => (r < 0.5 ? "cobblestone" : r < 0.8 ? "mossy_cobblestone" : "stone");
  const inTower = (x, z) => { const dx = Math.abs(x - c), dz = Math.abs(z - c); return dx <= 2 && dz <= 2 && dx + dz <= 3; };
  const ring = (x, z) => inTower(x, z) && !(Math.abs(x - c) + Math.abs(z - c) <= 1);
  const capFull = T.cap === "purpur" ? "purpur_block" : `${T.cap}s`;
  for (let x = 0; x < W; x++) for (let z = 0; z < W; z++) {
    const edge = x === 0 || z === 0 || x === W - 1 || z === W - 1;
    for (let y = 0; y <= 2; y++) g.set(x, y, z, edge && y === 2 ? stairs("cobblestone", x === 0 ? "east" : x === W - 1 ? "west" : z === 0 ? "south" : "north") : rub(hash(x, y, z)));
    if (!edge) g.set(x, 3, z, (x + z) % 2 ? K.walk[0] : K.walk[2]);
  }
  for (let x = 1; x < W - 1; x++) for (let z = 1; z < W - 1; z++) if ((x === 1 || z === 1 || x === W - 2 || z === W - 2) && !(z === 1 && x === c)) g.set(x, 4, z, K.parapet ? wallPost(K.parapet.replace(/_wall$/, "")) : fence("dark_oak"));
  for (const [x, z] of [[1, 1], [W - 2, 1], [1, W - 2], [W - 2, W - 2]]) g.set(x, 5, z, LANTERN);
  const T0 = 4, T1 = 17;
  for (let y = T0; y <= T1; y++) for (let x = 0; x < W; x++) for (let z = 0; z < W; z++) {
    if (!inTower(x, z)) continue;
    g.set(x, y, z, ring(x, z) ? ((y - T0) % 5 === 4 ? T.band : T.wall(hash(x, y, z, 2))) : "air");
  }
  g.set(c, T0, c - 2, `${T.door}_door[facing=north,half=lower,hinge=left,open=false,powered=false]`); g.set(c, T0 + 1, c - 2, `${T.door}_door[facing=north,half=upper,hinge=left,open=false,powered=false]`);
  for (let y = T0; y <= T1 + 1; y++) g.set(c, y, c + 1, "ladder[facing=north,waterlogged=false]");
  for (const y of [T0 + 2, T0 + 7, T0 + 12]) g.set(c - 2, y, c, "sea_lantern");
  for (const y of [T0 + 5, T0 + 10]) { g.set(c, y, c + 2, "glass_pane[east=true,north=false,south=false,waterlogged=false,west=true]"); g.set(c + 2, y, c, "glass_pane[east=false,north=true,south=true,waterlogged=false,west=false]"); }
  const G = T1 + 1;
  for (let x = c - 3; x <= c + 3; x++) for (let z = c - 3; z <= c + 3; z++) {
    const dx = Math.abs(x - c), dz = Math.abs(z - c); if (dx + dz > 4) continue;
    const rim = dx + dz === 4 || Math.max(dx, dz) === 3;
    g.set(x, G, z, rim ? "stone_brick_slab[type=top,waterlogged=false]" : "stone_bricks");
    if (rim) g.set(x, G + 1, z, T.rail);
  }
  for (let y = G + 1; y <= G + 3; y++) for (let x = c - 1; x <= c + 1; x++) for (let z = c - 1; z <= c + 1; z++) g.set(x, y, z, x === c && z === c ? (y === G + 2 ? "glowstone" : "dark_oak_log[axis=y]") : "glass");
  g.set(c, G + 1, c, "air"); g.set(c, G + 1, c + 1, "ladder[facing=north,waterlogged=false]"); g.set(c, G + 2, c + 1, "glass");
  for (let x = c - 2; x <= c + 2; x++) for (let z = c - 2; z <= c + 2; z++) {
    const dx = Math.abs(x - c), dz = Math.abs(z - c); if (dx + dz > 3) continue;
    g.set(x, G + 4, z, dx === 2 || dz === 2 ? stairs(T.cap, dx === 2 ? (x < c ? "east" : "west") : (z < c ? "south" : "north")) : capFull);
  }
  g.set(c, G + 5, c, slab(T.cap)); g.set(c, G + 6, c, "end_rod[facing=up]");
  return { grid: g, pilings: [[0, 0], [W - 1, 0], [0, W - 1], [W - 1, W - 1], [c, c]].map(([x, z]) => ({ at: [x, z], block: "minecraft:cobblestone" })) };
}

// ---- buildings ------------------------------------------------------------------------------------------------------
const isDal = (K) => K === HARBOUR.dalaran;
const layout = (K, p) => (isDal(K) ? dalaranLayout(p) : layoutOf({ roof: "gable_x", ...p }));
/** the harbour flag on a pole over the building's highest point */
function flagOn(g, K) {
  let best = [0, -1, 0];
  for (const [x, y, z, s] of g.each()) if (s !== "air" && y > best[1]) best = [x, y, z];
  const [fx, fy, fz] = best, G = new Grid([g.size[0], fy + 5, g.size[2]]); G.paste(g, 0, 0, 0);
  for (let y = fy + 1; y <= fy + 3; y++) G.set(fx, y, fz, fence("dark_oak"));
  G.set(fx, fy + 3, fz + 1, K.flag); G.set(fx, fy + 4, fz, fence("dark_oak"));
  return G;
}

/** The customs house: an open arcade on the quay where cargo is inspected and weighed, the collector's office above
 *  (desks, ledgers, the strongroom's chests), the harbour flag. Lordaeron's and Stormwind's 13 x 10 with a lantern
 *  cupola; Dalaran's 13 x 7 under one hipped roof (its roofs come in the plan's bodies). */
export function customsHouse(K) {
  const D = isDal(K) ? 7 : 10;
  const L = layout(K, { W: 13, D, storeys: 2, arcade: true, fitout: ({ put, top }) => {
    for (const x of [2, 3, 6, 7]) put(0, "cask", [x, 2]);
    put(0, "hay", [2, 3]); put(0, "goods_kelp", [3, 3]); put(0, "goods_wool", [6, 3]); put(0, "goods_pot", [7, 3]);
    put(0, "desk", [4, D - 4]); put(0, "goods_chain", [5, D - 4]);
    for (const [x, z] of [[3, 4], [7, 4], [3, D - 3], [7, D - 3], [9, D - 3]]) put(0, "lantern", [x, z], top);
    put(1, "desk", [2, 3]); put(1, "desk", [2, D - 4]); for (const x of [1, 2, 3]) put(1, "shelf", [x, 1]);
    for (const x of [6, 7, 8]) put(1, "chest", [x, D - 2]); put(1, "table", [5, 3]); put(1, "candles", [5, 3], 2);
    for (const [x, z] of [[3, 3], [6, 2], [3, D - 3], [6, D - 3], [9, D - 3]]) put(1, "lantern", [x, z], top);
  } });
  let g = compose(L);
  if (!isDal(K)) g = cupola(g);
  return { layout: L, grid: flagOn(g, K) };
}

/** A warehouse on the quay: open loading bays to the quay, stock stacked inside, a hoist beam out from the east wall
 *  (sea 13 x 7, 2 storeys; river 10 x 7, 1 storey). */
export function warehouse(K, { W = 13, storeys = 2 } = {}) {
  const L = layout(K, { W, D: 7, storeys, arcade: "front", noCore: storeys === 1, fitout: ({ put, top }) => {
    const n = W - 2;
    for (let x = 1; x <= n; x++) { put(0, x % 3 === 0 ? "hay" : "cask", [x, 1]); if (x % 2) put(0, x % 4 === 1 ? "goods_wool" : "cask", [x, 2]); }
    for (let x = 2; x < n; x += 3) put(0, "lantern", [x, 4], top);
    if (storeys > 1) { for (let x = 1; x <= 6; x++) put(1, x % 2 ? "goods_wool" : "hay", [x, 1]); for (const [x, z] of [[2, 3], [5, 3], [3, 5], [8, 2], [9, 6], [7, 5]]) put(1, "lantern", [x, z], top); }
  } });
  const g0 = compose(L), g = new Grid([g0.size[0] + 2, g0.size[1], g0.size[2]]);
  g.paste(g0, 0, 0, 0);
  // the hoist: a beam out from the east wall below its top, a chain and a bale (past Dalaran's eaves)
  const eave = isDal(K) ? 2 : 0, ez = Math.floor(g0.size[2] / 2), wx = g0.size[0] - 1 - eave;
  let wallTop = 0; for (let y = 0; y < g0.size[1]; y++) { const s = g0.get(wx, y, ez); if (s && s !== "air") wallTop = y; }
  const hy = Math.min(wallTop, 2 + 5 * storeys) - 1, x0 = g0.size[0];
  for (let x = wx + 1; x < x0; x++) g.set(x, hy, ez, "dark_oak_log[axis=x]");
  g.set(x0, hy, ez, "dark_oak_log[axis=x]"); g.set(x0 + 1, hy, ez, fence("dark_oak", false, false, false, true));
  g.set(x0 + 1, hy - 1, ez, "chain[axis=y,waterlogged=false]"); g.set(x0 + 1, hy - 2, ez, "hay_block[axis=y]");
  return { layout: L, grid: g };
}

/** The fish market: 10 x 7, 1 storey, open arcades to the quay, windowed sides, tables of fish on ice, barrels, kelp. */
export function fishMarket(K) {
  const L = layout(K, { W: 10, D: 7, storeys: 1, arcade: "front", noCore: true, fitout: ({ put, top }) => {
    for (const x of [2, 3, 5, 6]) put(0, "table", [x, 3]);
    for (const x of [1, 8]) { put(0, "cask", [x, 1]); put(0, "cask", [x, 2]); }
    put(0, "goods_kelp", [4, 1]); put(0, "goods_kelp", [5, 1]); put(0, "hay", [2, 1]);
    for (const [x, z] of [[2, 2], [6, 2], [4, 4], [8, 4]]) put(0, "lantern", [x, z], top);
  } });
  const g = compose(L), off = isDal(K) ? 2 : 0;
  for (const x of [2, 3, 5, 6]) if (!g.get(x + 1 + off, 3, 5 + off)) g.set(x + 1 + off, 3, 5 + off, "packed_ice");
  return { layout: L, grid: g };
}

/** The river customs: a booth at a river landing or a bridge's head, 7 x 5: a room with a counter window to the water
 *  (east), the collector's desk and chest, a scale, a lamp; a chain-and-post boom along the water's edge. Ground 2. */
export function riverCustoms(K) {
  const Q = K.stone, w = K.timber.wood, W = 7, D = 5, g = new Grid([W, 10, D]);
  const corner = isDal(K) ? "stripped_mangrove_log[axis=y]" : "stone_bricks", beam = `stripped_${w}_log[axis=x]`;
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, x < 5 ? Q.edge : Q.deck(hash(x, z, 4))); }
  for (let x = 0; x < 5; x++) for (let z = 0; z < D; z++) {
    if (!(x === 0 || x === 4 || z === 0 || z === D - 1)) continue;
    for (let y = 3; y <= 6; y++) g.set(x, y, z, (x === 0 || x === 4) && (z === 0 || z === D - 1) ? corner : y === 6 ? beam : "calcite");
  }
  g.set(2, 4, D - 1, "glass_pane[east=true,north=false,south=false,waterlogged=false,west=true]");
  g.set(4, 4, 2, slab(w, "top")); g.set(4, 5, 2, "air");                                   // the counter window to the water
  g.set(2, 3, 0, `${w}_door[facing=north,half=lower,hinge=left,open=false,powered=false]`); g.set(2, 4, 0, `${w}_door[facing=north,half=upper,hinge=left,open=false,powered=false]`);
  for (let z = 1; z < D - 1; z++) for (let x = 1; x < 4; x++) g.set(x, 2, z, `${w}_planks`);
  g.set(1, 3, 3, "enterprise:decor_lectern[facing=east]"); g.set(3, 3, 3, "chest[facing=west,type=single,waterlogged=false]");
  g.set(3, 3, 1, fence(w)); g.set(3, 4, 1, "light_weighted_pressure_plate[power=0]");              // the scale
  g.set(2, 6, 2, "lantern[hanging=true,waterlogged=false]");
  const R = K.roof, full = R === "purpur" ? "purpur_block" : R === "deepslate_tile" ? "deepslate_tiles" : R;
  for (let x = 0; x < 5; x++) for (let z = 0; z < D; z++) g.set(x, 7, z, x === 0 ? stairs(R, "east") : x === 4 ? stairs(R, "west") : z === 0 ? stairs(R, "south") : z === D - 1 ? stairs(R, "north") : full);
  for (let x = 1; x < 4; x++) g.set(x, 8, 2, slab(R));
  if (isDal(K)) for (const [x, z, f] of [[0, 0, "east"], [4, 0, "west"], [0, D - 1, "east"], [4, D - 1, "west"]]) g.set(x, 8, z, stairs("purpur", f, "top"));
  for (let z = 0; z < D; z++) g.set(6, 3, z, z % 2 === 0 ? K.timber.bollard : "chain[axis=z,waterlogged=false]");
  g.set(6, 4, 0, LANTERN); g.set(5, 3, 4, BARREL);
  return { grid: g };
}

// ---- boats ---------------------------------------------------------------------------------------------------------
/** A sea trader: 9 x 25, bow north (z 0): a full hull curving in at the ends, a raised forecastle and sterncastle, a
 *  mainmast and a foremast with their sails in the kingdom's cloth (Dalaran's battened), cargo, lamps. water_line 1:
 *  layer 0 is the keel under the water. */
export function trader(K) {
  const S = K.ship, W = 9, L = 25, g = new Grid([W, 24, L]), c = 4, WL = 1;
  const half = (z) => { const e = Math.min(z, L - 1 - z); return e === 0 ? 0 : e === 1 ? 1 : e <= 3 ? 2 : e <= 5 ? 3 : 4; };
  for (let z = 0; z < L; z++) {
    const h = half(z), x0 = c - h, x1 = c + h;
    if (h >= 2) for (let x = c - 1; x <= c + 1; x++) g.set(x, 0, z, S.keel);
    for (let x = Math.max(x0, c - 3); x <= Math.min(x1, c + 3); x++) g.set(x, WL, z, S.hull);
    for (let y = WL + 1; y <= 3; y++) { g.set(x0, y, z, y === 2 ? S.wale : S.hull); g.set(x1, y, z, y === 2 ? S.wale : S.hull); }
    for (let x = x0 + 1; x < x1; x++) { g.set(x, 2, z, S.hull); g.set(x, 3, z, S.deck); }
    if (h === 0) for (let y = WL; y <= 6; y++) g.set(c, y, z, S.post);                     // stem and sternpost
  }
  // the castles, decks at layer 5 (fore z 1-5, aft z 18-23), the waist's rail at 4, the castles' rails at 6
  for (let z = 1; z < L - 1; z++) {
    const h = half(z), x0 = c - h, x1 = c + h, castle = z <= 5 || z >= 18;
    if (castle) for (let x = x0; x <= x1; x++) { g.set(x, 4, z, x === x0 || x === x1 ? S.hull : S.deck); g.set(x, 5, z, x === x0 || x === x1 ? S.hull : S.deck); }
    const ry = castle ? 6 : 4;
    g.set(x0, ry, z, fence(S.rail, true, true)); g.set(x1, ry, z, fence(S.rail, true, true));
  }
  for (const z of [5, 18]) for (let x = 1; x < W - 1; x++) g.set(x, 6, z, fence(S.rail, false, false, x < W - 2, x > 1));
  // steps up to the castles: a stair and a slab on the waist, the breastwork open there
  g.set(c, 4, 6, stairs(S.rail, "south")); g.set(c, 6, 5, "air"); g.set(c, 4, 17, stairs(S.rail, "north")); g.set(c, 6, 18, "air");
  // the masts: main amidships, fore a third back from the bow; each sail a plane forward of its mast under a yard
  const mast = (mz, top, sw, sy0, sy1) => {
    for (let y = 4; y <= top; y++) g.set(c, y, mz, S.mast);
    const x0 = c - Math.floor(sw / 2);
    for (let x = x0; x < x0 + sw; x++) g.set(x, sy1 + 1, mz - 1, fence(S.yard, false, false, x < x0 + sw - 1, x > x0));
    for (let x = x0; x < x0 + sw; x++) for (let y = sy0; y <= sy1; y++) {
      const batten = S.batten && (y - sy0) % 3 === 2;
      g.set(x, y, mz - 1, batten ? `stripped_${S.yard}_log[axis=x]` : S.sail(x - x0, y - sy0, sw, sy1 - sy0 + 1));
    }
    g.set(c, top + 1, mz, LANTERN);
  };
  mast(12, 20, 9, 8, 17); mast(6, 15, 5, 8, 13);
  for (const [dx, dz, f] of [[-1, 0, "east"], [1, 0, "west"], [0, -1, "south"], [0, 1, "north"]]) g.set(c + dx, 19, 12 + dz, `${S.nest}_trapdoor[facing=${f},half=bottom,open=true,powered=false,waterlogged=false]`);
  g.set(c, 20, 13, S.pennant);
  // cargo on the waist, lamps on every deck
  for (const [x, z] of [[2, 8], [6, 8], [2, 9], [6, 14], [2, 15], [6, 15]]) g.set(x, 4, z, BARREL);
  g.set(6, 4, 9, "hay_block[axis=z]"); g.set(6, 5, 9, BARREL); g.set(2, 4, 14, "white_wool");
  for (const [x, z] of [[3, 10], [5, 14], [5, 7]]) g.set(x, 4, z, LANTERN);
  for (const [x, z] of [[c, 3], [c, 21], [2, 20], [6, 20]]) g.set(x, 6, z, LANTERN);
  return { grid: g };
}

/** A fishing boat: 3 x 8, a short mast with its sail furled, nets and baskets, a lamp. water_line 1. */
export function fishingBoat(K) {
  const S = K.ship, w = K.timber.wood, g = new Grid([3, 8, 8]), cloth = S.sail(0, 0, 1, 1);
  for (let z = 0; z < 8; z++) {
    const end = z === 0 || z === 7;
    if (!end) g.set(1, 0, z, S.hull);
    for (let x = 0; x < 3; x++) { if (end && x !== 1) continue; g.set(x, 1, z, S.hull); }
    if (end) { g.set(1, 2, z, S.post); continue; }
    g.set(0, 2, z, slab(w)); g.set(2, 2, z, slab(w));
  }
  for (let y = 2; y <= 5; y++) g.set(1, y, 3, fence(w));
  g.set(1, 6, 3, cloth); g.set(1, 6, 4, cloth.replace("_wool", "_carpet"));
  g.set(1, 2, 5, BARREL); g.set(1, 2, 6, `${w}_trapdoor[facing=north,half=bottom,open=false,powered=false,waterlogged=false]`);
  g.set(1, 2, 1, LANTERN);
  return { grid: g };
}

/** A river barge: 4 x 11, flat and low, a load of hay and barrels under a cloth, a tiller, lamps on posts. water_line 1. */
export function barge(K) {
  const S = K.ship, w = K.timber.wood, W = 4, L = 11, g = new Grid([W, 6, L]);
  for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
    const rim = x === 0 || x === W - 1 || z === 0 || z === L - 1;
    g.set(x, 0, z, S.keel); g.set(x, 1, z, rim ? S.hull : S.keel);
    if (rim) g.set(x, 2, z, slab(w));
  }
  for (let z = 2; z <= 6; z++) { g.set(1, 2, z, z % 2 ? "hay_block[axis=z]" : BARREL); g.set(2, 2, z, z % 2 ? BARREL : "hay_block[axis=z]"); g.set(1, 3, z, "brown_carpet"); g.set(2, 3, z, "brown_carpet"); }
  g.set(1, 2, L - 2, fence(w)); g.set(1, 3, L - 2, LANTERN);
  g.set(2, 2, L - 1, `${w}_trapdoor[facing=north,half=bottom,open=true,powered=false,waterlogged=false]`);
  g.set(2, 2, 1, fence(w)); g.set(2, 3, 1, LANTERN);
  return { grid: g };
}

// ---- the set -------------------------------------------------------------------------------------------------------
export function harbourParts(kingdom = "lordaeron") {
  const K = HARBOUR[kingdom], out = [], dock = (id, r, meta) => out.push({ id, grid: r.grid, meta: { contract: "dock", water_line: 0, pilings: r.pilings || [], ...meta } });
  const S = K.stone, T = K.timber;
  for (const v of ["a", "b", "c"]) dock(`quay_stone_1${v}`, quay(K, S, { seed: v.charCodeAt(0) * 7 }), { deck: 2, width: 1, depth: 3, use: ["sea", "river"], tags: ["quay"] });
  dock("quay_stone_bollard_1", quay(K, S, { seed: 11, bollard: true }), { deck: 2, width: 1, depth: 3, use: ["sea", "river"], tags: ["quay", "bollard"] });
  dock("quay_stone_lamp_1", quay(K, S, { seed: 13, lamp: true }), { deck: 2, width: 1, depth: 3, use: ["sea", "river"], tags: ["quay", "lamp"] });
  dock("quay_stone_ladder_1", quay(K, S, { seed: 17, ladder: true }), { deck: 2, width: 1, depth: 3, use: ["sea", "river"], tags: ["quay", "ladder"] });
  dock("quay_stone_steps_1", quay(K, S, { seed: 19, steps: true }), { deck: 2, width: 1, depth: 3, use: ["sea", "river"], tags: ["quay", "steps"] });
  dock("quay_stone_crane_1", quay(K, S, { seed: 23, crane: true }), { deck: 2, width: 1, depth: 3, use: ["sea"], tags: ["quay", "crane", "lamp"] });
  for (const v of ["a", "b"]) dock(`quay_timber_1${v}`, quay(K, T, { seed: v.charCodeAt(0) * 5 }), { deck: 2, width: 1, depth: 3, use: ["river"], tags: ["quay", "timber"] });
  dock("quay_timber_lamp_1", quay(K, T, { seed: 29, lamp: true }), { deck: 2, width: 1, depth: 3, use: ["river"], tags: ["quay", "timber", "lamp"] });
  dock("quay_timber_ladder_1", quay(K, T, { seed: 31, ladder: true }), { deck: 2, width: 1, depth: 3, use: ["river"], tags: ["quay", "timber", "ladder"] });
  dock("quay_timber_crane_1", quay(K, T, { seed: 37, crane: true }), { deck: 2, width: 1, depth: 3, use: ["river"], tags: ["quay", "timber", "crane", "lamp"] });
  dock("jetty_timber_3x4", jettySegment(K), { deck: 1, width: 3, depth: 4, use: ["river", "sea"], tags: ["pier", "timber", "lamp"], repeat: "along +z from the quay's edge" });
  dock("jetty_head_timber_5x5", jettyHead(K), { deck: 1, width: 5, depth: 5, use: ["river", "sea"], tags: ["pier", "head", "timber", "lamp"] });
  for (const v of ["a", "b"]) dock(`mole_7x4${v}`, moleSegment(K, v.charCodeAt(0)), { deck: 3, width: 7, depth: 4, use: ["sea"], tags: ["mole"], repeat: "along +z out from the shore; the sea on its east side" });
  dock("mole_head_lighthouse_9x9", lighthouse(K), { deck: 3, width: 9, depth: 9, use: ["sea"], tags: ["mole", "head", "lighthouse", "lamp"] });
  const boat = (id, r, meta) => out.push({ id, grid: r.grid, meta: { contract: "boat", water_line: 1, ...meta } });
  boat("boat_trader_9x25", trader(K), { width: 9, depth: 25, use: ["sea"], tags: ["boat", "trader"], moor: "alongside a quay or pier, its side 1 off the edge, bow toward the open water" });
  boat("boat_fishing_3x8", fishingBoat(K), { width: 3, depth: 8, use: ["sea", "river"], tags: ["boat", "fishing"], moor: "beside a jetty or quay ladder" });
  boat("boat_barge_4x11", barge(K), { width: 4, depth: 11, use: ["river"], tags: ["boat", "barge"], moor: "alongside a timber quay or wharf, under its crane" });
  return out;
}

export function harbourBuildings(kingdom = "lordaeron") {
  const K = HARBOUR[kingdom], dal = kingdom === "dalaran";
  return [
    { id: dal ? "customs_house_13x7" : "customs_house_13x10", ...customsHouse(K), pal: K.pal?.customs, meta: { slot: "harbour:customs_house", use: ["sea"], storeys: 2, faces: "the quay (front, south)", note: "the arcade on the quay where cargo is inspected and weighed, the collector's office above, the harbour flag" } },
    { id: "warehouse_13x7", ...warehouse(K), pal: K.pal?.warehouse, meta: { slot: "harbour:warehouse", use: ["sea"], storeys: 2, faces: "the quay (front, south)", note: "open loading bays to the quay, stock inside, a hoist from the east gable" } },
    { id: "warehouse_10x7", ...warehouse(K, { W: 10, storeys: 1 }), pal: K.pal?.river_warehouse, meta: { slot: "harbour:warehouse", use: ["river"], storeys: 1, faces: "the wharf (front, south)", note: "the river's store: loading bays to the wharf, a hoist from the east gable" } },
    { id: "fish_market_10x7", ...fishMarket(K), pal: K.pal?.fish, meta: { slot: "harbour:fish_market", use: ["sea", "river"], storeys: 1, faces: "the quay (front, south)", note: "open arcades to the quay, tables of fish on ice, barrels, drying kelp" } },
    { id: "river_customs_7x5", ...riverCustoms(K), pal: null, meta: { slot: "harbour:river_customs", use: ["river"], storeys: 1, faces: "the water (east)", note: "a booth at a river landing or a bridge's head: a counter window to the water, a chain boom along the edge" } },
  ];
}
