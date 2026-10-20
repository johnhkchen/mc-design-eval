// The h2 helpers of plan.md VOCABULARY: boulder, deckPost, bench, trailSign, shrub.
// Each takes its position (and facing, where it has one) as arguments and returns { placed, refused }.
// A helper writes only inside the footprint it computes from its arguments, and only into air unless { over: true }
// says otherwise, so the ground, sand and floor an earlier part laid are never written over.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = /(^|:)(cave_)?air$/;
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const STEP = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }; // [dx, dz]
const PLANTS = new Set(["azalea", "flowering_azalea", "fern", "large_fern", "short_grass", "moss_carpet"]);

const fresh = () => ({ placed: 0, refused: 0 });

// Deterministic value in [0, 1) per salt, so a rebuild gives the same blocks.
function rnd(...parts) {
  let h = 2166136261;
  for (const c of parts.join("|")) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
}

// Highest non-air y at or below `from` (default: the top of the grid); -1 when the column is empty.
function groundY(g, x, z, from) {
  for (let y = Math.min(from ?? g.size[1] - 1, g.size[1] - 1); y >= 0; y--) if (!AIR.test(g.blockAt(x, y, z))) return y;
  return -1;
}

// One write: refused outside the footprint box, and refused over a non-air cell unless over.
function put(g, box, [x, y, z], entry, over, out) {
  const [x0, y0, z0, x1, y1, z1] = box;
  const outside = x < x0 || x > x1 || y < y0 || y > y1 || z < z0 || z > z1 || !g.inBounds(x, y, z);
  if (outside || (!over && !AIR.test(g.blockAt(x, y, z)))) { out.refused++; return false; }
  g.set(x, y, z, ...entry);
  out.placed++;
  return true;
}

/**
 * A rock in box [x0, y0, z0, x1, y1, z1]: one ellipse per course, widest at a third of the height, the base two courses
 * undercut by 1, the top four courses stepped in to a dome. Base (3 courses): tuff/terracotta, moss_block on the north.
 * Body: smooth_sandstone with sandstone streaks and orange_terracotta drips. Crown (top 3): smooth_sandstone with
 * moss_carpet on the exposed top, mostly north. seam: a 2-course brown_terracotta band at mid-height. lean: the top
 * three courses shift by `lean` cells north-west (true = 2); cells that would leave the box are dropped.
 * over: replace what is there (a rock set into the terrain, its buried bottom course); default is air only.
 */
export function boulder(g, box, { lean = 0, seam = false, over = false } = {}) {
  const [x0, y0, z0, x1, y1, z1] = box;
  const H = y1 - y0 + 1, mid = Math.floor(H / 2);
  const rx = (x1 - x0 + 1) / 2, rz = (z1 - z0 + 1) / 2;
  const cx = (x0 + x1 + 1) / 2, cz = (z0 + z1 + 1) / 2;
  const shift = lean === true ? 2 : Number(lean) || 0;
  const key = box.join(",");

  const course = (k) => {
    if (k < 0 || k >= H) return null;
    const s = Math.min(1, 0.85 + 0.45 * ((k + 0.5) / H)); // full width at a third of the height
    const j = k - (H - 4); // 0..3 across the top four courses
    const inset = (k < 2 ? 1 : 0) + (j >= 0 ? j + 1 : 0);
    const ax = rx * s - inset, az = rz * s - inset;
    if (ax < 0.5 || az < 0.5) return null;
    const by = k >= H - 3 ? shift : 0;
    return { cx: cx - by, cz: cz - by, rx: ax, rz: az };
  };
  const inside = (c, x, z) => !!c && ((x + 0.5 - c.cx) / c.rx) ** 2 + ((z + 0.5 - c.cz) / c.rz) ** 2 <= 1;

  // a vertical run: the column (x, z) carries up to two runs of 2-5 cells from a hashed course, with chance p
  const run = (x, z, k, tag, p) => rnd(key, x, z, tag) < p && [0, 1].some((n) => {
    const start = Math.floor(rnd(key, x, z, tag + "s" + n) * H);
    const len = 2 + Math.floor(rnd(key, x, z, tag + "l" + n) * 4);
    return k >= start && k < start + len;
  });

  const pick = (k, c, x, y, z, exposedTop) => {
    const r = (tag) => rnd(key, x, y, z, tag);
    if (seam && (k === mid || k === mid + 1)) return B.block("brown_terracotta");
    if (k < 3) return z < c.cz - c.rz * 0.4 && r("moss") < 0.3 ? B.block("moss_block") : B.block(r("base") < 0.6 ? "tuff" : "terracotta");
    if (k >= H - 3) return exposedTop && r("cap") < (z < c.cz ? 0.5 : 0.15) ? B.block("moss_carpet") : B.block("smooth_sandstone");
    if (run(x, z, k, "drip", 0.35)) return B.block("orange_terracotta");
    if (run(x, z, k, "streak", 0.6)) return B.block("sandstone");
    return B.block("smooth_sandstone");
  };

  const out = fresh();
  for (let k = 0; k < H; k++) {
    const c = course(k), above = course(k + 1);
    if (!c) continue;
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      if (!inside(c, x, z)) continue;
      const y = y0 + k;
      put(g, box, [x, y, z], pick(k, c, x, y, z, !inside(above, x, z)), over, out);
    }
  }
  return out;
}

