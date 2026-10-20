// SkyLine hexagon (P3): soffit, floor, glass walls, posts and roof of the 30 m event hall (plan.md FACADES / ROOFS).
// Hexagon test per plan: |dz| <= a, |0.866 dx - 0.5 dz| <= a, |0.866 dx + 0.5 dz| <= a, centred on the axis (32, 32).
// Writes are air-only: the legs (earlier part) and the core and elevator footprint (kept clear for the core, P2) are
// skipped, so nothing is refused. The core's footprint and the elevator shafts pass through every level, so they are
// never floored, soffited or roofed here; the ladder hole (32, 34) at y42 falls inside the core footprint.
import { SKYLINE, SEA_LANTERN, SMOOTH_QUARTZ, SMOOTH_QUARTZ_SLAB, WHITE_CONCRETE, GRAY_STAINED_GLASS, CENTRE } from "../vocab.mjs";

const [CX, CZ] = CENTRE;

// Cells of the hall that belong to the core lattice (x29..35, z29..35) or the glass elevator shafts (z27..28).
function reserved(x, z) {
  const core = x >= 29 && x <= 35 && z >= 29 && z <= 35;
  const shaft = (x >= 29 && x <= 30) || (x >= 34 && x <= 35);
  return core || (shaft && z >= 27 && z <= 28);
}

function inHex(a, x, z) {
  const dx = x - CX, dz = z - CZ;
  return Math.abs(dz) <= a && Math.abs(0.866 * dx - 0.5 * dz) <= a && Math.abs(0.866 * dx + 0.5 * dz) <= a;
}

// Outline of the hexagon of apothem a: its cells with a neighbour outside the hexagon.
function isEdge(a, x, z) {
  return inHex(a, x, z) && (!inHex(a, x + 1, z) || !inHex(a, x - 1, z) || !inHex(a, x, z + 1) || !inHex(a, x, z - 1));
}

const REACH = 18;

// Every cell of the hexagon of apothem a for which keep(x, z) holds, as [x, z] pairs.
function hexList(a, keep = () => true) {
  const out = [];
  for (let x = CX - REACH; x <= CX + REACH; x++) for (let z = CZ - REACH; z <= CZ + REACH; z++) {
    if (inHex(a, x, z) && keep(x, z)) out.push([x, z]);
  }
  return out;
}

// Air-only write: a cell already holding a block (a leg, the core) is left as the earlier part built it.
function put(g, x, y, z, [block, state]) {
  const cur = g.get(x, y, z);
  if (cur && !/air$/.test(cur.block)) return 0;
  g.set(x, y, z, block, state);
  return 1;
}

export function build(g) {
  const { soffitY, floorY, wallY0, wallY1, roofY, apothem } = SKYLINE;
  const put1 = (x, y, z, b) => put(g, x, y, z, b);
  const free = (x, z) => !reserved(x, z);

  // y41 soffit, apothem 15, smooth quartz with hidden sea lanterns every 5 cells (seen from below as a glow).
  for (const [x, z] of hexList(apothem.soffit, free)) {
    const lamp = (x - CX) % 5 === 0 && (z - CZ) % 5 === 0;
    put1(x, soffitY, z, lamp ? [SEA_LANTERN, {}] : [SMOOTH_QUARTZ, {}]);
  }

  // y42 floor, apothem 16: the white rim that splays past the glass wall, with the ladder hole at (32, 34) kept open.
  // Hidden lamps in the open rim outside the glass (apothem 14..16), every fourth diagonal.
  for (const [x, z] of hexList(apothem.floor, free)) {
    const rimLamp = !inHex(apothem.wall, x, z) && ((x - CX) + (z - CZ)) % 4 === 0 && (x - CX) % 2 === 0;
    put1(x, floorY, z, rimLamp ? [SEA_LANTERN, {}] : [SMOOTH_QUARTZ, {}]);
  }
  // The shaft's own floor at y42 (x30..34, z30..34) except the ladder hole: the ladder lands on it and the core doorway
  // opens onto it, so the hall is reachable from the climb.
  for (let x = 30; x <= 34; x++) for (let z = 30; z <= 34; z++) {
    if (x === 32 && z === 34) continue;
    put1(x, floorY, z, [SMOOTH_QUARTZ, {}]);
  }

  // y43..47 glass wall on the apothem-13 outline; white concrete posts at the six vertices.
  const vertices = [30, 90, 150, 210, 270, 330].map((deg) => {
    const R = (2 * apothem.wall) / Math.sqrt(3), t = (deg * Math.PI) / 180;
    return [CX + R * Math.sin(t), CZ - R * Math.cos(t)];
  });
  const wall = hexList(apothem.wall, (x, z) => isEdge(apothem.wall, x, z) && free(x, z));
  const posts = new Set(vertices.map(([vx, vz]) => {
    let best = null, bestD = Infinity;
    for (const [x, z] of wall) {
      const d = (x - vx) ** 2 + (z - vz) ** 2;
      if (d < bestD) { bestD = d; best = [x, z]; }
    }
    return best.join(",");
  }));
  for (let y = wallY0; y <= wallY1; y++) {
    for (const [x, z] of wall) {
      put1(x, y, z, posts.has(`${x},${z}`) ? [WHITE_CONCRETE, {}] : [GRAY_STAINED_GLASS, {}]);
    }
  }

  // y48 roof, apothem 13 in smooth quartz with hidden sea lanterns every 6 cells, and a bottom slab edge out to apothem 14.
  for (const [x, z] of hexList(apothem.wall, free)) {
    const lamp = (x - CX) % 6 === 0 && (z - CZ) % 6 === 0;
    put1(x, roofY, z, lamp ? [SEA_LANTERN, {}] : [SMOOTH_QUARTZ, {}]);
  }
  for (const [x, z] of hexList(apothem.wall + 1, (x, z) => free(x, z) && !inHex(apothem.wall, x, z))) {
    put1(x, roofY, z, [SMOOTH_QUARTZ_SLAB, { type: "bottom" }]);
  }
}
