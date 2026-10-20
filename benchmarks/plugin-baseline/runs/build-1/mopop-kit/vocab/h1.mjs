// MoPOP vocabulary, helper set h1 (plan.md VOCABULARY): billowShell, streaks, fin, beamRun, monorailTrain,
// doorPair, connector, tiers, birchTree. Imports nothing from vocab.mjs or the other vocab/ files.
//
// Every helper takes its position as arguments and returns { box, placed, skipped, cells }. It writes only inside
// `box` (the footprint it was given), only into air unless an option names what it may replace, never at ground
// level (y0 - 1 and below belong to an earlier part), and leaves a refused write in `skipped` instead of forcing it.
import { B, DIRS, face } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// The monorail corridor (plan.md HARD ENVELOPE): no shell writes into it unless the caller says so.
const MONORAIL_CORRIDOR = [[43, 8, 0, 51, 17, 152]];

const ns = (id) => (id.startsWith("minecraft:") ? id : `minecraft:${id}`);
const inBox = (box, [x, y, z]) => x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];
const need = (name, o, keys) => keys.forEach((k) => { if (o[k] == null) throw new Error(`${name}: missing ${k}`); });

/**
 * The one write path. A cell is written when it is inside `box`, not in `avoid`, in bounds, and either air or a block
 * named in `over` (or any solid block when over is "solid"). cell is a block id or a [block, state, nbt] from B.*.
 * guard() refusals are counted as skipped, not placed.
 */
function writer(g, box, { over = [], avoid = [] } = {}) {
  const out = { box, placed: 0, skipped: 0, cells: [] };
  const extra = over === "solid" ? [] : over.map(ns);
  const w = (x, y, z, cell, { kind, over: more = [] } = {}) => {
    const cur = g.inBounds(x, y, z) ? g.blockAt(x, y, z) : null;
    const free = g.isAir(x, y, z) || (over === "solid" ? !g.isAir(x, y, z) : [...extra, ...more.map(ns)].includes(cur));
    const ok = inBox(box, [x, y, z]) && !avoid.some((b) => inBox(b, [x, y, z])) && cur !== null && free;
    if (!ok) { out.skipped++; return false; }
    const [block, state, nbt] = typeof cell === "string" ? [cell] : cell;
    const refusedBefore = g.refused?.length ?? 0;
    g.set(x, y, z, block, state, nbt);
    if ((g.refused?.length ?? 0) > refusedBefore) { out.skipped++; return false; }
    out.placed++;
    out.cells.push({ x, y, z, kind, block: ns(block) });
    return true;
  };
  return { w, out };
}

/**
 * A hollow heightmap shell (thickness 1) of a billowing metal mass. The section is an ellipse (cx, cz; rx, rz) scaled by
 * `profile` ([[y, factor], ...], interpolated): a factor above 1 bulges the wall out, and an overhang under a bulge gets
 * upside-down stairs. The crown is `topFn(x, z)` if given, else a dome down to y0 at the rim, rounded to whole blocks.
 *   crown cells: stairs stepping up toward a higher neighbour (back toward it), stairs stepping down away from a lower
 *     neighbour or the open edge, else a bottom slab (the gentle crown).
 *   side cells: body. underside cells: upside-down stairs facing the centre.
 * Interior cells stay air. clip(x, z) is the footprint mask. keepOut boxes (default: the monorail corridor) are never
 * written, but the shell still forms around them. Returns the cells it placed, for streaks().
 * o: { name, center: [cx, cz], rx, rz, y0, top, profile, topFn, body, stairs, slab, clip, keepOut }
 */
