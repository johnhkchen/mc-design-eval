// PURE CORE — T-115-01 (E-29 / S-115): the generate-first GENERATE stage. Consumes a provision-fit
// record (parameters measured from evidence) and authors EVERY cell of the build: solid mass
// extrusions over the fitted footprints, fitted roofs through the E-27 course generator, fitted
// opening apertures carved by EXCLUSION (a recess is the absence of wall material — never a buried
// block). No occupancy of the voxelized blob is read here: the blob cannot leak into the artifact
// because this module never sees it.
//
// The zero-blob machine check (`assertGeneratedProvenance`) is provenance-based, NOT
// set-intersection: generated walls are SUPPOSED to coincide with blob positions (the cage
// maximizes IoU) — the check proves every artifact cell was authored by a named generator, and the
// runner separately re-proves the artifact byte-identically from the serialized fit record alone.

import { occupancyFromCells } from "../view/occupancy.mjs";
import { rebuildArtifact } from "../view/shell-integrity.mjs";
import { generateRoof } from "../view/roof-generate.mjs";
import { GLB_VOXEL_DEFAULTS } from "./glb-voxel-build.mjs";

export const PROVISION_GENERATE_SCHEMA = "provision-generate/v1";

/** The closed provenance vocabulary — no `blob`, no `sampled`, by construction. */
export const PROVENANCE_SOURCES = Object.freeze(["mass", "roof", "opening-head"]);

export const PROVISION_GENERATE_DEFAULTS = Object.freeze({
  wallThickness: 2, // perimeter wall-slab thickness — masses generate HOLLOW (the blob is a shell;
                    // solid masses would make every carved aperture project solid and vanish from
                    // the openings detector — the dressing/presence seam needs true holes)
  carveDepth: 2,    // aperture carve depth = through the wall slab (facade-recess-by-exclusion)
  schemaVersion: "1.0.0",
});

const ns = (b) => (b.includes(":") ? b : `minecraft:${b}`);
const finding = (code, where, detail) => ({ code, where, detail });

/** Per-z face coordinate of a run footprint along a direction (the wall plane the carve enters). */
function facePos(runs, dir, at) {
  if (dir === "+x" || dir === "-x") {
    // at = z row; face is the run edge on that row (outermost when rows split, the carve enters
    // the outer face — multiple runs on a row: the extreme edge)
    const rows = runs.filter((r) => r.z === at);
    if (!rows.length) return null;
    return dir === "+x" ? Math.max(...rows.map((r) => r.x1)) : Math.min(...rows.map((r) => r.x0));
  }
  // ±z: at = x column; face is the extreme z whose run covers x=at
  const rows = runs.filter((r) => r.x0 <= at && at <= r.x1);
  if (!rows.length) return null;
  return dir === "+z" ? Math.max(...rows.map((r) => r.z)) : Math.min(...rows.map((r) => r.z));
}

/** Head top per in-plane column from the fitted head (arch arc / flat level / refused rectangle). */
function headTopAt(op, at) {
  const head = op.head ?? { kind: "none" };
  if (head.kind === "arch") {
    const [cu, cy] = head.spec.center;
    const du = at - cu;
    const r = head.spec.radius;
    if (Math.abs(du) > r) return op.sillY - 1; // outside the disc: no carve in this column
    return Math.max(op.sillY, Math.floor(cy + Math.sqrt(r * r - du * du)));
  }
  if (head.kind === "flat") return head.spec.level;
  return op.crown; // refused head: the rectangular aperture carries the refusal (Rule 1)
}

