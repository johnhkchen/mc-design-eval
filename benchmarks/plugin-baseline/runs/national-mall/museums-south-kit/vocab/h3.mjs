// Seven helpers from plan.md's VOCABULARY (glass_bay, aircraft, lamp_post, tier, potomac_dome, pond, floodlight), plus
// strata_material, which tier uses. Each takes its position (and facing, where it has one) as arguments, so nothing is
// fixed to a spot, and writes only inside its own footprint. Writes go only into AIR: an earlier part owns the ground,
// floors and walls, so a cell that is not air is refused and listed. The one way past that is `replace: true`, used for a
// pond dug into the lot or a floodlight set flush in the paving. Each helper returns { placed, refused }.
// Block ids are 1.21.1 (the server's version): `iron_chain` is `chain` there.
import { dome } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// ---- writer --------------------------------------------------------------------------------------------------------
// `put` writes into air (anywhere when replace is set; `own` marks a cell the helper already wrote, e.g. the oculus
// over the dome). `view` is the same grid for brushes such as dome() that call g.set themselves, so the air rule holds
// for their cells too.
function kit(g, replace) {
  const out = { placed: 0, refused: [] };
  const put = (x, y, z, block, state, own = false) => {
    if (!g.inBounds(x, y, z) || (!own && !replace && !g.isAir(x, y, z))) { out.refused.push([x, y, z]); return; }
    g.set(x, y, z, block, state);
    out.placed++;
  };
  const view = new Proxy(g, {
    get: (t, p) => (p === "set" ? (x, y, z, block, state) => { put(x, y, z, block, state); return view; } : Reflect.get(t, p)),
  });
  return { put, view, out };
}

// Ellipse test from plan.md: (x, z) is inside E(cx, cz, rx, rz) when ((x-cx)/rx)^2 + ((z-cz)/rz)^2 <= 1.
const inEllipse = (x, z, cx, cz, rx, rz) => ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2 <= 1;

// ---- glass_bay(g, x0, x1, z0, z1, opts) ----------------------------------------------------------------------------
// NASM glass bay: gray glass walls y 2..8 on the north and south faces only (the ends are the cubes' flanks), transoms at
// y 5 and 8, mullions at the ends and every 3rd cell from x0 (opts.mullions overrides, e.g. the G2 door frame), a sill at
// y 1, and a flat roof glass at y 9 with polished_blackstone slab frame lines every 3 cells and a slab rim. Interior air.
export function glass_bay(g, x0, x1, z0, z1, opts = {}) {
  const k = kit(g, opts.replace);
  const mullion = (x) => (opts.mullions ? opts.mullions.includes(x) : x === x1 || (x - x0) % 3 === 0);
  for (const z of [z0, z1]) {
    for (let x = x0; x <= x1; x++) {
      k.put(x, 1, z, "polished_blackstone");
      for (let y = 2; y <= 8; y++) {
        const frame = y === 5 || y === 8 || mullion(x);
        k.put(x, y, z, frame ? "polished_blackstone" : "gray_stained_glass");
      }
    }
  }
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const frame = x === x0 || x === x1 || z === z0 || z === z1 || (x - x0) % 3 === 0 || (z - z0) % 3 === 0;
    if (frame) k.put(x, 9, z, "polished_blackstone_slab", { type: "bottom" });
    else k.put(x, 9, z, "gray_stained_glass");
  }
  return k.out;
}

