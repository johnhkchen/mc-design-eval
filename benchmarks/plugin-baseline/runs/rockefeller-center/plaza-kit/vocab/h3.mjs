// Landscape helpers from plan.md VOCABULARY: roadStrip, lampPost, gardenSteps, froglightBay, promenadeField,
// inscriptionBand, goldMount, flagPole, plantBed. Block ids are literals from plan.md's PALETTE.
// Every helper takes the grid g first, then its position (and facing) as arguments, and returns { placed, refused }.
// It writes only its own footprint, and only into air: a cell an earlier part already filled is refused and listed,
// never overwritten, unless opts.overwrite is true. gardenSteps' treads fill down through air only and stop at the
// first solid block (the ground an earlier part laid), so nothing solid is ever replaced below a tread.
import { DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const result = () => ({ placed: 0, refused: [] });

// One write: into air (or anywhere, with overwrite) inside the grid; anything else is refused and listed.
function put(g, res, overwrite, x, y, z, block, state) {
  if (!g.inBounds(x, y, z) || (!overwrite && !g.isAir(x, y, z))) { res.refused.push([x, y, z, block]); return; }
  g.set(x, y, z, block, state);
  res.placed++;
}

// A tread or cheek column: the top block at yTop, then solid filled down through air only (never through ground).
function column(g, res, overwrite, x, yTop, z, block) {
  put(g, res, overwrite, x, yTop, z, block);
  for (let y = yTop - 1; y >= 0 && g.isAir(x, y, z); y--) put(g, res, false, x, y, z, block);
}

function facingDelta(dir) {
  if (!DIRS[dir]) throw new Error(`facing must be north, south, east or west, got ${dir}`);
  return DIRS[dir];
}

/** Rockefeller Plaza roadway: gray_concrete over x0..x1 × z0..z1 with its top block at y; the x0 and x1 edges are smooth_stone_slab curbs. */
export function roadStrip(g, x0, x1, z0, z1, y, { overwrite = false } = {}) {
  const res = result();
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const curb = x === x0 || x === x1;
    put(g, res, overwrite, x, y, z, curb ? "smooth_stone_slab" : "gray_concrete", curb ? { type: "bottom", waterlogged: "false" } : undefined);
  }
  return res;
}

/** Lamp post at (x, z) on a surface at `base`: polished_blackstone_wall post at base+1..base+4, a standing lantern at base+5. */
export function lampPost(g, x, z, base, { overwrite = false } = {}) {
  const res = result();
  for (let y = base + 1; y <= base + 4; y++) put(g, res, overwrite, x, y, z, "polished_blackstone_wall", { up: "true" });
  put(g, res, overwrite, x, base + 5, z, "lantern", { hanging: "false", waterlogged: "false" });
  return res;
}

/** Channel Gardens steps over x0..x1 × z0..z1: full polished_andesite treads rising 1 every 2 blocks (top y1, y2, y3 from x0),
 *  each filled down to the ground through air. Cheek walls sit one cell outside z0 and z1, flush with the tread beside them. */
export function gardenSteps(g, x0, x1, z0, z1, { cheeks = true, overwrite = false } = {}) {
  const res = result();
  const top = (x) => Math.min(3, 1 + Math.floor((x - x0) / 2));
  const zs = cheeks ? [z0 - 1, ...range(z0, z1), z1 + 1] : range(z0, z1);
  for (let x = x0; x <= x1; x++) for (const z of zs) column(g, res, overwrite, x, top(x), z, "polished_andesite");
  return res;
}

/** Restaurant bay behind glass at glassZ: an ochre_froglight in the ceiling at y3 one cell in from the glass, and a table two
 *  cells in (birch_fence at y1, polished_andesite_slab top at y2). into = the direction from the glass into the room. */
export function froglightBay(g, x, glassZ, into, { overwrite = false } = {}) {
  const res = result();
  const [, , dz] = facingDelta(into);
  put(g, res, overwrite, x, 3, glassZ + dz, "ochre_froglight", { axis: "y" });
  const tz = glassZ + 2 * dz;
  put(g, res, overwrite, x, 1, tz, "birch_fence", { north: "false", east: "false", south: "false", west: "false" });
  put(g, res, overwrite, x, 2, tz, "polished_andesite_slab", { type: "bottom", waterlogged: "false" });
  return res;
}

