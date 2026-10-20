// VOCABULARY helpers 1 (plan.md): box, flute, shopBay, deckParapet, geSign, glassScreen, marquee, parapet, lampPost.
// Each takes its own position (and face or facing) as arguments and writes only inside the footprint it is given.
// It writes only into air unless { over: true }, which a dressing helper needs to sit on a shell it was built over.
// Refused cells are returned (placed / refused), never thrown.
import { B, plaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const TOP = 244;                       // nothing at or above y 245 (plan: "y ≤ 245")
const WHITE = "white_terracotta";

// A face: { side: "north" | "south" | "east" | "west", line } where line is the outer face's coordinate
// (z for north/south, x for east/west). Depth d is 0 on the face line and negative inward (plan: 0, -1, -2).
// `a` is the coordinate along the face (x for north/south, z for east/west).
function cell(face, a, y, d = 0) {
  const { side, line } = face;
  if (side === "north") return [a, y, line - d];
  if (side === "south") return [a, y, line + d];
  if (side === "east") return [line + d, y, a];
  if (side === "west") return [line - d, y, a];
  throw new Error(`face side must be north, south, east or west (got ${side})`);
}

// glass_pane connections: panes join along the wall, east-west on north/south faces, north-south on east/west faces.
const pane = (side) => {
  const ew = side === "north" || side === "south";
  return { north: String(!ew), south: String(!ew), east: String(ew), west: String(ew), waterlogged: "false" };
};

// Writes one block (a name, or [name, state]) at p. Into air only, unless over; refused cells are reported.
function put(g, out, [x, y, z], spec, over = false) {
  if (y > TOP || !g.inBounds(x, y, z)) { out.refused.push([x, y, z]); return; }
  const [id, state] = typeof spec === "string" ? [spec] : spec;
  const air = g.isAir(x, y, z);
  if (id === "air") { if (!air && over) { g.set(x, y, z, "air"); out.placed++; } return; }
  if (!air && !over) { out.refused.push([x, y, z]); return; }
  g.set(x, y, z, id, state);
  out.placed++;
}

const empty = () => ({ placed: 0, refused: [] });

// Clockwise cells on the edge of the rectangle [x0, z0, x1, z1] (none when it has no area).
function ringCells(x0, z0, x1, z1) {
  if (x1 < x0 || z1 < z0) return [];
  const out = [];
  for (let x = x0; x <= x1; x++) out.push([x, z0]);
  for (let z = z0 + 1; z <= z1; z++) out.push([x1, z]);
  if (z1 > z0) for (let x = x1 - 1; x >= x0; x--) out.push([x, z1]);
  if (x1 > x0) for (let z = z1 - 1; z > z0; z--) out.push([x0, z]);
  return out;
}

const norm = (b) => [Math.min(b[0], b[3]), Math.min(b[1], b[4]), Math.min(b[2], b[5]), Math.max(b[0], b[3]), Math.max(b[1], b[4]), Math.max(b[2], b[5])];

// Deterministic mixing hash of a cell (not a linear form: x*7+y*13+z*31 mod 7 would line whole columns up).
function hash(x, y, z) {
  let h = Math.imul(x, 0x9e3779b1) ^ Math.imul(y + 0x7f4a7c15, 0x85ebca77) ^ Math.imul(z, 0xc2b2ae3d);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return (h ^ (h >>> 15)) >>> 0;
}

// A window is lit about 1 in 7 (1 in 5 below lowerBelow), and never when the same column is lit in the storey below.
function windowLit(face, a, yb, storeyH, lowerBelow) {
  const raw = (y) => { const [x, yy, z] = cell(face, a, y, -1); return hash(x, yy, z) % (y < lowerBelow ? 5 : 7) === 0; };
  return raw(yb) && !raw(yb - storeyH);
}

/** box(g, [x0,y0,z0,x1,y1,z1], block, { hollow, over }): a solid box; hollow: true (3 thick) or n = a shell n thick on every face. */
export function box(g, b, block, { hollow = false, over = false } = {}) {
  const out = empty(), [x0, y0, z0, x1, y1, z1] = norm(b), t = hollow === true ? 3 : hollow || Infinity;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    if (Math.min(x - x0, x1 - x, y - y0, y1 - y, z - z0, z1 - z) < t) put(g, out, [x, y, z], block, over);
  }
  return out;
}

/** flute(g, face, [a0, a1], yFrom, yTo, storeyH, spandrelGap = 1, { over, lowerBelow = 135 }): the fluted grammar on one face.
 *  Even cells are piers (white_terracotta on layers 0, -1, -2); odd cells are recesses (nothing on layer 0), a glass strip on
 *  -1 and a backing on -2. Storeys are storeyH rows from yFrom; the top spandrelGap rows of each are spandrel. The two cells
 *  at each end are solid pier on layers 0 and -1. */
