// MoPOP vocabulary, part h2 (plan.md VOCABULARY): fold, softEdge, bridgeLobe, tPylon, curtainWall, glassBand, plaza,
// bed, lampPost. Each takes its position as arguments and returns the cells it wrote. A helper writes only inside the
// footprint it was given, and into air only, except where its doc says otherwise: fold cuts its own groove,
// glassBand({ into: "shell" }) cuts a window, plaza and bed lay the ground layer y0 they own. Nothing writes into the
// monorail corridor (x43..51, y8..17) except tPylon's cap. Block ids are plan.md PALETTE literals.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const CORRIDOR = [43, 51, 8, 17];   // x0, x1, y0, y1 of the train corridor (plan.md RESERVED)

// A placement context: writes only inside `box`, only into air unless { over }, never into the corridor unless monorail.
function ctxOf(g, box, { monorail = false } = {}) {
  const out = [];
  const put = (x, y, z, entry, { over = false } = {}) => {
    const inside = x >= box[0] && x <= box[3] && y >= box[1] && y <= box[4] && z >= box[2] && z <= box[5];
    const corridor = !monorail && x >= CORRIDOR[0] && x <= CORRIDOR[1] && y >= CORRIDOR[2] && y <= CORRIDOR[3];
    if (!inside || corridor || (!over && !g.isAir(x, y, z))) return false;
    g.set(x, y, z, ...entry);
    out.push([x, y, z]);
    return true;
  };
  return { put, out };
}

// stairs from a plan id (polished_diorite_stairs), facing = the side of the full-height back
const stair = (id, facing, half = "bottom") => B.stairs(id.replace(/_stairs$/, ""), facing, half);

const DIRS = { north: [0, 0, -1], south: [0, 0, 1], east: [1, 0, 0], west: [-1, 0, 0] };
const facingOf = (v) => Object.keys(DIRS).find((k) => DIRS[k].every((c, i) => c === v[i]));
const neg = (v) => v.map((c) => -c);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// the unit axis vector along the largest component of v (zero stays zero)
function axisOf(v) {
  const i = v.reduce((best, c, j) => (Math.abs(c) > Math.abs(v[best]) ? j : best), 0);
  return v.map((c, j) => (j === i ? Math.sign(c) : 0));
}

/**
 * fold(g, shell, { from, to, width = 2, depth = 2, shadow, outward }): a groove across a shell's outer surface, from
 * cell `from` to `to`, cut by the shell's own part as it is built. shell = the billowShell options (center, stairs).
 * The groove is `width` wide and `depth` deep into the shell; stairs line both lips; the floor behind the groove gets
 * `shadow` where it is air. outward = the surface's outward normal [dx,dy,dz] (default: horizontal, away from
 * shell.center). Writes only the groove, its two lips and its floor. Returns the cells written.
 */
export function fold(g, shell, { from, to, width = 2, depth = 2, shadow = null, outward = null } = {}) {
  const d = to.map((c, i) => c - from[i]);
  const n = Math.max(...d.map(Math.abs));
  if (!n) throw new Error("fold: from and to are the same cell");
  const mid = from.map((c, i) => c + d[i] / 2);
  const out = axisOf(outward ?? [mid[0] + 0.5 - shell.center[0], 0, mid[2] + 0.5 - shell.center[1]]);
  const lat = axisOf(cross(axisOf(d), out));          // across the groove, along the surface
  if (!lat.some(Boolean)) throw new Error("fold: the line runs along the outward normal");

  const at = (p, w, k) => p.map((c, i) => c + w * lat[i] - k * out[i]);   // k goes inward (-out)
  const samples = [];
  for (let i = 0; i <= n; i++) samples.push(from.map((c, j) => Math.round(c + (i / n) * d[j])));
  const groove = new Map(), lips = new Map(), floor = new Map();
  for (const p of samples) {
    for (let w = 0; w < width; w++) for (let k = 0; k < depth; k++) groove.set(at(p, w, k).join(), at(p, w, k));
    for (const w of [-1, width]) lips.set(at(p, w, 0).join(), { c: at(p, w, 0), w });
    for (let w = 0; w < width; w++) floor.set(at(p, w, depth).join(), at(p, w, depth));
  }
  const all = [...groove.values(), ...[...lips.values()].map((l) => l.c), ...floor.values()];
  const box = [0, 1, 2].map((i) => Math.min(...all.map((c) => c[i]))).concat([0, 1, 2].map((i) => Math.max(...all.map((c) => c[i]))));
  const ctx = ctxOf(g, box);

  for (const c of groove.values()) ctx.put(...c, ["minecraft:air"], { over: true });
  for (const { c, w } of lips.values()) {
    // a horizontal groove: each lip steps down into it. A vertical one: lips face into the shell, the upper lip hangs.
    const facing = lat[1] === 0 ? facingOf(w < 0 ? lat : neg(lat)) : facingOf(neg(out));
    const half = lat[1] === 0 ? "bottom" : ((w >= width) === (lat[1] > 0) ? "top" : "bottom");
    ctx.put(...c, stair(shell.stairs, facing, half), { over: true });
  }
  if (shadow) for (const c of floor.values()) ctx.put(...c, [shadow]);
  return ctx.out;
}

