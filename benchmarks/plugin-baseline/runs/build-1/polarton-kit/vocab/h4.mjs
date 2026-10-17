// Polarton kit vocabulary, group h4 (plan.md VOCABULARY): boardWall, hoistBeam, shutterPair, porchWrap, bayWindow,
// headstone, woodRick, flight.
//
// Every helper takes its own position (and facing, where it has one) as arguments. It writes only inside the
// footprint it was given and only into air: an occupied cell is refused and listed, never overwritten. The one
// exception is an option that says carve: true (the stair joiner cutting a floor for a flight's headroom).
// Returns { placed, refused } with refused = [[x, y, z, block, reason], ...]. flight is all-or-nothing: a stair with
// a missing step is a broken route, so it writes nothing when any required cell is refused.
//
// Blocks are plan.md PALETTE ids, checked with `mcd blocks --check`. Not used: polished_andesite_wall and
// calcite_slab (not blocks in 26.3); headstones use polished_andesite instead.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const STEP = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };
// the way out of a wall face: a trapdoor shutter sits one cell in front of the wall
const OUT = { north: [0, 0, -1], south: [0, 0, 1], east: [1, 0, 0], west: [-1, 0, 0] };

const norm = ([x0, y0, z0, x1, y1, z1]) =>
  [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1), Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)];
const within = ([x0, y0, z0, x1, y1, z1], x, y, z) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;

// A plan is a Map of "x,y,z" -> entry. A later put for the same cell replaces the earlier one, so each cell is written once.
const planner = () => {
  const plan = new Map();
  const put = (x, y, z, block, state, optional = false) => plan.set(`${x},${y},${z}`, { pos: [x, y, z], block, state, optional });
  return { plan, put };
};

// Writes a plan. Air only unless carve; cells outside box (when given) are refused; optional entries are skipped quietly.
// all: write nothing unless every required entry can be written.
function commit(g, plan, { box = null, carve = false, all = false } = {}) {
  const refused = [], todo = [];
  for (const c of plan.values()) {
    const [x, y, z] = c.pos;
    let why = null;
    if (!g.inBounds(x, y, z)) why = "out of bounds";
    else if (box && !within(box, x, y, z)) why = "outside footprint";
    else if (!g.isAir(x, y, z) && !(carve && !c.optional)) why = "occupied";
    if (why && c.optional) continue;
    if (why) refused.push([x, y, z, c.block, why]);
    else todo.push(c);
  }
  if (all && refused.length) return { placed: 0, refused };
  for (const c of todo) g.set(c.pos[0], c.pos[1], c.pos[2], c.block, c.state);
  return { placed: todo.length, refused };
}

const bounds = (plan) => {
  const pts = [...plan.values()].map((c) => c.pos);
  return [
    Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.min(...pts.map((p) => p[2])),
    Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[2])),
  ];
};

/**
 * Board-and-batten wall over box (inclusive, one cell thick): planks field, post-coloured posts at both ends of the
 * run and battens every `batten`-th column (vertical), beam rows along the run at beams (default: the box's bottom
 * and top rows). leave: boxes that stay as they are (openings the shell left empty).
 */
export function boardWall(g, box, { plank = "spruce_planks", post = "stripped_spruce_log", batten = 3, beams = null, leave = [] } = {}) {
  const b = norm(box), [x0, y0, z0, x1, y1, z1] = b;
  const run = x0 !== x1 ? "x" : "z", lo = run === "x" ? x0 : z0, hi = run === "x" ? x1 : z1;
  const idx = (x, z) => (run === "x" ? x : z);
  const { plan, put } = planner();
  const left = (x, y, z) => leave.some((l) => within(norm(l), x, y, z));
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    if (left(x, y, z)) continue;
    const i = idx(x, z), edge = i === lo || i === hi;
    if (edge || (i - lo) % batten === 0) put(x, y, z, ...B.pillar(post, "y"));
    else put(x, y, z, plank);
  }
  for (const by of beams ?? [y0, y1]) {
    if (by < y0 || by > y1) continue;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const i = idx(x, z);
      if (i === lo || i === hi || left(x, by, z)) continue;   // the corners keep their posts
      put(x, by, z, ...B.pillar(post, run));
    }
  }
  return commit(g, plan, { box: b });
}

/**
 * Hoist beam: a beam of `len` cells along z from (x, y, z0), an iron chain hanging from its first cell, a hay bale on the chain.
 */
