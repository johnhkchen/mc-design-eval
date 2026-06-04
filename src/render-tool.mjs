// The render tool exposed to the Agent SDK harness (T-003-04; spec §4).
//
// Wraps the render-domain composition core (render/src/render-tool.mjs:
// artifact → PNG) as an in-process Agent SDK tool named `render`, surfaced to the
// model as `mcp__render__render`. The model reasons about a design, calls this tool
// with a design artifact, and gets back the PNG path (AC #1) plus — for multimodal
// revision turns (spec §7) — the rendered image inline.
//
// Layering (mirrors sdk-binding.mjs / trial.mjs): the helpers below are PURE — no
// SDK, no GL, no prismarine — and are unit-tested by `npm test`. The single
// SDK-touching function, createRenderServer, dynamically imports the SDK and the
// render core, so importing THIS module for the pure tests never loads either heavy
// dependency. The contract check is parseArtifact (src/artifact.mjs) — the one schema
// source — not a re-authored zod schema (consistent with sdk-binding Decision 1).

import { join } from "node:path";
import { readFileSync } from "node:fs";
import { parseArtifact } from "./artifact.mjs";

/** Server name → tools surface as `mcp__render__<tool>` (config.mjs pre-commit). */
export const RENDER_SERVER_NAME = "render";
/** The single tool's name. */
export const RENDER_TOOL_NAME = "render";

/** The Node Agent SDK package (loaded lazily, only when building the live server). */
export const SDK_PACKAGE = "@anthropic-ai/claude-agent-sdk";

/**
 * Per-call output path. Distinct renders of one trial (multimodal revision turns)
 * get a `-rev<n>` suffix so they never overwrite. `trialId` is sanitized to safe
 * path characters — it is ultimately model-authored, so it must not escape `outDir`.
 * @param {string} outDir
 * @param {string} trialId
 * @param {number} n  0 for the first render of a trial, then 1, 2, …
 * @returns {string}
 */
export function derivePath(outDir, trialId, n) {
  const safe = String(trialId).replace(/[^a-zA-Z0-9._-]/g, "_") || "render";
  return join(outDir, n === 0 ? `${safe}.png` : `${safe}-rev${n}.png`);
}

/**
 * The error CallToolResult for a located validation failure — `isError: true` so the
 * agent SEES the failure (and can revise) rather than the harness throwing a stack
 * trace. The lines are the same located messages parseArtifact produces.
 * @param {string[]} lines
 * @returns {{ isError: true, content: {type:"text", text:string}[] }}
 */
export function toErrorResult(lines) {
  return {
    isError: true,
    content: [{ type: "text", text: `invalid design artifact:\n${lines.join("\n")}` }],
  };
}

/**
 * Validate and freeze a model-supplied artifact at the tool's door (defense in depth;
 * the SDK structured-output path validates too, but a tool arg is untrusted JSON).
 * Returns the parsed artifact, or a ready-to-return error result.
 * @param {string | object} input
 * @returns {{ ok: true, artifact: import("./artifact.mjs").DesignArtifact }
 *         | { ok: false, result: ReturnType<typeof toErrorResult> }}
 */
export function coerceArtifact(input) {
  const parsed = parseArtifact(input);
  if (parsed.ok) return { ok: true, artifact: parsed.artifact };
  return { ok: false, result: toErrorResult(parsed.errors) };
}

/**
 * The loggable build summary, derived from a RenderReport. This is the SINGLE shape
 * shared by the tool result (what the model sees — AC #1) and the trial record (what
 * the milestone harness logs, T-004-03) so the two never drift. `unmapped` is a count
 * (plus a bounded detail sample when non-zero) so partial builds are visible — a build
 * that silently drops blocks but returns a clean path is a measurement bug. Pure.
 * @param {import("../render/src/render-tool.mjs").RenderReport} report
 * @returns {{ path: string, bytes: number, placed: number, unmapped: number, bounds: object|null, unmapped_detail?: object[] }}
 */
export function renderSummary(report) {
  const summary = {
    path: report.path,
    bytes: report.bytes,
    placed: report.placed,
    unmapped: report.unmapped.length,
    bounds: report.bounds,
  };
  if (report.unmapped.length) {
    summary.unmapped_detail = report.unmapped.slice(0, 5).map((u) => ({
      pos: u.pos,
      block: u.block,
      reason: u.reason,
    }));
  }
  return summary;
}

