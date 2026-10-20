// Main Post kit, helper set h1 (plan.md VOCABULARY): groundCourse, sashWindow, ramp, dormer, stuccoWall, oculus,
// flagpole, courtyardTree. Build coordinates, front faces south (+z).
// Every helper takes its position as arguments, writes only inside its own footprint (an inclusive box), and only
// into air unless opts.over is set. Returns { placed, refused }: refused lists the cells it left alone.
import { B, DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// one writer per call: every put() is checked against the footprint and the air rule
function writer(g, [x0, y0, z0, x1, y1, z1], over = false) {
  const refused = [];
  let placed = 0;
  const put = (x, y, z, block, state, nbt) => {
    const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
    if (!inside || (!over && !g.isAir(x, y, z))) { refused.push([x, y, z]); return; }
    g.set(x, y, z, block, state, nbt);
    placed++;
  };
  return { put, done: () => ({ placed, refused }) };
}

// the wall axis a face sits on: north and south walls run along x, east and west walls along z
const alongOf = (face) => (face === "north" || face === "south" ? "x" : "z");

// glass_pane states for a pane in a wall running along `axis`: it joins the wall either side of it
function paneState(axis) {
  return axis === "x"
    ? { north: "false", east: "true", south: "false", west: "true" }
    : { north: "true", east: "false", south: "true", west: "false" };
}

/** Ground course: smooth_stone over y 0 from (x0,z0) to (x1,z1), inclusive. */
export function groundCourse(g, x0, z0, x1, z1, opts = {}) {
  const [a, b] = [Math.min(x0, x1), Math.max(x0, x1)], [c, d] = [Math.min(z0, z1), Math.max(z0, z1)];
  const w = writer(g, [a, 0, c, b, 0, d], opts.over);
  for (let x = a; x <= b; x++) for (let z = c; z <= d; z++) w.put(x, 0, z, "smooth_stone");
  return w.done();
}

/**
 * Sash window: two glass_pane cells at (x, y..y+1, z) in the wall on `face`, and a smooth_quartz_slab sill (top half)
 * one cell proud of the wall under it, at y-1. The sill is skipped when its cell is not air.
 */
export function sashWindow(g, x, y, z, face = "south", opts = {}) {
  const [ox, , oz] = DIRS[face];
  const sx = x + ox, sz = z + oz;
  const w = writer(g, [Math.min(x, sx), y - 1, Math.min(z, sz), Math.max(x, sx), y + 1, Math.max(z, sz)], opts.over);
  const pane = paneState(alongOf(face));
  w.put(x, y, z, "glass_pane", pane);
  w.put(x, y + 1, z, "glass_pane", pane);
  if (opts.over || g.isAir(sx, y - 1, sz)) w.put(sx, y - 1, sz, ...B.slab("smooth_quartz", "top"));
  return w.done();
}

/**
 * Ramp: a single row of bottom smooth_stone_slabs at y 0 across x0..x1 on row z, the half step up from the lawn.
 */
export function ramp(g, x0, x1, z, opts = {}) {
  const [a, b] = [Math.min(x0, x1), Math.max(x0, x1)];
  const w = writer(g, [a, 0, z, b, 0, z], opts.over);
  for (let x = a; x <= b; x++) w.put(x, 0, z, ...B.slab("smooth_stone", "bottom"));
  return w.done();
}

/**
 * Dormer: brick cheeks at x0 and x2 and a brick back wall at zFace-depth (y 10..11, or opts.y), a centre glass_pane
 * on the front face zFace, and a smooth_quartz_slab lid at y+2 spanning x0..x2 that runs one cell proud of the face.
 * The front faces south (+z), so the dormer runs from zFace back to zFace-depth.
 */
export function dormer(g, x0, x2, zFace, depth, opts = {}) {
  const y = opts.y ?? 10, zBack = zFace - depth, cx = (x0 + x2) / 2;
  const w = writer(g, [x0, y, zBack, x2, y + 2, zFace + 1], opts.over);
  for (let yy = y; yy <= y + 1; yy++) {
    for (let x = x0; x <= x2; x++) w.put(x, yy, zBack, "bricks");
    for (let z = zBack + 1; z <= zFace; z++) { w.put(x0, yy, z, "bricks"); w.put(x2, yy, z, "bricks"); }
    w.put(cx, yy, zFace, "glass_pane", paneState("x"));
  }
  for (let x = x0; x <= x2; x++) for (let z = zBack; z <= zFace + 1; z++) w.put(x, y + 2, z, ...B.slab("smooth_quartz", "bottom"));
  return w.done();
}

/**
 * Stucco wall: a white_concrete shell over the box [x0,y0,z0,x1,y1,z1] (walls only, the inside is left air). Walls are
 * `thick` cells thick, and the front walls (high z) twice that. Cells listed in opts.open ([x,y,z] each) stay air, for
 * the openings the shell leaves. Pass y0 = 1 so the ground course at y 0 is not touched.
 */
export function stuccoWall(g, [x0, y0, z0, x1, y1, z1], thick = 1, opts = {}) {
  const open = new Set((opts.open ?? []).map((c) => c.join(",")));
  const w = writer(g, [x0, y0, z0, x1, y1, z1], opts.over);
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    const wall = x < x0 + thick || x > x1 - thick || z < z0 + thick || z > z1 - 2 * thick;
    if (wall && !open.has(`${x},${y},${z}`)) w.put(x, y, z, "white_concrete");
  }
  return w.done();
}