/** Pale granite promenade over x0..x1 × z0..z1 with its top block at y: smooth_stone, polished_andesite bands every 6 blocks
 *  (counted from x0 and z0) and a 1-wide polished_andesite border. */
export function promenadeField(g, x0, x1, z0, z1, y, { overwrite = false } = {}) {
  const res = result();
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const border = x === x0 || x === x1 || z === z0 || z === z1;
    const band = (x - x0) % 6 === 0 || (z - z0) % 6 === 0;
    put(g, res, overwrite, x, y, z, border || band ? "polished_andesite" : "smooth_stone");
  }
  return res;
}

/** Inscription band on the wall face at x: alternating raw_gold_block and polished_blackstone_bricks along z0..z1 at y,
 *  gold first. Call it once per run that stays off the zodiac ring (the ring cells are not written here). */
export function inscriptionBand(g, x, z0, z1, y, { overwrite = false } = {}) {
  const res = result();
  for (let z = z0; z <= z1; z++) put(g, res, overwrite, x, y, z, (z - z0) % 2 === 0 ? "raw_gold_block" : "polished_blackstone_bricks");
  return res;
}

/** Gilded mount: a stepped gold_block cone over x0..x1 × z0..z1, `layers` tall from y0. Each layer insets one cell from every side. */
export function goldMount(g, x0, x1, z0, z1, y0, { layers = 4, overwrite = false } = {}) {
  const res = result();
  for (let k = 0; k < layers; k++) {
    const ix = Math.min(k, Math.floor((x1 - x0) / 2)), iz = Math.min(k, Math.floor((z1 - z0) / 2));
    for (let x = x0 + ix; x <= x1 - ix; x++) for (let z = z0 + iz; z <= z1 - iz; z++) put(g, res, overwrite, x, y0 + k, z, "gold_block");
  }
  return res;
}

/** Flagpole at (x, z): end_rod stacked from base to top (default y5..y11), and a 2x2 wool flag pointing dir: cells 1 and 2 out
 *  from the pole on the top two rows. colours = [top row, bottom row] as dye names ("red", "white"). */
export function flagPole(g, x, z, dir, [topColour, bottomColour], { base = 5, top = 11, overwrite = false } = {}) {
  const res = result();
  const [dx, , dz] = facingDelta(dir);
  for (let y = base; y <= top; y++) put(g, res, overwrite, x, y, z, "end_rod", { facing: "up" });
  for (const out of [1, 2]) for (const [y, colour] of [[top, topColour], [top - 1, bottomColour]])
    put(g, res, overwrite, x + dx * out, y, z + dz * out, `${colour}_wool`);
  return res;
}

/** Planter bed over x0..x1 × z0..z1 with its surface at base+1: polished_blackstone curb on the rectangle's edge (except the
 *  sides listed in open, where the soil runs to the edge), grass/moss soil inside, a shrub or flower on each soil cell at base+2,
 *  and persistent leaves on the azalea shrubs at base+3. */
export function plantBed(g, x0, x1, z0, z1, base, { open = [], overwrite = false } = {}) {
  const res = result();
  const flora = ["allium", "red_tulip", "orange_tulip", "pink_tulip", "white_tulip", "cornflower", "oxeye_daisy"];
  const isCurb = (x, z) => (x === x0 && !open.includes("west")) || (x === x1 && !open.includes("east"))
    || (z === z0 && !open.includes("north")) || (z === z1 && !open.includes("south"));
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    if (isCurb(x, z)) { put(g, res, overwrite, x, base + 1, z, "polished_blackstone"); continue; }
    put(g, res, overwrite, x, base + 1, z, (x + z) % 3 === 0 ? "moss_block" : "grass_block");
    const pick = (x * 3 + z * 5) % 8;
    if (pick === 0) { put(g, res, overwrite, x, base + 2, z, "azalea"); put(g, res, overwrite, x, base + 3, z, "azalea_leaves", { persistent: "true" }); }
    else if (pick === 1) { put(g, res, overwrite, x, base + 2, z, "flowering_azalea"); put(g, res, overwrite, x, base + 3, z, "flowering_azalea_leaves", { persistent: "true" }); }
    else put(g, res, overwrite, x, base + 2, z, flora[pick % flora.length]);
  }
  return res;
}

function range(a, b) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}
