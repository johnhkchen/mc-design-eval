// E-23 TERMINAL MILESTONE (T-083-01, story S-083). The 2.5-D interaction sector proved end-to-end on ONE
// build: a hollow, accurate-looking cottage with an N×M grid infill, exercising BOTH paths and BOTH gates.
//
// THE CHAIN (one artifact, threaded through every stage — see docs/active/work/T-083-01/design.md):
//   raw cottage
//     → spray-paint  (JUDGEMENT path; T-079) — recolor the skin: concept-splat +z front, GLB-splat +x side
//     → seal         (T-084 ops) — close coherence holes (NOT the designed door; watertight stays false)
//     → hollow carve (PROGRAM path; T-080) — remove enclosed mass, exteriorHeld proof
//     → floorplan    (PROGRAM path crossing into DESIGN; T-081) — N×M grid, plausibility gate, exteriorHeld
//   ops MODEL-SCOPED (T-082): light-tier hollowable detector + strong-tier floorplan-author.
//
// BOTH GATES, one report: exterior RESEMBLANCE (front face vs concept, before/after) + interior
// PLAUSIBILITY (six constraints). The cutaway (render-only sections, src/view/cutaway.mjs) shows the hollow
// interior + the N×M grid. Multi-angle + cutaway + face before/after are handed to E-12.
//
// IMPURE EDGE only: GL renders (E-22 fixed lens), GLB decode (dwebp), TWO metered calls. The geometry
// (paint/carve/fill counts, exteriorHeld digests, gate constraints, section sets) is the PURE, unit-tested
// src/view/* cores. The runner is self-sufficient + degrades gracefully (shim/GL/dwebp absent → recorded
// gap, deterministic fallback). The exteriorHeld checks THROW — they must never silently pass.
// Run: `npm run milestone:cottage`.

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy, bareBlock } from "../../src/view/occupancy.mjs";
import { structuralRead, structuralZones } from "../../src/view/structural-read.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";
import { runTieredOp } from "../../src/model-tier.mjs";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";
import { assertArtifact } from "../../src/artifact.mjs";

import { projectSurface } from "../../src/view/surface-grid.mjs";
import { quantizeToFace } from "../../src/view/reference-quantize.mjs";
import { loadGlbSplat, resampleBlockGrid } from "../../src/view/glb-splat.mjs";
import { paintFace, mergePaints, applyPaint } from "../../src/view/face-paint.mjs";
import { allowedPalette } from "../../src/view/palette-cans.mjs";
import { faceResemblance, acceptIfCloser } from "../../src/view/face-resemblance.mjs";
import { paletteFromManifest } from "../../src/form/glb-voxel-build.mjs";
import { loadBlockTable } from "../../src/color/block-table.mjs";

import { sealRoof, sealWalls, applyDeltas, watertightCheck } from "../../src/view/surface-coherence.mjs";
import {
  markHollowable, carveArtifact, carveOccupancy, cavityReport,
  cornerPostKeys, tallColumnKeys, exteriorHeld,
} from "../../src/view/hollow-carve.mjs";
import { hollowableCore, buildHollowablePrompt, parseHollowable, TIER as HOLLOW_TIER } from "../../src/view/hollowable-mass.mjs";
import {
  storeysFromRead, generateFloorplan, applyFloorplan, gateFloorplan,
  buildFloorplanPrompt, parseFloorplanSpec, FLOORPLAN_SCHEMA, DEFAULT_MATERIALS,
  TIER as FLOORPLAN_TIER,
} from "../../src/view/floorplan.mjs";
import { roofCut, frontHalfCut } from "../../src/view/cutaway.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const RAW_PATH = join(ROOT, "benchmarks/sculpture/concept-materials/cottage/after-artifact.json");
const CONCEPT_PATH = join(ROOT, "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png");
const GLB_PATH = join(ROOT, "benchmarks/sculpture/glb/cottage.glb");
const OUT_DIR = join(ROOT, "docs/active/work/T-083-01");
const ASSETS = join(ROOT, "pr/assets");
const PLASTER = "minecraft:white_terracotta";
const DIR_TO_ANGLE = { "+z": "front", "-z": "back", "+x": "right", "-x": "left", "+y": "top", "-y": "bottom" };

