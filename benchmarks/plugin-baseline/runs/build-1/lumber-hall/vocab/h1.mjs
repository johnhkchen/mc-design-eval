// Lumber Hall vocabulary, set 1 (plan.md VOCABULARY: post, jettyBracket, gableFrame, monitorVent, hatchLadder,
// pierPanel, lampPost, pavingPatch). Every helper takes its position as arguments and returns { placed, refused }.
// Each one writes only inside its own footprint box, and only into air, unless opts.replace is true; a write it
// refuses is listed as "x,y,z" so the caller can report it. Facings are the toolkit's: stairs face their back side,
// trapdoors face the side they hinge from, ladders face the way they face (away from their wall).
// North form only: pass the south z (37 - z) and flip facings yourself, as the plan's mirror rule says.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const DIRS = ["north", "south", "east", "west"];
const WOODS = ["oak", "spruce", "birch", "jungle", "acacia", "dark_oak"];

function need(value, list, what) {
  if (!list.includes(value)) throw new TypeError(`${what} must be one of ${list.join(", ")}, got ${value}`);
}

// A write session over one footprint box. put() writes into air inside the box; anything else is refused.
function footprint(g, [a, b], opts = {}) {
  const lo = a.map((v, i) => Math.min(v, b[i])), hi = a.map((v, i) => Math.max(v, b[i]));
  const out = { placed: 0, refused: [] };
  const put = (x, y, z, block, state, nbt) => {
    const inside = x >= lo[0] && x <= hi[0] && y >= lo[1] && y <= hi[1] && z >= lo[2] && z <= hi[2];
    if (!inside || (!opts.replace && !g.isAir(x, y, z))) { out.refused.push(`${x},${y},${z}`); return; }
    g.set(x, y, z, block, state, nbt);
    out.placed++;
  };
  return { put, out };
}

/** Stripped dark oak post, axis y, from y0 to y1 (either order) at (x, z). */
export function post(g, x, y0, y1, z, opts = {}) {
  const lo = Math.min(y0, y1), hi = Math.max(y0, y1);
  const { put, out } = footprint(g, [[x, lo, z], [x, hi, z]], opts);
  for (let y = lo; y <= hi; y++) put(x, y, z, ...B.log("stripped_dark_oak", "y"));
  return out;
}

/**
 * One dark oak stair bracket under a first-floor or loft post: half top, facing = the stairs' back (toward the wall),
 * so its lip stands out toward the street.
 */
export function jettyBracket(g, x, y, z, facing, opts = {}) {
  need(facing, DIRS, "facing");
  const { put, out } = footprint(g, [[x, y, z], [x, y, z]], opts);
  put(x, y, z, ...B.stairs("dark_oak", facing, "top"));
  return out;
}

/**
 * Timber-framed gable triangle over the wall at z, spanning x0..x1 (a 45-degree roof, eave y24, ridge at the middle).
 * Stepped rafters on the roof line (cut ends at the eaves), a king post pair at the middle, two diagonal dark oak
 * braces per side, and calcite infill under the rafters. Framing lies in the wall plane, so face only names the side
 * the gable looks out of (2D geometry is the same for north and south).
 */
export function gableFrame(g, x0, x1, z, face, opts = {}) {
  need(face, ["north", "south"], "face");
  const lo = Math.min(x0, x1), hi = Math.max(x0, x1), eave = 24;
  const top = (x) => eave + Math.min(x - lo, hi - x);            // rafter height over column x
  const kl = Math.floor((lo + hi) / 2), kr = kl + 1;              // king post pair
  const { put, out } = footprint(g, [[lo, eave, z], [hi, eave + 10, z]], opts);

  for (let x = lo; x <= hi; x++) {
    if (x === lo || x === hi) put(x, eave, z, ...B.wood("stripped_dark_oak", "x"));
    else put(x, top(x), z, ...B.log("stripped_dark_oak", "x"));
  }
  for (const x of [kl, kr]) for (let y = eave; y < top(x); y++) put(x, y, z, ...B.log("stripped_dark_oak", "y"));

  // braces rise from the eave-side wall to the king posts; two per side, one above the other
  const brace = (xFrom, yFrom, xTo, yTo, facing) => {
    const n = Math.max(1, Math.abs(xTo - xFrom)), step = Math.sign(xTo - xFrom) || 1;
    for (let i = 0; i <= n; i++) put(xFrom + step * i, Math.round(yFrom + ((yTo - yFrom) * i) / n), z, ...B.stairs("dark_oak", facing, "bottom"));
  };
  for (let i = 0; i < 2; i++) {
    brace(lo + 3, eave + 2 * i, kl - 1, eave + 3 + 2 * i, "east");
    brace(hi - 3, eave + 2 * i, kr + 1, eave + 3 + 2 * i, "west");
  }

  // infill last: it fills only what the framing left open (framed cells are skipped, not refused)
  for (let x = lo; x <= hi; x++) for (let y = eave; y < top(x); y++) if (g.isAir(x, y, z)) put(x, y, z, ...B.block("calcite"));
  return out;
}

