// Vocabulary helpers from plan.md (VOCABULARY, part 2): lamp_post, gable_infill, french_pair, turned_post,
// chimney_stack, table_set, rocker, hay_stack, rain_barrels, garden_bed.
// Each takes its position as arguments and writes only into air. A multi-block piece is all-or-nothing: if any
// cell of its footprint is not air it writes nothing and returns false. gable_infill fills the air cells of its
// triangle and returns how many it placed.
import { chimney, B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const key = (x, y, z) => `${x},${y},${z}`;
const isAir = (g, x, y, z) => g.inBounds(x, y, z) && g.isAir(x, y, z);

// Writes [x, y, z, block, state?, nbt?] entries only if every target cell is air.
function place(g, plan) {
  if (!plan.every(([x, y, z]) => isAir(g, x, y, z))) return false;
  for (const [x, y, z, block, state, nbt] of plan) g.set(x, y, z, block, state, nbt);
  return true;
}

// A fence joins the fences beside it on the same level; only the true sides are written (absent = false).
function fenceState(fences, x, y, z) {
  const join = (dx, dz) => fences.has(key(x + dx, y, z + dz));
  return Object.fromEntries([["north", join(0, -1)], ["east", join(1, 0)], ["south", join(0, 1)], ["west", join(-1, 0)]].filter(([, on]) => on));
}

// Run axis for a table: "x" / "east" / "west" run along x, anything else along z.
const along = (dir) => (/^(x|east|west)$/.test(dir) ? [1, 0] : [0, 1]);

// Lamp post on the lane's south edge: spruce_fence y..y+2, standing lantern at y+3 on top of it.
export function lamp_post(g, x, z = 4, y = 1) {
  const fence = [0, 1, 2].map((i) => [x, y + i, z, "spruce_fence", {}]);
  return place(g, [...fence, [x, y + 3, z, ...B.lantern(false)]]);
}

// Triangle of wall in the plane z: course y0 spans x0..x1, each course up narrows by one cell per side.
// Fills air only, so cells that are already built (or reserved openings) are left alone.
export function gable_infill(g, z, x0, x1, y0, y1, field) {
  const [block, state] = Array.isArray(field) ? field : [field];
  let placed = 0;
  for (let y = y0; y <= y1; y++) {
    const k = y - y0;
    for (let x = x0 + k; x <= x1 - k; x++) if (isAir(g, x, y, z)) { g.set(x, y, z, block, state); placed++; }
  }
  return placed;
}

// Two closed dark_oak_door leaves at x0 and x0+1 (both halves each), hinges on the outer edges, a glass_pane
// transom over each leaf at y+2. face = the way the front looks out; the pair runs along x, so north or south.
export function french_pair(g, x0, y, z, face) {
  if (!/^(north|south)$/.test(face)) throw new Error(`french_pair: face must be north or south (the pair runs along x), got ${face}`);
  // The viewer stands outside looking back in; on the viewer's left is east for a north front, west for a south one.
  const [hingeX0, hingeX1] = face === "south" ? ["left", "right"] : ["right", "left"];
  const leaf = (x, hinge) => [0, 1].map((dy) => [x, y + dy, z, "dark_oak_door", { facing: face, half: dy ? "upper" : "lower", hinge, open: "false" }]);
  const transom = (x, side) => [x, y + 2, z, "glass_pane", { [side]: "true" }];
  return place(g, [...leaf(x0, hingeX0), ...leaf(x0 + 1, hingeX1), transom(x0, "east"), transom(x0 + 1, "west")]);
}

// Turned porch post: stripped_birch_log base at y, birch_fence shaft at y+1..y+2, and one upside-down birch stair
// bracket either side at y+2, each one's back against the post. beam = the axis the porch beam runs along (x or z).
export function turned_post(g, x, z, y = 3, beam = "x") {
  const [dx, dz] = beam === "z" ? [0, 1] : [1, 0];
  const [fromLeft, fromRight] = beam === "z" ? ["south", "north"] : ["east", "west"];
  return place(g, [
    [x, y, z, "stripped_birch_log", { axis: "y" }],
    [x, y + 1, z, "birch_fence", {}],
    [x, y + 2, z, "birch_fence", {}],
    [x - dx, y + 2, z - dz, ...B.stairs("birch", fromLeft, "top")],
    [x + dx, y + 2, z + dz, ...B.stairs("birch", fromRight, "top")],
  ]);
}

// Exterior chimney (the toolkit's chimney()). Air only, with one exception: cut: true lets the planned cells in
// the wall plane (the mouth and its lintel) replace the house wall. The plan is measured on a recording proxy first,
// so a refused chimney writes nothing.
export function chimney_stack(g, { cut = false, ...opts }) {
  const plan = [];
  const probe = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, block, state, nbt) => { plan.push([x, y, z, block, state, nbt]); return target; };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  chimney(probe, opts);
  const [wx, , wz] = opts.wall ?? [];
  const alongX = opts.into === "east" || opts.into === "west";
  const inWall = ([x, , z]) => cut && opts.wall && (alongX ? x === wx : z === wz);
  if (!plan.every(([x, y, z]) => g.inBounds(x, y, z) && (isAir(g, x, y, z) || inWall([x, y, z])))) return false;
  chimney(g, opts);
  return true;
}

