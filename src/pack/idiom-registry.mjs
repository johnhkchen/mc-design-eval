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
// THE BRUSH CONTRACT (T-128-01, story S-128, epic E-32): every entry is a BRUSH — parametrized,
// composable, unit-tested, preview-carded — and THIS TABLE IS THE ONLY DOOR to a build technique
// (E-32 Rule 1; src/pack/brush-door.conformance.test.mjs enforces it). Each entry additionally
// carries:
//   • `composition` {consumes, emits} — the chaining declaration (closed vocabularies in
//     src/pack/brush-contract.mjs): constructs are spec → cells; passes are occupancy + context →
//     placements (or a removeSet their `apply` consumes).
//   • `tests` — the unit-test file that proves the technique (contract-checked to exist and to
//     name the brush).
//   • `preview` — the preview-card requirement: constructs point at committed IDIOM_CARD_SPECS
//     ids; passes declare a SYNTHETIC SUBJECT (substrate + params, fixture data — CARD_ROWS
//     status) and an in-entry `realize({occ, cells})` that applies the pass and returns the
//     final preview cells + the effect size. src/pack/brush-preview.mjs builds the substrate;
//     src/pack/brush-catalog.mjs renders the catalog. Some realize closures stage their own
//     defect (pits, salt) or cut the result away (hollow, floorplan) — DISPLAY choices that make
//     the technique visible on a card; the ops' real semantics live in their `tests`.
//   • brush-facing aliases at the bottom (BRUSH_REGISTRY/brushNames/getBrush) — same frozen
//     table, the E-32/S-131 surface.
//
// Subject-agnostic: no block names, no dimensions, no style names in REALIZATION CODE — preview
// substrates/params are committed synthetic fixture data, the same status as the card specs.
// PURE — no GL/IO/Date/random.

import { generateRoof, gableRecord, colsOf } from "../view/roof-generate.mjs";
import { archRing, flatHead, stairRun, slabStep } from "../form/shaped-vocab.mjs";
import { dormerGable, chimneyStack, jettyOverhang, plinthBand } from "../form/idiom-constructs.mjs";
import { placementGrammar } from "../form/placement-grammar.mjs";
import { dressOpenings, extractApertures } from "../view/opening-dressing.mjs";
import { markHollowable, carveArtifact } from "../view/hollow-carve.mjs";
import { generateFloorplan } from "../view/floorplan.mjs";
import { zoneFill } from "../view/zone-fill.mjs";
import { paintFace, mergePaints, applyPaint } from "../view/face-paint.mjs";
import { regularizeRoofCourses, stripStraySalt } from "../view/surface-pattern.mjs";
import { projectSurface } from "../view/surface-grid.mjs";
import { occupancyFromCells, bareBlock } from "../view/occupancy.mjs";
import { roofThatchConstruct } from "../view/roof-thatch.mjs";
import { roofSteepGableConstruct, STEEP_PITCH_CLASSES } from "../view/roof-steep.mjs";
import { clinkerCourses } from "../view/clinker.mjs";
import { limewashAspect } from "../view/limewash.mjs";
import { surfaceRelief } from "../view/surface-relief.mjs";

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

const familyOfBlocks = (blocks) => ({
  field: blocks.field, stairs: blocks.stairs ?? null, slab: blocks.slab ?? null, findings: [],
});

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
  // T-134-01: classes above the stair's native 45° belong to roof.gable.steep — the legacy
  // pitch>1 emission here was unnamed and unproven; a silent second door would be an
  // approximation, and refusals are named findings (E-33).
  if (pitch > 1) fail("roofGableConstruct", `spec.pitch ${pitch} exceeds the 45° stair course — steep classes are roof.gable.steep's contract`);
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

/** Apply placements over base cells, last-writer-wins by position (the expand rule) — the pass
 *  previews' merge. Blocks are stored bare (the artifact assembler namespaces). */
function overlayCells(cells, placements) {
  const byKey = new Map(cells.map((c) => [c.pos.join(","), c]));
  for (const p of placements) {
    byKey.set(p.pos.join(","), {
      pos: [...p.pos],
      block: bareBlock(p.block),
      ...(p.state ? { state: { ...p.state } } : {}),
    });
  }
  return [...byKey.values()];
}

