// Roof generator — fitted gable parameters → clean constructed voxel geometry (T-104-01, S-104,
// epic E-27). "Constructs, not blobs" (Rule 3): the roof volume is REGENERATED from the roof-fit
// parameters as a SOLID stepped wedge in the kit's roof-field block, with the slope expressed the
// Minecraft-native way on its surface — STAIR treads (facing uphill, half=bottom, shape=straight —
// the proven T-097 CARD_ROWS vocabulary), SLAB half-steps where the quantized height lands on a
// half, and full blocks where the pitch demands (steep risers are carried by the uphill column's
// solid fill). Solid infill is what keeps the T-102 cage tractable downstream: closure holds
// because every stair/slab sits on wedge mass, and gable-end walls fill to the ridge for free.
//
// MULTI-GABLE COMPOSITION: intersecting gables (the cottage's main + cross gable) compose by
// per-column MAX over each gable's own min-of-planes surface — valleys fall out naturally; the
// winning gable's active constraint names the downhill direction the stair program needs. Hip ends
// ("where the fit demands", detected by roof-fit) are extra end planes inside the same min.
//
// BLOCK FAMILY FROM THE KIT (E-26): the roof-field cube row names the family; stair/slab ids are
// derived by name morphology and verified against an INJECTED block vocabulary — a missing shaped
// block is a NAMED finding with a full-block fallback, never an invented id (an `unmapped` render
// is a failure, Rule 3).
//
// PURE — no I/O, no GL, no Date/random; runs under the `src/**/*.test.mjs` glob.

import { evalSideHeight, gableSurfaceHeight } from "../form/roof-fit.mjs";

/** Stair `facing` for an UPHILL direction (the stair's full half backs onto the rise). */
export const STAIR_FACING = Object.freeze({ "+x": "east", "-x": "west", "+z": "south", "-z": "north" });

const FLIP = Object.freeze({ "+x": "-x", "-x": "+x", "+z": "-z", "-z": "+z" });
const DELTA = Object.freeze({ "+x": [1, 0], "-x": [-1, 0], "+z": [0, 1], "-z": [0, -1] });
const roundHalf = (v) => Math.round(v * 2) / 2;

/** Stem a cube block id for shaped-family derivation (spruce_planks→spruce, *_bricks→*_brick). */
function familyStem(id) {
  if (id.endsWith("_planks")) return id.slice(0, -"_planks".length);
  if (id.endsWith("_bricks") || id.endsWith("_tiles")) return id.slice(0, -1);
  return id;
}

/**
 * The course family from an E-26 kit: the roof-field cube row + vocabulary-verified stair/slab
 * derivations. Missing pieces are NAMED findings (full-block fallback), never invented ids.
 * @param {object[]} kitRows the kit record's `kit` array ({block, role, formClass, whereUsed})
 * @param {Set<string>} vocab known block ids (the caller injects minecraft-data's name set)
 * @returns {{field:string|null, stairs:string|null, slab:string|null, findings:object[]}}
 */
export function roofFamily(kitRows, vocab) {
  const findings = [];
  const cubes = (kitRows ?? []).filter((r) => r.formClass === "cube" && (r.whereUsed ?? []).includes("roof"));
  const field = cubes.find((r) => /field/i.test(r.role ?? "")) ?? cubes[0] ?? null;
  if (!field) {
    findings.push({ code: "kit-roof-field-missing", detail: "no cube kit row tagged for the roof — cannot derive a course family" });
    return { field: null, stairs: null, slab: null, findings };
  }
  const stem = familyStem(field.block);
  const out = { field: field.block, stairs: null, slab: null, findings };
  for (const [key, id] of [["stairs", `${stem}_stairs`], ["slab", `${stem}_slab`]]) {
    if (vocab?.has(id)) out[key] = id;
    else findings.push({ code: `kit-roof-${key}-missing`, detail: `${id} not in the block vocabulary — full-block fallback for ${key}` });
  }
  return out;
}

// The gable surface itself lives in roof-fit (gableSurfaceHeight) — ONE definition shared by the
// generator and the fit-error measure, so hip clipping can never read as 'error' (the gatehouse
// lesson). This module adds only the construction-facing question: which way is downhill.

/** The downhill direction of a gable's ACTIVE constraint at a column (null at the ridge cap). */
function gableDownhillAt(gable, x, z, h) {
  if (h >= gable.ridge.y) return null;
  let best = null;
  let bestH = Infinity;
  for (const side of gable.sides) {
    const sh = evalSideHeight(side, gable.ridge.y, x, z);
    if (sh < bestH) { bestH = sh; best = side.eaveDir; }
  }
  if (gable.hip?.demanded) {
    const v = gable.ridge.axis === "x" ? x : z;
    const eave = Math.min(...gable.sides.map((s) => s.eaveY));
    const pitch = gable.sides.reduce((s, x2) => s + x2.pitch, 0) / gable.sides.length;
    const fLo = gable.ridge.axis === "x" ? gable.footprint.bbox.minX : gable.footprint.bbox.minZ;
    const fHi = gable.ridge.axis === "x" ? gable.footprint.bbox.maxX : gable.footprint.bbox.maxZ;
    const loDir = gable.ridge.axis === "x" ? "-x" : "-z";
    const hiDir = gable.ridge.axis === "x" ? "+x" : "+z";
    if (gable.hip.lo && eave + pitch * (v - fLo) < bestH) { bestH = eave + pitch * (v - fLo); best = loDir; }
    if (gable.hip.hi && eave + pitch * (fHi - v) < bestH) { bestH = eave + pitch * (fHi - v); best = hiDir; }
  }
  return best;
}

