// Lumber Hall vocabulary, set 2 (plan.md VOCABULARY: beam, windowUnit, hoistBeam, cartArch, shopFront, awning,
// woodPile). Every helper takes its position (and facing) as arguments and returns { placed, refused }. Each one writes
// only inside its own footprint box, and only into air, unless opts.replace is true; a refused write is listed as
// "x,y,z" so the caller can report it. Facings are the toolkit's: stairs face their back side (so an awning that
// rises out to the street faces out), trapdoors face the side they hinge from.
// Streets: north = z 5 (fascia plane), south = z 32 (the mirror of 5 about 18.5). Pass opts.z to put a front elsewhere.
// Helpers that run along a wall (awning, shopFront) take north or south only; windowUnit takes all four faces.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FRONT_Z = { north: 5, south: 32 };
const OUT = { north: -1, south: 1 };                 // the z step that leaves the building on that street
const WOODS = ["oak", "spruce", "birch", "jungle", "acacia", "dark_oak"];
const FRAME = "stripped_dark_oak";                    // B.log / B.wood add the _log / _wood suffix
const BUSINESS_WOOD = { OAK: "oak", SPRUCE: "spruce", BIRCH: "birch", JUNGLE: "jungle", ACACIA: "acacia", "DK OAK": "dark_oak" };

function need(value, list, what) {
  if (!list.includes(value)) throw new TypeError(`${what} must be one of ${list.join(", ")}, got ${value}`);
}

// A write session over one footprint box. put() writes into air inside the box; anything else is refused.
function footprint(g, [a, b], opts = {}) {
  const lo = a.map((v, i) => Math.min(v, b[i])), hi = a.map((v, i) => Math.max(v, b[i]));
  const out = { placed: 0, refused: [] };
  const put = (x, y, z, block, state) => {
    const inside = x >= lo[0] && x <= hi[0] && y >= lo[1] && y <= hi[1] && z >= lo[2] && z <= hi[2];
    if (!inside || (!opts.replace && !g.isAir(x, y, z))) { out.refused.push(`${x},${y},${z}`); return; }
    g.set(x, y, z, block, state);
    out.placed++;
  };
  return { put, out };
}

// Horizontal run of stripped dark oak along x (fixed y, z) or along z (fixed y, and x = the z argument).
// Its two end cells are stripped_dark_oak_wood, the rest stripped_dark_oak_log, both with the run's axis.
/** beam(g, x0, x1, y, z, axis): axis "x": cells x0..x1 at (y, z). axis "z": cells z0..z1 (x0, x1) at x = z, y. */
export function beam(g, x0, x1, y, z, axis = "x", opts = {}) {
  need(axis, ["x", "z"], "beam axis");
  const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
  const box = axis === "x" ? [[lo, y, z], [hi, y, z]] : [[z, y, lo], [z, y, hi]];
  const { put, out } = footprint(g, box, opts);
  for (let i = lo; i <= hi; i++) {
    const end = i === lo || i === hi;
    const [block, state] = end ? B.wood(FRAME, axis) : B.log(FRAME, axis);
    if (axis === "x") put(i, y, z, block, state);
    else put(z, y, i, block, state);
  }
  return out;
}

/**
 * windowUnit(g, x, y, z, face): a 1 x 2 glass pane in the wall at (x, y, z) (lower cell), a dark oak slab sill below it,
 * and an open dark oak trapdoor shutter each side of the pane, two high. The wall is one thick: nothing is set behind.
 */
export function windowUnit(g, x, y, z, fc, opts = {}) {
  need(fc, ["north", "south", "east", "west"], "windowUnit face");
  const along = fc === "north" || fc === "south" ? [1, 0] : [0, 1];        // unit step along the wall, as [dx, dz]
  const box = along[0] ? [[x - 1, y - 1, z], [x + 1, y + 1, z]] : [[x, y - 1, z - 1], [x, y + 1, z + 1]];
  const { put, out } = footprint(g, box, opts);
  const glass = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  put(x, y, z, "glass_pane", glass);
  put(x, y + 1, z, "glass_pane", glass);
  put(x, y - 1, z, ...B.slab("dark_oak", "bottom"));
  for (const s of [-1, 1]) for (const dy of [0, 1]) {
    const [block, state] = B.trapdoor("dark_oak", fc, "bottom", true);
    put(x + s * along[0], y + dy, z + s * along[1], block, state);
  }
  return out;
}

/**
 * hoistBeam(g, x, z0, z1, face): the hoist beam of one street. Two logs (x and x + 1) at y 30 running from z0 to z1,
 * stripped_dark_oak_wood on the outer end (z0 north, z1 south). An iron chain hangs from the beam at (x, 26..29) one
 * cell in from the outer end.
 */
