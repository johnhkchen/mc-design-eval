// DC74022: a two-storey red-brick commercial block with a shopfront on its street (east) face, a stone plinth,
// string course and cornice, and a lower rear wing. Footprint and lidar roof come from DC74022.cells.json.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC74022.cells.json`, "utf8"));   // [x, z, ground, roof]

const BRICK = "bricks", STONE = "stone_bricks", TRIM = "smooth_sandstone", ROOF = "smooth_stone", GLASS = "glass_pane";
const inside = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => inside.has(`${x},${z}`);
// lidar roofs are 4 or 5 blocks; smoothed into two flat tiers: the street block at 5, the west side and rear wing at 4
const topOf = (x, z) => (x < 2 && z >= 3 ? 4 : 5);
// a cell on the outside of the footprint (a face is open to the street, the rear or the sky)
const ring = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([3, 17, 8]);
for (const [x, z] of cells) {
  const top = topOf(x, z), cap = top - 1, edge = ring(x, z);
  g.set(x, 0, z, STONE);                                   // plinth, the lowest course
  g.set(x, cap, z, edge ? TRIM : ROOF);                    // cornice on the outside, roof surface inside
  if (!edge) { g.set(x, 2, z, ROOF); continue; }           // inside: a floor slab, air above and below it
  g.set(x, 2, z, TRIM);                                    // string course between the storeys
  for (const y of [1, 3]) {
    if (y >= cap) continue;
    let b = BRICK;
    // east (street) face: shop glass with a pier at each end, the door in the middle bay, upper windows
    if (x === 2) {
      if (y === 1 && [1, 2, 4, 5].includes(z)) b = GLASS;
      if (y === 3 && [1, 2].includes(z) && top === 5) b = GLASS;
    }
    // west face: two windows a side, backed by the air gap
    if (x === 0 && [1, 2].includes(z)) {
      if (y === 1) b = GLASS;
      if (y === 3 && top === 5) b = GLASS;
    }
    g.set(x, y, z, b);
  }
}

// the entrance: a dark oak door in the street face (east), facing out
g.set(2, 1, 3, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(2, 2, 3, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });

// warm light behind the glass (in the air gap), and a brick chimney with a copper vent on the roof
g.set(1, 1, 2, "lantern", { hanging: "false", waterlogged: "false" });
g.set(1, 1, 5, "lantern", { hanging: "false", waterlogged: "false" });
g.set(1, 3, 1, "glowstone");
g.set(0, 5, 0, BRICK);
g.set(0, 6, 0, BRICK);
g.set(1, 5, 1, "copper_block");

const out = `${DIR}/DC74022.nbt`;
const r = g.save(out);
console.log(`wrote ${out}: ${r.blocks} blocks, palette ${r.palette}`);
