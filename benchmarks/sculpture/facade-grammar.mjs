// FACADE-GRAMMAR RUNNER (T-145-01, story S-145, epic E-35) — the second recognition pass. Reads the
// already-recognized building program + the concept (front, authoritative) + multi-angle TEXTURED-GLB
// renders (spatial-layout evidence on the unseen back/sides — the 2026-06-14 ratified narrowing) and
// writes the facade grammar onto each mass. `node benchmarks/sculpture/facade-grammar.mjs
// --subject <key> [--pack packs/<style>.json] [--ticket <id>] [--rotate-pins]`, or `--offline`.
//
// LIVE (metered, subscription shim, STRONG tier — never the metered API): one facade ask driven by the
// T-114 reply policy (same-prompt bounded re-asks on malformed/off-vocabulary/non-diegetic replies;
// every attempt ledgered, raw texts committed). The merged program re-validates through the program +
// pack + DIEGETIC gates (assertFacadeDiegetic: a per-face receipt proving the GLB informed layout, never
// materials). The textured-GLB views render at the 4 gate azimuths as EVIDENCE (sha-receipted; render
// absence recorded, never fatal — GL bytes never decide). NO JUDGE CALLS.
//
// --offline (E-31 Rule 5, the replay re-assert): committed reply → parseFacadeReply against the committed
// base program → byte-compare the merged program against the committed merged-program.json + re-run the
// diegetic receipt. No model, no writes, no GL.
//
// FALLBACK (AC #4): a face unreadable from concept or GLB is tagged evidence.source "pack-idealised" by
// the model (a named state, never a silent default); render-throw is caught and recorded.
//
// Registry-only: subjects come from the durable-skin SUBJECTS table (LIVE) or the committed facade
// record dirs (OFFLINE); the self-grep pins that no subject key appears in this source.

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { MODEL_TIERS, MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";
import { runReplyPolicy } from "../../src/form/judge-reply.mjs";
import { guardedWriteRecord, preflightPins, loadTrackedSet, isTracked, ROTATE_FLAG } from "../../src/form/pin-guard.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { parseBuildingProgram, assertFacadeDiegetic } from "../../src/recognition/program.mjs";
import { facadeRenderArgs, parseFacadeReply, FACADE_REPLY_BUDGET } from "../../src/recognition/facade-grammar.mjs";
import { renderTexturedGlbViews } from "../../src/recognition/facade-render.mjs";
import { recognitionRels, DEFAULT_PACK_REL } from "../../src/workshop/seed.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

export const FACADE_RECORD_SCHEMA = "facade-grammar/v1";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const REC_DIR = join(HERE, "recognition");
const FACADE_DIR = join(REC_DIR, "facade");
const SKETCH_DIR = join(HERE, "form-sketch");

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";

/** Subjects with a committed recognition program AND a GLB (LIVE candidates). */
const subjectDefs = () => Object.values(SUBJECTS).filter((d) => d.glb && d.generated?.scale);

/** E-25 Rule 3 self-grep: no subject keys in this runner's source. */
async function generalizationGrep() {
  const src = await readFile(fileURLToPath(import.meta.url), "utf8");
  const hits = Object.keys(SUBJECTS).filter((k) => src.includes(k));
  return { subjectKeysInRunner: hits, clean: hits.length === 0 };
}

async function renderTexturedEvidence(glbPath, outDir, label) {
  try {
    const { plan, views } = await renderTexturedGlbViews({
      glbPath, azimuths: [...MULTI_ANGLE_GATE.azimuths], outDir, label, width: 1024, height: 1024,
    });
    return { plan, views: views.map((v) => ({ ...v, path: relative(ROOT, v.path) })), renderError: null };
  } catch (err) {
    console.error(`[facade] textured-GLB render: unavailable (${err.message})`);
    return { plan: { glb: relative(ROOT, glbPath), method: "voxel-colour-splat", azimuths: [...MULTI_ANGLE_GATE.azimuths], layoutOnly: true }, views: [], renderError: err.message };
  }
}

async function runLive(def, { rotate }) {
  const key = def.key;
  const rels = recognitionRels(key, packRel);
  const facadeRel = (suffix) => `benchmarks/sculpture/recognition/facade/${rels.runKey}.${suffix}`;
  const pins = ["program.json", "merged.json", "replies.json", "prompt.md", "record.json", "render.json"].map((s) => facadeRel(s));
  const trackedSet = loadTrackedSet(ROOT);
  preflightPins({ pins: pins.map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })), rotate, intent: `live facade grammar (${rels.runKey})` });

  const pack = loadStylePack(join(ROOT, packRel));
  const baseText = await readFile(join(ROOT, rels.program), "utf8");
  const parsed = parseBuildingProgram(baseText);
  if (!parsed.ok) throw new Error(`committed recognition program for ${key} is invalid: ${parsed.errors.join("; ")}`);
  const base = parsed.program;

  const conceptB64 = (await readFile(join(HERE, def.concept))).toString("base64");
  await mkdir(FACADE_DIR, { recursive: true });

  // Textured-GLB multi-angle renders (evidence; absence recorded, never fatal).
  const evidence = await renderTexturedEvidence(join(HERE, def.glb), FACADE_DIR, (a) => `${rels.runKey}-glbtex-${a}`);
  const glbImages = {};
  for (const v of evidence.views) glbImages[`glb_${v.angle}`] = { base64: (await readFile(join(ROOT, v.path))).toString("base64"), mediaType: "image/png" };

  const { facade_digest, schema_json } = facadeRenderArgs({ program: base, pack });
  const prompt = `${facade_digest}\n\n----\nAnswer with {"facades": {massId: facade}} in this sub-schema:\n\n${schema_json}\n`;
  const promptSha256 = sha256(prompt);
  const model = MODEL_TIERS.strong;
  const images = { concept: { base64: conceptB64, mediaType: "image/png" }, ...glbImages };

  const rawTexts = [];
  const ask = async () => {
    const { text } = await requestTextWithImage({ prompt, images, model });
    rawTexts.push(text);
    return { text };
  };
  console.error(`[facade] ${key}: asking (budget ${FACADE_REPLY_BUDGET}, model ${model}, ${evidence.views.length} glb views)…`);
  const { verdict: merged, replies, askCount } = await runReplyPolicy(ask, {
    parse: (t) => parseFacadeReply(t, { program: base, pack }),
    maxAttempts: FACADE_REPLY_BUDGET,
  });

  const write = (rel, content) => guardedWriteRecord({ root: ROOT, rel, content, rotate });
  await write(facadeRel("replies.json"), jsonOf({ schema: "facade-replies/v1", ticket: ticketId, subject: key, pack: pack.style, model, promptSha256, budget: FACADE_REPLY_BUDGET, askCount, accepted: merged !== null, replies, rawTexts }));
  await write(facadeRel("prompt.md"), `# Facade prompt — ${rels.runKey} (${ticketId})\n\nsha256 \`${promptSha256}\`\n\n----\n\n${prompt}\n`);

  if (merged === null) {
    console.error(`[facade] ${key}: REFUSED — every reply malformed/off-vocabulary within budget (ledger committed).`);
    return false;
  }

  const diegetic = assertFacadeDiegetic(merged, pack);
  const grep = await generalizationGrep();
  await write(facadeRel("merged.json"), jsonOf(merged));
  await write(facadeRel("render.json"), jsonOf({ schema: "facade-render/v1", ticket: ticketId, subject: key, ...evidence.plan, views: evidence.views, renderError: evidence.renderError }));
  await write(facadeRel("record.json"), jsonOf({
    schema: FACADE_RECORD_SCHEMA, ticket: ticketId, subject: key, runKey: rels.runKey, pack: pack.style, model, promptSha256, askCount, budget: FACADE_REPLY_BUDGET,
    diegetic: { ok: diegetic.ok, receipt: diegetic.receipt }, render: { method: evidence.plan.method, azimuths: evidence.plan.azimuths, layoutOnly: true, views: evidence.views.length, renderError: evidence.renderError },
    generalization: grep, replay: { npmRun: "facade-grammar:offline", asserts: "committed reply → byte-identical merged program" },
  }));

  console.error(`[facade] ${rels.runKey}: ${merged.masses.reduce((n, m) => n + (m.facade?.faces.length ?? 0), 0)} faces; diegetic ${diegetic.ok ? "PROVEN" : "FAILED"}; asks ${askCount}; grep ${grep.clean ? "clean" : `HITS ${grep.subjectKeysInRunner}`}`);
  return diegetic.ok && grep.clean;
}

