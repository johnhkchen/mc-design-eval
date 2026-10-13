// Part 5, Shopfronts (six Folio businesses, both faces): fascia names, piers with log-end panels, awnings in each
// business's wood, and hanging signs on the piers (plan FACADES, item 4 of the parts). Every helper writes only into air,
// so the socket boxes, wall lines and clear zones stay untouched. North = z 5 (fascia), south = z 32 (mirror of 5).
import { pierPanel, mirrorZ } from "../vocab.mjs";
import { plaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// the palette lists four standing banners (white, black, brown, orange) and wall hanging signs, not the wall banners or every
// dye the vocabulary writes: a wall banner becomes the standing banner of its dye, turned to face the same way (standing
// rotation 0 faces south, 4 west, 8 north, 12 east), a banner in a dye off the list takes the nearest listed one, and a
// wall sign becomes the hanging sign of its wood
const BANNER_DYE = { light_gray: "white", red: "brown", gray: "black" };
const STANDING_ROTATION = { south: "0", west: "4", north: "8", east: "12" };

const withNbt = (nbt, key, value) => nbt && { ...nbt, value: { ...nbt.value, [key]: value } };

// the block a vocabulary write lands as, and its block entity (sign text, banner patterns) to match
function paletteBlock(block, state, nbt) {
  const sign = /^((?:minecraft:)?)(\w+)_wall_sign$/.exec(block);
  if (sign) return { block: `${sign[1]}${sign[2]}_wall_hanging_sign`, state, nbt: withNbt(nbt, "id", { type: "string", value: "minecraft:hanging_sign" }) };
  const banner = /^((?:minecraft:)?)(\w+)_wall_banner$/.exec(block);
  if (!banner) return { block, state, nbt };
  const old = banner[2], dye = BANNER_DYE[old] ?? old, pats = nbt?.value?.patterns;
  const standing = { rotation: STANDING_ROTATION[state.facing] };
  if (dye === old) return { block: `${banner[1]}${dye}_banner`, state: standing, nbt };
  const contrast = dye === "white" ? "black" : "white";
  // the cloth's own colour (the border) moves to the new cloth; a letter that now shares the cloth's dye would vanish, so it takes the contrast
  const fixed = (pats?.value?.value ?? []).map((p) => {
    if (p.color.value === old) return { ...p, color: { type: "string", value: dye } };
    if (p.color.value === dye) return { ...p, color: { type: "string", value: contrast } };
    return p;
  });
  return { block: `${banner[1]}${dye}_banner`, state: standing, nbt: pats ? withNbt(nbt, "patterns", { ...pats, value: { ...pats.value, value: fixed } }) : nbt };
}

// the grid as the street sees it: every write goes through paletteBlock first
function paletteView(g) {
  const view = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, block, state, nbt) => { const s = paletteBlock(block, state, nbt); target.set(x, y, z, s.block, s.state, s.nbt); return view; };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return view;
}

// one business per frontage: [name on the fascia, wood, x0, x1]
const NORTH = [
  ["BIRCH", "birch", 10, 16],
  ["SPRUCE", "spruce", 18, 24],
  ["OAK", "oak", 26, 32],
];
const SOUTH = [
  ["JUNGLE", "jungle", 10, 16],
  ["ACACIA", "acacia", 18, 24],
  ["DK OAK", "dark_oak", 26, 32],
];

// piers on the wall lines, with the business whose panel and sign hang on each (plan FACADES: hanging signs)
const NORTH_PIERS = [[9, "birch"], [17, "spruce"], [25, "oak"], [33, "oak"]];
const SOUTH_PIERS = [[9, "jungle"], [17, "jungle"], [25, "acacia"], [33, "dark_oak"]];
// hanging signs: [pier x, wood], one per business, on the pier next to its shop
const NORTH_SIGNS = [[9, "birch"], [17, "spruce"], [25, "oak"]];
const SOUTH_SIGNS = [[17, "jungle"], [25, "acacia"], [33, "dark_oak"]];

// the sign: a blade on a fence arm out from the pier over the pavement (arm y 11, z 3..1 north), 3 deep and 2 high (y 9..10),
// off the name board's letters. Its street end shows the wood's log end over its leaves, its sides the log's rings over leaves
function hangingSign(g, face, x, wood) {
  const Z = face === "north" ? (z) => z : mirrorZ;
  const [toWall, toStreet] = face === "north" ? ["south", "north"] : ["north", "south"];
  const state = { east: "false", west: "false", north: "false", south: "false", waterlogged: "false" };
  for (const z of [3, 2, 1]) g.set(x, 11, Z(z), "dark_oak_fence", { ...state, [toWall]: "true", [toStreet]: z > 1 ? "true" : "false" });
  g.set(x, 10, Z(1), `${wood}_log`, { axis: "z" });
  g.set(x, 9, Z(1), `${wood}_leaves`, { persistent: "true" });
  g.set(x, 10, Z(2), `${wood}_log`, { axis: "x" });
  g.set(x, 9, Z(2), `${wood}_leaves`, { persistent: "true" });
  g.set(x, 10, Z(3), `${wood}_planks`);
  g.set(x, 9, Z(3), `${wood}_planks`);
}

// the name board: the three fascia rows are a dark oak board (so the names read light on dark from across the street) with a
// course of the shop's own planks along the top; the name is one white banner letter per character on the middle of it,
// full width; a drip lip of the wood's stairs runs along the head of the board, where the awning used to hide the names
function nameBoard(g, name, wood, x0, x1, face) {
  const z = face === "south" ? 32 : 5, out = face === "south" ? 1 : -1;
  for (let x = x0; x <= x1; x++) {
    g.set(x, 9, z, "dark_oak_planks"); g.set(x, 10, z, "dark_oak_planks");
    g.set(x, 9, z + out, "dark_oak_planks"); // the ledge the standing banner letters stand on (y 9, clear of the counters' zone)
    g.set(x, 11, z, x === x0 || x === x1 ? "dark_oak_planks" : `${wood}_planks`);
    if (g.isAir(x, 11, z + out)) g.set(x, 11, z + out, `${wood}_stairs`, { facing: face === "south" ? "north" : "south", half: "top", shape: "straight" });
  }
  const width = x1 - x0 + 1, at = [face === "north" ? x1 : x0, 9, z];
  plaque(g, name === "OAK" ? "O A K" : name, { at, face, width, height: 2, material: null, style: "banner", frame: null, letter: "white_concrete", wall: "dark_oak_planks" });
}

function street(g, face, shops, piers, signs) {
  const out = { placed: 0, skipped: 0 };
  for (const [name, wood, x0, x1] of shops) nameBoard(g, name, wood, x0, x1, face);
  // piers with the log-end product panels
  for (const [x, wood] of piers) pierPanel(g, x, face, wood);
  // hanging signs on the piers, from the jetty brackets
  for (const [x, wood] of signs) hangingSign(g, face, x, wood);
  return out;
}

export function build(g) {
  const p = paletteView(g);
  const north = street(p, "north", NORTH, NORTH_PIERS, NORTH_SIGNS);
  const south = street(p, "south", SOUTH, SOUTH_PIERS, SOUTH_SIGNS);
  return { placed: north.placed + south.placed, skipped: north.skipped + south.skipped };
}
