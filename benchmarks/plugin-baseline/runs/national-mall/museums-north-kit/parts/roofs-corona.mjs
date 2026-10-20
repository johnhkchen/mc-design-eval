// Roofs, dome and Corona (plan.md ROOFS, plot 0 dome and portico roof, plot 2 Corona). The NMNH red-tile hips come from
// roof.json (runParts lays them right after the shell); this part adds the dome, lantern, pediment, and the NMAAHC
// plinth, glass base, three Corona tiers with their shadow bands, coping and the porch canopy. Writes go only into air.
import { roof, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { domeRibbed, lanternCap, pediment, glassBase, porchCanopy, BLACK_STAINED_GLASS, SMOOTH_STONE, WAXED_CUT_COPPER_SLAB } from "../vocab.mjs";

const AIR = /(^|_)air$/;
const isAir = (g, x, y, z) => { const c = g.get(x, y, z); return !c || AIR.test(c.block); };

// The red-tile preset draws from brick, mud brick, granite and mangrove families, so roof() makes blocks outside the
// palette (their slabs and stairs too). Each maps to the palette block of the same shape.
const OFF_PALETTE = {
  mud_brick_stairs: "brick_stairs", mangrove_stairs: "brick_stairs", polished_granite_stairs: "granite_stairs",
  brick_slab: "polished_granite_slab", mud_brick_slab: "polished_granite_slab", granite_slab: "polished_granite_slab", mangrove_slab: "polished_granite_slab",
  bricks: "stone_bricks", granite: "polished_diorite",
};
// roof() writes into the grid it is given, and runParts counts every write the part makes, so a swap after the fact
// would still be reported. The gable is laid on a scratch grid holding the cells round it (roof() writes only into air
// there), and only the blocks it placed reach the part, mapped onto the palette.
function layGable(g, footprint, opts, [[x0, y0, z0], [x1, y1, z1]]) {
  const scratch = new Grid(g.size, { dataVersion: g.dataVersion }), seen = new Set();
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    const c = g.get(x, y, z);
    if (c && !isAir(g, x, y, z)) { scratch.set(x, y, z, c.block, c.state, c.nbt); seen.add(`${x},${y},${z}`); }
  }
  const r = roof(scratch, footprint, "gable", opts);
  for (const c of scratch.cells.values()) {
    const [x, y, z] = c.pos;
    if (seen.has(`${x},${y},${z}`) || AIR.test(c.block)) continue;
    g.set(x, y, z, OFF_PALETTE[c.block.replace(/^minecraft:/, "")] ?? c.block, c.state, c.nbt);
  }
  return r;
}

// Fill a box with one block where the cell is air (never over what an earlier part placed).
function fillAir(g, [x0, y0, z0], [x1, y1, z1], block) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    if (isAir(g, x, y, z)) g.set(x, y, z, block);
  }
}

// The perimeter of a square of half-size h centred on (cx, cz), at course y: a shadow band or coping ring.
function ringAir(g, [cx, cz], h, y, block, state) {
  for (let dx = -h; dx <= h; dx++) for (let dz = -h; dz <= h; dz++) {
    if (Math.abs(dx) !== h && Math.abs(dz) !== h) continue;
    const x = cx + dx, z = cz + dz;
    if (isAir(g, x, y, z)) g.set(x, y, z, block, state);
  }
}

