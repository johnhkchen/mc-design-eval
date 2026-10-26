// DC53997: 14th St NW (Columbia Heights, 20009), a 1920s brick and stone commercial block. Ground-floor shopfronts, two
// upper storeys of windows in a red-brick wall, a quartz cornice, and a 14-block parapet on the street front.
// Massing: the lidar roof column smoothed into flat tiers (14 parapet, 12 roof, 11 ends and rear wing, 10 stub, 1 plinth).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC53997.cells.json", "utf8"));
const F_LIST = cells.map(([x, z]) => [x, z]);
const F = new Set(F_LIST.map(([x, z]) => `${x},${z}`));
const inF = (x, z) => F.has(`${x},${z}`);

// Roof tier (blocks above y 0) per footprint cell, smoothed from the lidar column.
function tierOf(x, z) {
  if (z === 7) return 1;                                            // service plinth
  if (z === 6) return x >= 14 && x <= 17 ? 11 : 10;                 // rear wing
  if (z === 0 && x >= 3 && x <= 15) return 14;                      // street parapet
  if (x <= 1 || (x >= 16 && z >= 1)) return 11;                     // ends step down
  return 12;                                                        // main roof
}

// Shell cells have a neighbour outside the footprint; the rest are interior (air, floor slabs, roof slab).
const shell = (x, z) => !(inF(x - 1, z) && inF(x + 1, z) && inF(x, z - 1) && inF(x, z + 1));

// Which face a shell cell shows and its position along that face (bays repeat every 3).
function faceOf(x, z) {
  if (z === 0) return { face: "front", u: x };
  if (!inF(x, z + 1)) return { face: "back", u: x };
  return { face: "side", u: z };
}

// The block a shell cell shows at height y.
function skin(x, y, z, T) {
  const { face, u } = faceOf(x, z);
  const pier = u % 3 === 0;
  if (T >= 4 && y === T - 1) return ["smooth_quartz"];                // coping / top cornice
  if (y === 0) return ["stone_bricks"];                               // base course
  if (y >= 12) return ["bricks"];                                     // parapet body
  if (y === 3 || y === 4 || y === 7 || y === 8 || y === 11) return ["smooth_quartz"];   // fascia, sills, heads, cornice
  if (y <= 2) return pier ? ["dark_oak_planks"] : ["glass"];          // shopfronts
  if (pier) return ["bricks"];                                        // upper red-brick pilasters
  const pane = face === "side"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  return ["glass_pane", pane];                                        // upper windows
}

const g = new Voxels([19, 26, 8]);
for (const [x, z] of F_LIST) {
  const T = tierOf(x, z);
  for (let y = 0; y < T; y++) {
    if (shell(x, z)) {
      const [block, state] = skin(x, y, z, T);
      g.set(x, y, z, block, state);
    } else if (y === 0 || y === 4 || y === 8) {
      g.set(x, y, z, "oak_planks");                                   // floor slab per storey
    } else if (y === T - 1) {
      g.set(x, y, z, "stone");                                        // flat roof
    }
  }
}

// Street entrance on the centre pier, with a fascia over it.
g.set(9, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(9, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// Warm lights behind glass and in the shop.
g.set(4, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
g.set(13, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
g.set(4, 5, 1, "glowstone");
g.set(13, 5, 1, "glowstone");
g.set(7, 9, 1, "shroomlight");
g.set(16, 9, 1, "shroomlight");

// Roof plant: a light-grey mechanical box on the main roof.
for (const x of [5, 6]) for (const z of [2, 3]) for (const y of [12, 13]) g.set(x, y, z, "light_gray_concrete");

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC53997.nbt");
console.log(JSON.stringify(stats));
