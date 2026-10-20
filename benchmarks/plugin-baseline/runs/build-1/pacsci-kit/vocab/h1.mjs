// Part helpers for the Pacific Science Center (plan.md VOCABULARY, first eight). Each one takes its position as
// arguments and writes only into air inside its own footprint, so a worker can't put a block into an earlier part's
// ground, floor or wall. Block ids are plan.md PALETTE literals (1.21.1).
//
// Skin helpers: `face` is the outward direction of the wall ("north" = the wall faces -z). `origin` is the skin cell at
// tangent index 0 on the panel plane (normal 0); normal +1 is one block proud of the panels, normal -1 is inside.
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const TANGENT = { north: [1, 0, 0], south: [1, 0, 0], east: [0, 0, 1], west: [0, 0, 1] };

// Write one block if the cell is inside `box` (inclusive [x0,y0,z0,x1,y1,z1]), inside the grid, and currently air.
// Returns true when placed.
function put(g, box, x, y, z, block, state, nbt) {
  const [x0, y0, z0, x1, y1, z1] = box;
  if (x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1) return false;
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return false;
  g.set(x, y, z, block, state, nbt);
  return true;
}

// The cell at tangent t, normal n, height dy from a skin origin.
function skin(origin, face, t, n, dy = 0) {
  const T = TANGENT[face], O = DIRS[face];
  return [origin[0] + t * T[0] + n * O[0], origin[1] + dy, origin[2] + t * T[2] + n * O[2]];
}

// Bounding box (inclusive) of a skin rectangle: tangent t0..t1, normal n0..n1, heights y0..y1.
function skinBox(origin, face, t0, t1, n0, n1, y0, y1) {
  const corners = [];
  for (const t of [t0, t1]) for (const n of [n0, n1]) corners.push(skin(origin, face, t, n, 0));
  const xs = corners.map((c) => c[0]), zs = corners.map((c) => c[2]);
  return [Math.min(...xs), y0, Math.min(...zs), Math.max(...xs), y1, Math.max(...zs)];
}

// The compass direction of a horizontal vector.
const facingOf = (v) => Object.keys(DIRS).find((k) => DIRS[k][0] === v[0] && DIRS[k][2] === v[2]);

// Pane connections along the wall: a glazed cell joins the panels or ribs on either side of it.
function paneState(face) {
  return TANGENT[face][0]
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
}

// A recessed lancet window at tangent t, rows y0..y1 (y1 is the pointed head: an upside-down stair). The back is
// calcite one block inside the skin; the window is glass when `glazed`, else open.
function lancetWindow(g, box, origin, face, t, y0, y1, glazed) {
  let placed = 0;
  for (let y = y0; y <= y1; y++) placed += put(g, box, ...skin(origin, face, t, -1, y), "calcite", {});
  for (let y = y0; y < y1; y++) {
    if (glazed) placed += put(g, box, ...skin(origin, face, t, 0, y), "gray_stained_glass_pane", paneState(face));
  }
  placed += put(g, box, ...skin(origin, face, t, 0, y1), ...B.stairs("smooth_quartz", OPPOSITE[face], "top"));
  return placed;
}

// A 4-cell bay on a skin wall: a quartz_pillar rib at tangent 0 (one proud of the panels), white_concrete panels at
// tangents 1..3, and a lancet in the middle panel (tangent 2) from one block above the base to two below the top.
// Footprint: tangents 0..3, normals -1..1, heights origin.y .. origin.y+h-1.
export function lattice_bay(g, face, origin, h, { glazed = false } = {}) {
  const box = skinBox(origin, face, 0, 3, -1, 1, origin[1], origin[1] + h - 1);
  const top = origin[1] + h - 1, lancetY0 = origin[1] + 1, lancetY1 = origin[1] + h - 2;
  let placed = 0;
  for (let y = origin[1]; y <= top; y++) {
    placed += put(g, box, ...skin(origin, face, 0, 0, y - origin[1]), ...B.pillar("quartz_pillar", "y"));
    placed += put(g, box, ...skin(origin, face, 0, 1, y - origin[1]), ...B.pillar("quartz_pillar", "y"));
    for (const t of [1, 3]) placed += put(g, box, ...skin(origin, face, t, 0, y - origin[1]), "white_concrete", {});
    const inLancet = y >= lancetY0 && y <= lancetY1;
    if (!inLancet) placed += put(g, box, ...skin(origin, face, 2, 0, y - origin[1]), "white_concrete", {});
  }
  if (lancetY1 >= lancetY0) placed += lancetWindow(g, box, origin, face, 2, lancetY0, lancetY1, glazed);
  return placed;
}

// A Y-shaped split of a rib, four rows from origin.y: a quartz_pillar stem at tangent 0 (rows 0..1, proud like the
// rib), then in rows 2 and 3 smooth_quartz_stairs stepping out one block per row on each side, backs toward the stem.
// Footprint: tangents -2..2, normals 0..1, heights origin.y .. origin.y+3. (Forks meeting at a point is not built here.)
export function tall_fork(g, face, origin) {
  const box = skinBox(origin, face, -2, 2, 0, 1, origin[1], origin[1] + 3);
  let placed = 0;
  for (let dy = 0; dy < 2; dy++) for (const n of [0, 1]) {
    placed += put(g, box, ...skin(origin, face, 0, n, dy), ...B.pillar("quartz_pillar", "y"));
  }
  for (let dy = 2; dy < 4; dy++) for (const sgn of [-1, 1]) {
    const t = sgn * (dy - 1);
    const toStem = facingOf([-sgn * TANGENT[face][0], 0, -sgn * TANGENT[face][2]]);
    placed += put(g, box, ...skin(origin, face, t, 0, dy), ...B.stairs("smooth_quartz", toStem, "bottom"));
  }
  return placed;
}