/**
 * Oculus: a round window in the plane z, centred on (cx, cy): a plus of gray_stained_glass_pane, and smooth_quartz_stairs
 * at the four corners, backs to the stucco, upper corners upside down.
 */
export function oculus(g, cx, cy, z, opts = {}) {
  const w = writer(g, [cx - 1, cy - 1, z, cx + 1, cy + 1, z], opts.over);
  const plus = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  const has = (dx, dy) => plus.some(([a, b]) => a === dx && b === dy);
  for (const [dx, dy] of plus) {
    const state = { north: "false", south: "false", east: has(dx + 1, dy) ? "true" : "false", west: has(dx - 1, dy) ? "true" : "false" };
    w.put(cx + dx, cy + dy, z, "gray_stained_glass_pane", state);
  }
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    w.put(cx + dx, cy + dy, z, ...B.stairs("smooth_quartz", dx < 0 ? "west" : "east", dy > 0 ? "top" : "bottom"));
  }
  return w.done();
}

/**
 * Flagpole on the pole cell (x, z): iron_bars from y 0 to 8, a lightning_rod finial at y 9, and a 2x2 wool flag on the
 * north side (z-1 and z-2) at y 7..8. The flag is white, red and blue as in plan.md.
 */
export function flagpole(g, x, z, opts = {}) {
  const w = writer(g, [x, 0, z - 2, x, 9, z], opts.over);
  const bars = { north: "false", east: "false", south: "false", west: "false" };
  for (let y = 0; y <= 8; y++) w.put(x, y, z, "iron_bars", bars);
  w.put(x, 9, z, "lightning_rod", { facing: "up", powered: "false" });
  w.put(x, 8, z - 1, "blue_wool");
  w.put(x, 8, z - 2, "red_wool");
  w.put(x, 7, z - 1, "white_wool");
  w.put(x, 7, z - 2, "red_wool");
  return w.done();
}

/**
 * Courtyard tree at (x, z): oak_log trunk at y 1..4 on the paving, and a persistent oak_leaves crown at y 3..6 that
 * stays inside x-1..x+1, z-1..z+1.
 */
export function courtyardTree(g, x, z, opts = {}) {
  const w = writer(g, [x - 1, 1, z - 1, x + 1, 6, z + 1], opts.over);
  const leaves = { persistent: "true", distance: "1", waterlogged: "false" };
  const ring = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  const plus = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let y = 1; y <= 4; y++) w.put(x, y, z, ...B.log("oak", "y"));
  for (const [dx, dz] of ring) { w.put(x + dx, 3, z + dz, "oak_leaves", leaves); w.put(x + dx, 4, z + dz, "oak_leaves", leaves); }
  for (const [dx, dz] of plus) w.put(x + dx, 5, z + dz, "oak_leaves", leaves);
  w.put(x, 6, z, "oak_leaves", leaves);
  return w.done();
}
