// Part "courtyard": the pools with their rims, the three fountain bowls, the helix, the arch leg plinths, the two
// promenade decks with their columns and the side stair, and the paving of the courtyard and the plaza walks.
// Order matters inside the part: the solid things (fountains, helix, plinths, promenades, stair) go in first, so
// the pool water and the paving only fill the air that is left (the helpers write only into air).
import {
  POOLS, FOUNTAINS, HELIX, ARCHES, PROMENADE, SMOOTH_QUARTZ_SLAB,
  fountain_bowl, helix, leg_plinth, promenade, pool,
} from "../vocab.mjs";

// The side flight up to a deck: 2 wide (x0..x0+1), one step per cell from z0 (foot, y1) to z1 (head), rising to the
// south. smooth_quartz_stairs facing south on smooth_quartz that fills down to the floor. (The vocab's flight uses
// quartz_stairs, which is not on the palette.)
function flight(g, [x0, z0, z1]) {
  for (let i = 0; i <= z1 - z0; i++) {
    const z = z0 + i, top = 1 + i;
    for (let x = x0; x <= x0 + 1; x++) {
      for (let y = 1; y < top; y++) g.set(x, y, z, "smooth_quartz", {});
      g.set(x, top, z, "smooth_quartz_stairs", { facing: "south", half: "bottom" });
    }
  }
}

// Paving: smooth_quartz_slab, bottom half, on the walk level y1, into air only (anything already built stays).
// A box is inclusive [x0, z0, x1, z1].
function pave(g, [x0, z0, x1, z1]) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!g.isAir(x, 1, z)) continue;
    g.set(x, 1, z, SMOOTH_QUARTZ_SLAB, { type: "bottom" });
  }
}

// The flower-shaped fountain bowl, 7x7 on [cx, cz]: a quartz_pillar stem y1..3 through the bowl, the bowl at y3 as four
// 3-wide petals (cardinal) and four single diagonal petals, a lip of smooth_quartz_stairs round every edge cell
// (backs toward the centre, so the rim steps down outward like a petal tip), smooth_quartz_slab inside, a full
// smooth_quartz block on each diagonal petal, and the water source on top of the stem at y4.
function flowerBowl(g, cx, cz) {
  const inFlower = (dx, dz) => Math.abs(dx) <= 3 && Math.abs(dz) <= 3 &&
    (Math.abs(dx) <= 1 || Math.abs(dz) <= 1 || (Math.abs(dx) === 2 && Math.abs(dz) === 2));
  for (let y = 1; y <= 3; y++) g.set(cx, y, cz, "quartz_pillar", { axis: "y" });
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    if (!inFlower(dx, dz) || (dx === 0 && dz === 0)) continue;
    const x = cx + dx, z = cz + dz;
    if (!g.isAir(x, 3, z)) continue;
    const edge = !inFlower(dx - 1, dz) || !inFlower(dx + 1, dz) || !inFlower(dx, dz - 1) || !inFlower(dx, dz + 1);
    if (Math.abs(dx) === 2 && Math.abs(dz) === 2) g.set(x, 3, z, "smooth_quartz", {});
    else if (edge) {
      const facing = Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? "west" : "east") : (dz > 0 ? "north" : "south");
      g.set(x, 3, z, "smooth_quartz_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" });
    } else g.set(x, 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
  if (g.isAir(cx, 4, cz)) g.set(cx, 4, cz, "water", { level: "0" });
}

// A white railing (diorite_wall) on the pool rims that face the central walks, so the walks read as railed paths
// along the water: rim cells at y1 that are smooth_quartz get a wall at y2. A gap every 8 cells lets a player reach
// the rim.
function rimRail(g, cells) {
  const on = new Set();
  for (const [x, z] of cells) {
    if (g.get(x, 1, z)?.block?.replace("minecraft:", "") !== "smooth_quartz" || !g.isAir(x, 2, z)) continue;
    on.add(`${x},${z}`);
  }
  // Joined like a railing: low arms to the neighbouring rail cells, a post only at the run's ends.
  for (const k of on) {
    const [x, z] = k.split(",").map(Number);
    const n = on.has(`${x},${z - 1}`), s = on.has(`${x},${z + 1}`), w = on.has(`${x - 1},${z}`), e = on.has(`${x + 1},${z}`);
    const straight = (n && s && !w && !e) || (w && e && !n && !s);
    g.set(x, 2, z, "diorite_wall", {
      north: n ? "low" : "none", south: s ? "low" : "none", west: w ? "low" : "none", east: e ? "low" : "none",
      up: straight ? "false" : "true", waterlogged: "false",
    });
  }
}

export function build(g) {
  // 1. Fountain bowls (their pedestals stand in the pools, so they go before the water).
  // The main (NW) pool's bowl is the flower; the other two keep the round saucer.
  flowerBowl(g, FOUNTAINS.NW.cx, FOUNTAINS.NW.cz);
  for (const f of [FOUNTAINS.SW, FOUNTAINS.SE]) fountain_bowl(g, f.cx, f.cz);

  // 2. The helix in the NE pool.
  helix(g, HELIX[0], HELIX[2], { y: HELIX[1], height: HELIX[4] - HELIX[1] + 1 });

  // 3. Leg plinths: a 4x4 smooth_quartz at y1 round each 2x2 arch leg (one cell out on every side).
  for (const arch of Object.values(ARCHES)) {
    for (const [lx, lz] of arch.legs) leg_plinth(g, lx - 1, lz - 1);
  }

  // 4. Promenades: the east deck (columns at x59, z80..152) and the south deck (columns at z157, x8..56).
  const eCols = Array.from({ length: 10 }, (_, k) => [59, 80 + 8 * k]);
  const sCols = Array.from({ length: 7 }, (_, k) => [8 + 8 * k, 157]);
  promenade(g, [PROMENADE.E[0], PROMENADE.E[2], PROMENADE.E[3], PROMENADE.E[5]], eCols);
  promenade(g, [PROMENADE.S[0], PROMENADE.S[2], PROMENADE.S[3], PROMENADE.S[5]], sCols);
  // The side flight up to the south deck, x52..53, z148..156.
  flight(g, [PROMENADE.stair[0], PROMENADE.stair[2], PROMENADE.stair[5]]);

  // 5. The four pools: rim smooth_quartz, water 1 deep inside. Cells already solid (plinths, fountains, helix)
  // are refused by the helper and keep what they are.
  for (const [x0, z0, x1, z1] of Object.values(POOLS)) pool(g, [x0, z0, x1, z1], 1);

  // 5b. Railings along the pools on the central walks: the rims x29 / x34 (both north and south pools) and the rims
  // z110 / z115 (the E-W walk), with a gap every 8 cells.
  const rail = [];
  for (let z = 82; z <= 152; z++) if (z % 8 !== 4 && (z <= 110 || z >= 115)) rail.push([29, z], [34, z]);
  for (let x = 8; x <= 55; x++) if (x % 8 !== 4 && (x <= 29 || x >= 34)) rail.push([x, 110], [x, 115]);
  rimRail(g, rail);

  // 6. Courtyard paving: every courtyard cell that is not pool or solid (the walks, the perimeter, under the arches).
  pave(g, [4, 76, 59, 159]);

  // 7. Plaza walks: the street-to-dome walk x16..23 (north of the dome drum and south of its porch). The dome's drum
  // and porch are other parts' cells, so they are left alone.
  pave(g, [16, 0, 23, 17]);
  pave(g, [16, 57, 23, 75]);
}
