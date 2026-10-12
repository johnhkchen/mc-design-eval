// PART 4: GARDEN FEATURES (rose arches, espaliered fruit trees, glasshouse, cold frame, tool shed, sundial, urn, lamp posts).
// Ticks elements.md: E15 (rose/bean arches), E16 (espaliers), E17 (greenhouse), E18 (cold frame), E19 (tool shed), E14b (sundial + urn), E8b (garden lamps).
// Import from ../vocab.mjs: roseArch, espalier, greenhouse, coldFrame, toolShed, sundial, urn, lamp, door, OPENINGS, GREENHOUSE, SHED, COLDFRAME, pot, B.
//
// BUILD (everything is inside the garden wall, x=21..37, z=5..31; potager part 3 already owns paths, walls, beds, well):
//  1. ROSE ARCHES over the E-W path: roseArch(g,{x:24,zA:14,zB:16}) and roseArch(g,{x:34,zA:14,zB:16}).
//  2. ESPALIERS (fruit trees trained against the wall, spine cell NEXT to the wall): west x=21 and east x=37 at z=8,12,19,23
//     (LEAF for z=8,19; BLOSSOM for z=12,23); north z=5 at x=24,34 (BLOSSOM).
//  3. GLASSHOUSE: greenhouse(g,GREENHOUSE) with its door (25,1..2,27); potting bench of spruce slabs at (23..26,1,30) with pots
//     and a lantern on it; composter (23,1,28); water cauldron (26,1,28).
//  4. COLD FRAME: coldFrame(g,COLDFRAME).
//  5. TOOL SHED: shed(g,SHED) (vocab toolShed with the fascia pinned to dark oak) with its door (32,1..2,29) facing west. The shed's interior is only x33..35, z29..30
//     (its walls own x32/36 and z28/31), so the interior fit is: crafting table, barrel, chest, grindstone, lantern, hay;
//     the composter stands just outside the east wall at (37,1,28).
//  6. SUNDIAL at (29,1,6) and URN at (29,1,25) on the axis.
//  7. LAMP POSTS (lamp(g,x,1,z,3)): plaza corners (27/31, 14/16), axis ends (28/30, 6) and (28/30, 24).
//  8. Flower edging along the north wall margin z=5 at y=1 (cornflower / poppy / allium), only into air cells.
import { greenhouse, coldFrame, sundial, urn, lamp, door, chest, barrel, lantern, isOpening, roof, GREENHOUSE, SHED, COLDFRAME, pot, B, LEAF, BLOSSOM } from "../vocab.mjs";

// Espalier: vocab's espalier also sets coarse_dirt under the spine at y=0. On the north wall that cell is the potager's gravel margin (locked), so those calls pass ground:false.
function espalier(g, { x, z, wall, y = 1, leaf = LEAF, ground = true }) {
  const a = wall === "west" || wall === "east" ? [0, 0, 1] : [1, 0, 0], axis = a[0] ? "x" : "z";
  const at = (o, yy) => [x + a[0] * o, y + yy, z + a[2] * o];
  if (ground) g.set(x, y - 1, z, "coarse_dirt");
  g.set(...at(0, 0), ...B.log("oak", "y")); g.set(...at(0, 1), ...B.log("oak", "y")); g.set(...at(0, 2), ...B.log("oak", "y"));
  for (const o of [-1, 1]) { g.set(...at(o, 1), leaf); g.set(...at(o, 2), ...B.log("oak", axis)); }
  for (const o of [-2, 2]) g.set(...at(o, 2), leaf);
  for (const o of [-2, -1, 0, 1, 2]) g.set(...at(o, 3), leaf);
}

// Rose arch: vocab's roseArch also sets coarse_dirt under the flanking bushes at y=0, but the potager's gravel path already owns those cells (locked), so this copy leaves the ground alone.
function roseArch(g, { x, zA, zB, y = 1 }) {
  for (const z of [zA, zB]) {
    for (let k = 0; k < 3; k++) g.set(x, y + k, z, ...B.fence("spruce"));
    for (const dx of [-1, 1]) {
      g.set(x + dx, y, z, "rose_bush", { half: "lower" }); g.set(x + dx, y + 1, z, "rose_bush", { half: "upper" });
      g.set(x + dx, y + 2, z, BLOSSOM);
    }
    g.set(x, y + 3, z, BLOSSOM);
  }
  for (let z = zA; z <= zB; z++) { g.set(x, y + 3, z, ...B.fence("spruce")); g.set(x, y + 4, z, BLOSSOM); }
}

