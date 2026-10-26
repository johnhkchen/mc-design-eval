// 424 N St NW (Shaw, DC 20001): a 3 x 8 block, flat-roofed red-brick flats of the 1900s-1920s, two residential
// storeys over a stone base course, with a stone cornice and a black tar roof. Lidar roof is 4 blocks everywhere
// (three notches at x=1 are noise), so the massing is one flat-topped box at the median roof height.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC74031.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 3, D = 8, Y = 16;
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const TOP = roofs[Math.floor(roofs.length / 2)];                                  // 4: lidar median, notches smoothed
const g = new Voxels([X, Y, D]);

// street side is z = 0 (north): door in the middle of it; the back (z = 7) has the windows, no door
const corner = (x, z) => (x === 0 || x === X - 1) && (z === 0 || z === D - 1);
const ring = (x, z) => x === 0 || x === X - 1 || z === 0 || z === D - 1;
const inside = (x, z) => x === 1 && z >= 1 && z <= D - 2;                       // the one-cell-wide hall/void
const cell = new Map(cells.map(([x, z, gr, rf]) => [`${x},${z}`, { gr, rf }]));

const pane = (x, z) => (z === D - 1 && x === 1)
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (const [key, { gr, rf }] of cell) {
  const [x, z] = key.split(",").map(Number);

  // foundation under the lot (all ground here is 0; kept so a sloped lot sits on its own footing)
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // base course + ground-floor slab, then a stone cornice at the roof edge, black tar roof between
  g.set(x, 0, z, "stone_bricks");
  for (let y = 1; y < TOP - 1; y++) {
    if (corner(x, z)) { g.set(x, y, z, "stone_bricks"); continue; }                  // quoins
    if (ring(x, z)) {
      if (z === 0 && x === 1) continue;                                              // doorway, set below
      const windowCell = (x === 1 && z === D - 1) || (x !== 1 && z % 2 === 1);       // back middle, side bays 1,3,5
      if (windowCell) g.set(x, y, z, "glass_pane", pane(x, z));
      else g.set(x, y, z, "bricks");
      continue;
    }
    if (inside(x, z)) {
      if (y === 1) g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // storey-2 floor, spans the hall
      if (y === 2 && z === 3) g.set(x, y, z, "glowstone");                           // warm light behind the glass
      if (y === 2 && (z === 1 || z === 5)) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
  // cornice band and roof deck
  if (ring(x, z) || corner(x, z)) g.set(x, TOP - 1, z, "stone_bricks");
  else g.set(x, TOP - 1, z, "deepslate_tiles");                                    // slate-look flat roof, not a hole
}

// street door: a two-block door in the middle of the front wall, with the brick stoop line of the base course
g.set(1, 1, 0, "dark_oak_door", doorState("lower"));
g.set(1, 2, 0, "dark_oak_door", doorState("upper"));

console.log(g.save(`${dir}/DC74031.nbt`));
