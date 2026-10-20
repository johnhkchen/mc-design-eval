// Part "Hahn and Pike Street Commercial" (plots 4 and 5): brick shells on the stepped footprint, andesite and stone bases,
// shopfronts with awnings, the Hahn cornice and GREEN TORTOISE board, the Pike St neon band, terracotta L2, parapets, HVAC.
// Vocab helpers take plot-local coordinates; `shifted` maps them onto module space (x + plot offset) for each lot.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ringOf, groundAt, plinth, groundColumn, shopfront, awning, bayRhythm, cornice, bannerSign, doorPair,
  pilaster, deckAndParapet, hvacBox } from "../vocab.mjs";

const SITE = JSON.parse(readFileSync(fileURLToPath(new URL("../site.json", import.meta.url)), "utf8")).plots;
const FACE = { N: "north", S: "south", E: "east", W: "west" };
const STEP = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

// A view of the grid that takes plot-local x and adds the plot's offset.
function shifted(g, dx) {
  return {
    set: (x, y, z, ...a) => g.set(x + dx, y, z, ...a),
    get: (x, y, z) => g.get(x + dx, y, z),
    isAir: (x, y, z) => g.isAir(x + dx, y, z),
    blockAt: (x, y, z) => g.blockAt(x + dx, y, z),
    inBounds: (x, y, z) => g.inBounds(x + dx, y, z),
  };
}

// The lot: ring map, ring cells, and treads (runs of ring-1 cells on one straight face; runs of 4 or fewer are risers).
function lot(g, key, offset) {
  const P = SITE[key];
  const plot = { footprint: P.footprint, ground: P.ground.map((r) => r.map((v) => (v === "." || v == null ? null : Number(v)))) };
  const rings = ringOf(plot);
  const cells = [...rings].map(([k, v]) => {
    const [x, z] = k.split(",").map(Number);
    return { x, z, ring: v.ring, face: FACE[v.faceDir] ?? v.faceDir };
  });
  const G = (x, z) => groundAt(plot, x, z);
  const S = shifted(g, offset);
  const wall1 = cells.filter((c) => c.ring === 1);
  const treads = [];
  for (const face of ["north", "south", "east", "west"]) {
    const along = face === "north" || face === "south" ? "x" : "z";
    const fixed = along === "x" ? "z" : "x";
    const byLine = new Map();
    for (const c of wall1.filter((c) => c.face === face)) {
      const k = c[fixed];
      if (!byLine.has(k)) byLine.set(k, []);
      byLine.get(k).push(c);
    }
    for (const [line, arr] of byLine) {
      arr.sort((a, b) => a[along] - b[along]);
      let run = [];
      for (const c of arr) {
        const prev = run[run.length - 1];
        if (prev && c[along] !== prev[along] + 1) { treads.push(mk(run, face, fixed, line)); run = []; }
        run.push(c);
      }
      if (run.length) treads.push(mk(run, face, fixed, line));
    }
  }
  function mk(run, face, fixed, line) {
    const cs = run.map((c) => [c.x, c.z]);
    // cells and wall are the same ring-1 run: the h1 helpers read `wall`, the h2-h4 helpers read `cells`
    return { face, cells: cs, wall: cs, shop: cs.length >= 5, line };
  }
  // the wall cells of a tread sit at (x, z); its ring-0 cell is one step out
  const front = (face, x, z) => [x + STEP[face][0], z + STEP[face][1]];
  return { plot, rings, cells, G, S, treads, front, wall1 };
}

// The tread on `face` whose wall line is `wall` and whose run overlaps the x range [x0, x1] (the stepped mask cuts a wall into runs).
function findTread(L, face, wall, x0, x1) {
  return L.treads.find((t) => t.face === face && t.line === wall && t.cells[0][0] <= x1 && t.cells.at(-1)[0] >= x0);
}

// The sign letters: bannerSign hangs white_wall_banner in front of the board, and palette.json has no wall banner.
// Through this view each letter is written as white_wool instead (the palette's white, one full block in the same
// cell). Writing it at the set, not after, keeps the banner out of the part's off-palette report.
function woolLetters(S) {
  return { ...S, set: (x, y, z, block, state, nbt) => (/(^|:)white_wall_banner$/.test(block) ? S.set(x, y, z, "white_wool") : S.set(x, y, z, block, state, nbt)) };
}

