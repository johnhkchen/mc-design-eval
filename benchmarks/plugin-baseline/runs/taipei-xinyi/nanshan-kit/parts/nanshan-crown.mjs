// Plot 0 Nan Shan crown (P2): the roof slab y352 over the shaft's chamfered footprint, a hollow plant box inside it, the
// wheat-ear fin crown y353..381 (open fins, no glass; they continue the shell's facade fins and peak to the reveal), the
// white-gold froglight glow, and the four red aircraft lights at y382. Plan coordinates, plot 0.
import { crownFin, crownGlow, aircraftLight } from "../vocab.mjs";

const BOX = { x0: 166, x1: 229, z0: 12, z1: 75 };
const SLAB_Y = 352;
const CROWN_Y0 = 353;
const CENTRE_TOP = 381;
const CORNER_TOP = 366;
const REVEAL_NS = [195, 200]; // N/S faces: x of the two reveal edge fins (the aircraft lights stand on these)
const REVEAL_EW = [41, 46]; // E/W faces: z of the two reveal edge fins
const PLANT = { x0: 180, x1: 215, z0: 26, z1: 61, y0: 353, y1: 364 };

// Plan's chamfer: at each corner, cells with dx + dz < 6 are cut away.
function inFootprint(x, z) {
  const dx = x - BOX.x0, ex = BOX.x1 - x, dz = z - BOX.z0, ez = BOX.z1 - z;
  return Math.min(dx + dz, dx + ez, ex + dz, ex + ez) >= 6;
}

// Fin cells along one face: every second cell from the face's start corner (the shell's rhythm), the chamfer cut at
// each end, no fin inside the reveal slot, and the two reveal edge fins always.
function finsAlong(lo, hi, [e0, e1]) {
  const out = [];
  for (let a = lo; a <= hi; a++) {
    if (a - lo < 6 || hi - a < 6) continue;
    if (a > e0 && a < e1) continue;
    if (a === e0 || a === e1 || (a - lo) % 2 === 0) out.push(a);
  }
  return out;
}

// Fin top: 381 at the reveal, down 1 block per 2 cells away from its edge, never below 366 (the chamfers).
function topAt(a, [e0, e1]) {
  const dist = a < e0 ? e0 - a : a > e1 ? a - e1 : 0;
  return Math.max(CORNER_TOP, Math.round(CENTRE_TOP - dist / 2));
}

export function build(g) {
  // Roof slab over the chamfered footprint: the shaft's top (y352). The shell's perimeter fin and glass course already
  // fills part of that row, so only the air cells are laid; the crown starts on the slab at y353.
  for (let z = BOX.z0; z <= BOX.z1; z++) for (let x = BOX.x0; x <= BOX.x1; x++) {
    if (inFootprint(x, z) && String(g.blockAt(x, SLAB_Y, z)).endsWith("air")) g.set(x, SLAB_Y, z, "gray_concrete");
  }

  // Plant box: hollow concrete planter inside the crown, moss floor, azaleas and persistent leaves on it.
  const P = PLANT;
  for (let y = P.y0; y <= P.y1; y++) for (let z = P.z0; z <= P.z1; z++) for (let x = P.x0; x <= P.x1; x++) {
    if (x === P.x0 || x === P.x1 || z === P.z0 || z === P.z1) g.set(x, y, z, "gray_concrete");
  }
  for (let z = P.z0 + 1; z < P.z1; z++) for (let x = P.x0 + 1; x < P.x1; x++) g.set(x, P.y0, z, "moss_block");
  for (let z = P.z0 + 2; z < P.z1; z += 3) for (let x = P.x0 + 2; x < P.x1; x += 3) {
    if ((x + z) % 6 === 2) g.set(x, P.y0 + 1, z, "flowering_azalea");
    else g.set(x, P.y0 + 1, z, "oak_leaves", { persistent: "true" });
  }

  // Fins: the four faces (outer plane), then the chamfer diagonals (dx + dz = 6, one step each).
  const faces = [
    ["north", REVEAL_NS, (a) => [a, BOX.z0]],
    ["south", REVEAL_NS, (a) => [a, BOX.z1]],
    ["west", REVEAL_EW, (a) => [BOX.x0, a]],
    ["east", REVEAL_EW, (a) => [BOX.x1, a]],
  ];
  const fins = [];
  for (const [face, edges, xzOf] of faces) {
    const along = face === "north" || face === "south" ? [BOX.x0, BOX.x1] : [BOX.z0, BOX.z1];
    for (const a of finsAlong(along[0], along[1], edges)) {
      // The aircraft lights take the tops of the N/S reveal edge fins, so those carry no end rod.
      const lamp = edges === REVEAL_NS && (a === edges[0] || a === edges[1]);
      crownFin(g, a, face, topAt(a, edges), { box: BOX, cap: !lamp });
      const [x, z] = xzOf(a);
      fins.push({ x, z, face });
    }
  }
  // A chamfer fin is a one-cell post: crownFin on a degenerate box (its face is the post's own cell).
  const corners = [
    [BOX.x0, BOX.z0, 1, 1],
    [BOX.x1, BOX.z0, -1, 1],
    [BOX.x0, BOX.z1, 1, -1],
    [BOX.x1, BOX.z1, -1, -1],
  ];
  for (const [cx, cz, sx, sz] of corners) for (let dx = 1; dx <= 5; dx++) {
    const x = cx + sx * dx, z = cz + sz * (6 - dx);
    const post = { x0: x, x1: x, z0: z, z1: z };
    crownFin(g, x, "north", CORNER_TOP, { box: post, cap: true });
  }

  // Froglight glow: white-gold light one cell inside each fin at the crown floor (y353; the shell's glass owns y352),
  // ochre one row up on every third fin.
  crownGlow(g, fins, CROWN_Y0);

  // Four red aircraft lights on the reveal edge fins of the north and south faces.
  for (const z of [BOX.z0, BOX.z1]) for (const x of REVEAL_NS) aircraftLight(g, [x, 382, z]);
}
