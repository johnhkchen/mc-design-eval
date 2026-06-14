// Live cottage surface-coherence run (T-084-01, story S-084, epic E-23). Loads the built cottage, computes
// the PURE geometric read (T-078-01), runs the two LIGHT-tier detectors (T-082-01) over same-angle views as
// the METERED calls that source the candidate flags + the seal-before-hollow signal, then applies the PURE
// deterministic surface-coherence ops (sealRoof, sealWalls) and the watertight CHECK. Records before/after
// roof coverage + stray/intrusion/skin-hole counts + the watertight pass/fail, writes the SEALED artifact
// and before/after renders to docs/active/work/T-084-01/. Run: `npm run coherence:cottage`.
//
// The detectors + GL renders are the metered/impure edge; the seal ops + watertight check are pure (and
// unit-tested offline in src/view/surface-coherence.test.mjs).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { structuralRead } from "../../src/view/structural-read.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";
import { runTieredOp } from "../../src/model-tier.mjs";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";
import {
  sealRoof, sealWalls, watertightCheck, applyDeltas, roofOutlineCoverage,
} from "../../src/view/surface-coherence.mjs";
import { TIER as ROOF_TIER, roofCandidates, buildRoofPatchPrompt, parseRoofPatch } from "../../src/view/roof-patch.mjs";
import {
  TIER as HOLLOW_TIER, hollowableCore, buildHollowablePrompt, parseHollowable,
} from "../../src/view/hollowable-mass.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const ART_PATH = join(ROOT, "benchmarks/sculpture/concept-materials/cottage/after-artifact.json");
const OUT_DIR = join(ROOT, "docs/active/work/T-084-01");

function usageOf(raw) {
  const u = raw?.usage ?? {};
  return { input_tokens: u.input_tokens, output_tokens: u.output_tokens, total_cost_usd: raw?.total_cost_usd };
}

/** Run one light-tier detector over a same-angle render and parse its reply (metered). */
async function runDetector({ op, tier, prompt, imagePath, parse }) {
  const image = await readFile(imagePath);
  console.error(`\n▶ ${op} — tier=${tier}, view=${imagePath.replace(ROOT, "")}`);
  const { text, raw, model } = await runTieredOp({ tier, prompt, images: [image], invoke: requestTextWithImage });
  let parsed = null, parseError = null;
  try { parsed = parse(text); } catch (e) { parseError = e.message; console.error(`  parse failed: ${e.message}`); }
  console.error(`  ✓ ran on model=${model}${parsed ? ` → ${JSON.stringify(parsed).slice(0, 160)}` : ""}`);
  return { op, tier, model, usage: usageOf(raw), parsed, parseError };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const artifact = JSON.parse(await readFile(ART_PATH, "utf8"));
  const occ = artifactOccupancy(artifact);
  const read = structuralRead(occ);
  console.error(`Cottage: ${artifact.placements.length} placements, ${occ.size} voxels, dims ${occ.dims.join("×")}.`);

  // --- pure priors -------------------------------------------------------------------------------
  const roofCand = roofCandidates(read.roofRegion);
  const core = hollowableCore(occ);
  console.error(`Roof prior: dominant=${roofCand.dominant}, ${roofCand.stray.length} stray, coverage ${roofCand.coverage}.`);
  console.error(`Hollow prior: ${core.enclosed} enclosed cells, ${core.skinHoles} skin holes.`);

  // --- same-angle BEFORE renders + the two METERED light-tier detectors --------------------------
  console.error("Rendering BEFORE views (top, threeQuarter) through the E-22 fixed lens…");
  const before = await renderViews(artifact, ["top", "threeQuarter"], { outDir: OUT_DIR, label: (a) => `before-${a}` });
  const beforeByAngle = Object.fromEntries(before.map((r) => [String(r.angle), r.path]));

  const detectors = [];
  detectors.push(await runDetector({
    op: "roof-patch-detector", tier: ROOF_TIER,
    prompt: buildRoofPatchPrompt(read.roofRegion, roofCand), imagePath: beforeByAngle.top, parse: parseRoofPatch,
  }));
  detectors.push(await runDetector({
    op: "hollowable-mass-detector", tier: HOLLOW_TIER,
    prompt: buildHollowablePrompt(read, core), imagePath: beforeByAngle.threeQuarter, parse: parseHollowable,
  }));

  // --- PURE surface-coherence ops ----------------------------------------------------------------
  console.error("\nApplying pure seal ops (strip strays + seal holes)…");
  const roof = sealRoof(occ);
  const walls = sealWalls(occ);
  const deltas = [...roof.placements, ...walls.placements];
  const sealedArtifact = applyDeltas(artifact, deltas);
  const sealedOcc = artifactOccupancy(sealedArtifact);

  const wtBefore = watertightCheck(occ);
  const wtAfter = watertightCheck(sealedOcc);
  console.error(`Roof: ${roof.stripped} strays stripped, ${roof.filled} holes filled; coverage ${roof.before.coverage}→${roof.after.coverage}.`);
  console.error(`Walls: ${walls.stripped} intrusions stripped, ${walls.sealed} holes sealed.`);
  console.error(`Watertight: ${wtBefore.watertight} → ${wtAfter.watertight} (interior ${wtAfter.interiorCells}, reached ${wtAfter.reached}).`);

  // --- write the sealed artifact + AFTER renders -------------------------------------------------
  await writeFile(join(OUT_DIR, "cottage-sealed-artifact.json"), JSON.stringify(sealedArtifact, null, 2));
  console.error("Rendering AFTER views…");
  const after = await renderViews(sealedArtifact, ["top", "threeQuarter"], { outDir: OUT_DIR, label: (a) => `after-${a}` });

  const report = {
    schema: "surface-coherence/v1",
    subject: "cottage (after-artifact.json)",
    placements: { before: artifact.placements.length, after: sealedArtifact.placements.length },
    occupancy: { voxels: occ.size, dims: occ.dims },
    roof: {
      field: roof.field, stripped: roof.stripped, filled: roof.filled,
      coverage: { before: roof.before.coverage, after: roof.after.coverage },
      strayCount: { before: roof.before.strayCount, after: roof.after.strayCount },
    },
    walls: {
      stripped: walls.stripped, sealed: walls.sealed,
      faces: walls.faces.map((f) => ({ dir: f.dir, field: f.field, stripped: f.stripped, sealed: f.sealed, before: f.before, after: f.after })),
    },
    watertight: { before: wtBefore, after: wtAfter },
    detectors,
    renders: {
      before: before.map((r) => ({ angle: r.angle, path: r.path.replace(ROOT, ""), bytes: r.bytes })),
      after: after.map((r) => ({ angle: r.angle, path: r.path.replace(ROOT, ""), bytes: r.bytes })),
    },
  };
  await writeFile(join(OUT_DIR, "surface-coherence-report.json"), JSON.stringify(report, null, 2));
  console.error(`\n✓ wrote ${join(OUT_DIR, "surface-coherence-report.json")}`);
  console.error(`✓ wrote ${join(OUT_DIR, "cottage-sealed-artifact.json")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