/**
 * Compose the generated roof heightfield over all SANE gables: per column, the highest gable's
 * surface wins (valleys at intersections); heights quantized to halves.
 *
 * FITTED ENDS (T-108-01): a gable carrying `ends` (roof-end-fit) is TRIMMED along its ridge axis —
 * columns past `ends.{lo,hi}.coord` are not generated (the swap still carves them: the blob past
 * the fitted verge tip is removed, not kept) — and columns past `ends.{lo,hi}.faceCoord` are
 * marked `sheet`: the verge/eave-overhang strip gets the surface course only, open underside.
 * A solid winner overrides a sheet loser at shared columns (per-column max, unchanged).
 * @param {object[]} gables roof-fit gables (insane ones are skipped by the caller's filter)
 * @returns {{heights:Map<string,number>,
 *            owner:Map<string,{gableId:string, downhill:string|null, sheet:boolean}>,
 *            bandFloor:number}}
 */
export function roofHeightfield(gables) {
  const heights = new Map();
  const owner = new Map();
  let bandFloor = Infinity;
  for (const g of gables) {
    for (const s of g.sides) bandFloor = Math.min(bandFloor, Math.floor(s.eaveY));
    const vIdx = g.ridge.axis === "x" ? 0 : 1;
    const lo = g.ends?.lo ?? null;
    const hi = g.ends?.hi ?? null;
    for (const key of g.footprint.cols) {
      const [x, z] = key.split(",").map(Number);
      const v = vIdx === 0 ? x : z;
      if ((hi && v > hi.coord) || (lo && v < lo.coord)) continue; // past the fitted verge tip
      const sheet = Boolean((hi && v > hi.faceCoord) || (lo && v < lo.faceCoord));
      const h = roundHalf(gableSurfaceHeight(g, x, z));
      if (!heights.has(key) || h > heights.get(key)) {
        heights.set(key, h);
        // cap (T-109-01): the column sits on the owning gable's RIDGE LINE — the surface equals
        // the (possibly ridge-fitted) ridge height; the generator marks the cap course so the
        // ridge is a declared construction, not an incidental heightfield top.
        const cap = h === roundHalf(g.ridge.y);
        owner.set(key, { gableId: g.id, downhill: gableDownhillAt(g, x, z, h), sheet, cap });
      }
    }
  }
  return { heights, owner, bandFloor: Number.isFinite(bandFloor) ? bandFloor : 0 };
}

/**
 * Generate the roof cells from sane gables + the kit family: solid wedge from the band floor up,
 * stair treads on whole-step edges, slabs on half-steps, full blocks everywhere else. SHEET
 * columns (the fitted verge/eave-overhang strips, see {@link roofHeightfield}) place the surface
 * course only — the underside stays open, which is what makes an overhang read as one.
 * @returns {{cells:{pos:number[], block:string, form?:string, state?:object}[],
 *            counts:{full:number, stairs:number, slabs:number, cap:number},
 *            heights:Map<string,number>, owner:Map<string,object>, bandFloor:number,
 *            sheetKeys:Set<string>, capKeys:Set<string>}} sheetKeys = "x,y,z" of every
 *            sheet-column cell — declared construction whose open underside exposes ≥4 faces BY
 *            DESIGN (census exclusion). capKeys (T-109-01) = the ridge CAP COURSE cells — one per
 *            ridge column (the top full course, or the half-step slab when the fitted ridge lands
 *            on a half); counts.cap = cap columns. A marking, not a new shape: emission is
 *            unchanged, so the unmapped gate keeps proving every state.
 */
export function generateRoof(gables, family, opts = {}) {
  const sane = gables.filter((g) => g.sane);
  const { heights, owner, bandFloor } = roofHeightfield(sane);
  const floor = opts.bandFloor ?? bandFloor;
  const cells = [];
  const counts = { full: 0, stairs: 0, slabs: 0, cap: 0 };
  const sheetKeys = new Set();
  const capKeys = new Set();
  if (!family?.field) return { cells, counts, heights, owner, bandFloor: floor, sheetKeys, capKeys };

  for (const [key, h] of heights) {
    const [x, z] = key.split(",").map(Number);
    const hInt = Math.floor(h);
    const half = h - hInt > 0;
    const own = owner.get(key);
    const d = own?.downhill ?? null;
    const at = (dir) => {
      const [dx, dz] = DELTA[dir];
      return heights.get(`${x + dx},${z + dz}`);
    };
    // stair tread: a whole-step edge — drops toward the eave, rises toward the ridge
    const stair = !half && family.stairs && d !== null &&
      (at(d) === undefined || at(d) <= h - 1) && (at(FLIP[d]) ?? -Infinity) >= h + 1;
    const top = hInt;
    for (let y = own?.sheet ? top : floor; y <= top; y++) {
      if (y === top && stair) {
        cells.push({ pos: [x, y, z], block: family.stairs, form: "fixture",
          state: { facing: STAIR_FACING[FLIP[d]], half: "bottom", shape: "straight" } });
        counts.stairs++;
      } else {
        cells.push({ pos: [x, y, z], block: family.field });
        counts.full++;
      }
      if (own?.sheet) sheetKeys.add(`${x},${y},${z}`);
    }
    const slabbed = half && family.slab;
    if (slabbed) {
      cells.push({ pos: [x, top + 1, z], block: family.slab, form: "fixture", state: { type: "bottom" } });
      counts.slabs++;
      if (own?.sheet) sheetKeys.add(`${x},${top + 1},${z}`);
    }
    if (own?.cap) {
      counts.cap++;
      capKeys.add(slabbed ? `${x},${top + 1},${z}` : `${x},${top},${z}`);
    }
  }
  return { cells, counts, heights, owner, bandFloor: floor, sheetKeys, capKeys };
}
