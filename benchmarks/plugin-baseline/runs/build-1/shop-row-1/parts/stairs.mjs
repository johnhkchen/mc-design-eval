// Stairs: flight 1 (stair lobby to landing 1) and flight 2 (landing 1 to landing 2) in the stair bay, x 22..23, rising north.
import { flight } from "../vocab.mjs";
import { DARK_OAK_FENCE } from "../vocab/base.mjs";

export function build(g) {
  flight(g, 22, 7, 12, 15, "north", { width: 2 });   // steps y 7..12 at z 15..10, arrives on the y 13 landing at z 9
  flight(g, 22, 14, 17, 15, "north", { width: 2 });  // steps y 14..17 at z 15..12, arrives on the y 18 landing at z 11
  // rails round the wells on the floors above, leaving x 25 free to walk round and the top steps open
  for (let z = 10; z <= 15; z++) g.set(24, 14, z, DARK_OAK_FENCE);
  for (let z = 12; z <= 16; z++) g.set(24, 19, z, DARK_OAK_FENCE);
  for (const x of [22, 23]) g.set(x, 19, 17, DARK_OAK_FENCE);
}
