// Bedroom 2 (teen room), inner air [19,6,12,22,8,16]. Door (20,6..7,17) from the west passage on the south wall;
// window (20..21,6..8,11) on the north wall. Interior designer: one desk workstation on the west wall (focal, under the
// hanging lantern), a chair, a cabinet with flower pots on the east side, and two hanging lanterns for light.
// Palette has no bed, carpet, bookshelf, barrel or monitor, so the bed and those items are left out (see plan.md Notes).
// The 2-high path runs from the door (20,16) across to the desk and the chair; nothing sits over the door or window.
export function build(g) {
  // desk: three oak fence legs under a row of closed dark oak trapdoors (a plate at y=7)
  for (let z = 12; z <= 14; z++) {
    g.set(19, 6, z, "oak_fence", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    g.set(19, 7, z, "dark_oak_trapdoor", { facing: "east", half: "bottom", open: "false", powered: "false", waterlogged: "false" });
  }
  // chair at the desk's east side, seat facing the desk (west)
  g.set(20, 6, 13, "oak_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
  // cabinet on the east wall: dark oak planks base with three flower pots on top (the top is not a floor to stand on)
  for (let z = 14; z <= 16; z++) {
    g.set(22, 6, z, "dark_oak_planks");
    g.set(22, 7, z, "flower_pot");
  }
  // hanging lanterns from the ceiling: one over the desk (the focal spot), one in the middle of the room
  g.set(19, 8, 13, "lantern", { hanging: "true", waterlogged: "false" });
  g.set(20, 8, 14, "lantern", { hanging: "true", waterlogged: "false" });
}
