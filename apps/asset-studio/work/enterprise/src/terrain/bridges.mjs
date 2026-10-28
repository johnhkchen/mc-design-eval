// Bridges as parts (thread 0014): a crossing the grade keeps is assembled from abutments, piers and arches, the way the
// houses are composed, in the kingdom's dress (a style, as the earthworks). Laid in the crossing's own frame:
//   i   along the street, 0 the near bank's last dry cell, 1..span over the water, span + 1 the far bank's first
//   o   across it, 0..width - 1 the street, -1 and width the parapets, -2 and width + 1 the piers' cutwaters
//   y   world heights: the deck (the street's level over the crossing) and the water's surface come from the grade
// Facings in the frame are compass words with i running south and o running east; the caller turns them with the frame.
//
//   planCrossing(span, { deck, water })   -> [{ part: abutment|arch|pier, i0, len, n? }]   the segments, near to far
//   crossingBlocks({ span, width, deck, water, bedAt, style }) -> [[i, o, y, block]]          every block, frame coords
//   causewayBlocks({ span, width, deck, water, bedAt, style }) -> [[i, o, y, block]]          3 or less: fill + culvert
//   ferryStageBlocks({ width, level, water, style })           -> [[i, o, y, block]]          a ferry's landing stage
//
// The arches (span n, rise over the springing):  5: 1 2 3 2 1   7: 1 2 3 4 3 2 1   9: 1 3 4 5 5 5 4 3 1, each step of
// the ring turned on an upside-down stair so the soffit reads round. The springing is a block over the water, so a
// channel arch of 5 leaves 3 clear under its crown; the deck sits a ring and a course over the crown: an arch of n
// wants the deck at water + 6 (5), + 7 (7), + 8 (9). The middle arch, the
// largest the deck allows, takes the channel; the rest are arches of 5 on piers 1 thick; what's left is abutment.
import { hash, LORDAERON } from "../lordaeron/earthworks.mjs";
import { DALARAN } from "../dalaran/earthworks.mjs";

export const ARCH = { 5: [1, 2, 3, 2, 1], 7: [1, 2, 3, 4, 3, 2, 1], 9: [1, 3, 4, 5, 5, 5, 4, 3, 1] };
const NEED = (n) => Math.max(...ARCH[n]) + 3;                     // deck over water an arch of n needs

/** The crossing's segments, near bank to far: the channel arch in the middle, arches of 5 on piers either side. */
export function planCrossing(span, { deck, water }) {
  const room = deck - water, n = [9, 7, 5].find((m) => m <= span && NEED(m) <= room);
  if (!n) return [{ part: "abutment", i0: 0, len: 1 }, { part: "beam", i0: 1, len: span }, { part: "abutment", i0: span + 1, len: 1 }];
  const rest = span - n, left = Math.floor(rest / 2), right = rest - left;
  // one side, outward from the channel arch: a pier and an arch of 5 for every 6 cells; the remainder is abutment
  const side = (len) => { const q = Math.floor(len / 6); return { q, abut: len - 6 * q }; };
  const L = side(left), Rt = side(right), segs = [];
  segs.push({ part: "abutment", i0: 0, len: 1 + L.abut });
  let i = 1 + L.abut;
  for (let k = 0; k < L.q; k++) { segs.push({ part: "arch", i0: i, len: 5, n: 5 }); segs.push({ part: "pier", i0: i + 5, len: 1 }); i += 6; }
  segs.push({ part: "arch", i0: i, len: n, n, channel: true }); i += n;
  for (let k = 0; k < Rt.q; k++) { segs.push({ part: "pier", i0: i, len: 1 }); segs.push({ part: "arch", i0: i + 1, len: 5, n: 5 }); i += 6; }
  segs.push({ part: "abutment", i0: i, len: span + 2 - i });
  return segs;
}

/** Every block of a crossing in its frame. bedAt(i, o): the first solid height under the water there (for piers and
 *  abutments to stand on). Water under the arches is left as it is (nothing is placed there). */
