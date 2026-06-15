// b.parse fixtures for the typed CRITIQUE CONTRACT (T-163-01, story S-163, epic E-39). The
// executable proof that the Critique / CritiqueItem / Department schema (baml_src/department.baml)
// parses real replies the way the committed records say, and — just as important — pins HOW the
// SAP behaves at the typed edges, because S-164's reply gate must reason about exactly this:
//
//   CC1 accept  — a well-formed reply (3 items spanning ROOF/WALL/OPENING) == the minted expected.
//   CC2 enum    — an UNKNOWN `department` value does NOT hard-reject: SAP DROPS the offending item,
//                 yielding {items:[]} (the all-array leniency, FX-D1's family). The Department
//                 typing is therefore a FILTER, not a gate — S-164 must classify an emptied list as
//                 malformed; b.parse alone will not.
//   CC3 prose   — bare prose with no JSON object REJECTS (ok:false) for this function.
//
// One bridge spawn serves the file (batch protocol), mirroring src/baml/fixtures.test.mjs.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { bamlBatch } from "./bridge.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const readJson = (rel) => JSON.parse(read(rel));

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

const CC = "src/baml/fixtures/critique-contract";
let R;

before(async () => {
  R = await bamlBatch([
    /* 0 */ { fn: "DiagnoseBuild", mode: "parse", text: read(`${CC}/reply.txt`) },
    /* 1 */ { fn: "DiagnoseBuild", mode: "parse", text: read(`${CC}/reply-bad-department.txt`) },
    /* 2 */ { fn: "DiagnoseBuild", mode: "parse", text: "The roof looks wrong and the walls are bare." },
  ]);
});

test("CC1 b.parse over the committed reply equals the minted expected Critique", () => {
  assert.ok(R[0].ok, R[0].error);
  assert.deepEqual(dropNulls(R[0].parsed), readJson(`${CC}/expected.json`), "typed parse drifted from expected");
  assert.equal(R[0].parsed.items.length, 3, "three items, spanning ROOF/WALL/OPENING");
  assert.deepEqual(
    R[0].parsed.items.map((i) => i.department),
    ["ROOF", "WALL", "OPENING"],
    "departments parse to the typed enum values in order",
  );
});

test("CC2 an unknown department does NOT reject — SAP drops the item (leniency, see header)", () => {
  assert.ok(R[1].ok, R[1].error);
  assert.deepEqual(dropNulls(R[1].parsed), { items: [] },
    "the bad-enum item must be dropped, leaving an empty Critique — the typing is a filter, not a gate");
});

test("CC3 bare prose (no JSON) rejects", () => {
  assert.equal(R[2].ok, false, "prose with no JSON object must fail to coerce to a Critique");
});