export function flute(g, face, [a0, a1], yFrom, yTo, storeyH, spandrelGap = 1, { over = false, lowerBelow = 135 } = {}) {
  const out = empty(), lo = Math.min(a0, a1), hi = Math.max(a0, a1);
  for (let a = lo; a <= hi; a++) {
    const end = a - lo <= 1 || hi - a <= 1;
    for (let y = yFrom; y <= yTo; y++) {
      if (end) { for (const d of [0, -1]) put(g, out, cell(face, a, y, d), WHITE, over); continue; }
      if (a % 2 === 0) { for (const d of [0, -1, -2]) put(g, out, cell(face, a, y, d), WHITE, over); continue; }
      const row = (y - yFrom) % storeyH;
      if (row >= storeyH - spandrelGap) {
        put(g, out, cell(face, a, y, -1), "gray_terracotta", over);
        put(g, out, cell(face, a, y, -2), WHITE, over);
        continue;
      }
      const yb = yFrom + Math.floor((y - yFrom) / storeyH) * storeyH, lit = windowLit(face, a, yb, storeyH, lowerBelow);
      put(g, out, cell(face, a, y, -1), [lit ? "yellow_stained_glass_pane" : "gray_stained_glass_pane", pane(face.side)], over);
      put(g, out, cell(face, a, y, -2), lit ? "shroomlight" : "black_concrete", over);
    }
  }
  return out;
}

/** shopBay(g, face, at, wallY0, topY, { door, over, fascia }): one 3-wide shop bay, cells at+1..at+3, with the pier at `at`.
 *  Shop storey wallY0..transom with a polished_blackstone sill and transom, glass_pane on -1, shroomlight behind on -2; fascia of
 *  `fascia` rows (default 2 at the tower base, topY >= 13, else 1) of white_terracotta, and a smooth_sandstone_slab (top) string
 *  course at topY. door: a 2 wide x 3 tall air opening (framed in polished_blackstone) in the bay. */
export function shopBay(g, face, at, wallY0, topY, { door = false, over = false, fascia } = {}) {
  const out = empty(), rows = fascia ?? (topY >= 13 ? 2 : 1), transom = topY - rows - 1, jamb = at + 3;
  for (let y = wallY0; y <= topY; y++) for (const d of [0, -1]) put(g, out, cell(face, at, y, d), WHITE, over);   // pier
  for (const col of [at + 1, at + 2, at + 3]) {
    const inDoor = door && col < jamb;
    for (let y = wallY0; y <= topY; y++) {
      if (y === wallY0) {                                             // sill (the door's threshold is air)
        const sill = inDoor ? "air" : door && col === jamb ? "polished_blackstone" : B.slab("polished_blackstone", "top");
        put(g, out, cell(face, col, y, -1), sill, over);
      } else if (y < transom) {                                       // glazing, opening, jambs, header
        if (inDoor && y <= wallY0 + 2) put(g, out, cell(face, col, y, -1), "air", over);
        else if (inDoor && y === wallY0 + 3) put(g, out, cell(face, col, y, -1), "polished_blackstone", over);
        else if (door && col === jamb && y <= wallY0 + 3) put(g, out, cell(face, col, y, -1), "polished_blackstone", over);
        else put(g, out, cell(face, col, y, -1), ["glass_pane", pane(face.side)], over);
      } else if (y === transom) {
        put(g, out, cell(face, col, y, -1), "polished_blackstone", over);
      } else if (y < topY) {                                          // fascia
        for (const d of [0, -1]) put(g, out, cell(face, col, y, d), WHITE, over);
      } else {                                                        // string course
        put(g, out, cell(face, col, y, 0), B.slab("smooth_sandstone", "top"), over);
      }
    }
    if ((col - at) % 2 === 1) put(g, out, cell(face, col, transom - 1, -2), "shroomlight", over);   // lit shop, every 2nd cell
  }
  return out;
}

/** deckParapet(g, [x0, z0, x1, z1], topY, { over, lanternEvery = 6 }): a Top of the Rock deck. smooth_stone at topY; the outer
 *  ring is a polished_andesite_slab (top) curb with glass_pane two high on it; a lantern on the deck just inside the curb every
 *  lanternEvery cells. */
export function deckParapet(g, [x0, z0, x1, z1], topY, { over = false, lanternEvery = 6 } = {}) {
  const out = empty(), outer = ringCells(x0, z0, x1, z1), key = (x, z) => `${x},${z}`, edge = new Set(outer.map(([x, z]) => key(x, z)));
  const onEdge = (x, z) => edge.has(key(x, z));
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!onEdge(x, z)) { put(g, out, [x, topY, z], "smooth_stone", over); continue; }
    put(g, out, [x, topY, z], B.slab("polished_andesite", "top"), over);
    const state = { north: String(onEdge(x, z - 1)), south: String(onEdge(x, z + 1)), east: String(onEdge(x + 1, z)), west: String(onEdge(x - 1, z)), waterlogged: "false" };
    for (const y of [topY + 1, topY + 2]) put(g, out, [x, y, z], ["glass_pane", state], over);
  }
  ringCells(x0 + 1, z0 + 1, x1 - 1, z1 - 1).forEach(([x, z], i) => { if (i % lanternEvery === 0) put(g, out, [x, topY + 1, z], B.lantern(false), over); });
  return out;
}

