// Vocabulary, part 1 (h1): arcadeBay, shopDoor, cornice, slit, clockFace, naveRoofProfile, lunette.
// Positions and facings are arguments. Each helper writes only its own footprint and only into air: if any cell
// of its footprint is solid, nothing is written and that cell comes back in `refused`. Pass { over: true } to
// replace solid cells inside the footprint (cutting an opening through a built wall, recolouring a dial face).
// Stairs follow toolkit.md: facing = the side of the full-height back.
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = new Set(["minecraft:air", "minecraft:cave_air", "minecraft:void_air"]);

/** Plan cells keyed by position (last write wins): put(x, y, z, block, state?, nbt?). */
function plan() {
  const cells = new Map();
  return { put: (...c) => cells.set(`${c[0]},${c[1]},${c[2]}`, c), list: () => [...cells.values()] };
}

/** Commit cells into the inclusive box [x0, y0, z0, x1, y1, z1]; all or nothing. */
function commit(g, box, cells, { over = false } = {}) {
  for (const [x, y, z] of cells) {
    const inside = x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];
    if (!inside || y < 1) throw new Error(`footprint: ${x},${y},${z} outside ${box} or on the ground`);
  }
  const refused = over ? [] : cells.filter(([x, y, z]) => !AIR.has(g.blockAt(x, y, z)))
    .map(([x, y, z]) => [x, y, z, g.blockAt(x, y, z)]);
  if (refused.length) return { placed: 0, refused };
  for (const [x, y, z, block, state, nbt] of cells) g.set(x, y, z, block, state, nbt);
  return { placed: cells.length, refused: [] };
}

/** Arch-bay of an arcade: 8 wide at piers x0..x0+7, front wall at plane z (default 3, the land front). */
export function arcadeBay(g, x0, { z = 3, over = false } = {}) {
  const p = plan(), x1 = x0 + 7;
  for (let y = 1; y <= 25; y++) for (const zz of [z, z + 1]) for (let x = x0; x <= x1; x++) p.put(x, y, zz, "calcite");
  for (let y = 1; y <= 25; y++) for (const x of [x0, x1]) p.put(x, y, z - 1, "smooth_quartz");
  // opening: 6 wide y1..7, 4 wide y8..9, 2 wide y10
  const span = (y) => (y <= 7 ? [x0 + 1, x0 + 6] : y <= 9 ? [x0 + 2, x0 + 5] : [x0 + 3, x0 + 4]);
  for (let y = 1; y <= 10; y++) {
    const [a, b] = span(y);
    for (const zz of [z, z + 1]) for (let x = a; x <= b; x++) p.put(x, y, zz, "air");
  }
  // upside-down voussoir ring, each stair's back into the wall; keystone over the 2-wide top
  const ring = [[x0 + 1, 8, "west"], [x0 + 1, 9, "west"], [x0 + 6, 8, "east"], [x0 + 6, 9, "east"],
    [x0 + 2, 10, "west"], [x0 + 5, 10, "east"], [x0 + 2, 11, "west"], [x0 + 5, 11, "east"]];
  for (const [x, y, facing] of ring) for (const zz of [z, z + 1]) p.put(x, y, zz, ...B.stairs("smooth_quartz", facing, "top"));
  for (const x of [x0 + 3, x0 + 4]) for (const zz of [z, z + 1]) p.put(x, 11, zz, "quartz_bricks");
  return commit(g, [x0, 1, z - 1, x1, 25, z + 1], p.list(), { over });
}

/** Shop door in an inner wall at (x, z): dark_oak_door both halves facing north, a gray pane either side. */
export function shopDoor(g, x, z, { over = false } = {}) {
  const p = plan();
  p.put(x, 1, z, ...B.door("dark_oak", "north", "lower", "left"));
  p.put(x, 2, z, ...B.door("dark_oak", "north", "upper", "left"));
  for (const y of [1, 2]) {
    p.put(x - 1, y, z, "gray_stained_glass_pane", { north: "false", south: "false", east: "false", west: "true" });
    p.put(x + 1, y, z, "gray_stained_glass_pane", { north: "false", south: "false", east: "true", west: "false" });
  }
  return commit(g, [x - 1, 1, z, x + 1, 2, z], p.list(), { over });
}

/**
 * Cornice course: smooth_quartz at y with upside-down quartz_stairs above, lip toward `face`.
 * north/south: the course runs along x from x0 to x1 at line z. east/west: it runs along z from x0 to x1 (read as
 * z) at line x = z.
 */
export function cornice(g, { x0, x1, y, z, face }, { over = false } = {}) {
  if (!DIRS[face]) throw new Error(`cornice: face must be north, south, east or west (got ${face})`);
  const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
  const along = face === "north" || face === "south";
  const at = (u, dy) => (along ? [u, y + dy, z] : [z, y + dy, u]);
  const p = plan();
  for (let u = lo; u <= hi; u++) {
    p.put(...at(u, 0), "smooth_quartz");
    p.put(...at(u, 1), ...B.stairs("quartz", OPPOSITE[face], "top"));
  }
  const box = along ? [lo, y, z, hi, y + 1, z] : [z, y, lo, z, y + 1, hi];
  return commit(g, box, p.list(), { over });
}

/**
 * Narrow window slit: column x (x for a north/south face, z for an east/west face) from y0 to y1, in the wall whose
 * outer face is plane `at` (z or x). The face cell is open air; a 1-wide gray pane sits recessed 1 block inside.
 */