export function hoistBeam(g, x, y, z0, { len = 3, beam = "stripped_spruce_log" } = {}) {
  const { plan, put } = planner();
  for (let i = 0; i < len; i++) put(x, y, z0 + i, ...B.pillar(beam, "z"));
  put(x, y - 1, z0, ...B.chain("y"));
  put(x, y - 2, z0, ...B.pillar("hay_block", "y"));
  return commit(g, plan, { box: [x, y - 2, z0, x, y, z0 + len - 1] });
}

/**
 * Shutters either side of a window. (x, y, z) is the window's cell in the wall; the two shutters stand one cell in front
 * of the wall (on the face side), one cell either side of it, `height` cells tall, open and lying flat. The window itself
 * is not placed here. face: the way the wall looks; wood: the trapdoor wood (spruce -> spruce_trapdoor).
 */
export function shutterPair(g, x, y, z, face, wood = "spruce", { height = 2 } = {}) {
  const [ox, , oz] = OUT[face];
  const along = face === "north" || face === "south" ? [1, 0] : [0, 1];   // along the wall, in x and z
  const { plan, put } = planner();
  for (const side of [-1, 1]) {
    const sx = x + along[0] * side + ox, sz = z + along[1] * side + oz;
    for (let i = 0; i < height; i++) put(sx, y + i, sz, ...B.trapdoor(wood, face, "bottom", true));
  }
  return commit(g, plan, { box: bounds(plan) });
}

/**
 * Wraparound porch with its own roof. Footprint: the front leg is z0..z0+1 across x0..x1, the east leg is x1-1..x1 from
 * z0+2 to z1 (the plan's owner porch). Deck at y; posts (calcite) at y+1..y+3 on the front every 3 and at x1 every 4 along
 * the east, corners included; pale_oak beam at y+4; spindle frieze (closed top trapdoors) under the beam between posts;
 * balustrade (pale_oak_fence) at y+1 except the posts and gap = [xa, xb] on the front; copper roof at y+5: stairs on the
 * outer edges (falling outward), flat slabs inside.
 */
export function porchWrap(g, { x0, x1, z0, z1, y = 1, gap = null } = {}) {
  const deck = "mangrove_planks", post = "calcite", beam = "pale_oak_log", rail = "pale_oak_fence", roof = "waxed_oxidized_cut_copper";
  const { plan, put } = planner();
  const onLeg = (x, z) => z <= z0 + 1 || x >= x1 - 1;
  const frontX = new Set(), eastZ = new Set();
  for (let x = x0; x <= x1; x += 3) frontX.add(x);
  frontX.add(x1);
  for (let z = z0 + 4; z <= z1; z += 4) eastZ.add(z);
  eastZ.add(z1);

  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!onLeg(x, z)) continue;
    put(x, y, z, deck);
    if (z === z0) put(x, y + 5, z, ...B.stairs(roof, "south", "bottom"));          // falls to the north (the lane)
    else if (x === x1) put(x, y + 5, z, ...B.stairs(roof, "west", "bottom"));      // falls to the east
    else put(x, y + 5, z, ...B.slab(roof, "bottom"));
  }
  // balustrade first, so the posts below win their cells
  for (let x = x0; x <= x1; x++) if (!frontX.has(x) && !(gap && x >= gap[0] && x <= gap[1])) put(x, y + 1, z0, rail);
  for (let z = z0 + 1; z <= z1; z++) if (!eastZ.has(z)) put(x1, y + 1, z, rail);
  for (const x of frontX) for (let k = 1; k <= 3; k++) put(x, y + k, z0, post);
  for (const z of eastZ) for (let k = 1; k <= 3; k++) put(x1, y + k, z, post);
  for (let x = x0; x <= x1; x++) put(x, y + 4, z0, ...B.pillar(beam, "x"));
  for (let z = z0 + 1; z <= z1; z++) put(x1, y + 4, z, ...B.pillar(beam, "z"));
  for (let x = x0 + 1; x < x1; x++) if (!frontX.has(x)) put(x, y + 3, z0, ...B.trapdoor("pale_oak", "north", "top", false));
  // connections: a fence joins each neighbour that is also a rail in this plan
  for (const c of plan.values()) {
    if (c.block !== rail) continue;
    const [x, yy, z] = c.pos, joins = (dx, dz) => (plan.get(`${x + dx},${yy},${z + dz}`)?.block === rail ? "true" : "false");
    c.state = { north: joins(0, -1), east: joins(1, 0), south: joins(0, 1), west: joins(-1, 0) };
  }
  return commit(g, plan, { box: [x0, y, z0, x1, y + 5, z1] });
}