// Zone→materials policy (cottage; mirrors spray-paint.mjs). BINDING: plaster ∈ "upper" ONLY.
const ZONE_MATERIALS = {
  base: ["stone_bricks", "cobblestone", "dark_oak_log"],
  upper: ["white_terracotta", "dark_oak_log", "stone_bricks"],
  roof: ["spruce_planks", "dark_oak_planks", "cobblestone", "bricks"],
};
const SURFACE_FACES = ["+x", "-x", "+z", "-z", "+y"];

/** Per-zone count of PLASTER surface voxels (the visible skin), classified by `zoneOf`. */
function surfacePlasterByZone(artifact, zoneOf) {
  const occ = artifactOccupancy(artifact);
  const seen = new Set();
  const hist = { base: 0, upper: 0, roof: 0 };
  for (const dir of SURFACE_FACES) {
    for (const row of projectSurface(occ, dir).cells) {
      for (const c of row) {
        if (!c || bareBlock(c.block) !== "white_terracotta") continue;
        const k = c.voxel.join(",");
        if (seen.has(k)) continue;
        seen.add(k);
        hist[zoneOf(c.voxel)]++;
      }
    }
  }
  return hist;
}

/** Recolor base/roof SURFACE plaster strays to the zone primary (plaster belongs to "upper" only). */
function stripOffZonePlaster(occ, zoneOf, allowedByZone) {
  const primary = { base: ZONE_MATERIALS.base[0], roof: ZONE_MATERIALS.roof[0] };
  const byKey = new Map();
  for (const dir of SURFACE_FACES) {
    for (const row of projectSurface(occ, dir).cells) {
      for (const c of row) {
        if (!c || bareBlock(c.block) !== "white_terracotta") continue;
        const zone = zoneOf(c.voxel);
        if (zone === "upper") continue;
        const to = primary[zone];
        if (!allowedByZone.get(zone)?.has(to)) continue;
        byKey.set(c.voxel.join(","), { op: "voxel", pos: [...c.voxel], block: `minecraft:${to}` });
      }
    }
  }
  return [...byKey.values()];
}

const usageOf = (raw) => ({ input_tokens: raw?.usage?.input_tokens, output_tokens: raw?.usage?.output_tokens, total_cost_usd: raw?.total_cost_usd });
const rel = (p) => p.replace(ROOT, "");

/** dwebp-backed GLB texture decoder (TRELLIS GLBs are WebP; src keeps no WebP codec). Mirrors spray-paint. */
async function decodeTexture({ data, mimeType }) {
  const { writeFile: wf, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { decodeImage } = await import("../../src/color/palette-extract.mjs");
  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    const p = join(tmpdir(), `ms-tex-${process.pid}.${mimeType === "image/png" ? "png" : "jpg"}`);
    await wf(p, Buffer.from(data));
    try { return await decodeImage(p); } finally { await rm(p, { force: true }); }
  }
  const { spawn } = await import("node:child_process");
  const inP = join(tmpdir(), `ms-tex-${process.pid}.webp`);
  const outP = join(tmpdir(), `ms-tex-${process.pid}.png`);
  await wf(inP, Buffer.from(data));
  await new Promise((res, rej) => {
    const c = spawn("dwebp", [inP, "-o", outP], { stdio: "ignore" });
    c.on("error", rej); c.on("close", (code) => (code === 0 ? res() : rej(new Error(`dwebp exited ${code}`))));
  });
  try { return await decodeImage(outP); } finally { await rm(inP, { force: true }); await rm(outP, { force: true }); }
}

/** Final material per voxel (last-write-wins), counted by bare id. */
function materialCounts(artifact) {
  const occ = artifactOccupancy(artifact);
  const counts = {};
  for (const blk of occ.cells.values()) { const b = bareBlock(blk); counts[b] = (counts[b] || 0) + 1; }
  return counts;
}