// Tool shed: vocab's toolShed() lets roof() pick birch fascia (birch_trapdoor is off-palette), so this local copy pins the fascia to dark oak.
function shed(g, { x0, z0, x1, z1, y = 1 }) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!(x === x0 || x === x1 || z === z0 || z === z1)) continue;
    const post = (x === x0 || x === x1) && (z === z0 || z === z1);
    for (let k = 0; k <= 2; k++) { if (isOpening(x, y + k, z)) continue; if (post) g.set(x, y + k, z, ...B.log("spruce", "y")); else g.set(x, y + k, z, "spruce_planks"); }
  }
  roof(g, [[x0, z0, x1, z1]], "gable", { y: y + 3, material: "dark_oak", fascia: "spruce", overhang: 1 });
}

export function build(g) {
  // 1. rose arches over the E-W path
  roseArch(g, { x: 24, zA: 14, zB: 16 });
  roseArch(g, { x: 34, zA: 14, zB: 16 });

  // 2. espaliers on the three garden walls
  for (const z of [8, 19]) { espalier(g, { x: 21, z, wall: "west", leaf: LEAF }); espalier(g, { x: 37, z, wall: "east", leaf: LEAF }); }
  for (const z of [12, 23]) { espalier(g, { x: 21, z, wall: "west", leaf: BLOSSOM }); espalier(g, { x: 37, z, wall: "east", leaf: BLOSSOM }); }
  for (const x of [24, 34]) espalier(g, { x, z: 5, wall: "north", leaf: BLOSSOM, ground: false });

  // 3. glasshouse: frame, door, potting bench with pots and a lantern, composter and water cauldron inside
  greenhouse(g, GREENHOUSE);
  door(g, { x: 25, y: 1, z: 27, face: "north", mat: "oak" });
  for (let x = 23; x <= 26; x++) g.set(x, 1, 30, ...B.slab("spruce", "bottom"));
  pot(g, 23, 2, 30, "potted_fern");
  pot(g, 25, 2, 30, "potted_azalea_bush");
  pot(g, 26, 2, 30, "potted_red_tulip");
  lantern(g, 24, 2, 30);
  g.set(23, 1, 28, "composter", { level: "4" });
  g.set(26, 1, 28, "water_cauldron", { level: "3" });

  // 4. cold frame
  coldFrame(g, COLDFRAME);

  // 5. tool shed: door, then the interior fit (x33..35, z29..30)
  shed(g, SHED);
  door(g, { x: 32, y: 1, z: 29, face: "west", mat: "spruce" });
  g.set(33, 1, 30, "crafting_table");
  barrel(g, 34, 1, 30);
  chest(g, 35, 1, 30, "west");
  g.set(33, 1, 29, "grindstone", { face: "floor", facing: "north" });
  lantern(g, 34, 1, 29);
  g.set(35, 1, 29, "hay_block", { axis: "y" });
  g.set(37, 1, 28, "composter", { level: "4" });

  // 6. sundial and urn on the N-S axis
  sundial(g, { x: 29, z: 6 });
  urn(g, { x: 29, z: 25 });

  // 7. lamp posts: plaza corners, sundial and urn ends. The plaza corners are 2 high: the well roof's eave sits at y=4 over x=27/31, so a 3-high lantern would land in it.
  for (const [x, z] of [[27, 14], [27, 16], [31, 14], [31, 16]]) lamp(g, x, 1, z, 2);
  for (const [x, z] of [[28, 6], [30, 6], [28, 24], [30, 24]]) lamp(g, x, 1, z, 3);

  // 8. flower edging along the north wall margin (air cells only: the espaliers' leaves already stand at z=5)
  for (const x of [22, 23, 25, 26, 27, 31, 32, 33, 35, 36]) {
    if (!g.isAir(x, 1, 5)) continue;
    g.set(x, 1, 5, ["cornflower", "poppy", "allium"][x % 3]);
  }
}
