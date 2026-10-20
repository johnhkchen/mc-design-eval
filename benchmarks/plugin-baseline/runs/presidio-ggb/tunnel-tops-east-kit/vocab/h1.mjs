// Helpers from plan.md VOCABULARY: groundColumn, walkPaving, amphitheatreRing, stationShell, playLog, cypress, bench,
// lampPost. Each takes the grid first, then its position (and facing where it has one). Each writes only its own
// footprint, and only into air: a filled cell is refused, not overwritten, and the call returns { placed, refused }
// with refused as [x, y, z, block] for every cell it left alone. A surface helper laid over ground an earlier part put
// there (walkPaving, amphitheatreRing, stationShell's floor) takes { over: true }: it may then replace a ground-surface
// block at its own y, and never a cell below it.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const out = () => ({ placed: 0, refused: [] });
const GROUND = new Set(["grass_block", "dirt", "coarse_dirt", "rooted_dirt", "podzol", "gravel", "clay", "stone",
  "smooth_stone", "smooth_sandstone", "stone_bricks"].map((n) => `minecraft:${n}`));
const LEAF = { persistent: "true", distance: "1", waterlogged: "false" };
const span = (a, b) => [Math.min(a, b), Math.max(a, b)];

// one cell: air, or (over) a ground-surface block; anything else is recorded as refused
function place(g, res, [x, y, z], block, state, over = false) {
  const here = g.inBounds(x, y, z) ? g.blockAt(x, y, z) : null;
  if (here && (g.isAir(x, y, z) || (over && GROUND.has(here)))) {
    g.set(x, y, z, block, state);
    res.placed++;
  } else res.refused.push([x, y, z, block]);
}

/**
 * Ground column at (x, z) up to map height H: stone at y1, dirt y2..H-1, the surface block at y H. H = 1 puts the
 * surface at y1 itself. surface: grass_block on lawns and beds, a path or paving block on the W and path cells.
 */
export function groundColumn(g, x, z, H, surface = "grass_block") {
  if (!Number.isInteger(H) || H < 1) throw new Error(`groundColumn: H must be an integer >= 1, got ${H}`);
  const res = out();
  if (H > 1) place(g, res, [x, 1, z], "stone");
  for (let y = 2; y < H; y++) place(g, res, [x, y, z], "dirt");
  place(g, res, [x, H, z], surface);
  return res;
}

/**
 * Walk paving on the rect [x0, z0, x1, z1] at surface y: smooth_stone, with a light_gray_concrete row every 6 (the rows
 * where z is a multiple of 6, so neighbouring boxes line up).
 */
export function walkPaving(g, [x0, z0, x1, z1], y, { over = false } = {}) {
  const res = out();
  const [xa, xb] = span(x0, x1), [za, zb] = span(z0, z1);
  for (let x = xa; x <= xb; x++)
    for (let z = za; z <= zb; z++)
      place(g, res, [x, y, z], z % 6 === 0 ? "light_gray_concrete" : "smooth_stone", undefined, over);
  return res;
}

/**
 * Sunken amphitheatre centred on (cx, cz), floor at y (4 on the plan). Floor stone_bricks for r < 3.5 with a lit
 * campfire at the centre (hay_block under it, a ring of stone_brick_slab round it at y+1). Seat rings 3.5-5, 5-6.5 and
 * 6.5-8 step up to y+1, y+2, y+3: white_terracotta riser, smooth_sandstone tread, and a birch_slab seat on the outer
 * cell of each ring. Rim path of smooth_sandstone at y+3 for 8 <= r < 10.
 */
export function amphitheatreRing(g, cx, cz, y = 4, { over = false } = {}) {
  const res = out();
  const put = (pos, block, state) => place(g, res, pos, block, state, over);
  for (let dx = -10; dx <= 10; dx++)
    for (let dz = -10; dz <= 10; dz++) {
      const r = Math.hypot(dx, dz), x = cx + dx, z = cz + dz;
      if (r < 3.5) put([x, y, z], dx === 0 && dz === 0 ? "hay_block" : "stone_bricks");
      else if (r < 8) {
        const b = r < 5 ? 1 : r < 6.5 ? 2 : 3;               // ring number: its tread is at y + b
        const hi = [5, 6.5, 8][b - 1];
        put([x, y + b - 1, z], "white_terracotta");
        put([x, y + b, z], "smooth_sandstone");
        if (r >= hi - 1) put([x, y + b + 1, z], ...B.slab("birch", "bottom"));
      } else if (r < 10) put([x, y + 3, z], "smooth_sandstone");
    }
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (dx || dz) put([cx + dx, y + 1, cz + dz], ...B.slab("stone_brick", "bottom"));
  put([cx, y + 1, cz], "campfire", { lit: "true", signal_fire: "true", waterlogged: "false" });
  return res;
}

/**
 * Field Station shell, footprint x0..x0+10 by z0..z0+9, floor at y0 (3 on the plan), walls y0+1..y0+5 (head band at
 * y0+5). Stripped dark oak posts, glass and dark oak planks as plan.md's FACADES; the double north door (x0+5, x0+6)
 * and the single south door (x0+2) write both halves, facing outward. The roof is stationRoof's, not this helper's.
 */
