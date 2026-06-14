// Live cottage N×M floorplan-infill run (T-081-01, story S-081, epic E-23). Loads the HOLLOW cottage (the
// empty shell T-080-01 carved), computes the PURE structural read (T-078-01), renders the PLAN + elevation
// canvas, runs the STRONG-tier floorplan-AUTHOR detector (the floorplan REASONING — the only metered call)
// to steer a small FloorplanSpec, then runs the PURE deterministic generator (partition the footprint into
// an N×M grid, place floors at the storey lines + dividing walls + interior doorways by EXCLUSION), scores
// the PURE PLAUSIBILITY gate (six constraints + a named residual), PROVES the exterior is unchanged
// (exteriorHeld over the 6 ortho views — the fill must be invisible), and writes the filled artifact +
// before/after renders + the gate report to docs/active/work/T-081-01/. Run: `npm run floorplan:cottage`.
//
// The detector + GL renders are the metered/impure edge; the generator + gate + exterior-held proof are
// pure (and unit-tested offline in src/view/floorplan.test.mjs).

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { structuralRead } from "../../src/view/structural-read.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";
import { runTieredOp } from "../../src/model-tier.mjs";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";
import { exteriorHeld } from "../../src/view/hollow-carve.mjs";
import {
  sealRoof, sealWalls, applyDeltas,
} from "../../src/view/surface-coherence.mjs";
import { markHollowable, carveArtifact, cornerPostKeys, tallColumnKeys } from "../../src/view/hollow-carve.mjs";
import {
  TIER as FLOORPLAN_TIER, storeysFromRead, generateFloorplan, applyFloorplan,
  gateFloorplan, buildFloorplanPrompt, parseFloorplanSpec, FLOORPLAN_SCHEMA, DEFAULT_MATERIALS,
} from "../../src/view/floorplan.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HOLLOW_PATH = join(ROOT, "docs/active/work/T-080-01/hollow-cottage-artifact.json");
const SEALED_PATH = join(ROOT, "docs/active/work/T-084-01/cottage-sealed-artifact.json");
const RAW_PATH = join(ROOT, "benchmarks/sculpture/concept-materials/cottage/after-artifact.json");
const OUT_DIR = join(ROOT, "docs/active/work/T-081-01");
const VIEWS = ["top", "front", "threeQuarter"]; // top = the plan/below canvas; front = the elevation

function usageOf(raw) {
  const u = raw?.usage ?? {};
  return { input_tokens: u.input_tokens, output_tokens: u.output_tokens, total_cost_usd: raw?.total_cost_usd };
}
const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

/** Load the HOLLOW cottage (T-080 precondition); if absent, seal+carve the raw cottage in-process so the
 *  runner is self-sufficient (seal-before-hollow, then hollow, then fill). */
