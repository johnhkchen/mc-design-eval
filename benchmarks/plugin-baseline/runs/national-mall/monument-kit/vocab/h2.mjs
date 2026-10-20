// Vocabulary helpers, part 2 (plan.md VOCABULARY): shaftCourse, obsWindows, plazaDisc, pavilionBox, floodlight, lampPost,
// lodgeHip. Every helper takes its position as arguments and writes only its own footprint: into air, unless opts.replace
// is set, which overwrites cells of that footprint and nothing else. Nothing here writes ground, sand or floor under its
// footprint. Blocks are plan.md's PALETTE ids; states are the 1.21.1 names the toolkit validates.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// One block into the footprint. Returns 1 if placed, 0 if refused (an occupied cell without opts.replace).
function put(g, x, y, z, block, state, opts = {}) {
  if (!opts.replace && !g.isAir(x, y, z)) return 0;
  g.set(x, y, z, block, state);
  return 1;
}

/**
 * One solid course of the obelisk shaft over x0..x1 by z0..z1 at height y. mat: the block; omitted, the plan's rule
 * (smooth quartz to y 24, then calcite on odd courses and smooth sandstone on even ones from y 25).
 */
export function shaftCourse(g, y, x0, z0, x1, z1, mat, opts = {}) {
  const block = mat ?? (y <= 24 ? "smooth_quartz" : y % 2 === 1 ? "calcite" : "smooth_sandstone");
  let n = 0;
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) n += put(g, x, y, z, block, undefined, opts);
  return n;
}

/**
 * The observation face of the obelisk around its centre column (cx, cz), inside the 5-wide shaft: two tinted-glass
 * windows per face at yWin (flush, in the face), a red warning light at the centre of each face at yLight, and a
 * glowstone core behind the lights. The windows and core replace the shaft's own cells: call it after the courses
 * with { replace: true }.
 */
export function obsWindows(g, cx, cz, yWin, yLight, opts = {}) {
  const windows = [[-1, -2], [1, -2], [-1, 2], [1, 2], [-2, -1], [-2, 1], [2, -1], [2, 1]];
  const lights = [[0, -2], [0, 2], [-2, 0], [2, 0]];
  let n = 0;
  for (const [dx, dz] of windows) n += put(g, cx + dx, yWin, cz + dz, "tinted_glass", undefined, opts);
  for (const [dx, dz] of lights) n += put(g, cx + dx, yLight, cz + dz, "red_stained_glass", undefined, opts);
  return n + put(g, cx, yLight, cz, "glowstone", undefined, opts);
}

/**
 * A round disc of one block at height y: every cell with r0 <= r < r1, r measured from the centre (cx, cz). The plaza
 * paves over the ground's grass surface at y 5, so call it with { replace: true }.
 */
export function plazaDisc(g, y, cx, cz, r0, r1, block, opts = {}) {
  const reach = Math.ceil(r1);
  let n = 0;
  for (let x = cx - reach; x <= cx + reach; x++)
    for (let z = cz - reach; z <= cz + reach; z++) {
      const r = Math.hypot(x - cx, z - cz);
      if (r >= r0 && r < r1) n += put(g, x, y, z, block, undefined, opts);
    }
  return n;
}

/**
 * The one-storey screening pavilion on the footprint x0..x1 by z0..z1 (4 deep in z), standing on the plaza at floor y0.
 * Walls of polished diorite at y0+1..y0+2, with glass panes across the top course of the north and south faces; a door
 * 2 wide and 2 high in the x face named by facing ("east" or "west"); a flat roof at y0+3 (smooth stone slab field,
 * polished andesite coping); a lantern hanging under the roof at the room's centre. The floor at y0 is the plaza's and
 * is not written.
 */