/**
 * Build the success CallToolResult from a RenderReport. Always a text block carrying a
 * compact JSON summary (the loggable, path-bearing handle — AC #1); optionally an image
 * block (base64 PNG) for visual grounding (spec §4 multimodal).
 * @param {import("../render/src/render-tool.mjs").RenderReport} report
 * @param {{ embedImage?: boolean, pngBuffer?: Buffer | null }} [opts]
 * @returns {{ content: object[] }}
 */
export function toToolResult(report, { embedImage = false, pngBuffer = null } = {}) {
  const summary = renderSummary(report);
  const content = [{ type: "text", text: JSON.stringify(summary, null, 2) }];
  if (embedImage && pngBuffer) {
    content.push({
      type: "image",
      data: Buffer.from(pngBuffer).toString("base64"),
      mimeType: "image/png",
    });
  }
  return { content };
}

/** Default output directory for renders (render/out/, alongside the sample). */
const DEFAULT_OUT_DIR = join(
  dirnameOf(import.meta.url),
  "..",
  "render",
  "out",
);

/** import.meta.url → containing directory, without a node:url import at top level. */
function dirnameOf(metaUrl) {
  const path = new URL(".", metaUrl).pathname;
  return path.replace(/\/$/, "");
}

/**
 * Build the in-process `render` MCP server (AC #3) — the seam the Agent SDK harness
 * adds to `allowedTools` as `mcp__render__render` (config.mjs pre-commit). The model
 * calls `render(artifact, embedImage?)`; the handler constructs+renders and returns the
 * PNG path (AC #1) plus, when embedding, the image (spec §4 multimodal).
 *
 * LIVE-ISH: dynamically imports the SDK (`tool`, `createSdkMcpServer`) and `zod`, and
 * — inside the handler — the GL/prismarine render core. Kept dynamic so importing this
 * module for the pure unit tests loads neither the SDK nor GL. `tool`/`createSdkMcpServer`
 * are pure factories (unlike `query()`), so building the server is free and unmetered;
 * the dynamic import only guards the optional dependency. NOT run by `npm test`.
 *
 * State (AC #2): the only per-server state is a `trialId → count` Map used solely to
 * disambiguate output paths across revision turns. Each call builds a FRESH world
 * (renderArtifact is stateless), so trials cannot bleed.
 *
 * @param {{ outDir?: string, embedImage?: boolean, view?: object }} [opts]
 * @returns {Promise<object>} an McpSdkServerConfigWithInstance for `query({ options:{ mcpServers } })`
 */
export async function createRenderServer(opts = {}) {
  let sdk;
  try {
    sdk = await import(SDK_PACKAGE);
  } catch (err) {
    throw new Error(
      `${SDK_PACKAGE} is not installed — run \`npm install ${SDK_PACKAGE}\` to expose the render tool (${err.message})`,
    );
  }
  const { z } = await import("zod");
  const { tool, createSdkMcpServer } = sdk;

  const outDir = opts.outDir ?? DEFAULT_OUT_DIR;
  const embedImage = opts.embedImage ?? true;
  const view = opts.view;
  const counter = new Map();

  const inputShape = {
    artifact: z
      .record(z.string(), z.unknown())
      .describe(
        "A complete, schema-valid design artifact: schema_version, metadata, style, palette, and placements.",
      ),
    embedImage: z
      .boolean()
      .optional()
      .describe("Return the rendered PNG inline for visual review (default true)."),
  };

  const handler = async (args) => {
    const coerced = coerceArtifact(args.artifact);
    if (!coerced.ok) return coerced.result;
    const artifact = coerced.artifact;

    const trialId = (artifact.metadata && artifact.metadata.trial_id) || "render";
    const n = counter.get(trialId) ?? 0;
    counter.set(trialId, n + 1);
    const outPath = derivePath(outDir, trialId, n);

    // Lazy: only a live render pulls the GL/prismarine core into the process.
    const { renderArtifact } = await import("../render/src/render-tool.mjs");
    const report = await renderArtifact(artifact, { outPath, view });

    const embed = args.embedImage ?? embedImage;
    const pngBuffer = embed ? readFileSync(report.path) : null;
    return toToolResult(report, { embedImage: embed, pngBuffer });
  };

  return createSdkMcpServer({
    name: RENDER_SERVER_NAME,
    version: "0.1.0",
    tools: [
      tool(
        RENDER_TOOL_NAME,
        "Construct the design artifact into an in-memory Minecraft world and render it " +
          "headless to a PNG. Returns the image path (and, by default, the image itself) " +
          "plus a build summary including any blocks that could not be placed.",
        inputShape,
        handler,
      ),
    ],
  });
}
