// Render proof for T-145-02 (storey-aware facade recognition, E-35) — JUDGE-FREE.
//
//   node benchmarks/sculpture/facade-relief-proof.mjs --subject cottage
//
// Proves the look the recognized STOREY-AWARE grammar buys: it augments a subject's recognized program
// with a storey-banded facade grammar (the shape recognition emits — band "upper" for the cottage's
// plaster storey), runs it through the REAL compiler band-threading (compileProgram →
// facadeArticulationPlan carries band as pure data), applies the four E-35 brushes over the CLEAN
// committed build occupancy (applyArticulation → the brushes restrict relief to the storey y-range), and
// renders the articulated artifact beside the concept. No chain, no gate, no pin write — the glance.
//
// The grammar here is HAND-AUTHORED as the offline stand-in for the live recognition pass (the live
// `claude -p` producer is benchmarks/sculpture/facade-grammar.mjs --ticket T-145-02). The point of THIS
// script is the construction proof: band → compiler → brushes → render, on a real subject's clean build.

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { assertBuildingProgram, validateProgramAgainstPack } from "../../src/recognition/program.mjs";
import { compileProgram, applyArticulation } from "../../src/recognition/compile.mjs";
import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { assertGlAvailable, renderBesideConcept } from "../../src/view/render-beside.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");

const argv = process.argv.slice(2);
const argOf = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };

// Per-subject inputs (the clean build, the recognized program, the concept). Subjects are data.
const SUBJECTS = {
  cottage: {
    key: "cottage",
    program: "recognition/cottage.program.json",
    build: "workshop/cottage/final-artifact.json",
    concept: "runs/014-vConcept-a-cottage/concept.png",
    // the storey-aware half-timber grammar the model emits for the plaster UPPER storey (rustic vocab):
    // dark_oak_log studs framing white_terracotta plaster, confined to band "upper" — no plinth cover.
    facade: () => ({
      eaveOverhang: 1,
      faces: ["+z", "-z", "+x", "-x"].map((wall) => ({
        wall,
        band: "upper",
        rhythm: { period: 4, phase: 0 },
        memberRole: "frame.timber",
        fields: { role: "wall.infill.upper" },
        evidence: { source: "concept", layoutOnly: false },
      })),
    }),
  },
};

function mergePlacements(base, articulation) {
  const byKey = new Map();
  for (const p of base) byKey.set(p.pos.join(","), p);
  for (const p of articulation) byKey.set(p.pos.join(","), { op: "voxel", pos: p.pos, block: p.block });
  return [...byKey.values()].sort((a, b) => a.pos[0] - b.pos[0] || a.pos[1] - b.pos[1] || a.pos[2] - b.pos[2]);
}

async function main() {
  const subject = argOf("--subject");
  if (!subject || !SUBJECTS[subject]) throw new Error(`--subject must be one of: ${Object.keys(SUBJECTS).join(", ")}`);
  const def = SUBJECTS[subject];

  assertGlAvailable(); // the render is the proof — fail loud and early if GL is absent

  const pack = loadStylePack(join(ROOT, "packs", "rustic.json"));
  const program = assertBuildingProgram(JSON.parse(await readFile(join(HERE, def.program), "utf8")));
  // augment every mass with the storey-aware facade grammar (the recognition-shaped input)
  for (const m of program.masses) m.facade = def.facade();
  const v = validateProgramAgainstPack(program, pack);
  if (!v.ok) throw new Error("augmented program is off the pack vocabulary:\n" + v.findings.map((f) => `  ${f.where}: ${f.msg}`).join("\n"));

  // REAL band-threading: compile the grammar into the brush plan (band carried as pure {yLo,yHi} data)
  const { articulation } = compileProgram(program, pack);
  const banded = articulation.filter((a) => a.params.band);
  console.error(`[proof] ${def.key}: ${articulation.length} brushes, ${banded.length} band-restricted (upper storey)`);

  // apply the brushes over the CLEAN committed build occupancy
  const buildArt = JSON.parse(await readFile(join(HERE, def.build), "utf8"));
  const occ = artifactOccupancy(buildArt);
  const { placements, report } = applyArticulation(occ, articulation);
  console.error(`[proof] ${def.key}: ${placements.length} relief placements (${report.perBrush.map((b) => `${b.brush}:${b.placements}`).join(", ")})`);

  const articulated = { ...buildArt, placements: mergePlacements(buildArt.placements, placements) };

  const conceptAbs = join(HERE, def.concept);
  if (!existsSync(conceptAbs)) throw new Error(`no concept for ${def.key} (${def.concept})`);
  const outAbs = argOf("--out") || join(FRAMES_DIR, `beside-concept-${def.key}-relief.png`);
  const res = await renderBesideConcept(articulated, conceptAbs, outAbs, { label: `${def.key}-relief` });
  console.error(`[proof] ${def.key}: ${res.panels}-panel sheet → ${outAbs.replace(ROOT, "")} (judge-free, the glance)`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
