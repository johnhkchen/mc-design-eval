// Unit suite for the render tool's PURE adapters (T-003-04).
//
// Covers derivePath / coerceArtifact / toToolResult / toErrorResult over plain
// objects. Imports render-tool.mjs but NEVER calls createRenderServer — so neither
// the Agent SDK nor the GL/prismarine render core is loaded, keeping the suite
// offline and GPU-free (the whole point of the L2/L3 split).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import {
  RENDER_SERVER_NAME,
  RENDER_TOOL_NAME,
  derivePath,
  coerceArtifact,
  renderSummary,
  toToolResult,
  toErrorResult,
} from "./render-tool.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const examples = resolve(here, "..", "schema", "examples");
const validObj = JSON.parse(readFileSync(resolve(examples, "valid-industrial-house.json"), "utf8"));

// A RenderReport stand-in (the shape render/src/render-tool.mjs returns).
const report = {
  path: "/tmp/render/t1.png",
  bytes: 4096,
  placed: 120,
  unmapped: [],
  bounds: { min: [0, 0, 0], max: [6, 4, 6] },
  view: { width: 512, height: 512 },
};

test("identity constants name the pre-committed mcp__render__render surface", () => {
  assert.equal(RENDER_SERVER_NAME, "render");
  assert.equal(RENDER_TOOL_NAME, "render");
});

test("derivePath: first render bare, repeats get a -rev suffix, no overwrite", () => {
  assert.equal(derivePath("out", "trial-7", 0), join("out", "trial-7.png"));
  assert.equal(derivePath("out", "trial-7", 1), join("out", "trial-7-rev1.png"));
  assert.equal(derivePath("out", "trial-7", 2), join("out", "trial-7-rev2.png"));
  // Distinct trials → distinct paths.
  assert.notEqual(derivePath("out", "a", 0), derivePath("out", "b", 0));
});

test("derivePath: a model-authored trial id cannot escape outDir", () => {
  const p = derivePath("out", "../../etc/passwd", 0);
  // The safety property is that no path SEPARATOR survives sanitization, so the
  // whole id collapses into a single filename segment inside outDir — the literal
  // dots are harmless. dirname stays exactly the outDir we passed.
  assert.equal(dirname(p), "out", `stays within outDir (got ${p})`);
  assert.ok(p.endsWith(".png"));
});

test("coerceArtifact: a schema-valid artifact passes through, frozen", () => {
  const c = coerceArtifact(validObj);
  assert.equal(c.ok, true);
  assert.equal(c.artifact.metadata.trial_id, validObj.metadata.trial_id);
  assert.ok(Object.isFrozen(c.artifact));
});

test("coerceArtifact: an invalid artifact becomes an error result with located lines", () => {
  const c = coerceArtifact({});
  assert.equal(c.ok, false);
  assert.equal(c.result.isError, true);
  assert.equal(c.result.content[0].type, "text");
  assert.match(c.result.content[0].text, /invalid design artifact/);
});

test("coerceArtifact: malformed JSON string is reported, not thrown", () => {
  const c = coerceArtifact("{ not json");
  assert.equal(c.ok, false);
  assert.equal(c.result.isError, true);
});

test("renderSummary: the shared loggable shape — count, bounds, no detail when clean", () => {
  const s = renderSummary(report);
  assert.equal(s.path, report.path);
  assert.equal(s.bytes, report.bytes);
  assert.equal(s.placed, 120);
  assert.equal(s.unmapped, 0);
  assert.deepEqual(s.bounds, report.bounds);
  assert.equal(s.unmapped_detail, undefined, "no detail block for a clean build");
});

test("renderSummary: unmapped voxels become a count plus a bounded (≤5) detail sample", () => {
  const withUnmapped = {
    ...report,
    unmapped: Array.from({ length: 8 }, (_, i) => ({
      pos: [i, 0, 0],
      block: "minecraft:bogus_block",
      reason: 'unknown block "minecraft:bogus_block"',
    })),
  };
  const s = renderSummary(withUnmapped);
  assert.equal(s.unmapped, 8);
  assert.equal(s.unmapped_detail.length, 5, "detail is capped at 5");
  assert.equal(s.unmapped_detail[0].block, "minecraft:bogus_block");
});

test("toToolResult: text-only by default carries the loggable path summary (AC #1)", () => {
  const res = toToolResult(report);
  assert.equal(res.content.length, 1);
  assert.equal(res.content[0].type, "text");
  const summary = JSON.parse(res.content[0].text);
  assert.equal(summary.path, report.path);
  assert.equal(summary.placed, 120);
  assert.equal(summary.unmapped, 0);
  assert.deepEqual(summary.bounds, report.bounds);
});

test("toToolResult: embedImage adds a base64 PNG image block (spec §4 multimodal)", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  const res = toToolResult(report, { embedImage: true, pngBuffer: png });
  assert.equal(res.content.length, 2);
  const img = res.content[1];
  assert.equal(img.type, "image");
  assert.equal(img.mimeType, "image/png");
  assert.equal(img.data, png.toString("base64"));
});

test("toToolResult: embedImage with no buffer stays text-only (never a broken block)", () => {
  const res = toToolResult(report, { embedImage: true, pngBuffer: null });
  assert.equal(res.content.length, 1);
});

test("toToolResult: unmapped voxels surface as a count plus a bounded detail sample", () => {
  const withUnmapped = {
    ...report,
    unmapped: Array.from({ length: 8 }, (_, i) => ({
      pos: [i, 0, 0],
      block: "minecraft:bogus_block",
      reason: 'unknown block "minecraft:bogus_block"',
    })),
  };
  const summary = JSON.parse(toToolResult(withUnmapped).content[0].text);
  assert.equal(summary.unmapped, 8);
  assert.equal(summary.unmapped_detail.length, 5, "detail is capped at 5");
  assert.equal(summary.unmapped_detail[0].block, "minecraft:bogus_block");
});

test("toErrorResult: shapes an isError result carrying the lines", () => {
  const res = toErrorResult(["  bad thing", "  worse thing"]);
  assert.equal(res.isError, true);
  assert.match(res.content[0].text, /bad thing/);
  assert.match(res.content[0].text, /worse thing/);
});
