// Vocabulary helpers h1 (plan.md VOCABULARY): ground, obelisk, plaza, pavilion, flags, walks, lamps, trees, lodge.
// Every helper takes its position as arguments and returns the number of blocks it placed.
// Writes go into air only; pass { over: true } for the few that replace a surface or a flush wall block
// (plazaDisc, obsWindows, floodlight, walkCell). Nothing is written outside the helper's own footprint.
import { B, stairOrientation } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Place one entry ("block" or [block, state, nbt]) at x,y,z. Refused (returns 0) out of bounds, or on a
// non-air cell unless over is set.
const put = (g, x, y, z, entry, over = false) => {
  if (!g.inBounds(x, y, z) || (!over && !g.isAir(x, y, z))) return 0;
  g.set(x, y, z, ...(typeof entry === "string" ? [entry] : entry));
  return 1;
};

const fillRect = (g, x0, z0, x1, z1, y, entry, over) => {
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) n += put(g, x, y, z, entry, over);
  return n;
};

// Ring of stairs round the rectangle x0..x1, z0..z1 at height y, every stair's high back toward the centre.
// Corners take the outer shape from which two sides are open (stairOrientation).
const stairRing = (g, x0, z0, x1, z1, y, material, over) => {
  let n = 0;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x !== x0 && x !== x1 && z !== z0 && z !== z1) continue;
    const exposed = [];
    if (z === z0) exposed.push("north");
    if (z === z1) exposed.push("south");
    if (x === x0) exposed.push("west");
    if (x === x1) exposed.push("east");
    const { facing, shape } = stairOrientation(exposed, x - cx, z - cz);
    n += put(g, x, y, z, B.stairs(material, facing, "bottom", shape), over);
  }
  return n;
};

// Top solid cell of column x,z (-1 if none).
const topY = (g, x, z) => {
  for (let y = g.size[1] - 1; y >= 0; y--) if (!g.isAir(x, y, z)) return y;
  return -1;
};

const courseMaterial = (y) => (y <= 24 ? "smooth_quartz" : y % 2 ? "calcite" : "smooth_sandstone");

/** Ground column at x,z up to surface h: stone 1..h-4, dirt h-3..h-1, grass_block h. */
export function groundColumn(g, x, z, h, { over = false } = {}) {
  let n = 0;
  for (let y = 1; y <= h - 4; y++) n += put(g, x, y, z, "stone", over);
  for (let y = Math.max(0, h - 3); y <= h - 1; y++) n += put(g, x, y, z, "dirt", over);
  return n + put(g, x, h, z, "grass_block", over);
}

/** Taper wash at height y on the rectangle x0..x1, z0..z1: stairs on the perimeter facing in, solid core. */
export function taperRing(g, y, x0, z0, x1, z1, { over = false } = {}) {
  return stairRing(g, x0, z0, x1, z1, y, "smooth_sandstone", over)
    + fillRect(g, x0 + 1, z0 + 1, x1 - 1, z1 - 1, y, "smooth_sandstone", over);
}

/**
 * One pyramidion from base height y (plan: y 69): 5x5 stair ring over a 3x3 core, 3x3 core, 3x3 stair ring over a
 * point, the point, a sandstone_wall needle (y+4..y+5) and the chain tip (y+6..y+7). Centre column at cx, cz.
 */
export function pyramidCourse(g, cx, y, cz, { over = false } = {}) {
  let n = stairRing(g, cx - 2, cz - 2, cx + 2, cz + 2, y, "smooth_sandstone", over);
  n += fillRect(g, cx - 1, cz - 1, cx + 1, cz + 1, y, "smooth_sandstone", over);
  n += fillRect(g, cx - 1, cz - 1, cx + 1, cz + 1, y + 1, "smooth_sandstone", over);
  n += stairRing(g, cx - 1, cz - 1, cx + 1, cz + 1, y + 2, "smooth_sandstone", over);
  n += put(g, cx, y + 2, cz, "smooth_sandstone", over);
  n += put(g, cx, y + 3, cz, "smooth_sandstone", over);
  for (const dy of [4, 5]) n += put(g, cx, y + dy, cz, ["sandstone_wall", { up: "true" }], over);
  for (const dy of [6, 7]) n += put(g, cx, y + dy, cz, ["chain", { axis: "y" }], over);
  return n;
}

/** One course of the shaft over x0..x1, z0..z1 at y. mat defaults by height: quartz to y24, then calcite (odd) / sandstone (even). */
export function shaftCourse(g, y, x0, z0, x1, z1, mat, { over = false } = {}) {
  return fillRect(g, x0, z0, x1, z1, y, mat ?? courseMaterial(y), over);
}

