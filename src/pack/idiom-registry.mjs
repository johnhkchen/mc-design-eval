// The idiom registry — idiom name → canonical generator (T-124-01, story S-124, epic E-31).
// Minecraft building is a finite pattern language; this table is its index. Stage-4 of the
// pipeline philosophy: "brushes — parametrized, composable, unit-tested, preview-carded
// generators — realize the program clean by construction." The recognized building program
// (S-125) arrives as idiom NAMES with parameters; this registry resolves each name to the
// generator that realizes it. E-32's brush factory grows this table; it does not replace it.
//
// TWO KINDS, ONE TABLE:
//   • kind "construct" — uniformly callable spec → {cells:[{pos,block,state?}], …meta}. These
//     realize on synthetic specs and are what the idiom render card iterates. Roof constructs
//     are thin adapters that build the gable records generateRoof() consumes (the
//     roof-generate.test.mjs fixture shape — single source of truth for roof emission).
//   • kind "pass" — build-transform stages with their natural signatures (grammar, dressing,
//     hollowing, floorplan). Registered for name resolution; NOT force-fitted into
//     spec → placements (they need full build context — a fake uniform adapter would hide
//     required inputs).
//
// Each entry carries `paramsSchema`: a JSON-schema fragment over the idiom's STYLE-level
// parameters (properties only, nothing required — a pack declares partial defaults/bounds;
// the full program spec is validated by the generator's own fail-loud checks at realization).
//
// Subject-agnostic: no block names, no dimensions, no style names. PURE — no GL/IO/Date/random.

import { generateRoof } from "../view/roof-generate.mjs";
import { archRing, flatHead, stairRun, slabStep } from "../form/shaped-vocab.mjs";
import { dormerGable, chimneyStack, jettyOverhang, plinthBand } from "../form/idiom-constructs.mjs";
import { placementGrammar } from "../form/placement-grammar.mjs";
import { dressOpenings } from "../view/opening-dressing.mjs";
import { markHollowable, carveArtifact } from "../view/hollow-carve.mjs";
import { generateFloorplan } from "../view/floorplan.mjs";

export const IDIOM_REGISTRY_SCHEMA = "idiom-registry/v1";

const isInt = (n) => Number.isInteger(n);
const isBlockId = (b) => typeof b === "string" && b.length > 0;

function fail(where, msg) { throw new Error(`${where}: ${msg}`); }

function checkRoofSpec(where, { footprint, eaveY, blocks }) {
  const { x0, x1, z0, z1 } = footprint ?? {};
  if (![x0, x1, z0, z1].every(isInt) || x0 > x1 || z0 > z1) {
    fail(where, "spec.footprint must be integer {x0≤x1, z0≤z1}");
  }
  if (!isInt(eaveY)) fail(where, "spec.eaveY must be an integer");
  if (!isBlockId(blocks?.field)) fail(where, "spec.blocks.field must be a non-empty block id");
  for (const k of ["stairs", "slab"]) {
    if (blocks[k] != null && !isBlockId(blocks[k])) fail(where, `spec.blocks.${k} must be a block id or null`);
  }
}

function colsOf({ x0, x1, z0, z1 }) {
  const cols = new Set();
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) cols.add(`${x},${z}`);
  return cols;
}

const familyOfBlocks = (blocks) => ({
  field: blocks.field, stairs: blocks.stairs ?? null, slab: blocks.slab ?? null, findings: [],
});