/**
 * Generate the full build from fitted parameters + the kit course family.
 *
 * @param {object} fit fitProvision output (or its revived serialization)
 * @param {object} args
 * @param {{field:string|null, stairs:string|null, slab:string|null}} args.family roof course family
 * @param {object} args.policy registry zone policy (named space) — base/roof dominants
 * @param {{yRange:number[], block:string}[]} [args.bands] NAMED-space storey bands (the committed
 *   concept-derived zone-map record — registry data): wall cells paint per band so the skin's
 *   palette discipline (`allowedPalette`) finds every concept dominant in the generated manifest.
 *   Absent → the policy base dominant paints everything (single-band fallback).
 * @param {string|null} [args.sheetBlock] NAMED-space block for the roof's sheet (verge/eave
 *   fascia) courses — the concept's fascia dominant; null keeps the family field.
 * @param {object} [args.opts] PROVISION_GENERATE_DEFAULTS overrides
 * @param {object} [args.metadata] artifact metadata overrides (e.g. trial_id)
 * @param {object} [args.style] artifact style override
 * @returns {{schema:string, artifact:object, occ:object,
 *            provenance:{byCell:Map<string,string>, bySource:Record<string,number>},
 *            roofPlan:{cells:Set<string>, footprintCols:Set<string>, sheetKeys:Set<string>,
 *                      capKeys:Set<string>, bandFloor:number|null}|null,
 *            counts:object, findings:object[]}}
 */
