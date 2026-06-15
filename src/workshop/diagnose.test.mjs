// Unit pins for the Layer A diagnostic serializer (T-164-01, story S-164, epic E-39). The BAML
// function's typed inputs are rendered to a byte-pinned golden in src/baml/fixtures.test.mjs
// (FX-DB1); here we pin the SERIALIZER's content + determinism + single-source discipline, the way
// critique.test.mjs's "B" block pins critiqueRenderArgs. PURE — runs under the src test glob.

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { diagnoseRenderArgs, programBlock, MAX_DIAGNOSIS_ITEMS } from "./diagnose.mjs";
import { DEPARTMENTS } from "../pack/departments.mjs";
import { loadStylePack } from "../pack/style-pack.mjs";
import { assertBuildingProgram } from "../recognition/program.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUSTIC = loadStylePack(resolve(HERE, "..", "..", "packs", "rustic.json"));

const PROGRAM = assertBuildingProgram({
  schema: "building-program/v1", subject: "synthetic", pack: "rustic",
  reading: { summary: "a steep gabled stone barn with wagon doors" },
  masses: [{
    id: "main", rect: { x0: 0, z0: 0, w: 9, d: 7 }, storeys: 2, storeyHeight: 4,
    walls: { ground: { role: "wall.field.ground" }, upper: { role: "wall.infill.upper" } },
    roof: { idiom: "roof.gable", ridgeAxis: "x", pitchClass: 1, fieldRole: "roof.field" },
    openings: [],
  }],
});

const AZ = ["+x+z", "+x-z", "-x-z", "-x+z"];

test("DG1 the render args carry style, image order, the program intent, palette, departments, cap", () => {
  const a = diagnoseRenderArgs({ program: PROGRAM, pack: RUSTIC, azimuths: AZ });
  assert.equal(a.style, "rustic");
  assert.match(a.image_list, /1\. the CONCEPT/);
  assert.match(a.image_list, /2\. your build, azimuth 45° \(\+x\+z\)/);
  assert.match(a.image_list, /azimuth 315° \(-x\+z\)/);
  assert.match(a.program_block, /THE RECOGNIZED PROGRAM/);
  assert.match(a.program_block, /a steep gabled stone barn with wagon doors/); // the reading summary
  assert.match(a.program_block, /"masses"/);
  assert.match(a.program_block, /"idiom": "roof\.gable"/);
  assert.match(a.palette_block, /wall\.field\.ground: cobblestone/); // the pack vocabulary, shared format
  assert.equal(a.max_items, MAX_DIAGNOSIS_ITEMS);
});

test("DG2 deterministic in its inputs; style mirrors the pack", () => {
  const args = { program: PROGRAM, pack: RUSTIC, azimuths: AZ };
  assert.deepEqual(diagnoseRenderArgs(args), diagnoseRenderArgs(args));
  assert.equal(diagnoseRenderArgs(args).style, RUSTIC.style);
  assert.equal(diagnoseRenderArgs({ ...args, maxItems: 3 }).max_items, 3);
});

test("DG3 departments is single-sourced from DEPARTMENTS (drift tripwire, not a hand list)", () => {
  const a = diagnoseRenderArgs({ program: PROGRAM, pack: RUSTIC, azimuths: AZ });
  assert.equal(a.departments, DEPARTMENTS.join(", "));
  for (const d of ["ROOF", "WALL", "OPENING", "CHIMNEY", "ROOM"]) assert.match(a.departments, new RegExp(d));
});

test("DG4 programBlock degrades to masses-only JSON when there is no reading summary", () => {
  const b = programBlock({ program: { masses: PROGRAM.masses } });
  assert.match(b, /THE RECOGNIZED PROGRAM/);
  assert.match(b, /"masses"/);
  assert.doesNotMatch(b, /undefined/);
});
