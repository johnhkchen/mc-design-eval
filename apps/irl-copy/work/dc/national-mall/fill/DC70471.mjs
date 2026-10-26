// 1326 14th St NW: a Commercial-Restaurant in the Logan Circle brick row (c. 1890-1910 Romanesque/Renaissance
// Revival). Front (z=0) is a three-storey pressed-brick false front with a shopfront at grade; the rear (z=1..2) is a
// two-storey wing stepping down to the lidar's 4-6 band; the east end rises as a tower (x=14..15) that sets back from
// the street front, the lidar's 17-18 read as a podium with two setback tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70471.cells.json", "utf8"));
const W = 17, D = 3, H = 30;

// The massing: lidar roof per cell, smoothed into clean tiers (values are block counts above y 0; the top layer is the cap).
function topOf(x, z) {
  if (z === 0) {                       // street front: 3-storey false front, lower at the corner, tower tiers at the east end
    if (x <= 1) return 6;
    if (x <= 13 || x === 16) return 10;
    return 13;                          // tower tier A, set back from the front
  }
  if (x === 14 || x === 15) return 18;  // tower tier B, stepped back to the rear half
  return 6;                             // rear wing, the lidar's 4-6 band
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => { if (y >= 0 && y < H) g.set(x, y, z, b, s); };

const GLASS_PANE = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const DOOR_S = { facing: "north", hinge: "left", open: "false", powered: "false" };
const SLAB_TOP = { type: "top", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };

// The bays of the street and rear faces: piers at x = 0,1,4,7,10,13,16; windows at the pairs between.
const isPier = (x) => [0, 1, 4, 7, 10, 13, 16].includes(x);
const isDoor = (x, z, y) => z === 0 && x === 5 && (y === 1 || y === 2);

// Each cell's column: body up to its top, interior air in the bays, floors per storey, glazing, cap.
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const T = topOf(x, z);
  const tower = x === 14 || x === 15;
  for (let y = 0; y < T; y++) {
    const cap = y === T - 1;
    // the middle row is interior: air between floors in the body and the tower, not in the end walls or crown
    const interiorZ1 = z === 1 && x >= 1 && x <= 13 && [1, 2, 4].includes(y);
    const towerZ1 = z === 1 && tower && y < 13 && [1, 2, 4, 5, 7, 8, 10, 11].includes(y);
    if (interiorZ1 || towerZ1) continue;
    if (z === 1 && cap) { put(x, y, z, "smooth_stone"); continue; }                    // roof
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }                              // plinth course
    if (cap && z !== 1) { put(x, y, z, "stone_brick_slab", SLAB_TOP); continue; }         // parapet
    if (cap) { put(x, y, z, "smooth_stone"); continue; }
    if (z === 1) {                                                                          // floors inside
      if (y % 3 === 0) { put(x, y, z, "smooth_sandstone"); continue; }
      put(x, y, z, "bricks"); continue;
    }
    if (y % 3 === 0 || (tower && y === 13)) { put(x, y, z, "smooth_sandstone"); continue; }  // storey lines
    if (x === 0 || x === W - 1) { put(x, y, z, "stone_bricks"); continue; }                // quoined ends
    const bay = !isPier(x) || tower;
    if (isDoor(x, z, y)) { put(x, y, z, "dark_oak_door", { ...DOOR_S, half: y === 1 ? "lower" : "upper" }); continue; }
    if (z === 0 && x >= 4 && x <= 6 && y === 3) { put(x, y, z, "green_terracotta"); continue; }   // awning band
    const ground = y <= 2;
    if (bay && (ground || (y >= 4 && y <= 5) || (y >= 7 && y <= 8) || (y >= 10 && y <= 11) || (tower && y >= 13 && y <= 16))) {
      if (ground && z === 0 && x !== 6) { put(x, y, z, "glass"); continue; }      // shopfront glass
      put(x, y, z, z === 1 ? "bricks" : "glass_pane", GLASS_PANE); continue;
    }
    if (ground && isPier(x) && x !== 0 && x !== 16) { put(x, y, z, "dark_oak_planks"); continue; }  // shop mullions
    put(x, y, z, "bricks");
  }
}

// Lights behind the glass, the roof plant, and the crown lanterns.
put(2, 4, 1, "glowstone");
put(3, 1, 1, "lantern", LANTERN);
put(8, 1, 1, "lantern", LANTERN);
put(12, 1, 1, "lantern", LANTERN);
put(14, 7, 1, "shroomlight");
put(15, 10, 1, "glowstone");
put(8, 6, 1, "copper_block");
put(9, 6, 1, "copper_block");
put(14, 18, 2, "lantern", LANTERN);
put(15, 18, 2, "lantern", LANTERN);

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70471.nbt");
console.log("DC70471", { blocks: g.count(), palette: g.palette.length - 1, cells: cells.length });
