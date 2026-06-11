// Component consumption plan — T-106-01 (story S-106, epic E-27).
//
// E-27 Rule 4: after T-103/T-104/T-105 the major components carry DEFINITIONS; a skin stage that
// re-derives structure from occupancy where a definition exists is a bug. This module turns the
// committed records (component-record/v1, roof-program/v1, shaped-vocabulary/v1) into ONE plan the
// skin chain consumes:
//
//   plan.roof      — the generated roof program: its cells (protection region for the stateless
//                    paint ops), its per-column top (the conformance target that replaces the
//                    sampled-top basin-fill), its course family (own-vocabulary for the band gate).
//   plan.frames    — the frame-line RECIPE: corner columns from wall-slab intersections, the roof
//                    footprint the wall crown meets. Materialized per grammar pass by
//                    frameLinesFromComponent (the grammar re-reads geometry at every settle
//                    iteration; the DEFINITION is the columns, the cells are whatever wall exists
//                    there now).
//   plan.wallFaces — the defined wall field: the slab-face membership predicate. The T-088 gate
//                    censuses THIS (the definition) instead of every cell y-binned into a band;
//                    off-slab cells are measured and recorded, never silently gated.
//
// Each member is null when its record is absent or unusable — with a NAMED finding (the AC's
// recorded fallback). Pin mismatches THROW: a record cut from a different shell is input drift,
// never a graceful degrade.
//
// PURE — records arrive parsed (file I/O and sha pinning are the runners' job); no GL, no
// Date/random. Frame classification (precedence, wall predicate) intentionally reuses
// frame-lines.mjs exports — one wall definition, no refork.

import { wallCells } from "./frame-lines.mjs";
import { runCells } from "../form/component-decompose.mjs";
import { bareBlock } from "./occupancy.mjs";

export const COMPONENT_PLAN_SCHEMA = "component-plan/v1";

/** Named-finding helper. */
const finding = (code, detail) => ({ code, detail });

// --- roof ---------------------------------------------------------------------------------------

/**
 * The roof program as the skin consumes it: built from the ACCEPTED roof record + the delta of its
 * artifact against the pinned base + the artifact's occupancy. The program's authority is the
 * swapped artifact itself (the accepted rung's output) — not a re-evaluation of fit parameters, so
 * the attempt ladder's verdict is consumed, never re-litigated.
 *
 * `cells` (the paint-protection set) holds ONLY the program's SHAPED course cells — the
 * stairs/slabs whose stateless recolor would cube them. The solid wedge and the gable-end fulls
 * are recolor-safe geometry: material zoning on the rebuilt band is the SKIN's contract (the
 * concept's gable accents stay wall material — the T-104 review's concern #5, resolved here),
 * while FORM is held by `colTop`/`footprintCols` (the conformance target, full delta + fitted
 * gable footprints, never narrowed).
 * @param {{record:object, delta:{changed:any[],added:any[]}, occ:import("./occupancy.mjs").Occupancy}} args
 * @returns {{cells:Set<string>, footprintCols:Set<string>, colTop:Map<string,number>,
 *            family:{field:string,stairs:string|null,slab:string|null}, source:"program"}|null}
 */
export function roofPlanFromRecord({ record, delta, occ }) {
  if (!record || record.status !== "accepted" || !record.swap?.accepted) return null;
  const famRaw = record.family ?? {};
  const shapedIds = new Set([famRaw.stairs, famRaw.slab].filter(Boolean).map(bareBlock));
  const cells = new Set();
  const deltaCols = new Set();
  for (const list of [delta.changed, delta.added]) {
    for (const e of list) {
      const [x, , z] = e.key.split(",").map(Number);
      deltaCols.add(`${x},${z}`);
      if (shapedIds.has(bareBlock(e.to.block)) || e.to.state != null) cells.add(e.key);
    }
  }
  // footprint = the RECORD's fitted gable footprints (the definition — a column the program
  // regenerated identically is still program territory) ∪ delta columns, clipped to columns the
  // swapped artifact actually occupies. colTop is read off the swapped artifact: unchanged columns
  // equal the base by construction, so the conformance target is exact everywhere.
  const inGable = (x, z) => (record.fit?.gables ?? []).some((g) => {
    const b = g.footprint?.bbox;
    return b && x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ;
  });
  const footprintCols = new Set(deltaCols);
  const colTop = new Map();
  for (const [key] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    const ck = `${x},${z}`;
    if (!footprintCols.has(ck) && inGable(x, z)) footprintCols.add(ck);
    if (y > (colTop.get(ck) ?? -Infinity)) colTop.set(ck, y);
  }
  for (const ck of [...colTop.keys()]) if (!footprintCols.has(ck)) colTop.delete(ck);
  const fam = record.family ?? {};
  if (typeof fam.field !== "string") return null;
  return {
    cells,
    footprintCols,
    colTop,
    family: { field: bareBlock(fam.field), stairs: fam.stairs ? bareBlock(fam.stairs) : null, slab: fam.slab ? bareBlock(fam.slab) : null },
    source: "program",
  };
}

