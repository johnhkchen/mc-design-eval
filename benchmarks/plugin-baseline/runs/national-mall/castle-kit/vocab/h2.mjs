// Vocabulary helpers, batch 2: the nine plan.md VOCABULARY names not covered elsewhere.
// Each takes the Grid first, then its position and facing as arguments, and returns { placed, refused }.
// A helper writes only inside its own footprint and only into air. An option (`over`, or a block-named
// `opts.over`) lets it replace the listed blocks. Block ids are plan.md PALETTE literals, checked for 1.21.1.
// Coordinates are plot-local, as in plan.md. Lanterns hang from a block above; flowers sit on podzol.
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const id = (name) => (name.includes(":") ? name : `minecraft:${name}`);
const inBox = (fp, x, y, z) => x >= fp[0] && y >= fp[1] && z >= fp[2] && x <= fp[3] && y <= fp[4] && z <= fp[5];

// One write, into footprint fp ([x0, y0, z0, x1, y1, z1], inclusive) and into air (or a block named in `over`).
// Returns true if it wrote; a refused cell is recorded in out.refused.
function put(g, fp, out, x, y, z, block, state, { over = [], nbt } = {}) {
  const ok = inBox(fp, x, y, z) && g.inBounds(x, y, z) && (g.isAir(x, y, z) || over.map(id).includes(g.blockAt(x, y, z)));
  if (!ok) { out.refused.push([x, y, z, id(block)]); return false; }
  g.set(x, y, z, block, state, nbt);
  out.placed++;
  return true;
}
const result = () => ({ placed: 0, refused: [] });

/** stringCourse(box, y, material): a top-half slab course one cell proud round the outside of a wall box [x0, z0, x1, z1]. */
export function stringCourse(g, box, y, material) {
  const out = result();
  const [x0, z0, x1, z1] = box;
  const fp = [x0 - 1, y, z0 - 1, x1 + 1, y, z1 + 1];
  const [slab, state] = B.slab(material.replace(/_slab$/, ""), "top");
  for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = z0 - 1; z <= z1 + 1; z++) {
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) continue;   // the wall itself is not the course
    put(g, fp, out, x, y, z, slab, state);
  }
  return out;
}

/**
 * archedWindow(x, y, z, face, h, opts): an h-cell glazed opening at (x, y..y+h-1, z) in a 1-thick wall whose outside
 * faces `face` ("north" = the wall's north face). Proud on the outside cell: a top-half slab sill at y-1 and an
 * upside-down hood stair at y+h. A shroomlight glow one cell inside, at the window's centre height.
 * opts: trim (default polished_granite), pane (default gray_stained_glass_pane), glow (default true), sill (default
 * true; pass false where a string course already sits at y-1 and serves as the sill).
 */
export function archedWindow(g, x, y, z, face, h, { trim = "polished_granite", pane = "gray_stained_glass_pane", glow = true, sill = true } = {}) {
  const out = result();
  const [dx, , dz] = DIRS[face];
  const fp = [x - Math.abs(dx), y - 1, z - Math.abs(dz), x + Math.abs(dx), y + h, z + Math.abs(dz)];
  // panes join the two neighbours in the wall plane
  const state = dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  for (let i = 0; i < h; i++) put(g, fp, out, x, y + i, z, pane, state);
  if (sill) put(g, fp, out, x + dx, y - 1, z + dz, ...B.slab(trim, "top"));
  put(g, fp, out, x + dx, y + h, z + dz, ...B.stairs(trim, OPPOSITE[face], "top"));
  if (glow) put(g, fp, out, x - dx, y + Math.floor(h / 2), z - dz, "shroomlight");
  return out;
}

// Roof palettes by family (plan.md ROOFS and MATERIALS). A spec key always wins over the palette.
const FAMILY = {
  castle: { pitch: 1, overhang: 1, material: "deepslate_tiles", ridge: "slab", verge: "deepslate_tile" },
  ai: { pitch: 1, overhang: 1, material: { mix: [["stone_brick", 75], ["andesite", 25]] }, ridge: "slab", verge: "stone_brick" },
  freer: { pitch: 0.5, overhang: 0, material: "andesite", ridge: "polished_andesite" },
};
const STYLES = ["gable", "hip", "pyramid", "tower-cap"];