export function hoistBeam(g, x, z0, z1, fc, opts = {}) {
  need(fc, ["north", "south"], "hoistBeam face");
  const lo = Math.min(z0, z1), hi = Math.max(z0, z1);
  const outer = fc === "south" ? hi : lo;
  const chainZ = outer - OUT[fc];                    // one cell in from the outer end, toward the wall
  const { put, out } = footprint(g, [[x, 26, lo], [x + 1, 30, hi]], opts);
  for (const lx of [x, x + 1]) for (let z = lo; z <= hi; z++) {
    const [block, state] = z === outer ? B.wood(FRAME, "z") : B.log(FRAME, "z");
    put(lx, 30, z, block, state);
  }
  for (let y = 26; y <= 29; y++) put(x, y, chainZ, ...B.chain("y"));
  return out;
}

/**
 * cartArch(g, xc, z, face): the cart passage opening in the street wall at plane z, centred on x = xc. The 5 x 5 opening
 * (x xc-2..xc+2, y 5..9) is cut to air whatever the wall holds, then the two top corners get upside-down dark oak stairs
 * (back to the wall) and the lintel y 10..11 is laid where it is air. The cobbled jambs are the plinth and end-bay walls
 * the shell already owns, so this helper writes none.
 */
export function cartArch(g, xc, z, fc, opts = {}) {
  need(fc, ["north", "south"], "cartArch face");
  const { put, out } = footprint(g, [[xc - 2, 5, z], [xc + 2, 11, z]], opts);
  let carved = 0;
  for (let x = xc - 2; x <= xc + 2; x++) for (let y = 5; y <= 9; y++) {
    g.set(x, y, z, "minecraft:air");
    carved++;
  }
  put(xc - 2, 9, z, ...B.stairs("dark_oak", "west", "top"));
  put(xc + 2, 9, z, ...B.stairs("dark_oak", "east", "top"));
  for (let x = xc - 2; x <= xc + 2; x++) for (const y of [10, 11]) put(x, y, z, ...B.log(FRAME, "x"));
  return { ...out, carved };
}

/**
 * awning(g, x0, x1, face, wood, opts): the sloping awning over a shop frontage from x0 to x1 (inclusive). Per column:
 * <wood>_stairs at (x, 9, P+o) and (x, 10, P+2o), facing out, with an open <wood>_trapdoor valance at (x, 9, P+2o), where
 * P is the street plane (opts.z) and o the step out of the building. Nothing is written below y 9 in the cells next to the wall.
 */
export function awning(g, x0, x1, fc, wood, opts = {}) {
  need(fc, ["north", "south"], "awning face");
  need(wood, WOODS, "awning wood");
  const P = opts.z ?? FRONT_Z[fc], o = OUT[fc];
  const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
  const zLo = Math.min(P + o, P + 2 * o), zHi = Math.max(P + o, P + 2 * o);
  const { put, out } = footprint(g, [[lo, 9, zLo], [hi, 10, zHi]], opts);
  for (let x = lo; x <= hi; x++) {
    put(x, 9, P + o, ...B.stairs(wood, fc, "bottom"));
    put(x, 10, P + 2 * o, ...B.stairs(wood, fc, "bottom"));
    put(x, 9, P + 2 * o, ...B.trapdoor(wood, fc, "bottom", true));
  }
  return out;
}

/** shopFront(g, biz, x0, face, opts): one business's awning over its 7-wide frontage from x0 (biz is a plan name, e.g. "OAK"). */
export function shopFront(g, biz, x0, fc, opts = {}) {
  need(biz, Object.keys(BUSINESS_WOOD), "shopFront business");
  const wood = BUSINESS_WOOD[biz];
  return { wood, ...awning(g, x0, x0 + 6, fc, wood, opts) };
}

/**
 * woodPile(g, x, y, z, len, wood, opts): a stack of one wood, len long (opts.axis "x": along x, two cells across z;
 * "z": along z, two cells across x). A <wood>_planks layer at y, then two layers of <wood>_log at y+1 and y+2 (3 high).
 * Footprint: len x 2 x 3. The pile does not reach past its two cells across, so a lane one cell beyond it stays clear
 * (the cart passage pile sits at x 35..36 and leaves the x 37 lane open).
 */
export function woodPile(g, x, y, z, len, wood, opts = {}) {
  need(wood, WOODS, "woodPile wood");
  const axis = opts.axis ?? "x";
  need(axis, ["x", "z"], "woodPile axis");
  const box = axis === "x" ? [[x, y, z], [x + len - 1, y + 2, z + 1]] : [[x, y, z], [x + 1, y + 2, z + len - 1]];
  const { put, out } = footprint(g, box, opts);
  for (let i = 0; i < len; i++) for (let k = 0; k < 2; k++) {
    const [px, pz] = axis === "x" ? [x + i, z + k] : [x + k, z + i];
    put(px, y, pz, ...B.block(`${wood}_planks`));
    put(px, y + 1, pz, ...B.log(wood, axis));
    put(px, y + 2, pz, ...B.log(wood, axis));
  }
  return out;
}
