// Layer A→B split smoke (T-164-02, story S-164, epic E-39) — the judge-free witness the ACs ask for: one
// real build through DiagnoseBuild → RouteCritique, showing a dispatch where EVERY item resolves to a real
// idiom-registry entry, rendered BESIDE the concept. NOT part of `npm test` (metered, non-deterministic).
// Mirrors diagnose-smoke.mjs, extended with the routing half + the beside-concept render.
//
//   npm run route:smoke -- --subject barn [--round 6]
//
// Two tiered calls (no re-ask — spend-limit caution; a zero-token notice reply would only burn budget),
// then resolveDispatch (the membership gate) + renderBesideConcept (the creation-loop feedback lens). The
// dispatch trace is written beside this ticket's work dir for the S-166 bake-off. Transport rides the
// `claude -p` subscription shim (model-tier); not on the frozen judge path (transport-guard untouched).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { runTieredOp } from "../../src/model-tier.mjs";
import { bamlRender, bamlParse } from "../../src/baml/bridge.mjs";
import { diagnoseRenderArgs } from "../../src/workshop/diagnose.mjs";
import { routeRenderArgs, resolveDispatch } from "../../src/workshop/route.mjs";
import { renderBesideConcept } from "../../src/view/render-beside.mjs";
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
const artifactPath = join(ROOT, `builds/${subjectKey}/final-artifact.json`);
for (const p of [conceptPath, artifactPath, ...renderPaths]) {
  if (!existsSync(p)) throw new Error(`missing asset for the smoke: ${p} — render/build the subject first`);
}

const toB64 = async (p) => ({ base64: (await readFile(p)).toString("base64"), mediaType: "image/png" });

// ---- Layer A: DiagnoseBuild → Critique ----
const diag = await bamlRender({
  fn: "DiagnoseBuild",
  args: diagnoseRenderArgs({ program, pack, azimuths }),
  images: { concept: await toB64(conceptPath), renders: await Promise.all(renderPaths.map(toB64)) },
});
console.log(`[route-smoke] ${subjectKey}: diagnose prompt ${diag.prompt.length}B, ${diag.images.length} images`);
const { text: diagText } = await runTieredOp({ tier: TIER, prompt: diag.prompt, images: diag.images });
const critique = await bamlParse({ fn: "DiagnoseBuild", text: diagText });
if (!(critique?.items?.length > 0)) throw new Error("[route-smoke] diagnosis emptied — nothing to route");
console.log(`[route-smoke] diagnosed ${critique.items.length} item(s): ${critique.items.map((i) => i.department).join(", ")}`);

// ---- Layer B: RouteCritique → Dispatch ----
const route = await bamlRender({ fn: "RouteCritique", args: routeRenderArgs({ critique }) });
console.log(`[route-smoke] route prompt ${route.prompt.length}B`);
const { text: routeText } = await runTieredOp({ tier: TIER, prompt: route.prompt });
const parsed = await bamlParse({ fn: "RouteCritique", text: routeText });
const dispatch = resolveDispatch(parsed); // throws if any item dead-ends — the membership gate
console.log(`[route-smoke] routed: ${dispatch.map((d) => `${d.department}→${d.idiom}`).join(", ")}`);

// ---- the beside-concept render (judge-free feedback lens) ----
const outDir = join(ROOT, "docs/active/work/T-164-02");
await mkdir(outDir, { recursive: true });
const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
const besidePath = join(outDir, `route-smoke-${subjectKey}.png`);
const { panels } = await renderBesideConcept(artifact, conceptPath, besidePath, { label: `route-${subjectKey}` });
console.log(`[route-smoke] rendered ${panels} panels beside concept → ${besidePath}`);

// ---- evidence ----
const outPath = join(outDir, `route-smoke-${subjectKey}.json`);
await writeFile(outPath, JSON.stringify({
  subject: subjectKey, round, tier: TIER,
  critique, dispatch, rawDiagnose: diagText, rawRoute: routeText,
}, null, 2) + "\n");
console.log(`[route-smoke] evidence written: ${outPath}`);
