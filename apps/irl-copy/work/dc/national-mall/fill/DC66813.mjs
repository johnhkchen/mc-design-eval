// DC66813: a 1930s stripped-classical office block in the Federal Triangle manner. Three storeys of pale limestone
// (calcite piers, smooth-quartz quoins) over a polished base course, stone string courses at 3 and 6, a cornice at 9 and
// a parapet on top, with a central pavilion stepping up 11 -> 12 -> 13. The lidar roof is smoothed into those clean
// tiers: the pavilion is x 3..6, z 2..4 at 12 with its core x 4..5 at 13; the lone 12 at the west corner is noise.
// The front is z = 0 (the street face, double door on the pavilion axis); the back is z = 5, with the notch
// (x 5..10, z 5) open to the sky. Glass panes are set in the wall cells with air behind them, and the interior is
// hollow with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC66813.cells.json`, "utf8"));

// [x, z, ground, roof] per footprint cell; roof is the smoothed tier, ground is the lidar value
const FOOT = new Map(cells.map(([x, z, ground]) => [`${x},${z}`, { ground, roof: tierRoof(x, z) }]));
function tierRoof(x, z) {
  if (x < 3 || x > 6 || z < 2 || z > 4) return 11;
  return x === 4 || x === 5 ? 13 : 12;
}

const inside = (x, z) => FOOT.has(`${x},${z}`);
const at = (x, z) => FOOT.get(`${x},${z}`);
// which outward faces a cell has: n = z-, s = z+, w = x-, e = x+ (a neighbour outside the footprint)
const faces = (x, z) => ({ n: !inside(x, z - 1), s: !inside(x, z + 1), w: !inside(x - 1, z), e: !inside(x + 1, z) });
const exposed = (x, z) => Object.values(faces(x, z)).filter(Boolean).length;
// a shell cell is on the outside or stands above a lower neighbour; the rest are hollow interior
const isShell = (x, z) => {
  const { roof } = at(x, z);
  return exposed(x, z) > 0 || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => at(x + dx, z + dz).roof < roof);
};

// one block of a shell column: base course, string courses, cornice, parapet, and the window bays
function facadeBlock(x, z, y, ground, roof) {
  if (y === ground) return "polished_andesite";
  if (y === roof - 1) return "stone_bricks";
  if (y === 3 || y === 6) return "smooth_stone";
  if (y === 9) return "stone_bricks";
  if (exposed(x, z) >= 2) return "smooth_quartz";                      // quoins at the corners
  const glassRow = [1, 2, 4, 5, 7, 8].includes(y) || (y >= 10 && y <= roof - 2);
  if (!glassRow) return "calcite";
  const f = faces(x, z);
  let glass;
  if (f.n) glass = [1, 2, 7, 8].includes(x);                           // street face: bays either side of the door
  else if (f.s) glass = z === 5 ? [1, 3].includes(x) : [7, 9].includes(x);  // back and notch faces
  else if (f.w || f.e) glass = [1, 3].includes(z);                     // side faces
  else glass = y >= 10 && (x + z) % 2 === 1;                           // raised pavilion above the roof
  return glass ? "gray_stained_glass_pane" : "calcite";
}

const g = new Voxels([11, 25, 6]);
for (let z = 0; z < 6; z++) for (let x = 0; x < 11; x++) {
  if (!inside(x, z)) continue;
  const { ground, roof } = at(x, z);
  const shell = isShell(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");        // foundation up to the cell's ground
  for (let y = ground; y < roof; y++) {
    if (!shell) {
      if ([ground, 3, 6, roof - 2].includes(y)) g.set(x, y, z, "smooth_stone");   // floor slabs and the roof deck
      continue;
    }
    if (z === 0 && (x === 4 || x === 5) && y <= 1) {                  // double door on the pavilion axis
      const hinge = x === 4 ? "left" : "right";
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 0 ? "lower" : "upper", hinge, open: "false", powered: "false" });
      continue;
    }
    if (z === 0 && x === 5 && y === 2) { g.set(x, y, z, "lantern", { hanging: "true" }); continue; }
    g.set(x, y, z, facadeBlock(x, z, y, ground, roof));
  }
}

// rooftop units on the main roof, warm light behind the glass
for (const [x, z] of [[2, 2], [2, 3], [8, 2], [8, 3]]) g.set(x, 10, z, "light_gray_concrete");
g.set(2, 1, 1, "glowstone");
g.set(7, 1, 1, "glowstone");
g.set(2, 4, 1, "glowstone");
g.set(7, 4, 1, "glowstone");
g.set(2, 7, 1, "shroomlight");

// glass panes connect to panes and to the wall material beside them, not to lamps or doors
const WALLS = new Set(["calcite", "smooth_quartz", "stone_bricks", "smooth_stone", "polished_andesite"]);
const name = (b) => b.block.replace("minecraft:", "");
const PANE = /_glass_pane$/;
const joins = (b) => !!b && (PANE.test(name(b)) || WALLS.has(name(b)));
const [X, Y, Z] = g.size;
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) {
  const b = g.get(x, y, z);
  if (!b || !PANE.test(name(b))) continue;
  const side = (dx, dy, dz) => (joins(g.get(x + dx, y + dy, z + dz)) ? "true" : "false");
  g.set(x, y, z, name(b), { north: side(0, 0, -1), south: side(0, 0, 1), east: side(1, 0, 0), west: side(-1, 0, 0) });
}

const out = g.save(`${DIR}/DC66813.nbt`);
console.log(`DC66813.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