export function billowShell(g, o) {
  need("billowShell", o, ["center", "rx", "rz", "y0", "top", "profile", "body", "stairs", "slab"]);
  const { name = "shell", center: [cx, cz], rx, rz, y0, top, profile, topFn, body, stairs, slab,
    clip = () => true, keepOut = MONORAIL_CORRIDOR } = o;
  const prof = [...profile].sort((a, b) => a[0] - b[0]);
  const factor = (y) => {
    if (y <= prof[0][0]) return prof[0][1];
    if (y >= prof.at(-1)[0]) return prof.at(-1)[1];
    const i = prof.findIndex((p) => p[0] >= y);
    const [ya, fa] = prof[i - 1], [yb, fb] = prof[i];
    return fa + ((fb - fa) * (y - ya)) / (yb - ya);
  };
  const maxF = Math.max(1, ...prof.map((p) => p[1]));
  const radial = (x, z, f) => Math.hypot((x - cx) / (rx * f), (z - cz) / (rz * f));
  const crownAt = (x, z) => {
    if (topFn) return Math.floor(topFn(x, z));
    const rr = radial(x, z, factor(top));
    return y0 + Math.round((top - y0) * Math.sqrt(Math.max(0, 1 - rr * rr)));
  };

  // solid cells: inside the section at their height, under the crown, inside the footprint mask
  const solid = new Set();
  const key = (x, y, z) => `${x},${y},${z}`;
  const has = (x, y, z) => solid.has(key(x, y, z));
  for (let x = Math.floor(cx - rx * maxF); x <= Math.ceil(cx + rx * maxF); x++)
    for (let z = Math.floor(cz - rz * maxF); z <= Math.ceil(cz + rz * maxF); z++) {
      if (!clip(x, z)) continue;
      const h = Math.min(crownAt(x, z), top);
      for (let y = y0; y <= h; y++) if (radial(x, z, factor(y)) <= 1) solid.add(key(x, y, z));
    }

  // highest solid cell per column (a missing neighbour counts as lower, so the rim steps down outward)
  const topY = new Map();
  let bounds = null;
  for (const k of solid) {
    const [x, y, z] = k.split(",").map(Number);
    const c = `${x},${z}`;
    if (!topY.has(c) || topY.get(c) < y) topY.set(c, y);
    bounds = bounds ? [Math.min(bounds[0], x), Math.min(bounds[1], y), Math.min(bounds[2], z), Math.max(bounds[3], x), Math.max(bounds[4], y), Math.max(bounds[5], z)] : [x, y, z, x, y, z];
  }
  const box = bounds ?? [0, 0, 0, -1, -1, -1];
  const { w, out } = writer(g, box, { avoid: keepOut });
  out.name = name;

  const DIR4 = [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]];
  const mat = (id, suffix) => id.replace(new RegExp(`_${suffix}$`), "");
  const inward = (x, z) => {
    const dx = cx - x, dz = cz - z;
    return Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? "east" : "west") : (dz > 0 ? "south" : "north");
  };
  for (const k of [...solid].sort()) {
    const [x, y, z] = k.split(",").map(Number);
    const isTop = !has(x, y + 1, z);
    const under = y > y0 && !has(x, y - 1, z);
    const side = DIR4.some(([, dx, dz]) => !has(x + dx, y, z + dz));
    if (isTop) {
      const nb = DIR4.map(([d, dx, dz]) => ({ d, h: topY.get(`${x + dx},${z + dz}`) ?? -Infinity }));
      const up = nb.filter((n) => n.h > y).sort((a, b) => b.h - a.h)[0];
      const down = nb.filter((n) => n.h < y).sort((a, b) => a.h - b.h)[0];
      const cell = up ? B.stairs(mat(stairs, "stairs"), up.d, "bottom")
        : down ? B.stairs(mat(stairs, "stairs"), face.opposite(down.d), "bottom")
        : B.slab(mat(slab, "slab"), "bottom");
      w(x, y, z, cell, { kind: "top" });
    } else if (under) {
      w(x, y, z, B.stairs(mat(stairs, "stairs"), inward(x, z), "top"), { kind: "under" });
    } else if (side) {
      w(x, y, z, body, { kind: "side" });
    }
  }
  return out;
}

