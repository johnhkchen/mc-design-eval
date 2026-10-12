// P2 roofs (plan.md Roofs, E10..E13): R-main is one civic hip over the union of rects, with the classical front pediment,
// two shed dormers on the south slope and keep boxes for the turret and chimney; R-turret is the cone over the octagonal
// bay. Both run here, in plan order, on the shell's grid. Roof materials are restricted to the palette's roof role:
// the library's slate mix reaches for polished_blackstone_brick and cobbled/polished deepslate stairs, which are off-palette.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/roofs.mjs";
import { TURRET, CHIMNEY } from "../vocab.mjs";

// Palette-only roof block: deepslate_tiles for every cell. The palette has no cobbled or polished deepslate slabs or
// stairs, and dormer and cone slabs derive from whichever block a full cell takes, so a mix would go off-palette.
const roofBlock = () => "deepslate_tiles";

export function build(g) {
  // R-main (E10, E11, E13): hip over the main, garage and entry rects; pitch 0.6 keeps the ridge at or below y14.
  roof(g, [[4, 11, 29, 25], [2, 11, 3, 25], [29, 13, 41, 25], [11, 5, 22, 10]], "civic", {
    y: 10, style: "hip", pitch: 0.6, overhang: 1, material: "slate", eave: "cornice", trim: "smooth_quartz", ridge: "slab",
    materialAt: roofBlock,
    pediment: { face: "north", width: 12, pitch: 1, tympanum: "birch_planks", cornice: "smooth_quartz", oculus: true },
    // gable dormers are dropped on this slope (the roof rises under 4 rows over it); shed dormers fit and read as dormers
    dormers: { face: "south", count: 2, style: "shed", width: 3, height: 2, window: "glass_pane", wall: "birch_planks" },
    keep: [
      { from: [TURRET.x0 - 1, 10, TURRET.z0 - 1], to: [8, 30, TURRET.z1] },
      { from: [CHIMNEY.x0, 0, CHIMNEY.z0 - 1], to: [CHIMNEY.x1, 30, CHIMNEY.z1 + 1] },
    ],
  });
  // E10 half-round window in the tympanum: glass 16..17 x 11..12 at z5 (the oculus is one of these), quartz_stairs shoulders
  // at x15 and x18 on y12, top half, facing out.
  for (const x of [16, 17]) for (const y of [11, 12]) g.set(x, y, 5, ...B.pane());
  g.set(15, 12, 5, ...B.stairs("quartz", "west", "top"));
  g.set(18, 12, 5, ...B.stairs("quartz", "east", "top"));

  // R-turret (E12): slate cone from y12 over the octagonal bay, at most 5 courses, lightning rod finial.
  roof(g, [[TURRET.x0, TURRET.z0, TURRET.x1, TURRET.z1]], "cone", {
    y: 12, material: "slate", maxHeight: 7, finial: "lightning_rod", overhang: 1, materialAt: roofBlock,
  });
}