// Solid cells of the shell: every ring-1 cell from its ground up to the body top.
function body(L, top, block) {
  let n = 0;
  for (const c of L.wall1) n += groundColumn(L.S, L.plot, { x: c.x, z: c.z, top, block });
  return n;
}

// Ring-2 floor slabs at each storey, inside the hollow body (only where the ground is below the floor).
function floors(L, ys, block) {
  for (const c of L.cells.filter((c) => c.ring >= 2)) for (const y of ys) {
    if (y >= L.G(c.x, c.z)) L.S.set(c.x, y, c.z, block);
  }
}

// Ring-0 plinth and the riser pilasters of the shop storey.
function risers(L, y0, y1, block) {
  for (const t of L.treads.filter((t) => !t.shop)) for (const [x, z] of t.cells) {
    const [fx, fz] = L.front(t.face, x, z);
    pilaster(L.S, [[fx, fz]], { y0, y1, block });
  }
}

function hahn(g) {
  const L = lot(g, "hahn", 265);
  const S = L.S;
  const ring0 = L.cells.filter((c) => c.ring === 0);
  plinth(S, { ring0: ring0.filter((c) => L.G(c.x, c.z) < 4).map((c) => [c.x, c.z, L.G(c.x, c.z)]) },
    { top: 4, block: "polished_andesite" });
  body(L, 19, "bricks");
  floors(L, [4, 10, 15], "spruce_planks");

  // L1 shops: glass y5..8 on every shop tread, andesite course at y9 (ring 0), pilasters on the risers
  for (const t of L.treads.filter((t) => t.shop)) {
    shopfront(S, t, { baseY: 4, h: 4, frame: "polished_andesite", pierEvery: 7, fascia: "polished_andesite", fasciaY: 9, over: ["bricks"] });
    awning(S, t, { y: 10, colors: ["green", "green"] });
  }
  risers(L, 4, 9, "polished_andesite");

  // L2 and L3 windows 2x3 with sills and lintels
  for (const t of L.treads.filter((t) => t.cells.length >= 5)) {
    bayRhythm(S, t, { floorY: 10, h: 3, sill: "smooth_stone", lintel: "stone_brick", over: true });
    bayRhythm(S, t, { floorY: 15, h: 3, sill: "smooth_stone", lintel: "stone_brick", over: true });
  }

  // cornice at y20 with brackets at y19, brick parapet and coping
  for (const t of L.treads.filter((t) => t.cells.length >= 5)) {
    cornice(S, t, { y: 20, course: "smooth_sandstone", brackets: "smooth_sandstone", bracketsY: 19, every: 2 });
  }
  const skylight = (x, z) => x >= 30 && x <= 33 && z >= 14 && z <= 15;
  deckAndParapet(S, L.plot, { deckY: 20, deck: "gray_concrete", parapet: "bricks", parapetH: 2, coping: "smooth_stone",
    rail: false, ring: 1, skip: skylight });
  for (let x = 30; x <= 33; x++) for (let z = 14; z <= 15; z++) if (L.rings.has(`${x},${z}`)) S.set(x, 20, z, "glass");

  // GREEN TORTOISE hostel board: GREEN on S wall z28 x14..25, TORTOISE on S wall z30 x26..33
  const green = findTread(L, "south", 28, 14, 25);
  const tort = findTread(L, "south", 30, 26, 33);
  if (green) bannerSign(woolLetters(S), green, { text: "GREEN", y0: 11, y1: 14, board: "green_concrete", base: "white", over: true });
  if (tort) bannerSign(woolLetters(S), tort, { text: "TORTOISE", y0: 11, y1: 14, board: "green_concrete", base: "white", over: true });

  // doors: hostel snapped from S z30 x18..19 (that cell is outside the mask) to the nearest 2-wide south run, S z28
  // x22..23; shop doors S z26 x8..9 and S z34 x36..37; y4
  for (const [x, z] of [[22, 28], [8, 26], [36, 34]]) {
    for (const dx of [0, 1]) for (const y of [4, 5]) S.set(x + dx, y, z, "air");
    const [fx, fz] = L.front("south", x, z);
    doorPair(S, { x, z, y: 4, face: "south", ground: Math.max(L.G(fx, fz), 2) }); // the helper takes 1 or 2 steps: clamp the ramp (G 1 under floor 4 is 3)
  }
}

