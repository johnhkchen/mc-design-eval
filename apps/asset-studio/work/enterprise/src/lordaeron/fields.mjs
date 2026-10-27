// Field plots: 9 x 9 tiles with one water source in the middle (it hydrates every cell: the game's reach is 4), and
// edge strips (9 x 1) that run between them. Layers 0-1 ground, 2 the field's surface (farmland, grass, water), 3+
// crops and features. Each tile mixes its crops at several growth stages so a field never reads as one flat colour.
// Authored with the headland (the edge a path runs along) to the south.
import { Grid } from "../grid.mjs";

const hash = (...n) => {
  let h = 2166136261; for (const v of n) { h ^= v + 0x9e3779b9; h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return ((h >>> 0) % 1000) / 1000;
};
const N = 9, MID = 4;
const GRASS = "grass_block[snowy=false]", FARM = "farmland[moisture=7]";
// a crop at a ripeness drawn from the field's seed: mostly near ripe, a few rows behind
const age = (max, seed, x, z) => Math.min(max, Math.floor(max * (0.55 + 0.6 * hash(seed, x, z))));
const CROP = {
  wheat: (s, x, z) => `wheat[age=${age(7, s, x, z)}]`, carrots: (s, x, z) => `carrots[age=${age(7, s, x, z)}]`,
  potatoes: (s, x, z) => `potatoes[age=${age(7, s, x, z)}]`, beetroots: (s, x, z) => `beetroots[age=${age(3, s, x, z)}]`,
};
const LEAVES = (t = "oak") => `${t}_leaves[distance=1,persistent=true,waterlogged=false]`;

function base(surface = GRASS) {
  const g = new Grid([N, 8, N]);
  for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, surface); }
  return g;
}
// the middle's water, under a lily pad so it reads as a dipping hole, not a hole in the field
const well = (g, pad = true) => { g.set(MID, 2, MID, "water"); if (pad) g.set(MID, 3, MID, "lily_pad"); };
const crops = (g, seed, pick) => {
  for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
    if (x === MID && z === MID) continue;
    const c = pick(x, z); if (!c) continue;
    g.set(x, 2, z, FARM); g.set(x, 3, z, CROP[c](seed, x, z));
  }
};
function scarecrow(g, x, z) {
  g.set(x, 3, z, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]");
  g.set(x, 4, z, "hay_block[axis=y]");
  g.set(x - 1, 4, z, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]");
  g.set(x + 1, 4, z, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]");
  g.set(x, 5, z, "carved_pumpkin[facing=south]");
}
function haystack(g, x, z) {
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(x + dx, 3, z + dz, "hay_block[axis=y]");
  g.set(x, 4, z, "hay_block[axis=y]"); g.set(x + 1, 4, z, "hay_block[axis=x]"); g.set(x, 4, z + 1, "hay_block[axis=z]");
  g.set(x + 1, 4, z + 1, "oak_slab[type=bottom,waterlogged=false]");
}
function tree(g, x, z, wood = "oak", h = 3) {
  for (let y = 3; y < 3 + h; y++) g.set(x, y, z, `${wood}_log[axis=y]`);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const y of [2 + h, 3 + h]) {
    if (y === 3 + h && Math.abs(dx) + Math.abs(dz) === 2) continue;
    if (!(dx === 0 && dz === 0 && y === 2 + h)) g.set(x + dx, y, z + dz, LEAVES(wood));
  }
}

