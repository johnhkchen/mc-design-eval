// Helpers for the lumber hall (plan.md VOCABULARY items 3, 6, 9, 12, 15, 18, 21): frameBay, loadingDoors, hoistHood,
// stairFlight, fasciaBoard, hangSign, plinthCourse. Each takes the grid (a runParts view or a Grid) first, then the plan's
// arguments, then an optional opts object. Coordinates are absolute, x east, y up, z south. The plan's north face is the
// one drawn here; for the south street pass the mirrored z (37 - z) and the mirrored facing.
// A helper writes only inside the footprint it works out from its arguments, and only into air: a cell that is not air
// (an earlier part's wall, floor or ground) is skipped and counted, never overwritten. Units that must not be half there
// (a door pair) are all-or-nothing. Each returns { placed, skipped, box }: box is the footprint, skipped a count.
import { B, DIRS, plaque, signboard } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const inside = ([x, y, z], [a, b, c, d, e, f]) =>
  x >= Math.min(a, d) && x <= Math.max(a, d) && y >= Math.min(b, e) && y <= Math.max(b, e) && z >= Math.min(c, f) && z <= Math.max(c, f);
const span = (a, b) => Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);
const bbox = (cells) => {
  const xs = cells.map((c) => c[0]), ys = cells.map((c) => c[1]), zs = cells.map((c) => c[2]);
  return [Math.min(...xs), Math.min(...ys), Math.min(...zs), Math.max(...xs), Math.max(...ys), Math.max(...zs)];
};
const checkFace = (name, face) => {
  if (!DIRS[face]) throw new Error(`${name}: face is north, south, east or west, got ${face}`);
};

/**
 * Write cells [x, y, z, block, state?, nbt?] into air inside `box`. A cell listed twice keeps its first entry. With
 * `atomic`, one blocked cell means nothing is written.
 */
function place(g, box, cells, { atomic = false } = {}) {
  const seen = new Set(), free = [];
  let skipped = 0;
  for (const c of cells) {
    const p = c.slice(0, 3), k = p.join(",");
    if (seen.has(k)) continue;
    seen.add(k);
    if (inside(p, box) && g.inBounds(...p) && g.isAir(...p)) free.push(c);
    else skipped++;
  }
  if (atomic && skipped) return { placed: 0, skipped };
  for (const [x, y, z, block, state, nbt] of free) g.set(x, y, z, block, state, nbt);
  return { placed: free.length, skipped };
}

// ---- frame bay (item 3) ----------------------------------------------------------------------------------------------
/**
 * A timber bay between two posts (plan FACADES, bays): stripped_dark_oak_log posts at x0 and x1 from y0 to y1, and inside:
 *   brace   solid: a rail at y0+1 across the bay; each half has a lower diagonal of dark_oak_stairs (bottom halves, rising
 *           to the middle) and an upper one (upside down, descending), calcite between
 *   mann    solid: as brace, but each half is one brace rising to a centre post at the middle column
 *   window  posts and calcite; the middle column stays air for windowUnit
 *   door    posts and calcite; x0+1..x0+2 stay air for loadingDoors
 * Needs x1 - x0 >= 2 and y1 - y0 >= 2. The split for an odd span puts the middle one column toward x0.
 */
export function frameBay(g, x0, x1, y0, y1, z, { fill = "brace" } = {}) {
  if (!["brace", "mann", "window", "door"].includes(fill)) throw new Error(`frameBay: fill is brace, mann, window or door, got ${fill}`);
  if (x1 - x0 < 2 || y1 - y0 < 2) throw new Error(`frameBay: posts need 2+ cells between them in x and y (got x ${x0}..${x1}, y ${y0}..${y1})`);
  const box = [x0, y0, z, x1, y1, z];
  const log = "stripped_dark_oak_log";
  const cells = [];
  for (const y of span(y0, y1)) for (const x of [x0, x1]) cells.push([x, y, z, log, { axis: "y" }]);

  const open = new Set();
  if (fill === "window") for (const y of span(y0, y1)) open.add(`${Math.floor((x0 + x1) / 2)},${y}`);
  if (fill === "door") for (const y of span(y0, y1)) for (const x of [x0 + 1, x0 + 2]) open.add(`${x},${y}`);

  if (fill === "brace" || fill === "mann") {
    const mid = x0 + Math.floor((x1 - x0) / 2), n = [mid - x0, x1 - mid];
    if (fill === "mann") for (const y of span(y0, y1)) cells.push([mid, y, z, log, { axis: "y" }]);
    for (const x of span(x0 + 1, x1 - 1)) cells.push([x, y0 + 1, z, log, { axis: "x" }]);
    const rl = Math.floor((y1 - y0) / 2), rise = y1 - 1 - y0;
    // the left half runs from x0 toward the middle, the right half from x1: k counts columns from the post
    for (const [post, dir, len] of [[x0, 1, n[0]], [x1, -1, n[1]]]) {
      const toMid = dir === 1 ? "east" : "west", toPost = dir === 1 ? "west" : "east";
      for (let k = 1; k < len; k++) {
        const x = post + dir * k;
        if (fill === "mann") cells.push([x, y0 + Math.round((k * rise) / len), z, ...B.stairs("dark_oak", toMid, "bottom")]);
        else {
          cells.push([x, y0 + Math.round((k * rl) / len), z, ...B.stairs("dark_oak", toMid, "bottom")]);
          cells.push([x, y1 - Math.round((k * rl) / len), z, ...B.stairs("dark_oak", toPost, "top")]);
        }
      }
    }
  }
  for (const x of span(x0 + 1, x1 - 1)) for (const y of span(y0, y1)) if (!open.has(`${x},${y}`)) cells.push([x, y, z, "calcite"]);
  return { ...place(g, box, cells), box };
}