/** Observation windows (y66) and aircraft warning lights (y67) on the 5x5 shaft centred at cx, cz; needs over (the shaft is solid there). */
export function obsWindows(g, cx, cz, { over = false } = {}) {
  let n = 0;
  for (const [x, z] of [[cx - 1, cz - 2], [cx + 1, cz - 2], [cx - 1, cz + 2], [cx + 1, cz + 2],
    [cx - 2, cz - 1], [cx - 2, cz + 1], [cx + 2, cz - 1], [cx + 2, cz + 1]]) n += put(g, x, 66, z, "tinted_glass", over);
  for (const [x, z] of [[cx, cz - 2], [cx, cz + 2], [cx - 2, cz], [cx + 2, cz]]) n += put(g, x, 67, z, "red_stained_glass", over);
  return n + put(g, cx, 67, cz, "glowstone", over);
}

/** Paving disc on the single layer y: cells with r0 <= distance from cx,cz < r1 set to block. Replaces the surface, so needs over. */
export function plazaDisc(g, cx, cz, y, r0, r1, block, { over = false } = {}) {
  let n = 0;
  const reach = Math.ceil(r1);
  for (let x = cx - reach; x <= cx + reach; x++) for (let z = cz - reach; z <= cz + reach; z++) {
    const r = Math.hypot(x - cx, z - cz);
    if (r >= r0 && r < r1) n += put(g, x, y, z, block, over);
  }
  return n;
}

/**
 * Seating wall at y (plan: 6) on the ring 9.5 <= r < 10.5 round cx,cz: polished_andesite_slab, gaps 5 wide on the
 * N/S/E/W axes and 3 wide on the diagonals, the two cells at each arc end a full polished_andesite with a lantern on y+1.
 */
export function seatingArc(g, cx, cz, y, { over = false } = {}) {
  const gap = (dx, dz) => Math.abs(dx) <= 2.5 || Math.abs(dz) <= 2.5 || Math.abs(dx - dz) <= 2.12 || Math.abs(dx + dz) <= 2.12;
  const ring = [];
  for (let x = cx - 11; x <= cx + 11; x++) for (let z = cz - 11; z <= cz + 11; z++) {
    const dx = x - cx, dz = z - cz, r = Math.hypot(dx, dz);
    if (r >= 9.5 && r < 10.5) ring.push({ x, z, ang: Math.atan2(dz, dx), gap: gap(dx, dz) });
  }
  ring.sort((a, b) => a.ang - b.ang);
  let n = 0;
  ring.forEach((c, i) => {
    if (c.gap) return;
    const prev = ring[(i - 1 + ring.length) % ring.length], next = ring[(i + 1) % ring.length];
    if (prev.gap || next.gap) {
      n += put(g, c.x, y, c.z, "polished_andesite", over);
      n += put(g, c.x, y + 1, c.z, ["lantern", { hanging: "false" }], over);
    } else n += put(g, c.x, y, c.z, B.slab("polished_andesite", "bottom"), over);
  });
  return n;
}

/**
 * Screening pavilion, 5 long and 4 wide, base y (plan: 6), roof y+2. facing is the entrance side: the 2-wide
 * opening sits in the middle of that end. Walls are polished_diorite, glass_pane bands on the two long faces,
 * a hanging lantern under the roof, flat smooth_stone_slab roof with a polished_andesite coping.
 */
export function pavilionBox(g, x0, y, z0, facing = "east", { over = false } = {}) {
  const LEN = 5, WID = 4;
  const at = (i, j) => {
    if (facing === "east") return [x0 + i, z0 + j];
    if (facing === "west") return [x0 + (LEN - 1 - i), z0 + j];
    if (facing === "south") return [x0 + j, z0 + i];
    if (facing === "north") return [x0 + j, z0 + (LEN - 1 - i)];
    throw new Error(`pavilionBox: facing must be a compass direction, got ${facing}`);
  };
  const along = facing === "east" || facing === "west" ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  let n = 0;
  for (let i = 0; i < LEN; i++) for (let j = 0; j < WID; j++) {
    const [x, z] = at(i, j);
    const edge = i === 0 || i === LEN - 1 || j === 0 || j === WID - 1;
    const door = i === LEN - 1 && (j === 1 || j === 2);
    if (edge) {
      n += put(g, x, y + 2, z, "polished_andesite", over);
      if (door) continue;
      n += put(g, x, y, z, "polished_diorite", over);
      const band = (j === 0 || j === WID - 1) && i >= 1 && i <= LEN - 2;
      n += band ? put(g, x, y + 1, z, ["glass_pane", along], over) : put(g, x, y + 1, z, "polished_diorite", over);
    } else {
      n += put(g, x, y + 2, z, B.slab("smooth_stone", "bottom"), over);
      if (i === 2 && j === 1) n += put(g, x, y + 1, z, ["lantern", { hanging: "true" }], over);
    }
  }
  return n;
}

