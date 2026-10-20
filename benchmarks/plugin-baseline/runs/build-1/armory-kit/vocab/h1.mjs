// Vocabulary helpers, batch 1 (plan.md VOCABULARY). Each takes the grid first, then one options object holding its
// position (and face, where it has one). Blocks are the literal ids from plan.md PALETTE (1.21.1).
//
// Every write goes through scope(): a cell is written only inside the helper's footprint and only into air, so
// an earlier part's ground, floor and walls are never touched. Refused writes are listed in the returned report,
// never thrown. Nothing writes at y0 (the ground), and every helper returns { placed, refused }.
import { DIRS, bannerWord } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const LANTERN_HANGING = { hanging: "true", waterlogged: "false" };
const LEAVES = { persistent: "true", distance: "1", waterlogged: "false" };
// Glass runs east-west along a wall, so it connects E/W and not N/S.
const PANE_RUN = { north: "false", east: "true", south: "false", west: "true" };

/**
 * The write gate for one helper. box = [x0, y0, z0, x1, y1, z1], inclusive, any corner order. A set() lands only
 * when the cell is inside the box and is air (or over is true). holes(x, y, z) marks cells that stay air on purpose
 * (openings, RESERVED cells): skipped, not counted as refused. Everything else is refused and listed.
 */