/** OFFLINE: replay a committed facade record dir (base-program + reply → merged-program), byte-exact. */
async function runOfflineDir(dir) {
  const reply = await readFile(join(dir, "reply.txt"), "utf8");
  const base = JSON.parse(await readFile(join(dir, "base-program.json"), "utf8"));
  const committed = await readFile(join(dir, "merged-program.json"), "utf8");
  const packRelForDir = base.pack === "rustic" ? DEFAULT_PACK_REL : `packs/${base.pack}.json`;
  const pack = loadStylePack(join(ROOT, packRelForDir));
  const merged = parseFacadeReply(reply, { program: base, pack });
  const fresh = jsonOf(merged);
  const identical = sha256(fresh) === sha256(committed);
  const diegetic = assertFacadeDiegetic(merged, pack);
  const label = relative(ROOT, dir);
  console.error(`[offline] ${label}: merged program ${identical ? "REPRODUCES byte-identically" : "DIVERGES"} ` +
    `(sha ${sha256(fresh).slice(0, 12)}… vs ${sha256(committed).slice(0, 12)}…); diegetic ${diegetic.ok ? "PROVEN" : "FAILED"}`);
  return identical && diegetic.ok;
}

// --- CLI ------------------------------------------------------------------------------------------

const argv = process.argv.slice(2);
const argOf = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
const onlySubject = argOf("--subject");
const all = argv.includes("--all");
const offline = argv.includes("--offline");
const rotate = argv.includes(ROTATE_FLAG);
const packRel = argOf("--pack") ?? DEFAULT_PACK_REL;
const ticketId = argOf("--ticket") ?? "T-145-01";

if (offline) {
  const entries = existsSync(FACADE_DIR) ? await readdir(FACADE_DIR, { withFileTypes: true }) : [];
  const dirs = entries.filter((e) => e.isDirectory() && existsSync(join(FACADE_DIR, e.name, "reply.txt"))).map((e) => join(FACADE_DIR, e.name));
  if (dirs.length === 0) throw new Error("--offline: no committed facade record dirs found");
  const results = [];
  for (const d of dirs) results.push(await runOfflineDir(d));
  if (results.some((ok) => !ok)) process.exit(1);
} else {
  const defs = subjectDefs();
  if (!all && !onlySubject) throw new Error(`pass --subject <${defs.map((d) => d.key).join("|")}>, --all, or --offline`);
  if (onlySubject && !defs.some((d) => d.key === onlySubject)) throw new Error(`--subject must be one of: ${defs.map((d) => d.key).join(", ")}`);
  const selected = defs.filter((d) => !onlySubject || d.key === onlySubject);
  for (const def of selected) {
    const ok = await runLive(def, { rotate });
    if (!ok) process.exit(1);
  }
}
