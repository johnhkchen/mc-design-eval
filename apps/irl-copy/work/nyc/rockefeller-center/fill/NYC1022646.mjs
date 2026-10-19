// 134 West 46 Street, a 1920 mixed residential and commercial building: a five-storey brick block (ground-floor shop,
// four residential floors, stone cornice and parapet) over a two-storey rear wing and a stair bulkhead at the east rear.
// Footprint 5 x 27 cells (x 0..4, z 0..26); z 0 is the street front, z 26 the rear. Each cell is a solid column from y 0 to
// its roof, with floor slabs at the storey lines and the inside left as air, so the walls are one block thick with an air
// gap behind the glass. Articulation is read from the exterior: string courses, window bays, a storefront, a parapet.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1022646.cells.json", "utf8"));

// Roof per cell: the lidar tiers smoothed into three flat masses. The main block (z 0..17) reads 14..16 with the record's
// 17 as its top; the rear wing (z 18..26) reads 5..8; the 1-cell stair bulkhead at x 4 (z 22..25) reads 17 for all four.
const roofFor = (x, z) => {
  if (x === 4 && z >= 22 && z <= 25) return 17;
  if (x === 4 && z === 26) return 3;
  return z <= 17 ? 17 : 8;
};
const key = (x, z) => `${x},${z}`;
const FOOT = new Map();
for (const [x, z, g] of cells) FOOT.set(key(x, z), { g, R: roofFor(x, z) });

const W = 5, H = 29, D = 27;
const g = new Voxels([W, H, D]);
const solid = (x, y, z) => { const c = FOOT.get(key(x, z)); return !!c && y >= 0 && y < c.R; };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Storey lines: the slab rows (solid across the footprint) at 0, 3, 6, 9, 12, 15 and each cell's roof row.
const isSlabRow = (y, R) => y === 0 || (y % 3 === 0 && y < R - 1) || y === R - 1;
const paneState = (axisZ) => (axisZ
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// Exterior face materials. ez: the wall faces the street or the rear (along x); otherwise a side wall (along z).
function exteriorBlock(x, y, z, ez) {
  const { g: gr, R } = FOOT.get(key(x, z));
  if (y < gr || y === 0) return ["polished_granite"];                  // base course and foundation
  if (y === R - 1) return [(x + z) % 2 === 0 ? "smooth_quartz" : "bricks"];   // parapet, capped in stone every other block
  if (y % 3 === 0) {                                                      // string course / cornice; the shop fascia
    if (ez && z === 0) return [x === 1 || x === 2 ? "black_concrete" : "dark_oak_planks"];
    return ["smooth_quartz"];
  }
  if (ez && z === 0 && y <= 2) {                                         // the storefront on 46th Street
    if (x === 1) return ["dark_oak_door", { facing: "north", hinge: "left", open: "false", powered: "false", half: y === 1 ? "lower" : "upper" }];
    if (x === 2) return ["glass"];
    return ["dark_oak_planks"];
  }
  const window = ez ? (x === 1 || x === 2) : z % 3 !== 0;               // two-bay front and rear; a pier every third cell on the sides
  return window ? ["glass_pane", paneState(ez)] : ["bricks"];
}

// Lit rooms behind some windows: [x, y, z, block]. Each interior cell is air, and the room sits behind its glass.
const LIGHTS = [
  [2, 1, 1, "glowstone"], [1, 8, 1, "shroomlight"], [2, 11, 1, "glowstone"],   // storefront, a front room, a front room
  [1, 5, 10, "glowstone"], [2, 13, 5, "shroomlight"],                           // side rooms
  [1, 4, 21, "glowstone"], [2, 5, 22, "glowstone"],                             // rear wing
];
// Two chimney stacks on the roof, standing on the roof slab.
const CHIMNEYS = [[1, 4], [2, 12]];

for (const [x, z] of [...FOOT.keys()].map((k) => k.split(",").map(Number))) {
  const { R } = FOOT.get(key(x, z));
  for (let y = 0; y < R; y++) {
    const exposed = DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
    const ez = exposed.some(([, dz]) => dz !== 0);
    if (exposed.length) {
      const [block, state] = exteriorBlock(x, y, z, ez);
      g.set(x, y, z, block, state);
    } else if (isSlabRow(y, R)) {
      g.set(x, y, z, "stone");
    }
  }
}
for (const [x, y, z, b] of LIGHTS) g.set(x, y, z, b);
for (const [x, z] of CHIMNEYS) {
  g.set(x, 17, z, "bricks"); g.set(x, 18, z, "bricks"); g.set(x, 19, z, "smooth_quartz");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill/NYC1022646.nbt";
console.log(g.save(out));