export function crossingBlocks({ span, width, deck, water, bedAt, style: S, pave = (i, o) => ((i + o) % 2 ? "stone_bricks" : "polished_andesite") }) {
  const out = [], segs = planCrossing(span, { deck, water }), spring = water + 1;
  const put = (i, o, y, b) => out.push([i, o, y, b]);
  const course = (i, o, y) => S.course(hash(i * 31 + o, y, 7));
  const posts = new Set();                                         // parapet posts (with lanterns) over piers and ends
  for (const sg of segs) {
    for (let i = sg.i0; i < sg.i0 + sg.len; i++) {
      for (let o = -1; o <= width; o++) {
        const edge = o === -1 || o === width;
        // the deck: paving on the street, the coping under the parapet
        put(i, o, deck, edge ? S.coping : pave(i, o));
        for (let y = deck + 1; y <= deck + 3; y++) put(i, o, y, "air");
        if (sg.part === "abutment" || sg.part === "pier") {
          for (let y = bedAt(i, o) + 1; y < deck; y++) put(i, o, y, course(i, o, y));
        } else if (sg.part === "arch") {
          const k = i - sg.i0, h = ARCH[sg.n][k], ring = spring + h;
          // the ring (its ends turned on upside-down stairs toward the pier), spandrels filled to the deck
          for (let y = ring; y < deck; y++) put(i, o, y, y === ring ? (S.ring || S.coping) : course(i, o, y));
          // the soffit's step: where the next cell toward the crown rises, an upside-down stair under this ring, its
          // high side toward the springing (north on the near half, south on the far)
          const nb = ARCH[sg.n], mid = (nb.length - 1) / 2, inward = k < mid ? 1 : k > mid ? -1 : 0;
          if (inward && (nb[k + inward] ?? h) > h) put(i, o, ring, `${S.stair}_stairs[facing=${inward > 0 ? "north" : "south"},half=top,shape=straight,waterlogged=false]`);
        } else if (sg.part === "beam") {
          put(i, o, deck - 1, "stripped_dark_oak_log[axis=z]");
        }
      }
      if (sg.part === "pier") {
        // cutwaters: pointed stone to a block over the water on both faces, the river's way
        for (const [o, f] of [[-2, "east"], [width + 1, "west"]]) { for (let y = bedAt(i, o) + 1; y <= water; y++) put(i, o, y, course(i, o, y)); put(i, o, water + 1, `${S.stair}_stairs[facing=${f},half=bottom,shape=straight,waterlogged=false]`); }
        posts.add(i);
      }
    }
    if (sg.part === "abutment") posts.add(sg.i0 === 0 ? sg.i0 : sg.i0 + sg.len - 1);
  }
  // the parapet along both sides, joined, a post and lantern over each pier and at each end
  for (let i = 0; i <= span + 1; i++) for (const o of [-1, width]) {
    const post = posts.has(i), along = { north: i > 0 ? "low" : "none", south: i <= span ? "low" : "none", east: "none", west: "none" };
    put(i, o, deck + 1, S.parapet(along, post || i === 0 || i === span + 1));
    if (post || i === 0 || i === span + 1) put(i, o, deck + 2, "lantern[hanging=false,waterlogged=false]");
  }
  return out;
}

/** A crossing of 3 or less: an embankment of coursed stone from the bed, paved at the street's level, faced on both
 *  sides, with a culvert (an open slot a block over the water, the river's way) under its middle so the water runs on. */
export function causewayBlocks({ span, width, deck, water, bedAt, style: S, pave = (i, o) => ((i + o) % 2 ? "stone_bricks" : "polished_andesite") }) {
  const out = [], put = (i, o, y, b) => out.push([i, o, y, b]), mid = Math.ceil(span / 2);
  for (let i = 1; i <= span; i++) for (let o = -1; o <= width; o++) {
    const edge = o === -1 || o === width, culvert = i === mid;
    for (let y = bedAt(i, o) + 1; y < deck; y++) put(i, o, y, culvert && y <= water + 1 ? (y <= water ? "water" : "air") : y === deck - 1 && edge ? S.coping : S.course(hash(i, o, y, 5)));
    put(i, o, deck, edge ? S.coping : pave(i, o));
  }
  return out;
}

/** A ferry's landing stage where a crossing is too long for its tier: half steps to a broad timber stage on posts, a
 *  moored skiff (block-built) alongside, mooring posts, a lantern; one on each bank. */
export function ferryStageBlocks({ width, level, water, style: S }) {
  const out = [], put = (i, o, y, b) => out.push([i, o, y, b]), deck = water + 1, w = width + 2;
  for (let i = 1; i <= 5; i++) for (let o = -1; o <= width; o++) {
    put(i, o, deck, "spruce_planks");
    if ((i === 1 || i === 5) && (o === -1 || o === width)) for (let y = deck - 1; y >= water - 3; y--) put(i, o, y, "spruce_log[axis=y]");
  }
  for (const o of [-1, width]) { put(5, o, deck + 1, "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]"); put(5, o, deck + 2, "lantern[hanging=false,waterlogged=false]"); }
  // the skiff, moored along the stage's far side: a hull of trapdoors and slabs, a thwart
  for (let i = 2; i <= 4; i++) { put(i, w - 1, water, "spruce_slab[type=top,waterlogged=true]"); put(i, w, water + 1, "spruce_trapdoor[facing=east,half=bottom,open=true,powered=false,waterlogged=false]"); }
  put(3, w - 1, water + 1, "spruce_slab[type=bottom,waterlogged=false]");
  return out;
}

