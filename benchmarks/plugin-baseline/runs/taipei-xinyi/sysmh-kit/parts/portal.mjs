// P3 south portal: fins, tall columns, lintel, mid beam (plan.md PARTS P3, ROOFS "Fins", FACADES "South portal").
// Builds into air only (runParts locks earlier parts); cells already taken by P1 or P2 are refused and reported.
import { fin, column, portal_lintel, SMOOTH_STONE } from "../vocab.mjs";

const ROOF = { x0: 10, x1: 141, z0: 10, z1: 141 };

// Mid beam over the portal: smooth_stone at y 30..31, z 131..132, x 52..99, into air only.
function midBeam(g) {
  const refused = [];
  for (let x = 52; x <= 99; x++) for (let y = 30; y <= 31; y++) for (let z = 131; z <= 132; z++) {
    if (g.isAir(x, y, z)) g.set(x, y, z, SMOOTH_STONE);
    else refused.push([x, y, z, g.blockAt(x, y, z)]);
  }
  return refused;
}

export function build(g) {
  // Fins: the turned-up roof ends on x 49..51 (west) and 100..102 (east). box.z1 = 143 takes in the front flick.
  const west = fin(g, { x0: 49, x1: 51, y0: 0, y1: 50, z0: 124, z1: 143 }, { roof: ROOF, inner: "east" });
  const east = fin(g, { x0: 100, x1: 102, y0: 0, y1: 50, z0: 124, z1: 143 }, { roof: ROOF, inner: "west" });
  // fin() puts its flick floodlight at z 142 with nothing above or beside it but air: an orphan. Take it out
  // (my own cell); P5 lights the gold tips another way.
  for (const x of [51, 100]) if (g.blockAt(x, 44, 142) === "minecraft:shroomlight") g.set(x, 44, 142, "air");

  // Six tall quartz columns on z 134 (centres 53..98), y 3..36, replacing the short ones P1 left out.
  for (const cx of [53, 62, 71, 80, 89, 98]) column(g, cx, 134, 36);

  // Lintel box with its dentils, deck and parapet (plan.md ROOFS, FACADES).
  const lintel = portal_lintel(g, 49, 102, 130, 141);

  const beam = midBeam(g);
  console.log(`portal: fins ${west.placed + east.placed} placed, lintel refused ${lintel?.refused?.length ?? 0}, mid beam refused ${beam.length}`);
}
