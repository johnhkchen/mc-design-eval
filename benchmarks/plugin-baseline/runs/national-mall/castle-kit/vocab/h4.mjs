// Vocabulary helpers, part 4 (plan.md VOCABULARY): quoins, slitWindow, octoTower, lampPost, gableDiamond, lanternCap,
// fountain, curvedPier. Every helper takes its position as arguments (and facing where it has one) and writes only its own
// footprint: into air, unless opts.replace is set, which overwrites cells of that footprint and nothing else. Nothing here
// writes ground, sand or floor under its footprint. Blocks are plan.md's PALETTE ids; states are the 1.21.1 names the
// toolkit validates.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// One block into the footprint. Returns 1 if placed, 0 if refused (an occupied cell without opts.replace).
function put(g, x, y, z, block, state, opts = {}) {
  if (!opts.replace && !g.isAir(x, y, z)) return 0;
  g.set(x, y, z, block, state);
  return 1;
}

// A unit of cells ([x, y, z, block, state] each) written all or none: refused if any cell is occupied (unless opts.replace).
function commit(g, cells, opts = {}) {
  if (!opts.replace && cells.some(([x, y, z]) => !g.isAir(x, y, z))) return 0;
  for (const [x, y, z, block, state] of cells) g.set(x, y, z, block, state);
  return cells.length;
}

// Glass pane connections: a pane joins the sides named (a solid wall, or another pane or block in its unit).
const PANE_SIDES = ["north", "east", "south", "west"];
function paneState(joins) {
  return Object.fromEntries(PANE_SIDES.map((side) => [side, String(joins.includes(side))]));
}
// The in-plane sides of a glass pane in a wall on each face: a north or south wall runs along x, an east or west one along z.
const WALL_JOINS = { north: ["east", "west"], south: ["east", "west"], east: ["north", "south"], west: ["north", "south"] };

/**
 * A corner column of polished_granite at (x, z) from y0 to y1. The 2-high / 1-high stone rhythm is not drawn here: one column
 * cannot show the joints, so the column is continuous and the rhythm needs the face cells of a second pass.
 */
export function quoins(g, x, z, y0, y1, opts = {}) {
  let n = 0;
  for (let y = y0; y <= y1; y++) n += put(g, x, y, z, "polished_granite", undefined, opts);
  return n;
}

/**
 * A 1 x h slit of gray stained glass in the wall on `face` (north, south, east or west), bottom cell at (x, y, z). The glass
 * joins the solid wall on both sides. The slit is air until this fills it: the shell leaves openings as air (opts.replace
 * cuts through a solid wall first).
 */
export function slitWindow(g, x, y, z, face, h, opts = {}) {
  const joins = WALL_JOINS[face];
  if (!joins) throw new Error(`slitWindow: face must be north, south, east or west, not ${face}`);
  let n = 0;
  for (let i = 0; i < h; i++) n += put(g, x, y + i, z, "gray_stained_glass_pane", paneState(joins), opts);
  return n;
}

/**
 * An octagonal tower shaft: the square x0..x1 by z0..z1 with each corner cut by `chamfer` cells, walls one cell thick from
 * y0 (opts.y0, default 0) up to yTop, in opts.material (default red_terracotta, the Castle body). The inside is left as it
 * is (hollow). The slits are glazed by slitWindow after this.
 */
export function octoTower(g, x0, z0, x1, z1, yTop, chamfer, opts = {}) {
  const y0 = opts.y0 ?? 0, block = opts.material ?? "red_terracotta";
  const cut = (x, z) => (x - x0) + (z - z0) < chamfer || (x1 - x) + (z - z0) < chamfer
    || (x - x0) + (z1 - z) < chamfer || (x1 - x) + (z1 - z) < chamfer;
  const inside = (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1 && !cut(x, z);
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!inside(x, z)) continue;
    if (inside(x - 1, z) && inside(x + 1, z) && inside(x, z - 1) && inside(x, z + 1)) continue; // interior: hollow
    for (let y = y0; y <= yTop; y++) n += put(g, x, y, z, block, undefined, opts);
  }
  return n;
}

/**
 * A lamp post standing at (x, y, z): two wall blocks at y and y+1 (opts.material, default red_nether_brick_wall; Hirshhorn
 * passes polished_blackstone_wall) and a standing lantern on top at y+2. Three cells, all or none.
 */
export function lampPost(g, x, y, z, opts = {}) {
  const block = opts.material ?? "red_nether_brick_wall";
  const post = { up: "true", north: "none", east: "none", south: "none", west: "none" };
  const [lantern, lanternState] = B.lantern(false);
  return commit(g, [[x, y, z, block, post], [x, y + 1, z, block, post], [x, y + 2, z, lantern, lanternState]], opts);
}

/**
 * The diamond in a gable on `face` (north, south, east or west), centred on its oculus at (cx, y, cz). A north or south gable
 * lies in the plane z = cz, an east or west one in x = cx. By Manhattan distance from the oculus: a 1 x 1 glass_pane oculus,
 * light_blue_terracotta round it, and a yellow_terracotta diamond outside that, radius opts.size (default 2). The bricks round
 * it are the gable's triangle infill (gableEnd), not written here.
 */