// ---- the kingdoms' bridges ----------------------------------------------------------------------------------------
// A bridge style is an earthworks style (course, coping, stair, parapet, lamp_post, tread_slab) with `kind`: arch (the
// parts above) or beam (timber spans on fieldstone piers, below), and `over(span)`: how far over the water its deck
// stands, which the grade holds as the crossing's floor (townGrade's deckOver).
const wallOf = (name) => (p, up) => `${name}[east=${p.east},north=${p.north},south=${p.south},up=${up},waterlogged=false,west=${p.west}]`;
const archOver = (span) => (span <= 3 ? 1 : span <= 8 ? 6 : span <= 20 ? 7 : 8);
export const BRIDGE = {
  // Dalaran (approved): pale dressed stone, polished andesite coping and ring, the dark oak rail on red posts
  dalaran: { ...DALARAN, kind: "arch", over: archOver },
  // Stormwind: white stone, the arch rings in smooth quartz (its pilasters' stone), a stone-brick parapet
  stormwind: { ...DALARAN, kind: "arch", over: archOver,
    course: (r) => (r < 0.82 ? "stone_bricks" : r < 0.94 ? "cracked_stone_bricks" : "chiseled_stone_bricks"),
    coping: "polished_andesite", ring: "smooth_quartz", stair: "quartz", tread_slab: "stone_brick", parapet: wallOf("stone_brick_wall"),
    lamp_post: ["stone_brick_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]", "stone_brick_wall[east=none,north=none,south=none,up=true,waterlogged=false,west=none]"] },
  // Lordaeron: a timber bridge on fieldstone piers: spruce beams and plank deck, a spruce rail, braces under the beams
  lordaeron: { ...LORDAERON, kind: "beam", over: (span) => (span <= 3 ? 1 : 5), bay: 4,
    course: (r) => (r < 0.45 ? "cobblestone" : r < 0.75 ? "mossy_cobblestone" : r < 0.9 ? "stone" : "andesite"),
    coping: "stone_bricks", parapet: (p, post) => `spruce_fence[east=${p.east === "low"},north=${p.north === "low"},south=${p.south === "low"},waterlogged=false,west=${p.west === "low"}]`,
    lamp_post: ["spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]", "spruce_fence[east=false,north=false,south=false,waterlogged=false,west=false]"] },
};

/** A timber crossing (Lordaeron): fieldstone piers every `bay` cells (and abutments at the banks) up to the beams;
 *  spruce beams running along the street under each edge and its middle, braced off the piers with upturned stairs; a
 *  plank deck across them; the rail on posts over each pier, lanterns at the ends and every other pier. */
export function beamCrossingBlocks({ span, width, deck, water, bedAt, style: S }) {
  const out = [], put = (i, o, y, b) => out.push([i, o, y, b]), bay = S.bay || 4, beam = deck - 1;
  const isPier = (i) => i === 0 || i === span + 1 || (i % bay === 0 && i < span + 1 - 1);
  const under = [-1, Math.floor((width - 1) / 2), width];           // the beams' lines: both edges and the middle
  for (let i = 0; i <= span + 1; i++) {
    for (let o = -1; o <= width; o++) {
      for (let y = deck + 1; y <= deck + 3; y++) put(i, o, y, "air");
      put(i, o, deck, o === -1 || o === width ? "spruce_slab[type=top,waterlogged=false]" : "spruce_planks");
      // a pier: fieldstone from the bed, battered out a cell at the waterline's foot, a crosswise spruce cap under the beams
      if (isPier(i)) for (let y = bedAt(i, o) + 1; y < beam; y++) put(i, o, y, y === beam - 1 ? "stripped_spruce_log[axis=x]" : S.course(hash(i * 31 + o, y, 9)));
      if (under.includes(o)) put(i, o, beam, "stripped_spruce_log[axis=z]");
    }
    // the piers' cutwaters: fieldstone a cell out each side to a stair at the water
    if (isPier(i) && i > 0 && i < span + 1) for (const [o, f] of [[-2, "east"], [width + 1, "west"]]) { for (let y = bedAt(i, o) + 1; y <= water; y++) put(i, o, y, S.course(hash(i, o, y, 4))); put(i, o, water + 1, `cobblestone_stairs[facing=${f},half=bottom,shape=straight,waterlogged=false]`); }
    // the braces: off each pier's face, an upside-down stair under the beam either side, toward the span
    if (isPier(i) && i > 0 && i < span + 1) for (const o of under) { put(i - 1, o, beam - 1, "spruce_stairs[facing=south,half=top,shape=straight,waterlogged=false]"); put(i + 1, o, beam - 1, "spruce_stairs[facing=north,half=top,shape=straight,waterlogged=false]"); }
  }
  // the rail on the deck's edges: posts over the piers, rails between; lanterns at the ends and every other pier
  for (let i = 0; i <= span + 1; i++) for (const o of [-1, width]) {
    const along = { north: i > 0 ? "low" : "none", south: i <= span ? "low" : "none", east: "none", west: "none" };
    put(i, o, deck + 1, S.parapet(along, isPier(i)));
    if (i === 0 || i === span + 1 || (isPier(i) && (i / bay) % 2 === 0)) put(i, o, deck + 2, "lantern[hanging=false,waterlogged=false]");
  }
  return out;
}

/** A crossing in its kingdom's kind: a causeway for 3 or less, else arches (crossingBlocks) or timber (beam). */
export function kingdomCrossing(args) {
  if (args.span <= 3) return causewayBlocks(args);
  return args.style.kind === "beam" ? beamCrossingBlocks(args) : crossingBlocks(args);
}
