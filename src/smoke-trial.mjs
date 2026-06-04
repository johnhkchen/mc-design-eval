// The end-to-end smoke trial — the "see an image" milestone (T-004-03; E-03/E-06).
//
// The lone sink of the ticket DAG. Composes the pieces built before it into one
// path: prompt → artifact → materialize → render → SAVED IMAGE, with the transcript
// and token counts already logged by the runner. It (1) WIRES the render tool
// (T-003-04) into the trial's SDK session as an invocable `mcp__render__render` tool
// (AC #1), and (2) deterministically renders the FINAL artifact into the trial store
// (AC #2–#4) — single-shot is "one generation, no revision", so the milestone image
// is a property of the harness, not of an emergent model tool call.
//
// Layering mirrors the rest of the harness: it reuses single-shot's PURE building
// blocks (buildSingleShotPrompt / assertAttribution) and the metered seam (runTrial,
// the one SDK call) without re-opening either. The two pure helpers below
// (renderToolOptions, attachRender) are unit-tested by `npm test`; the live runner
// (runSmokeTrial) is thin glue over already-tested-or-documented live seams and is
// NOT exercised by `npm test` (spec §4 billing + headless GL).

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildSingleShotPrompt, assertAttribution } from "./single-shot.mjs";
import { runTrial } from "./trial.mjs";
import {
  createRenderServer,
  renderSummary,
  RENDER_SERVER_NAME,
  RENDER_TOOL_NAME,
} from "./render-tool.mjs";

/** The canonical milestone image name, written inside the trial store. */
export const RENDER_IMAGE_NAME = "render.png";

/** The model-facing name the render tool surfaces under (config.mjs pre-commit). */
export const RENDER_TOOL_FQN = `mcp__${RENDER_SERVER_NAME}__${RENDER_TOOL_NAME}`;

/**
 * The SDK `query` options that WIRE the render MCP server into a trial session as an
 * invocable tool (AC #1). PURE — just shapes the options; spread over
 * SAFE_TRIAL_OPTIONS by runTrial. The tool is a non-code-exec in-process MCP tool, so
 * the merged options still pass assertSafeOptions (exactly the wiring config.mjs's
 * SAFE_TRIAL_OPTIONS docstring anticipates). The single-shot prompt is unchanged, so
 * making the tool merely AVAILABLE does not alter attribution; the model is free to
 * call it (multimodal archetypes will), single-shot simply does not.
 * @param {object} server an McpSdkServerConfigWithInstance from createRenderServer
 * @returns {{ mcpServers: Record<string, object>, allowedTools: string[] }}
 */
export function renderToolOptions(server) {
  return {
    mcpServers: { [RENDER_SERVER_NAME]: server },
    allowedTools: [RENDER_TOOL_FQN],
  };
}

/**
 * Return a NEW trial record carrying a `render` field that points the record at its
 * image (the trial-relative png name) and folds in the loggable build summary. PURE
 * and immutable — never mutates `record` (mirrors buildTrialRecord). `summary.path`
 * (an absolute, env-specific path) is intentionally dropped in favor of the relative
 * `image`; the record already implies its own directory.
 * @param {import("./trial.mjs").TrialRecord} record
 * @param {ReturnType<typeof renderSummary>} summary
 * @param {string} [imageName]
 * @returns {import("./trial.mjs").TrialRecord & { render: object }}
 */
export function attachRender(record, summary, imageName = RENDER_IMAGE_NAME) {
  const { path, ...rest } = summary;
  return { ...record, render: { image: imageName, ...rest } };
}

/**
 * Run the milestone smoke trial end to end (AC #1–#4). LIVE and METERED — generates
 * via the single SDK seam, then renders the final artifact via the GL render core.
 * NOT exercised by `npm test` (spec §4); its only non-pure logic is createRenderServer
 * / runTrial / renderArtifact, each its own module's tested-or-documented live seam.
 *
 * Steps: build the frozen single-shot prompt (pure; validates the spec) → wire the
 * render tool into the session (AC #1) → run the metered trial, which writes
 * artifact.json/transcript.jsonl/trial.json under trials/<trial_id>/ → assert
 * attribution → render the final artifact to trials/<trial_id>/render.png (AC #2) →
 * rewrite trial.json so the record references the image and its build summary (AC #3).
 *
 * @param {import("./single-shot.mjs").TrialSpec} spec
 * @returns {Promise<{ record: object, artifact: object, report: object, dir: string, imagePath: string }>}
 */
export async function runSmokeTrial(spec) {
  const { prompt, seedMetadata } = buildSingleShotPrompt(spec);
  const outDir = spec.outDir ?? "trials";
  const dir = join(outDir, spec.trialId);

  // AC #1: the render tool is wired in as an invocable mcp__render__render tool.
  // Point its out dir at the trial store so any in-session render also lands there.
  const server = await createRenderServer({ outDir: dir });

  const { record, artifact } = await runTrial({
    prompt,
    metadata: seedMetadata,
    model: spec.model,
    outDir,
    options: renderToolOptions(server),
  });
  assertAttribution(artifact);

  // AC #2: materialize + render the FINAL artifact. Lazy import keeps the GL/prismarine
  // core out of the process for the pure unit tests that import this module.
  const imagePath = join(dir, RENDER_IMAGE_NAME);
  const { renderArtifact } = await import("../render/src/render-tool.mjs");
  const report = await renderArtifact(artifact, { outPath: imagePath });

  // AC #3: file the image alongside the artifact/transcript/token counts and make the
  // record self-describing — it now points at render.png and its build summary.
  const finalRecord = attachRender(record, renderSummary(report));
  writeFileSync(join(dir, "trial.json"), JSON.stringify(finalRecord, null, 2) + "\n");

  return { record: finalRecord, artifact, report, dir, imagePath };
}