/**
 * Vertical 1-wide streaks of `block` on the outer face of a billowShell: every column with (x + z) % every === 0 that
 * the shell left as a side cell. Replaces only the shell's own body cells, which the shell wrote.
 */
export function streaks(g, shell, { block = "magenta_concrete", every = 7 } = {}) {
  const out = { box: shell.box, placed: 0, skipped: 0, cells: [] };
  for (const c of shell.cells) {
    if (c.kind !== "side" || (c.x + c.z) % every !== 0) continue;
    if (g.blockAt(c.x, c.y, c.z) !== c.block) { out.skipped++; continue; }
    g.set(c.x, c.y, c.z, block);
    out.placed++;
    out.cells.push({ x: c.x, y: c.y, z: c.z, kind: "streak", block: ns(block) });
  }
  return out;
}

/**
 * A tapered blade of iron_block leaning south: at y0 it spans x0..x1 (width w0) and at yTop it is topWidth wide,
 * centred, and shifted `lean` blocks south. The top row is stairs at both ends and slab across the middle (the curved edge).
 */
export function fin(g, { x0, x1, z0, z1, y0, yTop, topWidth = 3, lean = 2, body = "iron_block",
  edge = "polished_diorite_stairs", edgeSlab = "polished_diorite_slab" }) {
  need("fin", { x0, x1, z0, z1, y0, yTop }, ["x0", "x1", "z0", "z1", "y0", "yTop"]);
  const w0 = x1 - x0 + 1, span = yTop - y0;
  const { w, out } = writer(g, [x0, y0, z0, x1, yTop, z1 + lean]);
  for (let y = y0; y <= yTop; y++) {
    const t = span ? (y - y0) / span : 0;
    const width = Math.round(w0 + (topWidth - w0) * t);
    const xa = x0 + Math.floor((w0 - width) / 2), xb = xa + width - 1;
    const s = Math.round(lean * t);
    for (let x = xa; x <= xb; x++)
      for (let z = z0 + s; z <= z1 + s; z++) {
        if (y < yTop) w(x, y, z, body, { kind: "blade" });
        else if (x === xa) w(x, y, z, B.stairs(edge.replace(/_stairs$/, ""), "east", "bottom"), { kind: "edge" });
        else if (x === xb) w(x, y, z, B.stairs(edge.replace(/_stairs$/, ""), "west", "bottom"), { kind: "edge" });
        else w(x, y, z, B.slab(edgeSlab.replace(/_slab$/, ""), "bottom"), { kind: "edge" });
      }
  }
  return out;
}

/**
 * The monorail's two beams, width `w` each, at the outer ends of x0..x1 (a gap between them), y..y+h-1, z0..z1.
 * Plan: x0 44, x1 49, y 9, h 2, z 0..152 gives beams at x 44..45 and 48..49.
 */
export function beamRun(g, { x0, x1, z0, z1, y, h, w: width = 2, block = "light_gray_concrete" }) {
  need("beamRun", { x0, x1, z0, z1, y, h }, ["x0", "x1", "z0", "z1", "y", "h"]);
  const { w, out } = writer(g, [x0, y, z0, x1, y + h - 1, z1]);
  for (const [a, b] of [[x0, x0 + width - 1], [x1 - width + 1, x1]])
    for (let x = a; x <= b; x++)
      for (let yy = y; yy < y + h; yy++)
        for (let z = z0; z <= z1; z++) w(x, yy, z, block, { kind: "beam" });
  return out;
}

/**
 * The monorail train, 4 wide (x0..x0+3) and 8 high (y0..y0+7: skirts, floor, body, roof), from z0 to z1 (the plan's
 * train is x0 47, y0 9, z 70..87). The noses at z0 and z1 slope in; the windows are panes in runs of 3 with a white
 * block between; gray doors sit at z0+5 and z0+12; two lanterns hang from the roof at z0+8 and z0+14.
 */