export function gableDiamond(g, cx, y, cz, face, opts = {}) {
  const alongX = face === "north" || face === "south";
  if (!alongX && face !== "east" && face !== "west") throw new Error(`gableDiamond: face must be north, south, east or west, not ${face}`);
  const r = opts.size ?? 2, cells = [];
  for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
    const d = Math.abs(dx) + Math.abs(dy);
    if (d > r) continue;
    const x = alongX ? cx + dx : cx, z = alongX ? cz : cz + dx;
    if (d === 0) cells.push([x, y + dy, z, "glass_pane", paneState(WALL_JOINS[face])]);
    else cells.push([x, y + dy, z, d < r ? "light_blue_terracotta" : "yellow_terracotta", undefined]);
  }
  return commit(g, cells, opts);
}

/**
 * A lantern box on the 3 x 3 centred at (x, z), its bottom course at y: glass_pane walls round the ring at y and y+1, a
 * shroomlight core at the centre of y (the top centre stays air), a slab cap at y+2 (opts.cap, default stone_brick, as
 * stone_brick_slab) and a lightning_rod finial at y+3. Eleven to twenty-seven cells, all or none.
 */
export function lanternCap(g, x, y, z, opts = {}) {
  const ring = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
  const SIDES = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
  // A cell of the box: the 3 x 3 at each glass level, except the top centre, which is open.
  const inBox = (dx, dz, dy) => Math.abs(dx) <= 1 && Math.abs(dz) <= 1 && !(dx === 0 && dz === 0 && dy === 1);
  const pane = (dx, dz, dy) => paneState(Object.keys(SIDES).filter((side) => inBox(dx + SIDES[side][0], dz + SIDES[side][1], dy)));
  const cells = [];
  for (const dy of [0, 1]) {
    for (const [dx, dz] of ring) cells.push([x + dx, y + dy, z + dz, "glass_pane", pane(dx, dz, dy)]);
  }
  cells.push([x, y, z, "shroomlight", undefined]);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const [slab, slabState] = B.slab(opts.cap ?? "stone_brick", "bottom");
    cells.push([x + dx, y + 2, z + dz, slab, slabState]);
  }
  cells.push([x, y + 3, z, "lightning_rod", { facing: "up", powered: "false" }]);
  return commit(g, cells, opts);
}

/**
 * A fountain basin at height y, its rim and water in cells at y. Round: centre (cx, cz), radius r. The rim is smooth_stone_slab
 * at about distance r, the water source (level 0) inside it. Or, with opts.box = [x0, z0, x1, z1] (cx, cz, r unused), a
 * rectangular basin: slab rim round the box, water inside it. Lay the paving round it after this, so the basin's own y cells
 * are still air. All cells, or none.
 */
export function fountain(g, cx, cz, r, y, opts = {}) {
  const cells = [];
  const slab = B.slab("smooth_stone", "bottom");
  if (opts.box) {
    const [x0, z0, x1, z1] = opts.box;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const rim = x === x0 || x === x1 || z === z0 || z === z1;
      cells.push(rim ? [x, y, z, ...slab] : [x, y, z, "water", undefined]);
    }
  } else {
    for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) for (let z = Math.floor(cz - r - 1); z <= Math.ceil(cz + r + 1); z++) {
      const d = Math.hypot(x - cx, z - cz);
      if (d <= r - 0.5) cells.push([x, y, z, "water", undefined]);
      else if (d <= r + 0.5) cells.push([x, y, z, ...slab]);
    }
  }
  return commit(g, cells, opts);
}

/**
 * A curved pier: the arc of the ring between radii r0 and r1 round (cx, cz), centred on the compass angle `angle` (degrees, atan2
 * of dz over dx: NE -45, SE 45, SW 135, NW -135) and spanning ±span degrees. Cells from opts.y0 (default 0) to opts.y1 (default
 * 2): opts.material (default white_terracotta) below, opts.cap (default light_gray_concrete) on the top course.
 */
export function curvedPier(g, cx, cz, r0, r1, angle, span, opts = {}) {
  const y0 = opts.y0 ?? 0, y1 = opts.y1 ?? 2, block = opts.material ?? "white_terracotta", cap = opts.cap ?? "light_gray_concrete";
  let n = 0;
  for (let x = Math.floor(cx - r1); x <= Math.ceil(cx + r1); x++) for (let z = Math.floor(cz - r1); z <= Math.ceil(cz + r1); z++) {
    const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz);
    if (d < r0 || d > r1) continue;
    const off = ((Math.atan2(dz, dx) * 180) / Math.PI - angle + 540) % 360 - 180;
    if (Math.abs(off) > span) continue;
    for (let y = y0; y <= y1; y++) n += put(g, x, y, z, y === y1 ? cap : block, undefined, opts);
  }
  return n;
}
