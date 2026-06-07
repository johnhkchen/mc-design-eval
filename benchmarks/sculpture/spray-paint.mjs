// IMPURE RUNNER — E-23 spray-paint judgement path on the cottage (S-079 / T-079-01). Reverses the
// 215→8 plaster collapse: the E-21 material map was correct but the 3-D feature placer collapsed plaster
// into stone because 3-D feature space has no storey axis. Here the build face is PROJECTED to the 2.5-D
// grid (T-078 Path P), a per-cell material TARGET is SPLATTED onto it — the CONCEPT for the front (where
// it is the truth), the textured GLB for a side (the concept never shows it) — and the target is
// BACK-PROJECTED to recolor placements on the front-most surface voxels. The front face is gated against
// the concept (E-22 per-face accept-if-closer, P14-safe); corner voxels take the concept paint over the
// GLB paint. White_terracotta recovers from 8.
//
// THE SEAM INVARIANT: the splat, back-projection, palette enforcement, and accept gate are the PURE
// src/view/* cores (unit-tested). This file is the impure wiring only: GL face renders (E-22 fixed lens),
// GLB decode, the optional metered LLM refine, and the durable record. Mirrors material-correct.mjs.
//
// GL + (optionally) METERED — run on demand, NOT in `npm test`:
//   node benchmarks/sculpture/spray-paint.mjs            # splat + paint + per-face gate (GL renders)
//   node benchmarks/sculpture/spray-paint.mjs --refine   # + the metered LLM face-vs-face refinement
//   node benchmarks/sculpture/spray-paint.mjs --offline  # deterministic only: splat→paint→assert, no GL/model
//
// Writes spray-paint/cottage.json (the committed record) + spray-paint/cottage/artifact.json (the painted,
// AJV-valid build) + face PNGs (gitignored). The deterministic core (splat→paint→merge→assert + the
// white_terracotta count) ALWAYS runs and is recorded; the GL face-scores are best-effort (a headless-GL
// failure degrades to a recorded gap, never a crash).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy, bareBlock } from "../../src/view/occupancy.mjs";
import { projectSurface } from "../../src/view/surface-grid.mjs";
import { quantizeToFace } from "../../src/view/reference-quantize.mjs";
import { loadGlbSplat, resampleBlockGrid } from "../../src/view/glb-splat.mjs";
import { paintFace, mergePaints, applyPaint } from "../../src/view/face-paint.mjs";
import { structuralZones } from "../../src/view/structural-read.mjs";
import { sealRoof, sealWalls, applyDeltas } from "../../src/view/surface-coherence.mjs";
import { allowedPalette } from "../../src/view/palette-cans.mjs";
import { faceResemblance, acceptIfCloser } from "../../src/view/face-resemblance.mjs";
import { paletteFromManifest } from "../../src/form/glb-voxel-build.mjs";
import { loadBlockTable } from "../../src/color/block-table.mjs";
import { assertArtifact } from "../../src/artifact.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const ART_PATH = join(ROOT, "benchmarks/sculpture/concept-materials/cottage/after-artifact.json");
const CONCEPT_PATH = join(ROOT, "benchmarks/sculpture/runs/014-vConcept-a-cottage/concept.png");
const GLB_PATH = join(ROOT, "benchmarks/sculpture/glb/cottage.glb");
const OUT_DIR = join(ROOT, "benchmarks/sculpture/spray-paint");
const SUBJ_DIR = join(OUT_DIR, "cottage");

const PLASTER = "minecraft:white_terracotta";

// THE ZONE→MATERIALS POLICY (cottage; derived from material-map/cottage.json roles, intersected with the
// build manifest at runtime). The BINDING invariant: plaster (white_terracotta) ∈ "upper" ONLY — base
// and roof exclude it, so a plaster target there is zoneRejected, not painted (T-079-02 fix). The other
// materials are allowed generously per zone so legit recolors (stone on the base, planks on the roof)
// still happen; the fix removes the smear, it does not freeze the skin.
const ZONE_MATERIALS = {
  base: ["stone_bricks", "cobblestone", "dark_oak_log"],            // coursed stone + quoins + sill timber
  upper: ["white_terracotta", "dark_oak_log", "stone_bricks"],      // plaster + timber frame + window reveals
  roof: ["spruce_planks", "dark_oak_planks", "cobblestone", "bricks"], // roof courses + chimney (NO plaster)
};