/**
 * softEdge(g, { cells, stairs }): upside-down stairs along an overhang's underside edge. cells = [[x, y, z, facing]],
 * facing = the side the stair's full back faces (into the wall it hangs from). stairs = a stairs block id. Air only.
 */
export function softEdge(g, { cells, stairs }) {
  const box = [0, 1, 2].map((i) => Math.min(...cells.map((c) => c[i]))).concat([0, 1, 2].map((i) => Math.max(...cells.map((c) => c[i]))));
  const ctx = ctxOf(g, box);
  for (const [x, y, z, facing] of cells) ctx.put(x, y, z, stair(stairs, facing, "top"));
  return ctx.out;
}

/**
 * bridgeLobe(g, { cx, cz, rx, rz, body, curve, glass }): the blue lobe over the monorail, a thin skin on an ellipse
 * (footprint x33..59, y12..32, z66..90). Soffit flat at y18 over x41..53, curving down (upside-down stairs) to y12 at
 * x33 and x59; a roof at y31..32; walls at the rim; the gallery between (y19..30) stays air. glass = [x0, z0, x1, z1],
 * the soffit glass strip over the train. Air only.
 */
export function bridgeLobe(g, { cx = 46, cz = 78, rx = 13, rz = 12, body = "light_blue_concrete", curve = "smooth_quartz_stairs", glass = [44, 70, 50, 87] } = {}) {
  const ctx = ctxOf(g, [33, 12, 66, 59, 32, 90]);
  const inside = (x, z) => ((x + 0.5 - cx) / rx) ** 2 + ((z + 0.5 - cz) / rz) ** 2 <= 1;
  const underside = (x) => (x < 41 ? 12 + Math.round(((x - 33) / 8) * 6) : x > 53 ? 12 + Math.round(((59 - x) / 6) * 6) : 18);
  for (let x = 33; x <= 59; x++) for (let z = 66; z <= 90; z++) {
    if (!inside(x, z)) continue;
    const yu = underside(x);
    const flat = yu === 18 && x >= 41 && x <= 53;
    const rim = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inside(x + dx, z + dz));
    if (flat) {
      const inGlass = x >= glass[0] && x <= glass[2] && z >= glass[1] && z <= glass[3];
      ctx.put(x, 18, z, inGlass ? ["glass"] : [body]);
    } else {
      ctx.put(x, yu, z, stair(curve, x < 41 ? "east" : "west", "top"));
    }
    if (rim) for (let y = yu + 1; y <= 32; y++) ctx.put(x, y, z, [body]);
    for (const y of [31, 32]) ctx.put(x, y, z, [body]);
  }
  return ctx.out;
}

/**
 * tPylon(g, { x = 46, z }): a monorail T-pylon. A light_gray_concrete column x..x+1, y1..7, z..z+1, capped by
 * polished_andesite x-3..x+4 at y8 (the cap sits in the corridor: this is the one helper allowed there). Air only.
 */
export function tPylon(g, { x = 46, z } = {}) {
  if (z === undefined) throw new Error("tPylon: z is required");
  const ctx = ctxOf(g, [x - 3, 1, z, x + 4, 8, z + 1], { monorail: true });
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) for (let y = 1; y <= 7; y++) ctx.put(x + dx, y, z + dz, ["light_gray_concrete"]);
  for (let cx = x - 3; cx <= x + 4; cx++) for (let dz = 0; dz < 2; dz++) ctx.put(cx, 8, z + dz, ["polished_andesite"]);
  return ctx.out;
}

/**
 * curtainWall(g, { axis, fixed, from, to, y0 = 1, y1 = 7 }): a glass wall on a lobby edge. axis is the way the wall runs:
 * "z" puts it in the plane x = fixed from z = from to z = to; "x" puts it in z = fixed. glass_pane in every cell, a
 * polished_andesite mullion (full height) at every 4th cell counted from `from`. Air only.
 */
