// Roofs: the main slate roof is roof.json (runParts lays it right after the shell, keep box for the east stack). This
// part lays the workshop roof (gable along z, ridge y=10, keep for the main back wall and the rendering stack) through
// the roof tool's library call, and the drying lean-to's slab roof by hand (plan.md ROOFS: a shed falling east).
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/roofs.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// plan.md ROOFS, workshop row: the same spec as the roof tool's --spec, minus footprint and style (passed as arguments)
const WORKSHOP = {
  pitch: "45", material: "slate", ridgeAxis: "z", y: 6, gable: "bricks", verge: "dark_oak", ridge: "slab",
  fascia: "dark_oak", soffit: "dark_oak",   // the timber edges of the dark-frame house (the tool's default is spruce)
  overhang: { north: 0, south: 1, east: 1, west: 1 },
  keep: [
    { from: [5, 6, 17], to: [17, 10, 17] },   // the main back wall the wing butts into
    { from: [8, 6, 28], to: [9, 13, 29] },    // the rendering-hearth stack
    { from: [4, 10, 18], to: [14, 11, 18] },  // under the main roof's south eave (already laid by runParts)
  ],
};

export function build(g) {
  // the workshop roof: gable, eaves at x=4 and x=14 (y=6), verge at z=28, its north side butts the main back wall
  roof(g, [[5, 18, 13, 27]], "gable", WORKSHOP);

  // the soffit corners: the tool's soffit reached the verge corners (the main roof at y=10, the workshop's south corners
  // at y=4), and with the dark oak soffit those cells are left open; the course runs unbroken again
  for (const [x, y, z] of [[4, 10, 6], [18, 10, 6], [4, 10, 18], [18, 10, 18], [4, 4, 28], [14, 4, 28]]) g.set(x, y, z, ...B.slab("dark_oak", "top"));

  // the drying lean-to: a shed of dark oak slabs over z=18..25, high side at x=15 (y=5), falling east to the eave at x=19
  for (let z = 18; z <= 25; z++) {
    for (let x = 15; x <= 16; x++) g.set(x, 5, z, ...B.slab("dark_oak", "top"));
    for (let x = 17; x <= 18; x++) g.set(x, 4, z, ...B.slab("dark_oak", "top"));
    g.set(19, 4, z, ...B.slab("dark_oak", "bottom"));
  }
}