/**
 * Bay window on the front plane z (one cell thick): brick corners at x0 and x1 from y0 to y1; between them glass in the
 * glass row ranges (default y0+1..y0+2 and y0+6..y0+7, the owner's y 3..4 and 8..9), a calcite panel over the panel range
 * (default y0+3..y0+5, y 5..7), a smooth stone sill (top slab) on y0, bricks on the top row.
 */
export function bayWindow(g, { x0, x1, z, y0, y1, glass = null, panel = null } = {}) {
  const glassRows = glass ?? [[y0 + 1, y0 + 2], [y0 + 6, y0 + 7]];
  const panelRows = panel ?? [y0 + 3, y0 + 5];
  const { plan, put } = planner();
  for (let y = y0; y <= y1; y++) {
    put(x0, y, z, "bricks");
    put(x1, y, z, "bricks");
    for (let x = x0 + 1; x < x1; x++) {
      if (glassRows.some(([a, b]) => y >= a && y <= b)) put(x, y, z, "glass_pane");
      else if (y >= panelRows[0] && y <= panelRows[1]) put(x, y, z, "calcite");
      else if (y === y0) put(x, y, z, ...B.slab("smooth_stone", "top"));
      else put(x, y, z, "bricks");
    }
  }
  return commit(g, plan, { box: [x0, y0, z, x1, y1, z] });
}

/**
 * Headstone at (x, y, z) with a coarse dirt mound one cell in front (toward the lane, -z). kind "low": a polished andesite
 * slab; "tall": two polished andesite cells stacked (the palette's polished_andesite_wall is not a block in 26.3).
 */
export function headstone(g, x, z, kind = "low", y = 1) {
  if (kind !== "low" && kind !== "tall") throw new Error(`headstone: kind must be low or tall, got ${kind}`);
  const { plan, put } = planner();
  put(x, y, z - 1, "coarse_dirt");
  if (kind === "low") put(x, y, z, ...B.slab("polished_andesite", "bottom"));
  else { put(x, y, z, "polished_andesite"); put(x, y + 1, z, "polished_andesite"); }
  return commit(g, plan, { box: [x, y, z - 1, x, y + (kind === "tall" ? 1 : 0), z] });
}

/**
 * Cordwood rick: logs laid across the axis over the whole box (inclusive). Default: stripped oak logs along x.
 */
export function woodRick(g, box, { log = "stripped_oak_log", axis = "x" } = {}) {
  const b = norm(box), [x0, y0, z0, x1, y1, z1] = b;
  const { plan, put } = planner();
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) put(x, y, z, ...B.pillar(log, axis));
  return commit(g, plan, { box: b });
}

/**
 * A straight flight of stairs a player walks up (the build library's rule, as a helper): from = the first step's cell
 * (standing on the lower floor), facing = the way you walk up, to = the y of the UPPER FLOOR's block layer (the top step
 * sits in it, so the floor above is cut where the flight passes). Headroom of two cells over every step, an upside-down
 * stair under each step as a stringer (optional: only where air). width runs to the right of facing.
 * Needs carve: true when the flight passes a floor that is already built (the top step replaces its floor block).
 * Returns { placed, refused, steps, landing: [x, y, z] feet on the upper floor, notes }.
 */
export function flight(g, { from: [x, y, z], facing, to, material = "spruce", width = 1, carve = false }) {
  const [dx, dz] = STEP[facing], [rx, rz] = [-dz, dx], n = to - y + 1;
  if (n < 1) return { placed: 0, refused: [], steps: 0, landing: null, notes: [`flight: to (${to}) is below the first step (${y})`] };
  const { plan, put } = planner();
  for (let i = 0; i < n; i++) for (let w = 0; w < width; w++) {
    const sx = x + dx * i + rx * w, sy = y + i, sz = z + dz * i + rz * w;
    put(sx, sy, sz, ...B.stairs(material, facing, "bottom", "straight"));
    put(sx, sy + 1, sz, "air");
    put(sx, sy + 2, sz, "air");
    if (i > 0) put(sx, sy - 1, sz, ...B.stairs(material, OPP[facing], "top", "straight"), true);
  }
  const landing = [x + dx * n, to + 1, z + dz * n], notes = [];
  if (!g.isAir(...landing) || !g.isAir(landing[0], landing[1] + 1, landing[2])) notes.push(`flight: the landing ${landing} is not clear`);
  return { ...commit(g, plan, { carve, all: true }), steps: n, landing, notes };
}
