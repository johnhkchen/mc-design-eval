// The winding approach road up the crag front to the gate: a stair-ramp that snakes in z, with a low outer parapet and lanterns.
import { B, DY } from "./shared.mjs";
const put = (g, x, y, z, ...b) => { if (g.inBounds(x, y, z)) g.set(x, y, z, ...b); };
export function frontRoad(g) {
  const gateY = 10 + DY - 5;                              // y of the causeway's lowest row (z=0)
  const x0 = 32, x1 = 50;
  for (let x = x0; x <= x1; x++) {
    const y = gateY - 1 - (x1 - x);
    const zc = x >= x1 - 2 ? 1 : 1 + Math.round(1.1 + 1.1 * Math.sin((x - x0) * 0.42));   // snakes between z=1 and z=3
    for (const z of [zc, zc + 1]) {
      for (let h = 1; h <= 3; h++) g.unset(x, y + h, z);
      for (let yy = y - 1; yy >= 0; yy--) { if (!g.isAir(x, yy, z)) break; g.set(x, yy, z, "stone_bricks"); }
      put(g, x, y, z, ...B.stairs("stone_brick", "east"));
    }
    // outer (front) parapet with lantern posts
    const pz = zc - 1;
    for (let yy = y - 1; yy >= 0; yy--) { if (!g.isAir(x, yy, pz)) break; g.set(x, yy, pz, "stone_bricks"); }
    g.set(x, y, pz, "stone_bricks"); g.set(x, y + 1, pz, ...B.wall("stone_brick"));
    if ((x - x0) % 5 === 2) { put(g, x, y + 2, pz, ...B.wall("stone_brick")); put(g, x, y + 3, pz, ...B.lantern(false)); }
  }
  // join the causeway foot: open the end post and lay the last tread level with the lowest causeway row
  for (const z of [0, 1]) { g.unset(51, gateY + 1, z); g.set(51, gateY, z, "stone_bricks"); }
  g.set(51, gateY - 1, 0, "stone_bricks");
  g.set(51, gateY, 2, "stone_bricks");
}