/** Construct composition: the uniform spec → cells contract. */
const CONSTRUCT_IO = Object.freeze({ consumes: Object.freeze(["spec"]), emits: Object.freeze(["cells"]) });

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
    tests: "src/pack/idiom-registry.test.mjs", composition: CONSTRUCT_IO,
    preview: { card: ["gable-ridge-z", "gable-ridge-x"] },
    paramsSchema: { type: "object", properties: { pitch: { type: "number", exclusiveMinimum: 0, maximum: 1 }, blocks: BLOCKS_FRAGMENT }, additionalProperties: false },
  }),
  "roof.gable.steep": Object.freeze({
    kind: "construct", generate: roofSteepGableConstruct, source: "src/view/roof-steep.mjs",
    tests: "src/view/roof-steep.test.mjs", composition: CONSTRUCT_IO,
    preview: { card: ["gable-steep-z", "gable-steep-x", "gable-steep-3"] },
    paramsSchema: { type: "object", properties: { pitch: { enum: [...STEEP_PITCH_CLASSES] }, blocks: BLOCKS_FRAGMENT }, additionalProperties: false },
  }),
  "roof.hip": Object.freeze({
    kind: "construct", generate: roofHipConstruct, source: "src/view/roof-generate.mjs",
    tests: "src/pack/idiom-registry.test.mjs", composition: CONSTRUCT_IO,
    preview: { card: ["hip"] },
    paramsSchema: { type: "object", properties: { pitch: { type: "number", exclusiveMinimum: 0 }, blocks: BLOCKS_FRAGMENT }, additionalProperties: false },
  }),
  "roof.pyramid": Object.freeze({
    kind: "construct", generate: roofPyramidConstruct, source: "src/view/roof-generate.mjs",
    tests: "src/pack/idiom-registry.test.mjs", composition: CONSTRUCT_IO,
    preview: { card: ["pyramid"] },
    paramsSchema: { type: "object", properties: { pitch: { type: "number", exclusiveMinimum: 0 }, blocks: BLOCKS_FRAGMENT }, additionalProperties: false },
  }),
  "arch": Object.freeze({
    kind: "construct", generate: archConstruct, source: "src/form/shaped-vocab.mjs",
    tests: "src/pack/idiom-registry.test.mjs", composition: CONSTRUCT_IO,
    preview: { card: ["arch"] },
    paramsSchema: { type: "object", properties: { block: { type: "string" } }, additionalProperties: false },
  }),
  "head.flat": Object.freeze({
    kind: "construct", generate: flatHeadConstruct, source: "src/form/shaped-vocab.mjs",
    tests: "src/pack/idiom-registry.test.mjs", composition: CONSTRUCT_IO,
    preview: { card: ["head-flat"] },
    paramsSchema: { type: "object", properties: { block: { type: "string" } }, additionalProperties: false },
  }),
  "course.stairs": Object.freeze({
    kind: "construct", generate: stairRunConstruct, source: "src/form/shaped-vocab.mjs",
    tests: "src/pack/idiom-registry.test.mjs", composition: CONSTRUCT_IO,
    preview: { card: ["stairs-walk"] },
    paramsSchema: { type: "object", properties: { block: { type: "string" }, winding: { enum: ["walk", "soffit"] } }, additionalProperties: false },
  }),
  "course.slab": Object.freeze({
    kind: "construct", generate: slabStepConstruct, source: "src/form/shaped-vocab.mjs",
    tests: "src/pack/idiom-registry.test.mjs", composition: CONSTRUCT_IO,
    preview: { card: ["slab-course"] },
    paramsSchema: { type: "object", properties: { block: { type: "string" }, kind: { enum: ["bottom", "top", "double"] } }, additionalProperties: false },
  }),
  "dormer": Object.freeze({
    kind: "construct", generate: dormerGable, source: "src/form/idiom-constructs.mjs",
    tests: "src/form/idiom-constructs.test.mjs", composition: CONSTRUCT_IO,
    preview: { card: ["dormer-px", "dormer-nx", "dormer-pz", "dormer-nz"] },
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
    tests: "src/form/idiom-constructs.test.mjs", composition: CONSTRUCT_IO,
    preview: { card: ["chimney-bare", "chimney-crown", "chimney-slab"] },
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
    tests: "src/form/idiom-constructs.test.mjs", composition: CONSTRUCT_IO,
    preview: { card: ["jetty-xp", "jetty-xn", "jetty-zp", "jetty-zn"] },
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
    tests: "src/form/idiom-constructs.test.mjs", composition: CONSTRUCT_IO,
    preview: { card: ["plinth"] },
    paramsSchema: {
      type: "object",
      properties: {
        courses: { type: "integer", minimum: 1 }, inset: { type: "integer", minimum: 0 },
        block: { type: "string" },
      },
      additionalProperties: false,
    },
  }),
  // ---- factory-grown brushes (E-32/T-132-01: the saltcrag backlog's gap, through the door) ----
  "roof.thatch": Object.freeze({
    kind: "construct", generate: roofThatchConstruct, source: "src/view/roof-thatch.mjs",
    tests: "src/view/roof-thatch.test.mjs", composition: CONSTRUCT_IO,
    preview: { card: ["thatch"] },
    paramsSchema: {
      type: "object",
      properties: {
        pitch: { type: "number", minimum: 1 }, block: { type: "string" },
        thickness: { type: "integer", minimum: 2 }, ridgeRoll: { type: "boolean" },
        ridgeBlock: { type: ["string", "null"] }, eaveOvershoot: { type: "integer", minimum: 1 },
      },
      additionalProperties: false,
    },
  }),
  "surface.clinker": Object.freeze({
    kind: "pass", fn: clinkerCourses, source: "src/view/clinker.mjs",
    tests: "src/view/clinker.test.mjs",
    composition: { consumes: ["occupancy", "zones"], emits: ["placements", "report"] },
    preview: {
      // a plastered upper panel over a rubble ground course: the laps board the upper storey
      // (odd courses proud of the wall plane), the rubble below stays showing
      substrate: { kind: "shell", spec: { footprint: { x0: 0, x1: 6, z0: 0, z1: 4 }, y0: 0, height: 6, wallBlock: "cobblestone" } },
      params: { board: "dark_oak_planks", upperFrom: 2 },
      realize: ({ occ, cells }) => {
        const r = clinkerCourses(occ, {
          board: "dark_oak_planks",
          zoneOf: (pos) => (pos[1] >= 2 ? "upper" : "ground"),
        });
        return { cells: overlayCells(cells, r.placements), effect: r.placements.length };
      },
    },
    paramsSchema: {
      type: "object",
      properties: {
        board: { type: "string" }, lap: { type: "integer", minimum: 0, maximum: 1 },
        course: { type: "integer", minimum: 1 }, trimBlock: { type: ["string", "null"] },
      },
      additionalProperties: false,
    },
  }),
  "surface.limewash": Object.freeze({
    kind: "pass", fn: limewashAspect, source: "src/view/limewash.mjs",
    tests: "src/view/limewash.test.mjs",
    composition: { consumes: ["occupancy", "spec"], emits: ["placements", "report"] },
    preview: {
      // the thrift coat: ONE weather face turns white over the rubble field; the other walls
      // keep grey — the card shows directionality, the brush's whole point
      substrate: { kind: "shell", spec: { footprint: { x0: 0, x1: 6, z0: 0, z1: 4 }, y0: 0, height: 5, wallBlock: "cobblestone" } },
      params: { block: "white_terracotta", aspects: ["-z"], coverage: 1, minRun: 2 },
      realize: ({ occ, cells }) => {
        const r = limewashAspect(occ, { block: "white_terracotta", aspects: ["-z"], coverage: 1, minRun: 2 });
        return { cells: overlayCells(cells, r.placements), effect: r.placements.length };
      },
    },
    paramsSchema: {
      type: "object",
      properties: {
        block: { type: "string" },
        aspects: { type: "array", items: { enum: ["+x", "-x", "+z", "-z"] }, minItems: 1 },
        coverage: { type: "number", exclusiveMinimum: 0, maximum: 1 },
        minRun: { type: "integer", minimum: 1 },
        preserve: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
  }),
  "surface.relief": Object.freeze({
    kind: "pass", fn: surfaceRelief, source: "src/view/surface-relief.mjs",
    tests: "src/view/surface-relief.test.mjs",
    composition: { consumes: ["occupancy"], emits: ["placements", "report"] },
    preview: {
      // pilaster strips PROUD of a flush field: every third column on the -z face is relieved one
      // cell forward; the field between reads recessed by exclusion (no air op) — relief is geometry
      substrate: { kind: "shell", spec: { footprint: { x0: 0, x1: 8, z0: 0, z1: 4 }, y0: 0, height: 5, wallBlock: "white_terracotta" } },
      params: { material: "stripped_oak_log", faces: ["-z"], rhythm: { axis: "column", every: 3, span: 1 } },
      realize: ({ occ, cells }) => {
        const r = surfaceRelief(occ, {
          material: "stripped_oak_log", faces: ["-z"], rhythm: { axis: "column", every: 3, span: 1 },
        });
        return { cells: overlayCells(cells, r.placements), effect: r.placements.length };
      },
    },
    paramsSchema: {
      type: "object",
      properties: {
        material: { type: "string" },
        faces: { type: "array", items: { enum: ["+x", "-x", "+z", "-z"] }, minItems: 1 },
        rhythm: {
          type: "object",
          properties: {
            axis: { enum: ["column", "row"] }, every: { type: "integer", minimum: 1 },
            span: { type: "integer", minimum: 1 }, phase: { type: "integer", minimum: 0 },
          },
          additionalProperties: false,
        },
        depth: { type: "integer", minimum: 1 },
      },
      additionalProperties: false,
    },
  }),
  // ---- passes: registered for name resolution, natural signatures (see module header) ----
  "timber-frame": Object.freeze({
    kind: "pass", fn: placementGrammar, source: "src/form/placement-grammar.mjs",
    tests: "src/form/placement-grammar.test.mjs",
    composition: { consumes: ["occupancy", "kit", "zones"], emits: ["placements", "report"] },
    preview: {
      substrate: { kind: "shell", spec: { footprint: { x0: 0, x1: 8, z0: 0, z1: 5 }, y0: 0, height: 6, wallBlock: "white_terracotta" } },
      params: { bandNames: ["upper"], frame: "dark_oak_planks", floorLines: [3], upperTop: 5 },
      realize: ({ occ, cells }) => {
        const kit = [
          { block: "dark_oak_planks", confidence: "high", formClass: "cube", whereUsed: ["trim"] },
          { block: "white_terracotta", confidence: "high", formClass: "cube", whereUsed: ["upper"] },
        ];
        const r = placementGrammar(occ, {
          kit, bandNames: ["upper"],
          policy: { upper: { dominant: "white_terracotta", preserve: ["dark_oak_planks"] } },
          zoneOf: () => "upper", floorLines: [3], upperTop: 5, roofKeys: new Set(),
        });
        return { cells: overlayCells(cells, r.placements), effect: r.placements.length };
      },
    },
    paramsSchema: { type: "object", additionalProperties: true },
  }),
  "opening-dressing": Object.freeze({
    kind: "pass", fn: dressOpenings, source: "src/view/opening-dressing.mjs",
    tests: "src/view/opening-dressing.test.mjs",
    composition: { consumes: ["occupancy", "features", "kit"], emits: ["placements", "report"] },
    preview: {
      // openings ALIGN on both walls: the aperture detector reads enclosed air in the solid
      // PROJECTION, so a preview hole must pierce the thin pavilion (a committed reference
      // building reads the same way — holes are through the hollow shell)
      substrate: {
        kind: "shell",
        spec: {
          footprint: { x0: 0, x1: 8, z0: 0, z1: 4 }, y0: 0, height: 5, wallBlock: "white_terracotta",
          openings: [
            { wall: "-z", at: [2, 2], w: 2, h: 2 }, { wall: "+z", at: [2, 2], w: 2, h: 2 },
            { wall: "-z", at: [6, 0], w: 1, h: 3 }, { wall: "+z", at: [6, 0], w: 1, h: 3 },
          ],
        },
      },
      params: { slots: { infill: "oak_fence", shutter: "spruce_trapdoor", door: "oak_door", light: "lantern", frame: "dark_oak_planks" } },
      realize: ({ occ, cells }) => {
        const apertures = extractApertures(occ);
        const treatments = { slots: {
          infill: { block: "oak_fence" }, shutter: { block: "spruce_trapdoor" },
          door: { block: "oak_door" }, light: { block: "lantern" }, frame: { block: "dark_oak_planks" },
        } };
        const r = dressOpenings(occ, apertures, treatments);
        return { cells: overlayCells(cells, r.placements), effect: r.placements.length };
      },
    },
    paramsSchema: { type: "object", additionalProperties: true },
  }),
  "hollow": Object.freeze({
    kind: "pass", fn: markHollowable, apply: carveArtifact, source: "src/view/hollow-carve.mjs",
    tests: "src/view/hollow-carve.test.mjs",
    composition: { consumes: ["occupancy"], emits: ["removeSet", "report"] },
    preview: {
      // display CUTAWAY: the op's invariant is exteriorHeld (the carve is invisible from outside),
      // so the card shows the kept shell sliced at mid-x to reveal the cavity and wall thickness
      substrate: { kind: "solid", spec: { footprint: { x0: 0, x1: 6, z0: 0, z1: 5 }, y0: 0, height: 5, block: "stone_bricks" } },
      params: { inset: 1, cutAtX: 3 },
      realize: ({ occ, cells }) => {
        const { remove } = markHollowable(occ, { inset: 1 });
        const kept = cells.filter((c) => !remove.has(c.pos.join(",")));
        return { cells: kept.filter((c) => c.pos[0] <= 3), effect: remove.size };
      },
    },
    paramsSchema: { type: "object", additionalProperties: true },
  }),
  "floorplan": Object.freeze({
    kind: "pass", fn: generateFloorplan, source: "src/view/floorplan.mjs",
    tests: "src/view/floorplan.test.mjs",
    composition: { consumes: ["occupancy", "features", "spec"], emits: ["placements", "report"] },
    preview: {
      // sealed box so the interior is camera-hidden (the op's safeAir predicate); the top course
      // is then cut away for display so the divider walls read from the gate azimuths
      substrate: { kind: "box", spec: { footprint: { x0: 0, x1: 8, z0: 0, z1: 6 }, y0: 0, height: 5, block: "stone_bricks" } },
      params: { rows: 1, cols: 2, materials: { floor: "spruce_planks", wall: "oak_planks" } },
      realize: ({ occ, cells }) => {
        const read = {
          footprint: { bbox: { minX: 0, maxX: 8, minZ: 0, maxZ: 6 } },
          storeyBands: { floorLines: [0], bands: [{ yStart: 0, yEnd: 4 }] },
        };
        const { placements } = generateFloorplan(occ, read, {
          rows: 1, cols: 2, materials: { floor: "spruce_planks", wall: "oak_planks" },
        });
        return { cells: overlayCells(cells, placements).filter((c) => c.pos[1] < 4), effect: placements.length };
      },
    },
    paramsSchema: { type: "object", additionalProperties: true },
  }),
  // ---- surface brushes: the E-23 spray/paint ops join the door (T-128-01) ----
  "surface.fill": Object.freeze({
    kind: "pass", fn: zoneFill, source: "src/view/zone-fill.mjs",
    tests: "src/view/zone-fill.test.mjs",
    composition: { consumes: ["occupancy", "zones"], emits: ["placements", "report"] },
    preview: {
      // cobble shell with a timber course: the fill recolors the field to the zone dominant and
      // KEEPS the preserve-run (the base-coat + keep rule on one card)
      substrate: {
        kind: "shell",
        spec: { footprint: { x0: 0, x1: 6, z0: 0, z1: 4 }, y0: 0, height: 4, wallBlock: "cobblestone", courses: [{ yRange: [2, 2], block: "dark_oak_log" }] },
      },
      params: { zones: { wall: { dominant: "white_terracotta", preserve: ["dark_oak_log"] } }, skin: "exposure", minRun: 2 },
      realize: ({ occ, cells }) => {
        const r = zoneFill(occ, {
          zoneOf: () => "wall",
          zones: { wall: { dominant: "white_terracotta", preserve: ["dark_oak_log"] } },
          skin: "exposure", minRun: 2,
        });
        return { cells: overlayCells(cells, r.placements), effect: r.placements.length };
      },
    },
    paramsSchema: {
      type: "object",
      properties: { skin: { enum: ["projection", "exposure"] }, minRun: { type: "integer", minimum: 1 } },
      additionalProperties: false,
    },
  }),
  "surface.paint": Object.freeze({
    kind: "pass", fn: paintFace, merge: mergePaints, apply: applyPaint, source: "src/view/face-paint.mjs",
    tests: "src/view/face-paint.test.mjs",
    composition: { consumes: ["occupancy", "spec"], emits: ["placements", "report"] },
    preview: {
      // a target grid of alternating brick courses painted onto the +x face — the model points,
      // the brush paints (recolor only, geometry untouched)
      substrate: { kind: "shell", spec: { footprint: { x0: 0, x1: 6, z0: 0, z1: 3 }, y0: 0, height: 5, wallBlock: "white_terracotta" } },
      params: { dir: "+x", allowed: ["bricks"], pattern: "even-rows" },
      realize: ({ occ, cells }) => {
        const grid = projectSurface(occ, "+x");
        const target = grid.cells.map((row, v) => row.map((c) => (c && v % 2 === 0 ? "bricks" : null)));
        const r = paintFace(occ, "+x", target, { allowed: new Set(["bricks"]) });
        return { cells: overlayCells(cells, r.placements), effect: r.placements.length };
      },
    },
    paramsSchema: {
      type: "object",
      properties: { priority: { type: "array", items: { type: "string" } } },
      additionalProperties: false,
    },
  }),
  "surface.roof-courses": Object.freeze({
    kind: "pass", fn: regularizeRoofCourses, source: "src/view/surface-pattern.mjs",
    tests: "src/view/surface-pattern.test.mjs",
    composition: { consumes: ["occupancy", "zones"], emits: ["placements", "report"] },
    preview: {
      // the substrate is deliberately pitted (two top cells dropped) so the ADD-only hydrologic
      // fill is visible: the pits refill in the dominant material
      substrate: { kind: "solid", spec: { footprint: { x0: 0, x1: 5, z0: 0, z1: 4 }, y0: 0, height: 3, block: "spruce_planks" } },
      params: { dominant: "dark_oak_planks", pits: [[2, 2, 2], [4, 2, 1]] },
      realize: ({ cells }) => {
        const pits = new Set(["2,2,2", "4,2,1"]);
        const pitted = cells.filter((c) => !pits.has(c.pos.join(",")));
        const r = regularizeRoofCourses(occupancyFromCells(pitted), { dominant: "dark_oak_planks" });
        return { cells: overlayCells(pitted, r.placements), effect: r.placements.length };
      },
    },
    paramsSchema: { type: "object", properties: {}, additionalProperties: false },
  }),
  "surface.strip-salt": Object.freeze({
    kind: "pass", fn: stripStraySalt, source: "src/view/surface-pattern.mjs",
    tests: "src/view/surface-pattern.test.mjs",
    composition: { consumes: ["occupancy", "zones"], emits: ["placements", "report"] },
    preview: {
      // the substrate is deliberately salted (three isolated off-dominant specks on the front
      // wall); the op recolors them back to the zone dominant — the card shows the clean wall
      substrate: { kind: "shell", spec: { footprint: { x0: 0, x1: 6, z0: 0, z1: 4 }, y0: 0, height: 4, wallBlock: "cobblestone" } },
      params: { zones: { wall: { dominant: "cobblestone" } }, minKeep: 3, salt: [[1, 1, 0], [3, 2, 0], [5, 1, 0]] },
      realize: ({ cells }) => {
        const salt = new Set(["1,1,0", "3,2,0", "5,1,0"]);
        const salted = cells.map((c) => (salt.has(c.pos.join(",")) ? { ...c, block: "andesite" } : c));
        const r = stripStraySalt(occupancyFromCells(salted), {
          zoneOf: () => "wall", zones: { wall: { dominant: "cobblestone" } }, minKeep: 3,
        });
        return { cells: overlayCells(salted, r.placements), effect: r.placements.length };
      },
    },
    paramsSchema: {
      type: "object",
      properties: { minKeep: { type: "integer", minimum: 1 }, minExtent: { type: "integer", minimum: 1 } },
      additionalProperties: false,
    },
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

// ---------------------------------------------------------------- the brush surface (E-32)

/** The brush registry IS the idiom registry — one frozen table, two vocabularies (E-31 programs
 * name idioms; E-32's factory grows brushes). Same object by identity: registering a brush and
 * registering an idiom are the same act, through the same door. */
export const BRUSH_REGISTRY = IDIOM_REGISTRY;

/** Sorted brush names (the catalog/factory iteration order). */
export const brushNames = idiomNames;

/** Resolve a brush or THROW. */
export const getBrush = getIdiom;