// a field of one main crop (the town decides one crop per field; its cells are what the census counts), in a style
const MAIN = {
  wheat: (s, x, z) => `wheat[age=${age(7, s, x, z)}]`, carrots: CROP.carrots, potatoes: CROP.potatoes, beetroots: CROP.beetroots,
};
function cropField(main, style, s) {
  const g = base(); well(g);
  const skip = (x, z) => (style === "border" && z === 0) || (style === "scarecrow" && x <= 2 && z <= 2) || (style === "garden" && z % 3 === 2);
  for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
    if (x === MID && z === MID) continue;
    if (skip(x, z)) continue;
    g.set(x, 2, z, FARM); g.set(x, 3, z, MAIN[main](s, x, z));
  }
  if (style === "border") for (let x = 0; x < N; x++) { if (hash(s, x) < 0.7) { g.set(x, 3, 0, "sunflower[half=lower]"); g.set(x, 4, 0, "sunflower[half=upper]"); } else g.set(x, 3, 0, hash(s, x, 1) < 0.5 ? "cornflower" : "poppy"); }
  if (style === "scarecrow") { scarecrow(g, 1, 1); g.set(0, 3, 0, "hay_block[axis=y]"); g.set(2, 3, 2, "oxeye_daisy"); }
  if (style === "garden") for (let x = 0; x < N; x++) { g.set(x, 2, 2, "dirt_path"); g.set(x, 2, 8, x % 2 ? "dirt_path" : "coarse_dirt");
    g.set(x, 2, 5, x % 2 ? "dirt_path" : FARM); if (!(x % 2)) { g.set(x, 3, 5, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); g.set(x, 4, 5, LEAVES("azalea")); } }
  return g;
}
// sugar cane: water channels on rows 1, 4 and 7, the cane on every other row (each cell beside a channel)
function caneField(style, s) {
  const g = base();
  for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
    if (z % 3 === 1) { g.set(x, 2, z, "water"); g.set(x, 1, z, "clay"); if (style === "reeds" && hash(s, x, z) < 0.2) g.set(x, 3, z, "lily_pad"); continue; }
    g.set(x, 2, z, hash(s, x, z, 1) < 0.5 ? "sand" : GRASS);
    const h = style === "reeds" ? 1 + Math.floor(hash(s, x, z, 2) * 3) : 2 + (hash(s, x, z, 3) < 0.3 ? 1 : 0);
    for (let y = 3; y < 3 + h; y++) g.set(x, y, z, "sugar_cane[age=0]");
  }
  return g;
}
// sweet berries: rows of bushes on grass, a walk between every pair of rows (the thorns: villagers keep to the walks)
function berryField(style, s) {
  const g = base(); well(g);
  for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
    if (x === MID && z === MID) continue;
    if (z % 3 === 2) { g.set(x, 2, z, "dirt_path"); continue; }
    if (style === "hedged" && (x === 0 || x === 8)) { g.set(x, 3, z, LEAVES()); continue; }
    g.set(x, 3, z, `sweet_berry_bush[age=${2 + Math.floor(hash(s, x, z) * 2)}]`);
  }
  return g;
}
// the tiles: id, crop (null: not a crop field), tags, build(seed)
const TILES = [
  ["field_wheat_border", "wheat", ["crop", "sunflowers"], (s) => cropField("wheat", "border", s)],
  ["field_wheat_scarecrow", "wheat", ["crop", "scarecrow"], (s) => cropField("wheat", "scarecrow", s)],
  ["field_carrots", "carrot", ["crop"], (s) => cropField("carrots", "plain", s)],
  ["field_carrots_garden", "carrot", ["crop", "garden"], (s) => cropField("carrots", "garden", s)],
  ["field_potatoes", "potato", ["crop", "scarecrow"], (s) => cropField("potatoes", "scarecrow", s)],
  ["field_potatoes_garden", "potato", ["crop", "garden"], (s) => cropField("potatoes", "garden", s)],
  ["field_beetroots", "beetroot", ["crop", "sunflowers"], (s) => cropField("beetroots", "border", s)],
  ["field_beetroots_garden", "beetroot", ["crop", "garden"], (s) => cropField("beetroots", "garden", s)],
  ["field_cane", "sugar_cane", ["crop", "channels"], (s) => caneField("rows", s)],
  ["field_cane_reeds", "sugar_cane", ["crop", "channels"], (s) => caneField("reeds", s)],
  ["field_berries", "sweet_berries", ["crop"], (s) => berryField("rows", s)],
  ["field_berries_hedged", "sweet_berries", ["crop", "hedge"], (s) => berryField("hedged", s)],
  ["garden_pumpkins", null, ["garden", "decor", "pumpkin", "melon"], (s) => {
    const g = base("coarse_dirt"); well(g);
    for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
      if (x === MID && z === MID) continue;
      const fruit = x < MID ? "pumpkin" : "melon", r = z % 3;
      if (r === 0) { if (hash(s, x, z) < 0.55) g.set(x, 3, z, fruit); g.set(x, 2, z, hash(s, x, z, 2) < 0.4 ? GRASS : "coarse_dirt"); }
      else if (r === 1) { g.set(x, 2, z, FARM); g.set(x, 3, z, g.get(x, 3, z - 1) ? `attached_${fruit}_stem[facing=north]` : `${fruit}_stem[age=${age(7, s, x, z)}]`); }
      else { g.set(x, 2, z, FARM); g.set(x, 3, z, `${fruit}_stem[age=${age(7, s, x, z)}]`); }
    }
    return g;
  }],
  ["field_fallow", null, ["fallow", "hay"], (s) => {
    const g = base(); well(g);
    for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
      if (x === MID && z === MID) continue;
      const r = hash(s, x, z);
      if (r < 0.12) g.set(x, 2, z, "coarse_dirt"); else if (r < 0.5) g.set(x, 3, z, "short_grass"); else if (r < 0.58) g.set(x, 3, z, r < 0.54 ? "dandelion" : "white_tulip");
    }
    haystack(g, 1, 1); scarecrow(g, 6, 6);
    return g;
  }],
  ["field_orchard", null, ["orchard", "bees"], (s) => {
    const g = base(); well(g);
    for (const [x, z] of [[1, 1], [4, 1], [7, 1], [1, 7], [4, 7], [7, 7]]) tree(g, x, z, hash(s, x, z) < 0.7 ? "oak" : "birch", 3);
    g.set(2, 3, 2, "enterprise:decor_beehive[facing=south]"); g.set(5, 3, 6, "enterprise:decor_beehive[facing=north]");
    for (let x = 0; x < N; x++) for (let z = 2; z <= 6; z++) if (!(x === MID && z === MID) && !g.get(x, 3, z) && hash(s, x, z, 5) < 0.4) g.set(x, 3, z, hash(s, x, z, 6) < 0.8 ? "short_grass" : "oxeye_daisy");
    return g;
  }],
  ["field_meadow", null, ["meadow", "pond"], (s) => {
    // a water meadow: a pond with reeds, lily pads, long grass and flowers round it
    const g = base();
    for (let x = 2; x <= 6; x++) for (let z = 2; z <= 6; z++) {
      const d = Math.abs(x - MID) + Math.abs(z - MID);
      if (d <= 2 || (d === 3 && hash(s, x, z) < 0.5)) { g.set(x, 2, z, "water"); g.set(x, 1, z, d <= 1 ? "water" : "clay"); if (hash(s, x, z, 1) < 0.25) g.set(x, 3, z, "lily_pad"); }
    }
    for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
      if (g.get(x, 2, z) === "minecraft:water") continue;
      const wet = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.get(x + dx, 2, z + dz) === "minecraft:water");
      const r = hash(s, x, z, 2);
      if (wet && r < 0.35) { g.set(x, 3, z, "sugar_cane[age=0]"); g.set(x, 4, z, "sugar_cane[age=0]"); }
      else if (r < 0.45) g.set(x, 3, z, "short_grass");
      else if (r < 0.55) { g.set(x, 3, z, "tall_grass[half=lower]"); g.set(x, 4, z, "tall_grass[half=upper]"); }
      else if (r < 0.62) g.set(x, 3, z, ["azure_bluet", "oxeye_daisy", "cornflower", "allium"][Math.floor(r * 40) % 4]);
    }
    return g;
  }],
];

