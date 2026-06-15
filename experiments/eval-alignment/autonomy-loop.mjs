#!/usr/bin/env node
/**
 * THE AGENTIC CLIMB (E-38, 2026-06-15): close the autonomy gap. Earlier the eval named a defect and I
 * SCRIPTED the fix. Here an AGENT reads the corrected eval's verdict and SELECTS a tool from a menu
 * each round — eval (perception) → agent picks tool (decision) → apply (action) → re-measure. Two
 * tools, so the choice is non-trivial: it must pick the roof tool when the cap is the roof, and the
 * wall tool when the cap moves to the walls.
 *
 * Agent = sonnet (decision); Eval = opus defect-dominated (judge) — different models, different roles.
 * FALSIFIABLE: the agent may pick the wrong tool, or climbing may stall/regress. Reported per round.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactOccupancy, occupancyFromCells } from "../../src/view/occupancy.mjs";
import { gableRecord, generateRoof } from "../../src/view/roof-generate.mjs";
import { constructWalls } from "../../src/view/wall-generate.mjs";
import { wallSkin } from "../../src/view/wall-skin.mjs";
import { extractApertures, dressOpenings } from "../../src/view/opening-dressing.mjs";
import { roleBlock } from "../../src/recognition/compile.mjs";
import { infillPanel } from "../../src/view/facade-articulation.mjs";
import { rebuildArtifact } from "../../src/view/shell-integrity.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";
import { requestText, requestTextWithImage } from "../../src/sdk-binding.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const FAMILY = { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab", findings: [] };
// wallField is NO LONGER hardcoded (T-160-02): the wall tool derives its last-resort fill from the pack's
// ground role and then SKINS the envelope from the program's declared roles (per-storey material, quoins,
// courses, dressed openings). barn--saltcrag is the WITNESS — the saltcrag pack's rich wall vocabulary
// (quoin/limewash/clinker) is where the construction-vs-recolor distinction shows hardest.
const SUBJECTS = {
  cottage: { artifact: "builds/cottage/final-artifact.json", concept: "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png", eaveY: 13, ridgeAxis: "z" },
  barn: { artifact: "builds/barn/final-artifact.json", concept: "benchmarks/sculpture/runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png", eaveY: 12, ridgeAxis: "x" },
  gatehouse: { artifact: "benchmarks/sculpture/generated/gatehouse/artifact.json", concept: "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png", eaveY: 18, ridgeAxis: "z" },
  "barn--saltcrag": { artifact: "benchmarks/sculpture/workshop/barn--saltcrag/final-artifact.json", concept: "benchmarks/sculpture/runs/017-vBuilding-a-rectangular-stone-tithe-barn-with-a-steep-gabled-roof-and-large-timber-wagon-doors/concept.png", eaveY: 9, ridgeAxis: "x", program: "barn--saltcrag" },
};
let SUBJECT, CFG;            // set per-subject by runSubject (so the batch runner can loop)
const ROUNDS = 3;
const AGENT_MODEL = "claude-sonnet-4-6";
const EVAL_MODEL = "claude-opus-4-8";

function img(p) { return { data: readFileSync(p), mediaType: "image/png" }; }
function parse(t) { const s = t.indexOf("{"), e = t.lastIndexOf("}"); return JSON.parse(t.slice(s, e + 1)); }
function occToCells(occ) {
  const out = [];
  for (const [key, block] of occ.cells) out.push({ pos: key.split(",").map(Number), block, form: occ.forms.get(key), state: occ.states.get(key) });
  return out;
}

// --- the two tools (each: occ -> occ) ---
function apply_gable_roof(occ) {
  const kept = []; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [key, block] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    if (y >= CFG.eaveY + 1) continue;
    kept.push({ pos: [x, y, z], block, form: occ.forms.get(key), state: occ.states.get(key) });
    if (y === CFG.eaveY) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  }
  const perp = CFG.ridgeAxis === "z" ? x1 - x0 : z1 - z0;
  const gable = gableRecord({ footprint: { x0, x1, z0, z1 }, ridgeAxis: CFG.ridgeAxis, eaveY: CFG.eaveY, ridgeY: CFG.eaveY + Math.floor(perp / 2), pitch: 1, hip: { demanded: false } });
  return occupancyFromCells([...kept, ...generateRoof([gable], FAMILY).cells]);
}
// CONSTRUCT the wall envelope (T-160-01, the REPLACE move, analogous to the gable). Earlier `seal_walls`
// PATCHED air inside existing columns and plateaued the cottage (it can't add absent columns). This
// instead delegates to the pure `constructWalls` brush: regularize the recognized footprint → clean
// perimeter ring → solidify floor→eave → cut a REGULAR opening rhythm from the RECOGNIZED program
// (frame-independent counts) or a derived fallback (gatehouse, no program). Subject facts arrive as
// params (eaveY/wallField from CFG, program loaded from disk) — the brush holds zero per-building knowledge.
function loadProgram(subject) {
  const p = join(ROOT, "benchmarks/sculpture/recognition", `${subject}.program.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}
function loadPack(program) {
  if (!program?.pack) return null;
  const p = join(ROOT, "packs", `${program.pack}.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
}
// T-160-02: construct the envelope (T-160-01), THEN skin it as CONSTRUCTION from the recognized roles +
// pack — per-storey material, dressed-stone quoins, clinker courses on a boarded upper, limewash banding,
// a plinth base course, and dressed openings (the dressing fns are injected; wallSkin may not import the
// technique — the brush-door rule). The last-resort envelope fill is the pack's ground role, not a
// hardcoded block; no pack/program (gatehouse) ⇒ envelope only, skin is a graceful no-op.
function construct_walls(occ) {
  const program = loadProgram(CFG.program ?? SUBJECT);
  const pack = loadPack(program);
  const floor = occ.bounds.min[1];
  const groundRole = program?.masses?.[0]?.walls?.ground?.role;
  const wallField = (pack && groundRole) ? roleBlock(pack, groundRole) : undefined;
  const env = constructWalls(occ, { floor, eaveY: CFG.eaveY, program, wallField });
  return wallSkin(env, { program, pack, floor, eaveY: CFG.eaveY, extractApertures, dressOpenings });
}
// Canonical half-timber facade (E-35 infillPanel): timber studs on a rhythm + plaster infill, gated to
// the UPPER storey. The material-contrast / detail tool — addresses the cottage's "uniform brown / no
// timber-framing" ceiling that roof+walls can't. Canonical (a regular stud rhythm), like the gable.
function add_timber_framing(occ) {
  const eave = CFG.eaveY;
  const upperStart = Math.floor(eave / 2) + 1; // upper storey ≈ top half of the wall band
  const r = infillPanel(occ, {
    memberMaterial: "dark_oak_log", fieldMaterial: "white_terracotta",
    faces: ["+x", "-x", "+z", "-z"], rhythm: { period: 3, phase: 0 }, span: 1, depth: 1,
    zoneOf: ([x, y, z]) => y >= upperStart && y <= eave, zone: true,
  });
  return occupancyFromCells([...occToCells(occ), ...r.placements.map((p) => ({ pos: p.pos, block: p.block }))]);
}
const TOOLS = { apply_gable_roof, construct_walls, add_timber_framing };
const MENU = [
  "- apply_gable_roof: replace the roof with a crisp parametric gable. Best when the worst defect is the ROOF (form/presence/shape).",
  "- construct_walls: REBUILD the wall envelope (replace, not patch) from the recognized footprint AND SKIN IT AS CONSTRUCTION from the pack's declared roles — a clean solid ring floor→eave with per-storey material (stone base / boarded or plaster upper), dressed-stone quoins at the corners, clinker courses, a plinth base course, and dressed openings. Best when the worst defect is STRUCTURAL INTEGRITY / wall holes / MISSING walls, OR a monotone/single-material wall (no base-vs-upper contrast, no corner dressing).",
  "- add_timber_framing: add timber-frame studs + plaster infill on the upper storey. Best when the worst defect is PALETTE/MATERIAL (uniform or monotone walls, no material contrast, missing half-timber detail).",
  "- done: stop — the build is good enough or no tool addresses the worst defect.",
].join("\n");

async function evalBuild(occ, template, round) {
  const outDir = join(ROOT, `builds/${SUBJECT}/autonomy/round-${round}`);
  await renderViews(rebuildArtifact(occ, template), ["+x+z"], { outDir, label: (a) => a, width: 512, height: 512 });
  const prompt = [
    "Image 1 is a CONCEPT (target); Image 2 is a Minecraft BUILD. Quality is DEFECT-DOMINATED: the single",
    "worst defect caps the score; sub-threshold differences must not move it. Axes: massing; roof form;",
    "structural integrity; palette; detail. Name the worst defect and set quality 0-100 = its cap.",
    'Output ONE JSON: {"worstDefect":{"axis":"<axis>","what":"<short>"},"quality":<int>,"rationale":"<one sentence>"}',
  ].join("\n");
  // MULTI-SAMPLE vote (fix for single-sample tail variance that regressed the greedy loop):
  // render once, score N=3, take median quality + modal worst-defect axis.
  const imgs = [img(join(ROOT, CFG.concept)), img(join(outDir, "view-+x+z.png"))];
  const samples = [];
  for (let s = 0; s < 3; s++) { const { text } = await requestTextWithImage({ prompt, images: imgs, model: EVAL_MODEL }); samples.push(parse(text)); }
  const qs = samples.map((o) => o.quality).sort((a, b) => a - b);
  const median = qs[1];
  const axisCount = {};
  samples.forEach((o) => { const a = o.worstDefect?.axis; axisCount[a] = (axisCount[a] || 0) + 1; });
  const modalAxis = Object.entries(axisCount).sort((a, b) => b[1] - a[1])[0][0];
  const rep = samples.find((o) => o.worstDefect?.axis === modalAxis) ?? samples[0];
  return { quality: median, worstDefect: { axis: modalAxis, what: rep.worstDefect?.what }, samples: qs, axisCount };
}
async function agentPick(verdict, history) {
  const hist = history.length
    ? history.map((h) => `- ${h.tool}: quality ${h.qBefore}→${h.qAfter} (${h.improved ? "IMPROVED" : "did NOT improve"})`).join("\n")
    : "(nothing tried yet)";
  const prompt = [
    "You are an agent improving a Minecraft build through tools. A quality eval reports the current WORST defect:",
    `  axis: ${verdict.worstDefect?.axis}`,
    `  detail: ${verdict.worstDefect?.what}`,
    `  quality: ${verdict.quality}/100`,
    "Tools already applied to THIS build, and whether they helped:",
    hist,
    "RULES:",
    "- If a tool you already applied did NOT improve quality, do NOT pick it again — it is not working on this build; choose a DIFFERENT tool.",
    "- A build can have multiple defects; if the obvious tool for the named worst defect already failed, address a different defect with a tool that has NOT been tried (e.g. the roof).",
    "Pick ONE tool:",
    MENU,
    'Output ONE JSON object: {"tool":"<apply_gable_roof|construct_walls|add_timber_framing|done>","reason":"<short>"}',
  ].join("\n");
  const { text } = await requestText({ prompt, model: AGENT_MODEL });
  return parse(text);
}

async function runSubject(key) {
  SUBJECT = key; CFG = SUBJECTS[key];
  const raw = JSON.parse(readFileSync(join(ROOT, CFG.artifact), "utf8"));
  let occ = artifactOccupancy(raw);
  const trajectory = [];
  const history = [];           // {tool, qBefore, qAfter, improved} — the agent's memory of what worked
  let prevPick = null, prevQ = null;
  for (let round = 0; round < ROUNDS; round++) {
    const v = await evalBuild(occ, raw, round);
    if (prevPick && TOOLS[prevPick.tool]) history.push({ tool: prevPick.tool, qBefore: prevQ, qAfter: v.quality, improved: v.quality > prevQ });
    console.error(`\n[${key} round ${round}] q=${v.quality} worst=${v.worstDefect?.axis} (${v.worstDefect?.what})`);
    const pick = await agentPick(v, history);
    console.error(`  agent picks: ${pick.tool} — ${pick.reason}`);
    trajectory.push({ round, quality: v.quality, worstDefect: v.worstDefect, pick });
    prevPick = pick; prevQ = v.quality;
    if (pick.tool === "done" || !TOOLS[pick.tool]) { console.error("  (agent stopped)"); break; }
    occ = TOOLS[pick.tool](occ);
  }
  const vFinal = await evalBuild(occ, raw, ROUNDS);
  trajectory.push({ round: ROUNDS, quality: vFinal.quality, worstDefect: vFinal.worstDefect, pick: { tool: "—" } });
  const q = trajectory.map((t) => t.quality);
  const delta = q[q.length - 1] - q[0];
  writeFileSync(join(HERE, "results", `autonomy-${key}.json`), JSON.stringify({ schema: "eval-alignment/autonomy/v1", subject: key, agentModel: AGENT_MODEL, evalModel: EVAL_MODEL, trajectory }, null, 2));
  console.error(`[${key}] trajectory ${q.join(" → ")} (${delta >= 0 ? "+" : ""}${delta}); tools: ${trajectory.filter((t) => t.pick.tool !== "—").map((t) => t.pick.tool).join(" → ")}`);
  return { subject: key, q, delta, climbed: delta > 0, tools: trajectory.filter((t) => t.pick.tool !== "—").map((t) => t.pick.tool) };
}

// BATCH VOLUME RUNNER: the agent works across a queue of building subjects unattended, with an aggregate
// ledger. This is the *infrastructure* for "real volume" — running at scale over time is deployment +
// elapsed time (not a one-session deliverable), but this is the harness that would do it, run for real
// on every building subject on disk.
async function main() {
  const arg = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const queue = arg ? [arg] : ["cottage", "barn", "gatehouse", "barn--saltcrag"];
  console.error(`=== VOLUME RUN over ${queue.length} building subjects: ${queue.join(", ")} ===`);
  const results = [];
  for (const key of queue) { try { results.push(await runSubject(key)); } catch (e) { console.error(`[${key}] FAILED: ${e.message}`); results.push({ subject: key, error: e.message, climbed: false }); } }
  const ok = results.filter((r) => r.climbed);
  const deltas = results.filter((r) => Number.isFinite(r.delta)).map((r) => r.delta);
  const meanDelta = deltas.length ? (deltas.reduce((a, b) => a + b, 0) / deltas.length) : 0;
  writeFileSync(join(HERE, "results", "volume-ledger.json"), JSON.stringify({ schema: "eval-alignment/volume/v1", agentModel: AGENT_MODEL, evalModel: EVAL_MODEL, rounds: ROUNDS, subjects: results }, null, 2));
  console.error(`\n================ VOLUME AGGREGATE ================`);
  console.error(`subjects run: ${results.length} | climbed (Δ>0): ${ok.length}/${results.length} | mean Δ: ${meanDelta >= 0 ? "+" : ""}${meanDelta.toFixed(1)}`);
  for (const r of results) console.error(`  ${r.subject}: ${r.error ? "ERROR " + r.error : r.q.join("→") + " (" + (r.delta >= 0 ? "+" : "") + r.delta + ")"}`);
  console.error(`NOTE: this is volume INFRASTRUCTURE + a real ${results.length}-subject run; "real long" (sustained unattended operation) is deployment + elapsed time, not a session.`);
  console.error("==================================================");
}
main().catch((e) => { console.error("FATAL:", e.message, "\n", e.stack); process.exit(1); });
