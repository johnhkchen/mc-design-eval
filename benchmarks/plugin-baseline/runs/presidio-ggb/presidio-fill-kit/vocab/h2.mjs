// plan.md VOCABULARY (2): string_course, door_hood, mission_parapet, colonnade, dormer, glacis, deck_stair.
// Every helper takes its own position (and facing) and writes only inside its footprint: into air, or over solid
// blocks only where it says so (string_course { replace: true }). It never writes into ground (y0) or any cell an
// earlier part owns, and never fills an opening. Each returns { placed, refused: [[x,y,z], ...] } for the caller to report.
import { OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = /(^|[:_])air$/;
const STEP = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const isAir = (g, x, y, z) => { const c = g.get(x, y, z); return !c || AIR.test(c.block); };
const isSolid = (g, x, y, z) => g.inBounds(x, y, z) && !isAir(g, x, y, z);
const result = () => ({ placed: 0, refused: [] });

// One write. mode "air" (default): only into air. mode "solid": only over a block, never into air.
// Out-of-bounds and protected (functional) cells are refused, never thrown.
function put(g, out, x, y, z, block, state, mode = "air") {
  if (!g.inBounds(x, y, z) || g.protected?.has(`${x},${y},${z}`) || (mode === "air") !== isAir(g, x, y, z)) {
    out.refused.push([x, y, z]);
    return false;
  }
  g.set(x, y, z, block, state);
  out.placed++;
  return true;
}

// Glass pane connections: a pane joins each neighbour that is solid (walls, pillars, other panes).
const paneState = (g, x, y, z) => ({
  north: String(isSolid(g, x, y, z - 1)), south: String(isSolid(g, x, y, z + 1)),
  east: String(isSolid(g, x + 1, y, z)), west: String(isSolid(g, x - 1, y, z)),
});

/** A flush course round the outside of a body: the ring of cells [x0,z0]..[x1,z1] at height y. Default writes only
 *  into air (a proud course); { replace: true } lays it over the walls already there, leaving openings open. */
export function string_course(g, [x0, z0, x1, z1], y, block, { replace = false } = {}) {
  const out = result(), ring = new Set();
  for (let x = x0; x <= x1; x++) { ring.add(`${x},${z0}`); ring.add(`${x},${z1}`); }
  for (let z = z0; z <= z1; z++) { ring.add(`${x0},${z}`); ring.add(`${x1},${z}`); }
  for (const k of ring) { const [x, z] = k.split(",").map(Number); put(g, out, x, y, z, block, undefined, replace ? "solid" : "air"); }
  return out;
}

/** A granite hood over a door: one stair cell at [x, y, z] (y = 3 for the door at y1..2), its back against the wall.
 *  face: the way the facade looks (south for a south front); the stair faces into the wall, so the lip faces the street. */
export function door_hood(g, [x, y, z], face) {
  const out = result();
  put(g, out, x, y, z, "granite_stairs", { facing: OPPOSITE[face], half: "bottom", shape: "straight" });
  return out;
}

/** The Mission curved parapet on a 4-wide bay: [x, y, z] is the bay's west cell at the base (y6), z the front wall.
 *  Base row full, middle two up one, stairs at each end curving in, slab coping on the middle two. */
export function mission_parapet(g, [x, y, z]) {
  const out = result(), body = "smooth_sandstone";
  for (let i = 0; i < 4; i++) put(g, out, x + i, y, z, body);
  put(g, out, x, y + 1, z, "smooth_sandstone_stairs", { facing: "east", half: "bottom", shape: "straight" });
  put(g, out, x + 3, y + 1, z, "smooth_sandstone_stairs", { facing: "west", half: "bottom", shape: "straight" });
  for (const i of [1, 2]) {
    put(g, out, x + i, y + 1, z, body);
    put(g, out, x + i, y + 2, z, "smooth_sandstone_slab", { type: "bottom" });
  }
  return out;
}

/** A row of pillars at z with a birch_fence rail between each pair, the rail at floorY + 1 (the gallery's walking
 *  height). xs: pillar x's; pillars run y0..y1 (quartz_pillar, axis y). */
export function colonnade(g, { xs, z, y0, y1, floorY }) {
  const out = result(), pillars = [...xs].sort((a, b) => a - b), rail = floorY + 1, gaps = new Set();
  for (let i = 0; i + 1 < pillars.length; i++) for (let x = pillars[i] + 1; x < pillars[i + 1]; x++) gaps.add(x);
  for (const x of pillars) for (let y = y0; y <= y1; y++) put(g, out, x, y, z, "quartz_pillar", { axis: "y" });
  for (const x of gaps) {
    const joins = (n) => String(pillars.includes(n) || gaps.has(n));
    put(g, out, x, rail, z, "birch_fence", { north: "false", south: "false", east: joins(x + 1), west: joins(x - 1) });
  }
  return out;
}

/** A gabled dormer x0..x1 (3 wide) over two rows z0..z0+1: white walls at y, a glass pane in the front centre, and a
 *  roof at y+1 with its ridge along z (stairs down each side, a top slab on the ridge). roof: block-family prefix. */
export function dormer(g, x0, x1, z0, y, { roof = "deepslate_tile" } = {}) {
  if (x1 - x0 !== 2) throw new Error(`dormer: x0..x1 must be 3 wide (got ${x0}..${x1})`);
  const out = result(), mid = x0 + 1, front = z0 + 1;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= front; z++) {
    if (x === mid && z === front) continue;   // the window cell, placed below once its neighbours are walls
    put(g, out, x, y, z, "white_concrete");
  }
  put(g, out, mid, y, front, "glass_pane", paneState(g, mid, y, front));
  for (let z = z0; z <= front; z++) {
    put(g, out, x0, y + 1, z, `${roof}_stairs`, { facing: "east", half: "bottom", shape: "straight" });
    put(g, out, x1, y + 1, z, `${roof}_stairs`, { facing: "west", half: "bottom", shape: "straight" });
    put(g, out, mid, y + 1, z, `${roof}_slab`, { type: "top" });
  }
  return out;
}