// The Corona's three tiers (y8..11, 12..15, 16..19), each 4 courses leaning out 1 cell per 2 courses: courses at inset
// a, a, a-1, a-1, an upside-down cut copper stair one cell out on the 2nd course (the lean), and each tier starting one
// cell wider than the top of the one below (insets 5-4, 3-2, 1-0: the top tier fills the footprint). The skin is a
// checker of waxed cut copper and copper grate (the small dark openings); one cell inside it a ring of brown glass with
// an ochre froglight behind every other grate cell, so the screen glows amber.
const CORONA_COURSES = [5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0];
function coronaTiers(g, [cx, cz]) {
  const ring = (h, fn) => {
    for (let dx = -h; dx <= h; dx++) for (let dz = -h; dz <= h; dz++) {
      if (Math.abs(dx) !== h && Math.abs(dz) !== h) continue;
      fn(cx + dx, cz + dz, dx, dz);
    }
  };
  CORONA_COURSES.forEach((inset, i) => {
    const y = 8 + i, h = 13 - inset;
    ring(h, (x, z, dx, dz) => {
      const corner = Math.abs(dx) === h && Math.abs(dz) === h;
      const along = Math.abs(dx) === h ? z : x;
      const open = !corner && (along + y) % 2 === 0;
      g.set(x, y, z, corner ? "minecraft:waxed_cut_copper" : open ? "minecraft:waxed_copper_grate" : "minecraft:waxed_cut_copper");
    });
    ring(h - 1, (x, z, dx, dz) => {
      const along = Math.abs(dx) === h - 1 ? z : x;
      const lit = (along + y) % 4 === 0;
      if (y === 19) return g.set(x, y, z, SMOOTH_STONE);   // the top course's inner ring is roof deck
      g.set(x, y, z, lit ? "minecraft:ochre_froglight" : "minecraft:brown_stained_glass");
    });
    // The lean: on the 2nd course of each pair, an upside-down stair one cell out, its back to the wall.
    if (i % 2 === 0 || inset === 0 || CORONA_COURSES[i + 1] !== inset - 1) return;
    const o = h + 1;
    ring(o, (x, z, dx, dz) => {
      if (Math.abs(dx) === o && Math.abs(dz) === o) return g.set(x, y, z, "minecraft:waxed_cut_copper_slab", { type: "top", waterlogged: "false" });
      const facing = dz === -o ? "south" : dz === o ? "north" : dx === -o ? "east" : "west";
      g.set(x, y, z, "minecraft:waxed_cut_copper_stairs", { facing, half: "top", shape: "straight", waterlogged: "false" });
    });
  });
}

export function build(g) {
  // ---- NMNH: the green copper dome on the drum, its lantern, and the pediment over the portico -----------------------
  domeRibbed(g, [57, 20, 27], { radius: 8, rise: 7 });
  lanternCap(g, 56, 26, 27);
  // The south pavilion's gable: ridge N-S along x 57, eaves y16, red tile, the drum keeps its cells.
  const gable = layGable(g, [[47, 36, 67, 42]], {
    y: 16, material: "red-tile", pitch: "half", overhang: 0, ridge: "slab", grow: false, ridgeAxis: "z",
    keep: [{ from: [48, 12, 18], to: [66, 19, 36] }],
  }, [[40, 0, 10], [74, 30, 46]]);
  if (gable.top !== 22) console.log(`roofs-corona: south pavilion gable ridge at y ${gable.top}, plan says 22`);
  pediment(g, [57, 17, 42], "south");

  // ---- NMAAHC (plot 2): plinth, recessed glass base, the Corona's three leaning tiers ----------------------------------
  const C = [201, 13];   // corona centre (plan.md NMAAHC_CENTRE)
  fillAir(g, [188, 0, 0], [214, 3, 26], SMOOTH_STONE);   // plinth / terrace, top course y3
  // The glass base storey at inset 6 (one cell inside tier 1's foot), doors left open on the south face at z20.
  glassBase(g, { x0: 194, x1: 208, z0: 6, z1: 20, y0: 4, y1: 7, leave: [[199, 4, 20, 203, 5, 20]] });
  fillAir(g, [194, 8, 6], [208, 8, 20], SMOOTH_STONE);   // lobby ceiling under tier 1
  coronaTiers(g, C);
  for (let x = 195; x <= 207; x += 6) for (let z = 7; z <= 19; z += 6) g.set(x, 19, z, "minecraft:ochre_froglight");  // deck lights, no spawns
  fillAir(g, [189, 19, 1], [213, 19, 25], SMOOTH_STONE);  // flat roof deck inside the top tier
  ringAir(g, C, 13, 20, WAXED_CUT_COPPER_SLAB);           // coping on the top tier's edge

  // Porch canopy under tier 1's front (x192..210, z22..31, deck y8), posts at z31.
  porchCanopy(g, 192, 22, 210, 31, 8);
}