export function monorailTrain(g, { x0, y0, z0, z1 }) {
  need("monorailTrain", { x0, y0, z0, z1 }, ["x0", "y0", "z0", "z1"]);
  const xs = x0 + 3;
  const plan = new Map();
  const put = (x, y, z, cell) => plan.set(`${x},${y},${z}`, [x, y, z, cell]);
  const pane = ["light_gray_stained_glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];
  for (let z = z0; z <= z1; z++) {
    for (let x = x0; x <= xs; x++) {
      const side = x === x0 || x === xs;
      put(x, y0 + 2, z, "gray_concrete");                                     // floor
      put(x, y0 + 7, z, side ? B.slab("smooth_quartz", "bottom") : "white_concrete"); // roof
      if (side) {
        put(x, y0, z, "gray_concrete");                                       // skirts straddle the beam
        put(x, y0 + 1, z, "gray_concrete");
        put(x, y0 + 3, z, "red_concrete");                                    // full-length stripe
        put(x, y0 + 4, z, "white_concrete");
        put(x, y0 + 5, z, "white_concrete");
        if (z > z0 && z < z1 && (z - z0 - 1) % 4 < 3) { put(x, y0 + 4, z, pane); put(x, y0 + 5, z, pane); }
      }
    }
  }
  for (const z of [z0, z1]) {
    const inward = z === z0 ? "south" : "north";
    for (let x = x0; x <= xs; x++) {
      const side = x === x0 || x === xs;
      put(x, y0 + 3, z, "red_concrete");
      put(x, y0 + 4, z, "white_concrete");
      put(x, y0 + 5, z, side ? B.stairs("smooth_quartz", inward, "bottom") : "black_concrete");
      put(x, y0 + 6, z, B.stairs("smooth_quartz", inward, "bottom"));
    }
  }
  for (const z of [z0 + 5, z0 + 12])
    for (const x of [x0, xs]) for (let y = y0 + 3; y <= y0 + 5; y++) put(x, y, z, "gray_concrete");
  for (const z of [z0 + 8, z0 + 14]) put(x0 + 1, y0 + 6, z, B.lantern(true));

  const { w, out } = writer(g, [x0, y0, z0, xs, y0 + 7, z1]);
  for (const [x, y, z, cell] of plan.values()) w(x, y, z, cell, { kind: "train" });
  return out;
}

/**
 * A door (both halves, birch by default) at x, z with its lower half at y0, facing out of the building. The two posts
 * stand in front of the wall, either side of the door (the door cell and the cell in front stay clear), each with a
 * lantern on top. over: blocks the door may replace (a curtain wall's glass_pane, for example).
 */
export function doorPair(g, { x, z, y0, facing, over = [], mat = "birch", post = "andesite_wall" }) {
  need("doorPair", { x, z, y0, facing }, ["x", "z", "y0", "facing"]);
  const [fx, , fz] = DIRS[facing];
  const along = fz !== 0 ? [1, 0] : [0, 1];
  const { w, out } = writer(g, [x - 1, y0, z - 1, x + 1, y0 + 2, z + 1], { over });
  w(x, y0, z, B.door(mat, facing, "lower", "left"), { kind: "door" });
  w(x, y0 + 1, z, B.door(mat, facing, "upper", "left"), { kind: "door" });
  for (const s of [-1, 1]) {
    const px = x + s * along[0] + fx, pz = z + s * along[1] + fz;
    w(px, y0, pz, [post, { up: "true" }], { kind: "post" });
    w(px, y0 + 1, pz, B.lantern(false), { kind: "lamp" });
  }
  return out;
}

/**
 * A 2-wide x 3-high opening through a shell wall: the box is cut to air (the one helper that cuts), and the reveal (the
 * solid cells beside and above it, in the wall's plane) is lined with `lining`. box: [x0, y0, z0, x1, y1, z1].
 */
export function connector(g, { box: [x0, y0, z0, x1, y1, z1], lining = "polished_andesite" }) {
  need("connector", { x0, y0, z0, x1, y1, z1 }, ["x0", "y0", "z0", "x1", "y1", "z1"]);
  const wideX = x1 - x0 >= z1 - z0;
  const fp = wideX ? [x0 - 1, y0, z0, x1 + 1, y1 + 1, z1] : [x0, y0, z0 - 1, x1, y1 + 1, z1 + 1];
  const { w, out } = writer(g, fp, { over: "solid" });
  let cut = 0;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    if (!g.inBounds(x, y, z)) continue;
    g.set(x, y, z, "minecraft:air");
    cut++;
  }
  out.cut = cut;
  for (let x = fp[0]; x <= fp[3]; x++) for (let y = fp[1]; y <= fp[4]; y++) for (let z = fp[2]; z <= fp[5]; z++) {
    if (inBox([x0, y0, z0, x1, y1, z1], [x, y, z])) continue;
    w(x, y, z, lining, { kind: "reveal" });
  }
  return out;
}