/** Build the 2-sided gable record generateRoof consumes (the roof-generate fixture shape). */
function gableRecord({ footprint, ridgeAxis, eaveY, ridgeY, pitch, hip }) {
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
 * GABLE ROOF — ridge along `ridgeAxis`, symmetric pitch, eaves on the perpendicular bounds.
 * @param {{footprint:{x0,x1,z0,z1}, ridgeAxis:"x"|"z", eaveY:number, ridgeY:number,
 *          pitch?:number, blocks:{field:string, stairs?:string|null, slab?:string|null}}} spec
 */
export function roofGableConstruct(spec) {
  const { footprint, ridgeAxis, eaveY, ridgeY, pitch = 1, blocks } = spec ?? {};
  checkRoofSpec("roofGableConstruct", spec ?? {});
  if (ridgeAxis !== "x" && ridgeAxis !== "z") fail("roofGableConstruct", 'spec.ridgeAxis must be "x"|"z"');
  if (!Number.isFinite(ridgeY) || ridgeY <= eaveY) fail("roofGableConstruct", "spec.ridgeY must exceed spec.eaveY");
  if (!Number.isFinite(pitch) || pitch <= 0) fail("roofGableConstruct", "spec.pitch must be > 0");
  const g = gableRecord({ footprint, ridgeAxis, eaveY, ridgeY, pitch });
  const { cells, counts, capKeys, bandFloor } = generateRoof([g], familyOfBlocks(blocks));
  return { cells, counts, capKeys, bandFloor, ridgeY };
}

/** HIP ROOF — the gable with both ridge ends hipped (heuristic hip, straight-only states). */
export function roofHipConstruct(spec) {
  const { footprint, ridgeAxis, eaveY, ridgeY, pitch = 1, blocks } = spec ?? {};
  checkRoofSpec("roofHipConstruct", spec ?? {});
  if (ridgeAxis !== "x" && ridgeAxis !== "z") fail("roofHipConstruct", 'spec.ridgeAxis must be "x"|"z"');
  if (!Number.isFinite(ridgeY) || ridgeY <= eaveY) fail("roofHipConstruct", "spec.ridgeY must exceed spec.eaveY");
  if (!Number.isFinite(pitch) || pitch <= 0) fail("roofHipConstruct", "spec.pitch must be > 0");
  const g = gableRecord({ footprint, ridgeAxis, eaveY, ridgeY, pitch, hip: { demanded: true, lo: true, hi: true } });
  const { cells, counts, capKeys, bandFloor } = generateRoof([g], familyOfBlocks(blocks));
  return { cells, counts, capKeys, bandFloor, ridgeY };
}

/**
 * PYRAMID ROOF — the 4-sided hip cap (roof-hip-fit's output shape, kind "hip-cap"): all four
 * eaves at the footprint bounds, apex at the plan center, corner stairs turn per quadrant.
 * @param {{footprint:{x0,x1,z0,z1}, eaveY:number, pitch?:number, blocks:object}} spec
 */
export function roofPyramidConstruct(spec) {
  const { footprint, eaveY, pitch = 1, blocks } = spec ?? {};
  checkRoofSpec("roofPyramidConstruct", spec ?? {});
  if (!Number.isFinite(pitch) || pitch <= 0) fail("roofPyramidConstruct", "spec.pitch must be > 0");
  const { x0, x1, z0, z1 } = footprint;
  const apex = eaveY + pitch * Math.min((x1 - x0) / 2, (z1 - z0) / 2);
  if (apex <= eaveY) fail("roofPyramidConstruct", "spec.footprint is too small to rise (apex at the eave)");
  const side = (eaveDir, eaveEdge) => ({
    planeId: null, eaveDir, pitch, pitchSource: "program-quadrant", eaveY, eaveEdge, extentCells: [],
  });
  const g = {
    id: "program-pyramid",
    kind: "hip-cap",
    ridge: { axis: x1 - x0 >= z1 - z0 ? "x" : "z", y: apex },
    sides: [side("+x", x1), side("-x", x0), side("+z", z1), side("-z", z0)],
    footprint: { cols: colsOf(footprint), bbox: { minX: x0, maxX: x1, minZ: z0, maxZ: z1 }, area: (x1 - x0 + 1) * (z1 - z0 + 1) },
    hip: { demanded: false, lo: false, hi: false },
    sane: true,
    reasons: [],
  };
  const { cells, counts, capKeys, bandFloor } = generateRoof([g], familyOfBlocks(blocks));
  return { cells, counts, capKeys, bandFloor, apexY: apex };
}

/** ARCH — voxel-circle head over an opening (shaped-vocab), realized as its full-cube ring.
 * Requires a concrete `block` (the construct contract realizes placements; the label-only
 * null-block form stays available via shaped-vocab directly). */
export function archConstruct(spec) {
  if (!isBlockId(spec?.block)) fail("archConstruct", "spec.block must be a non-empty block id");
  const { aperture, ring, headCells, jambCells } = archRing(spec);
  return { cells: ring, aperture, headCells, jambCells };
}

/** FLAT HEAD — the squared-lintel head (shaped-vocab), realized as its full-cube ring. */
export function flatHeadConstruct(spec) {
  if (!isBlockId(spec?.block)) fail("flatHeadConstruct", "spec.block must be a non-empty block id");
  const { aperture, ring, headCells, jambCells } = flatHead(spec);
  return { cells: ring, aperture, headCells, jambCells };
}

/** STAIR COURSE — shaped-vocab stairRun under the uniform construct return shape. */
export function stairRunConstruct(spec) {
  return { cells: stairRun(spec) };
}

/** SLAB COURSE — shaped-vocab slabStep under the uniform construct return shape. */
export function slabStepConstruct(spec) {
  return { cells: slabStep(spec) };
}

// ---------------------------------------------------------------- the registry table

const BLOCKS_FRAGMENT = {
  type: "object",
  properties: {
    field: { type: "string" }, stairs: { type: ["string", "null"] }, slab: { type: ["string", "null"] },
  },
  additionalProperties: false,
};

/** name → entry. Frozen. `paramsSchema` covers style-level parameters only (nothing required —
 * packs declare partial defaults; geometry arrives with the recognized program). */
export const IDIOM_REGISTRY = Object.freeze({
  "roof.gable": Object.freeze({
    kind: "construct", generate: roofGableConstruct, source: "src/view/roof-generate.mjs",
    paramsSchema: { type: "object", properties: { pitch: { type: "number", exclusiveMinimum: 0 }, blocks: BLOCKS_FRAGMENT }, additionalProperties: false },
  }),
  "roof.hip": Object.freeze({
    kind: "construct", generate: roofHipConstruct, source: "src/view/roof-generate.mjs",
    paramsSchema: { type: "object", properties: { pitch: { type: "number", exclusiveMinimum: 0 }, blocks: BLOCKS_FRAGMENT }, additionalProperties: false },
  }),
  "roof.pyramid": Object.freeze({
    kind: "construct", generate: roofPyramidConstruct, source: "src/view/roof-generate.mjs",
    paramsSchema: { type: "object", properties: { pitch: { type: "number", exclusiveMinimum: 0 }, blocks: BLOCKS_FRAGMENT }, additionalProperties: false },
  }),
  "arch": Object.freeze({
    kind: "construct", generate: archConstruct, source: "src/form/shaped-vocab.mjs",
    paramsSchema: { type: "object", properties: { block: { type: "string" } }, additionalProperties: false },
  }),
  "head.flat": Object.freeze({
    kind: "construct", generate: flatHeadConstruct, source: "src/form/shaped-vocab.mjs",
    paramsSchema: { type: "object", properties: { block: { type: "string" } }, additionalProperties: false },
  }),
  "course.stairs": Object.freeze({
    kind: "construct", generate: stairRunConstruct, source: "src/form/shaped-vocab.mjs",
    paramsSchema: { type: "object", properties: { block: { type: "string" }, winding: { enum: ["walk", "soffit"] } }, additionalProperties: false },
  }),
  "course.slab": Object.freeze({
    kind: "construct", generate: slabStepConstruct, source: "src/form/shaped-vocab.mjs",
    paramsSchema: { type: "object", properties: { block: { type: "string" }, kind: { enum: ["bottom", "top", "double"] } }, additionalProperties: false },
  }),
  "dormer": Object.freeze({
    kind: "construct", generate: dormerGable, source: "src/form/idiom-constructs.mjs",
    paramsSchema: {
      type: "object",
      properties: {
        width: { type: "integer", minimum: 3 }, depth: { type: "integer", minimum: 2 },
        wallHeight: { type: "integer", minimum: 2 },
        wallBlock: { type: "string" }, roofBlock: { type: "string" },
        faceBlock: { type: "string" }, ridgeBlock: { type: "string" },
        aperture: { type: "object", properties: { w: { type: "integer", minimum: 1 }, h: { type: "integer", minimum: 1 } }, additionalProperties: false },
      },
      additionalProperties: false,
    },
  }),
  "chimney": Object.freeze({
    kind: "construct", generate: chimneyStack, source: "src/form/idiom-constructs.mjs",
    paramsSchema: {
      type: "object",
      properties: {
        footprint: { type: "object", properties: { w: { type: "integer", minimum: 1 }, d: { type: "integer", minimum: 1 } }, additionalProperties: false },
        height: { type: "integer", minimum: 1 },
        block: { type: "string" }, cap: { enum: ["crown", "slab", null] }, capBlock: { type: "string" },
      },
      additionalProperties: false,
    },
  }),
  "jetty": Object.freeze({
    kind: "construct", generate: jettyOverhang, source: "src/form/idiom-constructs.mjs",
    paramsSchema: {
      type: "object",
      properties: {
        overhang: { type: "integer", minimum: 1 }, joistEvery: { type: "integer", minimum: 1 },
        beamBlock: { type: "string" }, joistBlock: { type: ["string", "null"] },
      },
      additionalProperties: false,
    },
  }),
  "plinth": Object.freeze({
    kind: "construct", generate: plinthBand, source: "src/form/idiom-constructs.mjs",
    paramsSchema: {
      type: "object",
      properties: {
        courses: { type: "integer", minimum: 1 }, inset: { type: "integer", minimum: 0 },
        block: { type: "string" },
      },
      additionalProperties: false,
    },
  }),
  // ---- passes: registered for name resolution, natural signatures (see module header) ----
  "timber-frame": Object.freeze({
    kind: "pass", fn: placementGrammar, source: "src/form/placement-grammar.mjs",
    paramsSchema: { type: "object", additionalProperties: true },
  }),
  "opening-dressing": Object.freeze({
    kind: "pass", fn: dressOpenings, source: "src/view/opening-dressing.mjs",
    paramsSchema: { type: "object", additionalProperties: true },
  }),
  "hollow": Object.freeze({
    kind: "pass", fn: markHollowable, apply: carveArtifact, source: "src/view/hollow-carve.mjs",
    paramsSchema: { type: "object", additionalProperties: true },
  }),
  "floorplan": Object.freeze({
    kind: "pass", fn: generateFloorplan, source: "src/view/floorplan.mjs",
    paramsSchema: { type: "object", additionalProperties: true },
  }),
});

/** Sorted idiom names (deterministic iteration order for cards and validators). */
export function idiomNames() {
  return Object.keys(IDIOM_REGISTRY).sort();
}

/** Resolve an idiom or THROW — an unknown idiom name in a validated program is a bug. */
export function getIdiom(name) {
  const entry = IDIOM_REGISTRY[name];
  if (!entry) fail("getIdiom", `unknown idiom "${name}" (known: ${idiomNames().join(", ")})`);
  return entry;
}
