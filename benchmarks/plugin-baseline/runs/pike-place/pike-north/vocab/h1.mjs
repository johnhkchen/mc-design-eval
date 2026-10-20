// Designer helpers from plan.md VOCABULARY (Pike Place north end). Coordinates are plot-local; `face` is the way the
// wall looks: Soames-Dunn's front is west (-x), Butterworth's is east (+x).
// Each helper writes only inside its own footprint and into air only: a solid cell is skipped and listed, unless
// opts.over is true, which lets it overwrite solid blocks inside its footprint (never outside it).
// Returns { placed, skipped: [[x, y, z, block]...], box } so the caller can see what was refused.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = /(^|:)(cave_)?air$/;
const PANE_ALONG_Z = { north: "true", south: "true", east: "false", west: "false" };   // a glass run in a plane of x
const OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };
const STEP_X = { west: -1, east: 1 };                                                    // from the wall plane toward the street
const GLOW = { shop: "ochre_froglight", ceiling: "glowstone", upper: "shroomlight" };

const fresh = (box) => ({ placed: 0, skipped: [], box });
const inBox = (box, x, y, z) => x >= box[0] && x <= box[3] && y >= box[1] && y <= box[4] && z >= box[2] && z <= box[5];
const writer = (g, r, over) => (x, y, z, block, state, nbt) => put(g, r, over, x, y, z, block, state, nbt);

// One block. Refused (and listed) outside the footprint, outside the grid, or on a solid cell unless over.
function put(g, r, over, x, y, z, block, state, nbt) {
  const ok = inBox(r.box, x, y, z) && g.inBounds(x, y, z) && (over || AIR.test(g.blockAt(x, y, z)));
  if (!ok) { r.skipped.push([x, y, z, block]); return; }
  g.set(x, y, z, block, state, nbt);
  r.placed++;
}

/** One 9-wide bay of a shopfront: head beam y8, mullion post at z0+8, bulkhead, display glass z0..z0+3, a door pair
 *  z0+4..z0+5 (both halves, hinges mirrored, facing out) with transom glass above it to y7. Wall plane x. */
export function shopfront_bay(g, { x, z0, floorY, face = "west", post, bulk, head, doorMat, over = false } = {}) {
  const r = fresh([x, floorY + 1, z0, x, 8, z0 + 8]), w = writer(g, r, over);
  const doorZ = [z0 + 4, z0 + 5];
  for (let z = z0; z < z0 + 8; z++) w(x, 8, z, head);
  for (let y = floorY + 1; y <= 8; y++) w(x, y, z0 + 8, post, { axis: "y" });
  for (let z = z0; z < z0 + 8; z++) if (!doorZ.includes(z)) w(x, floorY + 1, z, bulk);
  for (let y = floorY + 2; y <= floorY + 5; y++) for (let z = z0; z <= z0 + 3; z++) w(x, y, z, "glass_pane", PANE_ALONG_Z);
  for (let y = floorY + 3; y <= 7; y++) for (const z of doorZ) w(x, y, z, "brown_stained_glass_pane", PANE_ALONG_Z);
  doorZ.forEach((z, i) => {
    for (const [half, dy] of [["lower", 1], ["upper", 2]]) w(x, floorY + dy, z, `${doorMat}_door`, { facing: face, half, hinge: i ? "right" : "left", open: "false" });
  });
  return r;
}

/** A two-light window in the wall plane x (z..z+1): sill (top half-slab) at y0-1, glass recessed 1 into the building
 *  (+x, the Soames west front) over y0..y1, lintel at y1+1. */
export function paired_window(g, { x, z, y0 = 12, y1 = 14, over = false } = {}) {
  const r = fresh([x, y0 - 1, z, x + 1, y1 + 1, z + 1]), w = writer(g, r, over);
  for (let dz = 0; dz <= 1; dz++) {
    w(x, y0 - 1, z + dz, "stone_brick_slab", { type: "top" });
    for (let y = y0; y <= y1; y++) w(x + 1, y, z + dz, "glass_pane", PANE_ALONG_Z);
    w(x, y1 + 1, z + dz, "cut_sandstone");
  }
  return r;
}

/** A 5x5 disc on the wall plane x, centred (yc, zc): brown_concrete ring, birch_planks field, a 1x3 brown_terracotta
 *  siren down the middle. The four corners are not written (they stay as they are). */
export function round_logo(g, { x = 1, zc = 41, yc = 14, over = false } = {}) {
  const r = fresh([x, yc - 2, zc - 2, x, yc + 2, zc + 2]), w = writer(g, r, over);
  for (let dy = -2; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) {
    const d2 = dy * dy + dz * dz;
    if (d2 > 6.25) continue;
    const block = dz === 0 && Math.abs(dy) <= 1 ? "brown_terracotta" : d2 <= 2 ? "birch_planks" : "brown_concrete";
    w(x, yc + dy, zc + dz, block);
  }
  return r;
}

/** A light blue wall banner with a white rhombus, hung on the block behind it (it faces `face`, out of the wall). */
export function lozenge_banner(g, { x, y, z, face = "west", over = false } = {}) {
  const r = fresh([x, y, z, x, y, z]), w = writer(g, r, over);
  const [block, state, nbt] = B.banner("light_blue", [["rhombus", "white"]], { wall: true, facing: face });
  w(x, y, z, block, state, nbt);
  return r;
}