// Table: spruce_fence legs at the two ends (y), a spruce_slab top at y+1 across len cells. dir = x/east/west or
// z/north/south. The cells past each end at y and y+1 must be air: that 2-high lane stays clear to walk past.
export function table_set(g, x, y, z, len, dir) {
  const [dx, dz] = along(dir);
  const at = (i) => [x + dx * i, y, z + dz * i];
  const legs = [...new Set([0, len - 1])].map((i) => at(i));
  const fences = new Set(legs.map(([lx, ly, lz]) => key(lx, ly, lz)));
  const lane = [-1, len].flatMap((i) => [[x + dx * i, y, z + dz * i], [x + dx * i, y + 1, z + dz * i]]);
  if (!lane.every(([lx, ly, lz]) => isAir(g, lx, ly, lz))) return false;
  const top = [...Array(len).keys()].map((i) => [x + dx * i, y + 1, z + dz * i, ...B.slab("spruce", "bottom")]);
  return place(g, [...legs.map(([lx, ly, lz]) => [lx, ly, lz, "spruce_fence", fenceState(fences, lx, ly, lz)]), ...top]);
}

// Rocker: a dark_oak_stairs seat at (x, y, z) whose back faces away from where the sitter looks; an open
// spruce_trapdoor behind it as the back. facing = the way the sitter looks. The cell behind the back must be a
// wall or rail (the trapdoor hangs on it), and the cells in front of the seat at y and y+1 must be air.
export function rocker(g, x, y, z, facing) {
  const back = OPPOSITE[facing];
  const [fx, , fz] = DIRS[facing];
  const [bx, , bz] = DIRS[back];
  const front = [[x + fx, y, z + fz], [x + fx, y + 1, z + fz]];
  if (!front.every(([fxp, fy, fzp]) => isAir(g, fxp, fy, fzp))) return false;
  return place(g, [
    [x, y, z, ...B.stairs("dark_oak", back)],
    [x + bx, y, z + bz, ...B.trapdoor("spruce", facing, "bottom", true)],
  ]);
}

// Hay bales in the box [x0, y0, z0, x1, y1, z1]: full rows along x, one row in two along z, so a gap row runs
// between the stacks. All or nothing.
export function hay_stack(g, [x0, y0, z0, x1, y1, z1]) {
  const plan = [];
  for (let z = z0; z <= z1; z += 2) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) plan.push([x, y, z, "hay_block", { axis: "y" }]);
  return place(g, plan);
}

// A row of barrels (open top, facing up) at y along z at the xs, and a water_cauldron tap at tapX (default: the cell
// between the first two barrels). The spout is an open spruce_trapdoor on the cell in front of the tap.
// Support for the spout is not checked here; it needs a block behind it in the grounds part.
export function rain_barrels(g, xs, z, y = 1, tapX = xs[0] + 1) {
  return place(g, [
    ...xs.map((x) => [x, y, z, "barrel", { facing: "up", open: "false" }]),
    [tapX, y, z, "water_cauldron", { level: "3" }],
    [tapX, y, z - 1, "spruce_trapdoor", { facing: "north", half: "bottom", open: "true" }],
  ]);
}

const SOIL = new Set(["grass_block", "dirt", "coarse_dirt", "podzol", "rooted_dirt"]);

// Garden bed on the grounds part's soil: a spruce_fence edging round the box [x0, y, z0, x1, z1] at standing level y
// (all or nothing), then flower on every other interior cell where the block below is grass or dirt (optional: a
// cell that's taken or not on soil is skipped). flower = a single-block id such as "poppy".
export function garden_bed(g, [x0, y, z0, x1, z1], flower) {
  const ring = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (x === x0 || x === x1 || z === z0 || z === z1) ring.push([x, y, z]);
  const fences = new Set(ring.map(([x, , z]) => key(x, y, z)));
  if (!place(g, ring.map(([x, , z]) => [x, y, z, "spruce_fence", fenceState(fences, x, y, z)]))) return false;
  for (let x = x0 + 1; x < x1; x++) for (let z = z0 + 1; z < z1; z++) {
    const under = g.blockAt(x, y - 1, z).replace(/^minecraft:/, "");
    if ((x + z) % 2 === 0 && isAir(g, x, y, z) && SOIL.has(under)) g.set(x, y, z, flower);
  }
  return true;
}
