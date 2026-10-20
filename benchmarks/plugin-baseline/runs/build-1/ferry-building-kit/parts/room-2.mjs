// Room: entrance hall. The double-height civic hall behind the three tall arches (box x 11..35, z 3..14, y 1..21; the
// landing deck at y 22 is its ceiling). Layout: the doorways open onto a clear centre lane (x 22..24) and a clear
// row at z 3..4 (nothing in a doorway's first cell). The focal piece is the ticket counter pair on the back wall,
// flanking the nave arch (x 21..25 left open). Benches are grey stairs with their backs to the side walls. Lanterns
// hang on chains from the deck at y 4 (above head height), a 5 x 3 grid so the floor stays lit at feet level.
import { hangLamp } from "../vocab.mjs";

export function build(g) {
  // benches: stair seats, back to the side walls (facing = the side of the full-height back)
  for (const z of [6, 7, 8, 10, 11, 12]) {
    g.set(11, 1, z, "polished_andesite_stairs", { facing: "west", half: "bottom", shape: "straight" });
    g.set(35, 1, z, "polished_andesite_stairs", { facing: "east", half: "bottom", shape: "straight" });
  }

  // focal piece: ticket counters (barrel stock under a counter top) either side of the nave arch, on the back wall
  for (const x0 of [17, 26]) {
    for (let x = x0; x < x0 + 4; x++) g.set(x, 1, 13, "barrel", { facing: "up", open: "false" });
  }

  // lanterns on chains from the deck (y 22), at y 4 over the lanes: lit at feet level, clear of every head
  for (const x of [13, 18, 23, 28, 33]) {
    for (const z of [5, 9, 13]) hangLamp(g, x, 4, z, { maxChain: 18 });  // the deck is 18 above the lamp
  }
}
