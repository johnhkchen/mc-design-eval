// Part: Roofs and chimneys. R-C is roof.json (laid by runParts after the shell, with its chimney stacks in keep); R-A, R-B1,
// R-B2 and R-S are laid here with roof() on their own footprints (roof.json holds one spec, one footprint and one eave).
// Then by hand: the R-D parapet at y 43 (the shell laid the deck at y 42), the stepped north gable of D, and the three stacks.
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/roofs.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { parapet, stack, QUARTZ_BRICKS } from "../vocab.mjs";
import { STACKS } from "../vocab/base.mjs";

// the dark-slate roof in palette.json blocks only: deepslate_tiles field, stone_brick ridge, dark oak verge
const ROOF = { mix: [["deepslate_tiles", 1]], eave: "deepslate_tiles", ridge: "stone_brick_slab", verge: "dark_oak", fascia: "deepslate_tiles", soffit: "deepslate_tiles" };

// the chimney cells each roof keeps clear (from its eave to the top of its stack)
const KEEP = {
  // the North Arcade head beam (x 33, y 25) is the eave course at the posts: the shell laid it, the roof keeps off it
  A: [{ from: [33, 25, 0], to: [33, 25, 132] }],
  B1: [{ from: [40, 27, 133], to: [40, 27, 160] }],
  S_NORTH: [{ from: [40, 25, 161], to: [41, 25, 188] }],
  S_MAIN: [{ from: [40, 27, 189], to: [41, 27, 279] }],
  B2: [{ from: [27, 32, 174], to: [28, 40, 175] }],
};

export function build(g) {
  // R-A (v2, on the owner's comment): a light covered-market roof over the North Arcade, laid by hand: a low gable of
  // smooth_stone slabs in half steps (the corrugated sheet), a white smooth_quartz ridge at x 31, eaves at x 28 and 34.
  // Profile across x: 28 top slab y25 | 29 bottom y26 (on the west head beam) | 30 top y26 | 31 ridge bottom y27 |
  // 32 top y26 | 33 bottom y26 (on the street head beam) | 34 top y25. Lanterns hang under the ridge every 4 cells.
  const PROFILE = [[28, 25, "top"], [29, 26, "bottom"], [30, 26, "top"], [32, 26, "top"], [33, 26, "bottom"], [34, 25, "top"]];
  for (const x of [29, 33]) if (g.isAir(x, 25, 0)) g.set(x, 25, 0, "dark_oak_planks"); // the beams carried to the north end
  for (let z = 0; z <= 132; z++) {
    for (const [x, y, type] of PROFILE) if (g.isAir(x, y, z)) g.set(x, y, z, ...B.slab("smooth_stone", type));
    if (g.isAir(31, 27, z)) g.set(31, 27, z, ...B.slab("smooth_quartz", "bottom"));
    if (g.isAir(31, 26, z) && z % 4 === 3) { g.set(31, 26, z, ...B.chain("y", false)); g.set(31, 25, z, ...B.lantern(true)); }
  }

  // R-B1: North Arcade hall, gable along z (walls x29/40, eave x28/41)
  roof(g, [29, 133, 40, 160], "gable", {
    y: 27, pitch: "half", ridgeAxis: "z", material: ROOF, verge: "dark_oak", keep: KEEP.B1,
    overhang: { north: 0, south: 0, east: 1, west: 1 },
  });

  // R-S: street arcade shed falling east, two lengths (floor 20 north of z 189, 22 south)
  roof(g, [34, 161, 40, 188], "shed", {
    y: 25, pitch: "half", low: "east", material: ROOF, verge: "dark_oak", keep: KEEP.S_NORTH,
    overhang: { north: 0, south: 0, east: 1, west: 0 },
  });
  roof(g, [34, 189, 40, 279], "shed", {
    y: 27, pitch: "half", low: "east", material: ROOF, verge: "dark_oak", keep: KEEP.S_MAIN,
    overhang: { north: 0, south: 0, east: 1, west: 0 },
  });

  // the flashing where the shed's high edge meets the upper wall at x 33: a course of full deepslate tile blocks on the
  // high edge (y 27 north of z 189, y 29 south of it), at x 34. Full blocks, not a bottom slab: the quartz pilasters
  // and stairs stand on this course, and a bottom slab would leave half a block of air under them.
  for (let z = 161; z <= 279; z++) {
    const hy = z <= 188 ? 27 : 29;
    g.set(34, hy + 1, z, "deepslate_tiles");
  }

  // R-B2: upper market building north, gable along z (walls x22/33, overhang west to x21)
  roof(g, [22, 161, 33, 188], "gable", {
    y: 32, pitch: "half", ridgeAxis: "z", material: ROOF, verge: "dark_oak", keep: KEEP.B2,
    overhang: { north: 0, south: 0, east: 0, west: 1 },
  });

  // R-C is roof.json (the Main Arcade gable, ridge along z), laid by runParts. Not repeated here.

  // R-D: flat corner block roof. The shell laid its deck at y 42; parapet y 43 with coping at y 44.
  parapet(g, { x0: 14, z0: 280, x1: 41, z1: 311, y: 43 }); // v2: the MEET THE PRODUCER board moved under the clock

  // the stepped north gable of D: quartz rising behind R-C's south end, up to y 45 at its ridge, off the deck. The shell's
  // parapet ring (y 43) and coping (y 44) sit on this row, so the gable only rises into air, as the parapet does.
  for (let x = 14; x <= 33; x++) {
    const top = Math.max(43, 45 - Math.floor(Math.abs(x - 23.5) / 2));
    for (let y = 43; y <= top; y++) if (/(^|:)(cave_)?air$/.test(g.blockAt(x, y, 280))) g.set(x, y, 280, QUARTZ_BRICKS);
  }

  // three brick stacks (dummy, exterior only); each rises from its eave, through the roof's keep
  for (const [x, z] of STACKS) {
    const ridgeY = x === 27 ? 36 : 45;
    stack(g, { x, z, y0: x === 27 ? 32 : 40, ridgeY });
  }
}
