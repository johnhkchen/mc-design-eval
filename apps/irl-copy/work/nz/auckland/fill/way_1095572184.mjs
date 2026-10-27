// Way 1095572184: an 8 x 10 two-storey brick shop-top building (c.1910s-20s, Eden Terrace / Mt Eden village
// style). Lidar: flat ground at y0, roof top at y9 (H), so one flat tier. Ground storey: shopfront glazing on dark
// oak piers, a fascia band and a door. Upper storey: red brick piers with sashes of glass on quartz sills, a quartz
// string course between the storeys and a quartz parapet cap. Lanterns behind some glass, an iron AC plant and a
// small front crest on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572184.cells.json", "utf8"));

// the footprint, the lidar roof (flat here: one tier), and the layers of each storey
const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => fp.has(`${x},${z}`);
const H = Math.max(...cells.map((c) => c[3]));     // 9: the roof's top face
const ROOF = H - 1;                                // 8: the roof deck and parapet layer
const Y = { plinth: 0, gTop: 2, fascia: 3, floor: 4, sill: 5, uTop: 7, roof: ROOF, equip: H };
const DOOR = [3, 8];                               // the front (south, +z) door cell

// exposed faces: a cell with an outside neighbour is part of the envelope
const exposed = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !inFp(x + dx, z + dz)).length;

const g = new Voxels([8, H + 2, 10]);              // y 0..H+1: the AC plant stands one block above the roof
const glass = [];
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); if (block === "glass_pane") glass.push([x, y, z]); };

for (const [x, z] of cells) {
  const ex = exposed(x, z), edge = ex > 0, corner = ex >= 2;
  if (!edge) {
    // no interiors: a floor slab per storey and the roof deck, air between (lamps on the floors)
    put(x, Y.plinth, z, "smooth_stone");
    put(x, Y.floor, z, "smooth_stone");
    put(x, Y.roof, z, "stone");
    if ((x * 2 + z) % 2 === 0) put(x, 1, z, "lantern", { hanging: "false" });            // shop light
    if ((x + 2 * z) % 3 === 0) put(x, Y.floor + 1, z, "lantern", { hanging: "false" }); // upper room light
    continue;
  }
  // base course, then the envelope storey by storey
  put(x, Y.plinth, z, "stone_bricks");
  // ground storey: a door on the front, dark oak piers, glazing between
  if (x === DOOR[0] && z === DOOR[1]) {
    const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
    put(x, 1, z, "dark_oak_door", { ...door, half: "lower" });
    put(x, 2, z, "dark_oak_door", { ...door, half: "upper" });
  } else for (let y = 1; y <= Y.gTop; y++) {
    put(x, y, z, corner || (x + z) % 4 === 0 ? "polished_andesite" : "glass_pane");   // stone pilasters, not timber, so the glazing reads
  }
  put(x, Y.fascia, z, "dark_oak_planks");              // shop fascia band
  put(x, Y.floor, z, "quartz_block");                  // string course
  // upper storey: checkerboard sashes between red brick piers, quartz sills
  const sash = !corner && (x + z) % 2 === 0;
  for (let y = Y.sill; y <= Y.uTop; y++) {
    if (sash) put(x, y, z, y === Y.sill ? "quartz_slab" : "glass_pane", y === Y.sill ? { type: "bottom", waterlogged: "false" } : undefined);
    else put(x, y, z, "bricks");
  }
  put(x, Y.roof, z, "quartz_block");                   // parapet cap
}

// the front crest and the roof's AC plant
for (const x of [3, 4, 5]) put(x, H, DOOR[1], "quartz_block");
for (const x of [1, 2]) g.set(x, H, 5, "iron_block");

// glass panes join their neighbours (a solid or a pane beside them), so the sashes read as glazing
for (const [x, y, z] of glass) {
  const link = (dx, dz) => (g.get(x + dx, y, z + dz) ? "true" : "false");
  g.set(x, y, z, "glass_pane", { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0) });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572184.nbt");