// ---- aircraft(g, spec) ----------------------------------------------------------------------------------------------
// A light plane hung in a bay. spec: { x, y, z, span, len, hang, facing, fin, replace }. (x, z) is the body's minimum
// corner; the body is 2 wide, 2 high (y, y+1) and len long along the facing axis, nose at the facing end (south or east
// = high end, north or west = low end). Wings: a row of iron_trapdoor (closed, top half) across `span` cells at the body's
// mid, at y, skipping the body's own two columns. A tail fin rises `fin` cells (default 2) from the body's top at the tail.
// hang: the roof-frame y; chains (`chain`, axis y) run from each wing tip up to hang-1 (false = no chains).
// Keep y at 3 or more above the floor so a 2-high lane passes under the body.
export function aircraft(g, spec) {
  const { x, y, z, span, len, hang = false, facing = "south", fin = 2, replace = false } = spec;
  const k = kit(g, replace);
  const alongZ = facing === "north" || facing === "south";
  const noseHigh = facing === "south" || facing === "east";
  // u: 0 at the tail, len-1 at the nose; a: across the body (0..1 is the body, others wings); wy: world y
  const at = (u, a, wy) => {
    const s = noseHigh ? u : len - 1 - u;
    return alongZ ? [x + a, wy, z + s] : [x + s, wy, z + a];
  };
  const uMid = Math.floor((len - 1) / 2);
  const wingLo = -(span - 2) / 2, wingHi = 1 + (span - 2) / 2;
  for (let u = 0; u < len; u++) for (let a = 0; a < 2; a++) for (let h = 0; h < 2; h++) {
    k.put(...at(u, a, y + h), u === len - 1 ? "light_gray_concrete" : "white_concrete");
  }
  for (let a = wingLo; a <= wingHi; a++) {
    if (a >= 0 && a <= 1) continue;
    k.put(...at(uMid, a, y), "iron_trapdoor", { facing: "north", half: "top", open: "false" });
  }
  for (let h = 0; h < fin; h++) k.put(...at(0, 0, y + 2 + h), "white_concrete");
  if (hang !== false) {
    for (const a of [wingLo, wingHi]) for (let wy = y + 1; wy < hang; wy++) k.put(...at(uMid, a, wy), "chain", { axis: "y" });
  }
  return k.out;
}

// ---- lamp_post(g, x, y, z, opts) -----------------------------------------------------------------------------------
// Terrace lamp: granite_wall two high (a lone post: up true, no sides) with a standing lantern on top. y is the first
// cell above the ground.
export function lamp_post(g, x, y, z, opts = {}) {
  const k = kit(g, opts.replace);
  k.put(x, y, z, "granite_wall", { up: "true" });
  k.put(x, y + 1, z, "granite_wall", { up: "true" });
  k.put(x, y + 2, z, "lantern", { hanging: "false" });
  return k.out;
}

// ---- strata: the course table from plan.md FACADES (NMAI, absolute courses) ----------------------------------------
const STRATA = {
  1: "sandstone", 2: "sandstone", 3: "smooth_sandstone", 4: "cut_sandstone", 5: "smooth_sandstone",
  6: "sandstone", 7: "sandstone", 8: "orange_terracotta", 9: "cut_sandstone", 10: "sandstone",
  11: "smooth_sandstone", 12: "sandstone", 13: "cut_sandstone", 14: "cut_sandstone",
};
/** The block of course y at cell (x, z). About 1 cell in 10 of a non-band course is weathered yellow_terracotta. */
export function strata_material(y, x = 0, z = 0) {
  const m = STRATA[y] ?? "sandstone";
  return m !== "orange_terracotta" && (x * 31 + z * 17 + y * 7) % 10 === 0 ? "yellow_terracotta" : m;
}

// ---- tier(g, cx, cz, rx, rz, y0, y1, opts) -------------------------------------------------------------------------
// One curved NMAI tier: a solid floor course at y0 over the whole ellipse, then a wall ring 2 thick from y0+1 to y1,
// open at the top. Courses come from strata_material. opts.open = {cx, cz, rx, rz}: floor cells inside that ellipse are
// left out (the atrium under the dome, on the tiers above the ground floor).
export function tier(g, cx, cz, rx, rz, y0, y1, opts = {}) {
  const k = kit(g, opts.replace);
  const inner = (x, z) => rx > 2 && rz > 2 && inEllipse(x, z, cx, cz, rx - 2, rz - 2);
  for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
    for (let z = Math.floor(cz - rz) - 1; z <= Math.ceil(cz + rz) + 1; z++) {
      if (!inEllipse(x, z, cx, cz, rx, rz)) continue;
      const court = opts.open && inEllipse(x, z, opts.open.cx, opts.open.cz, opts.open.rx, opts.open.rz);
      if (!court) k.put(x, y0, z, strata_material(y0, x, z));
      if (inner(x, z)) continue;
      for (let y = y0 + 1; y <= y1; y++) k.put(x, y, z, strata_material(y, x, z));
    }
  }
  return k.out;
}