/** geSign(g, face, x0, x1, y0, y1, { over }): the red GE on a north or south face (face = { side, line }). Layer -1 is shroomlight
 *  over the band, layer 0 a white_terracotta board; plaque sets the letters in red_stained_glass, reading GE from outside. */
export function geSign(g, face, x0, x1, y0, y1, { over = false } = {}) {
  if (face.side !== "north" && face.side !== "south") throw new Error(`geSign: face must be north or south (got ${face.side})`);
  const out = empty();
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
    put(g, out, cell(face, x, y, 0), WHITE, over);                 // board first: plaque recolours full blocks only
    put(g, out, cell(face, x, y, -1), "shroomlight", over);
  }
  // plaque anchors its bottom-left cell as seen from outside, which is the band's left end for this face
  const at = [face.side === "north" ? x1 : x0, y0, face.line];
  const plan = plaque(g, "GE", { at, face: face.side, width: x1 - x0 + 1, height: y1 - y0 + 1, letter: "red_stained_glass", material: WHITE, frame: null, style: "block", cap: false });
  return { ...out, plaque: plan };
}

/** glassScreen(g, x, z0, z1, y0, y1, { over }): a glass-block screen on the plane x. glass; yellow_stained_glass_pane on every 4th
 *  column and row; a polished_blackstone frame round the edge; shroomlight behind it at x - 1 on every 4th column. */
export function glassScreen(g, x, z0, z1, y0, y1, { over = false } = {}) {
  const out = empty();
  for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) {
    if (z === z0 || z === z1 || y === y0 || y === y1) put(g, out, [x, y, z], "polished_blackstone", over);
    else if ((z - z0) % 4 === 0 || (y - y0) % 4 === 0) put(g, out, [x, y, z], ["yellow_stained_glass_pane", pane("east")], over);
    else put(g, out, [x, y, z], "glass", over);
    if ((z - z0) % 4 === 2) put(g, out, [x - 1, y, z], "shroomlight", over);
  }
  return out;
}

/** marquee(g, [x0,y0,z0,x1,y1,z1], facing, { over }): a canopy over an entrance. white_terracotta on the top row; a
 *  polished_blackstone_stairs fascia along the facing edge under it; a lit soffit, shroomlight on every 2nd cell. */
export function marquee(g, b, facing, { over = false } = {}) {
  const out = empty(), [x0, y0, z0, x1, y1, z1] = norm(b), inward = { north: "south", south: "north", east: "west", west: "east" }[facing];
  if (!inward) throw new Error(`marquee: facing must be north, south, east or west (got ${facing})`);
  const front = { north: z0, south: z1, west: x0, east: x1 };
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    put(g, out, [x, y1, z], WHITE, over);
    const onFront = facing === "north" || facing === "south" ? z === front[facing] : x === front[facing];
    const along = facing === "north" || facing === "south" ? x - x0 : z - z0;
    if (onFront) put(g, out, [x, y1 - 1, z], B.stairs("polished_blackstone", inward, "top"), over);
    else if (along % 2 === 0) put(g, out, [x, y1 - 1, z], "shroomlight", over);
  }
  return out;
}

/** parapet(g, [x0, z0, x1, z1], topY, { over }): a flat roof's edge. white_terracotta course at topY+1 round the rectangle's edge,
 *  smooth_sandstone_slab (bottom) coping at topY+2; shroomlight in the deck (at topY, inside the edge) every 6 cells. */
export function parapet(g, [x0, z0, x1, z1], topY, { over = false } = {}) {
  const out = empty();
  for (const [x, z] of ringCells(x0, z0, x1, z1)) {
    put(g, out, [x, topY + 1, z], WHITE, over);
    put(g, out, [x, topY + 2, z], B.slab("smooth_sandstone", "bottom"), over);
  }
  ringCells(x0 + 1, z0 + 1, x1 - 1, z1 - 1).forEach(([x, z], i) => { if (i % 6 === 0) put(g, out, [x, topY, z], "shroomlight", over); });
  return out;
}

/** lampPost(g, x, y, z, { over }): a polished_blackstone_wall post two high with a lantern on top. */
export function lampPost(g, x, y, z, { over = false } = {}) {
  const out = empty();
  put(g, out, [x, y, z], ["polished_blackstone_wall", { up: "true" }], over);
  put(g, out, [x, y + 1, z], ["polished_blackstone_wall", { up: "true" }], over);
  put(g, out, [x, y + 2, z], B.lantern(false), over);
  return out;
}
