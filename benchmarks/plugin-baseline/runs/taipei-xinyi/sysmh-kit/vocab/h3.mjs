// vocab/h3.mjs: the seven helpers plan.md VOCABULARY gives this part: cheek_wall, eave_bracket, hip_ridge,
// portal_lintel, name_board, gallery_lantern, hedge_run. Each takes its position (and side, corner, face) as arguments,
// writes only its own footprint, and only into air: a cell that is not air belongs to an earlier part, so it is refused
// and listed, never overwritten. Every helper returns { placed: [[x, y, z], ...], refused: [{ at, why }, ...] }.
import { B, plaque } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const K = (x, y, z) => `${x},${y},${z}`;
const lo = (a, b) => Math.min(a, b);
const hi = (a, b) => Math.max(a, b);
const span = (a, b) => Array.from({ length: hi(a, b) - lo(a, b) + 1 }, (_, i) => lo(a, b) + i);
const boxFoot = (a, b) => (x, y, z) =>
  x >= lo(a[0], b[0]) && x <= hi(a[0], b[0]) && y >= lo(a[1], b[1]) && y <= hi(a[1], b[1]) && z >= lo(a[2], b[2]) && z <= hi(a[2], b[2]);

// Every block goes through here. A cell outside the footprint is a bug in the helper, so it throws; a cell that is not
// air is owned by an earlier part, so it is refused and reported.
function writer(g, inFoot) {
  const placed = [], refused = [];
  const put = (x, y, z, block, state, nbt) => {
    if (!inFoot(x, y, z)) throw new Error(`helper wrote outside its footprint at ${K(x, y, z)}`);
    if (!g.inBounds(x, y, z)) refused.push({ at: [x, y, z], why: "outside the grid" });
    else if (!g.isAir(x, y, z)) refused.push({ at: [x, y, z], why: `not air (${g.blockAt(x, y, z)})` });
    else { g.set(x, y, z, block, state, nbt); placed.push([x, y, z]); }
  };
  return { put, result: () => ({ placed, refused }) };
}

// plaque() writes through g.set: hand it a view whose set() goes through the writer, so its cells are checked too.
const viewOf = (g, put) => new Proxy(g, {
  get: (t, p) => (p === "set" ? put : typeof Reflect.get(t, p) === "function" ? Reflect.get(t, p).bind(t) : Reflect.get(t, p)),
});

/** Stone cheek walls beside the south steps: stone_bricks at y 1..2 over x0..x1, z0..z1 (plan: x 52..55 and 96..99, z 144..155). */
export function cheek_wall(g, x0, x1, z0, z1) {
  const w = writer(g, boxFoot([x0, 1, z0], [x1, 2, z1]));
  for (const x of span(x0, x1)) for (const y of [1, 2]) for (const z of span(z0, z1)) w.put(x, y, z, "stone_bricks");
  return w.result();
}

/** Eave bracket: smooth_stone_slab (type top) at y 21 either side of the column centre (cx, cz), under the beam. side is the
 *  facade it sits on: north/south spread the two brackets along x (cx ± 1), east/west along z (cz ± 1). */
export function eave_bracket(g, cx, cz, side) {
  const cells = {
    north: [[cx - 1, cz], [cx + 1, cz]], south: [[cx - 1, cz], [cx + 1, cz]],
    east: [[cx, cz - 1], [cx, cz + 1]], west: [[cx, cz - 1], [cx, cz + 1]],
  }[side];
  if (!cells) throw new Error(`eave_bracket: side must be north, south, east or west (got ${side})`);
  const foot = new Set(cells.map(([x, z]) => K(x, 21, z)));
  const w = writer(g, (x, y, z) => foot.has(K(x, y, z)));
  for (const [x, z] of cells) w.put(x, 21, z, ...B.slab("smooth_stone", "top"));
  return w.result();
}

// Main roof surface y by distance d in from the eave (plan.md ROOFS d-table). The corner upsweep is on the eave edge only,
// so the ridge does not take it: adding it on the diagonal would dip the ridge where the lift steps down.
const roofY = (d) => (d <= 2 ? 24 : d <= 5 ? 25 : d <= 8 ? 26 : d <= 11 ? 27 : d <= 13 ? 28 : d <= 15 ? 29 : d <= 17 ? 30 : d <= 19 ? 31 : d <= 21 ? 32 : d <= 29 ? d + 11 : 41);
// Each corner: the corner cell, and the step (dx, dz) from it along the diagonal toward the centre.
const CORNERS = { nw: [10, 10, 1, 1], ne: [141, 10, -1, 1], sw: [10, 141, 1, -1], se: [141, 141, -1, -1] };

/** Hip ridge on one diagonal: smooth_stone one block above the roof, from d 4 out to the top deck rim (d 30). The four tip
 *  cells (d 0..3) are left to the corner flick, which curls them up. corner: nw, ne, sw or se. */