/** A cornice at height y on the wall plane x, over z0..z1: frieze row at x, bed mould (stairs, top half, facing in)
 *  at the street-side cell, corona one up over both cells, cap slab (bottom) two up at the street side. Pass a
 *  material for each part, or false to leave that part out. Soames: frieze smooth_sandstone, bed mould
 *  smooth_sandstone, no corona/cap. Butterworth: frieze cut_sandstone, the rest as defaults. */
export function cornice_run(g, { x, y, z0, z1, face = "west", stairs = "smooth_sandstone", frieze = "smooth_sandstone",
  corona = "smooth_sandstone", cap = "smooth_sandstone", over = false } = {}) {
  const xo = x + STEP_X[face], inward = OPPOSITE[face];
  const r = fresh([Math.min(x, xo), y, z0, Math.max(x, xo), y + 2, z1]), w = writer(g, r, over);
  for (let z = z0; z <= z1; z++) {
    if (frieze) w(x, y, z, frieze);
    if (stairs) w(xo, y, z, `${stairs}_stairs`, { facing: inward, half: "top", shape: "straight" });
    if (corona) { w(x, y + 1, z, corona); w(xo, y + 1, z, corona); }
    if (cap) w(xo, y + 2, z, `${cap}_slab`, { type: "bottom" });
  }
  return r;
}

/** A pilaster on the wall plane x, 2 wide (z..z+1), over y0..y1, head (bricks) at headY with a bottom cap slab above it.
 *  quoin: every third course of the shaft is cut_sandstone (both cells). */
export function pilaster(g, { x, z, y0, y1, headY = y1 + 1, quoin = false, over = false } = {}) {
  const r = fresh([x, y0, z, x, headY + 1, z + 1]), w = writer(g, r, over);
  for (let y = y0; y <= y1; y++) {
    const block = quoin && (y - y0) % 3 === 0 ? "cut_sandstone" : "bricks";
    for (let dz = 0; dz <= 1; dz++) w(x, y, z + dz, block);
  }
  for (let dz = 0; dz <= 1; dz++) {
    w(x, headY, z + dz, "bricks");
    w(x, headY + 1, z + dz, "stone_brick_slab", { type: "bottom" });
  }
  return r;
}

/** A vent hutch on a roof deck: stone_bricks 2 wide (x..x+1) at y, a stone_brick_slab on top of it. y = the cell above the deck. */
export function vent_hutch(g, { x, z, y, over = false } = {}) {
  const r = fresh([x, y, z, x + 1, y + 1, z]), w = writer(g, r, over);
  for (let dx = 0; dx <= 1; dx++) {
    w(x + dx, y, z, "stone_bricks");
    w(x + dx, y + 1, z, "stone_brick_slab", { type: "bottom" });
  }
  return r;
}

/** A glow block 2 cells behind the glass, at (x, y, z). kind: shop (ochre_froglight), ceiling (glowstone, shop ceiling),
 *  upper (shroomlight, upper rooms). About one upper window in three stays dark (a hash of z, same every run). */
export function dusk_glow(g, { x, y, z, kind = "shop", over = false } = {}) {
  if (!GLOW[kind]) throw new Error(`dusk_glow: unknown kind "${kind}"`);
  const r = fresh([x, y, z, x, y, z]), w = writer(g, r, over);
  r.lit = !(kind === "upper" && ((Math.imul(z, 0x9e3779b1) >>> 16) % 3) === 0);
  if (r.lit) w(x, y, z, GLOW[kind], kind === "shop" ? { axis: "y" } : undefined);
  return r;
}

/** The Kells pub front on the x64 projection (its face is west): fascia green_concrete at floorY+5 over z0-1..z0+12,
 *  dark oak frame with glass floorY+1..floorY+4, a spruce door pair at z0+5..z0+6 (floorY..floorY+1) with transom glass
 *  above, and two hanging lanterns at z0+1 and z0+10 hung from the fascia. */
export function kells_front(g, { x = 64, z0 = 90, floorY = 3, face = "west", over = false } = {}) {
  const r = fresh([x, floorY, z0 - 1, x, floorY + 5, z0 + 12]), w = writer(g, r, over);
  const posts = [z0, z0 + 4, z0 + 7, z0 + 11], doorZ = [z0 + 5, z0 + 6], lanternZ = [z0 + 1, z0 + 10];
  for (let z = z0 - 1; z <= z0 + 12; z++) w(x, floorY + 5, z, "green_concrete");
  for (const z of posts) for (let y = floorY + 1; y <= floorY + 4; y++) w(x, y, z, "stripped_dark_oak_log", { axis: "y" });
  doorZ.forEach((z, i) => {
    for (const [half, dy] of [["lower", 0], ["upper", 1]]) w(x, floorY + dy, z, "spruce_door", { facing: face, half, hinge: i ? "right" : "left", open: "false" });
  });
  for (const z of lanternZ) w(x, floorY + 4, z, "lantern", { hanging: "true" });
  for (let z = z0 + 1; z <= z0 + 10; z++) {
    if (posts.includes(z)) continue;
    for (let y = floorY + 1; y <= floorY + 4; y++) {
      if (doorZ.includes(z) && y < floorY + 2) continue;                   // the door's own cells
      if (lanternZ.includes(z) && y === floorY + 4) continue;              // the lantern hangs in this row
      w(x, y, z, "glass_pane", PANE_ALONG_Z);
    }
  }
  return r;
}