/**
 * Flagpole k of a ring of count poles (default 50) round cx,cz at radius r, base surface y (plan: 5): end_rod
 * y+1..y+5, white_concrete cap y+6, and a white_wall_banner on the cap's outward face (red stripe_small, blue square_top_left).
 */
export function flagPole(g, k, cx, cz, r, y, { over = false, count = 50 } = {}) {
  const a = (k * 360 / count) * Math.PI / 180;
  const px = Math.round(cx + r * Math.cos(a)), pz = Math.round(cz + r * Math.sin(a));
  let n = 0;
  for (let dy = 1; dy <= 5; dy++) n += put(g, px, y + dy, pz, ["end_rod", { facing: "up" }], over);
  n += put(g, px, y + 6, pz, "white_concrete", over);
  const horizontal = Math.abs(Math.cos(a)) >= Math.abs(Math.sin(a));
  const [dx, dz] = horizontal ? [Math.sign(Math.cos(a)), 0] : [0, Math.sign(Math.sin(a))];
  const facing = dx > 0 ? "east" : dx < 0 ? "west" : dz > 0 ? "south" : "north";
  return n + put(g, px + dx, y + 6, pz + dz,
    B.banner("white", [["stripe_small", "red"], ["square_top_left", "blue"]], { wall: true, facing }), over);
}

/** Flush ochre_froglight at x,y,z (replaces the surface block there, so needs over). */
export function floodlight(g, x, y, z, { over = false } = {}) {
  return put(g, x, y, z, "ochre_froglight", over);
}

/**
 * Walk surface at y (the ground's top block): white_concrete_powder, only over solid ground. A cell with a
 * neighbour one block higher is the first step down, so it takes a smooth_stone_slab (bottom) on top at y+1.
 */
export function walkCell(g, x, y, z, { over = false } = {}) {
  if (g.isAir(x, y - 1, z)) return 0;
  if (!put(g, x, y, z, "white_concrete_powder", over)) return 0;
  const higher = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => topY(g, x + dx, z + dz) === y + 1);
  return 1 + (higher ? put(g, x, y + 1, z, B.slab("smooth_stone", "bottom")) : 0);
}

/** Lamp post on the ground at y: andesite_wall post at y+1, standing lantern at y+2. */
export function lampPost(g, x, y, z, { over = false } = {}) {
  if (g.isAir(x, y, z)) return 0;
  return put(g, x, y + 1, z, ["andesite_wall", { up: "true" }], over)
    + put(g, x, y + 2, z, ["lantern", { hanging: "false" }], over);
}

/**
 * Oak tree rooted on the ground at y: trunk y+1..y+5, leaves y+4..y+7 in a ragged radius-2 crown (outer cells
 * dropped on a fixed pattern, so it is not a sphere). Leaves are persistent.
 */
export function oakTree(g, x, y, z, { over = false } = {}) {
  if (g.isAir(x, y, z)) return 0;
  let n = 0;
  for (let dy = 1; dy <= 5; dy++) n += put(g, x, y + dy, z, ["oak_log", { axis: "y" }], over);
  for (const [dy, max] of [[4, 5], [5, 5], [6, 4], [7, 2]]) {
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
      const d2 = dx * dx + dz * dz;
      if (d2 > max || (dx === 0 && dz === 0 && dy <= 5)) continue;
      if (d2 >= 4 && ((x + dx) * 7 + (y + dy) * 13 + (z + dz) * 29) % 3 === 0) continue;
      n += put(g, x + dx, y + dy, z + dz, ["oak_leaves", { persistent: "true" }], over);
    }
  }
  return n;
}

/**
 * Survey Lodge, the part inside the plot: a 3x2 footprint at x0..x0+2, z0..z0+1, walls stone_bricks at y0..y0+1
 * with a glass_pane slit on the west face, roof at y0+2: stair hip on the north row (outer corners at the ends),
 * stone_brick_slab ridge on the south row (the lodge continues past z0+1).
 */
export function lodgeHip(g, x0, y0, z0, { over = false } = {}) {
  let n = 0;
  for (let x = x0; x <= x0 + 2; x++) for (let z = z0; z <= z0 + 1; z++) {
    for (const dy of [0, 1]) {
      if (dy === 1 && x === x0 && z === z0 + 1) n += put(g, x, y0 + 1, z, ["glass_pane", { north: "true", south: "true", east: "false", west: "false" }], over);
      else n += put(g, x, y0 + dy, z, "stone_bricks", over);
    }
    if (z === z0) {
      const exposed = ["north"];
      if (x === x0) exposed.push("west");
      if (x === x0 + 2) exposed.push("east");
      const { facing, shape } = stairOrientation(exposed, x - (x0 + 1), 0);
      n += put(g, x, y0 + 2, z, B.stairs("stone_brick", facing, "bottom", shape), over);
    } else n += put(g, x, y0 + 2, z, B.slab("stone_brick", "bottom"), over);
  }
  return n;
}
