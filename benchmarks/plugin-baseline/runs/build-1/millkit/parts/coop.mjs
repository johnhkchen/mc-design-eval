// Plot 5 hen house (v2): a raised spruce house x 64..69, z 11..16 on cobblestone stilts (floor y 2, walls y 3..5), a
// ramp up to the keeper door and a pop-hole with a chicken ramp, nesting boxes and a roost inside, a covered feed
// shed (x 61..64, z 7..9) with troughs, all inside the run fence (x 60..71). The gable roof is the roof part's (y 6).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = /(^|:)(cave_|void_)?air$/;
function put(g, x, y, z, block, state) {
  if (!g.inBounds(x, y, z) || !AIR.test(g.blockAt(x, y, z))) return 0;
  g.set(x, y, z, block, state);
  return 1;
}

export const HEN = { x0: 64, x1: 69, z0: 11, z1: 16 };

export function henhouse(g) {
  const { x0, x1, z0, z1 } = HEN;
  // stilts: corners and the middle of the long sides, cobblestone y 1 (open air between, the hens shelter under it)
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [x0, 13], [x1, 13], [x0, 14], [x1, 14]]) put(g, x, 1, z, (x + z) % 7 === 0 ? "mossy_cobblestone" : "cobblestone");
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) put(g, x, 2, z, "spruce_planks");
  // doors first, so the walls leave them air: keeper door x 66 (y 3..4), pop-hole x 68 (y 3), vent window x 64..., rear vent
  put(g, 66, 3, z0, ...B.door("spruce", "north", "lower", "left"));
  put(g, 66, 4, z0, ...B.door("spruce", "north", "upper", "left"));
  const holes = new Set(["68,3,11", "64,4,13", "69,4,13", "66,4,16"]);
  for (let y = 3; y <= 5; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x > x0 && x < x1 && z > z0 && z < z1) continue;
    if (holes.has(`${x},${y},${z}`)) continue;
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    put(g, x, y, z, corner ? "stripped_spruce_log" : "spruce_planks", corner ? { axis: "y" } : undefined);
  }
  // glass in the three vents (west, east, back)
  put(g, 64, 4, 13, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  put(g, 69, 4, 13, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  put(g, 66, 4, 16, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  // nesting boxes along the back wall (z 15): hay and barrels alternate, lantern on a barrel
  for (let x = 65; x <= 68; x++) put(g, x, 3, 15, x % 2 === 0 ? "hay_block" : "barrel", x % 2 === 0 ? { axis: "y" } : { facing: "up", open: "false" });
  // roost: a stripped log bar across the room at y 5 (both ends in the walls), clear of the walk at y 3..4
  for (let x = 65; x <= 68; x++) put(g, x, 5, 13, "stripped_spruce_log", { axis: "x" });
  // ramps: stairs rising south, y 1 at z 9 and y 2 at z 10, up to the door (x 66) and the pop-hole (x 68)
  for (const x of [66, 68]) {
    put(g, x, 1, 9, ...B.stairs("spruce", "south", "bottom"));
    put(g, x, 2, 10, ...B.stairs("spruce", "south", "bottom"));
  }
  // rails along the keeper ramp
  for (const x of [65, 67]) put(g, x, 2, 10, "spruce_fence", { north: "false", south: "true", east: "false", west: "false", waterlogged: "false" });
}

export function feedShed(g) {
  // four posts, a flat slab roof, two troughs under it
  for (const x of [61, 64]) for (const z of [7, 9]) for (let y = 1; y <= 3; y++) put(g, x, y, z, "stripped_spruce_log", { axis: "y" });
  for (let x = 61; x <= 64; x++) for (let z = 7; z <= 9; z++) put(g, x, 4, z, ...B.slab("spruce", "bottom"));
}