export function generateProvision(fit, { family, policy, bands = null, sheetBlock = null, opts = {}, metadata = {}, style = null } = {}) {
  if (!fit?.masses?.length) throw new Error("generateProvision: fit with masses required");
  if (!policy?.base?.dominant) throw new Error("generateProvision: policy with base.dominant required");
  const o = { ...PROVISION_GENERATE_DEFAULTS, ...opts };
  const findings = [];
  const sortedBands = Array.isArray(bands) && bands.length
    ? [...bands].sort((a, b) => a.yRange[0] - b.yRange[0])
    : null;
  const wallBlockAt = (y) => {
    if (!sortedBands) return ns(policy.base.dominant);
    for (const b of sortedBands) if (y >= b.yRange[0] && y <= b.yRange[1]) return ns(b.block);
    return y < sortedBands[0].yRange[0] ? ns(sortedBands[0].block) : ns(sortedBands.at(-1).block);
  };

  // 1. roofs first — their sheet columns (fitted verge/eave overhangs, open underside) are
  //    EXCLUDED from wall extrusion: an overhang column has no wall below it by definition.
  const roofCells = [];
  const roofProvenance = [];
  const sheetCols = new Set();
  const roofPlanCells = new Set();
  const roofFootprintCols = new Set();
  const allSheetKeys = new Set();
  const allCapKeys = new Set();
  let bandFloorMin = null;
  const counts = { mass: 0, roof: 0, carved: 0 };
  for (const roof of fit.roofs ?? []) {
    if (roof.kind === "flat-cap" || !roof.gables?.length) continue; // the named limitation: mass stays flat-topped
    if (!family?.field) {
      findings.push(finding("roof-family-missing", roof.massId,
        "no kit course family — fitted roof cannot generate; mass stays flat-topped (named)"));
      continue;
    }
    const gen = generateRoof(roof.gables, family);
    for (const c of gen.cells) {
      // FASCIA: sheet (verge/eave overhang) courses AND the wedge's bottom (eave) course carry the
      // concept's roof dominant — the dark eave/fascia edge every concept draws, and the guarantee
      // that the concept-derived roof-zone dominant exists in the generated manifest (the skin's
      // palette discipline). Full course cells only, never the shaped stair/slab vocabulary.
      const isFascia = sheetBlock && c.form !== "fixture" &&
        (gen.sheetKeys.has(c.pos.join(",")) || c.pos[1] === gen.bandFloor);
      roofCells.push(isFascia ? { ...c, block: ns(sheetBlock) } : c);
      roofProvenance.push(`roof:${roof.massId}`);
    }
    for (const key of gen.sheetKeys) {
      const [x, , z] = key.split(",").map(Number);
      sheetCols.add(`${x},${z}`);
      allSheetKeys.add(key);
    }
    for (const key of gen.capKeys) allCapKeys.add(key);
    for (const c of gen.cells) {
      if (c.form === "fixture") roofPlanCells.add(c.pos.join(","));
    }
    for (const key of gen.heights.keys()) roofFootprintCols.add(key);
    bandFloorMin = bandFloorMin === null ? gen.bandFloor : Math.min(bandFloorMin, gen.bandFloor);
    counts.roof += gen.cells.length;
  }

  // 2. masses — HOLLOW perimeter wall slabs (thickness wallThickness) over [baseY, wallTop];
  //    sheet (overhang) columns excluded; protrusions (chimneys) stay solid and rise to their own
  //    mass top. Hollow is the blob's own topology: apertures must be true holes or the openings
  //    detector (projection air components) never sees them. NO interior floor slab: the concept
  //    zone-map's y-anchor pins the build's widest layer to the concept's widest row (the eave
  //    overhang) — a full floor course out-weighs the eave and flips the whole band mapping.
  const wallMap = new Map(); // key → {cell, provenance}
  const erode = (set) => new Set([...set].filter((k) => {
    const [x, z] = k.split(",").map(Number);
    return set.has(`${x + 1},${z}`) && set.has(`${x - 1},${z}`) &&
      set.has(`${x},${z + 1}`) && set.has(`${x},${z - 1}`);
  }));
  const bodies = fit.masses.filter((m) => m.role !== "protrusion");
  const protrusions = fit.masses.filter((m) => m.role === "protrusion");
  for (const m of bodies) {
    let cols = new Set();
    for (const r of m.runs) for (let x = r.x0; x <= r.x1; x++) cols.add(`${x},${r.z}`);
    let interior = cols;
    for (let i = 0; i < o.wallThickness; i++) interior = erode(interior);
    for (const col of cols) {
      if (sheetCols.has(col) || interior.has(col)) continue;
      const [x, z] = col.split(",").map(Number);
      for (let y = m.baseY; y <= m.wallTop; y++) {
        const key = `${x},${y},${z}`;
        wallMap.set(key, { cell: { pos: [x, y, z], block: wallBlockAt(y) }, provenance: `mass:${m.id}` });
      }
    }
  }
  // protrusions (chimneys, finials) generate SOLID over their blob extent — but only when the
  // generated build actually carries them: a protrusion whose base course rests on nothing (its
  // support was an under-fitted roof's blob cells) would FLOAT; it is omitted as a REGISTERED
  // LIMITATION (Rule 1), never generated absurd and never copied from the blob.
  const worldBase = Math.min(...fit.masses.map((m) => m.baseY));
  const roofKeySet = new Set(roofCells.map((c) => c.pos.join(",")));
  const supportAt = (x, y, z) => wallMap.has(`${x},${y},${z}`) || roofKeySet.has(`${x},${y},${z}`);
  for (const m of protrusions) {
    const cols = [];
    for (const r of m.runs) for (let x = r.x0; x <= r.x1; x++) cols.push([x, r.z]);
    const grounded = m.baseY <= worldBase ||
      cols.some(([x, z]) => supportAt(x, m.baseY - 1, z));
    if (!grounded) {
      findings.push(finding("mass-unsupported", m.id,
        `protrusion base y=${m.baseY} rests on no generated cell (the blob support was never built) — omitted, registered`));
      continue;
    }
    for (const [x, z] of cols) {
      for (let y = m.baseY; y <= m.massTop; y++) {
        const key = `${x},${y},${z}`;
        wallMap.set(key, { cell: { pos: [x, y, z], block: wallBlockAt(y) }, provenance: `mass:${m.id}` });
      }
    }
  }

  // 3. openings — carve fitted apertures by exclusion (never place, never bury)
  const runsByMass = new Map(fit.masses.map((m) => [m.id, m.runs]));
  for (const grp of fit.openings ?? []) {
    const runs = runsByMass.get(grp.massId);
    if (!runs) {
      findings.push(finding("opening-mass-unknown", grp.id, `no fitted mass ${grp.massId} — group not carved`));
      continue;
    }
    const [dxs, dzs] = grp.dir === "+x" ? [-1, 0] : grp.dir === "-x" ? [1, 0]
      : grp.dir === "+z" ? [0, -1] : [0, 1]; // inward step
    for (const op of grp.openings) {
      const [lo, hi] = op.extent.range;
      for (let at = lo; at <= hi; at++) {
        const face = facePos(runs, grp.dir, at);
        if (face === null) continue; // aperture column off the fitted footprint: nothing to carve
        const top = headTopAt(op, at);
        for (let y = op.sillY; y <= top; y++) {
          for (let d = 0; d < o.carveDepth; d++) {
            const x = grp.dir.includes("x") ? face + dxs * d : at;
            const z = grp.dir.includes("z") ? face + dzs * d : at;
            if (wallMap.delete(`${x},${y},${z}`)) counts.carved++;
          }
        }
      }
    }
  }

  // 4. assemble — walls then roofs (a roof cell over a wall column owns the cell, last write whole)
  const cellList = [];
  const provenanceOrder = [];
  for (const { cell, provenance } of wallMap.values()) {
    cellList.push(cell);
    provenanceOrder.push(provenance);
  }
  for (let i = 0; i < roofCells.length; i++) {
    cellList.push(roofCells[i]);
    provenanceOrder.push(roofProvenance[i]);
  }
  if (!cellList.length) throw new Error("generateProvision: nothing generated (no mass cells)");

  const byCell = new Map();
  for (let i = 0; i < cellList.length; i++) byCell.set(cellList[i].pos.join(","), provenanceOrder[i]);
  const occ = occupancyFromCells(cellList);
  counts.mass = wallMap.size;

  const artifact = rebuildArtifact(occ, {
    schema_version: o.schemaVersion,
    metadata: { ...GLB_VOXEL_DEFAULTS.metadata, trial_id: "generate-first", ...metadata },
    style: style ?? {
      name: "generate-first",
      rationale: "E-29 S-115: every cell authored from fitted parameters + kit — the voxelized " +
        "blob is fit evidence and cage target only, never the build.",
    },
    palette: { manifest: [] },
  });

  const bySource = {};
  for (const src of byCell.values()) {
    const kind = src.split(":")[0];
    bySource[kind] = (bySource[kind] ?? 0) + 1;
  }

  return {
    schema: PROVISION_GENERATE_SCHEMA,
    artifact, occ,
    provenance: { byCell, bySource },
    roofPlan: roofFootprintCols.size
      ? { cells: roofPlanCells, footprintCols: roofFootprintCols, sheetKeys: allSheetKeys,
          capKeys: allCapKeys, bandFloor: bandFloorMin }
      : null,
    counts,
    findings,
  };
}

