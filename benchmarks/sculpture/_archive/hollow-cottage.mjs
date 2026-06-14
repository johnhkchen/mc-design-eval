// Live cottage hollow-the-mass run (T-080-01, story S-080, epic E-23). Loads the SEALED cottage (the
// watertight-shell precondition T-084-01 produced), computes the PURE geometric read (T-078-01), runs the
// LIGHT-tier hollowable-mass detector (T-082-01) over a 3/4 view as the METERED call that confirms the
// carveable mass + flags seal-before-hollow blockers, then applies the PURE deterministic carve
// (markHollowable → carveArtifact, flatten-by-exclusion — NO air op), PROVES the exterior is unchanged
// (exteriorHeld over the 6 ortho views), records block count before/after (the cavity size) + the
// watertight result, and writes the hollow artifact + before/after renders to docs/active/work/T-080-01/.
// Run: `npm run hollow:cottage`.
//
// The detector + GL renders are the metered/impure edge; the carve + exterior-held proof are pure (and
// unit-tested offline in src/view/hollow-carve.test.mjs).

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { structuralRead } from "../../src/view/structural-read.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";
import { runTieredOp } from "../../src/model-tier.mjs";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";
import {
  sealRoof, sealWalls, applyDeltas, watertightCheck,
} from "../../src/view/surface-coherence.mjs";
import {
  TIER as HOLLOW_TIER, hollowableCore, buildHollowablePrompt, parseHollowable,
} from "../../src/view/hollowable-mass.mjs";
import {
  markHollowable, carveArtifact, carveOccupancy, cavityReport,
  cornerPostKeys, tallColumnKeys, exteriorHeld,
} from "../../src/view/hollow-carve.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SEALED_PATH = join(ROOT, "docs/active/work/T-084-01/cottage-sealed-artifact.json");
const RAW_PATH = join(ROOT, "benchmarks/sculpture/concept-materials/cottage/after-artifact.json");
const OUT_DIR = join(ROOT, "docs/active/work/T-080-01");
const VIEWS = ["threeQuarter", "front", "top"];

function usageOf(raw) {
  const u = raw?.usage ?? {};
  return { input_tokens: u.input_tokens, output_tokens: u.output_tokens, total_cost_usd: raw?.total_cost_usd };
}

const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

