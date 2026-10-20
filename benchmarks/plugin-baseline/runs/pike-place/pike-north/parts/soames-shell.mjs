// P1 Soames-Dunn masonry shell: masses A,B,C,D1,D2,E as 2-thick brick walls footed to the GROUND map, floors, openings left air.
// Wall rule: a cell is exposed if a neighbour is off the masses or has a lower deck; the cell behind an exposed one is wall too.
// Sidewalk strips x0..1 (A) and x4..5 (C) are never built. Openings are carved 2 deep (plane + the cell behind, where glass goes).
import { groundAt, onFootprint, BRICKS, STONE_BRICKS, SMOOTH_SANDSTONE, DARK_OAK_PLANKS, CUT_SANDSTONE, SHROOMLIGHT,
  STRIPPED_DARK_OAK_LOG, STRIPPED_SPRUCE_LOG, SPRUCE_PLANKS } from "../vocab/base.mjs";

const WINDOW_FRAME = "green_concrete"; // dark-green sash rail across the tall windows

const inB = (x, z) =>
  x >= 28 && x <= 55 && z >= 4 && z <= 99 &&
  !(x >= 52 && z <= 7) && !(x >= 52 && z >= 20 && z <= 27) && !(x >= 44 && z >= 80);

const MASSES = {
  A: { T: 10 + 7, floors: [2, 10], solid: true },
  C: { T: 17, floors: [3, 10], solid: true },
  B: { T: 25, floors: [11, 18], solid: true },
  D: { T: 10, floors: [3], solid: true },
  E: { T: 25, floors: [11, 18], solid: false },
};

function massKey(x, z) {
  if (!onFootprint(x, z)) return null;
  if (x >= 2 && x <= 27 && z >= 0 && z <= 99 && !(z <= 3 && x >= 12)) return "A";
  if (x >= 6 && x <= 27 && z >= 100 && z <= 158) return "C";
  if (inB(x, z) || (x >= 28 && x <= 47 && z >= 0 && z <= 3)) return "B";
  if ((x >= 28 && x <= 43 && z >= 100 && z <= 103) || (x >= 28 && x <= 35 && z >= 104 && z <= 107) || (x >= 28 && x <= 35 && z >= 128 && z <= 131)) return "D";
  if (
    (x >= 44 && x <= 59 && z >= 108 && z <= 139) || (x >= 48 && x <= 55 && z >= 104 && z <= 107) ||
    (x >= 32 && x <= 59 && z >= 140 && z <= 143) || (x >= 28 && x <= 59 && z >= 144 && z <= 155) ||
    (x >= 28 && x <= 47 && z >= 156 && z <= 158)
  ) return "E";
  return null;
}

