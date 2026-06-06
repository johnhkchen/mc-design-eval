// IMPURE RUNNER — surgical refine-to-standard (S-069 / T-069-01, epic E-20 the quality bar). Re-run the E-15
// surgical revision loop on the high-res building (T-068-01 `building/best/artifact.json`) with the building's
// GLB as the FORM TARGET (`glbFormTarget`, the E-16 seam), region-by-region, BOUNDED rounds, accept-if-improved
// against the true per-region GLB IoU. After each round, judge the whole-build render with the categorical
// JudgeFacade (Weak/Competent/Strong/Exceptional, median of N samples) → the verdict trajectory. Record the
// per-region edit trace (procedural vs LLM, kept/rolled-back), the form-IoU trajectory, and P14-safety; state
// the honest outcome (Strong+ reached @round OR the topping-out point + the specific detail it couldn't fix).
//
// THE SEAM INVARIANT (AC#1): the loop body, observe, diagnose, and the accept gate are the EXISTING E-15/E-16
// code — the only thing this ticket adds is orchestration (bounded rounds + per-round judge) + measurement
// (the pure src/form/surgical-standard.mjs analyzer). No change to reviseLoop, glbFormTarget, the editors, or
// the judge. Mirrors glb-formtarget-ab.mjs (loop + glbFormTarget) ⊕ building-build.mjs (asset load + per-round
// write + --offline). GL + metered claude -p: run on demand, NOT in `npm test`.
//
//   node benchmarks/sculpture/surgical-standard.mjs                     # live (GLB + GL + claude -p judge/edit)
//   node benchmarks/sculpture/surgical-standard.mjs --rounds 2 --samples 3
//   node benchmarks/sculpture/surgical-standard.mjs --offline           # re-derive report from committed rounds

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { reviseLoop, liveFormScore } from "../../src/revise/loop.mjs";
import { observeRegion, artifactBounds } from "../../src/revise/region.mjs";
import { makeFormEditor } from "../../src/revise/form-edit.mjs";
import { glbFormTarget } from "../../src/form/form-target.mjs";
import { judgeRender } from "../temple-facade/judge.mjs";
import { BUILDING_VIEW_3Q } from "../../src/building.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { assembleSurgicalStandard, meetsStandard } from "../../src/form/surgical-standard.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const GLB_DIR = join(HERE, "glb");
const RUNS_DIR = join(HERE, "runs");
const BUILDING_DIR = join(HERE, "building");
const FRAMES_DIR = join(REPO, "pr", "assets", "frames");

const SUBJECT = {
  key: "building",
  glb: "stone-gatehouse.glb",
  run: "015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate",
  best: join(BUILDING_DIR, "best", "artifact.json"),
};

// The AC's named fine-detail zones, addressed as SCALE-ROBUST `where` slabs (survive a re-voxelize). Each
// carries the defect the critic routes to the LLM form-edit route (line/relief defects the procedural passes
// leave unhandled). A `--regions` JSON override is accepted for tuning.
const DEFAULT_REGIONS = [
  { spec: { where: "top", fraction: 0.22 }, defect: "stair-stepped", where: "the roof edges / gable ridge (cornice line)" },
  { spec: { where: "front", fraction: 0.3 }, defect: "soft", where: "the gable face + the arched-gate voussoir ring" },
  { spec: { where: "left", fraction: 0.28 }, defect: "soft", where: "the side window reveals (the 1×3 slit windows)" },
  { spec: { where: "right", fraction: 0.28 }, defect: "soft", where: "the side window reveals (the 1×3 slit windows)" },
];

const round3 = (n) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null);

async function readJson(p) {
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(await readFile(p, "utf8"));
  } catch {
    return null;
  }
}

/** Render the WHOLE artifact at the building 3/4 view. GL. */
async function wholeRender(artifact, outPath) {
  const { renderArtifact } = await import("../../render/src/render-tool.mjs");
  await renderArtifact(artifact, { outPath, view: BUILDING_VIEW_3Q });
  return outPath;
}

/** Judge a whole-build render with the categorical JudgeFacade (median of `samples`). claude -p (metered). */
async function judgeWhole(renderPath, brief, samples) {
  const j = await judgeRender({ imagePath: renderPath, brief, samples });
  return j;
}

/**
 * One bounded round: run reviseLoop over `regions` with the GLB form-target accept-gate, render the whole
 * build, score whole-object IoU + judge it. Returns { cell, trace, acceptedSpecs, artifact }.
 */