/**
 * Conformance of a build's roof against the program: per footprint column, the top occupied y must
 * equal the program's. Deviations are EVIDENCE (recorded), never auto-fixed — this check replaces
 * the sampled-top basin-fill on the program footprint (the program is the contract; a mismatch
 * means something moved geometry after composition).
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{footprintCols:Set<string>, colTop:Map<string,number>}} roofPlan
 * @returns {{columns:number, conforming:number, deviations:{col:string, want:number, got:number|null}[]}}
 */
export function programConformance(occ, roofPlan) {
  const got = new Map();
  for (const [key] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    const ck = `${x},${z}`;
    if (!roofPlan.footprintCols.has(ck)) continue;
    if (y > (got.get(ck) ?? -Infinity)) got.set(ck, y);
  }
  const deviations = [];
  let conforming = 0;
  for (const col of [...roofPlan.footprintCols].sort()) {
    const want = roofPlan.colTop.get(col);
    const g = got.get(col) ?? null;
    if (g === want) conforming++;
    else deviations.push({ col, want, got: g });
  }
  return { columns: roofPlan.footprintCols.size, conforming, deviations };
}

// --- frames -------------------------------------------------------------------------------------

/**
 * Corner columns DEFINED by the component record: every intersection of two perpendicular wall
 * slabs, where each slab's plane coordinate lies within the other's world bounds. Protrusion
 * columns (a chimney) are NOT corners here — they are masses, not wall-slab intersections (the
 * occupancy read can't tell them apart; the definition can).
 * @param {object[]} wallSlabs component-record wallSlabs
 * @returns {Set<string>} "x,z" column keys
 */
export function cornerColumnsFromSlabs(wallSlabs = []) {
  const corners = new Set();
  const xs = wallSlabs.filter((s) => s.axis === "x");
  const zs = wallSlabs.filter((s) => s.axis === "z");
  for (const sx of xs) {
    for (const sz of zs) {
      const x = sx.value, z = sz.value;
      const inSx = z >= sx.boundsWorld.min[2] && z <= sx.boundsWorld.max[2];
      const inSz = x >= sz.boundsWorld.min[0] && x <= sz.boundsWorld.max[0];
      if (inSx && inSz) corners.add(`${x},${z}`);
    }
  }
  return corners;
}

/** Decode the roof footprint columns from the component record's roof-plane extents (the fallback
 *  roof definition when no program was accepted — record-defined, still not occupancy-derived). */
export function roofFootprintFromRecord(componentRecord) {
  const cols = new Set();
  for (const plane of componentRecord?.roofPlanes ?? []) {
    for (const [x, z] of runCells(plane.extent?.runs ?? [])) cols.add(`${x},${z}`);
  }
  return cols;
}

/**
 * Frame lines from the COMPONENT DEFINITIONS, in frameLines()'s exact output shape. The record
 * defines WHERE the lines are (corner columns, the roof the crown meets); the current occupancy
 * materializes WHICH wall cells exist there — so the grammar can re-materialize at every settle
 * pass without re-deriving structure.
 *   • cornerPost — wall cell in a slab-intersection column (definition; spans full wall height).
 *   • roofline   — topmost wall cell of its column where the column is under the defined roof
 *                  (program footprint when given, record roof-plane extent otherwise).
 *   • floorLine  — UNCHANGED occupancy semantics (storeys are not a component; recorded as the
 *                  honest occupancy fallback).
 * Precedence identical to frameLines (cornerPost > roofline > floorLine).
 * @param {import("./occupancy.mjs").Occupancy} occ
 * @param {{floorLines?:number[], upperTop:number, roofKeys:Set<string>}} geom
 * @param {{cornerCols:Set<string>, roofFootprintCols:Set<string>}} recipe
 * @returns {{cells:Map<string,string>, byKind:Record<string,string[]>,
 *            counts:{wall:number, cornerPost:number, roofline:number, floorLine:number},
 *            source:{cornerPost:string, roofline:string, floorLine:string}}}
 */