export function build(g) {
  const key = (x, z) => (x < 0 || z < 0 || x > 59 || z > 158 ? null : massKey(x, z));
  const T = (x, z) => { const k = key(x, z); return k ? MASSES[k].T : null; };
  const exposed = (x, z) => {
    const t = T(x, z);
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => { const n = T(x + dx, z + dz); return n == null || n < t; });
  };
  const isWall = (x, z) => {
    if (exposed(x, z)) return true;
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => key(x + dx, z + dz) === key(x, z) && exposed(x + dx, z + dz));
  };

  for (let x = 0; x <= 59; x++)
    for (let z = 0; z <= 158; z++) {
      const k = key(x, z);
      if (!k) continue;
      const m = MASSES[k], gy = groundAt(x, z);
      if (gy == null) continue;
      if (isWall(x, z)) {
        let plinth = gy + 1;
        if (k === "A" && x <= 3) plinth = Math.max(plinth, 2);
        if (k === "C" && x <= 7) plinth = Math.max(plinth, 3);
        const band = exposed(x, z) && ((k === "B" || k === "E") ? (y) => y === 17 || y === 24 : (y) => y === 10 && x >= 4);
        for (let y = gy; y < m.T; y++) g.set(x, y, z, y <= plinth ? STONE_BRICKS : band && band(y) ? SMOOTH_SANDSTONE : BRICKS);
        // Cornice course at the deck row on the outer layer (the roof's deck stops inside it); the street fronts' own
        // cornices (x0..7) are the front part's.
        if (exposed(x, z) && x >= 8) g.set(x, m.T, z, SMOOTH_SANDSTONE);
      } else {
        const f0 = m.floors[0];
        if (m.solid && gy < f0) for (let y = gy; y < f0; y++) g.set(x, y, z, STONE_BRICKS);
        for (const f of m.floors) if (gy < f || f > m.floors[0] || gy === f) g.set(x, f, z, DARK_OAK_PLANKS);
      }
    }

  // stucco upper storey on the front planes (x2 for A, x6 for C), brick at the pier cells
  for (let z = 0; z <= 99; z++) { const pier = z % 9 < 2 || z === 99; for (let y = 11; y <= 16; y++) if (!pier) g.set(2, y, z, SMOOTH_SANDSTONE); }
  for (let z = 100; z <= 158; z++) { const pier = (z - 100) % 9 < 2 || z >= 154; for (let y = 11; y <= 16; y++) if (!pier) g.set(6, y, z, SMOOTH_SANDSTONE); }

  // openings: face = the way the wall looks; plane = wall plane; carved `depth` cells inward. Windows (glass: true) are
  // glazed here in the shell, because runParts locks the shell's air: the face cell stays open (the reveal), a glass_pane
  // sits 1 behind it with a dark-green meeting rail in windows 4+ tall, a cut_sandstone lintel over the face cell, a
  // smooth_sandstone sill under it, and about 2 in 3 windows have a warm shroomlight just behind the glass.
  const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  const cellAt = (face, plane, t, d) => (face === "w" ? [plane + d, t] : face === "e" ? [plane - d, t] : face === "n" ? [t, plane + d] : [t, plane - d]);
  function open(face, plane, lo, hi, y0, y1, depth = 2, maxG = 99, glass = false) {
    for (let t = lo; t <= hi; t++)
      for (let d = 0; d < depth; d++) {
        const [x, z] = cellAt(face, plane, t, d);
        if (!key(x, z)) continue;
        const gy = groundAt(x, z);
        if (d === 0 && gy > maxG) continue;
        for (let y = y0; y <= y1; y++) if (y > gy) g.set(x, y, z, "air");
      }
    if (!glass) return;
    const lit = ((Math.imul(lo * 31 + plane * 7 + y0, 0x9e3779b1) >>> 16) % 3) !== 0;
    for (let t = lo; t <= hi; t++) {
      const [fx, fz] = cellAt(face, plane, t, 0), [gx, gz] = cellAt(face, plane, t, 1), [lx, lz] = cellAt(face, plane, t, 2);
      if (!key(fx, fz) || groundAt(fx, fz) > maxG || !key(gx, gz)) continue;
      for (let y = y0; y <= y1; y++) {
        if (y <= groundAt(gx, gz)) continue;
        if (y1 - y0 >= 3 && y === y0 + 2) g.set(gx, y, gz, WINDOW_FRAME);
        else g.set(gx, y, gz, "glass_pane", face === "w" || face === "e" ? PANE_Z : PANE_X);
      }
      if (g.blockAt(fx, y1 + 1, fz).endsWith(":bricks") || g.blockAt(fx, y1 + 1, fz).endsWith(":smooth_sandstone")) g.set(fx, y1 + 1, fz, CUT_SANDSTONE);
      if (g.blockAt(fx, y0 - 1, fz).endsWith(":bricks")) g.set(fx, y0 - 1, fz, SMOOTH_SANDSTONE);
      if (lit && key(lx, lz) && g.isAir(lx, y1, lz) && g.isAir(lx, y1 + 1, lz)) { g.set(lx, y1, lz, SHROOMLIGHT); g.set(lx, y1 + 1, lz, BRICKS); } // hung from a brick under the ceiling line
    }
  }
  const win = (face, plane, lo, hi, y0, y1, maxG = 99) => open(face, plane, lo, hi, y0, y1, 2, maxG, true);

  // Shopfronts in the street plane (A x2 floor y2, C x6 floor y3), one per 9-bay panel z b+2..b+8: display glass
  // b+2..b+5 over a bulkhead, a door pair b+6..b+7 under a brown transom, a post at b+8, a head beam at y8.
  function shopfront(X, F, b, starbucks) {
    const post = starbucks ? STRIPPED_SPRUCE_LOG : STRIPPED_DARK_OAK_LOG, plank = starbucks ? SPRUCE_PLANKS : DARK_OAK_PLANKS;
    const door = starbucks ? "spruce_door" : "dark_oak_door";
    for (let z = b + 2; z <= b + 7; z++) g.set(X, 8, z, plank);
    for (let y = F + 1; y <= 8; y++) g.set(X, y, b + 8, post, { axis: "y" });
    for (let z = b + 2; z <= b + 5; z++) {
      g.set(X, F + 1, z, plank);
      for (let y = F + 2; y <= 7; y++) g.set(X, y, z, z === b + 2 ? post : "glass_pane", z === b + 2 ? { axis: "y" } : PANE_Z);
    }
    [b + 6, b + 7].forEach((z, i) => {
      g.set(X, F + 1, z, door, { facing: "west", half: "lower", hinge: i ? "right" : "left", open: "false", powered: "false" });
      g.set(X, F + 2, z, door, { facing: "west", half: "upper", hinge: i ? "right" : "left", open: "false", powered: "false" });
      for (let y = F + 3; y <= 7; y++) g.set(X, y, z, "brown_stained_glass_pane", PANE_Z);
    });
  }

  // A front: shopfronts, then tall paired upper windows (y12..15). Bay 5 carries the Starbucks logo over its door.
  for (let k = 0; k <= 10; k++) {
    const b = 9 * k;
    open("w", 2, b + 2, b + 8, 3, 8);
    shopfront(2, 2, b, k === 4 || k === 5);
    if (k === 5) continue;
    for (const z of [b + 3, b + 6]) win("w", 2, z, z + 1, 12, 15);
  }
  // C front
  for (let j = 0; j <= 5; j++) {
    const b = 100 + 9 * j;
    open("w", 6, b + 2, b + 8, 4, 8);
    shopfront(6, 3, b, false);
    for (const z of [b + 3, b + 6]) win("w", 6, z, z + 1, 12, 15);
  }
  // A north return: the shop's side window and upper windows across both planes (z0 x0..11, z4 x12..27)
  win("n", 0, 5, 8, 4, 7);
  for (const x of [4, 8]) win("n", 0, x, x + 1, 12, 15);
  for (const x of [14, 18, 22]) win("n", 4, x, x + 1, 12, 15);
  // C south end (z158, x6..27): upper windows every 4
  for (const x of [9, 13, 17, 21, 24]) win("s", 158, x, x + 1, 12, 15);
  // B west (above A's deck) and north
  for (let k = 0; k <= 10; k++) for (const z of [9 * k + 3, 9 * k + 6]) win("w", 28, z, z + 1, 19, 22);
  for (const x of [30, 34, 38, 42, 45]) { win("n", 0, x, x + 1, 12, 15); win("n", 0, x, x + 1, 19, 22); }
  win("n", 4, 49, 50, 12, 15); win("n", 4, 49, 50, 19, 22);
  // E south end (z155 x48..59, z158 x28..47)
  for (const x of [50, 54]) { win("s", 155, x, x + 1, 12, 15); win("s", 155, x, x + 1, 19, 22); }
  for (const x of [30, 34, 38, 42, 45]) { win("s", 158, x, x + 1, 12, 15); win("s", 158, x, x + 1, 19, 22); }
  // B / E east faces on the alley, every 6 along z
  for (let z = 7; z <= 97; z += 6) { if (z >= 20 && z <= 27) continue; win("e", 55, z, z + 1, 12, 15); win("e", 55, z, z + 1, 19, 22); }
  for (let z = 109; z <= 152; z += 6) { win("e", 59, z, z + 1, 12, 15); win("e", 59, z, z + 1, 19, 22); }
  open("e", 55, 40, 40, 12, 13);
  open("e", 59, 130, 130, 12, 13);
  // E west faces to the court
  const court = (plane, zs) => { for (const z of zs) { win("w", plane, z, z + 1, 7, 9, 5); win("w", plane, z, z + 1, 12, 15); win("w", plane, z, z + 1, 19, 22); } };
  court(44, [110, 116, 122, 128, 134]);
  court(32, [141]);
  court(28, [146, 152]);
  // D1 / D2 doors into the court
  open("s", 103, 36, 37, 4, 5);
  open("s", 131, 30, 31, 4, 5);
}
