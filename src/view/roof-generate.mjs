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

import { evalSideHeight, gableSurfaceHeight, hipEndPlanes, hipPlaneHeight } from "../form/roof-fit.mjs";

/** Stair `facing` for an UPHILL direction (the stair's full half backs onto the rise). */
export const STAIR_FACING = Object.freeze({ "+x": "east", "-x": "west", "+z": "south", "-z": "north" });

const FLIP = Object.freeze({ "+x": "-x", "-x": "+x", "+z": "-z", "-z": "+z" });
const DELTA = Object.freeze({ "+x": [1, 0], "-x": [-1, 0], "+z": [0, 1], "-z": [0, -1] });
/** The two directions perpendicular to a downhill direction. */
const PERP = Object.freeze({ "+x": ["+z", "-z"], "-x": ["+z", "-z"], "+z": ["+x", "-x"], "-z": ["+x", "-x"] });
/** The direction to your LEFT when facing the key direction (+x=east, −z=north). */
const LEFT_DIR = Object.freeze({ "+x": "-z", "-x": "+z", "+z": "+x", "-z": "-x" });
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

/** Every column key of an inclusive footprint rect. */
export function colsOf({ x0, x1, z0, z1 }) {
  const cols = new Set();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) cols.add(`${x},${z}`);
  return cols;
}

/**
 * The columns of a gable's two VERTICAL TRIANGULAR END FACES (T-150-01) — the outermost slice along
 * the ridge axis: ridge=x → x∈{minX,maxX}; ridge=z → z∈{minZ,maxZ}. These are the gable-end *walls*
 * (envelope), not the sloped covering. A HIP end has no vertical triangular face (the slope wraps the
 * end), so a hip-demanded gable returns EMPTY — never name a hip end as a wall. PURE.
 * @returns {Set<string>} "x,z" keys, ⊆ the gable footprint.
 */
export function gableEndColumns(gable) {
  const out = new Set();
  if (gable.hip?.demanded) return out; // hip ends are sloped, not vertical walls
  const axis = gable.ridge.axis;
  const { minX, maxX, minZ, maxZ } = gable.footprint.bbox;
  const lo = axis === "x" ? minX : minZ;
  const hi = axis === "x" ? maxX : maxZ;
  for (const key of gable.footprint.cols) {
    const [x, z] = key.split(",").map(Number);
    const v = axis === "x" ? x : z;
    if (v === lo || v === hi) out.add(key);
  }
  return out;
}

/**
 * Build the 2-sided PROGRAM gable record {@link generateRoof} consumes (the roof-generate
 * fixture shape) — the shared record builder for the registry's roof constructs (roof.gable,
 * roof.hip, roof.gable.steep). Lives beside its consumer so brush modules can reuse it without
 * importing the registry (T-134-01).
 */
export function gableRecord({ footprint, ridgeAxis, eaveY, ridgeY, pitch, hip }) {
  const { x0, x1, z0, z1 } = footprint;
  const sides = ridgeAxis === "z"
    ? [
        { planeId: "program-a", eaveDir: "+x", pitch, pitchSource: "program", eaveY, eaveEdge: x1, extentCells: [] },
        { planeId: "program-b", eaveDir: "-x", pitch, pitchSource: "program", eaveY, eaveEdge: x0, extentCells: [] },
      ]
    : [
        { planeId: "program-a", eaveDir: "+z", pitch, pitchSource: "program", eaveY, eaveEdge: z1, extentCells: [] },
        { planeId: "program-b", eaveDir: "-z", pitch, pitchSource: "program", eaveY, eaveEdge: z0, extentCells: [] },
      ];
  return {
    id: `program-gable-${ridgeAxis}`,
    ridge: { axis: ridgeAxis, y: ridgeY },
    sides,
    footprint: { cols: colsOf(footprint), bbox: { minX: x0, maxX: x1, minZ: z0, maxZ: z1 }, area: (x1 - x0 + 1) * (z1 - z0 + 1) },
    hip: hip ?? { demanded: false, lo: false, hi: false },
    sane: true,
    reasons: [],
  };
}

/**
 * The stair SHAPE at a column from its neighborhood (T-112-01) — Minecraft's corner vocabulary
 * for the diagonal arrises and valleys hip constructions introduce. `probe(dir)` returns the
 * neighbor height (undefined past the roof). Relative to downhill `d` at height `h`:
 *   • exactly one perpendicular neighbor DROPS (≤ h−1 / absent) → a convex hip arris:
 *     `outer_left|outer_right` (side relative to `facing` = uphill, the stair's own frame);
 *   • exactly one perpendicular neighbor RISES (≥ h+1) → a valley seat: `inner_left|inner_right`;
 *   • BOTH drop → a promontory cell: no stair (`{stair:false}`) — the solid full block is the
 *     honest mass, never an invented turn;
 *   • otherwise → the straight tread.
 * Emission is GATED to hip-construction owners (hip-cap gables / fitted hip ends): legacy gables
 * — including the cottage's multi-gable valleys — keep today's straight-only output verbatim.
 * PURE; exported for the exhaustive unit tests.
 */
export function stairShape(d, h, probe) {
  const drop = (dir) => {
    const v = probe(dir);
    return v === undefined || v <= h - 1;
  };
  const rise = (dir) => (probe(dir) ?? -Infinity) >= h + 1;
  const [p1, p2] = PERP[d];
  const d1 = drop(p1);
  const d2 = drop(p2);
  if (d1 && d2) return { stair: false, shape: null };
  const facing = FLIP[d];
  if (d1 !== d2) {
    const p = d1 ? p1 : p2;
    return { stair: true, shape: p === LEFT_DIR[facing] ? "outer_left" : "outer_right" };
  }
  const r1 = rise(p1);
  const r2 = rise(p2);
  if (r1 !== r2) {
    const p = r1 ? p1 : p2;
    return { stair: true, shape: p === LEFT_DIR[facing] ? "inner_left" : "inner_right" };
  }
  return { stair: true, shape: "straight" };
}

