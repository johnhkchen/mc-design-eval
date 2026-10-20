// Part 5: Sanitary and Garden facade fittings. The striped canopies over the shops, the fascia signs, the SANITARY PUBLIC
// MARKET and GARDEN CENTER lettering, the lit upper windows, the Garden shopfronts, the fire escape, the window boxes,
// the Post Alley door and the hanging sign. Earlier parts (the shells, P3) own the walls and openings; everything here
// writes into the reserved edge bands, recesses and window cells the shell left open.
import { litWindow, signboard, bannerWord as wallBannerWord, shopFront, fireEscape, groundAt } from "../vocab.mjs";

// palette.json has standing banners only (no wall banners), so each letter's `<dye>_wall_banner` is written as the
// palette's `<dye>_banner` turned to the face: rotation 0 south, 4 west, 8 north, 12 east (the wall banner's facing).
// A standing banner needs a top face: where the cell under it is air (the edge band has no wall under the letters),
// a smooth_sandstone block is set there first.
const STANDING = { south: "0", west: "4", north: "8", east: "12" };
const paletteBanners = (g) => ({
  get: (x, y, z) => g.get(x, y, z),
  isAir: (x, y, z) => g.isAir(x, y, z),
  set: (x, y, z, block, state, nbt) => {
    if (!block.endsWith("_wall_banner")) return g.set(x, y, z, block, state, nbt);
    if (g.isAir(x, y - 1, z)) g.set(x, y - 1, z, "smooth_sandstone");
    return g.set(x, y, z, block.replace("_wall_banner", "_banner"), { rotation: STANDING[state.facing] }, nbt);
  },
});
const bannerWord = (g, word, o) => wallBannerWord(paletteBanners(g), word, o);

// Striped canopy in one column x: a top course at y over the dxs columns (outward first), a valance under the edge at y-1.
// Stripes change colour every column along z, alternating `colours` within each run [z0, z1].
function canopy(g, { x, z0, z1, y, dxs = [0], colours = ["red", "white"], valance = true }) {
  for (let z = z0; z <= z1; z++) {
    const wool = `${colours[(z - z0) % colours.length]}_wool`;
    for (const d of dxs) g.set(x + d, y, z, wool);
    if (valance) g.set(x, y - 1, z, wool);
  }
}

// Sanitary west face: each step's footprint edge x, the wall plane one in (edge+1), and its run of shops along z.
// S1 and S1b share the edge x128 (the entrance is 108..115, so the S1 canopy skips it).
const SAN_MASSES = [
  { edge: 132, plane: 133, z0: 68, z1: 79, colours: ["red", "white"] },   // S2
  { edge: 136, plane: 137, z0: 60, z1: 67, colours: ["green", "white"] }, // S3
  { edge: 144, plane: 145, z0: 52, z1: 59, colours: ["red", "white"] },   // S4
  { edge: 152, plane: 153, z0: 40, z1: 51, colours: ["green", "white"] }, // S5
  { edge: 156, plane: 157, z0: 8, z1: 39, colours: ["red", "white"] },    // S6 north block
];