/**
 * A deck post at (x, z): a 3x3 stone_bricks footing whose centre sits on the ground (each column fills from its own
 * ground up to the pad), a dark_oak_log post on the pad up to y `top` (required), and with `brace` (north|south|east|
 * west) a dark_oak_stairs knee brace at y `top` on that side, its back against the post. The ground is the top solid
 * block at or below `from` (default: the grid top).
 */
export function deckPost(g, x, z, { top, brace, from } = {}) {
  if (top == null) throw new Error("deckPost: top (the post's top y) is required");
  if (brace && !STEP[brace]) throw new Error(`deckPost: brace must be north, south, east or west (got ${brace})`);
  const out = fresh();
  const gy = groundY(g, x, z, from);
  if (gy < 0) return { ...out, refused: 1 };
  const cols = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) cols.push([x + dx, z + dz, groundY(g, x + dx, z + dz, from)]);
  const low = Math.min(...cols.map(([, , cy]) => cy)) + 1;
  const box = [x - 1, low, z - 1, x + 1, top, z + 1];
  for (const [cx, cz, cy] of cols) for (let y = cy + 1; y <= gy + 1; y++) put(g, box, [cx, y, cz], B.block("stone_bricks"), false, out);
  for (let y = gy + 2; y <= top; y++) put(g, box, [x, y, z], B.log("dark_oak", "y"), false, out);
  if (brace) {
    const [dx, dz] = STEP[brace];
    put(g, box, [x + dx, top, z + dz], B.stairs("dark_oak", OPP[brace], "top"), false, out);
  }
  return out;
}

/**
 * A three-cell spruce bench on row z, x0..x0+2, at height y. The seat faces `face` (north or south); the back is on the
 * opposite side, so the stairs' facing (their tall back) is OPP[face]. Open trapdoor arms stand at both ends on the back
 * side. Nothing is written above y, so the 2-high lane in front of the seat stays clear.
 */
export function bench(g, x0, y, z, face) {
  if (face !== "north" && face !== "south") throw new Error(`bench: face must be north or south (got ${face})`);
  const back = OPP[face], dz = STEP[back][1];
  const box = [x0, y, Math.min(z, z + dz), x0 + 2, y, Math.max(z, z + dz)];
  const out = fresh();
  for (let i = 0; i < 3; i++) put(g, box, [x0 + i, y, z], B.stairs("spruce", back, "bottom"), false, out);
  for (const ax of [x0, x0 + 2]) put(g, box, [ax, y, z + dz], B.trapdoor("spruce", face, "bottom", true), false, out);
  return out;
}

/**
 * A trail sign at (x, z): a stone_bricks base on the ground, a spruce_fence post above it, and a standing spruce_sign
 * (rotation 4, to read from the north-west) on top: y ground+1 to ground+3. The ground is found as in deckPost.
 */
export function trailSign(g, x, z, { from } = {}) {
  const out = fresh();
  const gy = groundY(g, x, z, from);
  if (gy < 0) return { ...out, refused: 1 };
  const box = [x, gy + 1, z, x, gy + 3, z];
  const sign = B.sign("spruce", ["SIX GIANT ROCKS", "VIEWPOINT"], { wall: false, rotation: 4, dataVersion: g.dataVersion });
  put(g, box, [x, gy + 1, z], B.block("stone_bricks"), false, out);
  put(g, box, [x, gy + 2, z], B.fence("spruce"), false, out);
  put(g, box, [x, gy + 3, z], sign, false, out);
  return out;
}

/**
 * A planting at (x, z) on the ground found as in deckPost, never above ground + 2:
 * azalea | flowering_azalea: one bush, on grass_block or moss_block only;
 * fern | short_grass: a clump (the centre and about half of its eight neighbours);
 * large_fern: a 2-high double plant (lower and upper halves, both written or neither);
 * moss_carpet: one carpet.
 */
export function shrub(g, x, z, kind, { from } = {}) {
  if (!PLANTS.has(kind)) throw new Error(`shrub: unknown kind ${kind} (one of ${[...PLANTS].join(", ")})`);
  const out = fresh();
  const cells = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const gy = groundY(g, x + dx, z + dz, from);
    if (gy >= 0) cells.push({ x: x + dx, z: z + dz, gy, centre: dx === 0 && dz === 0 });
  }
  const here = cells.find((c) => c.centre);
  if (!here) return { ...out, refused: 1 };
  const lows = cells.map((c) => c.gy), box = [x - 1, Math.min(...lows) + 1, z - 1, x + 1, Math.max(...lows) + 2, z + 1];

  if (kind === "azalea" || kind === "flowering_azalea") {
    const ground = g.blockAt(here.x, here.gy, here.z).replace("minecraft:", "");
    if (ground === "grass_block" || ground === "moss_block") put(g, box, [x, here.gy + 1, z], B.block(kind), false, out);
    else out.refused++;
  } else if (kind === "fern" || kind === "short_grass") {
    for (const c of cells) if (c.centre || rnd(box.join(), c.x, c.z, "clump") < 0.5) put(g, box, [c.x, c.gy + 1, c.z], B.block(kind), false, out);
  } else if (kind === "large_fern") {
    const y = here.gy + 1;
    if (AIR.test(g.blockAt(x, y, z)) && AIR.test(g.blockAt(x, y + 1, z))) {
      put(g, box, [x, y, z], ["large_fern", { half: "lower" }], false, out);
      put(g, box, [x, y + 1, z], ["large_fern", { half: "upper" }], false, out);
    } else out.refused++;
  } else {
    put(g, box, [x, here.gy + 1, z], B.block("moss_carpet"), false, out);
  }
  return out;
}