// edges: 9 long, 1 deep, laid between fields or along a headland; [id, socket, build(seed)]
const wall = (e, w, up) => `cobblestone_wall[east=${e ? "low" : "none"},north=none,south=none,up=${up},waterlogged=false,west=${w ? "low" : "none"}]`;
const EDGES = [
  ["edge_hedgerow", "hedge", (s) => {
    const g = new Grid([N, 8, 1]);
    for (let x = 0; x < N; x++) { g.set(x, 0, 0, "dirt"); g.set(x, 1, 0, "dirt"); g.set(x, 2, 0, GRASS); g.set(x, 3, 0, LEAVES(hash(s, x) < 0.8 ? "oak" : "birch")); if (hash(s, x, 1) < 0.4) g.set(x, 4, 0, LEAVES()); }
    tree(g, 4, 0, "oak", 4);            // a hedgerow tree in the middle
    for (const [x, y, z] of g.each()) if (z !== 0) g.set(x, y, z, null);
    return g;
  }],
  ["edge_drystone", "wall", (s) => {
    const g = new Grid([N, 8, 1]);
    for (let x = 0; x < N; x++) {
      g.set(x, 0, 0, "dirt"); g.set(x, 1, 0, "dirt"); g.set(x, 2, 0, hash(s, x) < 0.6 ? "cobblestone" : "mossy_cobblestone");
      g.set(x, 3, 0, hash(s, x, 1) < 0.7 ? wall(true, true, false) : wall(true, true, false).replace("cobblestone_wall", "mossy_cobblestone_wall"));
    }
    return g;
  }],
  ["edge_rail", "fence", (s) => {
    const g = new Grid([N, 8, 1]);
    for (let x = 0; x < N; x++) {
      g.set(x, 0, 0, "dirt"); g.set(x, 1, 0, "dirt"); g.set(x, 2, 0, GRASS);
      g.set(x, 3, 0, `spruce_fence[east=true,north=false,south=false,waterlogged=false,west=true]`);
    }
    return g;
  }],
  ["edge_gate", "*", (s) => {
    // a field gate on a headland path, with a gate post lamp
    const g = new Grid([N, 8, 1]);
    for (let x = 0; x < N; x++) { g.set(x, 0, 0, "dirt"); g.set(x, 1, 0, "dirt"); g.set(x, 2, 0, x >= 3 && x <= 5 ? "dirt_path" : GRASS); }
    for (let x = 0; x < N; x++) if (x < 3 || x > 5) g.set(x, 3, 0, `spruce_fence[east=true,north=false,south=false,waterlogged=false,west=true]`);
    g.set(3, 3, 0, "spruce_fence_gate[facing=south,in_wall=false,open=false,powered=false]"); g.set(4, 3, 0, "spruce_fence_gate[facing=south,in_wall=false,open=false,powered=false]");
    g.set(5, 3, 0, "spruce_fence_gate[facing=south,in_wall=false,open=false,powered=false]");
    g.set(2, 4, 0, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); g.set(2, 5, 0, "lantern[hanging=false,waterlogged=false]");
    return g;
  }],
];

