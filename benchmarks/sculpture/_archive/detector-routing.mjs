// Live cottage detector routing (T-082-01, AC #2/#3/#4). Loads the built cottage, computes the PURE
// geometric read (T-078-01), renders the same-angle views through the E-22 fixed lens, then runs the two
// LIGHT-tier exemplar detectors over those views via the `claude -p` subscription shim (a smaller
// `--model`, never the API key) — proving right-sized model routing. Writes a report + the generated
// scoping-rationale doc to docs/active/work/T-082-01/. Run: `npm run detect:routing`.
//
// This is the one metered/GL entry point; the pure cores it exercises are unit-tested offline.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { structuralRead } from "../../src/view/structural-read.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";
import { runTieredOp, OP_ROUTING, routingTableMarkdown } from "../../src/model-tier.mjs";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";
import {
  TIER as ROOF_TIER,
  roofCandidates,
  buildRoofPatchPrompt,
  parseRoofPatch,
} from "../../src/view/roof-patch.mjs";
import {
  TIER as HOLLOW_TIER,
  hollowableCore,
  buildHollowablePrompt,
  parseHollowable,
} from "../../src/view/hollowable-mass.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const ART_PATH = join(ROOT, "benchmarks/sculpture/concept-materials/cottage/after-artifact.json");
const OUT_DIR = join(ROOT, "docs/active/work/T-082-01");

/** Pull per-turn usage off a terminal result for the metered ledger (best-effort; shape varies). */
function usageOf(raw) {
  const u = raw?.usage ?? {};
  return { input_tokens: u.input_tokens, output_tokens: u.output_tokens, total_cost_usd: raw?.total_cost_usd };
}

/** Run one light-tier detector op over a same-angle render and parse the reply. */
async function runDetector({ op, tier, prompt, imagePath, parse }) {
  const image = await readFile(imagePath);
  console.error(`\n▶ ${op} — tier=${tier}, view=${imagePath.replace(ROOT, "")}`);
  const { text, raw, model } = await runTieredOp({ tier, prompt, images: [image], invoke: requestTextWithImage });
  let parsed = null, parseError = null;
  try {
    parsed = parse(text);
  } catch (e) {
    parseError = e.message;
    console.error(`  parse failed: ${e.message}\n  raw: ${text.slice(0, 400)}`);
  }
  console.error(`  ✓ ran on model=${model}${parsed ? ` → ${JSON.stringify(parsed).slice(0, 200)}` : ""}`);
  return { op, tier, model, usage: usageOf(raw), parsed, parseError, rawText: text };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const artifact = JSON.parse(await readFile(ART_PATH, "utf8"));
  const occ = artifactOccupancy(artifact);
  const read = structuralRead(occ);
  console.error(`Cottage: ${artifact.placements.length} placements, ${occ.size} voxels, dims ${occ.dims.join("×")}.`);

  // --- pure priors (the bounded candidate sets the light models triage) ---------------------------
  const roofCand = roofCandidates(read.roofRegion);
  const core = hollowableCore(occ);
  console.error(
    `Roof prior: dominant=${roofCand.dominant}, ${roofCand.stray.length} stray, ~${roofCand.holeCount} holes (coverage ${roofCand.coverage}).`,
  );
  console.error(`Hollow prior: ${core.enclosed} enclosed cells, ${core.skinHoles} skin holes, ${core.perBand.length} bands.`);

  // --- same-angle renders through the E-22 fixed lens ---------------------------------------------
  console.error("Rendering detector views (top, threeQuarter) through the E-22 fixed lens…");
  const renders = await renderViews(artifact, ["top", "threeQuarter"], { outDir: OUT_DIR, label: (a) => String(a) });
  const byAngle = Object.fromEntries(renders.map((r) => [r.angle, r.path]));

  // --- the two LIGHT-tier detector ops -----------------------------------------------------------
  const results = [];
  results.push(
    await runDetector({
      op: "roof-patch-detector",
      tier: ROOF_TIER,
      prompt: buildRoofPatchPrompt(read.roofRegion, roofCand),
      imagePath: byAngle.top,
      parse: parseRoofPatch,
    }),
  );
  results.push(
    await runDetector({
      op: "hollowable-mass-detector",
      tier: HOLLOW_TIER,
      prompt: buildHollowablePrompt(read, core),
      imagePath: byAngle.threeQuarter,
      parse: parseHollowable,
    }),
  );

  // --- record the scoping rationale (generated from the single-sourced table) ---------------------
  await writeFile(join(OUT_DIR, "scoping-rationale.md"), routingTableMarkdown());

  const report = {
    schema: "detector-routing/v1",
    subject: "cottage (after-artifact.json)",
    placements: artifact.placements.length,
    occupancy: { voxels: occ.size, dims: occ.dims },
    priors: {
      roof: { dominant: roofCand.dominant, stray: roofCand.stray, holeCount: roofCand.holeCount, coverage: roofCand.coverage },
      hollow: core,
    },
    renders: renders.map((r) => ({ angle: r.angle, path: r.path.replace(ROOT, ""), bytes: r.bytes })),
    routing: OP_ROUTING,
    ops: results.map((r) => ({
      op: r.op, tier: r.tier, model: r.model, usage: r.usage, parsed: r.parsed, parseError: r.parseError,
    })),
  };
  await writeFile(join(OUT_DIR, "detector-routing-report.json"), JSON.stringify(report, null, 2));
  console.error(`\n✓ wrote ${join(OUT_DIR, "detector-routing-report.json")}`);
  console.error(`✓ wrote ${join(OUT_DIR, "scoping-rationale.md")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
