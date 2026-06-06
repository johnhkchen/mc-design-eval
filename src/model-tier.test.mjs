// Tests for the per-op model-tier seam (T-082-01). PURE — no spawn, no GL: the live model call is
// dependency-injected so routing is exercised with a spy. Also pins the no-API-key invariant (AC #1) via
// a source guard over this module + the two detector modules.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  resolveTier,
  runTieredOp,
  SHIM_INVOKERS,
  OP_ROUTING,
  ROUTING_RUBRIC,
  routingTableMarkdown,
} from "./model-tier.mjs";
import { MODEL_TIERS } from "./config.mjs";
import { requestText, requestTextWithImage } from "./sdk-binding.mjs";

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));

test("resolveTier maps light→Haiku, strong→pinned default", () => {
  assert.equal(resolveTier("light"), MODEL_TIERS.light);
  assert.equal(resolveTier("strong"), MODEL_TIERS.strong);
  assert.match(MODEL_TIERS.light, /haiku/i);
});

test("resolveTier throws on an unknown tier (no silent fallback to a metered model)", () => {
  assert.throws(() => resolveTier("medium"), /unknown tier "medium"/);
  assert.throws(() => resolveTier(undefined), /unknown tier/);
});

test("runTieredOp routes the resolved model id to the injected invoker and echoes tier+model", async () => {
  const calls = [];
  const spy = async (args) => {
    calls.push(args);
    return { text: "ok", raw: { usage: { input_tokens: 1 } } };
  };
  const out = await runTieredOp({ tier: "light", prompt: "p", invoke: spy });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].model, MODEL_TIERS.light); // the smaller --model, the whole point
  assert.equal(calls[0].prompt, "p");
  assert.equal(out.tier, "light");
  assert.equal(out.model, MODEL_TIERS.light);
  assert.equal(out.text, "ok");
});

test("runTieredOp defaults to the strong tier when none is declared", async () => {
  let seen;
  await runTieredOp({ prompt: "p", invoke: async (a) => ((seen = a), { text: "", raw: {} }) });
  assert.equal(seen.model, MODEL_TIERS.strong);
});

test("the default invokers ARE the claude -p subscription functions (not the SDK)", () => {
  assert.equal(SHIM_INVOKERS.text, requestText);
  assert.equal(SHIM_INVOKERS.image, requestTextWithImage);
});

test("OP_ROUTING integrity: every tier is a known tier, every rationale non-empty", () => {
  assert.ok(OP_ROUTING.length >= 2);
  for (const r of OP_ROUTING) {
    assert.ok(Object.prototype.hasOwnProperty.call(MODEL_TIERS, r.tier), `bad tier ${r.tier} for ${r.op}`);
    assert.ok(typeof r.rationale === "string" && r.rationale.trim().length > 0, `empty rationale for ${r.op}`);
  }
  const byOp = Object.fromEntries(OP_ROUTING.map((r) => [r.op, r.tier]));
  assert.equal(byOp["roof-patch-detector"], "light");
  assert.equal(byOp["hollowable-mass-detector"], "light");
});

test("ROUTING_RUBRIC has a light + strong rule", () => {
  assert.match(ROUTING_RUBRIC.light, /\w/);
  assert.match(ROUTING_RUBRIC.strong, /\w/);
});

test("routingTableMarkdown renders every op + both tier ids + the rubric", () => {
  const md = routingTableMarkdown();
  for (const r of OP_ROUTING) assert.ok(md.includes(r.op), `md missing op ${r.op}`);
  assert.ok(md.includes(MODEL_TIERS.light) && md.includes(MODEL_TIERS.strong));
  assert.match(md, /light/);
  assert.match(md, /strong/);
});

// --- the no-API-key invariant (AC #1): a structural source guard ----------------------------------------
test("the tier seam + detectors never reach the API key / SDK path", async () => {
  const files = ["./model-tier.mjs", "./view/roof-patch.mjs", "./view/hollowable-mass.mjs"];
  for (const f of files) {
    const src = await readFile(here(f), "utf8");
    assert.ok(!src.includes("ANTHROPIC_API_KEY"), `${f} must not read ANTHROPIC_API_KEY`);
    assert.ok(
      !src.includes("@anthropic-ai/claude-agent-sdk"),
      `${f} must not import the Agent SDK (metered API path)`,
    );
  }
});
