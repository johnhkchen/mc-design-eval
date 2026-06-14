// The recognized facade grammar BUILDS — end-to-end pure proof (T-147-01, story S-147, epic E-35).
// AC#2: "the existing jetty/dormer constructs wired into the program path so the recognised grammar
// actually builds." This walks the whole program path on a facade-bearing fixture:
//   building-program → validateProgramAgainstPack → compileProgram (plan + jetty refine) →
//   realizeProgram (constructs: shell + roof + jetty + dormers build) → applyArticulation
//   (the four E-35 passes emit proud relief) → reliefNoRegress (silhouette + ratios preserved).
// PURE — no GL/IO/Date/random beyond reading the committed fixture.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { loadStylePack } from "../pack/style-pack.mjs";
import { artifactOccupancy } from "../view/occupancy.mjs";
import { reliefNoRegress } from "../view/surface-relief.mjs";
import { assertWorkshopProgram, realizeProgram } from "../workshop/program.mjs";
import { assertBuildingProgram, validateProgramAgainstPack } from "./program.mjs";
import { compileProgram, applyArticulation } from "./compile.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const pack = loadStylePack(resolve(here, "..", "..", "packs", "rustic.json"));
const program = assertBuildingProgram(
  JSON.parse(readFileSync(resolve(here, "fixtures", "facade", "articulated-program.json"), "utf8")),
);

test("the facade fixture is pack-valid (roles in palette, numbers in bounds, diegetic)", () => {
  const v = validateProgramAgainstPack(program, pack);
  assert.deepEqual(v.findings, [], "no pack-validation findings");
});

test("constructs build from the recognised program: jetty (depth-refined) + dormers realize", () => {
  const { workshopProgram, articulation } = compileProgram(program, pack);
  const jetty = workshopProgram.elements.find((e) => e.id === "main-jetty-+z");
  assert.ok(jetty, "jetty element emitted from m.jetty");
  assert.equal(jetty.spec.overhang, 2, "jettyDepth from the facade grammar refined the lip");
  const dormers = workshopProgram.elements.filter((e) => e.idiom === "dormer");
  assert.equal(dormers.length, 2, "both dormers from m.roof.dormers build");
  assert.ok(articulation.length >= 3, "the facade grammar produced an articulation plan");

  const { artifact, cells } = realizeProgram(assertWorkshopProgram(workshopProgram));
  assert.ok(cells.length > 0 && artifact.placements.length > 0, "the program realizes to cells");
});

test("the articulation plan builds proud relief over the realized occupancy", () => {
  const { workshopProgram, articulation } = compileProgram(program, pack);
  const { artifact } = realizeProgram(assertWorkshopProgram(workshopProgram));
  const occ = artifactOccupancy(artifact);

  const { placements, report } = applyArticulation(occ, articulation);
  assert.ok(placements.length > 0, "the grammar actually builds — proud cells emitted");
  assert.equal(report.brushes, articulation.length);

  // every articulation brush in the plan contributed a report entry
  const planBrushes = articulation.map((a) => a.brush).sort();
  const reportBrushes = report.perBrush.map((b) => b.brush).sort();
  assert.deepEqual(reportBrushes, planBrushes);

  // the infill-panel studs are proud of the +z wall (perpendicular, +z direction)
  const studByName = report.perBrush.find((b) => b.brush === "infill-panel");
  assert.ok(studByName && studByName.placements > 0, "infill-panel emitted studs + field");
});

test("articulation is in-plane invisible: silhouette + height ratios preserved (the relief charter)", () => {
  const { workshopProgram, articulation } = compileProgram(program, pack);
  const { artifact } = realizeProgram(assertWorkshopProgram(workshopProgram));
  const occ = artifactOccupancy(artifact);
  const { placements } = applyArticulation(occ, articulation);

  const nr = reliefNoRegress(occ, placements, { faces: ["+z", "-z"] });
  assert.ok(nr.inPlanePreserved, "front/back elevation masks + proportions byte-unchanged");
  assert.ok(nr.ratiosPreserved, "ridgeToEave / roofShare byte-unchanged");
});

test("applyArticulation is deterministic — two runs are byte-identical", () => {
  const { workshopProgram, articulation } = compileProgram(program, pack);
  const { artifact } = realizeProgram(assertWorkshopProgram(workshopProgram));
  const occ = artifactOccupancy(artifact);
  const a = applyArticulation(occ, articulation).placements;
  const b = applyArticulation(occ, articulation).placements;
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});