/**
 * THE ZERO-BLOB MACHINE CHECK (AC #2): every artifact cell must carry generator provenance from
 * the closed vocabulary. Set-intersection against the blob is explicitly NOT the check —
 * coincidence with blob positions is the fit working. THROWS on any violation.
 * @returns {{passed:true, cells:number, bySource:Record<string,number>}}
 */
export function assertGeneratedProvenance(artifact, provenance) {
  const byCell = provenance?.byCell;
  if (!(byCell instanceof Map)) throw new Error("assertGeneratedProvenance: provenance.byCell Map required");
  const placements = artifact?.placements ?? [];
  if (!placements.length) throw new Error("assertGeneratedProvenance: artifact has no placements");
  const seen = new Set();
  const bySource = {};
  for (const p of placements) {
    const key = p.pos.join(",");
    const src = byCell.get(key);
    if (src === undefined) {
      throw new Error(`zero-blob check FAILED: cell ${key} (${p.block}) has no generator provenance`);
    }
    const kind = src.split(":")[0];
    if (!PROVENANCE_SOURCES.includes(kind)) {
      throw new Error(`zero-blob check FAILED: cell ${key} provenance "${src}" outside the closed vocabulary`);
    }
    bySource[kind] = (bySource[kind] ?? 0) + 1;
    seen.add(key);
  }
  for (const key of byCell.keys()) {
    if (!seen.has(key)) {
      throw new Error(`zero-blob check FAILED: provenance cell ${key} absent from the artifact (count drift)`);
    }
  }
  return { passed: true, cells: placements.length, bySource };
}