// One 2x2 white_concrete leg standing on a plinth at y1, carried up to height h, with a smooth_quartz band around it
// at y 7, 13, 19 and 25. Footprint: x..x+1, y 2..h, z..z+1.
export function arch_leg(g, x, z, h) {
  const box = [x, 2, z, x + 1, h, z + 1];
  let placed = 0;
  for (let y = 2; y <= h; y++) {
    const block = [7, 13, 19, 25].includes(y) ? "smooth_quartz" : "white_concrete";
    for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
      placed += put(g, box, x + dx, y, z + dz, block, {});
    }
  }
  return placed;
}

// The lace between the two frames of an arch: at every fourth row from spring to crown, a row of end_rod along z
// between smooth_quartz nodes at the centre line, and an X of end_rods across the crown.
// arch = { x0, x1, z0, z1, spring, crown }: frames are two blocks deep at z0 and at z1.
// Footprint: x0..x1, spring..crown, z0..z1.
export function arch_ties(g, arch) {
  const { x0, x1, z0, z1, spring, crown } = arch;
  const box = [x0, spring, z0, x1, crown, z1];
  const cx = Math.floor((x0 + x1) / 2), zA = z0 + 2, zB = z1 - 1;
  let placed = 0;
  for (let y = spring; y <= crown; y += 4) {
    placed += put(g, box, cx, y, zA, "smooth_quartz", {});
    placed += put(g, box, cx, y, zB, "smooth_quartz", {});
    for (let z = zA + 1; z < zB; z++) placed += put(g, box, cx, y, z, "end_rod", { facing: "south" });
  }
  const dz = zB - zA, dx = x1 - x0;
  for (let k = 0; k <= Math.min(dx, dz); k++) {
    placed += put(g, box, x0 + k, crown, zA + k, "end_rod", { facing: "up" });
    placed += put(g, box, x1 - k, crown, zA + k, "end_rod", { facing: "up" });
  }
  return placed;
}

// A 4x4 smooth_quartz plinth at y1 under an arch leg, from x..x+3, z..z+3. Footprint: that 4x4 at y1.
export function leg_plinth(g, x, z) {
  const box = [x, 1, z, x + 3, 1, z + 3];
  let placed = 0;
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 4; dz++) {
    placed += put(g, box, x + dx, 1, z + dz, "smooth_quartz", {});
  }
  return placed;
}

// An elevated promenade over a walk: smooth_quartz_slab (top) deck at y10 across box = [x0, z0, x1, z1], a
// diorite_wall railing at y11 round its edge (joined to the neighbouring railing cells), and quartz_pillar columns
// at y1..9 under the listed [x, z] cells. Footprint: the box, y1..11.
export function promenade(g, [x0, z0, x1, z1], columns = []) {
  const box = [x0, 1, z0, x1, 11, z1];
  const edge = (x, z) => x === x0 || x === x1 || z === z0 || z === z1;
  const rail = (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1 && edge(x, z);
  let placed = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    placed += put(g, box, x, 10, z, ...B.slab("smooth_quartz", "top"));
    if (rail(x, z)) {
      const joins = (dx, dz) => (rail(x + dx, z + dz) ? "low" : undefined);
      const arms = { north: joins(0, -1), south: joins(0, 1), east: joins(1, 0), west: joins(-1, 0) };
      placed += put(g, box, x, 11, z, "diorite_wall", { ...Object.fromEntries(Object.entries(arms).filter(([, v]) => v)), up: "true" });
    }
  }
  for (const [x, z] of columns) {
    for (let y = 1; y <= 9; y++) placed += put(g, box, x, y, z, ...B.pillar("quartz_pillar", "y"));
  }
  return placed;
}

// A flat-roofed porch on box = [x0, z0, x1, z1]: solid back wall (z0 row) of white_concrete to y4, quartz_pillar
// columns at the two front corners (z1), a smooth_quartz_slab roof at y5, sea_lantern soffit at y4, and two standing
// blue banners on the front at y1 (facing south). Footprint: the box, y1..5.
export function porch(g, [x0, z0, x1, z1]) {
  const box = [x0, 1, z0, x1, 5, z1];
  let placed = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    placed += put(g, box, x, 5, z, ...B.slab("smooth_quartz", "bottom"));
    if (z === z0) for (let y = 1; y <= 4; y++) placed += put(g, box, x, y, z, "white_concrete", {});
    else if (z === z1 && (x === x0 || x === x1)) for (let y = 1; y <= 4; y++) placed += put(g, box, x, y, z, ...B.pillar("quartz_pillar", "y"));
    else placed += put(g, box, x, 4, z, "sea_lantern", {});
  }
  for (const x of [x0 + 1, x1 - 1]) placed += put(g, box, x, 1, z1, ...B.banner("blue", [], { wall: false, rotation: 0 }));
  return placed;
}

// A glazed bay of gray_stained_glass_pane, w wide along the wall and h high, on the panel plane (normal 0), with
// panes joined to their neighbours across the wall. Footprint: tangents 0..w-1, normal 0, heights origin.y..origin.y+h-1.
export function glaze_bay(g, face, origin, { w = 3, h = 6 } = {}) {
  const box = skinBox(origin, face, 0, w - 1, 0, 0, origin[1], origin[1] + h - 1);
  let placed = 0;
  for (let t = 0; t < w; t++) for (let y = 0; y < h; y++) {
    placed += put(g, box, ...skin(origin, face, t, 0, y), "gray_stained_glass_pane", paneState(face));
  }
  return placed;
}