export function slit(g, x, y0, y1, face, { at, over = false } = {}) {
  if (!DIRS[face] || at === undefined) throw new Error("slit: needs a face and the wall plane as { at }");
  const inward = DIRS[OPPOSITE[face]];
  const along = face === "north" || face === "south";
  const cell = (y, d) => (along ? [x, y, at + d * inward[2]] : [at + d * inward[0], y, x]);
  const pane = along ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  const p = plan();
  for (let y = y0; y <= y1; y++) {
    p.put(...cell(y, 0), "air");
    p.put(...cell(y, 1), "gray_stained_glass_pane", pane);
  }
  const pts = [cell(y0, 0), cell(y0, 1), cell(y1, 0), cell(y1, 1)];
  const span = (i) => [Math.min(...pts.map((q) => q[i])), Math.max(...pts.map((q) => q[i]))];
  const [x0, x1] = span(0), [z0, z1] = span(2);
  return commit(g, [x0, y0, z0, x1, y1, z1], p.list(), { over });
}

/**
 * Clock dial centred at `center` on its wall plane (white dial, black hands and bezel, 10:10 by default), with a
 * 3x3 glowstone panel one block behind it. radius is clamped to 2..4 as the library clock() does.
 */
export function clockFace(g, { center, face, radius = 4, time = "10:10" }, { over = false } = {}) {
  if (!DIRS[face]) throw new Error(`clockFace: face must be north, south, east or west (got ${face})`);
  const [cx, cy, cz] = center, inward = DIRS[OPPOSITE[face]];
  const r = Math.max(2, Math.min(4, Math.round(radius))), R = r + 1;
  const along = face === "north" || face === "south";
  const p = plan();
  for (const c of B.clock({ center, face, radius: r, time, dial: "white_concrete", bezel: "black_concrete", hands: "black_concrete" })) p.put(...c);
  for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) {
    p.put(along ? cx + u : cx + inward[0], cy + v, along ? cz + inward[2] : cz + u, "glowstone");
  }
  const box = along
    ? [cx - R, cy - R, Math.min(cz, cz + inward[2]), cx + R, cy + R, Math.max(cz, cz + inward[2])]
    : [Math.min(cx, cx + inward[0]), cy - R, cz - R, Math.max(cx, cx + inward[0]), cy + R, cz + R];
  return commit(g, box, p.list(), { over });
}

/**
 * Nave roof slope on x0..x1 (plan.md: eaves y27, monitor walls at y36). Along z 15..33 the slope rises 1 per 2
 * cells to the south; the mirror half z 45..63 rises north. Each 2-cell course is a stair (bottom half, back to the
 * rise) then a top slab on the same base, so the surface climbs a half block per cell.
 */
export function naveRoofProfile(g, x0, x1, { over = false } = {}) {
  const p = plan(), lo = Math.min(x0, x1), hi = Math.max(x0, x1);
  for (let x = lo; x <= hi; x++) {
    for (let i = 0; i <= 18; i++) {
      const base = 27 + Math.floor(i / 2);
      for (const [z, facing] of [[15 + i, "south"], [63 - i, "north"]]) {
        if (i % 2 === 0) p.put(x, base, z, ...B.stairs("deepslate_tile", facing, "bottom"));
        else p.put(x, base, z, ...B.slab("deepslate_tile", "top"));
      }
    }
  }
  return commit(g, [lo, 27, 15, hi, 36, 63], p.list(), { over });
}

/**
 * Round-headed window of width w (odd) centred on cx, sill y0, h rows high, in the wall plane z (the opening runs
 * along x) or x (it runs along z). The last `head` rows are the round head, each row inset one more block (the
 * plan's great lunettes: w 13, h 23, head 4). Glass is gray panes, polished_deepslate mullion down the centre and
 * a transom across the spring line (the top body row). Defaults: h = w + 2, head = half-width.
 */
export function lunette(g, { cx, y0, w, h = w + 2, head = (w - 1) / 2, z, x }, { over = false } = {}) {
  if (w % 2 !== 1) throw new Error("lunette: width must be odd so there is a centre column");
  const r = (w - 1) / 2;
  if (head > r || head >= h) throw new Error("lunette: head must fit inside the half-width and the height");
  const alongX = z !== undefined;
  if (alongX === (x !== undefined)) throw new Error("lunette: give exactly one of z (wall plane z) or x (wall plane x)");
  const plane = alongX ? z : x;
  const xyz = (u, y) => (alongX ? [cx + u, y, plane] : [plane, y, cx + u]);
  const spring = h - head - 1;
  const pane = alongX ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  const p = plan();
  for (let k = 0; k < h; k++) {
    const j = k - (h - head);  // 0 at the first head row
    const half = j < 0 ? r : r - 1 - j;
    for (let u = -half; u <= half; u++) {
      if (u === 0 || k === spring) p.put(...xyz(u, y0 + k), "polished_deepslate");
      else p.put(...xyz(u, y0 + k), "gray_stained_glass_pane", pane);
    }
  }
  const box = alongX ? [cx - r, y0, plane, cx + r, y0 + h - 1, plane] : [plane, y0, cx - r, plane, y0 + h - 1, cx + r];
  return commit(g, box, p.list(), { over });
}