// 1-wide edges and corner posts, so a pasture of any size closes: straights run east-west (rotate for north-south),
// a corner is drawn for runs leaving east and south (a pasture's north-west corner; rotate for the others)
const ONE = {
  hedgerow: (s) => [GRASS, LEAVES(hash(s) < 0.85 ? "oak" : "birch"), hash(s, 1) < 0.4 ? LEAVES() : null],
  drystone: (s) => [hash(s) < 0.6 ? "cobblestone" : "mossy_cobblestone", wall(true, true, false), null],
  rail: (s) => [GRASS, "spruce_fence[east=true,north=false,south=false,waterlogged=false,west=true]", null],
};
const CORNER = {
  hedgerow: () => [GRASS, LEAVES(), LEAVES()],
  drystone: () => ["mossy_cobblestone", "cobblestone_wall[east=low,north=none,south=low,up=true,waterlogged=false,west=none]", null],
  rail: () => [GRASS, "spruce_fence[east=true,north=false,south=true,waterlogged=false,west=false]", "lantern[hanging=false,waterlogged=false]"],
};
const cell = ([ground, a, b]) => { const g = new Grid([1, 8, 1]); g.set(0, 0, 0, "dirt"); g.set(0, 1, 0, "dirt"); g.set(0, 2, 0, ground); if (a) g.set(0, 3, 0, a); if (b) g.set(0, 4, 0, b); return g; };

export function allFields() {
  const out = [];
  for (const [id, crop, tags, build] of TILES) for (const v of ["a", "b"]) {
    const grid = build(v.charCodeAt(0) * 101 + id.length);
    const CELL = { wheat: "wheat", carrot: "carrots", potato: "potatoes", beetroot: "beetroots", sugar_cane: "sugar_cane", sweet_berries: "sweet_berry_bush" };
    let plots = 0; if (crop) for (const [, y, , st] of grid.each()) if (y === 3 && st.replace("minecraft:", "").split("[")[0] === CELL[crop]) plots++;
    out.push({ id: `${id}_${v}`, grid, meta: { width: N, depth: N, kind_of: "field", crop, plots, tags, water: id.startsWith("field_cane") ? "channels on rows 1, 4, 7" : [MID, 2, MID] } });
  }
  for (const [id, socket, build] of EDGES) out.push({ id, grid: build(id.length * 7), meta: { width: N, depth: 1, kind_of: "edge", socket } });
  for (const k of Object.keys(ONE)) for (const v of ["a", "b", "c"]) out.push({ id: `edge_${k}_1${v}`, grid: cell(ONE[k](v.charCodeAt(0) * 7 + k.length)), meta: { width: 1, depth: 1, kind_of: "edge", socket: k === "hedgerow" ? "hedge" : k === "drystone" ? "wall" : "fence" } });
  for (const k of Object.keys(CORNER)) out.push({ id: `corner_${k}`, grid: cell(CORNER[k]()), meta: { width: 1, depth: 1, kind_of: "corner", socket: k === "hedgerow" ? "hedge" : k === "drystone" ? "wall" : "fence", runs: ["east", "south"] } });
  return out;
}