/** An earth glacis over [x0,z0]..[x1,z1], rising one step per two rows from z0 (y0 is the ground course, untouched).
 *  Rows z0..z0+1 top at y0+1, then +1 every two rows. Dirt below, grass top, about 1 in 6 tops coarse_dirt. */
export function glacis(g, [x0, z0, x1, z1], y0 = 0) {
  const out = result();
  for (let z = z0; z <= z1; z++) {
    const top = y0 + 1 + Math.floor((z - z0) / 2);
    for (let x = x0; x <= x1; x++) {
      for (let y = y0 + 1; y < top; y++) put(g, out, x, y, z, "dirt");
      put(g, out, x, top, z, (x * 31 + z * 17) % 6 === 0 ? "coarse_dirt" : "grass_block");
    }
  }
  return out;
}

/** A 2-wide deck stair climbing `facing` (3 steps). [x, y, z] = the bottom step's first cell; the width runs to the
 *  right of facing. Solid concrete under each step above the bottom one, and cheeks either side of the first two rows
 *  (two high). The last step sits in the deck layer (y + 2). */
export function deck_stair(g, [x, y, z], facing = "north", { stair = "polished_andesite", concrete = "light_gray_concrete" } = {}) {
  const out = result(), [dx, dz] = STEP[facing], [rx, rz] = [-dz, dx];
  for (let i = 0; i < 3; i++) for (let w = 0; w < 2; w++) {
    const sx = x + dx * i + rx * w, sz = z + dz * i + rz * w;
    put(g, out, sx, y + i, sz, `${stair}_stairs`, { facing, half: "bottom", shape: "straight" });
    for (let yy = y; yy < y + i; yy++) put(g, out, sx, yy, sz, concrete);
  }
  for (let i = 0; i < 2; i++) for (const w of [-1, 2]) for (const yy of [y, y + 1])
    put(g, out, x + dx * i + rx * w, yy, z + dz * i + rz * w, concrete);
  return out;
}
