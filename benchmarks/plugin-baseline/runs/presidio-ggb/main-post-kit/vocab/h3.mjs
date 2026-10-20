// SPDX-License-Identifier: AGPL-3.0-or-later
// Vocabulary H3 (plan.md VOCABULARY): cornice, porchBay, bannerRun, pavilion, leanTo, cannon, hangLantern.
// Every helper takes its position (and facing, where it has one) as arguments and writes only inside the footprint
// it is given, only into air. opts.over: true lets it overwrite. Returns the number of blocks placed.
import { B, OPPOSITE, bannerWord } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

/** Writer for one footprint (inclusive corners lo..hi): a write outside it, or into a cell that is not air, is dropped. */
function writerFor(g, lo, hi, over = false) {
  const a = lo.map((v, i) => Math.min(v, hi[i])), b = lo.map((v, i) => Math.max(v, hi[i]));
  const inside = (x, y, z) => x >= a[0] && x <= b[0] && y >= a[1] && y <= b[1] && z >= a[2] && z <= b[2];
  return (x, y, z, block, state, nbt) => {
    if (!inside(x, y, z) || (!over && !g.isAir(x, y, z))) return false;
    g.set(x, y, z, block, state, nbt);
    return true;
  };
}

/** a, a+step, ... up to b, and b itself. */
const every = (a, b, step) => {
  const out = [];
  for (let v = a; v <= b; v += step) out.push(v);
  if (out[out.length - 1] !== b) out.push(b);
  return out;
};

/**
 * One cornice course: upside-down smooth_quartz_stairs at y 9 along x0..x1 at z. face is the outward normal of the wall
 * it trims (south for a front at high z): the stairs face into the wall, so the lip points out.
 */
export function cornice(g, x0, x1, z, face, opts = {}) {
  const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
  const put = writerFor(g, [lo, 9, z], [hi, 9, z], opts.over);
  let n = 0;
  for (let x = lo; x <= hi; x++) n += put(x, 9, z, ...B.stairs("smooth_quartz", OPPOSITE[face], "top")) ? 1 : 0;
  return n;
}

/**
 * One porch bay of span cells from post column x, between the back line z0 and the front line z2 (front = the high z
 * for a porch facing south, the low z for north). Posts (diorite_wall, y 1..3 and 5..6) stand on the front line at x;
 * the cells x+1..x+span-1 carry the railing (y 5) and the lower rail (y 1) between them; gallery beam smooth_quartz at
 * y 4 on the front line; gallery deck smooth_quartz_slab (top) at y 4 behind it; porch roof smooth_quartz at y 7 on
 * the front line with smooth_quartz_slab (bottom) behind. opts: span (1), facing ("south"), rail (true),
 * lowerRail (true: false at a ramp bay).
 */
export function porchBay(g, x, z0, z2, opts = {}) {
  const { span = 1, facing = "south", rail = true, lowerRail = true, over = false } = opts;
  const lo = Math.min(z0, z2), hi = Math.max(z0, z2), front = facing === "north" ? lo : hi;
  const back = [];
  for (let z = lo; z <= hi; z++) if (z !== front) back.push(z);
  const put = writerFor(g, [x, 1, lo], [x + span - 1, 7, hi], over);
  const place = (...a) => (put(...a) ? 1 : 0);
  let n = 0;
  for (let cx = x; cx < x + span; cx++) {
    const post = cx === x;
    // a connected wall reads as a rail only where the neighbour cell on that side is a rail or post
    const link = span > 1 ? { east: "low", west: "low" } : {};
    n += place(cx, 4, front, "smooth_quartz");
    n += place(cx, 7, front, "smooth_quartz");
    for (const z of back) {
      n += place(cx, 4, z, ...B.slab("smooth_quartz", "top"));
      n += place(cx, 7, z, ...B.slab("smooth_quartz", "bottom"));
    }
    if (post) {
      for (const y of [1, 2, 3, 5, 6]) n += place(cx, y, front, "diorite_wall", span > 1 ? { east: "low" } : undefined);
    } else {
      if (rail) n += place(cx, 5, front, "diorite_wall", link);
      if (lowerRail) n += place(cx, 1, front, "polished_blackstone_wall", link);
    }
  }
  return n;
}

/**
 * A banner word (red wall banners with white letters, one per character, reading left to right from the street) on
 * the row y at z, centred on x0..x1, facing `face` (default south: the banner hangs on the block at z - 1). opts.panels:
 * [[px0, px1, py0, py1], ...] red_wool panels one cell behind the letters (z - 1 facing south).
 */
export function bannerRun(g, text, x0, x1, z, y, opts = {}) {
  const { face = "south", panels = [], over = false } = opts;
  const dz = face === "north" ? 1 : -1;
  const xs = [x0, x1, ...panels.flatMap((p) => [p[0], p[1]])], ys = [y, ...panels.flatMap((p) => [p[2], p[3]])];
  const lo = [Math.min(...xs), Math.min(...ys), Math.min(z, z + dz)], hi = [Math.max(...xs), Math.max(...ys), Math.max(z, z + dz)];
  const put = writerFor(g, lo, hi, over);
  let placed = 0;
  // bannerWord writes through set() and skips cells that are not air; count what the footprint writer accepted
  const sink = { get: (...c) => g.get(...c), set: (...a) => { if (put(...a)) placed++; } };
  const centre = [lo[0] + Math.floor((hi[0] - lo[0]) / 2), y, z];
  bannerWord(sink, text, { center: centre, face, letter: "white", base: "red" });
  for (const [px0, px1, py0, py1] of panels)
    for (let x = px0; x <= px1; x++) for (let py = py0; py <= py1; py++) placed += put(x, py, z + dz, "red_wool") ? 1 : 0;
  return placed;
}