/** Best-effort GL render of a face → decoded RGBA + optional resemblance, or {error}. */
async function tryRenderFace(artifact, dir, label, refImg, blockTable) {
  try {
    const { decodeImage } = await import("../../src/color/palette-extract.mjs");
    const [r] = await renderViews(artifact, [DIR_TO_ANGLE[dir] ?? "front"], { outDir: OUT_DIR, label: () => label });
    const img = await decodeImage(r.path);
    return { path: rel(r.path), score: refImg ? faceResemblance(img, refImg, blockTable, { artifact }) : null };
  } catch (e) { return { error: e.message }; }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  if (!existsSync(RAW_PATH)) throw new Error(`${RAW_PATH} absent`);
  const blockTable = loadBlockTable();

  // ===== STAGE 1 — SEAL (coherence holes only; the door survives) — BEFORE paint (T-079-02 AC #3) ==
  // Seal FIRST so paint never lands on a stray (no floating painted blocks) and runs on a complete skin.
  const raw = JSON.parse(await readFile(RAW_PATH, "utf8"));
  const manifest = raw.palette?.manifest ?? [];
  const allowed = allowedPalette(raw);
  const palette = paletteFromManifest(manifest);
  const rawOcc = artifactOccupancy(raw);
  const plasterBefore = materialCounts(raw).white_terracotta ?? 0;
  console.error(`Raw cottage: ${raw.placements.length} placements, ${rawOcc.size} voxels; plaster(${PLASTER}) before=${plasterBefore}`);

  const sealed = applyDeltas(raw, [...sealRoof(rawOcc).placements, ...sealWalls(rawOcc).placements]);
  const sealedOcc = artifactOccupancy(sealed);
  const wtSealed = watertightCheck(sealedOcc);
  console.error(`Sealed: ${raw.placements.length}→${sealed.placements.length} placements; watertight=${wtSealed.watertight} (door/window openings retained).`);

  // ===== STAGE 2 — SPRAY-PAINT (judgement path) on the SEALED skin: splat ∩ structural-zone ========
  const { zoneOf, storeyDivide } = structuralZones(sealedOcc);
  const allowedByZone = new Map(Object.entries(ZONE_MATERIALS).map(([z, mats]) => [z, new Set(mats.filter((b) => allowed.has(b)))]));
  const frontGrid = projectSurface(sealedOcc, "+z");
  const conceptRes = await quantizeToFace(CONCEPT_PATH, frontGrid, { manifest });
  const frontTarget = resampleBlockGrid(conceptRes.grid, conceptRes.n, conceptRes.m, frontGrid.n, frontGrid.m).grid;
  const frontPass = paintFace(sealedOcc, "+z", frontTarget, { allowed, source: "concept", zoneOf, allowedByZone });
  let sidePass = { dir: "+x", source: "glb", placements: [], painted: 0, skipped: 0, offPalette: 0, zoneRejected: 0 };
  try {
    const sideGrid = projectSurface(sealedOcc, "+x");
    const sideSplat = await loadGlbSplat(GLB_PATH, sideGrid, "+x", { palette, decodeTexture });
    sidePass = paintFace(sealedOcc, "+x", sideSplat.grid, { allowed, source: "glb", zoneOf, allowedByZone });
    console.error(`Side GLB-splat: ${sidePass.painted} cells (zoneRejected ${sidePass.zoneRejected}).`);
  } catch (e) { console.error(`Side GLB-splat skipped: ${e.message}`); }

  // FACE before/after for the E-12 handoff + the resemblance gate (front vs concept).
  const conceptImg = await (async () => { try { return await (await import("../../src/color/palette-extract.mjs")).decodeImage(CONCEPT_PATH); } catch { return null; } })();
  const faceBefore = await tryRenderFace(sealed, "+z", "face-front-before", conceptImg, blockTable);
  const merged = mergePaints([sidePass, frontPass].filter((p) => p.painted > 0), { priority: ["concept", "glb"] });
  const stripPlacements = stripOffZonePlaster(sealedOcc, zoneOf, allowedByZone);
  const painted = applyPaint(sealed, [...stripPlacements, ...merged.placements]);
  const faceAfter = await tryRenderFace(painted, "+z", "face-front-after", conceptImg, blockTable);
  const resGate = acceptIfCloser({ before: faceBefore.score?.score ?? null, after: faceAfter.score?.score ?? null });
  const plasterAfter = materialCounts(painted).white_terracotta ?? 0;
  const plasterReversed = plasterAfter > plasterBefore && plasterAfter > 8;
  // The structural guard (T-079-02 AC #4): plaster confined to the upper storey on the visible skin.
  const histMasked = surfacePlasterByZone(painted, zoneOf);
  console.error(`Spray-paint: front ${frontPass.painted} (zoneRejected ${frontPass.zoneRejected}) + side ${sidePass.painted} cells; plaster ${plasterBefore}→${plasterAfter} (${plasterReversed ? "REVERSED" : "not reversed"}); surface plaster by zone ${JSON.stringify(histMasked)}; face resemblance ${faceBefore.score?.score ?? "?"}→${faceAfter.score?.score ?? "?"}`);
  if (histMasked.base !== 0 || histMasked.roof !== 0) {
    throw new Error(`zone violation: plaster on base/roof surface (base=${histMasked.base}, roof=${histMasked.roof}) — the splat∩zone mask failed`);
  }

  // The painted, sealed build feeds the hollow stage directly (sealing already happened).
  const paintedOcc = artifactOccupancy(painted);

  // ===== STAGE 3 — HOLLOW CARVE (program path), metered LIGHT detector =============================
  // Operates on the painted skin (paint is a recolor, so geometry == the sealed shell).
  const read = structuralRead(paintedOcc);
  const core = hollowableCore(paintedOcc);
  const before = await renderViews(painted, ["threeQuarter"], { outDir: OUT_DIR, label: () => "hollow-probe-3q" }).catch(() => []);
  let hollowDetector = null;
  try {
    if (!before.length) throw new Error("no probe render (GL unavailable)");
    const image = await readFile(before[0].path);
    console.error(`\n▶ hollowable-mass-detector — tier=${HOLLOW_TIER}, view=threeQuarter`);
    const { text, raw: rawR, model } = await runTieredOp({ tier: HOLLOW_TIER, prompt: buildHollowablePrompt(read, core), images: [image], invoke: requestTextWithImage });
    let parsed = null, parseError = null;
    try { parsed = parseHollowable(text); } catch (e) { parseError = e.message; }
    console.error(`  ✓ model=${model}${parsed ? ` → ${JSON.stringify(parsed).slice(0, 160)}` : ` (parse failed: ${parseError})`}`);
    hollowDetector = { op: "hollowable-mass-detector", tier: HOLLOW_TIER, model, usage: usageOf(rawR), parsed, parseError };
  } catch (e) {
    console.error(`  detector unavailable: ${e.message} — falling back to the geometric mark.`);
    hollowDetector = { op: "hollowable-mass-detector", error: e.message, parsed: null };
  }
  const keep = new Set([...cornerPostKeys(paintedOcc), ...tallColumnKeys(paintedOcc, { minSpanFrac: 0.9 })]);
  const blockers = hollowDetector?.parsed?.blockers ?? [];
  const useDet = hollowDetector?.parsed?.hollowable === true && blockers.length === 0;
  const regions = useDet ? hollowDetector.parsed.regions : undefined;
  const inset = useDet && hollowDetector.parsed.regions?.[0]?.inset ? hollowDetector.parsed.regions[0].inset : 1;
  const mark = markHollowable(paintedOcc, { keep, regions, inset });
  const hollow = carveArtifact(painted, mark.remove);
  const hollowOcc = carveOccupancy(paintedOcc, mark.remove);
  const carveHeld = exteriorHeld(paintedOcc, hollowOcc);
  const cavity = cavityReport(paintedOcc, mark.remove);
  console.error(`Hollow: ${mark.enclosed} enclosed, ${mark.protectedCount} protected, ${mark.removeCount} removed; cavity ${cavity.before}→${cavity.after}; exteriorHeld=${carveHeld.held}.`);
  if (!carveHeld.held) throw new Error("carve exterior-held FAILED — the hollow changed a front-most surface voxel.");

  // ===== STAGE 4 — FLOORPLAN FILL (program → design), metered STRONG author ========================
  const hRead = structuralRead(hollowOcc);
  const storeys = storeysFromRead(hRead);
  const planBefore = await renderViews(hollow, ["top", "front"], { outDir: OUT_DIR, label: (a) => `fp-probe-${a}` }).catch(() => []);
  let fpDetector = null, spec = null;
  try {
    if (planBefore.length < 2) throw new Error("no plan/elevation render (GL unavailable)");
    const [plan, elevation] = [await readFile(planBefore[0].path), await readFile(planBefore[1].path)];
    console.error(`\n▶ floorplan-author — tier=${FLOORPLAN_TIER}, views=top+front`);
    const { text, raw: rawR, model } = await runTieredOp({ tier: FLOORPLAN_TIER, prompt: buildFloorplanPrompt(hRead, storeys, hRead.footprint, manifest), images: [plan, elevation], invoke: requestTextWithImage });
    let parseError = null;
    try { spec = parseFloorplanSpec(text, { manifest }); } catch (e) { parseError = e.message; }
    console.error(`  ✓ model=${model}${spec ? ` → ${JSON.stringify(spec)}` : ` (parse failed: ${parseError})`}`);
    fpDetector = { op: "floorplan-author", tier: FLOORPLAN_TIER, model, usage: usageOf(rawR), spec, parseError };
  } catch (e) {
    console.error(`  author unavailable: ${e.message} — falling back to a deterministic 2×2 spec.`);
    fpDetector = { op: "floorplan-author", error: e.message, spec: null };
  }
  if (!spec) spec = { schema: FLOORPLAN_SCHEMA, rows: 2, cols: 2, materials: DEFAULT_MATERIALS, doorPolicy: "spanning", frontDoor: null };
  const { plan: fpPlan, placements: fpPlacements } = generateFloorplan(hollowOcc, hRead, spec);
  const filled = applyFloorplan(hollow, fpPlacements);
  const filledOcc = artifactOccupancy(filled);
  const plausGate = gateFloorplan(hollowOcc, hRead, fpPlan);
  const fillHeld = exteriorHeld(hollowOcc, filledOcc);
  console.error(`Floorplan: ${spec.rows}×${spec.cols}, ${fpPlan.grid.rooms.length} rooms/storey, ${fpPlacements.length} placements, ${fpPlan.storeys.reduce((n, s) => n + s.doors.length, 0)} doorways; gate=${plausGate.pass ? "PASS" : "FAIL"} (residual: ${plausGate.residual ?? "none"}); exteriorHeld=${fillHeld.held}.`);
  if (!fillHeld.held) throw new Error("fill exterior-held FAILED — the floorplan changed a front-most surface voxel.");

  // The ONE finished milestone build — exterior-accurate AND hollow AND room-divided. AJV-valid.
  assertArtifact(filled);
  await writeFile(join(OUT_DIR, "milestone-cottage-artifact.json"), JSON.stringify(filled, null, 2));

  // ===== STAGE 5 — RENDERS: multi-angle (real build) + render-only cutaway sections ================
  console.error("\nRendering multi-angle + cutaway (render-only sections)…");
  const multi = await renderViews(filled, ["front", "+x+z", "threeQuarter", "bottom"], { outDir: OUT_DIR, label: (a) => `milestone-${a}` }).catch((e) => { console.error(`  multi-angle GL unavailable: ${e.message}`); return []; });
  // Cutaway: clip a THROWAWAY copy of the real build (Rule 3 — the real artifact is untouched).
  const planSection = carveArtifact(filled, roofCut(filledOcc, hRead));
  const crossSection = carveArtifact(filled, frontHalfCut(filledOcc));
  const cutPlan = await renderViews(planSection, ["top"], { outDir: OUT_DIR, label: () => "cutaway-plan" }).catch(() => []);
  const cutSection = await renderViews(crossSection, ["threeQuarter"], { outDir: OUT_DIR, label: () => "cutaway-section" }).catch(() => []);
  const renderPath = (arr, i = 0) => (arr[i] ? rel(arr[i].path) : null);

  // ===== E-12 handoff assets ======================================================================
  await mkdir(ASSETS, { recursive: true });
  const copyIf = async (src, dst) => { if (src && existsSync(join(ROOT, src))) await copyFile(join(ROOT, src), join(ASSETS, dst)); };
  await copyIf(faceBefore.path, "cottage-face-before.png");
  await copyIf(faceAfter.path, "cottage-face-after.png");
  await montage([renderPath(multi, 0), renderPath(multi, 1), renderPath(multi, 2)], join(ASSETS, "cottage-multi-angle.png"));
  await montage([renderPath(cutPlan), renderPath(cutSection)], join(ASSETS, "cottage-cutaway.png"));

  // ===== the milestone report (BOTH gates) =========================================================
  const report = {
    schema: "hollow-cottage-milestone/v1",
    subject: "cottage",
    chain: ["raw", "seal", "spray-paint", "hollow-carve", "floorplan-fill"],
    placements: { raw: raw.placements.length, painted: painted.placements.length, sealed: sealed.placements.length, hollow: hollow.placements.length, filled: filled.placements.length },
    occupancy: { voxels: rawOcc.size, dims: rawOcc.dims },
    gates: {
      exteriorResemblance: {
        path: "judgement", reference: "concept (+z front face)",
        plaster: { block: PLASTER, before: plasterBefore, after: plasterAfter, reversed: plasterReversed },
        zones: { storeyDivide, materials: ZONE_MATERIALS, histogram: { masked: histMasked }, // surface plaster by zone after the T-079-02 fix
          note: "splat ∩ structural-zone (T-079-02): plaster confined to the upper storey (base 0, roof 0), sealed BEFORE paint." },
        face: { before: faceBefore, after: faceAfter, gate: resGate, blind: resGate.before == null },
        residual: "E-22 cottage was `drifted`, gap = material zoning @ upper-story walls; the band-masked spray-paint restores that band " +
          "(plaster " + plasterBefore + "→" + plasterAfter + ", confined to the upper storey by structuralZones), so the face is no longer the gap. The remaining exterior residual is " +
          "the +x SIDE: the concept never shows it, so the GLB splat is accepted by-construction (no per-face resemblance delta).",
      },
      interiorPlausibility: {
        path: "program-into-design", reference: "none (interior is invention)",
        pass: plausGate.pass, constraints: plausGate.constraints, residual: plausGate.residual,
      },
    },
    hollow: { enclosed: mark.enclosed, protected: mark.protectedCount, removed: mark.removeCount, cavity, exteriorHeld: { held: carveHeld.held, digestBytes: carveHeld.digestBefore.length }, watertight: wtSealed },
    floorplan: { rows: spec.rows, cols: spec.cols, roomsPerStorey: fpPlan.grid.rooms.length, placements: fpPlacements.length, storeys: fpPlan.storeys.map((s) => ({ index: s.index, floorY: s.floorY, rooms: s.rooms.length, doors: s.doors.length })), exteriorHeld: { held: fillHeld.held, digestBytes: fillHeld.digestBefore.length } },
    structuralRead: { footprint: { width: read.footprint.width, depth: read.footprint.depth, area: read.footprint.area }, floorLines: read.storeyBands.floorLines, storeys: storeys.length },
    modelScoped: { light: hollowDetector, strong: fpDetector },
    renders: {
      multiAngle: multi.map((r) => ({ angle: r.angle, path: rel(r.path) })),
      cutawayPlan: renderPath(cutPlan), cutawaySection: renderPath(cutSection),
      faceBefore: faceBefore.path ?? null, faceAfter: faceAfter.path ?? null,
      note: "Cutaway renders are RENDER-ONLY sections of the real build (src/view/cutaway.mjs, flatten-by-exclusion); " +
        "the real artifact is unchanged and carries the exteriorHeld proofs above (Rule 3). 'bottom' is the from-below angle.",
    },
  };
  await writeFile(join(OUT_DIR, "milestone-report.json"), JSON.stringify(report, null, 2));
  console.error(`\n✓ wrote ${join(OUT_DIR, "milestone-report.json")} + milestone-cottage-artifact.json`);
  console.error(`✓ E-12 assets → ${ASSETS}`);
}

/** Horizontal strip of PNGs → out via `magick +append` (font-free; best-effort: skips missing inputs /
 *  absent magick). +append (not montage) avoids montage's default filename labels, which need a font. */
async function montage(paths, out) {
  const inputs = paths.filter((p) => p && existsSync(join(ROOT, p))).map((p) => join(ROOT, p));
  if (!inputs.length) { console.error(`  montage ${out}: no inputs — skipped.`); return; }
  try {
    const { spawn } = await import("node:child_process");
    await new Promise((res, rej) => {
      const c = spawn("magick", [...inputs, "-background", "white", "+append", out], { stdio: "ignore" });
      c.on("error", rej); c.on("close", (code) => (code === 0 ? res() : rej(new Error(`magick +append exited ${code}`))));
    });
    console.error(`  ✓ montage → ${rel(out)}`);
  } catch (e) { console.error(`  montage ${rel(out)} skipped: ${e.message}`); }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
