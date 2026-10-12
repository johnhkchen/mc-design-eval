// PART 2: PORCH + OPENINGS (every house window with shutters, the doors, the timber lean-to porch on the garden side, steps, lanterns).
// Ticks elements.md: E3 (shuttered windows), E6 (timber porch), E7 (doors + steps), E8 (lanterns on the house).
// Import from ../vocab.mjs: OPENINGS, window, door, BEAM, BOARD, lantern, lamp, chair, pot, B.
//
// BUILD, in this order (x=0..19 only; never write x>=20, the garden wall is part 3; never write y>=8):
//  1. OPENINGS: for every OPENINGS entry with kind "window" and x in 1..15, z in 11..19 call window(g, o); for kind "door" in the house
//     (the front door (8,2,11) and the east door (15,2,15)) call door(g, o). Skip kind doorway, gate and the garden ones (x>=20).
//     The east windows (x=15, z=13 and 17) sit under the porch roof: call them with window(g, {...o, shutters:false}) if a shutter cell is taken.
//  2. FRONT STOOP at the front door (8,2,11), outside it at z=10 on ground y=0: B.slab("stone_brick","bottom") at (8,1,10), stone_bricks at (7,1,10) and (9,1,10).
//     Door lamps: lamp(g, 6, 1, 10, 2) and lamp(g, 10, 1, 10, 2).
//  3. PORCH, footprint x=16..18, z=12..18:
//     - floor: BOARD (spruce_planks) at y=1 over x=16..18, z=12..18 (walk at y=2).
//     - posts: dark_oak_log axis y (B.log("dark_oak","y")) at x=18, z=12,14,16,18, y=2..3. The gap at z=15 is the entrance.
//     - rails: B.fence("spruce") at (18,2,13) and (18,2,17); and along the ends at z=12 and z=18 for x=16..17, y=2.
//     - beam: B.log("dark_oak","z") at (18,4,z) for z=12..18.
//     - roof (lean-to rising west to the house wall): B.stairs("spruce","west") at (19,4,z), (18,5,z), (17,6,z), (16,7,z) for z=12..18.
//       Underside: spruce_planks at (17,5,z), (16,5,z), (16,6,z) for z=12..18 so the ceiling is closed.
//     - lanterns: lantern(g,18,3,13,true) and lantern(g,18,3,17,true) hang from the beam.
//     - steps: B.stairs("cobblestone","west") at (19,1,15).
//     - furniture: two seats against the house wall looking east to the garden: chair(g,16,2,13,"east"), chair(g,16,2,17,"east"); barrel at (16,2,12) (g.set(16,2,12,"barrel",{facing:"up",open:"false"})); pot(g,16,2,18,"potted_red_tulip").
// Check: render the front-right iso (porch + shutters must read) and the east elevation; the porch roof must stop at y=7.
import { OPENINGS, window, door, BEAM, BOARD, lantern, lamp, chair, pot, B } from "../vocab.mjs";

const inHouse = (o) => o.x >= 1 && o.x <= 15 && o.z >= 11 && o.z <= 19;

export function build(g) {
  // 1. every window and door of the house (garden doors and gates belong to the garden parts)
  for (const o of OPENINGS) {
    if (!inHouse(o)) continue;
    if (o.kind === "window") {
      // east windows (x=15) stand over the porch seats: the sill cell is the seat's cell, so no sill there
      window(g, o.x === 15 ? { ...o, sill: false } : o);
    } else if (o.kind === "door") door(g, o);
  }

  // 2. front stoop and the two door lamps
  g.set(8, 1, 10, ...B.slab("stone_brick", "bottom"));
  g.set(7, 1, 10, "stone_bricks");
  g.set(9, 1, 10, "stone_bricks");
  lamp(g, 6, 1, 10, 2);
  lamp(g, 10, 1, 10, 2);

  // 3. timber lean-to porch on the garden side
  g.fill([16, 1, 12], [18, 1, 18], BOARD);
  for (const z of [12, 14, 16, 18]) for (const y of [2, 3]) g.set(18, y, z, ...B.log("dark_oak", "y"));
  for (let z = 12; z <= 18; z++) g.set(18, 4, z, ...B.log("dark_oak", "z"));
  // rails: the ends skip (16,2,12) (barrel) and (16,2,18) (pot); the entrance gap is z=15
  for (const [x, z] of [[18, 13], [18, 17], [17, 12], [17, 18]]) g.set(x, 2, z, ...B.fence("spruce"));
  for (let z = 12; z <= 18; z++) {
    g.set(19, 4, z, ...B.stairs("spruce", "west"));
    g.set(18, 5, z, ...B.stairs("spruce", "west"));
    g.set(17, 6, z, ...B.stairs("spruce", "west"));
    g.set(16, 7, z, ...B.stairs("spruce", "west"));
    g.set(17, 5, z, BOARD); g.set(16, 5, z, BOARD); g.set(16, 6, z, BOARD);
  }
  lantern(g, 18, 3, 13, true);
  lantern(g, 18, 3, 17, true);
  g.set(19, 1, 15, ...B.stairs("cobblestone", "west"));
  chair(g, 16, 2, 13, "east");
  chair(g, 16, 2, 17, "east");
  g.set(16, 2, 12, "barrel", { facing: "up", open: "false" });
  pot(g, 16, 2, 18, "potted_poppy");
}