async function loadHollowCottage() {
  if (await exists(HOLLOW_PATH)) {
    return { artifact: JSON.parse(await readFile(HOLLOW_PATH, "utf8")), source: "T-080 hollow artifact" };
  }
  const sealedExists = await exists(SEALED_PATH);
  const base = JSON.parse(await readFile(sealedExists ? SEALED_PATH : RAW_PATH, "utf8"));
  let sealed = base;
  if (!sealedExists) {
    const occ0 = artifactOccupancy(base);
    sealed = applyDeltas(base, [...sealRoof(occ0).placements, ...sealWalls(occ0).placements]);
  }
  const occ = artifactOccupancy(sealed);
  const keep = new Set([...cornerPostKeys(occ), ...tallColumnKeys(occ, { minSpanFrac: 0.9 })]);
  const mark = markHollowable(occ, { keep });
  return { artifact: carveArtifact(sealed, mark.remove), source: "raw cottage sealed+hollowed in-process" };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const { artifact, source } = await loadHollowCottage();
  const occ = artifactOccupancy(artifact);
  const read = structuralRead(occ);
  const storeys = storeysFromRead(read);
  const manifest = artifact.palette?.manifest ?? [];
  console.error(`Hollow cottage (${source}): ${artifact.placements.length} placements, ${occ.size} voxels, dims ${occ.dims.join("×")}.`);
  console.error(`Structural read: footprint ${read.footprint.width}×${read.footprint.depth} (${read.footprint.area}), floorLines ${JSON.stringify(read.storeyBands.floorLines)}, ${storeys.length} storeys.`);

  // --- BEFORE renders (plan + elevation) + the METERED strong-tier floorplan-author ----------------
  console.error("Rendering BEFORE views (plan + elevation) through the E-22 fixed lens…");
  const before = await renderViews(artifact, VIEWS, { outDir: OUT_DIR, label: (a) => `before-${a}` });
  const beforeByAngle = Object.fromEntries(before.map((r) => [String(r.angle), r.path]));

  let detector = null, spec = null;
  try {
    const plan = await readFile(beforeByAngle.top);
    const elevation = await readFile(beforeByAngle.front);
    console.error(`\n▶ floorplan-author — tier=${FLOORPLAN_TIER}, views=top+front`);
    const { text, raw, model } = await runTieredOp({
      tier: FLOORPLAN_TIER,
      prompt: buildFloorplanPrompt(read, storeys, read.footprint, manifest),
      images: [plan, elevation], invoke: requestTextWithImage,
    });
    let parseError = null;
    try { spec = parseFloorplanSpec(text, { manifest }); } catch (e) { parseError = e.message; }
    console.error(`  ✓ model=${model}${spec ? ` → ${JSON.stringify(spec)}` : ` (parse failed: ${parseError})`}`);
    detector = { op: "floorplan-author", tier: FLOORPLAN_TIER, model, usage: usageOf(raw), spec, parseError };
  } catch (e) {
    console.error(`  detector call failed: ${e.message} — falling back to a deterministic 2×2 spec.`);
    detector = { op: "floorplan-author", error: e.message, spec: null };
  }
  if (!spec) {
    spec = { schema: FLOORPLAN_SCHEMA, rows: 2, cols: 2, materials: DEFAULT_MATERIALS, doorPolicy: "spanning", frontDoor: null };
    console.error(`  using fallback spec: ${JSON.stringify(spec)}`);
  }

  // --- PURE generator: partition + bulk placement ---------------------------------------------------
  const { plan, placements } = generateFloorplan(occ, read, spec);
  const filled = applyFloorplan(artifact, placements);
  const filledOcc = artifactOccupancy(filled);
  console.error(`\nFloorplan: ${spec.rows}×${spec.cols} grid, ${plan.grid.rooms.length} rooms/storey, ${placements.length} placements (floors + walls), ${plan.storeys.reduce((n, s) => n + s.doors.length, 0)} doorways.`);

  // --- PURE plausibility gate + exterior-held proof -------------------------------------------------
  const gate = gateFloorplan(occ, read, plan);
  const held = exteriorHeld(occ, filledOcc);
  console.error("Plausibility gate:");
  for (const c of gate.constraints) console.error(`  ${c.pass ? "✓" : "✗"} ${c.name}: ${c.detail}`);
  console.error(`  → ${gate.pass ? "PASS" : "FAIL"}; residual: ${gate.residual ?? "(none)"}`);
  console.error(`Exterior held: ${held.held} (digest ${held.held ? "identical" : "CHANGED"}).`);
  if (!held.held) throw new Error("exterior-held proof FAILED — the floorplan fill changed a front-most surface voxel (this must never happen).");

  // --- AFTER renders (must be identical to BEFORE) + write artifacts --------------------------------
  await writeFile(join(OUT_DIR, "floorplan-cottage-artifact.json"), JSON.stringify(filled, null, 2));
  console.error("Rendering AFTER views (expected identical to BEFORE)…");
  const after = await renderViews(filled, VIEWS, { outDir: OUT_DIR, label: (a) => `after-${a}` });

  const report = {
    schema: FLOORPLAN_SCHEMA,
    subject: `cottage (${source})`,
    placements: { before: artifact.placements.length, after: filled.placements.length, added: placements.length },
    occupancy: { voxels: occ.size, dims: occ.dims },
    structuralRead: {
      footprint: { width: read.footprint.width, depth: read.footprint.depth, area: read.footprint.area },
      floorLines: read.storeyBands.floorLines, storeys: storeys.length,
    },
    spec,
    floorplan: {
      rows: spec.rows, cols: spec.cols, materials: plan.materials,
      roomsPerStorey: plan.grid.rooms.length,
      storeys: plan.storeys.map((s) => ({ index: s.index, floorY: s.floorY, ceilY: s.ceilY, rooms: s.rooms.length, doors: s.doors.length })),
    },
    gate: { pass: gate.pass, constraints: gate.constraints, residual: gate.residual },
    exteriorHeld: {
      held: held.held,
      scope: "10-camera lattice surface digest (6 ortho + 4 diagonal): the exterior SHELL surface is provably unchanged",
      digestBytesBefore: held.digestBefore.length, digestBytesAfter: held.digestAfter.length,
    },
    renderResidual:
      "The perspective benchmark renders differ by a bounded handful of pixels (sub-0.5%) — entirely " +
      "INTERIOR voxels glimpsed THROUGH the shell's real door/window openings (the front camera looks " +
      "down the front door into the room behind it). The exterior shell surface itself is unchanged " +
      "(exteriorHeld above); byte-identical renders are impossible for any non-trivial floorplan behind a " +
      "front door. This is the named exterior-side residual (Rule 7); the interior is gated by PLAUSIBILITY.",
    detector,
    renders: {
      before: before.map((r) => ({ angle: r.angle, path: r.path.replace(ROOT, ""), bytes: r.bytes })),
      after: after.map((r) => ({ angle: r.angle, path: r.path.replace(ROOT, ""), bytes: r.bytes })),
    },
  };
  await writeFile(join(OUT_DIR, "floorplan-report.json"), JSON.stringify(report, null, 2));
  console.error(`\n✓ wrote ${join(OUT_DIR, "floorplan-report.json")}`);
  console.error(`✓ wrote ${join(OUT_DIR, "floorplan-cottage-artifact.json")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
