// Part 4: Economy and Corner facade fittings. Glazing in the shell's openings, awnings over the Economy's street
// windows, the Corner's round arches and window rhythm, and the name panels (the atrium doorway is the shell's).
// Writes only into air (the shells leave their openings as air), so anything a shell already built is refused by runParts.
import { archOpening, litWindow, windowFrame, bannerWord } from "../vocab.mjs";

// bannerWord writes wall banners, which palette.json does not list. Its letters are wool of the same colour instead
// (the palette's awnings roles), so the words still read red on cream and white on red.
const WOOL_FOR_BANNER = { red_wall_banner: "red_wool", white_wall_banner: "white_wool" };
function woolLetters(g) {
  return {
    get: (x, y, z) => g.get(x, y, z),
    isAir: (x, y, z) => g.isAir(x, y, z),
    set: (x, y, z, block, state, nbt) => (WOOL_FOR_BANNER[block]
      ? g.set(x, y, z, WOOL_FOR_BANNER[block])
      : g.set(x, y, z, block, state, nbt)),
  };
}

// Economy: street-storey shop windows (3 wide, y19..23) on the three planes, 2-wide upper windows (y28..32) behind them.
const ECON_SHOP = [
  [55, 3], [55, 9], [55, 15], [55, 21], [55, 27], [52, 32], [49, 41],
];
const ECON_UPPER = [
  [55, 9], [55, 15], [55, 21], [55, 27], [52, 32], [49, 41],
];

function economyGlazing(g) {
  for (const [x, z] of ECON_SHOP) litWindow(g, { at: [x, 19, z], face: "east", w: 3, h: 5, lit: true });
  for (const [x, z] of ECON_UPPER) {
    windowFrame(g, { at: [x, 28, z], face: "east", w: 2, h: 5 });
    litWindow(g, { at: [x, 28, z], face: "east", w: 2, h: 5, lit: true });
  }
  // E2 tall arched window (z4..7, y28..34): glazed to the arch top
  litWindow(g, { at: [55, 28, 4], face: "east", w: 4, h: 6, lit: true });
}

// Striped awnings over each street-storey window run, at y24 in the footprint's edge cell (the projection band).
// stripedAwning steps its back course to edge+1, which is off the footprint, so this writes the one course in place:
// wool stripes at y24 and an open spruce trapdoor valance hanging under them at y23, in front of the shop glass.
function economyAwnings(g) {
  const runs = [[56, 3, 29], [53, 32, 34], [50, 41, 43]];
  for (const [x, z0, z1] of runs) {
    for (let z = z0; z <= z1; z++) {
      const wool = (z - z0) % 2 === 0 ? "red_wool" : "white_wool";
      g.set(x, 24, z, wool);
      g.set(x, 23, z, "spruce_trapdoor", { facing: "west", half: "top", open: "true" });
    }
  }
}

// E2 name block on the NE pavilion's east face (x56 letters in front of the x55 panel)
function economyName(g) {
  bannerWord(woolLetters(g), "ECONOMY", { center: [56, 40, 5], face: "east", letter: "red", base: "white" });
  bannerWord(woolLetters(g), "MARKET", { center: [56, 37, 5], face: "east", letter: "red", base: "white" });
}

// Corner: round arches (6 wide, springing y13, crown y15) on the west face (x78 / x72 / x66) and the south face
// (z94 at C3, z100 at C4). y0 = the first air row above each floor (C1 y7, C2 y5, C3/C4 y3).
const CORNER_WEST = [
  [78, 8, 35], [78, 8, 43], [78, 8, 51],   // C1
  [72, 6, 59], [72, 6, 67], [72, 6, 75],   // C2
  [66, 4, 83], [66, 4, 91],                // C3
];
const CORNER_SOUTH = [
  [71, 4, 94], [79, 4, 94],                // C3, Pike Street
  [91, 4, 100], [99, 4, 100],              // C4, Pike Street
];

// archOpening's box is over: true, so it would also write into the corner column the shell built (z53 on C1, z77 on
// C2, z94/z100 ends): a 6-wide bay at the corner runs into it. Those cells stay solid, so the arch opens 5 wide with
// the corner column as its jamb. Writes into air only; the shell's solid cells are left as built.
function intoAir(g) {
  return {
    inBounds: (x, y, z) => g.inBounds(x, y, z),
    isAir: (x, y, z) => g.isAir(x, y, z),
    set: (x, y, z, block, state, nbt) => (g.isAir(x, y, z) ? g.set(x, y, z, block, state, nbt) : undefined),
  };
}

function cornerArches(g) {
  for (const center of CORNER_WEST) archOpening(intoAir(g), { center, face: "west", spring: 13, crown: 15, keystone: "smooth_sandstone" });
  for (const center of CORNER_SOUTH) archOpening(intoAir(g), { center, face: "south", spring: 13, crown: 15, keystone: "smooth_sandstone" });
}

// Corner upper windows: two per arch bay (at bay start and +4), 2 wide, 5 high, on y18 and y26
function cornerWindows(g) {
  // west planes: C1 x78 (bays z32, z40, z48), C2 x72 (z56, z64, z72), C3 x66 (z80, z88)
  const planes = [
    { x: 78, bays: [32, 40, 48] },
    { x: 72, bays: [56, 64, 72] },
    { x: 66, bays: [80, 88] },
  ];
  for (const { x, bays } of planes) {
    for (const z0 of bays) for (const z of [z0, z0 + 4]) for (const y of [18, 26]) {
      windowFrame(g, { at: [x, y, z], face: "west", w: 2, h: 5 });
      litWindow(g, { at: [x, y, z], face: "west", w: 2, h: 5, lit: true });
    }
  }
  // south faces: C3 plane z94 (bays x68, x76), C4 plane z100 (bays x88, x96)
  const south = [
    { z: 94, bays: [68, 76] },
    { z: 100, bays: [88, 96] },
  ];
  for (const { z, bays } of south) for (const x0 of bays) for (const x of [x0, x0 + 4]) for (const y of [18, 26]) {
    windowFrame(g, { at: [x, y, z], face: "south", w: 2, h: 5 });
    litWindow(g, { at: [x, y, z], face: "south", w: 2, h: 5, lit: true });
  }
}

// CORNER MARKET raised panel on C2's west face (x71 letters, y33..36)
function cornerName(g) {
  bannerWord(woolLetters(g), "CORNER MARKET",{ center: [71, 34, 65], face: "west", letter: "white", base: "red" });
}

export function build(g) {
  economyGlazing(g);
  economyAwnings(g);
  economyName(g);
  cornerArches(g);
  cornerWindows(g);
  cornerName(g);
}
