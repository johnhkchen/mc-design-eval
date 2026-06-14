// Unit tests — facade-grammar recognition (T-145-01, E-35). Pure: the only IO is the committed-file
// class (the fixture + the rustic pack), the program.test.mjs precedent.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FACADE_REPLY_BUDGET,
  ALL_WALLS,
  unseenFaces,
  facadeSubSchema,
  facadeDigest,
  facadeRenderArgs,
  mergeFacade,
  parseFacadeReply,
} from "./facade-grammar.mjs";
import { runReplyPolicy } from "../form/judge-reply.mjs";
import { loadStylePack } from "../pack/style-pack.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const FIX = resolve(here, "fixtures", "facade");
const pack = loadStylePack(resolve(here, "..", "..", "packs", "rustic.json"));
const base = JSON.parse(readFileSync(resolve(FIX, "base-program.json"), "utf8"));
const reply = readFileSync(resolve(FIX, "reply.txt"), "utf8");
const expectedText = readFileSync(resolve(FIX, "expected.json"), "utf8");

test("the declared budget rides the T-114 bound", () => {
  assert.equal(FACADE_REPLY_BUDGET, 3);
});

test("unseenFaces splits the four walls by the concept 3/4 camera (registry fact, not per-building)", () => {
  const { seen, unseen } = unseenFaces();
  assert.deepEqual(seen, ["+x", "+z"]);
  assert.deepEqual(unseen, ["-x", "-z"]);
  assert.deepEqual([...seen, ...unseen].sort(), [...ALL_WALLS].sort());
});

test("facadeRenderArgs returns {facade_digest, schema_json}; the digest is byte-deterministic", () => {
  const a = facadeRenderArgs({ program: base, pack });
  assert.deepEqual(Object.keys(a).sort(), ["facade_digest", "schema_json"]);
  // determinism — the --repro pure half
  assert.equal(facadeDigest(base, pack), facadeDigest(base, pack));
  // schema_json is the facade sub-schema, not the whole program schema
  const sub = facadeSubSchema();
  assert.equal(a.schema_json, JSON.stringify(sub, null, 2));
  assert.ok(sub.properties.faces, "facade sub-schema carries faces");
});

test("the committed prompt digest replays byte-identically (the recorded prompt pin)", () => {
  const committed = readFileSync(resolve(FIX, "prompt.txt"), "utf8");
  assert.equal(facadeDigest(base, pack) + "\n", committed);
});

test("the digest teaches the storey band vocabulary (T-145-02) without naming a row number", () => {
  const d = facadeDigest(base, pack);
  assert.match(d, /STOREY BAND/);
  assert.match(d, /`band`/);
  assert.match(d, /ground.*upper.*all/s);
  assert.match(d, /never name a row number/);
});

test("mergeFacade is pure: the base is untouched, the result carries the facade", () => {
  const before = JSON.stringify(base);
  const merged = mergeFacade(base, { main: { eaveOverhang: 0, faces: [
    { wall: "+z", rhythm: { count: 3 }, memberRole: "frame.timber", evidence: { source: "concept", layoutOnly: false } },
  ] } });
  assert.equal(JSON.stringify(base), before, "base program unmutated");
  assert.equal(merged.masses[0].facade.faces[0].wall, "+z");
  assert.equal(base.masses[0].facade, undefined);
});

test("mergeFacade rejects an unknown mass id", () => {
  assert.throws(() => mergeFacade(base, { wing: { faces: [] } }), /unknown mass "wing"/);
});

test("OFFLINE REPLAY: the recorded reply parses to the committed grammar byte-identically (AC #5)", () => {
  const merged = parseFacadeReply(reply, { program: base, pack });
  // byte-identical to the committed expected.json — no model, no writes
  assert.equal(JSON.stringify(merged, null, 2) + "\n", expectedText);
  // and structurally: four faces, each evidence-tagged
  assert.deepEqual(
    merged.masses[0].facade.faces.map((f) => `${f.wall}:${f.evidence.source}`),
    ["+z:concept", "+x:concept", "-z:textured-glb", "-x:pack-idealised"],
  );
});

test("parseFacadeReply rejects: non-JSON, missing facades, off-vocabulary, non-diegetic", () => {
  assert.throws(() => parseFacadeReply("not json {", { program: base, pack }), /not JSON/);
  assert.throws(() => parseFacadeReply('{"oops": {}}', { program: base, pack }), /must be \{"facades"/);

  const offVocab = JSON.stringify({ facades: { main: { faces: [
    { wall: "+z", rhythm: { count: 3 }, memberRole: "wall.marble", evidence: { source: "concept", layoutOnly: false } },
  ] } } });
  assert.throws(() => parseFacadeReply(offVocab, { program: base, pack }), /off the pack vocabulary/);

  const nonDiegetic = JSON.stringify({ facades: { main: { faces: [
    { wall: "-z", rhythm: { count: 3 }, memberRole: "frame.timber", evidence: { source: "textured-glb", layoutOnly: false } },
  ] } } });
  assert.throws(() => parseFacadeReply(nonDiegetic, { program: base, pack }), /layoutOnly:true/);
});

test("reply-policy: malformed×budget REFUSES (no re-roll); malformed-then-good accepts on attempt 2", async () => {
  // every reply malformed → null verdict, ledger records each attempt, never a re-roll
  const refuse = await runReplyPolicy(() => ({ text: "garbage {" }), {
    parse: (t) => parseFacadeReply(t, { program: base, pack }),
    maxAttempts: FACADE_REPLY_BUDGET,
  });
  assert.equal(refuse.verdict, null);
  assert.equal(refuse.replies.length, FACADE_REPLY_BUDGET);

  // malformed first, then the good recorded reply → accepts on attempt 2
  const replies = ["garbage {", reply];
  let i = 0;
  const accept = await runReplyPolicy(() => ({ text: replies[i++] }), {
    parse: (t) => parseFacadeReply(t, { program: base, pack }),
    maxAttempts: FACADE_REPLY_BUDGET,
  });
  assert.notEqual(accept.verdict, null);
  assert.equal(accept.askCount, 2);
  assert.equal(accept.verdict.masses[0].facade.faces.length, 4);
});