export function bandFloorLines(bands) {
  // the concept-derived bands are a COMMITTED read: each upper band's floor is a storey line the
  // concept claims. The occupancy storey scan (fill ≥ 0.6 per layer) reads every layer of a
  // cage-solid or wedge-filled shell as a floor — definition over derivation here too.
  return (bands ?? []).slice(1).map((b) => b.yRange[0]);
}

export function frameLinesFromComponent(occ, { floorLines = [], upperTop, roofKeys }, recipe) {
  const byKind = { cornerPost: [], roofline: [], floorLine: [] };
  const cells = new Map();
  const counts = { wall: 0, cornerPost: 0, roofline: 0, floorLine: 0 };

  const walls = [];
  const colTop = new Map();
  let groundY = Infinity;
  for (const entry of wallCells(occ, { upperTop, roofKeys })) {
    walls.push(entry);
    counts.wall++;
    const [x, y, z] = entry.voxel;
    const ck = `${x},${z}`;
    if (y > (colTop.get(ck) ?? -Infinity)) colTop.set(ck, y);
    if (y < groundY) groundY = y;
  }
  const interiorFloors = new Set(floorLines.filter((y) => y > groundY && y < upperTop));

  for (const { key, voxel } of walls) {
    const [x, y, z] = voxel;
    const ck = `${x},${z}`;
    let kind = null;
    if (recipe.cornerCols.has(ck)) kind = "cornerPost";
    else if (y === colTop.get(ck) && recipe.roofFootprintCols.has(ck)) kind = "roofline";
    else if (interiorFloors.has(y)) kind = "floorLine";
    if (kind) {
      cells.set(key, kind);
      byKind[kind].push(key);
      counts[kind]++;
    }
  }
  return {
    cells, byKind, counts,
    source: { cornerPost: "component", roofline: "component", floorLine: recipe.floorLineSource ?? "occupancy" },
  };
}

// --- wall faces ---------------------------------------------------------------------------------

/**
 * The defined wall field: membership on any wall slab's face plane within its world bounds. A slab
 * with axis "x" is the plane x === value (its y/z extent from boundsWorld); axis "z" mirrors.
 * @param {object} componentRecord
 * @returns {{contains:(voxel:number[])=>boolean, slabs:{id:string,dir:string,axis:string,value:number}[]}|null}
 */
export function wallFacePredicate(componentRecord) {
  const slabs = componentRecord?.wallSlabs ?? [];
  if (!slabs.length) return null;
  const checks = slabs.map((s) => {
    const { min, max } = s.boundsWorld;
    return s.axis === "x"
      ? ([x, y, z]) => x === s.value && y >= min[1] && y <= max[1] && z >= min[2] && z <= max[2]
      : ([x, y, z]) => z === s.value && y >= min[1] && y <= max[1] && x >= min[0] && x <= max[0];
  });
  return {
    contains: (voxel) => checks.some((c) => c(voxel)),
    slabs: slabs.map((s) => ({ id: s.id, dir: s.dir, axis: s.axis, value: s.value, boundsWorld: s.boundsWorld })),
  };
}

// --- serialization (the chain writes the plan beside the reconstructed artifact; the gate revives
// it so the kit-presence fixpoint re-runs the SAME op — same frames, same wall top, same census) ---

