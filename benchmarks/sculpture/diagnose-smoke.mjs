// Layer A diagnostic smoke (T-164-01, story S-164, epic E-39) — the live witness the ACs ask for:
// one real (concept, render) pair through DiagnoseBuild, showing NON-VACUOUS expected/present/missing.
// NOT part of `npm test` (metered, non-deterministic). Mirrors workshop.mjs's exchange seam, trimmed
// to the diagnosis half: render the Layer A prompt (concept + recognized program + the build's 4
// gate-azimuth renders), ONE tiered call (no re-ask — spend-limit caution), b.parse to the typed
// Critique, print + write the evidence beside this ticket's work dir.
//
//   npm run diagnose:smoke -- --subject barn [--round 6]
//
// Transport rides the `claude -p` subscription shim (model-tier), exactly as the workshop runner does;
// this file is a benchmark runner, not on the frozen judge path (transport-guard untouched).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { runTieredOp } from "../../src/model-tier.mjs";
import { bamlRender, bamlParse } from "../../src/baml/bridge.mjs";
import { diagnoseRenderArgs } from "../../src/workshop/diagnose.mjs";
import { workshopSubjectsFrom, recognitionRels, DEFAULT_PACK_REL } from "../../src/workshop/seed.mjs";
import { SUBJECTS as REGISTRY } from "./durable-skin.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const argv = process.argv.slice(2);
const argOf = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : undefined; };
const subjectKey = argOf("--subject") ?? "barn";
const round = argOf("--round") ?? "6";
const REL_DIR = "benchmarks/sculpture/workshop";
const TIER = "strong"; // the workshop-critique tier (model-tier OP_ROUTING)

const subjects = workshopSubjectsFrom(REGISTRY, { relDir: REL_DIR, packRel: DEFAULT_PACK_REL });
const def = subjects[subjectKey];
if (!def) throw new Error(`unknown subject "${subjectKey}" (have: ${Object.keys(subjects).join(", ")})`);

const pack = loadStylePack(join(ROOT, def.pack));
const program = JSON.parse(await readFile(join(ROOT, recognitionRels(subjectKey, def.pack).program), "utf8"));
const azimuths = [...MULTI_ANGLE_GATE.azimuths];

const conceptPath = join(ROOT, def.concept);
const renderPaths = azimuths.map((a) => join(ROOT, `builds/${subjectKey}/round-${round}/view-${a}.png`));
for (const p of [conceptPath, ...renderPaths]) {
  if (!existsSync(p)) throw new Error(`missing image for the smoke: ${p} — render the build first`);
}

const toB64 = async (p) => ({ base64: (await readFile(p)).toString("base64"), mediaType: "image/png" });
const args = diagnoseRenderArgs({ program, pack, azimuths });
const { prompt, images } = await bamlRender({
  fn: "DiagnoseBuild",
  args,
  images: { concept: await toB64(conceptPath), renders: await Promise.all(renderPaths.map(toB64)) },
});
console.log(`[diagnose-smoke] ${subjectKey}: prompt ${prompt.length}B, ${images.length} images, tier ${TIER}`);

// ONE call, no re-ask (spend-limit caution): a zero-token notice reply would only burn budget.
const { text } = await runTieredOp({ tier: TIER, prompt, images });
const critique = await bamlParse({ fn: "DiagnoseBuild", text });

const nonVacuous = (critique.items ?? []).filter((i) => i.expected?.trim() && i.present?.trim() && i.missing?.trim());
console.log(`[diagnose-smoke] ${critique.items?.length ?? 0} items, ${nonVacuous.length} non-vacuous, departments: ${(critique.items ?? []).map((i) => i.department).join(", ")}`);
console.log(JSON.stringify(critique, null, 2));

const outDir = join(ROOT, "docs/active/work/T-164-01");
await mkdir(outDir, { recursive: true });
const outPath = join(outDir, `smoke-${subjectKey}.json`);
await writeFile(outPath, JSON.stringify({ subject: subjectKey, round, tier: TIER, raw: text, critique }, null, 2) + "\n");
console.log(`[diagnose-smoke] evidence written: ${outPath}`);
if (nonVacuous.length === 0) {
  console.error("[diagnose-smoke] WARNING: no non-vacuous items — the diagnosis read as empty/vacuous");
  process.exitCode = 1;
}
