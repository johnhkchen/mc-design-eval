// Part: lead roofs. Nave+choir gable (the crossing stops under the spire socle), transept gables, the nave and choir
// aisle and tribune lean-tos, the apse half-cone and the sacristy hall, wing and south chapel gables. Every roof starts
// one course above the wall plate it sits on (eave 46 over the clerestory walls at y 45, 25 over the outer aisle walls
// at y 24, 34 over the tribune walls at y 33), so nothing lands on a shell cell. Built with leadRoof (vocab/h1.mjs), which
// writes only into air. The chevet's ambulatory rings, the chapel terraces and the link gallery are not built here.
import { leadRoof } from "../vocab.mjs";

// spire socle cells the crossing roof must leave open (plan.md FLOORS / Reserved: the spire volume above y 51)
const SPIRE_BOX = [90, 52, 32, 100, 137, 42];
const inBox = ([x0, y0, z0, x1, y1, z1], x, y, z) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// The grid as the roof sees it: air-only writes, and the spire volume skipped (not counted as refused).
function roofGrid(g, skip = () => false) {
  return {
    inBounds: (x, y, z) => g.inBounds(x, y, z),
    isAir: (x, y, z) => g.isAir(x, y, z),
    set: (x, y, z, ...rest) => { if (!skip(x, y, z)) g.set(x, y, z, ...rest); },
  };
}

export function build(g) {
  const roof = (box, eave, opts, skip) => leadRoof(roofGrid(g, skip), box, eave, opts);

  // ---- nave and choir: one gable along x on z 37, eave 46 (clerestory wall plate 45); the crossing is in its span
  roof([23, 27, 149, 47], 46, { ridge: "x" }, (x, y, z) => inBox(SPIRE_BOX, x, y, z));

  // ---- transepts: gables along z on x 95, eave 46, the gable faces at z 1 and z 69 stay masonry
  roof([86, 2, 104, 26], 46, { ridge: "z" });
  roof([86, 48, 104, 68], 46, { ridge: "z" });

  // ---- aisle and tribune lean-tos, nave and choir alike: outer aisle eave 25 (wall top 24), tribune eave 34 (top 33)
  // north side: high toward the clerestory (south); south side: high toward the clerestory (north)
  for (const [x0, x1] of [[23, 85], [105, 149]]) {
    roof([x0, 11, x1, 18], 25, { lean: "south" });
    roof([x0, 19, x1, 26], 34, { lean: "south" });
    roof([x0, 56, x1, 63], 25, { lean: "north" });
    roof([x0, 48, x1, 55], 34, { lean: "north" });
  }

  // ---- apse half-cone: from the choir's end (x 150) over the r 10 clerestory wall, apex y 59 at the axis.
  // A stack of deepslate_tiles per column, stepped with the pitch (1.3 blocks per cell of run), air only.
  for (let x = 150; x <= 162; x++) for (let z = 27; z <= 47; z++) {
    const r = Math.hypot(x - 150, z - 37);
    if (r > 10.5) continue;
    const top = 45 + Math.round((10.5 - r) * 1.3);
    for (let y = 46; y <= top; y++) if (g.isAir(x, y, z)) g.set(x, y, z, "deepslate_tiles");
  }

  // ---- sacristy: hall gable along x on z 92 (eave 18, wall top 17); south chapel gable along z on x 142 (eave 19)
  roof([125, 85, 154, 99], 18, { ridge: "x" });
  roof([135, 100, 149, 109], 19, { ridge: "z" });
  // ---- sacristy west wing: gable along z on x 119.5 (eave 15, wall top 14); reaches y 19, plan asked 16
  roof([115, 80, 124, 99], 15, { ridge: "z" });
}