function scope(g, box, { over = false, holes = null } = {}) {
  const lo = box.slice(0, 3).map((v, i) => Math.min(v, box[i + 3]));
  const hi = box.slice(0, 3).map((v, i) => Math.max(v, box[i + 3]));
  const refused = [];
  let placed = 0;
  const inside = (x, y, z) => x >= lo[0] && x <= hi[0] && y >= lo[1] && y <= hi[1] && z >= lo[2] && z <= hi[2];
  const w = new Proxy(g, {
    get(t, prop) {
      if (prop === "set") return (x, y, z, block, state, nbt) => {
        if (holes?.(x, y, z)) return w;
        if (!inside(x, y, z) || (!over && !t.isAir(x, y, z))) refused.push([x, y, z, block]);
        else { placed++; t.set(x, y, z, block, state, nbt); }
        return w;
      };
      if (prop === "report") return () => ({ placed, refused });
      const v = Reflect.get(t, prop);
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
  return w;
}

/** The two outer rows of a face (2 thick): { x, z, i (index along the run), outer }. */
function faceCells(face, { x0, z0, x1, z1 }) {
  const cells = [];
  if (face === "north" || face === "south") {
    const row = face === "north" ? z0 : z1, inner = face === "north" ? z0 + 1 : z1 - 1;
    for (let x = x0; x <= x1; x++) for (const z of [row, inner]) cells.push({ x, z, i: x - x0, outer: z === row });
  } else if (face === "east" || face === "west") {
    const col = face === "east" ? x1 : x0, inner = face === "east" ? x1 - 1 : x0 + 1;
    for (let z = z0; z <= z1; z++) for (const x of [col, inner]) cells.push({ x, z, i: z - z0, outer: x === col });
  } else throw new Error(`face must be north|south|east|west, got ${face}`);
  return cells;
}

/** Column box [x0, y0, z0, x1, y1, z1] around a set of cells, between heights y0..y1. */
const boxOf = (cells, y0, y1) => [
  Math.min(...cells.map((c) => c.x)), y0, Math.min(...cells.map((c) => c.z)),
  Math.max(...cells.map((c) => c.x)), y1, Math.max(...cells.map((c) => c.z)),
];

/**
 * One storey band of a face: polished_andesite plinth at y1, smooth_sandstone body, brown_terracotta courses at
 * y8, 15, 22, 27, parapet y29-30 and a bottom coping slab at y31. Cut openings with holes(x, y, z).
 */
export function bandedStorey(g, { x0, z0, x1, z1, face, y0 = 0, holes = null, over = false }) {
  const cells = faceCells(face, { x0, z0, x1, z1 });
  const w = scope(g, boxOf(cells, y0 + 1, y0 + 31), { over, holes });
  const courses = [8, 15, 22, 27];
  for (const { x, z } of cells) {
    w.set(x, y0 + 1, z, "polished_andesite");
    for (let dy = 2; dy <= 30; dy++) w.set(x, y0 + dy, z, courses.includes(dy) ? "brown_terracotta" : "smooth_sandstone");
    w.set(x, y0 + 31, z, "smooth_sandstone_slab", SLAB_BOTTOM);
  }
  return w.report();
}

/**
 * One 7-wide bay of the south curtain wall: smooth_quartz mullion at x on the frame plane z+1 (y1..26), glass panes
 * x+1..x+6 on the glass plane z, smooth_quartz transoms across the glass at y7, 14, 21.
 */
export function curtainWallBay(g, { x, z = 142, y0 = 0, over = false }) {
  const w = scope(g, [x, y0 + 1, z, x + 6, y0 + 26, z + 1], { over });
  for (let dy = 1; dy <= 26; dy++) {
    const y = y0 + dy, transom = [7, 14, 21].includes(dy);
    w.set(x, y, z + 1, "smooth_quartz");
    for (let k = 1; k <= 6; k++) {
      if (transom) w.set(x + k, y, z, "smooth_quartz");
      else w.set(x + k, y, z, "glass_pane", PANE_RUN);
    }
  }
  return w.report();
}

/**
 * A glass clerestory on the roof deck: smooth_quartz posts at every 4th z on both long sides and at the far corners,
 * glass_pane between (y29..34), a smooth_quartz ring at y35 with a glass skylight inside, and a smooth_quartz_slab
 * rim at y36. The deck below stays open (interior air).
 */
export function roofMonitor(g, { x0, x1, z0, z1, y0 = 29, over = false }) {
  const top = y0 + 6, rim = y0 + 7;
  const w = scope(g, [x0, y0, z0, x1, rim, z1], { over });
  const onRing = (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1 && (x === x0 || x === x1 || z === z0 || z === z1);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!onRing(x, z)) {
      w.set(x, top, z, "glass");
      continue;
    }
    const post = (x === x0 || x === x1) && ((z - z0) % 4 === 0 || z === z1);
    for (let y = y0; y < top; y++) {
      if (post) w.set(x, y, z, "smooth_quartz");
      else w.set(x, y, z, "glass_pane", {
        north: String(onRing(x, z - 1)), south: String(onRing(x, z + 1)),
        east: String(onRing(x + 1, z)), west: String(onRing(x - 1, z)),
      });
    }
    w.set(x, top, z, "smooth_quartz");
    w.set(x, rim, z, "smooth_quartz_slab", SLAB_BOTTOM);
  }
  return w.report();
}

/**
 * A 4x4 porch: smooth_sandstone corner posts y1..4, a smooth_sandstone_slab canopy at y5 over the whole square,
 * a brown_terracotta fascia ring at y6, and two hanging lanterns under the canopy at y4 (headroom y1..3 stays clear).
 */
export function porchCanopy(g, { x0, z0, y0 = 0, over = false }) {
  const x1 = x0 + 3, z1 = z0 + 3;
  const w = scope(g, [x0, y0 + 1, z0, x1, y0 + 6, z1], { over });
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    const ring = x === x0 || x === x1 || z === z0 || z === z1;
    if (corner) for (let dy = 1; dy <= 4; dy++) w.set(x, y0 + dy, z, "smooth_sandstone");
    w.set(x, y0 + 5, z, "smooth_sandstone_slab", SLAB_BOTTOM);
    if (ring) w.set(x, y0 + 6, z, "brown_terracotta");
  }
  w.set(x0 + 1, y0 + 4, z0 + 1, "lantern", LANTERN_HANGING);
  w.set(x0 + 2, y0 + 4, z0 + 2, "lantern", LANTERN_HANGING);
  return w.report();
}

/**
 * A red canopy: smooth_quartz corner posts y1..4, a red_concrete fascia ring at y5, a smooth_quartz_slab soffit
 * over the inside at y5, and hanging lanterns under the soffit every 4 x along the middle line.
 */
export function redCanopy(g, { x0, x1, z0, z1, y0 = 0, over = false }) {
  const w = scope(g, [x0, y0 + 1, z0, x1, y0 + 5, z1], { over });
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
    const ring = x === x0 || x === x1 || z === z0 || z === z1;
    if (corner) for (let dy = 1; dy <= 4; dy++) w.set(x, y0 + dy, z, "smooth_quartz");
    if (ring) w.set(x, y0 + 5, z, "red_concrete");
    else w.set(x, y0 + 5, z, "smooth_quartz_slab", SLAB_BOTTOM);
  }
  const zc = Math.floor((z0 + z1) / 2);
  for (let x = x0 + 2; x < x1; x += 4) w.set(x, y0 + 4, zc, "lantern", LANTERN_HANGING);
  return w.report();
}

