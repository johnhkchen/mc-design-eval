// P2 Colonnades, porticoes, pediments, balustrades, cupolas, skylights (plan.md ELEMENTS 6, 7, 8, 10, 11, 14, 15).
// The Senate side is written here as the plan gives it; the House side is the same call mirrored (z -> 95 - z).
// Portico floors are bottom slabs (smooth_stone_slab) on y5, written cell by cell where a column does not stand.
import { colonnade, balustrade, pediment, cupola, WALL, GLASS, GLOWSTONE, CURB, DECK_SLAB } from "../vocab.mjs";

const MZ = (z) => 95 - z;
const mirror = (zs) => zs.map(MZ);

// The same block over x0..x1, z0..z1 at course y.
function fill(g, x0, x1, z0, z1, y, block, state) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (state) g.set(x, y, z, block, state); else g.set(x, y, z, block);
  }
}

// A skylight over a chamber: a grey smooth_stone floor under (y11), a polished_andesite curb ring (y12), glass across (y13).
function skylight(g, z0, z1) {
  fill(g, 13, 25, z0, z1, 11, "smooth_stone");     // grey under the glass (glowstone read orange from above)
  for (let x = 13; x <= 25; x++) { g.set(x, 12, z0, CURB); g.set(x, 12, z1, CURB); }
  for (let z = z0; z <= z1; z++) { g.set(13, 12, z, CURB); g.set(25, 12, z, CURB); }
  fill(g, 13, 25, z0, z1, 13, GLASS);
}

// A 4 x 4 roof lantern: calcite drum y12..13 with a dark pane centred in each face, smooth_stone core, a light grey
// polished_andesite stair ring y14 (lip out) and a 2 x 2 smooth_stone_slab cap y15.
function roofLantern(g, x0, z0) {
  const x1 = x0 + 3, z1 = z0 + 3;
  const paneNS = { north: "false", south: "false", east: "true", west: "true" };
  const paneEW = { north: "true", south: "true", east: "false", west: "false" };
  for (let y = 12; y <= 13; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const ex = x === x0 || x === x1, ez = z === z0 || z === z1;
    if (!ex && !ez) g.set(x, y, z, "smooth_stone");
    else if (ex && ez) g.set(x, y, z, "calcite");
    else g.set(x, y, z, "gray_stained_glass_pane", ez ? paneNS : paneEW);
  }
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const ex = x === x0 || x === x1, ez = z === z0 || z === z1;
    if (!ex && !ez) { g.set(x, 14, z, "smooth_stone"); g.set(x, 15, z, DECK_SLAB, { type: "bottom" }); continue; }
    const back = z === z0 ? "south" : z === z1 ? "north" : x === x0 ? "east" : "west";
    g.set(x, 14, z, "polished_andesite_stairs", { facing: back, half: "bottom", shape: "straight", waterlogged: "false" });
  }
}

// Wing and connector roof edges, Senate side (z 2..25); the House side is mirrored below.
const WING_LINES = [
  { axis: "x", at: 3, from: 2, to: 18 },      // west, over the colonnade
  { axis: "x", at: 33, from: 2, to: 18 },     // east, behind the portico
  { axis: "z", at: 2, from: 3, to: 33 },      // north end
  { axis: "z", at: 18, from: 3, to: 14 },     // inner end, exposed west of the connector
  { axis: "z", at: 18, from: 28, to: 33 },    // inner end, exposed east of the connector
  { axis: "x", at: 15, from: 19, to: 25 },    // connector west
  { axis: "x", at: 27, from: 19, to: 25 },    // connector east
];
// Central block: symmetric about z 47.5 already, so listed once; the loggia (z 41..54) stays open at x10.
const CENTRAL_LINES = [
  { axis: "x", at: 10, from: 26, to: 40 },
  { axis: "x", at: 10, from: 55, to: 69 },
  { axis: "x", at: 29, from: 26, to: 40 },
  { axis: "x", at: 29, from: 55, to: 69 },
  { axis: "z", at: 26, from: 10, to: 14 },
  { axis: "z", at: 26, from: 28, to: 29 },
  { axis: "z", at: 69, from: 10, to: 14 },
  { axis: "z", at: 69, from: 28, to: 29 },
];
const mirrorLine = ({ axis, at, from, to }) =>
  axis === "x" ? { axis, at, from: MZ(to), to: MZ(from) } : { axis, at: MZ(at), from, to };

