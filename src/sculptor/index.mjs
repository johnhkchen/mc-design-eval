// Staged-sculptor spine — public barrel (T-024-01, epic E-11 / story S-024).
//
// One import site for downstream tickets (massing T-025, material-noise T-027, relief T-028, review
// T-026). The spine = build state + lock semantics + stage interface + orchestrator + compile.

export {
  FIELDS,
  cellKey,
  parseKey,
  defaultCell,
  createBuildState,
  getCell,
  isLocked,
  occupiedCells,
  draftState,
  lockFields,
  LockViolationError,
} from "./build-state.mjs";

export { changedFields, defineStage, runStages, StageRejectedError } from "./orchestrator.mjs";

export { toDesignArtifact, COMPILE_DEFAULTS } from "./compile.mjs";

export {
  conceptGridSource,
  mass,
  proportionsOf,
  compileMassing,
  MASSING_BLOCK,
  MASSING_STYLE,
} from "./massing.mjs";

export {
  hueFamilySet,
  materialStage,
  material,
  compileMaterial,
  MATERIAL_STYLE,
} from "./material.mjs";

export {
  DEFECTS,
  ROUTE_TARGETS,
  ROUTING_TABLE,
  routeDefect,
  routeDiagnosis,
  assertDefect,
  DefectVocabularyError,
  reviewBuildState,
  defaultRender,
  defaultDiagnose,
} from "./review.mjs";