/** The downhill direction of a gable's ACTIVE constraint at a column (null at the ridge cap).
 *  Hip end planes come from roof-fit's hipEndPlanes — the same single definition the surface
 *  uses (T-112-01), so the downhill answer can never diverge from the realized geometry. */
function gableDownhillAt(gable, x, z, h) {
  if (h >= gable.ridge.y) return null;
  let best = null;
  let bestH = Infinity;
  for (const side of gable.sides) {
    const sh = evalSideHeight(side, gable.ridge.y, x, z);
    if (sh < bestH) { bestH = sh; best = side.eaveDir; }
  }
  const v = gable.ridge.axis === "x" ? x : z;
  for (const p of hipEndPlanes(gable)) {
    const ph = hipPlaneHeight(p, v);
    if (ph < bestH) { bestH = ph; best = p.dir; }
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
    const endCols = gableEndColumns(g); // T-150-01: this gable's vertical triangular end-wall columns
    const vIdx = g.ridge.axis === "x" ? 0 : 1;
    const lo = g.ends?.lo ?? null;
    const hi = g.ends?.hi ?? null;
    // T-112-01: corner-state eligibility — every column of a hip-cap gable; a fitted hip end's
    // columns when its plane is the active (downhill) constraint. Legacy gables: never.
    const fittedDirs = g.kind === "hip-cap"
      ? null
      : new Set(hipEndPlanes(g).filter((p) => g.hip?.fitted?.[p.end]).map((p) => p.dir));
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
        const downhill = gableDownhillAt(g, x, z, h);
        const cornerEligible = g.kind === "hip-cap" || (downhill !== null && fittedDirs.has(downhill));
        owner.set(key, { gableId: g.id, downhill, sheet, cap, cornerEligible, gableEnd: endCols.has(key) });
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
 *
 * ENVELOPE-THEN-COVERING (T-150-01): with `opts.gableBlock` set, the SUB-SURFACE fill of each
 * vertical gable-end slice ({@link gableEndColumns}) is authored in that WALL block (the gable-end
 * wall — the envelope), and its cells are returned in `gableWallKeys` so the zone map can classify
 * them as wall, not roof. The sloped COVERING (top stair/full, slab, cap, and every sheet/verge
 * surface) stays roof field. Absent ⇒ byte-identical legacy emission (the whole prism is roof).
 * @returns {{cells:{pos:number[], block:string, form?:string, state?:object}[],
 *            counts:{full:number, stairs:number, slabs:number, cap:number},
 *            heights:Map<string,number>, owner:Map<string,object>, bandFloor:number,
 *            sheetKeys:Set<string>, capKeys:Set<string>, gableWallKeys:Set<string>}}
 *            gableWallKeys = "x,y,z" of every gable-end-wall cell (empty without opts.gableBlock).
 *            sheetKeys = "x,y,z" of every
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
  const gableWallKeys = new Set(); // T-150-01: sub-surface end-slice cells dressed as wall envelope
  const gableBlock = opts.gableBlock ?? null;
  if (!family?.field) return { cells, counts, heights, owner, bandFloor: floor, sheetKeys, capKeys, gableWallKeys };

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
    const drops = !half && family.stairs && d !== null && (at(d) === undefined || at(d) <= h - 1);
    let stair = drops && (at(FLIP[d]) ?? -Infinity) >= h + 1;
    // T-112-01: hip-construction owners turn their corners with the proven shape vocabulary;
    // everyone else keeps the straight tread verbatim (the cottage valleys stay byte-identical).
    // An OUTER corner backs onto the rising DIAGONAL (uphill + the kept perpendicular) — on a
    // pyramid arris the cardinal uphill is level, the mass rises corner-to-corner.
    let shape = "straight";
    if (drops && own?.cornerEligible) {
      const cs = stairShape(d, h, at);
      if (!cs.stair) {
        stair = false; // promontory cell: the solid full block is the honest mass
      } else if (cs.shape === "outer_left" || cs.shape === "outer_right") {
        const kept = PERP[d].find((p) => !(at(p) === undefined || at(p) <= h - 1));
        const [ux, uz] = DELTA[FLIP[d]];
        const [kx, kz] = DELTA[kept];
        if ((heights.get(`${x + ux + kx},${z + uz + kz}`) ?? -Infinity) >= h + 1) {
          stair = true;
          shape = cs.shape;
        } // else: no backing mass for a turn — the legacy emission stands
      } else if (stair) {
        shape = cs.shape; // inner/straight keep the legacy uphill-backing requirement
      }
    }
    const top = hInt;
    for (let y = own?.sheet ? top : floor; y <= top; y++) {
      if (y === top && stair) {
        cells.push({ pos: [x, y, z], block: family.stairs, form: "fixture",
          state: { facing: STAIR_FACING[FLIP[d]], half: "bottom", shape } });
        counts.stairs++;
      } else if (gableBlock && own?.gableEnd && y < top) {
        // T-150-01: a gable-end column's SUB-SURFACE fill is the vertical triangular wall (envelope),
        // not roof. The covering surface (y===top stair/full, the slab/cap above) stays roof field.
        cells.push({ pos: [x, y, z], block: gableBlock });
        counts.full++;
        gableWallKeys.add(`${x},${y},${z}`);
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
  return { cells, counts, heights, owner, bandFloor: floor, sheetKeys, capKeys, gableWallKeys };
}