export function pavilionBox(g, x0, z0, x1, z1, y0, facing = "east", opts = {}) {
  if (z1 - z0 !== 3 || x1 - x0 < 2) throw new Error(`pavilionBox: footprint must be 4 deep in z and 3+ wide in x, got ${[x0, z0, x1, z1]}`);
  if (facing !== "east" && facing !== "west") throw new Error(`pavilionBox: facing must be east or west, got ${facing}`);
  const doorX = facing === "east" ? x1 : x0;
  const cx = Math.floor((x0 + x1) / 2), cz = z0 + 1;
  const edge = (x, z) => x === x0 || x === x1 || z === z0 || z === z1;
  const [slabId, slabState] = B.slab("smooth_stone", "bottom");
  const [lanternId, lanternState] = B.lantern(true);
  let n = 0;
  for (let y = y0 + 1; y <= y0 + 2; y++)
    for (let x = x0; x <= x1; x++)
      for (let z = z0; z <= z1; z++) {
        if (!edge(x, z) || (x === doorX && z > z0 && z < z1)) continue;   // interior and door stay air
        if (y === y0 + 2 && (z === z0 || z === z1) && x > x0 && x < x1) n += put(g, x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true" }, opts);
        else n += put(g, x, y, z, "polished_diorite", undefined, opts);
      }
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      n += edge(x, z) ? put(g, x, y0 + 3, z, "polished_andesite", undefined, opts) : put(g, x, y0 + 3, z, slabId, slabState, opts);
  // hangs from the roof above, so it is written only if the roof is there
  if (!g.isAir(cx, y0 + 3, cz)) n += put(g, cx, y0 + 2, cz, lanternId, lanternState, opts);
  return n;
}

/** One flush ochre froglight at (x, y, z): the paving or lawn cell it replaces (opts.replace), or an air cell. */
export function floodlight(g, x, y, z, opts = {}) {
  return put(g, x, y, z, "ochre_froglight", { axis: "y" }, opts);
}

/**
 * A low lamp beside a walk: an andesite wall post at h+1 with a standing lantern on it at h+2, where h is the ground's
 * surface at (x, z). Writes nothing unless there is solid ground at h, so a lamp never floats.
 */
export function lampPost(g, x, z, h, opts = {}) {
  if (g.isAir(x, h, z)) return 0;
  const post = put(g, x, h + 1, z, "andesite_wall", { up: "true", north: "none", east: "none", south: "none", west: "none" }, opts);
  if (g.isAir(x, h + 1, z)) return post;
  const [lanternId, lanternState] = B.lantern(false);
  return post + put(g, x, h + 2, z, lanternId, lanternState, opts);
}

/**
 * A small survey lodge on x0..x1 by z0..z1, standing on floor yFloor: stone brick walls round the perimeter at
 * yFloor+1..yFloor+2; a low hip of stone brick stairs at yFloor+3 on the perimeter, facing outward (a corner takes its
 * north or south row's facing); a ridge slab on any interior roof cell. opts.slit: [x, y, z], one wall cell made a
 * glass pane (a slit on the east or west face runs north-south, on the north or south face east-west).
 */
export function lodgeHip(g, x0, z0, x1, z1, yFloor, opts = {}) {
  const { slit, ...po } = opts;
  const wallTop = yFloor + 2, roofY = yFloor + 3;
  const edge = (x, z) => x === x0 || x === x1 || z === z0 || z === z1;
  const outward = (x, z) => (z === z0 ? "north" : z === z1 ? "south" : x === x0 ? "west" : "east");
  if (slit && (!edge(slit[0], slit[2]) || slit[1] < yFloor + 1 || slit[1] > wallTop)) throw new Error(`lodgeHip: slit ${slit} is not a wall cell`);
  let n = 0;
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      if (edge(x, z)) {
        for (let y = yFloor + 1; y <= wallTop; y++) {
          const isSlit = slit && slit[0] === x && slit[1] === y && slit[2] === z;
          if (isSlit) {
            const ns = x === x0 || x === x1;
            n += put(g, x, y, z, "glass_pane", ns ? { north: "true", south: "true", east: "false", west: "false" } : { north: "false", south: "false", east: "true", west: "true" }, po);
          } else n += put(g, x, y, z, "stone_bricks", undefined, po);
        }
        const [stairId, stairState] = B.stairs("stone_brick", outward(x, z), "bottom");
        n += put(g, x, roofY, z, stairId, stairState, po);
      } else {
        const [slabId, slabState] = B.slab("stone_brick", "bottom");
        n += put(g, x, roofY, z, slabId, slabState, po);
      }
    }
  return n;
}
