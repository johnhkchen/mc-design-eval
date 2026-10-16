// Helpers from plan.md VOCABULARY (h3): fence_run, log_crib_wall, door_pair, stair_run, bed_set, hanging_sign, kettle,
// picnic_table, rafter_tails. Each takes its position (and facing) as arguments and writes only into air, so it never
// replaces an earlier part's block or the ground. Two exceptions, both inside their own footprint: stair_run with
// { carve: true } clears headroom through a built floor, and kettle sinks its campfire into the y 0 surface.
// Every helper returns { placed, skipped }.
import { B, flight } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const STEP = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

const done = (w) => ({ placed: w.out.placed, skipped: w.out.skipped });

// Air-only writes through g. over(x, y, z, block) lets a helper replace a non-air cell it owns; keep boxes are never
// written (openings and RESERVED cells). Returns get/set in the shape flight() writes through.
function writer(g, { over = () => false, keep = [] } = {}) {
  const out = { placed: 0, skipped: 0 };
  const kept = (x, y, z) => keep.some(([x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1);
  const set = (x, y, z, block, state, nbt) => {
    const air = g.isAir(x, y, z);
    if (kept(x, y, z) || (!air && !over(x, y, z, block))) { out.skipped++; return false; }
    g.set(x, y, z, block, state, nbt);
    out.placed++;
    return true;
  };
  return { set, get: (x, y, z) => g.get(x, y, z), free: (x, y, z) => !kept(x, y, z) && g.isAir(x, y, z), out };
}

// Fence connection flags as placement shows them: a side joins when a planned fence cell (keys "x,z", one row) is there.
const fenceFlags = (cells, x, z) => ({
  north: cells.has(`${x},${z - 1}`), south: cells.has(`${x},${z + 1}`),
  east: cells.has(`${x + 1},${z}`), west: cells.has(`${x - 1},${z}`),
});

/** Plot fences in one row. plot is the plot index i (ox = 12 * i): side columns (spruce_fence at x ox and ox+11,
 *  z 5..18, y 1), a picket front at z 5 (`${wood}_fence`, x ox+1..ox+10) with a 2-wide gap at gateX..gateX+1, and a back
 *  line at z 18 (`${wood}_fence`). sides: false leaves the side columns open (plot 6's dirt_path). */
export function fence_run(g, plot, wood, gateX, { sides = true } = {}) {
  const ox = 12 * plot, y = 1, w = writer(g), run = new Map();
  if (sides) for (let z = 5; z <= 18; z++) for (const x of [ox, ox + 11]) run.set(`${x},${z}`, "spruce_fence");
  for (let x = ox + 1; x <= ox + 10; x++) {
    if (x !== gateX && x !== gateX + 1) run.set(`${x},5`, `${wood}_fence`);
    run.set(`${x},18`, `${wood}_fence`);
  }
  const cells = new Set(run.keys());
  for (const [key, block] of run) {
    const [x, z] = key.split(",").map(Number);
    w.set(x, y, z, block, fenceFlags(cells, x, z));
  }
  return done(w);
}

/** A log pen wall: every perimeter cell of box [x0,y0,z0,x1,y1,z1] is a log with its axis along the wall's run (x on the
 *  N/S walls, z on the E/W walls). Corners alternate per course (axis x on even courses, z on odd) so the notches
 *  interlock. keep: boxes left as air (window and door openings). */
export function log_crib_wall(g, box, log, { keep = [] } = {}) {
  const [x0, y0, z0, x1, y1, z1] = box, w = writer(g, { keep });
  for (let y = y0; y <= y1; y++) {
    const cornerAxis = (y - y0) % 2 === 0 ? "x" : "z";
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const ns = z === z0 || z === z1, ew = x === x0 || x === x1;
      if (!ns && !ew) continue;
      const axis = ns && ew ? cornerAxis : ns ? "x" : "z";
      w.set(x, y, z, log, { axis });
    }
  }
  return done(w);
}

/** A double door in a wall: two doors side by side, both facing out (face), hinges mirrored (left, then right), both halves
 *  written. (x, y, z) is the left door's lower cell; the pair runs along x on a north or south wall, along z on an east or
 *  west one. The step is a bottom `${wood}_slab` on the cell outside each door, at the door's base y. */
export function door_pair(g, x, y, z, face, wood) {
  const w = writer(g), [dx, dz] = face === "north" || face === "south" ? [1, 0] : [0, 1], [ox, oz] = STEP[face];
  for (let d = 0; d < 2; d++) {
    const cx = x + dx * d, cz = z + dz * d, hinge = d === 0 ? "left" : "right";
    w.set(cx, y, cz, ...B.door(wood, face, "lower", hinge));
    w.set(cx, y + 1, cz, ...B.door(wood, face, "upper", hinge));
    w.set(cx + ox, y, cz + oz, ...B.slab(wood, "bottom"));
  }
  return done(w);
}

/** A straight flight from `from` (the first step, on the lower floor) up to the upper floor's block layer at y = to, with
 *  flight()'s steps, headroom and stringers, written air-only. A rail (`${material}_fence`) runs at y to+1 on the right of
 *  the walk, beside each cell the flight passes through the upper floor. carve: true lets the headroom cut through a built
 *  floor. material is a wood name (spruce, mangrove). */
export function stair_run(g, from, facing, to, material, width = 1, { carve = false } = {}) {
  const w = writer(g, { over: () => carve }), [x, y, z] = from, [dx, dz] = STEP[facing], [rx, rz] = [-dz, dx];
  const res = flight(w, { from, facing, to, material, width });
  const n = to - y + 1, rail = new Set();
  for (let i = 0; i < n; i++) if (y + i + 1 === to || y + i + 2 === to) rail.add(`${x + dx * i + rx * width},${z + dz * i + rz * width}`);
  for (const key of rail) {
    const [px, pz] = key.split(",").map(Number);
    w.set(px, to + 1, pz, `${material}_fence`, fenceFlags(rail, px, pz));
  }
  return { ...done(w), notes: res.notes };
}

/** A bed, both halves: foot at [x,y,z], head one step toward facing (the pillow end). Places nothing unless both cells are
 *  air and two cells above each half are clear (headroom). Keep the head against a solid wall (the caller's layout). */
export function bed_set(g, [x, y, z], facing, colour = "red") {
  const w = writer(g), [dx, dz] = STEP[facing], halves = [[x, z], [x + dx, z + dz]];
  const clear = halves.every(([cx, cz]) => w.free(cx, y, cz) && w.free(cx, y + 1, cz) && w.free(cx, y + 2, cz));
  if (!clear) return { placed: 0, skipped: halves.length };
  halves.forEach(([cx, cz], i) => w.set(cx, y, cz, `${colour}_bed`, { facing, part: i === 0 ? "foot" : "head" }));
  return done(w);
}

/** A hanging sign at [x,y,z], hung from the block above it (the roof or beam). Places nothing when the block above is air.
 *  text: lines split on "\n". rotation: 0..15 (8 faces north, the lane). */
export function hanging_sign(g, text, x, y, z, { wood = "mangrove", rotation = 8 } = {}) {
  const w = writer(g);
  if (g.isAir(x, y + 1, z)) return { placed: 0, skipped: 1 };
  const [block, , nbt] = B.sign(wood, String(text).split("\n"), { wall: false, hanging: true, rotation, dataVersion: g.dataVersion });
  w.set(x, y, z, block, { rotation: String(rotation), attached: "false" }, nbt);
  return done(w);
}

/** A wash kettle: a lit campfire sunk into the surface at (x, 0, z), a cobblestone kerb round it at y 0, and a water cauldron
 *  (level 3) on the fire at y 1. The only y 0 cells it replaces are its own pit and kerb. */
export function kettle(g, x, z) {
  const w = writer(g, { over: (_x, y) => y === 0 });
  w.set(x, 0, z, "campfire", { facing: "north", lit: "true" });
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx || dz) w.set(x + dx, 0, z + dz, "cobblestone");
  w.set(x, 1, z, "water_cauldron", { level: "3" });
  return done(w);
}

/** A picnic table: a spruce slab top (type top) across x..x+1, z..z+len-1 at y, with a spruce stair bench on each side
 *  (x-1 facing west, x+2 facing east). Defaults match plot 6: picnic_table(g, 77, 11) with len 3 at y 1. */
export function picnic_table(g, x, z, len = 3, y = 1) {
  const w = writer(g);
  for (let dz = 0; dz < len; dz++) {
    for (const dx of [0, 1]) w.set(x + dx, y, z + dz, ...B.slab("spruce", "top"));
    w.set(x - 1, y, z + dz, ...B.stairs("spruce", "west", "bottom"));
    w.set(x + 2, y, z + dz, ...B.stairs("spruce", "east", "bottom"));
  }
  return done(w);
}

/** Rafter tails: spruce_fence stubs at x, y, every 2 cells from z0 to z1 (under the eave). */
export function rafter_tails(g, x, z0, z1, y) {
  const w = writer(g);
  for (let z = z0; z <= z1; z += 2) w.set(x, y, z, "spruce_fence", { north: false, east: false, south: false, west: false });
  return done(w);
}
