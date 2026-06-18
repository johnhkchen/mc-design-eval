// Unit suite for the Agent SDK structured-output binding (T-001-03, AC #1/#4).
//
// Covers the PURE binding surface only: the output-format option object and the
// result-extraction path, over plain mock objects. The SDK package is never
// imported and requestDesignArtifact() is never called — keeping the suite
// offline and free of metered API calls (spec §4).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { EventEmitter } from "node:events";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import {
  designArtifactOutputFormat,
  extractArtifact,
  stripToJson,
  withSchemaInstruction,
  toImageBlock,
  buildImageTurn,
  serializeStreamJsonInput,
  awaitChildClose,
  ClaudeTimeoutError,
} from "./sdk-binding.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const examples = resolve(here, "..", "schema", "examples");
const readExample = (name) => readFileSync(resolve(examples, name), "utf8");

const validText = readExample("valid-industrial-house.json");
const validObj = JSON.parse(validText);
const invalidObj = JSON.parse(readExample("invalid-industrial-house.json"));

function hasKey(node, key) {
  if (Array.isArray(node)) return node.some((n) => hasKey(n, key));
  if (node && typeof node === "object") {
    if (Object.prototype.hasOwnProperty.call(node, key)) return true;
    return Object.values(node).some((v) => hasKey(v, key));
  }
  return false;
}

// --- designArtifactOutputFormat (AC #1) -----------------------------------

test("output format is a json_schema wrapper around the contract", () => {
  const of = designArtifactOutputFormat();
  assert.equal(of.type, "json_schema");
  assert.equal(typeof of.schema, "object");
  assert.equal(of.schema.title, "DesignArtifact");
});

test("output-format schema is the model-facing projection (no discriminator)", () => {
  const of = designArtifactOutputFormat();
  assert.equal(hasKey(of.schema, "discriminator"), false);
  assert.equal("$schema" in of.schema, false);
});

test("output-format schema actually constrains: accepts good, rejects bad", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const v = ajv.compile(designArtifactOutputFormat().schema);
  assert.equal(v(validObj), true);
  assert.equal(v(invalidObj), false);
});

// --- extractArtifact (AC #1/#4) -------------------------------------------

test("extracts a validated artifact from structured_output (object)", () => {
  const r = extractArtifact({ structured_output: validObj });
  assert.equal(r.ok, true);
  assert.equal(r.artifact.metadata.trial_id, "phase1-house-singleshot-0001");
});

test("extracts from a result text payload (JSON string)", () => {
  const r = extractArtifact({ result: validText });
  assert.equal(r.ok, true);
  assert.equal(r.artifact.style.name, "industrial");
});

test("invalid structured_output surfaces located validation errors", () => {
  const r = extractArtifact({ structured_output: invalidObj });
  assert.equal(r.ok, false);
  assert.equal(r.code, "schema_invalid");
  assert.match(r.errors.join("\n"), /palette\/manifest/);
});

test("a result with no payload throws a clear error", () => {
  assert.throws(() => extractArtifact({}), /no structured payload/);
});

// --- stripToJson / claude -p text path (spec §4) --------------------------

test("stripToJson is a no-op on already-clean JSON", () => {
  assert.equal(stripToJson(validText).trim(), validText.trim());
});

test("stripToJson strips a ```json code fence", () => {
  const fenced = "```json\n" + validText + "\n```";
  assert.deepEqual(JSON.parse(stripToJson(fenced)), validObj);
});

test("stripToJson slices the object out of surrounding prose", () => {
  const chatty = `Here is the design:\n${validText}\nHope that works!`;
  assert.deepEqual(JSON.parse(stripToJson(chatty)), validObj);
});

test("extractArtifact accepts fenced result text (the claude -p path)", () => {
  const r = extractArtifact({ result: "```json\n" + validText + "\n```" });
  assert.equal(r.ok, true);
  assert.equal(r.artifact.metadata.trial_id, "phase1-house-singleshot-0001");
});

// --- withSchemaInstruction (claude -p output-format scaffolding) -----------

test("withSchemaInstruction appends a strict JSON-only directive and the schema", () => {
  const out = withSchemaInstruction("BASE PROMPT");
  assert.match(out, /^BASE PROMPT/);
  assert.match(out, /Output format/);
  assert.match(out, /VERY FIRST character/);
  assert.match(out, /style\.rationale/, "gives the narration instinct a legal outlet");
  assert.match(out, /beginning with/, "ends with a recency nudge to start with the JSON");
  assert.match(out, /"title": "DesignArtifact"/);
});

// --- image input shaping (claude -p stream-json path, T-005-02) ------------
// Tiny inline buffers (PNG magic) — no dependency on render/out (gitignored).

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test("toImageBlock wraps a Buffer as a base64 png block (round-trips)", () => {
  const block = toImageBlock(PNG_MAGIC);
  assert.equal(block.type, "image");
  assert.equal(block.source.type, "base64");
  assert.equal(block.source.media_type, "image/png");
  assert.deepEqual(Buffer.from(block.source.data, "base64"), PNG_MAGIC);
});

test("toImageBlock accepts { data, mediaType } and honors a non-png type", () => {
  const block = toImageBlock({ data: PNG_MAGIC, mediaType: "image/jpeg" });
  assert.equal(block.source.media_type, "image/jpeg");
  assert.deepEqual(Buffer.from(block.source.data, "base64"), PNG_MAGIC);
});

test("toImageBlock passes through { base64 }", () => {
  const b64 = PNG_MAGIC.toString("base64");
  const block = toImageBlock({ base64: b64 });
  assert.equal(block.source.data, b64);
  assert.equal(block.source.media_type, "image/png");
});