// ---- loading doors (item 6) ------------------------------------------------------------------------------------------
/**
 * A pair of loading doors (plan item 6): two dark_oak_door leaves side by side, each 2 tall, hinged on opposite sides and
 * facing `face` (out of the wall), with a glass_pane transom across the top (y + 2) and a dark_oak_slab sill under them
 * (y - 1, where that cell is air). x, y, z is the lower left cell as seen from outside. A north or south wall runs the pair
 * along x; an east or west wall runs it along z. The leaves are all-or-nothing; the transom and sill fill what is air.
 */
export function loadingDoors(g, x, y, z, face) {
  checkFace("loadingDoors", face);
  const along = face === "north" || face === "south" ? [1, 0, 0] : [0, 0, 1];
  const at = (i, dy) => [x + along[0] * i, y + dy, z + along[2] * i];
  const pane = along[0] ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" };
  const hinge = ["left", "right"];
  const leaves = [], rest = [];
  for (const i of [0, 1]) {
    leaves.push([...at(i, 0), "dark_oak_door", { facing: face, half: "lower", hinge: hinge[i], open: "false" }]);
    leaves.push([...at(i, 1), "dark_oak_door", { facing: face, half: "upper", hinge: hinge[i], open: "false" }]);
    rest.push([...at(i, 2), "glass_pane", pane]);
    rest.push([...at(i, -1), "dark_oak_slab", { type: "bottom" }]);
  }
  const box = [...at(0, -1), ...at(1, 2)];
  const doors = place(g, box, leaves, { atomic: true });
  if (!doors.placed) return { ...doors, box };
  const fit = place(g, box, rest);
  return { placed: doors.placed + fit.placed, skipped: fit.skipped, box };
}

// ---- hoist hood (item 9) ---------------------------------------------------------------------------------------------
/**
 * The hoist hood over a beam (plan item 9): a small gable of dark_oak_stairs at y 31, across x0..x0+3 and rows z0..z0+2
 * (north: x 10..13, z 1..3, over the beam at x 11..12). The slopes run across the beam, so the hood is the same for either
 * street; face names the street and is checked only. Pass z0 = 34 for the south street.
 */
export function hoistHood(g, x0, z0, face) {
  if (face !== "north" && face !== "south") throw new Error(`hoistHood: face is north or south, got ${face}`);
  const box = [x0, 31, z0, x0 + 3, 31, z0 + 2];
  const cells = [];
  for (const z of span(z0, z0 + 2)) {
    cells.push([x0, 31, z, ...B.stairs("dark_oak", "east", "bottom")]);
    cells.push([x0 + 1, 31, z, ...B.stairs("dark_oak", "east", "bottom")]);
    cells.push([x0 + 2, 31, z, ...B.stairs("dark_oak", "west", "bottom")]);
    cells.push([x0 + 3, 31, z, ...B.stairs("dark_oak", "west", "bottom")]);
  }
  return { ...place(g, box, cells), box };
}

// ---- stair flight (item 12) ------------------------------------------------------------------------------------------
/**
 * A straight stair flight (plan item 12): `steps` treads of dark_oak_stairs rising in `dir`. The first tread is the cell
 * (x, y0, z0); the flight is two treads wide across its run (x..x+1 for north or south, z0..z0+1 for east or west).
 * Under each tread an upside-down dark_oak_stairs is the stringer; a 2x2 dark_oak_planks landing sits at the top, at
 * y0 + steps. `rail` (optional) is a dark_oak_fence on the open side, one per tread: east or west for a north/south flight,
 * north or south for an east/west one. Stair 1 of the plan: stairFlight(g, 3, 5, 13, "south", 7, { rail: "east" }).
 * The stringer and landing are skipped where the cell is not air, so the floor and the ground under the flight stay.
 */
