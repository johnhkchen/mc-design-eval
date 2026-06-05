// Staged-sculptor diagnostic review critic — bookend 2 (T-026-01, epic E-11 / story S-026).
//
// The critic renders a build state and emits a STRUCTURED DIAGNOSIS — a list of
// `{ defect, where, route }` — then ROUTES each defect to the stage that should re-run. It
// DIAGNOSES AND ROUTES; it never re-emits a build. That is the P14 cure encoded in a type: a
// blanket "improve" 2nd pass detaches masses and regresses a strong build (run 020); the staged
// loop instead re-runs ONLY the responsible pass over the LOCKED prior state, so improvement stays
// additive. The critic's output is the routing instruction that loop (S-029) consumes — never a new
// artifact.
//
// LAYERING (mirrors iterative-multimodal.mjs / render-tool.mjs):
//   - PURE core (unit-tested by `npm test`): the defect vocabulary, the routing table, and
//     `routeDefect` / `routeDiagnosis`. This is the heart — AC#1–#3 live here.
//   - LIVE leaves (NOT unit-tested — GL + metered claude -p + BAML): `defaultRender` (compile →
//     headless render) and `defaultDiagnose` (the BAML categorical judge via a tsx subprocess).
//     Both are lazy/spawned so importing this module for the pure tests loads neither GL nor BAML.
//   - `reviewBuildState` orchestrates render → diagnose → route, with `render`/`diagnose`
//     INJECTABLE so the whole pipeline is testable with stubs (the model call is stubbed; the
//     routing is tested directly — AC#4). The live path is demonstrated in consolidation (S-029).
//
// STAGE-AGNOSTIC (AC#3): the critic reads only build-state CELL FIELDS (occupied/material via
// occupiedCells) — never any pass's internals. The one ambiguous route (`flat` → material vs
// relief) is disambiguated FROM THE STATE: an un-textured flat field wants material; a textured
// flat field wants relief depth.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { occupiedCells } from "./build-state.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The routing table (AC#1: explicit). Maps each defect in the vocabulary to its CANDIDATE
 * stage(s), in priority order. Only `flat` has more than one candidate; `routeDefect` resolves it
 * from the build state. Route targets name E-11 craft passes:
 *   massing (T-025) · material/material-noise (T-027) · relief (T-028) · curve idiom · detail.
 * Matches the ticket's table verbatim: flat→relief/material, ringing→curve idiom,
 * under-detailed-focal→detail, proportion→massing.
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export const ROUTING_TABLE = Object.freeze({
  flat: Object.freeze(["material", "relief"]),
  ringing: Object.freeze(["curve"]),
  "under-detailed-focal": Object.freeze(["detail"]),
  proportion: Object.freeze(["massing"]),
});

/** The defect vocabulary (AC#1) — the routing table's keys, frozen. */
export const DEFECTS = Object.freeze(Object.keys(ROUTING_TABLE));

/** Every stage a defect can route to (derived from the table), frozen — for docs/validation. */
export const ROUTE_TARGETS = Object.freeze([
  ...new Set(Object.values(ROUTING_TABLE).flat()),
]);

/** Thrown when a raw defect is outside the vocabulary — loud, never silently dropped. */
export class DefectVocabularyError extends Error {
  constructor(defect) {
    super(`unknown defect "${defect}" — expected one of ${DEFECTS.join(", ")}`);
    this.name = "DefectVocabularyError";
    this.code = "unknown_defect";
    this.defect = defect;
  }
}

/** Assert `defect` is in the vocabulary; throws `DefectVocabularyError` otherwise. */
export function assertDefect(defect) {
  if (!Object.prototype.hasOwnProperty.call(ROUTING_TABLE, defect)) {
    throw new DefectVocabularyError(defect);
  }
}

/**
 * Route ONE raw defect to the stage that should re-run. PURE. `where` is passed through verbatim
 * (it is a free-text region from the image judge — never parsed). `flat` is resolved FROM THE
 * STATE (AC#3/D4): if any occupied cell is still un-textured (`material === null`), the flat field
 * wants material; otherwise it wants relief depth. Every other defect has a single candidate.
 * @param {import("./build-state.mjs").BuildState} state
 * @param {{defect: string, where?: string}} raw
 * @returns {{defect: string, where: string, route: string}}
 */