async function runRound({ artifact, regions, target, brief, roundIdx, samples, dir, perRegion }) {
  await mkdir(dir, { recursive: true });
  // Force the LLM form route so the model proposes line/detail edits (procedural relief stays available if a
  // critic tags it). Mirrors glb-formtarget-ab.mjs:107 — one critic, the editor's router picks the pass.
  const editor = makeFormEditor({
    critic: (a, R) => {
      const r = regions.find((x) => x.spec === R.spec) ?? regions[0];
      return [{ defect: r.defect, where: r.where, route: "detail" }];
    },
  });

  const out = await reviseLoop(artifact, {
    regions: regions.map((r) => r.spec),
    observe: (a, R) => observeRegion(a, R, { outPath: join(dir, "crop.png") }),
    diagnose: editor.diagnose,
    tweakFor: editor.tweakFor,
    score: liveFormScore({ formTarget: target }),
    budget: { maxIterations: regions.length * perRegion, perRegion },
  });

  const renderPath = join(dir, "render-3q.png");
  await wholeRender(out.artifact, renderPath);
  const wholeIoU = round3(await target.wholeObjectScore(renderPath));
  const judge = await judgeWhole(renderPath, brief, samples);

  const acceptedSpecs = out.trace.filter((e) => e.accepted).map((e) => e.region);
  const cell = {
    round: roundIdx,
    overall: judge.overall,
    proportion: judge.proportion,
    color: judge.color,
    detail: judge.detail,
    fidelity: judge.fidelity,
    perSample: judge.perSample,
    notes: judge.notes,
    wholeIoU,
    accepted: acceptedSpecs.length,
    usage: judge.usage,
  };
  await writeFile(join(dir, "summary.json"), JSON.stringify({ cell, trace: out.trace }, null, 2) + "\n");
  console.error(
    `round ${roundIdx}: overall ${judge.overall} · whole IoU ${wholeIoU} · accepted ${acceptedSpecs.length}/${regions.length}`,
  );
  return { cell, trace: out.trace, acceptedSpecs, artifact: out.artifact };
}

/** Render + judge the unedited baseline (round 0 — the trajectory's first point). */
async function baselineRound({ artifact, target, brief, samples, dir }) {
  await mkdir(dir, { recursive: true });
  const renderPath = join(dir, "render-3q.png");
  await wholeRender(artifact, renderPath);
  const wholeIoU = round3(await target.wholeObjectScore(renderPath));
  const judge = await judgeWhole(renderPath, brief, samples);
  const cell = {
    round: 0,
    overall: judge.overall,
    proportion: judge.proportion,
    color: judge.color,
    detail: judge.detail,
    fidelity: judge.fidelity,
    perSample: judge.perSample,
    notes: judge.notes,
    wholeIoU,
    accepted: 0,
    usage: judge.usage,
  };
  await writeFile(join(dir, "summary.json"), JSON.stringify({ cell, trace: [] }, null, 2) + "\n");
  console.error(`round 0 (baseline): overall ${judge.overall} · whole IoU ${wholeIoU}`);
  return { cell, trace: [] };
}

async function emit({ rounds, trace, brief }) {
  const { md, json } = assembleSurgicalStandard({ rounds, trace, brief });
  await writeFile(join(HERE, "surgical-standard.json"), JSON.stringify(json, null, 2) + "\n");
  await writeFile(join(HERE, "surgical-standard.md"), md);
  console.error(
    `wrote surgical-standard.{md,json}; outcome: ${json.outcome.reachedStandard ? `reached ${json.bar}+ @round ${json.outcome.atRound}` : `topped out at ${json.outcome.bestVerdict}`}`,
  );
  return json;
}