/**
 * slateRoof(spec): the roof.json for `$MCD roof --spec`. Writes nothing; the part lays the roof.
 * spec: { family: "castle" | "ai" | "freer" (default castle), style: "gable" | "hip" | "pyramid" | "tower-cap",
 *         ...any other roof.json key (ridgeAxis, keep, maxHeight, pitch, overhang, material, verge, ridge) }.
 * Pitch is set only for gable and hip; pyramid and tower-cap take their proportions from the roof tool.
 */
export function slateRoof(spec = {}) {
  const { family = "castle", style = "gable", ...rest } = spec;
  if (!FAMILY[family]) throw new Error(`slateRoof: family must be castle, ai or freer, not ${family}`);
  if (!STYLES.includes(style)) throw new Error(`slateRoof: style must be one of ${STYLES.join(", ")}, not ${style}`);
  const { pitch, ...palette } = FAMILY[family];
  return { style, ...palette, ...(style === "gable" || style === "hip" ? { pitch } : {}), ...rest };
}

/** flagpole(x, y, z, h): an end_rod column, h cells from y up. */
export function flagpole(g, x, y, z, h) {
  const out = result();
  const fp = [x, y, z, x, y + h - 1, z];
  for (let i = 0; i < h; i++) put(g, fp, out, x, y + i, z, "end_rod", { facing: "up" });
  return out;
}

/**
 * parterre(x0, z0, x1, z1, opts): a flower bed over the box [x0..x1] x [z0..z1]. The outer ring is smooth_stone_slab
 * (bottom) edging at y; the inside is podzol at y with poppy, azure_bluet and dandelion on it at y+1.
 * opts: y (default 0); over: ground blocks it may replace, e.g. ["grass_block"] (default: air only). A flower is
 * placed only where its podzol went in, so none float.
 */
export function parterre(g, x0, z0, x1, z1, { y = 0, over = [] } = {}) {
  const out = result();
  const fp = [x0, y, z0, x1, y + 1, z1];
  const FLOWERS = ["poppy", "azure_bluet", "dandelion"];
  const [edge, edgeState] = B.slab("smooth_stone", "bottom");
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (x === x0 || x === x1 || z === z0 || z === z1) {
      put(g, fp, out, x, y, z, edge, edgeState, { over });
    } else if (put(g, fp, out, x, y, z, "podzol", undefined, { over })) {
      put(g, fp, out, x, y + 1, z, FLOWERS[(x + z) % 3]);
    }
  }
  return out;
}

/**
 * clerestory(row): glass panes every `step` cells (default 2) along one wall row at each height in ys (default [8, 9]).
 * row: { along: "x" | "z", from, to, at, ys, step, pane }. `at` is the wall's fixed coordinate: z for along x, x for along z.
 * Writes into the air the shell leaves for the openings.
 */
export function clerestory(g, { along, from, to, at, ys = [8, 9], step = 2, pane = "glass_pane" }) {
  if (along !== "x" && along !== "z") throw new Error(`clerestory: along must be x or z, not ${along}`);
  const out = result();
  const lo = Math.min(...ys), hi = Math.max(...ys);
  const fp = along === "x" ? [from, lo, at, to, hi, at] : [at, lo, from, at, hi, to];
  const state = along === "x"
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  for (let a = from; a <= to; a += step) for (const y of ys) {
    if (along === "x") put(g, fp, out, a, y, at, pane, state);
    else put(g, fp, out, at, y, a, pane, state);
  }
  return out;
}

/**
 * loggia(x0, x1, z, opts): a covered walk of three bays. The arches are in the plane z (openings y..y+3); piers of
 * polished_diorite stand every 4 cells from x0 to x1; upside-down polished_diorite_stairs sit at the top corners of
 * each opening (y+3); a smooth_stone frieze runs at y+4 over both rows (z and z+1); a hanging lantern hangs at y+3
 * in each bay centre on the walk row z+1. x1 - x0 must be a multiple of 4 (12 for three bays). opts: y (default 0).
 */
