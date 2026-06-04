// Unit suite for the smoke-trial orchestrator's PURE helpers (T-004-03).
//
// Covers renderToolOptions and attachRender over plain objects. Imports
// smoke-trial.mjs but NEVER calls runSmokeTrial — so neither the Agent SDK nor the
// GL/prismarine render core is loaded (the suite stays offline and GPU-free, exactly
// like trial.test.mjs / render-tool.test.mjs). The fact that this file runs under
// `node --test` at all is the proof the module's heavy deps are lazy.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  renderToolOptions,
  attachRender,
  RENDER_TOOL_FQN,
  RENDER_IMAGE_NAME,
} from "./smoke-trial.mjs";
import { assertSafeOptions } from "./trial.mjs";
import { SAFE_TRIAL_OPTIONS } from "./config.mjs";

// A RenderReport-derived summary stand-in (the shape renderSummary returns).
const summary = {
  path: "/abs/env/trials/t1/render.png",
  bytes: 8192,
  placed: 140,
  unmapped: 0,
  bounds: { min: [0, 0, 0], max: [8, 5, 8] },
};

// A minimal TrialRecord stand-in (the shape buildTrialRecord returns).
function record() {
  return {
    metadata: { trial_id: "t1", prompting_method_id: "single-shot.v1" },
    model_id: "claude-opus-4-8",
    prompting_method_id: "single-shot.v1",
    schema_version: "1.0.0",
    status: "success",
    usage: { turns: [], totals: { input_tokens: 1, output_tokens: 2 } },
    finished_at: "2026-06-04T00:00:00.000Z",
  };
}

test("renderToolOptions: wires the render server + the mcp__render__render tool name", () => {
  const server = { name: "render", instance: {} };
  const opts = renderToolOptions(server);
  assert.equal(opts.mcpServers.render, server, "server is mounted under its name");
  assert.deepEqual(opts.allowedTools, ["mcp__render__render"]);
  assert.equal(RENDER_TOOL_FQN, "mcp__render__render");
});

test("renderToolOptions: merged over SAFE_TRIAL_OPTIONS still passes assertSafeOptions (AC #1, no posture change)", () => {
  const merged = { ...SAFE_TRIAL_OPTIONS, ...renderToolOptions({}) };
  // The render tool is non-code-exec, so wiring it in introduces no forbidden tool
  // and no permission bypass — the guard must not throw.
  assert.doesNotThrow(() => assertSafeOptions(merged));
  assert.equal(merged.permissionMode, "dontAsk");
});

test("attachRender: record gains a render field pointing at the image + build summary (AC #3)", () => {
  const r = attachRender(record(), summary);
  assert.equal(r.render.image, RENDER_IMAGE_NAME);
  assert.equal(r.render.image, "render.png");
  assert.equal(r.render.placed, 140);
  assert.equal(r.render.unmapped, 0);
  assert.deepEqual(r.render.bounds, summary.bounds);
  // The absolute, env-specific path is dropped in favor of the relative image name.
  assert.equal(r.render.path, undefined, "no absolute path leaks into the record");
  // The original record fields survive.
  assert.equal(r.status, "success");
  assert.deepEqual(r.usage.totals, { input_tokens: 1, output_tokens: 2 });
});

test("attachRender: does not mutate the input record", () => {
  const original = record();
  const snapshot = JSON.parse(JSON.stringify(original));
  attachRender(original, summary);
  assert.deepEqual(original, snapshot, "input record is untouched (immutable augmentation)");
});

test("attachRender: a custom image name is honored", () => {
  const r = attachRender(record(), summary, "render-rev1.png");
  assert.equal(r.render.image, "render-rev1.png");
});
