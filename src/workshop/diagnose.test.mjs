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
const GUILDHALL = loadStylePack(resolve(HERE, "..", "..", "packs", "guildhall.json"));

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

test("DG5 the style profile GENUINELY differs between rustic and saltcrag (the per-pack vocabulary)", () => {
  // The pack's NAMING VOCABULARY still differs per pack (different materials/idioms) — the two suites
  // are not reskins. NB (T-186-01 / E-47): this block is no longer the EXPECTED standard — the concept
  // image is (DG8); it is the vocabulary the judge uses to NAME departures. The body differing per pack
  // is what keeps that naming style-specific; it is not what the build "should read as".
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

test("DG7 a SECOND genuinely-different style (guildhall) critiques a rustic build as WRONG-STYLE, not wrong-colour (T-165-02)", () => {
  // The breadth gate (S-165 AC2 / the falsifiable claim): guildhall is POLITE/CLASSICAL, not a third
  // rustic-family reskin. The SAME synthetic rustic barn PROGRAM, critiqued under guildhall's expected
  // profile, must read as wrong *grammar* — classical idioms it MISSES and vernacular idioms it PRESENTS
  // that the classical style forbids. GUILDHALL having loaded at all proves the pack is schema+semantic
  // valid (loadStylePack is fail-loud), i.e. the second style is expressible with REAL registry idioms.
  const g = styleProfileBlock({ pack: GUILDHALL });
  const r = styleProfileBlock({ pack: RUSTIC });
  assert.notEqual(g, r, "guildhall and rustic expected grammar must differ");

  // WALL grammar — IDIOM-level, not a recolor: classical pilaster/quoin order vs vernacular timber-frame.
  // The wrong-style MISSING (the rustic build lacks the order) and PRESENT-but-forbidden (it has the frame).
  assert.match(g, /pilaster/);
  assert.match(g, /quoin/);
  assert.doesNotMatch(g, /timber-frame/);   // classical walls are not framed
  assert.match(r, /timber-frame/);          // the rustic build's wall grammar guildhall forbids
  assert.match(r, /frame\.timber/);

  // OPENING grammar — round arch (arch idiom) vs flat lintel (head.flat). A genuine grammar swap.
  assert.match(g, /treatment idioms arch/);
  assert.doesNotMatch(g, /head\.flat/);

  // ROOF — guildhall is a shallow lead-grey STONE hip; rustic a steep warm TIMBER gable. Different idiom +
  // material (the axis still resolves to a PITCHED roof — the registry ceiling, recorded in FINDINGS.md).
  assert.match(g, /roof\.hip/);
  assert.match(g, /deepslate_tiles/);
  assert.doesNotMatch(g, /spruce_planks/);
  assert.match(g, /pitch classes \[0\.5,1\]/);   // shallow, vs rustic's steep [1,2]

  // suite selection by declared style: the SAME build under guildhall vs rustic → different expected.
  const asGuild = diagnoseRenderArgs({ program: { ...PROGRAM, style: "guildhall" }, pack: GUILDHALL, azimuths: AZ });
  const asRustic = diagnoseRenderArgs({ program: { ...PROGRAM, style: "rustic" }, pack: RUSTIC, azimuths: AZ });
  assert.equal(asGuild.style, "guildhall");
  assert.notEqual(asGuild.style_profile, asRustic.style_profile, "expected must differ by declared style");
  assert.notEqual(asGuild.palette_block, asRustic.palette_block, "material vocab must differ by style");

  // guildhall is also NOT a saltcrag reskin: it carries classical idioms saltcrag lacks.
  const s = styleProfileBlock({ pack: SALTCRAG });
  assert.doesNotMatch(s, /pilaster/);
  assert.doesNotMatch(s, /treatment idioms arch/);

  // single-source / self-grep discipline: derived from pack data, no subject names baked in.
  for (const subj of ["barn", "cottage", "synthetic", "gatehouse", "church"]) {
    assert.doesNotMatch(g, new RegExp(subj));
  }
  assert.equal(styleProfileBlock({ pack: GUILDHALL }), g); // deterministic
});

test("DG8 the style block is framed as NAMING VOCABULARY, NOT the standard (T-186-01 / E-47 re-frame)", () => {
  // The concept-image-conditioning fix: the pack block stops claiming the build "should read as" it —
  // the CONCEPT IMAGE is the standard, the pack supplies vocabulary to NAME departures. This is the
  // unit tripwire for the re-frame; the gate re-run (style-agreement-run.mjs) is the real proof.
  const r = styleProfileBlock({ pack: RUSTIC });
  assert.doesNotMatch(r, /should read as/, "the pack block must not be framed as what the build should read as");
  assert.match(r, /NAMING VOCABULARY/, "the pack block is a naming vocabulary");
  assert.match(r, /NOT the standard/i, "the block must say it is NOT the standard");
  assert.match(r, /CONCEPT IMAGE is the standard/i, "the standard is the concept image");
  // the body (the role→block / idiom lists) is untouched — the re-frame is the header only.
  assert.match(r, /spruce_planks/);
  assert.match(r, /timber-frame/);
});
