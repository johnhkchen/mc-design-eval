import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise commercial block, c. 1980s Xinyi: two storeys over a plinth,
// smooth quartz-tile facade, grey storey bands, aluminium-look glazing,
// a glazed entrance, and a rooftop water tank.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542681363.cells.json", "utf8"));
const W = 20, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(x + "," + z, gr);
const inF = (x, z) => G.has(x + "," + z);
const maxG = Math.max(...cells.map((c) => c[2]));
// Roof about 11 blocks above the lowest ground; flat and level across any slope.
const R = Math.min(19, Math.max(11, maxG + 6));

const pane = (x, y, z, alongX) =>
  g.set(x, y, z, "light_blue_stained_glass_pane",
    alongX
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const isPerim = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

for (const [x, z, gr] of cells) {
  const g0 = gr;
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  const n = !inF(x, z - 1), s = !inF(x, z + 1), w = !inF(x - 1, z), e = !inF(x + 1, z);
  const nf = [n, s, w, e].filter(Boolean).length;

  if (nf === 0) {
    // Interior: floor slabs per storey and the roof deck, air between.
    for (const y of [5, R - 1]) if (y >= g0) g.set(x, y, z, "smooth_stone");
    continue;
  }

  const alongX = n || s;
  const along = alongX ? x : z;
  const inward = n ? [0, 1] : s ? [0, -1] : w ? [1, 0] : [-1, 0];
  const corner = nf >= 2;
  const pillar = !corner && along % 4 === 0;
  const win = !corner && !pillar;

  for (let y = g0; y < R; y++) {
    let id = "smooth_quartz", pr;
    let glass = false;
    if (y === g0) id = "polished_andesite";                     // base course
    else if (y === R - 1) id = "light_gray_concrete";           // cornice band
    else if (y === 5) id = "light_gray_concrete";               // storey line
    else if (win && y > g0 && y <= 3) glass = true;             // shopfront glazing
    else if (win && y === 4) id = "white_concrete";             // ground lintel
    else if (win && y >= 6 && y <= 8) glass = true;             // upper glazing
    else if (win && y === 9) id = "white_concrete";             // upper lintel
    if (glass) {
      pane(x, y, z, alongX);
      // Warm light behind a few panes.
      if ((y === 7 && along % 8 === 2) || (y === 2 && along % 8 === 6)) {
        const ix = x + inward[0], iz = z + inward[1];
        if (inF(ix, iz)) g.set(ix, y, iz, "glowstone");
      }
    } else {
      g.set(x, y, z, id, pr);
    }
  }
  // Parapet cap.
  g.set(x, R, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
}

// Interior floor slabs and roof deck for non-perimeter cells (already partly done above);
// ensure roof deck exists over every footprint cell's interior.
for (const [x, z, gr] of cells) {
  if (isPerim(x, z)) continue;
  for (const y of [5, R - 1]) if (y >= gr) g.set(x, y, z, "smooth_stone");
}

// Glazed entrance on the south (z max) face, door at x=9.
for (const x of [8, 9, 10]) {
  if (!inF(x, 14)) continue;
  const g0 = G.get(x + ",14");
  if (x === 9) {
    g.set(x, g0 + 1, 14, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, g0 + 2, 14, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, g0 + 3, 14, "white_concrete");
  } else {
    for (let y = g0 + 1; y <= g0 + 3; y++) pane(x, y, 14, true);
  }
}

// Rooftop water tank on interior cells above the roof deck.
for (let x = 8; x <= 11; x++) {
  for (let z = 5; z <= 8; z++) {
    if (!inF(x, z) || isPerim(x, z)) continue;
    for (let y = R; y <= R + 2; y++) g.set(x, y, z, "light_gray_concrete");
    g.set(x, R + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542681363.nbt");