/** JSON-safe form of a plan (Sets/Maps → sorted arrays; predicates dropped, slabs kept). */
export function serializeComponentPlan(plan) {
  return {
    schema: COMPONENT_PLAN_SCHEMA,
    roof: plan.roof ? {
      cells: [...plan.roof.cells].sort(),
      footprintCols: [...plan.roof.footprintCols].sort(),
      colTop: [...plan.roof.colTop.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      family: plan.roof.family, source: plan.roof.source,
    } : null,
    frames: plan.frames ? {
      cornerCols: [...plan.frames.cornerCols].sort(),
      roofFootprintCols: [...plan.frames.roofFootprintCols].sort(),
      rooflineSource: plan.frames.rooflineSource,
    } : null,
    mass: plan.mass ? { cells: [...plan.mass.cells].sort(), source: plan.mass.source } : null,
    wallSlabs: plan.wallFaces ? plan.wallFaces.slabs : null,
    wallTop: plan.wallTop ?? null,
    wallTopEffective: plan.wallTopEffective ?? null,
    touchedCells: plan.touchedCells ? [...plan.touchedCells].sort() : null,
    findings: plan.findings,
  };
}

/** Revive a serialized plan: rebuild the Sets/Maps and the wall-face predicate. */
export function reviveComponentPlan(json) {
  if (!json || json.schema !== COMPONENT_PLAN_SCHEMA) {
    throw new Error(`reviveComponentPlan: not a ${COMPONENT_PLAN_SCHEMA} document`);
  }
  return {
    schema: json.schema,
    roof: json.roof ? {
      cells: new Set(json.roof.cells),
      footprintCols: new Set(json.roof.footprintCols),
      colTop: new Map(json.roof.colTop),
      family: json.roof.family, source: json.roof.source,
    } : null,
    frames: json.frames ? {
      cornerCols: new Set(json.frames.cornerCols),
      roofFootprintCols: new Set(json.frames.roofFootprintCols),
      rooflineSource: json.frames.rooflineSource,
    } : null,
    wallFaces: json.wallSlabs ? wallFacePredicate({ wallSlabs: json.wallSlabs }) : null,
    mass: json.mass ? { cells: new Set(json.mass.cells), source: json.mass.source } : null,
    wallTop: json.wallTop ?? null,
    wallTopEffective: json.wallTopEffective ?? null,
    touchedCells: json.touchedCells ? new Set(json.touchedCells) : null,
    findings: json.findings ?? [],
  };
}

/**
 * Census zoneOf for the DEFINED wall field: wall-band cells stay banded only on a slab face;
 * everything else in the band reports `<band>:offslab` — measured, recorded, never judged (the
 * gate's `zones` policy has no entry for offslab zones, and `dominantCoverage` reports
 * null-dominant zones without gating them). Non-band zones (roof) pass through. Used ONLY for the
 * gate census — the fill keeps painting every exposed cell (defects live on un-enumerated
 * surfaces; the camera's truth doesn't shrink because the wall got a definition).
 * @param {(voxel:number[])=>string} zoneOf
 * @param {{contains:(voxel:number[])=>boolean}} wallFaces
 * @param {Iterable<string>} bandNames
 * @returns {(voxel:number[])=>string}
 */
export function splitZoneOf(zoneOf, wallFaces, bandNames) {
  const bands = new Set(bandNames);
  return (voxel) => {
    const zone = zoneOf(voxel);
    if (!bands.has(zone)) return zone;
    return wallFaces.contains(voxel) ? zone : `${zone}:offslab`;
  };
}

/**
 * The full census zoneOf for a consumption plan: a roof-PROGRAM cell censuses as "roof" no matter
 * what y-band it falls in (the definition says it is a roof course — a rake stair on the gable-end
 * plane must not be counted against the wall band it y-bins into), then wall bands split on the
 * defined wall field when one exists. Census-only — the FILL's zoneOf is untouched (paint policy
 * is geometry's, protection is the region's).
 * `frameCells` (optional): the classified frame-line read — DEFINED lines (corner posts, the wall
 * crown, storey beams) census as `<band>:frame`, measured but never gated; the wall-FIELD gate
 * judges the field between the lines, not the kit's own timber against it.
 * @param {(voxel:number[])=>string} zoneOf
 * @param {{roof?:{cells:Set<string>}|null, wallFaces?:{contains:(voxel:number[])=>boolean}|null}} plan
 * @param {Iterable<string>} bandNames
 * @param {{frameCells?:Map<string,string>|Set<string>|null}} [opts]
 * @returns {(voxel:number[])=>string}
 */
export function planCensusZoneOf(zoneOf, plan, bandNames, { frameCells = null } = {}) {
  const bands = new Set(bandNames);
  const inner = plan?.wallFaces ? splitZoneOf(zoneOf, plan.wallFaces, bandNames) : zoneOf;
  const roofCells = plan?.roof?.cells ?? null;
  return (voxel) => {
    const key = voxel.join(",");
    if (roofCells?.has(key)) return "roof";
    // The dual (T-121-01): when the roof PROGRAM is the census authority, a cell that y-bins
    // "roof" but is NOT a program cell and IS a defined wall — a generator-provenance mass cell
    // (the authority where one exists: wall-top courses, two-cell-thick gable skins, protrusion
    // tops) or a cell on a fitted slab plane — must not be counted against the roof band it
    // y-bins into (a steep stone gable + a one-course eave offset diluted a first-run subject's
    // roof fraction to 0.83). `roof:gable` is measured, never gated. A roof-band cell that NO
    // definition claims stays "roof" — spikes and strays still gate.
    if (roofCells && zoneOf(voxel) === "roof" &&
        (plan?.mass?.cells?.has(key) || plan?.wallFaces?.contains(voxel))) return "roof:gable";
    if (frameCells?.has(key)) {
      const zone = zoneOf(voxel);
      return bands.has(zone) ? `${zone}:frame` : inner(voxel);
    }
    return inner(voxel);
  };
}

// --- the plan -----------------------------------------------------------------------------------

/**
 * Assemble the consumption plan from the parsed records. Absent/unusable members are null with a
 * named finding; pin mismatches THROW (drift, not degrade). `roofDelta`/`roofOcc` come from the
 * caller's composition step (the delta is computed there anyway; this stays pure).
 * @param {{componentRecord?:object|null, roofRecord?:object|null, shapedRecord?:object|null,
 *          shellSha:string, roofDelta?:object|null, roofOcc?:import("./occupancy.mjs").Occupancy|null}} args
 * @returns {{schema:string, roof:object|null, frames:object|null, wallFaces:object|null,
 *            findings:{code:string, detail:string}[]}}
 */
export function buildComponentPlan({ componentRecord = null, roofRecord = null, shapedRecord = null, shellSha, roofDelta = null, roofOcc = null }) {
  if (typeof shellSha !== "string" || !shellSha) throw new Error("buildComponentPlan: shellSha required (the regularized-shell pin)");
  const findings = [];
  const pin = (name, got) => {
    if (got !== shellSha) {
      throw new Error(`buildComponentPlan: ${name} pin mismatch — record cut from ${String(got).slice(0, 12)}…, shell is ${shellSha.slice(0, 12)}… (input drift, re-run the upstream runner)`);
    }
  };

  if (componentRecord) pin("component-record source.sha256", componentRecord.source?.sha256);
  else findings.push(finding("component-record-missing", "no component record — frame lines and wall fields fall back to occupancy derivation"));

  let roof = null;
  if (roofRecord) {
    pin("roof-program inputs.shellSha256", roofRecord.inputs?.shellSha256);
    if (roofRecord.status === "accepted" && roofRecord.swap?.accepted && roofDelta && roofOcc) {
      roof = roofPlanFromRecord({ record: roofRecord, delta: roofDelta, occ: roofOcc });
    }
    if (!roof) {
      findings.push(finding(
        roofRecord.status === "accepted" ? "roof-program-unconsumable" : `roof-program-${roofRecord.status}`,
        `roof record present but not consumed (status ${roofRecord.status}) — roof courses fall back to occupancy derivation`
      ));
    }
  } else {
    findings.push(finding("roof-program-missing", "no roof program record — roof courses fall back to occupancy derivation"));
  }

  if (shapedRecord) pin("shaped-vocabulary inputs.recordSha", shapedRecord.inputs?.recordSha);
  else findings.push(finding("shaped-record-missing", "no shaped record — opening heads are whatever the shell carries"));

  let frames = null;
  if (componentRecord) {
    const cornerCols = cornerColumnsFromSlabs(componentRecord.wallSlabs);
    const roofFootprintCols = roof ? roof.footprintCols : roofFootprintFromRecord(componentRecord);
    if (cornerCols.size) {
      frames = {
        cornerCols, roofFootprintCols,
        rooflineSource: roof ? "program" : "record",
      };
    } else {
      findings.push(finding("component-corners-empty", "wall slabs define no corner intersections — frame lines fall back to occupancy derivation"));
    }
  }

  const wallFaces = componentRecord ? wallFacePredicate(componentRecord) : null;
  if (componentRecord && !wallFaces) {
    findings.push(finding("component-slabs-empty", "component record has no wall slabs — wall-field census falls back to the banded exposure shell"));
  }

  // seam 4's pin: the DEFINED wall/roof boundary (first layer above the tallest wall slab). The
  // occupancy-derived upperTop drifts when a rebuilt roof changes the eave read (cottage: 19 → 20,
  // which conjured a phantom 2-row band); the definition keeps the concept's y-mapping stable on
  // rebuilt geometry — the re-pin protocol, mechanized.
  const wallTop = wallFaces
    ? Math.max(...(componentRecord.wallSlabs ?? []).map((s) => s.boundsWorld.max[1])) + 1
    : null;

  return { schema: COMPONENT_PLAN_SCHEMA, roof, frames, wallFaces, wallTop, findings };
}
