// Core, elevators and Pavilion (P2): the 7x7 lattice core with its tie bands, the two glass elevator shafts (the gold car
// last), the core ladder on the spine, the Pavilion (floor, glass wall, mullions, band, roof), the approach ramp and the
// doorway cuts. Writes only into air; the core doorways at each floor are left open for the other parts.
import { circleCells, carve } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { coreLattice, coreBand, elevatorShaft, ringWall, mullion, pavilionRamp, LEG_TIE_Y } from "../vocab.mjs";

const AXIS = [32, 32];
// The core's north doorways (plan.md OPENINGS): x 31..33 at z 29, these y ranges.
const DOORS = [[2, 4], [43, 45], [213, 215], [219, 221]];

// Writes block into the air cells of the plan's ring at radius r (r-1 < d <= r) or disc (d <= r), skipping the open shaft.
function airRing(g, r, y, block, { disc = false, skip = () => false } = {}) {
  const inner = new Set(circleCells(r - 1, { center: AXIS }).map(([x, z]) => `${x},${z}`));
  for (const [x, z] of circleCells(r, { center: AXIS })) {
    if (!disc && inner.has(`${x},${z}`)) continue;
    if (skip(x, z) || !g.isAir(x, y, z)) continue;
    g.set(x, y, z, ...(Array.isArray(block) ? block : [block]));
  }
}

// Sea lanterns replacing smooth_quartz floor/roof cells on the ring of radius r at y, every stepDeg from startDeg.
function lampRing(g, r, y, stepDeg, startDeg) {
  for (let a = startDeg; a < startDeg + 360; a += stepDeg) {
    const x = Math.round(AXIS[0] + r * Math.sin((a * Math.PI) / 180)), z = Math.round(AXIS[1] - r * Math.cos((a * Math.PI) / 180));
    if (g.blockAt(x, y, z) === "minecraft:smooth_quartz") g.set(x, y, z, "sea_lantern", {});
  }
}

export function build(g) {
  // The core: lattice (posts, bars, the open 5x5 shaft, doorways left empty), then the white tie bands at each tie level.
  coreLattice(g, { axis: AXIS, y0: 1, y1: 222, doors: DOORS });
  for (const y of LEG_TIE_Y) coreBand(g, y);

  // Elevators: glass shafts on the north face; the gold car written last over the east shaft's glass.
  elevatorShaft(g, 29);
  elevatorShaft(g, 34, { car: true });

  // The core is climbed by the spiral emergency stair (parts/stairs.mjs), which now takes the old ladder's cells.
  // Core lights: a sea lantern in each corner post every 12 (y7, 19, ... 211).
  for (let y = 7; y <= 211; y += 12)
    for (const [x, z] of [[29, 29], [35, 29], [29, 35], [35, 35]]) if (g.blockAt(x, y, z) === "minecraft:white_concrete") g.set(x, y, z, "sea_lantern", {});

  // Pavilion: floor disc r<=14 at y1 (its shaft cells get the floor too, so the doorway opens onto a walkable floor).
  airRing(g, 14, 1, ["smooth_quartz", {}], { disc: true });

  // Glass wall r=14 at y2..6, white band at y7, 12 white mullions every 30 deg from 15 deg, then the door and its cut.
  ringWall(g, 14, 2, 6, "glass");
  ringWall(g, 14, 7, 7, "white_concrete");
  mullion(g, 14, 2, 7, 30, 15);
  carve(g, [31, 2, 18], [33, 4, 18]);

  // Roof: smooth_quartz disc r<=14 at y8 over the Pavilion, the shaft left open; the rim ring r=15 is a top slab (the eave).
  const shaft = (x, z) => x >= 30 && x <= 34 && z >= 30 && z <= 34;
  airRing(g, 14, 8, ["smooth_quartz", {}], { disc: true, skip: shaft });
  airRing(g, 15, 8, ["smooth_quartz_slab", { type: "top", waterlogged: "false" }]);

  // Pavilion lights: hidden lanterns in the floor (r 6 and 11, every 45 deg) and in the roof flat (r 5 and 11).
  lampRing(g, 6, 1, 45, 0); lampRing(g, 11, 1, 45, 22.5);
  lampRing(g, 5, 8, 60, 0); lampRing(g, 11, 8, 45, 22.5);

  // The approach: the full landing and the slab ramp round to the north-west.
  pavilionRamp(g, { axis: AXIS, y: 1 });
}