/** Load the SEALED cottage (T-084 precondition); if absent, seal the raw cottage in-process. */
async function loadSealedCottage() {
  if (await exists(SEALED_PATH)) {
    return { artifact: JSON.parse(await readFile(SEALED_PATH, "utf8")), source: "T-084 sealed artifact" };
  }
  console.error("⚠ sealed cottage not found — sealing the raw cottage in-process (seal-before-hollow).");
  const raw = JSON.parse(await readFile(RAW_PATH, "utf8"));
  const occ = artifactOccupancy(raw);
  const deltas = [...sealRoof(occ).placements, ...sealWalls(occ).placements];
  return { artifact: applyDeltas(raw, deltas), source: "raw cottage sealed in-process" };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const { artifact, source } = await loadSealedCottage();
  const occ = artifactOccupancy(artifact);
  const read = structuralRead(occ);
  const core = hollowableCore(occ);
  console.error(`Cottage (${source}): ${artifact.placements.length} placements, ${occ.size} voxels, dims ${occ.dims.join("×")}.`);
  console.error(`Hollow prior: ${core.enclosed} enclosed cells, ${core.skinHoles} skin holes.`);

  // --- BEFORE renders + the METERED light-tier hollowable detector --------------------------------
  console.error("Rendering BEFORE views through the E-22 fixed lens…");
  const before = await renderViews(artifact, VIEWS, { outDir: OUT_DIR, label: (a) => `before-${a}` });
  const beforeByAngle = Object.fromEntries(before.map((r) => [String(r.angle), r.path]));

  let detector = null;
  try {
    const image = await readFile(beforeByAngle.threeQuarter);
    console.error(`\n▶ hollowable-mass-detector — tier=${HOLLOW_TIER}, view=threeQuarter`);
    const { text, raw, model } = await runTieredOp({
      tier: HOLLOW_TIER, prompt: buildHollowablePrompt(read, core), images: [image], invoke: requestTextWithImage,
    });
    let parsed = null, parseError = null;
    try { parsed = parseHollowable(text); } catch (e) { parseError = e.message; }
    console.error(`  ✓ model=${model}${parsed ? ` → ${JSON.stringify(parsed).slice(0, 200)}` : ` (parse failed: ${parseError})`}`);
    detector = { op: "hollowable-mass-detector", tier: HOLLOW_TIER, model, usage: usageOf(raw), parsed, parseError };
  } catch (e) {
    console.error(`  detector call failed: ${e.message} — falling back to the geometric mark.`);
    detector = { op: "hollowable-mass-detector", error: e.message, parsed: null };
  }

  // --- watertight precondition (honest record) ----------------------------------------------------
  const wt = watertightCheck(occ);
  console.error(`Watertight (skin): ${wt.watertight} (interior ${wt.interiorCells}, reached ${wt.reached}).`);
  const blockers = detector?.parsed?.blockers ?? [];
  if (blockers.length || core.skinHoles) {
    console.error(`⚠ seal-before-hollow: ${blockers.length} blocker(s), ${core.skinHoles} skin holes — carving enclosed mass (exterior-safe regardless).`);
  }

  // --- PURE carve: enclosed minus protected structure ---------------------------------------------
  const keep = new Set([...cornerPostKeys(occ), ...tallColumnKeys(occ, { minSpanFrac: 0.9 })]);
  const useDetector = detector?.parsed?.hollowable === true && blockers.length === 0;
  const regions = useDetector ? detector.parsed.regions : undefined;
  const inset = useDetector && detector.parsed.regions[0]?.inset ? detector.parsed.regions[0].inset : 1;
  const mark = markHollowable(occ, { keep, regions, inset });
  console.error(`\nCarve: ${mark.enclosed} enclosed, ${mark.protectedCount} protected (structure), ${mark.removeCount} removed (inset=${inset}, regions=${regions ? regions.length : "none"}).`);

  const hollowArtifact = carveArtifact(artifact, mark.remove);
  const hollowOcc = carveOccupancy(occ, mark.remove);
  const held = exteriorHeld(occ, hollowOcc);
  const cavity = cavityReport(occ, mark.remove);
  console.error(`Exterior held: ${held.held} (digest ${held.held ? "identical" : "CHANGED"}).`);
  console.error(`Cavity: ${cavity.before} → ${cavity.after} voxels (${cavity.removed} removed).`);
  if (!held.held) throw new Error("exterior-held proof FAILED — the carve changed a front-most surface voxel (this must never happen).");

  // --- AFTER renders (must be identical to BEFORE) + watertight of the hollow ----------------------
  await writeFile(join(OUT_DIR, "hollow-cottage-artifact.json"), JSON.stringify(hollowArtifact, null, 2));
  console.error("Rendering AFTER views (expected identical to BEFORE)…");
  const after = await renderViews(hollowArtifact, VIEWS, { outDir: OUT_DIR, label: (a) => `after-${a}` });
  const wtHollow = watertightCheck(hollowOcc);

  const report = {
    schema: "hollow-carve/v1",
    subject: `cottage (${source})`,
    placements: { before: artifact.placements.length, after: hollowArtifact.placements.length },
    occupancy: { voxels: occ.size, dims: occ.dims },
    carve: {
      enclosed: mark.enclosed, protectedCount: mark.protectedCount, removeCount: mark.removeCount,
      inset, regions: regions ?? null, perBand: mark.perBand,
      keep: { cornerPosts: cornerPostKeys(occ).size, tallColumns: tallColumnKeys(occ, { minSpanFrac: 0.9 }).size, total: keep.size },
    },
    cavity,
    exteriorHeld: { held: held.held, digestBytesBefore: held.digestBefore.length, digestBytesAfter: held.digestAfter.length },
    watertight: { beforeCarve: wt, afterCarve: wtHollow },
    detector,
    renders: {
      before: before.map((r) => ({ angle: r.angle, path: r.path.replace(ROOT, ""), bytes: r.bytes })),
      after: after.map((r) => ({ angle: r.angle, path: r.path.replace(ROOT, ""), bytes: r.bytes })),
    },
  };
  await writeFile(join(OUT_DIR, "hollow-report.json"), JSON.stringify(report, null, 2));
  console.error(`\n✓ wrote ${join(OUT_DIR, "hollow-report.json")}`);
  console.error(`✓ wrote ${join(OUT_DIR, "hollow-cottage-artifact.json")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