/**
 * The amphitheatre steps over x0..x1, z0..z1 (z1 is the south edge, the lowest tier; the steps rise to the north). Tier
 * 0 is a bottom slab at y0; tiers 1 and 2 are full blocks to y0+t-1 with a slab at y0+t; the north rest is full blocks
 * to y0+2 with polished_andesite on top. andesite_wall rails sit on the top of x0 and x1 for every row.
 * Plan: x0 4, x1 40, z0 4, z1 13, y0 1. Writes from y0 up; the ground at y0 - 1 is left alone.
 */
export function tiers(g, { x0, x1, z0, z1, y0 }) {
  need("tiers", { x0, x1, z0, z1, y0 }, ["x0", "x1", "z0", "z1", "y0"]);
  const { w, out } = writer(g, [x0, y0, z0, x1, y0 + 3, z1]);
  for (let z = z1; z >= z0; z--) {
    const t = Math.min(3, Math.floor((z1 - z) / 2));
    const topY = t < 3 ? y0 + t : y0 + 2;
    for (let x = x0; x <= x1; x++) {
      if (t < 3) {
        for (let y = y0; y < y0 + t; y++) w(x, y, z, "smooth_stone", { kind: "tier" });
        w(x, y0 + t, z, B.slab("smooth_stone", "bottom"), { kind: "tier" });
      } else {
        for (let y = y0; y < topY; y++) w(x, y, z, "smooth_stone", { kind: "tier" });
        w(x, topY, z, "polished_andesite", { kind: "tier" });
      }
    }
    for (const x of [x0, x1]) w(x, topY + 1, z, ["andesite_wall", { up: "true" }], { kind: "rail" });
  }
  return out;
}

/**
 * A birch tree at x, z with its trunk base at y (the cell above the grass, which is not written): a 6-high birch_log
 * trunk and a persistent birch_leaves crown from y+3 to y+7, rounded rather than a sphere (5 wide at the widest).
 */
export function birchTree(g, { x, z, y }) {
  need("birchTree", { x, z, y }, ["x", "z", "y"]);
  const { w, out } = writer(g, [x - 2, y, z - 2, x + 2, y + 7, z + 2]);
  for (let k = 0; k < 6; k++) w(x, y + k, z, B.log("birch", "y"), { kind: "trunk" });
  // [height above y, radius, cut corners]
  const crown = [[3, 2, true], [4, 2, true], [5, 1, false], [6, 1, true], [7, 0, false]];
  for (const [dy, r, cut] of crown)
    for (let dx = -r; dx <= r; dx++)
      for (let dz = -r; dz <= r; dz++) {
        if (cut && Math.abs(dx) === r && Math.abs(dz) === r) continue;
        w(x + dx, y + dy, z + dz, ["birch_leaves", { persistent: "true" }], { kind: "leaves" });
      }
  return out;
}