async function runLive({ rounds: maxRounds, samples, perRegion, regions }) {
  const glbPath = join(GLB_DIR, SUBJECT.glb);
  if (!existsSync(glbPath)) throw new Error(`glb/${SUBJECT.glb} absent (gitignored) — provision via T-067 / trellis-glb.mjs`);
  const best = await readJson(SUBJECT.best);
  if (!best?.placements?.length) throw new Error(`${SUBJECT.best} missing — run \`npm run building:build\` first (T-068-01)`);
  assertArtifact(best);
  const designDoc = await readFile(join(RUNS_DIR, SUBJECT.run, "design-doc.md"), "utf8").catch(() => null);
  const brief = designDoc ?? "a stone gatehouse with a peaked gable roof and an arched gate";

  const buildBounds = artifactBounds(best);
  const target = glbFormTarget({ glbPath, buildBounds }); // THE form target — the E-16 seam, reused verbatim

  await mkdir(BUILDING_DIR, { recursive: true });
  const cells = [];
  const trace = [];

  // Round 0: the baseline verdict (pre-edit).
  const base = await baselineRound({ artifact: best, target, brief, samples, dir: join(BUILDING_DIR, "round-0") });
  cells.push(base.cell);
  if (meetsStandard(base.cell.overall)) {
    console.error("baseline already meets the bar — no rounds needed.");
    const json = await emit({ rounds: cells, trace, brief });
    await saveRefined(best, json);
    return;
  }

  let current = best;
  let remaining = [...regions];
  for (let r = 1; r <= maxRounds; r++) {
    if (remaining.length === 0) {
      console.error("all regions locked — converged.");
      break;
    }
    const res = await runRound({
      artifact: current,
      regions: remaining,
      target,
      brief,
      roundIdx: r,
      samples,
      perRegion,
      dir: join(BUILDING_DIR, `round-${r}`),
    });
    cells.push(res.cell);
    trace.push(...res.trace);
    current = res.artifact;
    // P14 across rounds: drop the regions the loop accepted (locked) — never revisit them.
    remaining = remaining.filter((reg) => !res.acceptedSpecs.includes(reg.spec));
    if (meetsStandard(res.cell.overall)) {
      console.error(`reached the bar at round ${r}.`);
      break;
    }
    if (res.acceptedSpecs.length === 0) {
      console.error(`round ${r} accepted nothing (dry) — the loop has converged below the bar.`);
      break;
    }
  }

  const json = await emit({ rounds: cells, trace, brief });
  await saveRefined(current, json);
}

/** Save the final refined build (AC#4): building/refined/artifact.json + pr/assets/frames/building-refined.png. */
async function saveRefined(artifact, json) {
  assertArtifact(artifact);
  await mkdir(join(BUILDING_DIR, "refined"), { recursive: true });
  await writeFile(join(BUILDING_DIR, "refined", "artifact.json"), JSON.stringify(artifact, null, 2) + "\n");
  // the render of the final state is the last round's render-3q.png; copy it as the refined frame.
  const lastRound = json.rounds.reduce((m, r) => (r.round != null && r.round > (m ?? -1) ? r.round : m), null);
  const srcPng = lastRound != null ? join(BUILDING_DIR, `round-${lastRound}`, "render-3q.png") : null;
  if (srcPng && existsSync(srcPng)) {
    await mkdir(FRAMES_DIR, { recursive: true });
    await copyFile(srcPng, join(FRAMES_DIR, "building-refined.png"));
  }
  console.error(`saved building/refined/artifact.json (${artifact.placements.length} placements)` + (srcPng ? " + pr/assets/frames/building-refined.png" : ""));
}

/** --offline: re-derive the report from each committed `round-N/summary.json` (no GL/model). */
async function verifyOffline({ rounds: maxRounds }) {
  const cells = [];
  const trace = [];
  let brief = null;
  for (let r = 0; r <= maxRounds; r++) {
    const s = await readJson(join(BUILDING_DIR, `round-${r}`, "summary.json"));
    if (!s) continue;
    cells.push(s.cell);
    if (Array.isArray(s.trace)) trace.push(...s.trace);
  }
  const designDoc = await readFile(join(RUNS_DIR, SUBJECT.run, "design-doc.md"), "utf8").catch(() => null);
  brief = designDoc ?? null;
  if (cells.length === 0) {
    console.error("offline: no committed round summaries found — emitting placeholder report.");
  }
  const json = await emit({ rounds: cells, trace, brief });
  console.error(`offline: ${cells.length} round(s); outcome ${json.outcome.reachedStandard ? "reached" : "topped out"}`);
}

function parseArgs(argv) {
  const num = (flag, def) => {
    const i = argv.indexOf(flag);
    return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : def;
  };
  let regions = DEFAULT_REGIONS;
  const ri = argv.indexOf("--regions");
  if (ri >= 0 && argv[ri + 1]) {
    try {
      regions = JSON.parse(argv[ri + 1]);
    } catch {
      console.error("--regions: unparseable JSON; using defaults");
    }
  }
  return { rounds: num("--rounds", 2), samples: num("--samples", 3), perRegion: num("--per-region", 2), regions };
}

async function main() {
  const argv = process.argv.slice(2);
  const opts = parseArgs(argv);
  await mkdir(BUILDING_DIR, { recursive: true });
  if (argv.includes("--offline")) {
    await verifyOffline(opts);
    return;
  }
  await runLive(opts);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("surgical-standard failed:\n  " + (err?.stack || err?.message || err));
    process.exit(1);
  });
}

export { SUBJECT, DEFAULT_REGIONS, runRound, baselineRound };