// Half-width of the vault cross-section at y = 1..20 (plan.md: dx = |x - cx| at each height).
const VAULT_DX = [7, 7, 7, 7, 7, 7, 7, 6, 6, 6, 5, 5, 5, 4, 4, 3, 3, 2, 1, 0];

/**
 * One rib plane of the Glasshouse vault: the whole cross-section at z in smooth_quartz (y1..20) around the bay axis
 * cx. The axis defaults from z (bay k = floor((z - 4) / 4), axis 231 + k). rod: a lightning_rod finial at y21 (the
 * end ribs). Call it before vaultBay on the same z, or its glass edge cells are already air-owned and get refused.
 */
export function vaultRib(g, { z, cx, y0 = 0, rod = false, over = false }) {
  const axis = cx ?? 231 + Math.min(9, Math.max(0, Math.floor((z - 4) / 4)));
  const w = scope(g, [axis - 7, y0 + 1, z, axis + 7, y0 + 21, z], { over });
  for (let y = 1; y <= 20; y++) {
    const d = VAULT_DX[y - 1];
    for (let x = axis - d; x <= axis + d; x++) w.set(x, y0 + y, z, "smooth_quartz");
  }
  if (rod) w.set(axis, y0 + 21, z, "lightning_rod", { facing: "up", powered: "false" });
  return w.report();
}

/**
 * One gallery face (Galleries G1..G3): deepslate_tiles plinth y1-2, gray_concrete wall y3..11, polished_deepslate
 * fins on the outer row every 6 cells (y1..11), deepslate_tiles parapet y12-13, and a polished_deepslate_slab coping
 * at y14. The outer row is the face; the wall is 2 thick.
 */
export function galleryFace(g, { x0, z0, x1, z1, face, y0 = 0, over = false }) {
  const cells = faceCells(face, { x0, z0, x1, z1 });
  const w = scope(g, boxOf(cells, y0 + 1, y0 + 14), { over });
  for (const { x, z, i, outer } of cells) {
    for (let dy = 1; dy <= 14; dy++) {
      let block = "deepslate_tiles";
      if (dy <= 11 && outer && i % 6 === 0) block = "polished_deepslate";
      else if (dy >= 3 && dy <= 11) block = "gray_concrete";
      else if (dy === 14) { w.set(x, y0 + dy, z, "polished_deepslate_slab", SLAB_BOTTOM); continue; }
      w.set(x, y0 + dy, z, block);
    }
  }
  return w.report();
}

/**
 * A black_concrete sign board across x0..x1 at plane z (y0..y1), with the white banner letters of `text` hung on
 * its outer side (north: letters at z-1; south: z+1), centred on cx at height cy. Banner letters go through the same gate.
 */
export function signBand(g, { x0, x1, z, y0, y1, text, face = "north", cx = Math.floor((x0 + x1) / 2), cy = y0 + 1, over = false }) {
  if (face !== "north" && face !== "south") throw new Error(`signBand face must be north|south, got ${face}`);
  const letterZ = z + DIRS[face][2];
  const w = scope(g, [x0, y0, Math.min(z, letterZ), x1, y1, Math.max(z, letterZ)], { over });
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) w.set(x, y, z, "black_concrete");
  bannerWord(w, text, { center: [cx, cy, letterZ], face, letter: "white", base: "black" });
  return w.report();
}

// Crown cells dropped from the top layer so the blob reads uneven (offsets from the trunk).
const UNEVEN = [[2, 0], [0, -2], [-1, 2]];

/**
 * A plane tree: an oak_log trunk 5 high at (x, z) from y1, and a 5-wide crown of persistent oak_leaves over two
 * layers (y4, y5) with the corners cut and a few bites out of the top layer.
 */
export function planeTree(g, { x, z, y0 = 0, over = false }) {
  const w = scope(g, [x - 2, y0 + 1, z - 2, x + 2, y0 + 5, z + 2], { over });
  for (let dy = 1; dy <= 5; dy++) w.set(x, y0 + dy, z, "oak_log", { axis: "y" });
  for (const dy of [4, 5]) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    if ((dx === 0 && dz === 0) || (Math.abs(dx) === 2 && Math.abs(dz) === 2)) continue;
    if (dy === 5 && UNEVEN.some(([a, b]) => a === dx && b === dz)) continue;
    w.set(x + dx, y0 + dy, z + dz, "oak_leaves", LEAVES);
  }
  return w.report();
}
