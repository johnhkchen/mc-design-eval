// The nine h1 helpers from plan.md VOCABULARY: canopy_deck, fuel_pump, curb_cut, awning, brand_roundel, price_pylon,
// light_pole, propane_cage, hedge_run. Each takes the build grid first (a Grid, or a guard/runParts view), then the
// position the plan gives it (facing where it has one), then an optional { over }. Coordinates are absolute, inclusive,
// x east, y up, z south. Every write goes through put(): it lands only inside the helper's footprint and only into air,
// so a helper can't cut into an earlier part's cells or the ground under it. { over: true } writes into anything inside
// the footprint instead (curb_cut needs it to pave over the sidewalk). Each returns { placed, skipped, box }.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Footprint writer. box = [x0, y0, z0, x1, y1, z1], inclusive.
function scope(g, box, { over = false } = {}) {
  if (!(g instanceof Grid)) throw new TypeError("h1 helpers take the build grid (Grid or a guard/runParts view) first");
  const [x0, y0, z0, x1, y1, z1] = box;
  const out = { placed: 0, skipped: [], box };
  out.put = (x, y, z, block, state) => {
    const inside = x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
    if (inside && g.inBounds(x, y, z) && (over || g.isAir(x, y, z))) {
      g.set(x, y, z, block, state);
      out.placed++;
    } else out.skipped.push([x, y, z, block]);
  };
  return out;
}

// Deterministic cell hash: the "1 in 6" flowers come out the same on every run.
function hash(x, y, z) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2246822519);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  return (h ^ (h >>> 13)) >>> 0;
}

// Light grid on the soffit, as offsets from the deck corner (x 10, 16, 20, 24, 30 and z 12, 17 for the plan's deck).
const LIGHT_X = [4, 10, 14, 18, 24];
const LIGHT_Z = [3, 8];

/**
 * canopy_deck(x0, z0, x1, z1): the flat fuel canopy, y7..9, inclusive box. y7 is the soffit (smooth_quartz) with sea
 * lanterns on the light grid; y7 perimeter, y8 perimeter red stripe, y9 full top are white_concrete. y8 inside is air.
 */
export function canopy_deck(g, x0, z0, x1, z1, opts = {}) {
  const r = scope(g, [x0, 7, z0, x1, 9, z1], opts);
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    const light = LIGHT_X.some((d) => x === x0 + d) && LIGHT_Z.some((d) => z === z0 + d);
    r.put(x, 7, z, edge ? "white_concrete" : light ? "sea_lantern" : "smooth_quartz");
    if (edge) r.put(x, 8, z, "red_concrete");
    r.put(x, 9, z, "white_concrete");
  }
  return { placed: r.placed, skipped: r.skipped, box: r.box };
}

/**
 * fuel_pump(x, z): one pump, 2 wide (x..x+1), 1 deep (z), y2..4. The pump body is white_concrete at y2 with a
 * black_concrete screen at y3 on the x cell; the x+1 cell is an iron_chain hose hung at y2..3; red_concrete head at y4.
 * The island has two pumps, one at each of z14 and z15; z13 and z16 stay clear.
 */
export function fuel_pump(g, x, z, opts = {}) {
  const r = scope(g, [x, 2, z, x + 1, 4, z], opts);
  r.put(x, 2, z, "white_concrete");
  r.put(x, 3, z, "black_concrete");
  r.put(x, 4, z, "red_concrete");
  r.put(x + 1, 2, z, "iron_chain", { axis: "y" });
  r.put(x + 1, 3, z, "iron_chain", { axis: "y" });
  r.put(x + 1, 4, z, "red_concrete");
  return { placed: r.placed, skipped: r.skipped, box: r.box };
}

/**
 * curb_cut(x0, x1): asphalt (gray_concrete_powder) across the sidewalk cells at z5..6, y0. The sidewalk is an earlier
 * part's ground, so this needs { over: true }; without it every sidewalk cell is skipped.
 */
export function curb_cut(g, x0, x1, opts = {}) {
  const r = scope(g, [x0, 0, 5, x1, 0, 6], opts);
  for (let x = x0; x <= x1; x++) for (let z = 5; z <= 6; z++) r.put(x, 0, z, "gray_concrete_powder");
  return { placed: r.placed, skipped: r.skipped, box: r.box };
}

/**
 * awning(x0, x1): the storefront cantilever, smooth_quartz_slab (top type) at y5 over z22..23.
 */
