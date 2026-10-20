// Stairs and ladders: the emergency stair, a spiral of smooth_quartz_stairs round the core's open 5x5 shaft
// (x30..34, z30..34), rising one block per cell, from the Pavilion floor (y1) to the observation floor (y218). It
// passes through the SkyLine floor (y42) and the saucer floors (y212, y218): this part runs before them, so it lays the
// shaft's floor cells at those levels itself and claims the headroom over every step as air (later parts can't fill it).
// The ring phase puts the step heights so the north doorway cells (31..33, 30) stay clear at every floor.

// The shaft's perimeter ring, clockwise from the north-west corner.
const RING = [
  [30, 30], [31, 30], [32, 30], [33, 30], [34, 30], [34, 31], [34, 32], [34, 33],
  [34, 34], [33, 34], [32, 34], [31, 34], [30, 34], [30, 33], [30, 32], [30, 31],
];
const FLOORS = [42, 212, 218];
const TOP = 218;
const PHASE = 11;                                  // step height s sits on ring cell (s - PHASE) mod 16

function facingTo([x, z], [nx, nz]) {
  if (nx > x) return "east";
  if (nx < x) return "west";
  return nz > z ? "south" : "north";
}

export function build(g) {
  const p = (s) => (((s - PHASE) % 16) + 16) % 16;
  for (let s = 2; s <= TOP; s++) {
    const c = RING[p(s)], next = RING[(p(s) + 1) % 16];
    g.set(c[0], s, c[1], "smooth_quartz_stairs", { facing: facingTo(c, next), half: "bottom", shape: "straight", waterlogged: "false" });
  }
  // Headroom: three cells of air over every step (a step-up keeps jump clearance) (this cuts the floor holes where the stair passes under a floor).
  for (let s = 2; s <= TOP; s++) {
    const c = RING[p(s)];
    for (const h of [1, 2, 3]) if (g.isAir(c[0], s + h, c[1])) g.set(c[0], s + h, c[1], "air");
  }
  // The shaft floors where the stair lands, with a hidden lamp in the middle of each.
  for (const y of FLOORS)
    for (let x = 30; x <= 34; x++) for (let z = 30; z <= 34; z++)
      if (g.isAir(x, y, z) && !g.get?.(x, y, z)) g.set(x, y, z, x === 32 && z === 32 ? "sea_lantern" : "smooth_quartz", {});
}