/**
 * A flat-roofed glass pavilion over x0..x1, z0..z1 (walls y 1..6, roof y 7). Perimeter glass_pane with its connections,
 * polished_blackstone mullions (default: every 4th cell along each x face, and the z corners) and a polished_blackstone
 * band at y 4; roof polished_blackstone_slab (bottom) with a polished_blackstone edge course. opts.mullions: { x: [...],
 * z: [...] } (x: on the z faces, z: on the x faces); opts.open(x, y, z) -> true leaves that perimeter cell as air (a door).
 */
export function pavilion(g, x0, z0, x1, z1, opts = {}) {
  const { mullions = {}, open = () => false, over = false } = opts;
  const mx = mullions.x ?? every(x0, x1, 4), mz = mullions.z ?? [z0, z1];
  const put = writerFor(g, [x0, 1, z0], [x1, 7, z1], over);
  const place = (...a) => (put(...a) ? 1 : 0);
  const edge = (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1 && (x === x0 || x === x1 || z === z0 || z === z1);
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    n += edge(x, z) ? place(x, 7, z, "polished_blackstone") : place(x, 7, z, ...B.slab("polished_blackstone", "bottom"));
    if (!edge(x, z)) continue;
    const onZFace = z === z0 || z === z1, onXFace = x === x0 || x === x1;
    for (let y = 1; y <= 6; y++) {
      if (open(x, y, z)) continue;
      const mullion = (onZFace && mx.includes(x)) || (onXFace && mz.includes(z));
      if (y === 4 || mullion) n += place(x, y, z, "polished_blackstone");
      else n += place(x, y, z, "glass_pane", {
        north: String(edge(x, z - 1)), south: String(edge(x, z + 1)), east: String(edge(x + 1, z)), west: String(edge(x - 1, z)),
      });
    }
  }
  return n;
}

/**
 * A stepped lean-to of polished_granite_stairs over x0..x1, z0..z1, lowest at its open edge: one stair course per `run`
 * rows (default 2), the stairs' back toward the high side. facing (default "north": the roof rises to the north, its low
 * edge at the high z). The course at the low edge sits at y; the next run of rows sits one higher.
 */
export function leanTo(g, x0, x1, z0, z1, y, opts = {}) {
  const { facing = "north", run = 2, over = false } = opts;
  const lo = Math.min(z0, z1), hi = Math.max(z0, z1), xa = Math.min(x0, x1), xb = Math.max(x0, x1);
  const rise = Math.ceil((hi - lo + 1) / run);
  const put = writerFor(g, [xa, y, lo], [xb, y + rise - 1, hi], over);
  let n = 0;
  for (let z = lo; z <= hi; z++) {
    const distFromLow = facing === "north" ? hi - z : z - lo;
    const h = y + Math.floor(distFromLow / run);
    for (let x = xa; x <= xb; x++) n += put(x, h, z, ...B.stairs("polished_granite", facing, "bottom")) ? 1 : 0;
  }
  return n;
}

/**
 * A bronze-look cannon on the ground course at y 0: breech polished_blackstone at (x, z), barrel of polished_blackstone_wall
 * (a pipe) over the two cells in front of it, open dark_oak_trapdoor wheels either side at z+1. Muzzle toward facing
 * (default "south", the barrel runs to high z). Footprint x-1..x+1, z..z+2 (z-2..z for north).
 */
export function cannon(g, x, z, opts = {}) {
  const { facing = "south", over = false } = opts;
  const dz = facing === "south" ? 1 : -1;
  const zs = [z, z + dz, z + 2 * dz];
  const put = writerFor(g, [x - 1, 0, Math.min(...zs)], [x + 1, 0, Math.max(...zs)], over);
  const place = (...a) => (put(...a) ? 1 : 0);
  const breechSide = facing === "south" ? "north" : "south", muzzleSide = OPPOSITE[breechSide];
  let n = place(x, 0, z, "polished_blackstone");
  n += place(x, 0, z + dz, "polished_blackstone_wall", { [breechSide]: "low", [muzzleSide]: "low" });
  n += place(x, 0, z + 2 * dz, "polished_blackstone_wall", { [breechSide]: "low" });
  n += place(x - 1, 0, z + dz, ...B.trapdoor("dark_oak", "east", "bottom", true));
  n += place(x + 1, 0, z + dz, ...B.trapdoor("dark_oak", "west", "bottom", true));
  return n;
}

/** A hanging lantern at (x, y, z). It hangs from the block above: with air above, nothing is placed (returns 0). */
export function hangLantern(g, x, y, z, opts = {}) {
  if (g.isAir(x, y + 1, z)) return 0;
  return writerFor(g, [x, y, z], [x, y, z], opts.over)(x, y, z, ...B.lantern(true)) ? 1 : 0;
}