export function build(g) {
  // ---- Sanitary: the canopies on the edge band (S1 two runs, skipping the entrance; S1b the south run) -----------------
  canopy(g, { x: 128, z0: 82, z1: 107, y: 9, colours: ["red", "white"] });
  canopy(g, { x: 128, z0: 116, z1: 141, y: 9, colours: ["green", "white"] });
  for (const m of SAN_MASSES) canopy(g, { x: m.edge, z0: m.z0, z1: m.z1, y: 9, colours: m.colours });

  // Shop fascia boards on the frieze, y 11, one per shop (signs stand in the edge band, on the wall at edge+1)
  // (no shop board inside z100..123, where the lettering hangs at y12 over these boards: CHEESE moved to 126)
  const shops = [[84, "PRODUCE"], [92, "FISH"], [100, "FLOWERS"], [126, "CHEESE"], [130, "BREAD"], [138, "CRAFTS"]];
  for (const [z, text] of shops) signboard(g, text, { at: [128, 11, z], face: "west", mode: "wall" });

  // SANITARY PUBLIC MARKET over the entrance, green letters on the frieze (y 12, edge band x128), 22 columns
  bannerWord(g, "SANITARY PUBLIC MARKET", { center: [128, 12, 111], face: "west", letter: "green", base: "white" });
  // the entrance sign parapet S7 (x129..130, z104..119, to y30): the second SANITARY at y 26
  bannerWord(g, "SANITARY", { center: [128, 26, 111], face: "west", letter: "green", base: "white" });

  // The entrance frame (smooth quartz jambs at z108/115, lintel at y10) is already built by the shell (P3), on the same cells.

  // Upper storey windows (y 16..18, 2 wide, 2 per 8-block bay at +1 and +5): lit, one lantern inside each
  const upper = [{ plane: 129, z0: 80, z1: 143 }, ...SAN_MASSES.map((m) => ({ plane: m.plane, z0: m.z0, z1: m.z1 }))];
  for (const m of upper) {
    for (let z = m.z0 + 1; z + 1 <= m.z1 - 1; z += 4) {
      litWindow(g, { at: [m.plane, 16, z], face: "west", w: 2, h: 3, lit: true });
    }
  }

  // ---- Garden Center: west shopfronts recessed to x214, the canopy over them, the name panel and the upper windows ----
  // shopfront A (z4..13, door z9) and shopfront B (z16..25, door z21); base planks y0+1, glass y0+2..5, fascia y0+7
  for (const z of [4, 16]) {
    shopFront(g, { at: [214, groundAt(214, z), z], face: "west", w: 10, door: true });
    // the lintel as a top slab: the fascia planks above it then stand on a full top face, not on a bottom slab's air
    for (let zz = z; zz < z + 10; zz++) g.set(214, groundAt(214, z) + 6, zz, "stone_brick_slab", { type: "top" });
  }
  // the green and white awning over each shopfront: its top course on the edge band x211 at y6 (x212 is the shell's wall), valance at y5
  canopy(g, { x: 211, z0: 4, z1: 13, y: 6, colours: ["green", "white"] });
  canopy(g, { x: 211, z0: 16, z1: 25, y: 6, colours: ["green", "white"] });
  // GARDEN CENTER in green banner letters on the cream panel (edge+1 is the wall at x212; letters stand in front)
  bannerWord(g, "GARDEN CENTER", { center: [211, 16, 14], face: "west", letter: "green", base: "white" });
  // a hanging sign on a fence arm between the two shopfronts, at z14 where no canopy runs
  signboard(g, "PLANTS", { at: [211, 5, 14], face: "west", mode: "hanging" });
  // upper windows y9..12, 2 wide, lit; a window box under each: a top slab on the wall line at y8 with a fern pot on it
  for (const z of [6, 13, 20]) {
    litWindow(g, { at: [212, 9, z], face: "west", w: 2, h: 4, lit: true });
    for (const zz of [z, z + 1]) {
      g.set(211, 8, zz, "spruce_slab", { type: "top" });
      g.set(211, 9, zz, "potted_fern");
    }
  }

  // Post Alley (north face, z2): fire escape across x211..222 z0..1, and the two lit windows behind its landings
  fireEscape(g, { x0: 211, x1: 222, z0: 0, z1: 1, landings: [8, 14], ladderTo: 3 });
  litWindow(g, { at: [214, 9, 2], face: "north", w: 2, h: 4, lit: true });
  litWindow(g, { at: [219, 9, 2], face: "north", w: 2, h: 4, lit: true });

  // The Post Alley door (x230, z2) is not placed here: the shell (P3) keeps bricks at (230,3,2), so the lower half is
  // refused, and a lone upper half would be a broken door. The shell must leave x230..231 y3..4 at z2 as air.
}