export function stairFlight(g, x, y0, z0, dir, steps, { rail = null } = {}) {
  const d = DIRS[dir];
  if (!d || !(steps >= 1)) throw new Error(`stairFlight: dir is north, south, east or west, steps >= 1 (got ${dir}, ${steps})`);
  const across = d[0] === 0 ? "x" : "z";
  const railSides = across === "x" ? ["east", "west"] : ["north", "south"];
  if (rail !== null && !railSides.includes(rail)) throw new Error(`stairFlight: rail for this flight is ${railSides.join(" or ")}, got ${rail}`);
  // pos(run, w, rise): run steps along dir, w across the flight (0..1 under it, 2 or -1 on the rail side), rise up
  const pos = (run, w, rise) => (across === "x" ? [x + w, y0 + rise, z0 + d[2] * run] : [x + d[0] * run, y0 + rise, z0 + w]);
  const cells = [];
  for (let i = 0; i < steps; i++) {
    for (const w of [0, 1]) {
      cells.push([...pos(i, w, i), ...B.stairs("dark_oak", dir, "bottom")]);
      cells.push([...pos(i, w, i - 1), ...B.stairs("dark_oak", dir, "top")]);
    }
    if (rail !== null) {
      const lat = rail === "east" || rail === "south" ? 2 : -1;
      const state = across === "x" ? { north: "true", south: "true", east: "false", west: "false" } : { east: "true", west: "true", north: "false", south: "false" };
      cells.push([...pos(i, lat, i + 1), "dark_oak_fence", state]);
    }
  }
  for (const run of [steps, steps + 1]) for (const w of [0, 1]) cells.push([...pos(run, w, steps), "dark_oak_planks"]);
  const box = bbox(cells);
  return { ...place(g, box, cells), box };
}

// ---- fascia board (item 15) ------------------------------------------------------------------------------------------
/**
 * A shop fascia (plan item 15): `<wood>_planks` across x0..x1 for three rows (y..y+2, plan 9..11) on the wall plane z (plan
 * 5 for the north street, 32 for the south: opts.z), with dark_oak_planks at both ends. The business name goes on it as
 * banner letters (style banner, no board: the letters hang on the band, out to the street). Only north and south streets.
 */
export function fasciaBoard(g, x0, x1, face, wood, name, { y = 9, z = face === "south" ? 32 : 5 } = {}) {
  if (face !== "north" && face !== "south") throw new Error(`fasciaBoard: face is north or south, got ${face}`);
  const out = DIRS[face][2];
  const box = [x0, y, Math.min(z, z + out), x1, y + 2, Math.max(z, z + out)];   // the band and the letters' cells out to the street
  const cells = [];
  for (const yy of span(y, y + 2)) for (const x of span(x0, x1)) cells.push([x, yy, z, x === x0 || x === x1 ? "dark_oak_planks" : `${wood}_planks`]);
  const band = place(g, box, cells);
  // banner letters read left to right from outside: the first letter is the east end on the north street
  const at = [face === "north" ? x1 : x0, y, z];
  const letters = plaque(g, name, { at, face, width: x1 - x0 + 1, height: 3, material: null, style: "banner", frame: null, avoid: (p) => !inside(p, box) });
  return { placed: band.placed + letters.cells, skipped: band.skipped + letters.skipped, box };
}

// ---- hanging sign (item 18) ------------------------------------------------------------------------------------------
/**
 * A hanging shop sign on a pier (plan item 18): a dark_oak_fence arm out from the wall at (x, y, z) (z 5 north, 32 south:
 * opts.z), a `<wood>_planks` blade hung under the arm's end (two rows, top at y-1, text on both faces), and a hanging
 * lantern beside the arm at (x+1, y, arm cell). The lantern is written only when the cell above it is solid. Plan default
 * y 11: the blade sits at y 9..10.
 */
export function hangSign(g, x, face, wood, name, { y = 11, z = face === "south" ? 32 : 5 } = {}) {
  if (face !== "north" && face !== "south") throw new Error(`hangSign: face is north or south, got ${face}`);
  const out = DIRS[face][2];
  const box = [x - 1, y - 2, Math.min(z, z + 3 * out), x + 1, y, Math.max(z, z + 3 * out)];
  const sign = signboard(g, name, { at: [x, y, z], face, mode: "hanging", width: 2, height: 2, wood, board: `${wood}_planks`, bracket: "dark_oak_fence", chains: false, avoid: (p) => !inside(p, box) });
  const lamp = [x + 1, y, z + out];
  const hung = g.isAir(x + 1, y + 1, z + out) ? { placed: 0, skipped: 1 } : place(g, box, [[...lamp, "lantern", { hanging: "true" }]]);
  return { placed: sign.cells + hung.placed, skipped: sign.skipped + hung.skipped, box };
}

// ---- plinth course (item 21) -----------------------------------------------------------------------------------------
/** The plinth course (plan item 21): cobbled_deepslate along the wall line z from x0 to x1, at y (plan 5). */
export function plinthCourse(g, x0, x1, z, { y = 5 } = {}) {
  const box = [x0, y, z, x1, y, z];
  const cells = span(x0, x1).map((x) => [x, y, z, "cobbled_deepslate"]);
  return { ...place(g, box, cells), box };
}