export function hip_ridge(g, corner) {
  const c = CORNERS[corner];
  if (!c) throw new Error(`hip_ridge: corner must be nw, ne, sw or se (got ${corner})`);
  const [cx, cz, dx, dz] = c;
  const cells = span(4, 30).map((k) => [cx + dx * k, roofY(k) + 1, cz + dz * k]);
  const foot = new Set(cells.map(([x, y, z]) => K(x, y, z)));
  const w = writer(g, (x, y, z) => foot.has(K(x, y, z)));
  for (const [x, y, z] of cells) w.put(x, y, z, "smooth_stone");
  return w.result();
}

/** South portal lintel box over x0..x1, z0..z1: smooth_stone at y 37..40, yellow_concrete deck at y 41, smooth_stone parapet
 *  at y 42 on the box's edge, and a dentil (smooth_stone_slab top on every 2nd cell) at y 36 along the z1 edge. */
export function portal_lintel(g, x0, x1, z0, z1) {
  const w = writer(g, boxFoot([x0, 36, z0], [x1, 42, z1]));
  const [X0, X1, Z0, Z1] = [lo(x0, x1), hi(x0, x1), lo(z0, z1), hi(z0, z1)];
  for (const x of span(X0, X1)) for (const z of span(Z0, Z1)) {
    for (const y of [37, 38, 39, 40]) w.put(x, y, z, "smooth_stone");
    w.put(x, 41, z, "yellow_concrete");
    if (x === X0 || x === X1 || z === Z0 || z === Z1) w.put(x, 42, z, "smooth_stone");
  }
  for (const x of span(X0, X1)) if ((x - X0) % 2 === 0) w.put(x, 36, Z1, ...B.slab("smooth_stone", "top"));
  return w.result();
}

const OUT = { south: 1, east: 1, north: -1, west: -1 };

/** Name board on a facade: black_concrete over u0..u1 and y0..y1 on the wall plane d, a gold_block frame ring around it, and
 *  the text in banner letters hung on the board's outer face (plaque, material null). u is x on north/south facades and z on
 *  east/west ones. face: north, south, east or west. */
export function name_board(g, face, u0, u1, y0, y1, d, text = "SUN YAT-SEN") {
  if (!(face in OUT)) throw new Error(`name_board: face must be north, south, east or west (got ${face})`);
  const at = (u, v, depth) => (face === "east" || face === "west" ? [depth, v, u] : [u, v, depth]);
  const [U0, U1, V0, V1] = [lo(u0, u1), hi(u0, u1), lo(y0, y1), hi(y0, y1)];
  const board = [], frame = [];
  for (const u of span(U0, U1)) for (const v of span(V0, V1)) board.push(at(u, v, d));
  for (const u of span(U0 - 1, U1 + 1)) for (const v of span(V0 - 1, V1 + 1))
    if (u < U0 || u > U1 || v < V0 || v > V1) frame.push(at(u, v, d));
  const letters = [];
  for (const u of span(U0, U1)) for (const v of span(V0, V1)) letters.push(at(u, v, d + OUT[face]));
  const foot = new Set([...board, ...frame, ...letters].map((c) => K(...c)));
  const w = writer(g, (x, y, z) => foot.has(K(x, y, z)));
  for (const c of board) w.put(...c, "black_concrete");
  for (const c of frame) w.put(...c, "gold_block");
  // The letters read against the board just placed (material null: no board of plaque's own).
  plaque(viewOf(g, w.put), text, { at: at(U0, V0, d), face, width: U1 - U0 + 1, height: V1 - V0 + 1, letter: "yellow", material: null });
  return w.result();
}

/** Hanging gallery lantern under the eave beam at (x, z): chain at y 21 and a hanging lantern at y 20. The chain hangs from the
 *  beam at y 22, so nothing is placed when that cell is air. */
export function gallery_lantern(g, x, z) {
  if (!g.inBounds(x, 22, z) || g.isAir(x, 22, z)) return { placed: [], refused: [{ at: [x, 22, z], why: "nothing above to hang from" }] };
  const w = writer(g, (px, py, pz) => px === x && pz === z && (py === 20 || py === 21));
  w.put(x, 21, z, "chain", { axis: "y", waterlogged: "false" });
  w.put(x, 20, z, ...B.lantern(true));
  return w.result();
}

/** Hedge two cells deep (z, z+1) and two high (y 1..2), from x0 to x1: azalea_leaves, with flowering_azalea_leaves on 1 cell in 4. */
export function hedge_run(g, x0, x1, z) {
  const w = writer(g, boxFoot([x0, 1, z], [x1, 2, z + 1]));
  const leaf = { persistent: "true", distance: "1", waterlogged: "false" };
  for (const x of span(x0, x1)) for (const y of [1, 2]) for (const zz of [z, z + 1])
    w.put(x, y, zz, (x + y + zz) % 4 === 0 ? "flowering_azalea_leaves" : "azalea_leaves", leaf);
  return w.result();
}