export function curtainWall(g, { axis, fixed, from, to, y0 = 1, y1 = 7 }) {
  if (axis !== "x" && axis !== "z") throw new Error(`curtainWall: axis must be x or z, got ${axis}`);
  const box = axis === "z" ? [fixed, y0, from, fixed, y1, to] : [from, y0, fixed, to, y1, fixed];
  const ctx = ctxOf(g, box);
  const pane = axis === "z" ? { north: "true", east: "false", south: "true", west: "false" } : { north: "false", east: "true", south: "false", west: "true" };
  for (let i = from; i <= to; i++) {
    const [x, z] = axis === "z" ? [fixed, i] : [i, fixed];
    const mullion = (i - from) % 4 === 0;
    for (let y = y0; y <= y1; y++) ctx.put(x, y, z, mullion ? ["polished_andesite"] : ["glass_pane", pane]);
  }
  return ctx.out;
}

/**
 * glassBand(g, { box, block = "glass_pane", into = "air" }): a band of glass in a face or a soffit. glass_pane joins
 * itself across the band; block "glass" is a solid pane. into: "shell" replaces the shell's own cells in the band (a
 * window cut through a wall); the default writes into air only.
 */
export function glassBand(g, { box, block = "glass_pane", into = "air" }) {
  const ctx = ctxOf(g, box);
  const inBand = (x, y, z) => x >= box[0] && x <= box[3] && y >= box[1] && y <= box[4] && z >= box[2] && z <= box[5];
  for (let x = box[0]; x <= box[3]; x++) for (let y = box[1]; y <= box[4]; y++) for (let z = box[2]; z <= box[5]; z++) {
    const entry = block === "glass_pane"
      ? ["glass_pane", { north: String(inBand(x, y, z - 1)), south: String(inBand(x, y, z + 1)), east: String(inBand(x + 1, y, z)), west: String(inBand(x - 1, y, z)) }]
      : [block];
    ctx.put(x, y, z, entry, { over: into === "shell" });
  }
  return ctx.out;
}

/**
 * plaza(g, { mask, band = 6, bandOrigin = 0, paving, bandBlock }): the ground layer y0 of the plaza cells, paved
 * polished_andesite with a light_gray_concrete line along z every `band` cells in x. mask = (x, z) => bool, or a list
 * of [x0, z0, x1, z1] rectangles. It lays the ground it owns (the cells of the mask at y0) and nothing else.
 */
export function plaza(g, { mask, band = 6, bandOrigin = 0, paving = "polished_andesite", bandBlock = "light_gray_concrete" } = {}) {
  const inMask = typeof mask === "function" ? mask : (x, z) => mask.some(([x0, z0, x1, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1);
  const [W, , D] = g.size;
  const ctx = ctxOf(g, [0, 0, 0, W - 1, 0, D - 1]);
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    if (!inMask(x, z)) continue;
    const onBand = (((x - bandOrigin) % band) + band) % band === 0;
    ctx.put(x, 0, z, [onBand ? bandBlock : paving], { over: true });
  }
  return ctx.out;
}

/**
 * bed(g, { box }): a planting bed on the ground. box = [x0, z0, x1, z1] on the y0 ground: grass_block over the ground
 * in the box, moss_block in a fixed patch pattern, and a polished_andesite_slab kerb at y1 round the edge. Writes the
 * ground layer of its own box and the kerb ring; air only above.
 */
export function bed(g, { box: [x0, z0, x1, z1] }) {
  const ctx = ctxOf(g, [x0, 0, z0, x1, 1, z1]);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    ctx.put(x, 0, z, [((x * 7 + z * 3) % 5 === 0) ? "moss_block" : "grass_block"], { over: true });
    if (x === x0 || x === x1 || z === z0 || z === z1) ctx.put(x, 1, z, B.slab("polished_andesite", "bottom"));
  }
  return ctx.out;
}

/**
 * lampPost(g, { x, z }): three andesite_wall posts at y1..3 and a standing lantern on top at y4. Air only.
 */
export function lampPost(g, { x, z } = {}) {
  const ctx = ctxOf(g, [x, 1, z, x, 4, z]);
  const post = ["andesite_wall", { up: "true", north: "none", east: "none", south: "none", west: "none", waterlogged: "false" }];
  for (let y = 1; y <= 3; y++) ctx.put(x, y, z, post);
  ctx.put(x, 4, z, B.lantern(false));
  return ctx.out;
}
