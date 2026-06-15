// Unit pins for the Layer A diagnostic serializer (T-164-01, story S-164, epic E-39). The BAML
// function's typed inputs are rendered to a byte-pinned golden in src/baml/fixtures.test.mjs
// (FX-DB1); here we pin the SERIALIZER's content + determinism + single-source discipline, the way
// critique.test.mjs's "B" block pins critiqueRenderArgs. PURE — runs under the src test glob.

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { diagnoseRenderArgs, programBlock, styleProfileBlock, MAX_DIAGNOSIS_ITEMS } from "./diagnose.mjs";
import { DEPARTMENTS } from "../pack/departments.mjs";
import { loadStylePack } from "../pack/style-pack.mjs";
import { assertBuildingProgram } from "../recognition/program.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUSTIC = loadStylePack(resolve(HERE, "..", "..", "packs", "rustic.json"));
const SALTCRAG = loadStylePack(resolve(HERE, "..", "..", "packs", "saltcrag.json"));

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

test("DG2 deterministic in its inputs; style falls back to the pack when the program omits it", () => {
  const args = { program: PROGRAM, pack: RUSTIC, azimuths: AZ }; // PROGRAM carries no declared style
  assert.deepEqual(diagnoseRenderArgs(args), diagnoseRenderArgs(args));
  assert.equal(diagnoseRenderArgs(args).style, RUSTIC.style); // honest fallback: style == pack id
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

test("DG5 the style profile GENUINELY differs between rustic and saltcrag (the within-family gradient)", () => {
  // AC2 / the falsifiable claim: keying `expected` on the declared style makes the SAME build's
  // expected roof/wall/opening differ under two styles. Proven deterministically on the INPUT the
  // judge forms `expected` from — the two suites are not reskins.
  const r = styleProfileBlock({ pack: RUSTIC });
  const s = styleProfileBlock({ pack: SALTCRAG });
  assert.notEqual(r, s, "the two suites' expected grammar must differ");

  // ROOF: rustic spruce field + hip/pyramid/dormer; saltcrag dark-oak field + a deepslate-tile ridge.
  assert.match(r, /spruce_planks/);
  assert.match(r, /roof\.hip/);
  assert.doesNotMatch(r, /deepslate_tiles/);
  assert.match(s, /roof\.ridge → deepslate_tiles/);
  assert.match(s, /dark_oak_planks/);
  assert.doesNotMatch(s, /roof\.hip/);

  // WALLS: rustic is timber-frame; saltcrag is limewash + surface treatments, NO timber frame.
  assert.match(r, /timber-frame/);
  assert.match(r, /frame\.timber/);
  assert.doesNotMatch(s, /timber-frame/);
  assert.match(s, /wall\.finish\.limewash/);
  assert.match(s, /surface\.strip-salt/);

  // single-source / self-grep discipline: derived from pack data, no subject names baked in.
  for (const subj of ["barn", "cottage", "synthetic", "gatehouse", "church"]) {
    assert.doesNotMatch(r, new RegExp(subj));
    assert.doesNotMatch(s, new RegExp(subj));
  }
  // deterministic
  assert.equal(styleProfileBlock({ pack: RUSTIC }), r);
});

test("DG6 diagnoseRenderArgs selects style + suite BY the declared program.style (same build, two styles)", () => {
  // The same build (program masses + renders) diagnosed under two declared styles → different style
  // label AND different style_profile/palette. This is the suite selection AC1 asks for.
  const asRustic = diagnoseRenderArgs({ program: { ...PROGRAM, style: "rustic" }, pack: RUSTIC, azimuths: AZ });
  const asSalt = diagnoseRenderArgs({ program: { ...PROGRAM, style: "saltcrag" }, pack: SALTCRAG, azimuths: AZ });
  assert.equal(asRustic.style, "rustic");
  assert.equal(asSalt.style, "saltcrag");
  assert.notEqual(asRustic.style_profile, asSalt.style_profile, "suite must differ by declared style");
  assert.notEqual(asRustic.palette_block, asSalt.palette_block, "material vocab must differ by style");
  // the declared style WINS over the pack default (proves selection flows from the program, not a const)
  const declaredWins = diagnoseRenderArgs({ program: { ...PROGRAM, style: "saltcrag" }, pack: RUSTIC, azimuths: AZ });
  assert.equal(declaredWins.style, "saltcrag");
});