/**
 * Ridge louvre: a box x0..x1 by z0..z1, three high. Dark oak slab caps at y and y+2, and open dark oak trapdoors at
 * y+1 on both long sides, one per row along z (the vent's louvres).
 */
export function monitorVent(g, x0, x1, y, z0, z1, opts = {}) {
  const xa = Math.min(x0, x1), xb = Math.max(x0, x1), za = Math.min(z0, z1), zb = Math.max(z0, z1);
  const { put, out } = footprint(g, [[xa, y, za], [xb, y + 2, zb]], opts);
  for (let x = xa; x <= xb; x++) for (let z = za; z <= zb; z++) {
    put(x, y, z, ...B.slab("dark_oak", "bottom"));
    put(x, y + 2, z, ...B.slab("dark_oak", "top"));
  }
  for (let z = za; z <= zb; z++) {
    put(xa, y + 1, z, ...B.trapdoor("dark_oak", "west", "top", true));
    put(xb, y + 1, z, ...B.trapdoor("dark_oak", "east", "top", true));
  }
  return out;
}

/**
 * Keeper's ladder up a pocket's back wall: ladder y5..11 at (x, z) facing `facing` (away from its wall), and a closed
 * dark oak trapdoor in the store floor at y12. The clear lane in front of it (y5..6, the cells the ladder faces) is never
 * written, so it stays open. The pocket must be three wide and the hatch cell must be air (the shell leaves it open).
 */
export function hatchLadder(g, x, z, facing, opts = {}) {
  need(facing, DIRS, "facing");
  const { put, out } = footprint(g, [[x, 5, z], [x, 12, z]], opts);
  for (let y = 5; y <= 11; y++) put(x, y, z, "ladder", { facing, waterlogged: "false" });
  put(x, 12, z, ...B.trapdoor("dark_oak", facing, "top", false));
  return out;
}

/**
 * Pier panel on a shop face: stripped dark oak pier y9..11 at the fascia plane (north z5, south z32), and two
 * <wood>_log logs axis z at y9..10 on the face in front of it (z4 / z33), log ends toward the street.
 */
export function pierPanel(g, x, face, wood, opts = {}) {
  need(face, ["north", "south"], "face");
  need(wood, WOODS, "wood");
  const pier = face === "north" ? 5 : 32, panel = face === "north" ? 4 : 33;
  const { put, out } = footprint(g, [[x, 9, Math.min(pier, panel)], [x, 11, Math.max(pier, panel)]], opts);
  for (let y = 9; y <= 11; y++) put(x, y, pier, ...B.log("stripped_dark_oak", "y"));
  for (let y = 9; y <= 10; y++) put(x, y, panel, ...B.log(wood, "z"));
  return out;
}

/** Lamp post: dark oak fence y5..7 with a standing lantern on top at y8, at (x, z). */
export function lampPost(g, x, z, opts = {}) {
  const { put, out } = footprint(g, [[x, 5, z], [x, 8, z]], opts);
  for (let y = 5; y <= 7; y++) put(x, y, z, ...B.fence("dark_oak"));
  put(x, 8, z, ...B.lantern(false));
  return out;
}

/**
 * Paving on the pavement top (y4) over x0..x1, z0..z1: polished andesite with andesite in 1 of 6 cells (a fixed
 * pattern, so repeat builds match), and cobblestone gutters on the street edge rows z0 and z37. The podium below is
 * ground, so this writes over it only with opts.replace (the pavement is laid over the podium).
 */
export function pavingPatch(g, x0, x1, z0, z1, opts = {}) {
  const { put, out } = footprint(g, [[x0, 4, z0], [x1, 4, z1]], opts);
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) {
    const block = z === 0 || z === 37 ? "cobblestone" : (x * 5 + z * 3) % 6 === 0 ? "andesite" : "polished_andesite";
    put(x, 4, z, block);
  }
  return out;
}