test("toImageBlock throws on empty/missing bytes", () => {
  assert.throws(() => toImageBlock(Buffer.alloc(0)), /empty/);
  assert.throws(() => toImageBlock(null), /null\/undefined/);
  assert.throws(() => toImageBlock({}), /data.*or.*base64/);
});

test("buildImageTurn shapes a user message: schema text block + image blocks", () => {
  const turn = buildImageTurn("BASE PROMPT", [PNG_MAGIC]);
  assert.equal(turn.type, "user");
  assert.equal(turn.message.role, "user");
  const [text, image] = turn.message.content;
  assert.equal(text.type, "text");
  assert.match(text.text, /^BASE PROMPT/);
  assert.match(text.text, /Output format/);
  assert.match(text.text, /"title": "DesignArtifact"/);
  assert.equal(image.type, "image");
});

test("buildImageTurn preserves image count and order", () => {
  const a = Buffer.from([1, 2, 3]);
  const b = Buffer.from([4, 5, 6]);
  const turn = buildImageTurn("P", [a, b]);
  const images = turn.message.content.filter((c) => c.type === "image");
  assert.equal(images.length, 2);
  assert.deepEqual(Buffer.from(images[0].source.data, "base64"), a);
  assert.deepEqual(Buffer.from(images[1].source.data, "base64"), b);
});

test("buildImageTurn requires at least one image", () => {
  assert.throws(() => buildImageTurn("P", []), /at least one image/);
  assert.throws(() => buildImageTurn("P"), /at least one image/);
});

test("serializeStreamJsonInput is a single newline-terminated JSON line", () => {
  const turn = buildImageTurn("P", [PNG_MAGIC]);
  const line = serializeStreamJsonInput(turn);
  assert.ok(line.endsWith("\n"));
  assert.equal(line.trimEnd().includes("\n"), false);
  assert.deepEqual(JSON.parse(line), turn);
});

// --- awaitChildClose / ClaudeTimeoutError: the subprocess-timeout guard (T-198-01) -----------------------
// The PURE/offline test of the guard: a FAKE child (an EventEmitter + a `kill` spy) and a tiny `timeoutMs`.
// No `claude` is spawned, no live hang — the ticket's "unit/abstracted test … not a live hang."

/** A minimal stand-in for a spawned ChildProcess: emits close/error on demand; records kill() calls. */
class FakeChild extends EventEmitter {
  constructor() {
    super();
    this.killCalls = [];
  }
  kill(signal) {
    this.killCalls.push(signal);
    return true;
  }
}

test("awaitChildClose resolves with the exit code when the child closes (no timer, no kill)", async () => {
  const child = new FakeChild();
  const p = awaitChildClose(child, { timeoutMs: 5000 });
  child.emit("close", 0);
  assert.equal(await p, 0);
  assert.deepEqual(child.killCalls, []); // closed first → never killed
});

test("awaitChildClose with no timeoutMs never arms a timer — resolves only on close", async () => {
  const child = new FakeChild();
  const p = awaitChildClose(child, {}); // no timeoutMs ⇒ default-off (byte-unchanged for existing callers)
  // give the loop a tick; nothing should reject in the meantime
  await new Promise((r) => setTimeout(r, 10));
  child.emit("close", 3);
  assert.equal(await p, 3);
  assert.deepEqual(child.killCalls, []);
});

test("awaitChildClose times out a non-returning child: SIGKILL + typed ClaudeTimeoutError", async () => {
  const child = new FakeChild(); // never emits close — the hang this guard exists to break
  const err = await awaitChildClose(child, { timeoutMs: 20, cli: "claude" }).then(
    () => { throw new Error("expected a timeout rejection"); },
    (e) => e,
  );
  assert.ok(err instanceof ClaudeTimeoutError);
  assert.equal(err.code, "ETIMEDOUT_CLAUDE");
  assert.equal(err.timeoutMs, 20);
  assert.deepEqual(child.killCalls, ["SIGKILL"]); // the wedged child is killed exactly once
  assert.match(err.message, /exceeded 20ms wall-clock/);
});

test("awaitChildClose: a close AFTER timeout is a no-op (single-settle latch, no double reject/resolve)", async () => {
  const child = new FakeChild();
  const p = awaitChildClose(child, { timeoutMs: 10 });
  const err = await p.catch((e) => e);
  assert.ok(err instanceof ClaudeTimeoutError);
  // a late close must NOT flip the already-settled promise nor throw
  child.emit("close", 0);
  await new Promise((r) => setTimeout(r, 5)); // no unhandled rejection / second settle
});

test("awaitChildClose surfaces a launch error (child 'error' event) with the install/login hint", async () => {
  const child = new FakeChild();
  const p = awaitChildClose(child, { timeoutMs: 5000, cli: "claude" });
  child.emit("error", new Error("ENOENT"));
  const err = await p.catch((e) => e);
  assert.ok(!(err instanceof ClaudeTimeoutError));
  assert.match(err.message, /failed to launch `claude -p`.*installed\/logged in/);
  assert.deepEqual(child.killCalls, []);
});

test("ClaudeTimeoutError carries name/code/timeoutMs and is an Error", () => {
  const e = new ClaudeTimeoutError(180000, "claude");
  assert.ok(e instanceof Error);
  assert.equal(e.name, "ClaudeTimeoutError");
  assert.equal(e.code, "ETIMEDOUT_CLAUDE");
  assert.equal(e.timeoutMs, 180000);
});
