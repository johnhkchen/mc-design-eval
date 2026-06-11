// Pinned BAML fixtures (T-129-01, story S-129, epic E-32) — the executable proof that the four
// design functions stay what their committed records say they are. One bridge spawn serves the
// whole file (batch protocol). Two pin families per function:
//   render — the rendered prompt's bytes/sha against the committed authority (recognition: the
//            live records' promptSha256; critique: the captured golden; vernacular/decompose:
//            the prompt.txt captured at mint);
//   parse  — b.parse over COMMITTED raw replies deep-equals the committed/expected parse, and a
//            malformed specimen rejects (the typed schema matches reality, both ways).

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { bamlBatch } from "./bridge.mjs";
import { loadStylePack } from "../pack/style-pack.mjs";
import { recognitionRenderArgs } from "../recognition/prompt.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const readJson = (rel) => JSON.parse(read(rel));
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

/** Strip null/undefined leaves so optional-absent (committed JSON) == optional-null (b.parse). */
function dropNulls(v) {
  if (Array.isArray(v)) return v.map(dropNulls);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, x] of Object.entries(v)) if (x !== null && x !== undefined) out[k] = dropNulls(x);
    return out;
  }
  return v;
}

// A 1×1 transparent PNG — render pins are about TEXT bytes; image content is irrelevant.
const PX = { base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", mediaType: "image/png" };

const REC = "benchmarks/sculpture/recognition";
const pack = loadStylePack(join(ROOT, "packs/rustic.json"));
const recOps = (key) => ({
  fn: "RecognizeBuildingProgram",
  mode: "render",
  args: recognitionRenderArgs({ pack, sketch: readJson(`benchmarks/sculpture/form-sketch/${key}.json`) }),
  images: { concept: PX, sketch_sheet: PX },
});

const cottageReplies = readJson(`${REC}/cottage.replies.json`);
const barnReplies = readJson(`${REC}/barn.replies.json`);

let R; // batch results, by index

before(async () => {
  R = await bamlBatch([
    /* 0 */ recOps("cottage"),
    /* 1 */ recOps("barn"),
    /* 2 */ { fn: "RecognizeBuildingProgram", mode: "parse", text: cottageReplies.rawTexts.at(-1) },
    /* 3 */ { fn: "RecognizeBuildingProgram", mode: "parse", text: barnReplies.rawTexts.at(-1) },
    /* 4 */ { fn: "RecognizeBuildingProgram", mode: "parse", text: "I would rather describe the building in prose." },
  ]);
});

test("FX-R1 recognition render is byte-identical to the committed live records (cottage, barn)", () => {
  assert.ok(R[0].ok && R[1].ok, R[0].error ?? R[1].error);
  assert.equal(sha256(R[0].prompt), cottageReplies.promptSha256, "cottage prompt sha drifted");
  assert.equal(sha256(R[1].prompt), barnReplies.promptSha256, "barn prompt sha drifted");
  assert.equal(R[0].images.length, 2, "concept + sketch sheet, in template order");
});

test("FX-R2 b.parse over the committed ACCEPTED raw replies equals the committed programs", () => {
  for (const [i, key] of [[2, "cottage"], [3, "barn"]]) {
    assert.ok(R[i].ok, `${key}: ${R[i].error}`);
    assert.deepEqual(dropNulls(R[i].parsed), dropNulls(readJson(`${REC}/${key}.program.json`)),
      `${key}: typed parse must match the committed program`);
  }
});

test("FX-R3 a malformed reply rejects (prose is not a program)", () => {
  assert.equal(R[4].ok, false);
});