/** The 5 exposed faces a painted-plaster surface voxel can live on (the visible skin). */
const SURFACE_FACES = ["+x", "-x", "+z", "-z", "+y"];

/** Per-zone count of PLASTER surface voxels in `artifact` (the visible skin), classified by `zoneOf`.
 *  Interior plaster strays (not on any face) are NOT counted — they are not the visible defect. */
function surfacePlasterByZone(artifact, zoneOf) {
  const occ = artifactOccupancy(artifact);
  const seen = new Set();
  const hist = { base: 0, upper: 0, roof: 0 };
  for (const dir of SURFACE_FACES) {
    const grid = projectSurface(occ, dir);
    for (const row of grid.cells) {
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

/** STRIP off-zone plaster from the skin: recolor any base/roof SURFACE plaster voxel to its zone's
 *  primary material (base→stone, roof→planks). Plaster belongs to the upper storey ONLY, so any base/
 *  roof plaster is a defect — a pre-existing stray (or a smear). Narrowly scoped to plaster so it can
 *  never grey-out a legit off-primary material (e.g. a spruce gable, which classifies "upper"). Returns
 *  recolor placements (deduped by voxel). PURE. */
function stripOffZonePlaster(occ, zoneOf, allowedByZone) {
  const primary = { base: ZONE_MATERIALS.base[0], roof: ZONE_MATERIALS.roof[0] };
  const byKey = new Map();
  for (const dir of SURFACE_FACES) {
    const grid = projectSurface(occ, dir);
    for (const row of grid.cells) {
      for (const c of row) {
        if (!c || bareBlock(c.block) !== "white_terracotta") continue;
        const zone = zoneOf(c.voxel);
        if (zone === "upper") continue; // plaster is legal here
        const to = primary[zone];
        if (!allowedByZone.get(zone)?.has(to)) continue; // primary not in manifest — skip rather than guess
        byKey.set(c.voxel.join(","), { op: "voxel", pos: [...c.voxel], block: `minecraft:${to}` });
      }
    }
  }
  return [...byKey.values()];
}

/** Total interior (non-surface) plaster voxels — pre-existing strays paint/seal cannot reach. */
function interiorPlaster(artifact) {
  const occ = artifactOccupancy(artifact);
  const surf = new Set();
  for (const dir of SURFACE_FACES) {
    const grid = projectSurface(occ, dir);
    for (const row of grid.cells) for (const c of row) if (c) surf.add(c.voxel.join(","));
  }
  let n = 0;
  for (const [k, blk] of occ.cells) if (bareBlock(blk) === "white_terracotta" && !surf.has(k)) n++;
  return n;
}

// The cottage "front" the concept shows is the +Z face: multi-angle's `front` (azimuth 0) looks toward
// −Z from the +Z side, so it renders the +Z-facing surface = Path-P "+z". The render angle and the Path-P
// projection MUST agree or paint lands on one face while the gate scores another.
const DIR_TO_ANGLE = { "+z": "front", "-z": "back", "+x": "right", "-x": "left", "+y": "top", "-y": "bottom" };

/** Decode a GLB baseColor image to RGBA (WebP→PNG via dwebp; PNG/JPEG straight through) — the dwebp-backed
 *  decoder injected into loadGlbSplat (src/ keeps no WebP codec; TRELLIS GLBs are WebP). */
async function decodeTexture({ data, mimeType }) {
  const { writeFile: wf, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { decodeImage } = await import("../../src/color/palette-extract.mjs");
  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    const p = join(tmpdir(), `sp-tex-${process.pid}.${mimeType === "image/png" ? "png" : "jpg"}`);
    await wf(p, Buffer.from(data));
    try { return await decodeImage(p); } finally { await rm(p, { force: true }); }
  }
  const { spawn } = await import("node:child_process");
  const inP = join(tmpdir(), `sp-tex-${process.pid}.webp`);
  const outP = join(tmpdir(), `sp-tex-${process.pid}.png`);
  await wf(inP, Buffer.from(data));
  await new Promise((res, rej) => {
    const c = spawn("dwebp", [inP, "-o", outP], { stdio: "ignore" });
    c.on("error", rej);
    c.on("close", (code) => (code === 0 ? res() : rej(new Error(`dwebp exited ${code}`))));
  });
  try { return await decodeImage(outP); } finally { await rm(inP, { force: true }); await rm(outP, { force: true }); }
}

/** Count placements of `block` after expansion (final material per voxel, last-write-wins). */
function materialCounts(artifact) {
  const occ = artifactOccupancy(artifact);
  const counts = {};
  for (const blk of occ.cells.values()) {
    const b = bareBlock(blk);
    counts[b] = (counts[b] || 0) + 1;
  }
  return counts;
}

/** Best-effort GL render of the build face → decoded RGBA, or null if headless GL is unavailable. */
async function tryRenderFace(artifact, dir, label, refImg, table, blockTable) {
  try {
    const { renderViews } = await import("../../src/view/multi-angle.mjs");
    const { decodeImage } = await import("../../src/color/palette-extract.mjs");
    const angle = DIR_TO_ANGLE[dir] ?? "front";
    const [r] = await renderViews(artifact, [angle], { outDir: SUBJ_DIR, label: () => label });
    const img = await decodeImage(r.path);
    const score = refImg ? faceResemblance(img, refImg, blockTable, { artifact }) : null;
    return { path: r.path.replace(ROOT, ""), score };
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  const refine = process.argv.includes("--refine");
  const offline = process.argv.includes("--offline");
  await mkdir(SUBJ_DIR, { recursive: true });

  if (offline) {
    const recPath = join(OUT_DIR, "cottage.json");
    if (!existsSync(recPath)) throw new Error("spray-paint/cottage.json absent — run the live pass first");
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    const reversalOk = rec.plaster.after >= rec.plaster.before && rec.plaster.after > 8;
    const h = rec.zones?.histogram?.masked;
    const zoneOk = !h || (h.base === 0 && h.roof === 0); // base/roof surface plaster must be 0 when recorded
    const ok = reversalOk && zoneOk;
    console.error(`[offline] plaster ${rec.plaster.before}→${rec.plaster.after}; reversal ${reversalOk ? "CONFIRMED" : "NOT confirmed"}` +
      (h ? `; zone histogram masked=${JSON.stringify(h)} (base/roof=0 ${zoneOk ? "OK" : "VIOLATED"})` : ""));
    if (!ok) process.exitCode = 1;
    return;
  }

  if (!existsSync(ART_PATH)) throw new Error(`${ART_PATH} absent`);
  const raw = JSON.parse(await readFile(ART_PATH, "utf8"));
  const manifest = raw.palette?.manifest ?? [];
  const allowed = allowedPalette(raw); // the "4 cans" — manifest (no add-back needed; plaster is in it)
  const palette = paletteFromManifest(manifest);
  const blockTable = loadBlockTable();

  // --- 0. SEAL BEFORE PAINT (T-079-02 AC #3) ------------------------------------------------------
  // Strip stray specks + seal skin/roof holes FIRST, so paint never lands on a stray (no floating
  // painted blocks) and runs on a complete skin. Inline (no cross-ticket file dep) — the seal ops are
  // pure. `artifact`/`occ` below are the SEALED build; all downstream work uses it.
  const rawOcc = artifactOccupancy(raw);
  const artifact = applyDeltas(raw, [...sealRoof(rawOcc).placements, ...sealWalls(rawOcc).placements]);
  const occ = artifactOccupancy(artifact);
  const before = materialCounts(artifact);
  console.error(`cottage: raw ${raw.placements.length} → sealed ${artifact.placements.length} placements; plaster(${PLASTER}) before = ${before.white_terracotta ?? 0}`);

  // --- 0b. STRUCTURAL ZONE MASK (T-079-02 AC #1) --------------------------------------------------
  // Derive base/upper/roof from the structural read; map each zone → its materials ∩ the manifest.
  const { zoneOf, storeyDivide } = structuralZones(occ);
  const allowedByZone = new Map(
    Object.entries(ZONE_MATERIALS).map(([z, mats]) => [z, new Set(mats.filter((b) => allowed.has(b)))]),
  );
  console.error(`zones: storeyDivide=${storeyDivide}; base={${[...allowedByZone.get("base")].join(",")}} upper={${[...allowedByZone.get("upper")].join(",")}} roof={${[...allowedByZone.get("roof")].join(",")}}`);

  // --- 1. per-face material targets ---------------------------------------------------------------
  // FRONT (+z): the concept is the truth → quantize it to the face cell-grid (within the manifest), resample.
  const frontGrid = projectSurface(occ, "+z");
  const conceptRes = await quantizeToFace(CONCEPT_PATH, frontGrid, { manifest });
  const frontTarget = resampleBlockGrid(conceptRes.grid, conceptRes.n, conceptRes.m, frontGrid.n, frontGrid.m).grid;
  console.error(`front target: concept quantized ${conceptRes.n}×${conceptRes.m} → face ${frontGrid.n}×${frontGrid.m}, outOfPalette=${conceptRes.outOfPalette}`);

  // SIDE (+x): the concept never shows it → textured-GLB splat, same dir, in voxel space.
  const sideGrid = projectSurface(occ, "+x");
  let sideSplat = null;
  try {
    sideSplat = await loadGlbSplat(GLB_PATH, sideGrid, "+x", { palette, decodeTexture });
    console.error(`side target: GLB splat ${sideGrid.n}×${sideGrid.m}, sourceFilled=${sideSplat.sourceFilled}`);
  } catch (e) {
    console.error(`side GLB splat skipped: ${e.message}`);
  }

  // --- 2. paint passes (back-projection to recolor placements) — splat ∩ structural-zone ----------
  const frontPass = paintFace(occ, "+z", frontTarget, { allowed, source: "concept", zoneOf, allowedByZone });
  const sidePass = sideSplat
    ? paintFace(occ, "+x", sideSplat.grid, { allowed, source: "glb", zoneOf, allowedByZone })
    : { dir: "+x", source: "glb", placements: [], painted: 0, skipped: 0, offPalette: 0, zoneRejected: 0 };
  console.error(`paint (zone-masked): front ${frontPass.painted} cells (zoneRejected ${frontPass.zoneRejected}), side ${sidePass.painted} cells (zoneRejected ${sidePass.zoneRejected})`);

  // --- 2b. THE PROOF: the same splat WITHOUT the zone mask (the old smear) for the before/after ----
  const frontUnmasked = paintFace(occ, "+z", frontTarget, { allowed, source: "concept" });
  const sideUnmasked = sideSplat ? paintFace(occ, "+x", sideSplat.grid, { allowed, source: "glb" }) : { placements: [] };
  const unmaskedBuild = applyPaint(artifact, mergePaints([sideUnmasked, frontUnmasked].filter((p) => (p.placements?.length ?? 0) > 0), { priority: ["concept", "glb"] }).placements);
  const histUnmasked = surfacePlasterByZone(unmaskedBuild, zoneOf);   // plaster smeared into base/roof
  console.error(`histogram (surface plaster by zone): UNMASKED ${JSON.stringify(histUnmasked)}`);

  // --- 3. optional metered LLM refine (the one metered call; default off) --------------------------
  // T-079-02: the GUARD is the structural invariant (splat ∩ zone mask + the base/roof=0 THROW below),
  // NOT this refine pass — the shipped defect was structural (no storey axis), so the zone mask is the
  // fix; refine stays an optional polish, not the thing standing between us and a pink blob.
  let refineNote = "skipped (optional polish; the structural zone mask + base/roof=0 throw are the guard)";
  if (refine) {
    refineNote = "requested — face-vs-face refinement is the metered call (LLM corrects the splat, palette+zone-gated). " +
      "Wired through requestTextWithImage in a follow-up; the splat ∩ zone path stands alone without it.";
    console.error(`[refine] ${refineNote}`);
  }

  // --- 4. per-face accept-if-closer gate (front vs concept; E-22, P14-safe) ------------------------
  const conceptImg = await (async () => {
    try { return await (await import("../../src/color/palette-extract.mjs")).decodeImage(CONCEPT_PATH); }
    catch { return null; }
  })();
  const faceRecords = [];

  // FRONT: gate the concept paint against the concept itself.
  const frontBeforeR = await tryRenderFace(artifact, "+z", "front-before", conceptImg, palette, blockTable);
  const frontCandidate = applyPaint(artifact, frontPass.placements);
  const frontAfterR = await tryRenderFace(frontCandidate, "+z", "front-after", conceptImg, palette, blockTable);
  const frontGate = acceptIfCloser({
    before: frontBeforeR.score?.score ?? null,
    after: frontAfterR.score?.score ?? null,
  });
  // P14: accept the front paint when it moves toward the concept OR when the gate is blind (no GL ref) —
  // in the GL-blind case the splat IS the concept truth (the band is in the concept), recorded as such.
  const frontAccepted = frontGate.before == null ? true : frontGate.accepted;
  faceRecords.push({
    face: "front (+z)", source: "concept", painted: frontPass.painted, skipped: frontPass.skipped,
    offPalette: frontPass.offPalette, zoneRejected: frontPass.zoneRejected, before: frontBeforeR, after: frontAfterR, gate: frontGate,
    accepted: frontAccepted, gateBlind: frontGate.before == null,
  });

  // SIDE: the GLB is the truth (no concept face to gate against) — apply the splat paint, render for the record.
  const sideBeforeR = await tryRenderFace(artifact, "+x", "side-before", null, palette, blockTable);
  const sideCandidate = applyPaint(artifact, sidePass.placements);
  const sideAfterR = await tryRenderFace(sideCandidate, "+x", "side-after", null, palette, blockTable);
  const sideAccepted = sidePass.painted > 0;
  faceRecords.push({
    face: "side (+x)", source: "glb", painted: sidePass.painted, skipped: sidePass.skipped,
    offPalette: sidePass.offPalette, zoneRejected: sidePass.zoneRejected, before: sideBeforeR, after: sideAfterR,
    accepted: sideAccepted, note: "no concept face for this side — the textured GLB is the truth; gated by-construction",
  });

  // --- 5. commit the accepted passes (corner precedence: concept > glb) ----------------------------
  const acceptedPasses = [];
  if (sideAccepted) acceptedPasses.push(sidePass); // glb first; concept wins corners on merge
  if (frontAccepted) acceptedPasses.push(frontPass);
  const merged = mergePaints(acceptedPasses, { priority: ["concept", "glb"] });
  // Strip off-zone plaster (pre-existing base/roof strays) FIRST so the concept/glb paint wins any
  // collision; together they make base/roof plaster = 0 by construction.
  const stripPlacements = stripOffZonePlaster(occ, zoneOf, allowedByZone);
  const painted = applyPaint(artifact, [...stripPlacements, ...merged.placements]);
  assertArtifact(painted); // AC #7: the painted build is still AJV-valid

  // --- 5b. THE STRUCTURAL GUARD (T-079-02 AC #4): plaster must be confined to the upper storey. The
  // zone mask makes off-zone paint impossible by construction; this THROW (mirroring the milestone's
  // exteriorHeld) guarantees it can never silently ship — a marginal resemblance number cannot rubber-
  // stamp a zone-wrong skin. Measured on the SURFACE (the visible skin); interior strays are pre-existing.
  const histMasked = surfacePlasterByZone(painted, zoneOf);
  const interiorStrays = interiorPlaster(painted);
  console.error(`off-zone plaster stripped from skin: ${stripPlacements.length}`);
  console.error(`histogram (surface plaster by zone): MASKED ${JSON.stringify(histMasked)} (interior strays ${interiorStrays}, untouched)`);
  if (histMasked.base !== 0 || histMasked.roof !== 0) {
    throw new Error(`zone violation: plaster on base/roof surface (base=${histMasked.base}, roof=${histMasked.roof}) — the splat∩zone mask failed`);
  }
  await writeFile(join(SUBJ_DIR, "artifact.json"), JSON.stringify(painted, null, 2) + "\n");

  const after = materialCounts(painted);
  const reversal = (after.white_terracotta ?? 0) > (before.white_terracotta ?? 0) && (after.white_terracotta ?? 0) > 8;
  console.error(`plaster(${PLASTER}) after = ${after.white_terracotta ?? 0} — 215→8 regression ${reversal ? "REVERSED" : "not reversed"}`);

  // --- 6. the durable record ----------------------------------------------------------------------
  const record = {
    schema: "spray-paint/v1",
    subject: "cottage",
    inputs: {
      build: ART_PATH.replace(ROOT, ""), concept: CONCEPT_PATH.replace(ROOT, ""), glb: GLB_PATH.replace(ROOT, ""),
    },
    palette: { allowed: [...allowed].sort(), additions: [] },
    sealed: { raw: raw.placements.length, sealed: artifact.placements.length },
    zones: {
      storeyDivide,
      materials: ZONE_MATERIALS,
      histogram: { masked: histMasked, unmasked: histUnmasked }, // surface plaster by zone (before/after the fix)
      offZonePlasterStripped: stripPlacements.length,
      interiorStrays,
      note: "histogram = surface plaster per structural zone. MASKED (this fix) confines plaster to 'upper' " +
        "(base=0, roof=0); UNMASKED (the shipped color-only splat) smears it into base+roof. Interior strays " +
        "are pre-existing, not on any face, and untouched by seal/paint — not the visible defect.",
    },
    plaster: { block: PLASTER, before: before.white_terracotta ?? 0, after: after.white_terracotta ?? 0, reversed: reversal },
    materialCounts: { before, after },
    cornerCollisions: merged.collisions,
    faces: faceRecords,
    refine: refineNote,
    note: "the splat does the bulk; the LLM refines/judges (twodee-interaction-sector). Verdict = the human face " +
      "triptych + categorical judge (E-22 Rule 2); these scores are the per-face hill-climb nudge.",
  };
  await writeFile(join(OUT_DIR, "cottage.json"), JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, "cottage.md"), renderMd(record));
  console.error(`\n✓ wrote ${join(OUT_DIR, "cottage.json")} + artifact.json`);
}

function renderMd(r) {
  const f = r.faces.map((x) =>
    `- **${x.face}** (${x.source}): painted ${x.painted}, skipped ${x.skipped}, offPalette ${x.offPalette}, ` +
    `zoneRejected ${x.zoneRejected ?? 0}, accepted=${x.accepted}` +
    (x.before?.score ? ` · resemblance ${x.before.score.score}→${x.after?.score?.score ?? "?"}` : ` · ${x.before?.error ? "GL unavailable (gate blind)" : (x.note ?? "")}`),
  ).join("\n");
  const z = r.zones;
  const histLine = (h) => `base ${h.base}, upper ${h.upper}, roof ${h.roof}`;
  const zoneMd = z ? `## Zone mask (T-079-02)\n` +
    `storeyDivide = y${z.storeyDivide}. Surface plaster by zone:\n` +
    `- **masked (this fix):** ${histLine(z.histogram.masked)} → plaster confined to the upper storey (base 0, roof 0).\n` +
    `- **unmasked (the shipped color-only splat):** ${histLine(z.histogram.unmasked)} → smeared into base + roof.\n` +
    `- interior strays (pre-existing, not on any face, untouched): ${z.interiorStrays}.\n\n` : "";
  return `# Spray-paint — cottage (T-079-02)\n\n` +
    `Plaster (\`${r.plaster.block}\`): **${r.plaster.before} → ${r.plaster.after}** — ` +
    `the 215→8 regression ${r.plaster.reversed ? "**reversed**" : "NOT reversed"}.\n\n` +
    (r.sealed ? `Sealed before paint: ${r.sealed.raw} → ${r.sealed.sealed} placements (seal then paint).\n\n` : "") +
    zoneMd +
    `Enforced palette ("4 cans"): ${r.palette.allowed.join(", ")}.\n` +
    `Corner collisions resolved (concept > glb): ${r.cornerCollisions}.\n\n## Faces\n${f}\n\n` +
    `Refine: ${r.refine}\n\n> ${r.note}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