export function stationShell(g, x0, y0, z0, { over = false } = {}) {
  const res = out();
  const put = (x, y, z, block, state) => place(g, res, [x, y, z], block, state, over);
  const X1 = x0 + 10, Z1 = z0 + 9, top = y0 + 5;
  for (let x = x0; x <= X1; x++) for (let z = z0; z <= Z1; z++) put(x, y0, z, "polished_andesite");
  for (let x = x0; x <= X1; x++)                                 // north face, corners included
    for (let y = y0 + 1; y <= top; y++) {
      const dx = x - x0, h = y - y0;
      if ([0, 3, 7, 10].includes(dx)) put(x, y, z0, ...B.log("stripped_dark_oak", "y"));
      else if (y === top) put(x, y, z0, "dark_oak_planks");
      else if (dx === 5 || dx === 6) {
        if (h <= 2) put(x, y, z0, ...B.door("dark_oak", "north", h === 1 ? "lower" : "upper", dx === 5 ? "left" : "right"));
        else put(x, y, z0, "glass");
      } else put(x, y, z0, "glass");
    }
  for (let z = z0 + 1; z < Z1; z++)                              // east face, corners already placed
    for (let y = y0 + 1; y <= top; y++) {
      if (z - z0 === 4) put(X1, y, z, ...B.log("stripped_dark_oak", "y"));
      else put(X1, y, z, y === top ? "dark_oak_planks" : "glass");
    }
  for (let z = z0 + 1; z < Z1; z++)                              // west face: cladding, one window
    for (let y = y0 + 1; y <= top; y++) {
      const dz = z - z0, h = y - y0;
      put(x0, y, z, h >= 2 && h <= 3 && dz >= 4 && dz <= 6 ? "glass" : "dark_oak_planks");
    }
  for (let x = x0; x <= X1; x++)                                 // south face, corners included
    for (let y = y0 + 1; y <= top; y++) {
      const dx = x - x0, h = y - y0;
      if (dx === 10) put(x, y, Z1, ...B.log("stripped_dark_oak", "y"));
      else if (y === top) put(x, y, Z1, "dark_oak_planks");
      else if (dx === 2) {
        if (h <= 2) put(x, y, Z1, ...B.door("dark_oak", "south", h === 1 ? "lower" : "upper", "left"));
        else put(x, y, Z1, "dark_oak_planks");
      } else if (dx >= 5 && dx <= 8 && h >= 3) put(x, y, Z1, "glass");
      else put(x, y, Z1, "dark_oak_planks");
    }
  return res;
}

/**
 * A play log lying at y (4 on the plan) on gravel: stripped_spruce_log, len 3-5, from (x, z) along axis x or z.
 */
export function playLog(g, x, z, len, axis, y = 4) {
  if (axis !== "x" && axis !== "z") throw new Error(`playLog: axis must be x or z, got ${axis}`);
  if (!Number.isInteger(len) || len < 3 || len > 5) throw new Error(`playLog: len must be 3..5, got ${len}`);
  const res = out();
  for (let i = 0; i < len; i++)
    place(g, res, axis === "x" ? [x + i, y, z] : [x, y, z + i], "stripped_spruce_log", { axis });
  return res;
}

/**
 * Monterey cypress at (x, z), the trunk standing at y (the first cell above the ground): dark_oak_log, trunk 2 or 3
 * high; a flat three-layer crown 9 / 11 / 9 wide of dark_oak_leaves and spruce_leaves (2:1), each layer leaning
 * north-east by one cell per layer. Leaves are persistent.
 */
export function cypress(g, x, y, z, { trunk = 3 } = {}) {
  if (trunk !== 2 && trunk !== 3) throw new Error(`cypress: trunk must be 2 or 3, got ${trunk}`);
  const res = out();
  for (let i = 0; i < trunk; i++) place(g, res, [x, y + i, z], ...B.log("dark_oak", "y"));
  [4, 5, 4].forEach((rad, L) => {
    const cx = x + Math.round(L / 2), cz = z - Math.round(L / 2);
    for (let dx = -rad; dx <= rad; dx++)
      for (let dz = -rad; dz <= rad; dz++) {
        if (Math.hypot(dx, dz) > rad + 0.5) continue;
        const leaf = (dx + dz) % 3 === 0 ? "spruce_leaves" : "dark_oak_leaves";
        place(g, res, [cx + dx, y + trunk + L, cz + dz], leaf, LEAF);
      }
  });
  return res;
}

/**
 * Bench on the row from (x, y, z) along +x, len 3-5: birch_slab (bottom) at each end, birch_stairs (bottom) between,
 * all facing `facing` (south by default, so the seat opens north). Nothing is placed above the seat row, so the 2-high
 * lane past it stays clear.
 */
export function bench(g, x, y, z, len, facing = "south") {
  if (facing !== "north" && facing !== "south") throw new Error(`bench: facing must be north or south, got ${facing}`);
  if (!Number.isInteger(len) || len < 3 || len > 5) throw new Error(`bench: len must be 3..5, got ${len}`);
  const res = out();
  for (let i = 0; i < len; i++) {
    const pos = [x + i, y, z];
    if (i === 0 || i === len - 1) place(g, res, pos, ...B.slab("birch", "bottom"));
    else place(g, res, pos, ...B.stairs("birch", facing, "bottom"));
  }
  return res;
}

/**
 * Lamp post at (x, y, z), y the first cell above the ground: three polished_blackstone_wall posts at y..y+2 and a
 * standing lantern on top at y+3.
 */
export function lampPost(g, x, y, z) {
  const res = out();
  for (let i = 0; i < 3; i++)
    place(g, res, [x, y + i, z], "polished_blackstone_wall", { up: "true", north: "none", east: "none", south: "none", west: "none", waterlogged: "false" });
  place(g, res, [x, y + 3, z], ...B.lantern(false));
  return res;
}
