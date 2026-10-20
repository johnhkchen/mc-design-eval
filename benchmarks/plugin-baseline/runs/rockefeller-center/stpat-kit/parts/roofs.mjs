// Part "roofs": nave, transept and choir gable roofs (45 deg, ridge y41 with copper cap), apse half-hip, aisle lean-tos,
// ambulatory decks, Lady Chapel roof, fleche at the crossing. Roof surfaces only; walls and parapets belong to the shell.
import { gable_roof_x, gable_roof_z, lean_to, fleche, roof_light } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Ambulatory chapel decks: flat bottom slabs at y 21 with lanterns on top (plan ROOFS: "flat deck of bottom slabs y 21").
function deck(g, x0, z0, x1, z1, y) {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      if (!g.isAir(x, y, z)) continue;
      g.set(x, y, z, ...B.slab("deepslate_tile", "bottom"));
    }
}

// A bottom slab under a parapet coping slab leaves half a block of air under the coping: turn that slab into a top slab,
// so the coping sits flush on it. Only slabs with a coping directly above them are touched.
function topUnderCoping(g, [x0, z0, x1, z1], y) {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      const cell = g.get(x, y, z)?.block.replace("minecraft:", ""), above = g.get(x, y + 1, z)?.block.replace("minecraft:", "");
      if (cell === "deepslate_tile_slab" && above === "polished_diorite_slab")
        g.set(x, y, z, "deepslate_tile_slab", { type: "top", waterlogged: "false" });
    }
}

// A hipped (apsidal) east end over x0..x1, z0..z1: each cell rises from the eave by its distance to the nearest of the
// north, south and east edges (the east slope `step` up per block), capped at the ridge with a copper slab. Where the east
// slope climbs 2 per block, a deepslate tile block fills under each stair so the slope has no holes. Air only.
function hipEast(g, x0, x1, z0, z1, eave, ridge, step) {
  const maxD = ridge - eave;
  const put = (x, y, z, b, st) => { if (g.isAir(x, y, z)) g.set(x, y, z, b, st); };
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      const dz = Math.min(z - z0, z1 - z), dx = step * (x1 - x), d = Math.min(dz, dx, maxD), y = eave + d;
      const mat = ((Math.floor(x / 3) * 7 + Math.floor(z / 3) * 13) % 5 === 0) ? "cobbled_deepslate" : "deepslate_tile";
      if (d === maxD && dz === maxD) { put(x, y, z, ...B.slab("waxed_oxidized_cut_copper")); continue; }
      const facing = dx < dz ? "west" : (z - z0 < z1 - z ? "south" : "north");
      put(x, y, z, ...B.stairs(mat, facing, "bottom"));
      if (d === maxD) put(x, y + 1, z, ...B.slab("waxed_oxidized_cut_copper"));
      if (dx < dz && dz < maxD && step > 1) for (let k = 1; k < step && y - k > eave - 1; k++) put(x, y - k, z, "deepslate_tiles");
    }
}

export function build(g) {
  // ---- nave: gable along x, eave y34 at z13 / z27, ridge y41 at z20 (45 deg). Starts at x7 to meet the centre front.
  gable_roof_x(g, [[7, 34, 13], [45, 42, 27]], 34, 41);

  // ---- transepts: one gable along z through the crossing, eave y34 at x45 / x59, ridge y41 at x52.
  gable_roof_z(g, [45, 0, 59, 40], 34, 41);

  // ---- choir: gable along x, z13..27 (ridge y41 at z20), from the transept line to the apse.
  gable_roof_x(g, [[59, 34, 13], [79, 42, 27]], 34, 41);

  // ---- apse: a steep half-hip over x80..84 (2 up per block from the east eave), ridge y41 running on from the choir.
  hipEast(g, 80, 84, 13, 27, 34, 41, 2);

  // ---- nave aisles: lean-tos from y19 at the outer walls (z4 / z36) up to y22 against the clerestory.
  lean_to(g, [11, 4, 45, 13], 19, 22, "south");
  lean_to(g, [11, 27, 45, 36], 19, 22, "north");

  // ---- choir aisles.
  lean_to(g, [66, 6, 83, 13], 19, 22, "south");
  lean_to(g, [66, 27, 83, 34], 19, 22, "north");

  // ---- transept aisles: lean toward the transept arm (x45 west wing, x59 east wing).
  lean_to(g, [39, 0, 45, 13], 19, 23, "east");
  lean_to(g, [59, 0, 65, 13], 19, 23, "west");
  lean_to(g, [39, 27, 45, 40], 19, 23, "east");
  lean_to(g, [59, 27, 65, 40], 19, 23, "west");
  for (const box of [[11, 4, 45, 13], [11, 27, 45, 36], [66, 6, 83, 13], [66, 27, 83, 34], [39, 0, 45, 13], [59, 0, 65, 13], [39, 27, 45, 40], [59, 27, 65, 40]])
    topUnderCoping(g, box, 19);

  // ---- ambulatory chapel decks at y21, lanterns on top so the decks stay lit.
  deck(g, 84, 9, 89, 14, 21);
  deck(g, 84, 26, 89, 31, 21);
  topUnderCoping(g, [84, 9, 89, 14], 21);
  topUnderCoping(g, [84, 26, 89, 31], 21);
  roof_light(g, [84, 21, 9], [89, 21, 14]);
  roof_light(g, [84, 21, 26], [89, 21, 31]);

  // ---- Lady Chapel: gable along x, z16..24, eave y22 at z16 / z24, ridge y26 at z20; the apse end x100..104 included.
  // (the gable box spans y22..27: a box only one row tall would clip the roof to its eave course)
  gable_roof_x(g, [[85, 22, 16], [99, 27, 24]], 22, 26);
  hipEast(g, 100, 104, 16, 24, 22, 26, 1);

  // ---- ridge beams: a hidden course of deepslate tiles under the copper ridge slabs, so the ridge ends rest on something.
  for (let x = 7; x <= 80; x++) if (g.isAir(x, 40, 20)) g.set(x, 40, 20, "deepslate_tiles");
  for (let x = 85; x <= 100; x++) if (g.isAir(x, 25, 20)) g.set(x, 25, 20, "deepslate_tiles");

  // ---- fleche over the crossing (lantern floor y42, 3x3 at x51..53 z19..21).
  fleche(g, [52, 42, 20]);
}
