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
 * Build the success CallToolResult from a RenderReport. Always a text block carrying a
 * compact JSON summary (the loggable, path-bearing handle — AC #1); optionally an image
 * block (base64 PNG) for visual grounding (spec §4 multimodal). `unmapped` is surfaced
 * as a count (plus a small detail sample when non-zero) so partial builds are visible —
 * a build that silently drops blocks but returns a clean path is a measurement bug.
 * @param {import("../render/src/render-tool.mjs").RenderReport} report
 * @param {{ embedImage?: boolean, pngBuffer?: Buffer | null }} [opts]
 * @returns {{ content: object[] }}
 */
export function toToolResult(report, { embedImage = false, pngBuffer = null } = {}) {
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
