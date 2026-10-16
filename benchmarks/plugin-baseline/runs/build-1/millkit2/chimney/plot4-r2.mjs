// Plot 4 boarding house, round 2. Exterior-set chimney on the west gable wall (x49 is the wall line; x47 belongs to
// plot 3, so the flue stays in the wall line with its outside face one cell proud at x48).
//   fire 49,3,13 (hay at 49,2,13), mouth 50,3,13 with a brick lintel at 50,4,13; flue x49 z13 up to y18.
//   Below the roof the flue's walls: x48 brick (outside), 49,z12 / 49,z14 the house wall, x50 z13 a brick hood y5-6,
//   the partition wall y8-11. From y12 up (attic / roof) every wall is the chimney's own brick; roof stops against it.
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import path from "node:path";
const D = path.resolve(import.meta.dirname, "..");
const g = load(`${D}/v3.nbt`);
const B = "bricks", TOP = 18;
const name = (x, y, z) => (g.get(x, y, z)?.block ?? "air").replace("minecraft:", "");
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);
const air = (x, y, z) => g.set(x, y, z, "air");

// 0. clear the old chimney: iron trapdoors, cobble breast, old hay/campfire
for (let x = 48; x <= 50; x++) for (let z = 11; z <= 15; z++) for (let y = 1; y <= 19; y++) {
  const b = name(x, y, z);
  if (/iron_trapdoor|cobblestone|campfire|hay_block/.test(b)) air(x, y, z);
}
// 1. give the walls and floors back where the old breast stood (templates: the plain wall at x49 z11, floor at x50 z11)
for (let y = 2; y <= 11; y++) {
  const t = g.get(49, y, 11);
  for (const z of [12, 14]) if (t) put(49, y, z, t.block, t.state);
}
for (let y = 2; y <= 11; y++) { // x50 z12 was in the room: floor planks at y2/y7, air above
  if (y === 2 || y === 7) { const t = g.get(50, y, 11); put(50, y, 12, t.block, t.state); } else air(50, y, 12);
}
{ const t = g.get(50, 7, 11); put(50, 7, 13, t.block, t.state); }   // the floor under the hood's column
{ const t = g.get(50, 2, 11); put(50, 2, 13, t.block, t.state); }
// 2. the hearth: hay in the floor, lit signal fire in the wall line, mouth east into the kitchen
put(49, 2, 13, "hay_block", { axis: "y" });
put(49, 3, 13, "campfire", { lit: "true", signal_fire: "true", facing: "east", waterlogged: "false" });
for (const z of [12, 14]) put(49, 3, z, B);                       // firebox jambs
put(48, 3, 13, B);
air(50, 3, 13);                                                   // the mouth
put(50, 4, 13, "brick_stairs", { facing: "west", half: "top", shape: "straight", waterlogged: "false" });
for (const y of [5, 6]) put(50, y, 13, B);                        // hood over the mouth, above head height
for (const y of [8, 9, 10, 11]) put(50, y, 13, "mangrove_planks");// room side of the flue upstairs: the partition line
// 3. the outside face: brick 3 wide (z12..14) from the ground to the top, one cell proud of the wall
for (let y = 1; y <= TOP; y++) for (const z of [12, 13, 14]) put(48, y, z, B);
// 4. the flue: air from the course above the fire to the top
for (let y = 4; y <= TOP; y++) air(49, y, 13);
// 5. from the attic up: the stack is its own brick, a 3x3 around the flue (the roof stops against it)
for (let y = 12; y <= TOP; y++) for (const x of [49, 50]) for (const z of [12, 13, 14]) {
  if (x === 49 && z === 13) continue;
  if (x === 50 && z !== 13 && y < 14) continue;                   // corners only where the stack leaves the roof
  put(x, y, z, B);
}
g.save(`${D}/chimney/plot4-r2.nbt`);
console.log("saved");