export function loggia(g, x0, x1, z, { y = 0 } = {}) {
  if (x1 <= x0 || (x1 - x0) % 4 !== 0) throw new Error(`loggia: x1 - x0 must be a positive multiple of 4, got ${x1 - x0}`);
  const out = result();
  const bays = (x1 - x0) / 4;
  const fp = [x0, y, z, x1, y + 4, z + 1];
  for (let k = 0; k <= bays; k++) for (let i = 0; i < 4; i++) put(g, fp, out, x0 + 4 * k, y + i, z, "polished_diorite");
  for (let k = 0; k < bays; k++) {
    const left = x0 + 4 * k + 1, right = x0 + 4 * k + 3;   // the opening's two top corners
    put(g, fp, out, left, y + 3, z, ...B.stairs("polished_diorite", "east", "top"));
    put(g, fp, out, right, y + 3, z, ...B.stairs("polished_diorite", "west", "top"));
    put(g, fp, out, x0 + 4 * k + 2, y + 3, z + 1, ...B.lantern(true));
  }
  for (let x = x0; x <= x1; x++) for (const zz of [z, z + 1]) put(g, fp, out, x, y + 4, zz, "smooth_stone");
  return out;
}

// Precast strip material by strip index (plan.md precastStrip): about 70% white, 15% sandstone, 15% light grey.
const precastBlock = (strip) => {
  const m = strip % 20;
  return m < 14 ? "white_terracotta" : m < 17 ? "smooth_sandstone" : "light_gray_concrete";
};

/**
 * drumRing(cx, cz, rOut, rIn, y0, y1): a solid ring of cells whose distance from (cx, cz) is rIn to rOut, from y0 to y1.
 * Cut in 2-wide vertical strips round the ring by arc length. Air only: a cell that already holds a band or an
 * opening is refused, not replaced. Run balconyBand first, so the glass band stays.
 */
export function drumRing(g, cx, cz, rOut, rIn, y0, y1) {
  const out = result();
  const R = Math.ceil(rOut);
  const fp = [cx - R, y0, cz - R, cx + R, y1, cz + R];
  const rMid = (rIn + rOut) / 2;
  for (let x = cx - R; x <= cx + R; x++) for (let z = cz - R; z <= cz + R; z++) {
    const d = Math.hypot(x - cx, z - cz);
    if (d < rIn || d > rOut) continue;
    let a = Math.atan2(z - cz, x - cx);
    if (a < 0) a += 2 * Math.PI;
    const block = precastBlock(Math.floor((a * rMid) / 2));
    for (let y = y0; y <= y1; y++) put(g, fp, out, x, y, z, block);
  }
  return out;
}

/**
 * balconyBand(cx, cz, r, y, opts): one row of black glass on the ring whose cells sit at distance r to r+1 from
 * (cx, cz). Pass r = the drum's inner radius, so the band is recessed 1 into the court face. opts.slot: { box: [x0, z0,
 * x1, z1], rOut }, which also glazes the drum-ring cells in that box (the north balcony slot). Air only: run before
 * drumRing. Each pane joins the band cells beside it.
 */
export function balconyBand(g, cx, cz, r, y, { slot = null, pane = "black_stained_glass_pane" } = {}) {
  const out = result();
  const R = Math.ceil(Math.max(r + 1, slot ? slot.rOut : 0));
  const fp = [cx - R, y, cz - R, cx + R, y, cz + R];
  const within = (x, z) => {
    const d = Math.hypot(x - cx, z - cz);
    if (d >= r && d < r + 1) return true;
    const b = slot?.box;
    return !!b && x >= b[0] && x <= b[2] && z >= b[1] && z <= b[3] && d >= r && d <= slot.rOut;
  };
  for (let x = cx - R; x <= cx + R; x++) for (let z = cz - R; z <= cz + R; z++) {
    if (!within(x, z)) continue;
    const join = (dx, dz) => (within(x + dx, z + dz) ? "true" : "false");
    put(g, fp, out, x, y, z, pane, { north: join(0, -1), south: join(0, 1), east: join(1, 0), west: join(-1, 0) });
  }
  return out;
}