function pikeSt(g) {
  const L = lot(g, "pikeSt", 326);
  const S = L.S;
  const ring0 = L.cells.filter((c) => c.ring === 0);
  plinth(S, { ring0: ring0.filter((c) => L.G(c.x, c.z) < 2).map((c) => [c.x, c.z, L.G(c.x, c.z)]) },
    { top: 2, block: "smooth_stone" });
  body(L, 15, "bricks");
  floors(L, [2, 10], "spruce_planks");

  // L1 shops: glass y3..7, cut_sandstone mullions every 3 on ring 1, red neon band y8..9 on ring 0
  for (const t of L.treads.filter((t) => t.shop)) {
    shopfront(S, t, { baseY: 2, h: 5, frame: "cut_sandstone", pierEvery: 3, fascia: "red_concrete", fasciaY: 8, over: ["bricks"] });
    t.cells.forEach(([x, z], i) => {
      if (i % 3 === 0) for (let y = 3; y <= 7; y++) S.set(x, y, z, "cut_sandstone");
    });
  }
  risers(L, 2, 7, "cut_sandstone");
  for (const c of ring0) if (c.face) {
    const [x, z] = [c.x, c.z];
    for (const y of [8, 9]) if (L.S.isAir(x, y, z)) L.S.set(x, y, z, "red_concrete");
  }
  // neon words, one per named tread (wall z50, 54, 58, 60)
  const words = [["PIKE", 50, 4, 11], ["PLACE", 54, 18, 25], ["SUPPLY", 58, 32, 39], ["CO.", 60, 40, 47]];
  for (const [text, wall, x0, x1] of words) {
    const t = findTread(L, "south", wall, x0, x1);
    if (t) bannerSign(woolLetters(S), t, { text, y0: 8, y1: 9, board: "red_concrete", base: "white", over: true });
    else console.log(`pike st: no tread for ${text} at z${wall} x${x0}..${x1}`);
  }

  // L2 windows 2x3 at y11..13 in cut_sandstone piers with brick spandrels
  for (const t of L.treads.filter((t) => t.cells.length >= 5)) {
    bayRhythm(S, t, { floorY: 10, h: 3, sill: "smooth_stone", lintel: "smooth_sandstone", over: true });
    for (const [x, z] of t.cells) for (let y = 11; y <= 13; y++) {
      if (S.blockAt(x, y, z) !== "glass_pane") S.set(x, y, z, "cut_sandstone");
    }
  }

  // parapet y16..17 in cut_sandstone, smooth sandstone coping, chiseled panel on each long tread at ring 0 y16
  deckAndParapet(S, L.plot, { deckY: 15, deck: "gray_concrete", parapet: "cut_sandstone", parapetH: 2,
    coping: "smooth_sandstone", rail: false, ring: 1 });
  for (const t of L.treads.filter((t) => t.cells.length >= 5)) {
    const [mx, mz] = t.cells[Math.floor(t.cells.length / 2)];
    const [fx, fz] = L.front(t.face, mx, mz);
    S.set(fx, 16, fz, "chiseled_sandstone");
  }

  // rooftop HVAC boxes
  hvacBox(S, [20, 16, 20, 24, 18, 23], { block: "light_gray_concrete", vent: "iron_trapdoor" });
  hvacBox(S, [34, 16, 30, 37, 18, 33], { block: "light_gray_concrete", vent: "iron_trapdoor" });
  hvacBox(S, [26, 16, 40, 28, 18, 42], { block: "light_gray_concrete", vent: "iron_trapdoor" });

  // shop doors on S walls y2
  for (const [x, z] of [[6, 50], [20, 54], [34, 58], [42, 60]]) {
    for (const dx of [0, 1]) for (const y of [2, 3]) S.set(x + dx, y, z, "air");
    const [fx, fz] = L.front("south", x, z);
    doorPair(S, { x, z, y: 2, face: "south", ground: Math.max(L.G(fx, fz), 0) });
  }
}

export function build(g) {
  hahn(g);
  pikeSt(g);
}