export function routeDefect(state, { defect, where = "" }) {
  assertDefect(defect);
  let route;
  if (defect === "flat") {
    const anyUntextured = occupiedCells(state).some((c) => c.cell.material === null);
    route = anyUntextured ? "material" : "relief";
  } else {
    route = ROUTING_TABLE[defect][0];
  }
  return { defect, where, route };
}

/**
 * Route a whole raw diagnosis (a list of `{defect, where}` from the judge) to
 * `{defect, where, route}[]`. PURE, order-preserving. An empty/absent list yields `[]` (a clean
 * build). Any out-of-vocabulary defect throws via `routeDefect`.
 * @param {import("./build-state.mjs").BuildState} state
 * @param {Array<{defect: string, where?: string}>} [raws]
 * @returns {Array<{defect: string, where: string, route: string}>}
 */
export function routeDiagnosis(state, raws = []) {
  return raws.map((raw) => routeDefect(state, raw));
}

/**
 * LIVE render leaf (NOT unit-tested — pulls headless GL). Compile the build state to a
 * DesignArtifact and render it head-on (E-02) to a temp PNG, returning the image bytes plus the
 * RenderReport. Lazy-imports compile + the GL render core so the pure tests never load them.
 * @param {import("./build-state.mjs").BuildState} state
 * @param {{outPath?: string, view?: object}} [opts]
 * @returns {Promise<{image: Buffer, report: object}>}
 */
export async function defaultRender(state, opts = {}) {
  const { toDesignArtifact } = await import("./compile.mjs");
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  const { readFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const artifact = toDesignArtifact(state);
  const outPath = opts.outPath ?? join(tmpdir(), `sculptor-review-${state.width}x${state.height}.png`);
  const report = await renderArtifact(artifact, { outPath, view: opts.view });
  return { image: readFileSync(report.path), report };
}

/**
 * LIVE diagnose leaf (NOT unit-tested — metered claude -p + BAML). Run the categorical critic over
 * a render image via the tsx BAML bridge (baml-review.mts — the same `.mjs ↔ .mts` pattern as
 * benchmarks' judgeRender), returning the raw `{defect, where}[]` (already mapped to the kebab
 * vocabulary by the bridge). `image` is written to a temp PNG the bridge reads by path.
 * @param {Buffer} image  PNG bytes
 * @param {string} brief  the brief the build was meant to satisfy
 * @returns {Promise<Array<{defect: string, where: string}>>}
 */
export async function defaultDiagnose(image, brief) {
  const { spawn } = await import("node:child_process");
  const { writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const imagePath = join(tmpdir(), "sculptor-review-diagnose.png");
  writeFileSync(imagePath, image);
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", join(HERE, "baml-review.mts")], {
      stdio: ["pipe", "pipe", "inherit"],
    });
    let out = "";
    child.stdout.on("data", (c) => (out += c.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`baml-review exited ${code}`));
      try {
        resolve(JSON.parse(out).defects ?? []);
      } catch (e) {
        reject(new Error(`baml-review: unparseable output (${e.message})\n${out.slice(0, 300)}`));
      }
    });
    child.stdin.end(JSON.stringify({ imagePath, brief }));
  });
}

/**
 * Review a build state: render it, diagnose the render, and route each defect to a stage. The
 * orchestration is deliberately thin — all logic is in the PURE routing (`routeDiagnosis`). The
 * product is the DIAGNOSIS (a list of stages to re-run), never a new artifact — "routes, never
 * re-emits" (AC#2). `render` and `diagnose` are injectable; their defaults are the live GL/BAML
 * leaves, so a unit test drives the whole pipeline with stubs (AC#4).
 * @param {import("./build-state.mjs").BuildState} state
 * @param {Object} [deps]
 * @param {string} [deps.brief]  the brief, forwarded to the judge
 * @param {(state: any) => Promise<{image: Buffer, report?: object}>} [deps.render]
 * @param {(image: Buffer, brief: string) => Promise<Array<{defect: string, where?: string}>>} [deps.diagnose]
 * @returns {Promise<{diagnosis: Array<{defect, where, route}>, render: object|null}>}
 */
export async function reviewBuildState(
  state,
  { brief = "", render = defaultRender, diagnose = defaultDiagnose } = {},
) {
  const { image, report = null } = await render(state);
  const raws = await diagnose(image, brief);
  return { diagnosis: routeDiagnosis(state, raws), render: report };
}