export function awning(g, x0, x1, opts = {}) {
  const r = scope(g, [x0, 5, 22, x1, 5, 23], opts);
  for (let x = x0; x <= x1; x++) for (let z = 22; z <= 23; z++) r.put(x, 5, z, "smooth_quartz_slab", { type: "top" });
  return { placed: r.placed, skipped: r.skipped, box: r.box };
}

/**
 * brand_roundel(cx, cy, z): 3x3 roundel in the plane z, centred on (cx, cy): white_concrete ring, red_concrete centre.
 * The plan's roundel is brand_roundel(20, 8, 8).
 */
export function brand_roundel(g, cx, cy, z, opts = {}) {
  const r = scope(g, [cx - 1, cy - 1, z, cx + 1, cy + 1, z], opts);
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
    r.put(cx + dx, cy + dy, z, dx === 0 && dy === 0 ? "red_concrete" : "white_concrete");
  }
  return { placed: r.placed, skipped: r.skipped, box: r.box };
}

/**
 * price_pylon(x0, z0): the free-standing price sign. Panel x0..x0+3, two deep (z0..z0+1), y4..13: white frame on the
 * sides, black board y4..10, red head y11..13 with a white roundel at (x0+1..x0+2, 12, z0). Footing (polished_andesite)
 * y1..2 and a gray_concrete mast at y3 under the panel. Price digits are sea_lantern on the front, proud at z0-1, rows y5/7/9.
 */
export function price_pylon(g, x0, z0, opts = {}) {
  const r = scope(g, [x0, 1, z0 - 1, x0 + 3, 13, z0 + 1], opts);
  for (let z = z0; z <= z0 + 1; z++) {
    for (let x = x0 + 1; x <= x0 + 2; x++) {
      r.put(x, 1, z, "polished_andesite");
      r.put(x, 2, z, "polished_andesite");
      r.put(x, 3, z, "gray_concrete");
    }
    for (let x = x0; x <= x0 + 3; x++) for (let y = 4; y <= 13; y++) {
      const frame = x === x0 || x === x0 + 3;
      const roundel = y === 12 && z === z0 && (x === x0 + 1 || x === x0 + 2);
      const block = roundel ? "white_concrete" : y >= 11 ? "red_concrete" : frame ? "white_concrete" : "black_concrete";
      r.put(x, y, z, block);
    }
  }
  for (const y of [5, 7, 9]) for (let x = x0 + 1; x <= x0 + 2; x++) r.put(x, y, z0 - 1, "sea_lantern");
  return { placed: r.placed, skipped: r.skipped, box: r.box };
}

/**
 * light_pole(x, z): polished_andesite base at y1, gray_concrete shaft y2..5, standing lantern y6 on top. Nothing floats.
 */
export function light_pole(g, x, z, opts = {}) {
  const r = scope(g, [x, 1, z, x, 6, z], opts);
  r.put(x, 1, z, "polished_andesite");
  for (let y = 2; y <= 5; y++) r.put(x, y, z, "gray_concrete");
  r.put(x, 6, z, "lantern", { hanging: "false" });
  return { placed: r.placed, skipped: r.skipped, box: r.box };
}

/**
 * propane_cage(x, z): 2x2 footprint, y1..2. Four cauldrons at y1 are the stand; iron_bars at y2 over them form the cage,
 * each bar joined to its neighbours inside the 2x2.
 */
export function propane_cage(g, x, z, opts = {}) {
  const r = scope(g, [x, 1, z, x + 1, 2, z + 1], opts);
  for (let dx = 0; dx <= 1; dx++) for (let dz = 0; dz <= 1; dz++) {
    r.put(x + dx, 1, z + dz, "cauldron");
    r.put(x + dx, 2, z + dz, "iron_bars", {
      east: String(dx === 0), west: String(dx === 1), south: String(dz === 0), north: String(dz === 1),
    });
  }
  return { placed: r.placed, skipped: r.skipped, box: r.box };
}

/**
 * hedge_run(x0, x1, z): azalea hedge, two high (y1..2), persistent leaves. One cell in six is flowering_azalea.
 */
export function hedge_run(g, x0, x1, z, opts = {}) {
  const r = scope(g, [x0, 1, z, x1, 2, z], opts);
  for (let x = x0; x <= x1; x++) for (let y = 1; y <= 2; y++) {
    const flower = hash(x, y, z) % 6 === 0;
    r.put(x, y, z, flower ? "flowering_azalea" : "azalea_leaves", { persistent: "true" });
  }
  return { placed: r.placed, skipped: r.skipped, box: r.box };
}