export function build(g) {
  // 6. Wing west colonnades: 8 columns on x3 at z 3..17 (House 78..92), corner piers x3..4 at z2/z18 (93/77).
  const westCols = [3, 5, 7, 9, 11, 13, 15, 17];
  for (const zs of [westCols, mirror(westCols)]) colonnade(g, { axis: "x", at: 3, zs });
  for (const zs of [[2, 18], [93, 77]]) colonnade(g, { axis: "x", at: 3, zs, depth: 2 });
  fill(g, 3, 4, 2, 18, 11, WALL);     // loggia entablature
  fill(g, 3, 4, 77, 93, 11, WALL);

  // 7. Wing east porticoes: 5 columns on x35, bottom-slab floor on x34, entablature, pediment (ridge along x).
  const eastCols = [6, 8, 10, 12, 14];
  for (const zs of [eastCols, mirror(eastCols)]) {
    colonnade(g, { axis: "x", at: 35, zs });
    const z0 = Math.min(...zs), z1 = Math.max(...zs);
    for (let z = z0; z <= z1; z++) g.set(34, 5, z, DECK_SLAB, { type: "bottom" });
    fill(g, 34, 35, z0, z1, 11, WALL);
    pediment(g, { x0: 34, x1: 35, z0, z1, y0: 11, ridge: "x", face: "east" });
  }

  // 8. West Front loggia: 8 columns on x8, entablature over x8..9, balustrade on the loggia roof at x8.
  colonnade(g, { axis: "x", at: 8, zs: [41, 43, 45, 47, 48, 50, 52, 54] });
  fill(g, 8, 9, 41, 54, 11, WALL);
  for (let z = 41; z <= 54; z++) g.set(9, 11, z, GLOWSTONE);   // hidden floodlight in the loggia soffit, over the open bay
  balustrade(g, { line: { axis: "x", at: 8, from: 41, to: 54 }, y: 12 });

  // 10. East Portico: outer row on x32, staggered inner row on x30, bottom-slab floor on x30..32, entablature, pediment.
  const outer = [41, 43, 45, 47, 48, 50, 52, 54];
  const inner = [42, 44, 46, 49, 51, 53];
  colonnade(g, { axis: "x", at: 32, zs: outer });
  colonnade(g, { axis: "x", at: 30, zs: inner });
  for (let z = 41; z <= 54; z++) {
    for (const x of [30, 31, 32]) {
      const onColumn = (x === 30 && inner.includes(z)) || (x === 32 && outer.includes(z));
      if (!onColumn) g.set(x, 5, z, DECK_SLAB, { type: "bottom" });
    }
  }
  fill(g, 30, 32, 41, 54, 11, WALL);
  pediment(g, { x0: 30, x1: 32, z0: 41, z1: 54, y0: 11, ridge: "x", face: "east" });

  // 11. Balustrades (y12) on every roofline: wings and connectors (Senate, then mirrored), central block.
  for (const line of [...WING_LINES, ...WING_LINES.map(mirrorLine), ...CENTRAL_LINES]) {
    balustrade(g, { line, y: 12 });
  }

  // 15. Light grey roof lanterns over the old chambers, north and south (the copper read as stray green).
  roofLantern(g, 18, 29);
  roofLantern(g, 18, 63);

  // 14. Chamber skylights, Senate and House.
  skylight(g, 6, 14);
  skylight(g, 81, 89);
}
