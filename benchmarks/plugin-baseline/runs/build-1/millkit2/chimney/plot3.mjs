// Plot 3 (pyramid cottage): hearth in the kitchen's west wall (spine), flue at x42 z12, 3x3 brick stack above the attic floor.
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
const g = load("v1.nbt");
const B = "bricks";
// 1. the old crown, hay, campfire and the stack's last course
for (let x = 40; x <= 43; x++) for (let z = 11; z <= 14; z++) for (let y = 14; y <= 17; y++) g.set(x, y, z, "air");
for (let x = 41; x <= 42; x++) for (let z = 12; z <= 13; z++) g.set(x, 13, z, "air");
// 2. the hearth: hay in the floor, fire at floor level, mouth open east into the kitchen, lintel over it
g.set(42, 2, 12, "hay_block", { axis: "y" });
g.set(42, 3, 12, "campfire", { lit: "true", signal_fire: "true", facing: "east", waterlogged: "false" });
g.set(43, 3, 12, "air");
g.set(43, 4, 12, "brick_stairs", { facing: "west", half: "top", shape: "straight", waterlogged: "false" });
// 3. the stack: 3x3 masonry (x41..43, z11..13) from the room's chimney breast to y12, 1x1 flue of air at 42,z12
for (let y = 5; y <= 12; y++) {
  for (let x = 41; x <= 43; x++) for (let z = 11; z <= 13; z++) {
    if (y <= 6 && !(x === 43 && z === 12)) continue;       // below the vault the spine already walls the flue
    g.set(x, y, z, B);
  }
}
g.set(43, 4, 12, "brick_stairs", { facing: "west", half: "top", shape: "straight", waterlogged: "false" });
for (let y = 4; y <= 12; y++) g.set(42, y, 12, "air");
g.save("chimney/plot3.nbt");
