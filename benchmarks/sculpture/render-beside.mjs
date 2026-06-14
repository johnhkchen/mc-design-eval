// render:beside — the judge-free render-beside-concept command (T-152-01, story S-152, epic E-36).
//
//   npm run render:beside -- --subject <key> [--out <path>]
//
// E-36 ("de-freeze the creation loop"): the render IS the creation loop's feedback signal. This is
// the standalone, judge-free entry — it reads an ALREADY-COMMITTED build artifact (no chain, no gate
// spawn, no pin write, no billed run) and writes a textured render beside the concept to pr/assets/.
// "No GL" is a hard, named failure here (assertGlAvailable at the top), never a silent defer.
//
// Subjects are data (the durable-skin registry). The committed generated artifact
// (generated/<key>/artifact.json) is preferred when present (it carries the freshest chain output —
// e.g. the barn's T-150-01 gable/overhang fix); otherwise the registry `build` path.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

import { SUBJECTS } from "./durable-skin.mjs";
import { assertGlAvailable, renderBesideConcept } from "../../src/view/render-beside.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");

const argv = process.argv.slice(2);
const argOf = (flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : null;
};

async function main() {
  const subject = argOf("--subject");
  if (!subject || !SUBJECTS[subject]) {
    throw new Error(`--subject must be one of: ${Object.keys(SUBJECTS).join(", ")}`);
  }
  const def = SUBJECTS[subject];

  // GL is the precondition for a render-bearing run — fail loud and early (AC2).
  assertGlAvailable();

  // Prefer the committed generated artifact (freshest chain output); fall back to the registry build.
  const generatedRel = `generated/${def.key}/artifact.json`;
  const buildRel = existsSync(join(HERE, generatedRel)) ? generatedRel : def.build;
  const buildAbs = join(HERE, buildRel);
  if (!existsSync(buildAbs)) throw new Error(`no committed build artifact for ${def.key} (${buildRel})`);
  const conceptAbs = join(HERE, def.concept);
  if (!existsSync(conceptAbs)) throw new Error(`no committed concept for ${def.key} (${def.concept})`);

  const artifact = JSON.parse(await readFile(buildAbs, "utf8"));
  const outAbs = argOf("--out") || join(FRAMES_DIR, `beside-concept-${def.key}.png`);

  const res = await renderBesideConcept(artifact, conceptAbs, outAbs, { label: def.key });

  console.error(
    `[render:beside] ${def.key}: ${res.panels}-panel sheet (concept + ${res.panels - 1} azimuths) → ` +
      `${outAbs.replace(ROOT, "")}\n` +
      `  build: ${buildRel}  concept: ${def.concept}\n` +
      `  judge-free, no chain, no pin write — this is the glance, not a verdict.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