// ---- potomac_dome(g, center, radius, opts) -------------------------------------------------------------------------
// The NMAI dome: a hollow shallow dome of smooth_sandstone on a one-course cut_sandstone drum. center = [cx, y, cz] with
// y the drum's course. The oculus is light_gray_stained_glass over the 3x3 at the crown, with ochre_froglight under it.
export function potomac_dome(g, center, radius, opts = {}) {
  const k = kit(g, opts.replace);
  const [cx, y, cz] = center;
  // height 2 puts the crown at y+2 (plan: saucer to y16 over the drum at y14), not the shallow profile's default ~2.75
  dome(k.view, {
    center, radius, height: 2, profile: "shallow", block: "smooth_sandstone", stairsBlock: "smooth_sandstone_stairs",
    slabBlock: "smooth_sandstone_slab", hollow: true, drum: { height: 1, block: "cut_sandstone" },
  });
  // the crown of each oculus column: the highest dome cell there (found after the dome is laid)
  const crown = (x, z) => {
    for (let yy = y + radius + 4; yy > y; yy--) if (!g.isAir(x, yy, z)) return yy;
    return null;
  };
  for (let x = cx - 1; x <= cx + 1; x++) for (let z = cz - 1; z <= cz + 1; z++) {
    const top = crown(x, z);
    if (top === null) continue;
    k.put(x, top, z, "light_gray_stained_glass", undefined, true);
    k.put(x, top - 1, z, "ochre_froglight");
  }
  return k.out;
}

// ---- pond(g, spec) -------------------------------------------------------------------------------------------------
// The NMAI pond: water at y over the ellipse E(cx, cz, rx, rz), gravel bed at y-1 (the bed can be dug with replace).
// spec: { cx, cz, rx, rz, y, where, lanterns, lilies, reeds, replace }. where(x, z): an extra filter on the footprint
// (e.g. only the g = 0 cells). lanterns: [x, z] sea_lantern cells in the bed. lilies: [x, z] lily_pad cells on the
// surface. reeds: [x, y, z] sugar_cane cells on the rim.
export function pond(g, spec) {
  const { cx, cz, rx, rz, y, where = () => true, lanterns = [], lilies = [], reeds = [], replace = false } = spec;
  const k = kit(g, replace);
  const mine = (x, z) => inEllipse(x, z, cx, cz, rx, rz) && where(x, z);
  for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
    for (let z = Math.floor(cz - rz) - 1; z <= Math.ceil(cz + rz) + 1; z++) {
      if (!mine(x, z)) continue;
      k.put(x, y - 1, z, "gravel");
      k.put(x, y, z, "water");
    }
  }
  for (const [x, z] of lanterns) k.put(x, y - 1, z, "sea_lantern", undefined, mine(x, z));
  for (const [x, z] of lilies) k.put(x, y + 1, z, "lily_pad");
  for (const [x, cy, z] of reeds) k.put(x, cy, z, "sugar_cane");
  return k.out;
}

// ---- floodlight(g, x, y, z, opts) ----------------------------------------------------------------------------------
// A warm ochre_froglight set flush at (x, y, z), y being the paving or ground course. That cell is ground, so the helper
// needs { replace: true } to write it; without it the cell is refused as any non-air cell is.
export function floodlight(g, x, y, z, opts = {}) {
  const k = kit(g, opts.replace);
  k.put(x, y, z, "ochre_froglight");
  return k.out;
}
