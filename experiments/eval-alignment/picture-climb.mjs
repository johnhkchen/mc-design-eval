#!/usr/bin/env node
/**
 * THE PICTURE-DRIVEN CLIMB (T-188-01, story S-188, epic E-48) — the first sustained climb steered by the
 * E-47 picture-anchored DiagnoseBuild critique (the creation-loop critique, NOT the frozen instrument).
 *
 * Forked from autonomy-loop.mjs (the E-38 agentic climb, left untouched as the defect-dominated baseline
 * contrast). What changed: (1) the gradient is now the structured, multi-azimuth, concept-image-anchored
 * DiagnoseBuild term (styleFidelityScore + critiqueEvidence), not a single-view defect-dominated quality
 * eval; (2) an ACCEPT-GATE keeps a round only if it moved TOWARD the concept on the picture critique
 * (acceptsRound), rolling back otherwise; (3) a RESTRAINT / STOPPING rule converges instead of oscillating
 * (stoppingDecision). The three construction HANDS are reused verbatim — no new hands this ticket.
 *
 * The deliverable is the GLANCE (per-round beside-concept renders) + the EYES-vs-HANDS inventory
 * (classifyInventory): which named critiques the loop could act on vs which it named but had no lever for.
 *
 * NOT in `npm test`. Metered (VOTES strong-tier diagnoses per scored build). Asset-guarded; GUARD_ONLY=1
 * renders round-0 + the beside sheet and exits BEFORE any spend.
 *
 *   GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs   # wiring + render seam, zero spend
 *   node experiments/eval-alignment/picture-climb.mjs                # the metered climb
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy, occupancyFromCells } from "../../src/view/occupancy.mjs";
import { gableRecord, generateRoof, gableRidgeForRatio } from "../../src/view/roof-generate.mjs";
import { constructWalls, closeShell, eaveRingClosure } from "../../src/view/wall-generate.mjs";
import { wallSkin } from "../../src/view/wall-skin.mjs";
import { extractApertures, dressOpenings } from "../../src/view/opening-dressing.mjs";
import { frameArchPlacements } from "../../src/view/arch-frame.mjs";
import { carveTargetCells, apertureCoherenceGate, carveAperture, apertureColumns, inheritedSlotResidual } from "../../src/view/aperture-carve.mjs";
import { buildWallRelief } from "../../src/view/wall-relief.mjs";
import { framingReport, targetRatiosOf } from "../../src/view/framing.mjs";
import { composeRoofTreatment, bareBlock, deriveArchHead } from "../../src/view/treatment-grammar.mjs";
import { roleBlock } from "../../src/recognition/compile.mjs";
import { infillPanel } from "../../src/view/facade-articulation.mjs";
import { rebuildArtifact } from "../../src/view/shell-integrity.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";
import { renderBesideConcept, assertGlAvailable } from "../../src/view/render-beside.mjs";
import { requestText } from "../../src/sdk-binding.mjs";

import { MULTI_ANGLE_GATE, CLAUDE_SUBPROCESS_TIMEOUT_MS } from "../../src/config.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { runTieredOp } from "../../src/model-tier.mjs";
import { bamlRender, bamlParse } from "../../src/baml/bridge.mjs";
import { diagnoseRenderArgs } from "../../src/workshop/diagnose.mjs";
import { critiqueEvidence, itemStyleClass, styleFidelityScore } from "../../src/workshop/bakeoff-score.mjs";
import { acceptsRound, acceptsBatch, coldStartFloor, BATCH_DEFAULTS, stoppingDecision, classifyInventory, deptMajorCounts, deptItemCounts, buildDigest, TOOL_DEPARTMENTS, CLIMB_DEFAULTS, formReadyGate, FORM_READY_CLOSURE, closureDecidedMove } from "../../src/workshop/climb-gate.mjs";
import { parseFirstJsonObject } from "../../src/workshop/agent-reply.mjs";
import { reconcileRoofMaterial } from "../../src/recognition/roof-material.mjs";
import { assertMaterialMap } from "../../src/form/material-map.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");

// ---- the gatehouse subject (the climb seed + the real recognition program for the diagnose grounding) ----
const SUBJECT = "gatehouse";
const SEED_ARTIFACT = "benchmarks/sculpture/generated/gatehouse/artifact.json";
const PROGRAM_PATH = "benchmarks/sculpture/recognition/gatehouse.program.json";
const PACK_PATH = "packs/rustic.json";
const MATERIAL_MAP_PATH = "benchmarks/sculpture/material-map/gatehouse.json"; // the concept-read roof colour (T-189-01)
const CONCEPT = "benchmarks/sculpture/runs/015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate/concept.png";
// ridgeAxis is RECOGNITION-DECLARED, not a footprint guess (T-192-01): the gatehouse footprint is near-
// square (15×15) so geometry alone is ambiguous; the program disambiguates — ridge runs x so the gable end
// faces the arched -x gate. The runner previously hardcoded "z" (a 90° rotation vs the gate, the reviewer's
// 2026-06-17 finding). NOTE: the picture-critique is BLIND to orientation (it never names rotation), so this
// is a recognition-driven correction, NOT a climb-driven one — the eyes-gap is flagged for E-50 CRITIQUE
// COVERAGE / E-49 (loadProgram is hoisted; PROGRAM_PATH is defined above).
const CFG = { eaveY: 18, ridgeAxis: "z" };
CFG.ridgeAxis = loadProgram(PROGRAM_PATH)?.masses?.[0]?.roof?.ridgeAxis ?? CFG.ridgeAxis;

const AZIMUTHS = [...MULTI_ANGLE_GATE.azimuths];
const TIER = "strong";
const VOTES = 3;                       // median out the matched-build 0-76 score swing (T-187 research)
const AGENT_MODEL = "claude-sonnet-4-6";
const { margin, stallK, minRounds } = CLIMB_DEFAULTS;
// CLIMB_MAX_ROUNDS: metered-budget knob for the capstone re-climb (T-205-01). Defaults to the frozen
// CLIMB_DEFAULTS.maxRounds (5) so `npm test` + every existing climb are byte-unchanged. Not a new hand — only
// how many rounds the agent gets to act, in the VOTES/CLIMB_OUT family of run parameters. The capstone needs
// five productive moves (close_shell → gable → rebuild_arch → relief → recolor) to express all three E-52
// fixes; at the frozen 5 the run truncates before the roof (as T-201 did with recolor_roof unfired).
const maxRounds = Number(process.env.CLIMB_MAX_ROUNDS) || CLIMB_DEFAULTS.maxRounds;
// COLD-START BATCH ESCAPE (T-208-01, S-208, E-53). When a genuinely-closed form is stuck at the saturated
// picture floor (T-207 live: detail moves score 0→0 and the per-move gate rolls them back), stack BATCH_SIZE
// provisional detail moves and judge the COMPOUND once (acceptsBatch). OPT-IN: default 0 = OFF, so the per-move
// path and every prior climb (T-201/T-205/T-207) re-run byte-identically; the escape proof sets CLIMB_BATCH_SIZE.
// Follows the CLIMB_MAX_ROUNDS knob discipline — a run parameter, not a new hand.
const BATCH_SIZE = Number(process.env.CLIMB_BATCH_SIZE) || 0;
const SCORE_FLOOR = process.env.CLIMB_SCORE_FLOOR != null ? Number(process.env.CLIMB_SCORE_FLOOR) : BATCH_DEFAULTS.scoreFloor;
const GUARD_ONLY = process.env.GUARD_ONLY === "1";
const ROOF_MATERIAL_PROBE = process.env.ROOF_MATERIAL_PROBE === "1"; // T-189-01: render the brown→grey roof glance, zero spend
const REBUILD_ARCH_PROBE = process.env.REBUILD_ARCH_PROBE === "1"; // T-203-01: render the wide-arch rebuild glance + gate numbers, zero spend

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const toB64 = async (p) => {
  const buf = await readFile(p);
  const mediaType = buf.slice(0, 3).toString("hex") === "ffd8ff" ? "image/jpeg" : "image/png";
  return { base64: buf.toString("base64"), mediaType };
};
// First-balanced-brace JSON extraction (T-198-01, shared in T-200-01) — now the single source in
// src/workshop/agent-reply.mjs (so picture-climb and autonomy-loop decode replies identically).
const parse = parseFirstJsonObject;
const occToCells = (occ) => {
  const out = [];
  for (const [key, block] of occ.cells) out.push({ pos: key.split(",").map(Number), block, form: occ.forms.get(key), state: occ.states.get(key) });
  return out;
};

// ====================== the three HANDS (reused verbatim from autonomy-loop.mjs) ======================
// THE PITCH LEVER (T-204-01, S-204, E-52): the roof hands previously hardcoded `ridgeY = eaveY +
// floor(perp/2), pitch:1` — a rise blind to the build's eave height, so the achieved ridgeToEave can drift
// off the recognised concept proportion. leverGable picks the ridge/pitch from the recognised target
// (targetRatiosOf(program).ridgeToEave) via the PURE, tolerance-gated gableRidgeForRatio. It is byte-IDENTICAL
// to the old hardcode when the honest gable is within tolerance (the gatehouse: 1.55 vs 1.35, relDelta 0.148
// < 0.2 → changed:false) — so wiring it in is a no-op here BY DESIGN, and only a genuine drift is corrected.
function leverGable(occ, perp) {
  const program = loadProgram(PROGRAM_PATH);
  const eaveHeight = CFG.eaveY - occ.bounds.min[1] + 1;
  const target = program ? (targetRatiosOf(program)?.ridgeToEave ?? null) : null;
  const L = target
    ? gableRidgeForRatio({ eaveY: CFG.eaveY, eaveHeight, perp, targetRatio: target })
    : { ridgeY: CFG.eaveY + Math.floor(perp / 2), pitch: 1, changed: false, reason: "no program target — pitch 1" };
  if (L.changed) console.error(`  [pitch-lever] ${L.reason}`);
  return L;
}
function apply_gable_roof(occ) {
  const kept = []; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [key, block] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    if (y >= CFG.eaveY + 1) continue;
    kept.push({ pos: [x, y, z], block, form: occ.forms.get(key), state: occ.states.get(key) });
    if (y === CFG.eaveY) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  }
  const perp = CFG.ridgeAxis === "z" ? x1 - x0 : z1 - z0;
  const L = leverGable(occ, perp);
  const gable = gableRecord({ footprint: { x0, x1, z0, z1 }, ridgeAxis: CFG.ridgeAxis, eaveY: CFG.eaveY, ridgeY: L.ridgeY, pitch: L.pitch, hip: { demanded: false } });
  const FAMILY = { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab", findings: [] };
  return occupancyFromCells([...kept, ...generateRoof([gable], FAMILY).cells]);
}
function loadProgram(rel) { const p = join(ROOT, rel); return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null; }
function loadPackOf(program) { if (!program?.pack) return null; const p = join(ROOT, "packs", `${program.pack}.json`); return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null; }
function construct_walls(occ) {
  const program = loadProgram(PROGRAM_PATH);
  const pack = loadPackOf(program);
  const floor = occ.bounds.min[1];
  const groundRole = program?.masses?.[0]?.walls?.ground?.role;
  const wallField = (pack && groundRole) ? roleBlock(pack, groundRole) : undefined;
  const env = constructWalls(occ, { floor, eaveY: CFG.eaveY, program, wallField });
  return wallSkin(env, { program, pack, floor, eaveY: CFG.eaveY, extractApertures, dressOpenings });
}
// THE CLOSE-THE-SHELL FORM HAND (WALL, FORM stage) — T-197-01 (S-197, E-51). Build a DENSE closed wall shell
// from the program footprint (closeShell): the gatehouse is an open colonnade (band closure ~0.615) because
// constructWalls suppresses the dense program-rect ring on the near-square footprint. This is FORM ONLY — no
// skin, no opening carve (those are the DETAIL stage, gated behind form-readiness). Keeps the roof verbatim.
// Honest no-op (logs the geometry wall) if the footprint can't register above the trust floor.
function close_shell(occ) {
  const program = loadProgram(PROGRAM_PATH);
  const pack = loadPackOf(program);
  const floor = occ.bounds.min[1];
  const groundRole = program?.masses?.[0]?.walls?.ground?.role;
  const wallField = (pack && groundRole) ? roleBlock(pack, groundRole) : undefined;
  const { occ: out, report } = closeShell(occ, { program, floor, eaveY: CFG.eaveY, wallField });
  console.error(`  [close_shell] ${report.closed ? `CLOSED: closure ${report.closureBefore.toFixed(3)} → ${report.closureAfter.toFixed(3)} (ring ${report.ringSize}, cov ${report.coverage?.toFixed(2)})` : `no-op — ${report.reason}`}`);
  return out;
}
function add_timber_framing(occ) {
  const eave = CFG.eaveY;
  const upperStart = Math.floor(eave / 2) + 1;
  const r = infillPanel(occ, {
    memberMaterial: "dark_oak_log", fieldMaterial: "white_terracotta",
    faces: ["+x", "-x", "+z", "-z"], rhythm: { period: 3, phase: 0 }, span: 1, depth: 1,
    zoneOf: ([x, y, z]) => y >= upperStart && y <= eave, zone: true,
  });
  return occupancyFromCells([...occToCells(occ), ...r.placements.map((p) => ({ pos: p.pos, block: p.block }))]);
}
// THE ROOF-MATERIAL HAND (T-189-01): rebuild the roof in the CONCEPT-TRUE material recognition read, not
// the program's default timber. The decision is pure (reconcileRoofMaterial: program ↔ material-map, the
// seam where material identity is decided); this hand only loads, decides, and rebuilds. The gable GEOMETRY
// is identical to apply_gable_roof (same footprint/eave/pitch) — only the field block changes (form-faithful,
// honest grey cubes, no stair/slab name-derivation). A no-divergence reconcile is an honest no-op.
function loadMaterialMap() {
  const mm = JSON.parse(readFileSync(join(ROOT, MATERIAL_MAP_PATH), "utf8"));
  assertMaterialMap(mm.map); // committed material-map/v1 is the already-parsed {map:[]} form
  return mm;
}
function recolor_roof(occ) {
  const program = loadProgram(PROGRAM_PATH);
  const pack = loadPackOf(program);
  const { roofBlock, corrected, reason } = reconcileRoofMaterial({ program, pack, materialMap: loadMaterialMap() });
  if (!corrected) { console.error(`  [recolor_roof] no-op — ${reason}`); return occ; }
  const kept = []; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [key, block] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    if (y >= CFG.eaveY + 1) continue;
    kept.push({ pos: [x, y, z], block, form: occ.forms.get(key), state: occ.states.get(key) });
    if (y === CFG.eaveY) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  }
  const perp = CFG.ridgeAxis === "z" ? x1 - x0 : z1 - z0;
  const L = leverGable(occ, perp);
  const gable = gableRecord({ footprint: { x0, x1, z0, z1 }, ridgeAxis: CFG.ridgeAxis, eaveY: CFG.eaveY, ridgeY: L.ridgeY, pitch: L.pitch, hip: { demanded: false } });
  const FAMILY = { field: roofBlock.replace(/^minecraft:/, ""), stairs: null, slab: null, findings: [] };
  console.error(`  [recolor_roof] ${reason}`);
  return occupancyFromCells([...kept, ...generateRoof([gable], FAMILY).cells]);
}
// ====================== the S-192 HANDS (T-192-01) — the levers the resumed climb stalled on ======================
// Each targets ONE department so the gate's department-dominant override (T-191) can keep it on a whole-build
// regression. Materials are READ from the program roles via roleBlock — never a hardcoded block (the
// gatehouse material inversion is data, not a constant). measurements/ untouched.

// THE ARCHED-PASSAGE HAND (OPENING): build the dark-timber frame + voxel arch head over BOTH ±x through-
// passages. Apertures are measured on the SEED reference (which carries the ±x doors — construct_walls loses
// the door aperture; the opening-dressing reference-vs-target contract). On the gatehouse the passage is a
// 1-wide slot, so this FRAMES both mouths in dark timber and RECORDS (per opening) that the true wide arched
// gate needs a wider opening — a rebuild the loop can't reach, named for E-49 (frameArchPlacements.perOpening).
function frame_arch(occ) {
  const program = loadProgram(PROGRAM_PATH);
  const pack = loadPackOf(program);
  const door = program?.masses?.[0]?.openings?.find((o) => o.kind === "door");
  const frameBlock = (pack && door?.headRole) ? roleBlock(pack, door.headRole) : "dark_oak_log";
  const refOcc = artifactOccupancy(JSON.parse(readFileSync(join(ROOT, SEED_ARTIFACT), "utf8")));
  const apertures = extractApertures(refOcc);
  const { placements, perOpening } = frameArchPlacements(occ, apertures, { frameBlock });
  for (const r of perOpening) console.error(`  [frame_arch] ${r.dir}: framed=${r.framed} arched=${r.arched}${r.reason ? ` — ${r.reason}` : ""}`);
  if (!placements.length) { console.error("  [frame_arch] no door placements — no-op"); return occ; }
  return occupancyFromCells([...occToCells(occ), ...placements.map((p) => ({ pos: p.pos, block: p.block }))]);
}

// THE CARVE+DRESS HAND (OPENING) — T-194-01 (S-194, E-51). The charter narrowing: CARVE the declared gate
// WIDER (removing wall — an air op allowed ONLY here, ONLY inside the declared aperture, ONLY if the
// aperture-coherence gate accepts it) then FRAME + ARCH it. frame_arch can only FRAME the 1-wide slot (the
// T-193 plateau: "the true wide arch needs the opening widened"); this widens it so an arch head is buildable.
// SELF-REVERTS to frame_arch (recess-only) if the gate rejects the carve — a leaky/ragged carve is NEVER
// returned (the anti-hedge refute path, recorded). Materials READ via roleBlock; measurements/ untouched.
const U_AXIS = Object.freeze({ "+x": 2, "-x": 2, "+z": 0, "-z": 0 }); // world index of the along-face axis
function apertureFromTarget(t) {
  const cells = [], flanks = { left: [], right: [] }, lintel = [];
  for (let av = t.vLo; av <= t.vHi; av++) for (let au = t.uLo; au <= t.uHi; au++) cells.push({ au, av });
  for (let av = t.vLo; av <= t.vHi; av++) { flanks.left.push({ au: t.uLo - 1, av }); flanks.right.push({ au: t.uHi + 1, av }); }
  for (let au = t.uLo - 1; au <= t.uHi + 1; au++) lintel.push({ au, av: t.vHi + 1 });
  return { kind: "door", dir: t.dir, cells, flanks, lintel };
}
function carve_arch(occ) {
  const program = loadProgram(PROGRAM_PATH);
  const pack = loadPackOf(program);
  const door = program?.masses?.[0]?.openings?.find((o) => o.kind === "door" && o.head === "arch");
  if (!door) { console.error("  [carve_arch] no declared arched door — no-op"); return occ; }
  const frameBlock = (pack && door.headRole) ? roleBlock(pack, door.headRole) : "dark_oak_log";
  // measure the slot on the LIVE build (positions match the carve); fall back to the seed ref if the door
  // has been dressed shut / lost on this build state.
  const onBuild = extractApertures(occ).find((a) => a.dir === door.wall && a.kind === "door");
  const refOcc = artifactOccupancy(JSON.parse(readFileSync(join(ROOT, SEED_ARTIFACT), "utf8")));
  const declared = onBuild ?? extractApertures(refOcc).find((a) => a.dir === door.wall && a.kind === "door");
  if (!declared) { console.error(`  [carve_arch] no door aperture on ${door.wall} — no-op`); return occ; }

  // scale the declared width (program units) into the build: build wall-band u-span / program rect u-span.
  const ax = U_AXIS[door.wall];
  let uMin = Infinity, uMax = -Infinity;
  for (const key of occ.cells.keys()) {
    const c = key.split(",").map(Number);
    if (c[1] < occ.bounds.min[1] || c[1] > CFG.eaveY) continue;
    if (c[ax] < uMin) uMin = c[ax]; if (c[ax] > uMax) uMax = c[ax];
  }
  const progSpan = ax === 2 ? program?.masses?.[0]?.rect?.d : program?.masses?.[0]?.rect?.w;
  const scale = (Number.isFinite(uMin) && progSpan) ? (uMax - uMin + 1) / progSpan : 1;

  // T-210-01: centre on the wall face by construction (same faceSpan lever as rebuild_arch).
  const faceSpan = (Number.isFinite(uMin) && Number.isFinite(uMax) && uMax >= uMin) ? { uLo: uMin, uHi: uMax } : undefined;
  const { remove, target } = carveTargetCells(occ, declared, { programW: door.w, scale, faceSpan });
  if (!remove.size) { console.error("  [carve_arch] nothing to carve (slot already at width) — framing only"); return frame_arch(occ); }
  const carved = carveAperture(occ, remove);
  const wideAp = apertureFromTarget(target);
  const { placements, perOpening } = frameArchPlacements(carved, [wideAp], { frameBlock });
  // INHERITED-SLOT CONFLICT (T-210-01): fill an off-centre slot left outside the centred span (exterior plane,
  // air-only, wall field block — restoring the shell, not an air op). See rebuild_arch for the rationale.
  const groundRole = program?.masses?.[0]?.walls?.ground?.role;
  const wallField = (pack && groundRole) ? roleBlock(pack, groundRole) : "stone_bricks";
  const residual = inheritedSlotResidual(declared, target);
  const cposOf = (au, av, w) => { const p = [0, 0, 0]; p[ax] = au; p[1] = av; p[ax === 2 ? 0 : 2] = w; return p; };
  const fill = [];
  for (const au of residual.aus) for (let av = target.vLo; av <= target.vHi; av++) {
    const p = cposOf(au, av, target.wStar);
    if (!carved.solid(p[0], p[1], p[2])) fill.push({ pos: p, block: wallField });
  }
  const dressed = occupancyFromCells([...occToCells(carved), ...placements.map((p) => ({ pos: p.pos, block: p.block })), ...fill]);

  const gate = apertureCoherenceGate(occ, dressed, target, { floor: occ.bounds.min[1], eaveY: CFG.eaveY });
  console.error(`  [carve_arch] centeredByConstruction=${target.centeredOnFace} span=[${target.uLo},${target.uHi}] inheritedSlot residual=${residual.aus.length} filled=${fill.length}`);
  for (const r of perOpening) console.error(`  [carve_arch] ${r.dir}: width=${target.width} carved=${remove.size} framed=${r.framed} arched=${r.arched}`);
  console.error(`  [carve_arch] gate ok=${gate.ok}${gate.reason ? ` — ${gate.reason}` : ""} (scope=${gate.scope.ok} coherent=${gate.coherent.ok} closure=${gate.closure.ok})`);
  if (gate.ok) return dressed;
  console.error("  [carve_arch] REFUTE: aperture-coherence gate rejected the carve — reverting to recess-only (frame_arch)");
  return frame_arch(occ);
}

// THE WIDE-ARCH REBUILD HAND (OPENING) — T-203-01 (S-203, E-52). THE defining feature of a *gatehouse*: a
// WIDE arched gate. The E-49 capstone proved carve_arch can never KEEP an arch — it carves a clean wide
// rectangle then adds a voxel arch ring, and the gate's FULL-HEIGHT coherence check reads the arch spandrels
// as "notched columns 3,4,8,9" → refute → fall back to a too-narrow framed slot. The fix is not a different
// carve (carveTargetCells already widens correctly) but an ARCH-AWARE coherence gate: gate the rectangular
// PASSAGE below the springline, CREDIT the arch HEAD (spandrels) above it (apertureCoherenceGate's arch
// option). This hand rebuilds the declared gate to its wide arched form — frame jambs/lintel + the voxel
// voussoir ring (S-179 deriveArchHead names the wedge crown) + a sill course — and on a KEEP registers the
// declared-open aperture columns so the plane metric reads closure-EXCEPT-aperture (the gate survives the
// next round instead of close_shell re-filling it). Self-reverts to frame_arch on a true refute, like
// carve_arch (the anti-hedge path, recorded). Materials READ via roleBlock; measurements/ untouched.
let openColumns = new Set();        // declared-open aperture columns; threaded into closureNow once a rebuild KEEPS
let pendingRebuildCols = null;      // the cols of the last rebuild candidate (promoted to openColumns on accept)
function rebuild_arch(occ) {
  pendingRebuildCols = null;
  const program = loadProgram(PROGRAM_PATH);
  const pack = loadPackOf(program);
  const door = program?.masses?.[0]?.openings?.find((o) => o.kind === "door" && o.head === "arch");
  if (!door) { console.error("  [rebuild_arch] no declared arched door — no-op"); return occ; }
  const frameBlock = (pack && door.headRole) ? roleBlock(pack, door.headRole) : "dark_oak_log";
  const onBuild = extractApertures(occ).find((a) => a.dir === door.wall && a.kind === "door");
  const refOcc = artifactOccupancy(JSON.parse(readFileSync(join(ROOT, SEED_ARTIFACT), "utf8")));
  const declared = onBuild ?? extractApertures(refOcc).find((a) => a.dir === door.wall && a.kind === "door");
  if (!declared) { console.error(`  [rebuild_arch] no door aperture on ${door.wall} — no-op`); return occ; }

  // scale the declared width (program units) into the build — identical to carve_arch's preamble.
  const ax = U_AXIS[door.wall];
  let uMin = Infinity, uMax = -Infinity;
  for (const key of occ.cells.keys()) {
    const c = key.split(",").map(Number);
    if (c[1] < occ.bounds.min[1] || c[1] > CFG.eaveY) continue;
    if (c[ax] < uMin) uMin = c[ax]; if (c[ax] > uMax) uMax = c[ax];
  }
  const progSpan = ax === 2 ? program?.masses?.[0]?.rect?.d : program?.masses?.[0]?.rect?.w;
  const scale = (Number.isFinite(uMin) && progSpan) ? (uMax - uMin + 1) / progSpan : 1;

  // T-210-01 (S-210, E-54): centre the gate on its WALL FACE by construction — the wall-band u-span IS the face
  // (the front face is recognition-declared via door.wall). faceSpan overrides the slot-centred placement so the
  // gate lands centred regardless of where the (often GLB-inherited) slot sat. Finite-guarded so a degenerate
  // band falls back to the legacy slot centre.
  const faceSpan = (Number.isFinite(uMin) && Number.isFinite(uMax) && uMax >= uMin) ? { uLo: uMin, uHi: uMax } : undefined;
  const { remove, target } = carveTargetCells(occ, declared, { programW: door.w, scale, faceSpan });
  if (!remove.size) { console.error("  [rebuild_arch] nothing to carve (slot already at width) — framing only"); return frame_arch(occ); }
  const carved = carveAperture(occ, remove);

  // the wide aperture record; build frame + the voxel arch ring (the voussoir wedge stones).
  const wideAp = apertureFromTarget(target);
  const { placements, perOpening } = frameArchPlacements(carved, [wideAp], { frameBlock });
  // a SILL course: recolor the band row just below the opening across the span, at both passage mouths.
  const sill = [];
  const AX = { u: ax, v: 1, w: ax === 2 ? 0 : 2 };
  const posOf = (au, av, w) => { const p = [0, 0, 0]; p[AX.u] = au; p[AX.v] = av; p[AX.w] = w; return p; };
  for (let au = target.uLo; au <= target.uHi; au++) for (const w of [target.wMin, target.wMax]) {
    const p = posOf(au, target.vLo - 1, w);
    if (carved.solid(p[0], p[1], p[2])) sill.push({ pos: p, block: frameBlock });
  }
  // INHERITED-SLOT CONFLICT (T-210-01): an off-centre slot left OUTSIDE the centred span reads as a second
  // opening beside the gate (the SCOPE gate is blind to pre-existing air). FILL its exterior wall-plane cells
  // back to solid with the wall field block — restoring the shell (adding wall, NOT an air op). Air-only, so it
  // never recolours existing wall and is a no-op when close_shell already sealed the slot. Reported honestly.
  const groundRole = program?.masses?.[0]?.walls?.ground?.role;
  const wallField = (pack && groundRole) ? roleBlock(pack, groundRole) : "stone_bricks";
  const residual = inheritedSlotResidual(declared, target);
  const fill = [];
  for (const au of residual.aus) for (let av = target.vLo; av <= target.vHi; av++) {
    const p = posOf(au, av, target.wStar);
    if (!carved.solid(p[0], p[1], p[2])) fill.push({ pos: p, block: wallField });
  }
  const dressed = occupancyFromCells([...occToCells(carved), ...placements.map((p) => ({ pos: p.pos, block: p.block })), ...sill, ...fill]);

  // S-179 voussoir reuse: name the wedge crown the arch ring built (evidence the head IS a voussoir curve).
  const archedAir = [];
  for (let av = target.vLo; av <= target.vHi; av++) for (let au = target.uLo; au <= target.uHi; au++) {
    const p = posOf(au, av, target.wStar);
    if (!dressed.solid(p[0], p[1], p[2])) archedAir.push({ au, av });
  }
  const lintelRow = []; for (let au = target.uLo - 1; au <= target.uHi + 1; au++) lintelRow.push({ au, av: target.vHi + 1 });
  const vouss = deriveArchHead({ cells: archedAir, lintel: lintelRow });

  const radius = target.width / 2;
  const spring = Math.max(target.vLo + 1, target.vHi - Math.floor(radius));
  const gate = apertureCoherenceGate(occ, dressed, target, { floor: occ.bounds.min[1], eaveY: CFG.eaveY, arch: { spring } });
  console.error(`  [rebuild_arch] centeredByConstruction=${target.centeredOnFace} faceW=${faceSpan ? faceSpan.uHi - faceSpan.uLo + 1 : "?"} span=[${target.uLo},${target.uHi}] inheritedSlot residual=${residual.aus.length}${residual.aus.length ? ` (au ${residual.aus.join(",")})` : ""} filled=${fill.length}`);
  for (const r of perOpening) console.error(`  [rebuild_arch] ${r.dir}: width=${target.width} carved=${remove.size} framed=${r.framed} arched=${r.arched} sill=${sill.length} voussoir=${vouss.voussoirs.length}${vouss.curve ? " (curved head)" : ""}`);
  console.error(`  [rebuild_arch] gate ok=${gate.ok}${gate.reason ? ` — ${gate.reason}` : ""} (scope=${gate.scope.ok} coherent=${gate.coherent.ok} [single=${gate.coherent.single} passage=${gate.coherent.passageContinuous} head=${gate.coherent.headBuilt}] closure=${gate.closure.ok})`);
  if (gate.ok) { pendingRebuildCols = apertureColumns(target); return dressed; }
  console.error("  [rebuild_arch] REFUTE: arch-aware coherence gate rejected the rebuild — reverting to recess-only (frame_arch)");
  return frame_arch(occ);
}

// THE WALL FIELD+CONTRAST HAND (WALL): the recorded WALL majors are (1) the field reads near-black/charcoal
// (probed: it is polished_basalt/deepslate_bricks, not the pale dressed stone the concept shows) and (2) the
// rubble-quoin contrast is lost — BECAUSE the dark field kills it (the cobblestone quoins are already
// present, 220 cells). So the single lever is a RECOLOR of the wall-band FIELD cubes to the pale dressed
// stone (roleBlock walls.ground.role = stone_bricks), PRESERVING the cobblestone quoins (and any dark_oak
// frame). Pale field + kept rubble corners → both WALL items clear at once. Recolor = last-writer-wins, no
// air op, closure held (no cell removed). composeTreatment's quoin brush is the WRONG lever here (proudCells=0
// on the already-quoined corners; the defect is the field colour, not missing corner geometry).
function articulate_walls(occ) {
  const program = loadProgram(PROGRAM_PATH);
  const pack = loadPackOf(program);
  const fieldBlock = pack ? roleBlock(pack, program?.masses?.[0]?.walls?.ground?.role ?? "wall.dressing") : "stone_bricks";
  const quoinBlock = pack ? roleBlock(pack, program?.masses?.[0]?.walls?.dressing?.role ?? "wall.field.ground") : "cobblestone";
  const KEEP = new Set([bareBlock(quoinBlock), "dark_oak_log"]); // rubble quoins + the timber arch frame
  const floor = occ.bounds.min[1];
  const cells = []; let recolored = 0;
  for (const [key, blk] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    let block = blk;
    const isCube = !occ.forms.has(key);
    if (isCube && y >= floor && y <= CFG.eaveY && !KEEP.has(bareBlock(blk)) && bareBlock(blk) !== bareBlock(fieldBlock)) {
      block = fieldBlock; recolored += 1;
    }
    cells.push({ pos: [x, y, z], block, form: occ.forms.get(key), state: occ.states.get(key) });
  }
  console.error(`  [articulate_walls] pale-field recolor: ${recolored} wall cells → ${fieldBlock} (quoins kept ${quoinBlock})`);
  return occupancyFromCells(cells);
}

// THE WALL-RELIEF HAND (WALL) — T-195-01 (S-195, E-51). CONSTRUCTION, not recolor: recolor the wall field
// to the pale dressed stone AND build proud cobblestone quoins + a plinth course standing PROUD of it, so
// the dressed field reads DISTINCT FROM the rough rubble corners — the residual WALL critique item
// articulate_walls' flat recolor could not clear ("the coursed dressed field reading distinct from the rough
// rubble corners"). The recolor-FIRST is load-bearing: surfaceRelief skips a proud column whose SOURCE cell
// already IS the relief block (idempotence), which is exactly why composeTreatment's quoin no-op'd on the
// already-cobblestone corners in articulate_walls (proudCells=0). Recoloring the corners to the field first
// makes the proud quoin EMIT. All proud geometry is the E-43 composeTreatment engine (door-routed), pure in
// src/view/wall-relief.mjs; restrained amplitude (base plinth + corner quoins, no field clinker belt, no
// cornice) per the amplitude-is-the-lever lesson. closure (recessClosureGuard) is reported, not assumed.
function relief_walls(occ) {
  const program = loadProgram(PROGRAM_PATH);
  const pack = loadPackOf(program);
  const floor = occ.bounds.min[1];
  const { occ: out, closure, report, materials, recolored } =
    buildWallRelief(occ, { program, pack, floor, eaveY: CFG.eaveY });
  const corners = report.byLayer?.corners?.placed ?? 0;
  const base = report.byLayer?.base?.placed ?? 0;
  console.error(`  [relief_walls] recolor ${recolored}→${materials.fieldBlock}; proud ${materials.dressBlock} quoins=${corners} plinth=${base}; closure ${closure.ok ? "held" : "REGRESSED " + JSON.stringify(closure)}`);
  return out;
}

// THE EAVE/VERGE BAND HAND (ROOF, a MINOR): a lighter-stone (roof.trimRole = wall.dressing = stone_bricks)
// eave course + raking verge banding the dark roof edges. NOTE: this targets a ROOF MINOR; the override is
// major-gated, so band_eave is kept only by a scalar improvement / tie — see review.md.
function band_eave(occ) {
  const program = loadProgram(PROGRAM_PATH);
  const pack = loadPackOf(program);
  const trimRole = program?.masses?.[0]?.roof?.trimRole ?? "wall.dressing";
  const bandBlock = pack ? roleBlock(pack, trimRole) : "stone_bricks";
  let ridgeY = CFG.eaveY;
  for (const key of occ.cells.keys()) { const y = Number(key.split(",")[1]); if (y > ridgeY) ridgeY = y; }
  if (ridgeY <= CFG.eaveY) { console.error("  [band_eave] no roof band above eave — no-op"); return occ; }
  const { occ: out, closure } = composeRoofTreatment(occ, { edge: { material: bandBlock } },
    { ridgeAxis: CFG.ridgeAxis, eaveY: CFG.eaveY, ridgeY });
  if (!closure.ok) console.error(`  [band_eave] WARN closure regressed: ${JSON.stringify(closure)}`);
  return out;
}

const TOOLS = { apply_gable_roof, recolor_roof, construct_walls, close_shell, add_timber_framing, frame_arch, carve_arch, rebuild_arch, articulate_walls, relief_walls, band_eave };
const MENU = [
  "- close_shell: CLOSE THE SHELL — rebuild the wall envelope as a DENSE, watertight box from the building footprint (form/massing only, no detail). Best when the walls are an OPEN COLONNADE / full of gaps / not a closed building. This is the FORM step: detail tools (carve_arch, relief_walls, band_eave) are LOCKED until the shell is closed.",
  "- apply_gable_roof: replace the roof with a crisp parametric gable. Best when the worst divergence is the ROOF FORM/SHAPE/presence (not its colour).",
  "- recolor_roof: rebuild the roof in the CONCEPT-TRUE material recognition read (e.g. grey stone when the concept roof is stone, not the program's default brown timber). Best when the worst divergence is ROOF COLOUR / MATERIAL — the roof reads the wrong material vs the concept.",
  "- construct_walls: REBUILD the wall envelope and skin it as construction from the pack roles (per-storey material, dressed quoins, clinker courses, a plinth, dressed openings). Best for STRUCTURAL wall holes / missing walls / a monotone single-material wall.",
  "- add_timber_framing: add timber-frame studs + plaster infill on the upper storey. Best for a uniform/monotone WALL with no material contrast / missing half-timber detail.",
  "- frame_arch: build a dark-timber FRAME + arch head over the through-passage(s). Best when the worst divergence is the OPENING — a raw/undressed passage void with no arch head or timber surround.",
  "- rebuild_arch: REBUILD the declared gate as a WIDE ARCHED opening — frame + voxel voussoir arch + sill, the wide arched gate (the only tool that can WIDEN an opening to a real arch). Best when the OPENING divergence is a NARROW slot / missing gate where the concept shows a WIDE arched gateway. Self-reverts to a frame if the rebuild can't stay a clean coherent arch.",
  "- articulate_walls: recolor the wall field to the pale dressed stone, keeping the rubble corner quoins. Best when the WALL field reads too dark/monotone, killing the contrast with the corner quoins.",
  "- relief_walls: build proud dressed-stone RELIEF — recolor the field pale AND stand cobblestone quoins + a plinth course PROUD of it (construction, not a flat recolor). Best when the WALL reads flat: the dressed field must read DISTINCT FROM / recessed behind the rough rubble corners, not just a colour swap.",
  "- band_eave: add a lighter-stone eave/verge banding course along the roof edges. Best when the ROOF field runs to the edges with no contrasting eave/verge trim band.",
  "- done: stop — the build reads like the concept, or no tool addresses the worst remaining divergence.",
].join("\n");

// ============================= the GRADIENT: picture-anchored DiagnoseBuild =============================
let PROGRAM, PACK, CONCEPT_IMG;            // loaded once in main (after the guard)

// A round whose EVERY diagnose vote failed (T-198-01). Carries the per-vote outcomes so the climb can REPORT
// the failure (and whether it was a subprocess TIMEOUT — an infra/auth/spend signal — vs all-malformed)
// rather than silently scoring the round 0. A measurement that lost every vote is corrupted, not a robust 0.
class RoundAbortedError extends Error {
  constructor(round, voteOutcomes) {
    const timedOut = voteOutcomes.filter((o) => o.status === "timeout").length;
    super(`round ${round}: all ${voteOutcomes.length} diagnose votes failed (${timedOut} timed out) — round aborted, NOT scored 0`);
    this.name = "RoundAbortedError";
    this.round = round;
    this.voteOutcomes = voteOutcomes;
    this.timedOut = timedOut;
  }
}

/** Persist a recorded ABORT (every vote in a round failed) + the partial trajectory, then return cleanly with
 * a non-zero exit code (T-198-01). The deliberate alternative to a fabricated 0 or a stack-trace crash: an
 * all-timed-out round is an infra/auth/spend signal to SURFACE, an all-malformed round a no-usable-verdict
 * signal — both reported, neither scored. */
async function writeAbortRecord(err, trajectory, outPath) {
  const allTimedOut = err.timedOut === err.voteOutcomes.length;
  const out = {
    schema: "picture-climb/v1", subject: SUBJECT, seed: SEED_ARTIFACT, program: PROGRAM_PATH, pack: "rustic",
    concept: CONCEPT, tier: TIER, votes: VOTES, margin, stopReason: "round-aborted-all-votes-failed",
    subprocessTimeoutMs: CLAUDE_SUBPROCESS_TIMEOUT_MS, aborted: true,
    abort: { round: err.round, timedOut: err.timedOut, allTimedOut, voteOutcomes: err.voteOutcomes, reason: err.message },
    trajectory,
  };
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(out, null, 2) + "\n");
  console.error(`\n[ABORT] ${err.message}`);
  console.error(allTimedOut
    ? "  All votes TIMED OUT → likely an infra/auth/spend failure, NOT a build signal. The guard WORKED (no hang); the metered diagnose is unreachable in this environment. Reported, NOT scored."
    : "  All votes failed to parse (malformed) → the diagnose model returned no usable verdict. Reported, NOT scored.");
  console.error(`  Wrote partial trajectory + abort block to ${outPath}.`);
  process.exitCode = 2; // a recorded finding: non-zero, but a clean return — not a crash
}

const itemsOf = (critique) => (critique?.items ?? []).map((it) => ({
  department: it.department, severity: it.severity, present: it.present ?? "", missing: it.missing ?? "",
  kind: it.kind ?? null, styleClass: itemStyleClass(it),
}));

/** One DiagnoseBuild → {ev, items, score}. No re-ask (a zero-token notice only burns budget). */
async function diagnose(renders) {
  const args = diagnoseRenderArgs({ program: PROGRAM, pack: PACK, azimuths: AZIMUTHS });
  const { prompt, images } = await bamlRender({ fn: "DiagnoseBuild", args, images: { concept: CONCEPT_IMG, renders } });
  // The subprocess-timeout guard (T-198-01): bound the strong-tier `claude -p` diagnose child so a
  // non-returning subprocess (the ~20-min hang) is killed and surfaces a typed ClaudeTimeoutError the vote
  // loop can DROP/ABORT, instead of hanging the whole climb.
  const { text } = await runTieredOp({ tier: TIER, prompt, images, timeoutMs: CLAUDE_SUBPROCESS_TIMEOUT_MS });
  const critique = await bamlParse({ fn: "DiagnoseBuild", text });
  return { ev: critiqueEvidence(critique), items: itemsOf(critique), score: styleFidelityScore(critique) };
}

/** Render the four azimuths + the beside sheet, then score the build by VOTES median DiagnoseBuild. */
async function scoreBuild(occ, template, round, tag) {
  const roundDir = join(ROOT, `builds/${SUBJECT}/picture-climb/round-${round}`);
  const artifact = rebuildArtifact(occ, template);
  await renderViews(artifact, AZIMUTHS, { outDir: roundDir, label: (a) => a, width: 512, height: 512 });
  await renderBesideConcept(artifact, join(ROOT, CONCEPT), join(roundDir, "beside-concept.png"), { label: `r${round}` });
  // The WIDER EYES (T-196-01): a deterministic read of orientation + proportion the department-bound critique
  // is blind to. GL-free, so it rides the render seam (computed even in GUARD_ONLY). REPORTED, never scored —
  // there is no hand that rotates a roof or resizes a mass, so its residual is named for E-49, not a lever.
  const framing = PROGRAM ? framingReport(PROGRAM, occ) : null;
  if (framing?.flags.length) console.error(`  [${tag} r${round}] FRAMING: ${framing.flags.join(" | ")}`);
  if (GUARD_ONLY) return { score: null, dir: roundDir, framing }; // render seam proven, no spend
  const renders = await Promise.all(AZIMUTHS.map((a) => toB64(join(roundDir, `view-${a}.png`))));
  // Vote with the subprocess-timeout guard (T-198-01): a TIMED-OUT vote (typed ClaudeTimeoutError) is DROPPED
  // like a malformed one — the median survives on the remaining votes — but every outcome is RECORDED
  // (voteOutcomes), never console-only, so a degraded round is visible in the trajectory. If EVERY vote fails
  // the round is ABORTED (RoundAbortedError), never scored 0 — an all-timed-out round is an infra/auth/spend
  // signal to surface, not a measurement to fabricate.
  const samples = [], voteOutcomes = [];
  for (let v = 0; v < VOTES; v++) {
    const t0 = Date.now();
    try {
      samples.push(await diagnose(renders));
      voteOutcomes.push({ vote: v + 1, status: "ok", ms: Date.now() - t0 });
    } catch (e) {
      const status = e.code === "ETIMEDOUT_CLAUDE" ? "timeout" : "malformed";
      voteOutcomes.push({ vote: v + 1, status, ms: Date.now() - t0 });
      console.error(`  [${tag} r${round}] vote ${v + 1} dropped (${status}, no re-ask): ${e.message}`);
    }
  }
  if (!samples.length) throw new RoundAbortedError(round, voteOutcomes);
  const scores = samples.map((s) => s.score);
  const med = samples.find((s) => s.score === median(scores)) ?? samples[0];
  return { ...med.ev, score: med.score, items: med.items, scores, dir: roundDir, framing, voteOutcomes };
}

const evOf = (b) => ({ score: b.score, nItems: b.nItems, nMajor: b.nMajor, nWrongStyle: b.nWrongStyle, wrongStyleBreadth: b.wrongStyleBreadth, departments: b.departments, missing: b.missing });

async function agentPick(build, history, closure = null) {
  const top = [...build.items].sort((a, b) => (a.severity === "major" ? 0 : 1) - (b.severity === "major" ? 0 : 1))
    .slice(0, 5).map((it) => `  - ${it.department} (${it.severity}, ${it.kind ?? "?"}): ${it.missing || it.present || "diverges"}`).join("\n");
  // FORM-BEFORE-DETAIL readiness (T-197-01): tell the agent whether the shell is closed enough to dress, so
  // it picks close_shell FIRST on an open form. Detail picks on an open form are rejected by the runner.
  const formReady = closure === null ? "" :
    closure >= FORM_READY_CLOSURE
      ? `FORM READINESS: wall shell closure ${closure.toFixed(2)}/1.0 — CLOSED. Detail tools (rebuild_arch, relief_walls, band_eave) are eligible.`
      : `FORM READINESS: wall shell closure ${closure.toFixed(2)}/1.0 — OPEN (an unclosed colonnade). Detail tools (rebuild_arch, relief_walls, band_eave) are LOCKED until closure ≥ ${FORM_READY_CLOSURE}. Pick close_shell first to close the form.`;
  const hist = history.length
    ? history.map((h) => `- ${h.tool}: score ${h.qBefore}→${h.qAfter} (${h.accepted ? "KEPT" : "ROLLED BACK — " + h.reason})`).join("\n")
    : "(nothing tried yet)";
  // The WIDER EYES (T-196-01): surface orientation/scale residuals the item-critique cannot. No tool fixes
  // them, so they are shown only so the agent is not BLIND — if only these remain, `done` is the honest pick.
  const framing = (build.framing?.flags ?? []).length
    ? `FRAMING (orientation/scale — NO tool fixes these; if only these remain, pick \`done\`):\n${build.framing.flags.map((f) => `  - ${f}`).join("\n")}`
    : "";
  const prompt = [
    "You improve a Minecraft build to look like its CONCEPT IMAGE. A picture-critique reports the build's",
    `current divergences from the concept (picture-fidelity score ${build.score}/100, higher = closer):`,
    top || "  (no items — the build reads like the concept)",
    formReady,
    framing,
    "Tools already applied, and whether the accept-gate KEPT them (kept only if they moved toward the concept):",
    hist,
    "RULES:",
    "- A tool that was ROLLED BACK did not move this build toward the concept — do NOT pick it again.",
    "- If no tool addresses the worst remaining divergence (e.g. it names a chimney, an interior, or fine",
    "  trim no tool builds), pick `done` — naming a defect you cannot fix is the honest answer.",
    "Pick ONE tool:", MENU,
    'Output ONE JSON: {"tool":"<close_shell|apply_gable_roof|recolor_roof|construct_walls|add_timber_framing|frame_arch|rebuild_arch|articulate_walls|relief_walls|band_eave|done>","reason":"<short>"}',
  ].join("\n");
  // The agent-pick reply is bounded by the same subprocess guard, and made ROBUST to a malformed reply
  // (T-198-01): a non-conforming pick must DEGRADE, never crash the climb and lose the trajectory. Try the
  // reply; on a parse failure re-ask ONCE with a stern corrective; if that also fails, fall to a recorded
  // `done` (the honest terminal) rather than throwing. Mirrors the handle-don't-reject seam lesson.
  const ask = (extra) => requestText({ prompt: prompt + (extra ?? ""), model: AGENT_MODEL, timeoutMs: CLAUDE_SUBPROCESS_TIMEOUT_MS });
  try {
    return parse((await ask()).text);
  } catch (e1) {
    console.error(`  [agentPick] unparseable reply (${e1.message}) — re-asking once`);
    try {
      return parse((await ask("\n\nIMPORTANT: output EXACTLY ONE JSON object and nothing else — no second object, no prose.")).text);
    } catch (e2) {
      console.error(`  [agentPick] still unparseable (${e2.message}) — falling to \`done\` (recorded)`);
      return { tool: "done", reason: "agent reply unparseable after one re-ask — terminating honestly" };
    }
  }
}

// ===================================== the loop with the accept-gate =====================================
async function main() {
  const guard = [SEED_ARTIFACT, PROGRAM_PATH, PACK_PATH, MATERIAL_MAP_PATH, CONCEPT];
  for (const rel of guard) if (!existsSync(join(ROOT, rel))) throw new Error(`missing asset: ${rel}`);
  assertGlAvailable();
  console.error(`[guard] assets present; GL available. subject=${SUBJECT} azimuths=${AZIMUTHS.join(",")} votes=${VOTES} margin=${margin}`);

  const template = JSON.parse(readFileSync(join(ROOT, SEED_ARTIFACT), "utf8"));
  let occ = artifactOccupancy(template);
  PROGRAM = JSON.parse(readFileSync(join(ROOT, PROGRAM_PATH), "utf8")); // load early so the framing eyes ride the GUARD_ONLY seam

  // T-189-01 — the roof-material GLANCE: render the seed roof and the recolor_roof roof each beside the
  // concept, print the reconcile reason, and exit BEFORE any LLM spend. The falsifiable deliverable
  // (brown→grey) without the metered climb. The roof FORM is identical (recolor_roof reuses the gable
  // geometry); only the material differs — so this isolates the colour change on the glance.
  if (ROOF_MATERIAL_PROBE) {
    const outDir = join(ROOT, `builds/${SUBJECT}/picture-climb/roof-material`);
    await mkdir(outDir, { recursive: true });
    // The triptych isolates the COLOUR change at the gable level: apply_gable_roof (the existing hand) gives
    // a clean BROWN gable; recolor_roof (the new hand) gives a clean GREY gable of identical geometry.
    const gabled = apply_gable_roof(occ);
    const recolored = recolor_roof(occ);
    await renderBesideConcept(rebuildArtifact(occ, template), join(ROOT, CONCEPT), join(outDir, "seed-beside.png"), { label: "seed (program roof, dark_oak)" });
    await renderBesideConcept(rebuildArtifact(gabled, template), join(ROOT, CONCEPT), join(outDir, "gable-brown-beside.png"), { label: "apply_gable_roof (timber)" });
    await renderBesideConcept(rebuildArtifact(recolored, template), join(ROOT, CONCEPT), join(outDir, "recolored-beside.png"), { label: "recolor_roof (grey stone)" });
    console.error(`[ROOF_MATERIAL_PROBE] wrote seed/gable-brown/recolored beside sheets to ${outDir}; no spend.`);

    // T-204-01 (S-204, E-52) — the ROOF-TO-ITS-PICTURE evidence (render-independent, zero spend):
    //   (1) COLOUR landed value-true: census the recolor_roof roof cells → all deepslate_tiles.
    //   (2) PITCH is a MEASUREMENT artifact, not a steep roof: the honest closed+gabled build is WITHIN
    //       tolerance (≈1.55, unflagged); relief_walls proud detail pushes the MEASURED ridgeToEave out of
    //       tolerance by polluting framing's eaveYOf — the same proud-detail-pollutes-measurement family as
    //       T-202's eaveRingClosure collapse (named residual, cross-ref T-202; NOT force-corrected here).
    //   (3) the pitch LEVER EXISTS: fire gableRidgeForRatio on a synthetic out-of-tolerance target.
    const prog = loadProgram(PROGRAM_PATH);
    const roofCells = [...recolored.cells].filter(([k]) => Number(k.split(",")[1]) >= CFG.eaveY + 1);
    const slate = roofCells.filter(([, b]) => b.replace(/^minecraft:/, "") === "deepslate_tiles").length;
    console.error(`\n[T-204 COLOUR] recolor_roof roof-cell census: ${slate}/${roofCells.length} cells = deepslate_tiles ${slate === roofCells.length && roofCells.length > 0 ? "✓ value-true slate landed" : "✗"}`);

    const fmtScale = (s) => s ? `ridgeToEave ${s.build?.ridgeToEave} vs ${s.target?.ridgeToEave} (Δ ${s.deltas?.ridgeToEave}) flagged=${s.flagged}${s.severity ? ` ${s.severity}` : ""}` : "(no ratios)";
    const closed = close_shell(occ);
    const gabledClosed = apply_gable_roof(closed);
    console.error(`[T-204 PITCH] honest closed+gabled build: ${fmtScale(framingReport(prog, gabledClosed).scale)}`);
    try {
      const relief = relief_walls(gabledClosed);
      console.error(`[T-204 PITCH] after relief_walls (proud detail): ${fmtScale(framingReport(prog, relief).scale)}`);
      console.error(`[T-204 PITCH] → the flag is raised by relief, not the roof: same eaveYOf proud-detail pollution as T-202 (named residual).`);
    } catch (e) {
      console.error(`[T-204 PITCH] relief_walls threw (${e.message}); the flagged value is on record: T-201 trajectory r4 ridgeToEave 1.6316 vs 1.35 (after relief_walls).`);
    }
    const eaveHeight = CFG.eaveY - gabledClosed.bounds.min[1] + 1;
    const perpC = (() => { let a = Infinity, b = -Infinity; for (const k of closed.cells.keys()) { const c = k.split(",").map(Number); if (c[1] === CFG.eaveY) { const u = CFG.ridgeAxis === "z" ? c[0] : c[2]; a = Math.min(a, u); b = Math.max(b, u); } } return Number.isFinite(a) ? b - a : 10; })();
    const synth = gableRidgeForRatio({ eaveY: CFG.eaveY, eaveHeight, perp: perpC, targetRatio: 1.1 });
    console.error(`[T-204 LEVER] synthetic out-of-tol target 1.1: changed=${synth.changed} ${synth.reason} → lever exists and moves the ratio on demand.`);
    console.error(`[ROOF_MATERIAL_PROBE] done; exiting clean.`);
    return;
  }

  // T-203-01 — the WIDE-ARCH REBUILD glance (render-independent of any LLM spend): close the shell, gable it,
  // then rebuild the gate. Prints the carve + arch-aware coherence + closure-EXCEPT-aperture numbers and
  // renders the rebuilt build beside the concept. The falsifiable deliverable (a wide arched gate that PASSES
  // the gate carve_arch could not) without the metered climb.
  if (REBUILD_ARCH_PROBE) {
    const outDir = join(ROOT, `builds/${SUBJECT}/picture-climb/rebuild-arch`);
    await mkdir(outDir, { recursive: true });
    const eaveY = CFG.eaveY;
    const closed = close_shell(occ);
    const gabled = apply_gable_roof(closed);
    const cBeforeAll = eaveRingClosure(gabled, { floor: gabled.bounds.min[1], eaveY, program: PROGRAM });
    console.error(`\n[T-203 REBUILD] closed+gabled footprint closure: ${cBeforeAll.toFixed(3)}`);
    const rebuilt = rebuild_arch(gabled); // logs width/carved/framed/arched/sill/voussoir + the gate verdict
    const kept = rebuilt !== gabled && pendingRebuildCols; // the hand returned a gate-OK dressed build
    const aperCols = pendingRebuildCols ?? new Set();
    const cBare = eaveRingClosure(rebuilt, { floor: rebuilt.bounds.min[1], eaveY, program: PROGRAM });
    const cExcept = eaveRingClosure(rebuilt, { floor: rebuilt.bounds.min[1], eaveY, openCols: aperCols, program: PROGRAM });
    console.error(`[T-203 REBUILD] gate ${kept ? "PASSED — wide arched gate kept" : "REFUTED — reverted to frame (named bound)"}`);
    console.error(`[T-203 REBUILD] closure-except-aperture: bare ${cBare.toFixed(3)} (the gate swath reads as a hole) → with the ${aperCols.size} declared-open columns forgiven ${cExcept.toFixed(3)} ${cExcept >= FORM_READY_CLOSURE ? "✓ ≥ form-ready (close_shell will NOT re-fill the gate)" : "✗ still dips (S-202/S-203 coupling — named)"}`);
    await renderBesideConcept(rebuildArtifact(gabled, template), join(ROOT, CONCEPT), join(outDir, "before-beside.png"), { label: "closed+gabled (no gate)" });
    await renderBesideConcept(rebuildArtifact(rebuilt, template), join(ROOT, CONCEPT), join(outDir, "rebuilt-beside.png"), { label: "rebuild_arch (wide arched gate)" });
    console.error(`[T-203 REBUILD] wrote before/rebuilt beside sheets to ${outDir}; no spend; exiting clean.`);
    return;
  }

  if (GUARD_ONLY) {
    await scoreBuild(occ, template, 0, "guard"); // renders round-0 views + beside sheet, zero spend
    console.error(`[guard] GUARD_ONLY — round-0 renders + beside sheet written; no spend; exiting clean.`);
    return;
  }

  PACK = loadStylePack(join(ROOT, PACK_PATH));
  CONCEPT_IMG = await toB64(join(ROOT, CONCEPT));

  // T-189-01 — the METERED critique-fires→clears proof (the anti-hedge attack, run not asserted): score the
  // BROWN gable (apply_gable_roof) and the GREY gable (recolor_roof) by the SAME picture-critique, and report
  // each build's ROOF-department items. The claim is fixable iff the ROOF colour/material item present on the
  // brown build is ABSENT (or no longer a wrong-material `replace`) on the grey build. VOTES median, no re-ask.
  if (process.env.ROOF_MATERIAL_DIAGNOSE === "1") {
    const roofItems = (b) => b.items.filter((it) => it.department === "ROOF");
    const fmt = (its) => its.length ? its.map((it) => `${it.severity}/${it.kind ?? "?"}: ${it.missing || it.present}`).join(" | ") : "(none)";
    const allFmt = (b) => b.items.map((it) => `${it.department} ${it.severity}/${it.kind ?? "?"}: ${it.missing || it.present}`).join("\n      ");
    const brown = await scoreBuild(apply_gable_roof(occ), template, 901, "brown");
    const grey = await scoreBuild(recolor_roof(occ), template, 902, "grey");
    console.error(`\n[ROOF_MATERIAL_DIAGNOSE]`);
    console.error(`  brown gable (apply_gable_roof): score ${brown.score} (${brown.scores.join("/")}) nMajor=${brown.nMajor} depts=${brown.departments}`);
    console.error(`    ROOF → ${fmt(roofItems(brown))}`);
    console.error(`    ALL items:\n      ${allFmt(brown)}`);
    console.error(`  grey  gable (recolor_roof):     score ${grey.score} (${grey.scores.join("/")}) nMajor=${grey.nMajor} depts=${grey.departments}`);
    console.error(`    ROOF → ${fmt(roofItems(grey))}`);
    console.error(`    ALL items:\n      ${allFmt(grey)}`);
    return;
  }

  // Form-before-detail ordering (T-197-01): the build's wall-band closure — the form-readiness scalar the
  // ordering gate consumes. Measured on the ABSOLUTE PROGRAM FOOTPRINT (T-206-01, supersedes the T-202 plane
  // clamp): an open colonnade reads ~0.6 (close_shell forced); proud relief is off-ring and ignored. The SAME
  // metric closeShell reports, so the gate and the hand agree. CLOSURE-EXCEPT-APERTURE (T-203-01): once a
  // wide-arch rebuild is KEPT, its declared-open columns (`openColumns`) are forgiven so the form gate stays
  // satisfied and the climb does not pick close_shell and re-fill the gate.
  const closureNow = (o) => eaveRingClosure(o, { floor: o.bounds.min[1], eaveY: CFG.eaveY, openCols: openColumns, program: PROGRAM });

  const trajectory = [];
  const history = [];
  const outPath = join(ROOT, process.env.CLIMB_OUT ?? "docs/active/work/T-188-01/trajectory.json");

  // The seed score (round 0). A RoundAbortedError here (every diagnose vote failed/timed out) is RECORDED and
  // returns cleanly — never a fabricated 0, never a stack-trace crash (T-198-01).
  let prev;
  try { prev = await scoreBuild(occ, template, 0, "seed"); }
  catch (e) { if (e instanceof RoundAbortedError) { await writeAbortRecord(e, trajectory, outPath); return; } throw e; }
  let prevDigest = buildDigest(occToCells(occ)); // the kept build's digest (T-190-01 no-op guard)
  let pick = await agentPick(prev, history, closureNow(occ));
  console.error(`\n[round 0] score=${prev.score} (${prev.scores.join("/")}) closure=${closureNow(occ).toFixed(3)} → agent picks ${pick.tool}: ${pick.reason}`);
  trajectory.push({ round: 0, score: prev.score, evidence: evOf(prev), items: prev.items, pick, applied: false, accepted: false, framing: prev.framing ?? null, closure: closureNow(occ), voteOutcomes: prev.voteOutcomes ?? null });

  let noAcceptStreak = 0, stopReason = "maxRounds", round = 1;
  for (; round <= maxRounds; round++) {
    if (pick.tool === "done" || !TOOLS[pick.tool]) { stopReason = "agent-done"; break; }

    // FORM-BEFORE-DETAIL ordering (T-197-01): a DETAIL tool is ineligible until the wall shell is form-ready
    // (closure ≥ FORM_READY_CLOSURE). Block it with NO apply / NO spend, record the rolled-back round, advance
    // the stall counter, and re-pick — the agent is told the form is open so it picks close_shell first. Form
    // tools (close_shell, construct_walls, the roof hands) and `done` always pass straight through.
    const closure = closureNow(occ);
    const eligible = formReadyGate({ tool: pick.tool, closure });
    if (!eligible.allow) {
      noAcceptStreak += 1;
      history.push({ tool: pick.tool, qBefore: prev.score, qAfter: prev.score, accepted: false, reason: eligible.reason });
      console.error(`[round ${round}] ${pick.tool}: BLOCKED (form-before-detail) — ${eligible.reason}, no spend`);
      trajectory.push({ round, score: prev.score, evidence: evOf(prev), items: prev.items,
        pick, applied: true, accepted: false, gate: { accept: false, delta: 0, reason: eligible.reason }, blocked: true, closure });
      pick = await agentPick(prev, history, closure);
      console.error(`           next: ${pick.tool} — ${pick.reason}`);
      const stopBlk = stoppingDecision({ round, agentDone: pick.tool === "done", noAcceptStreak, margin, stallK, maxRounds, minRounds });
      if (stopBlk.stop) { stopReason = stopBlk.reason; break; }
      continue;
    }

    // COLD-START BATCH ESCAPE (T-208-01, S-208, E-53). On a genuinely-closed form stuck at the saturated
    // picture floor (T-207 live: detail moves score 0→0 and the per-move gate rolls them back as "tie (0): no
    // shrink"), stack up to BATCH_SIZE provisional DETAIL picks as a pure occ-chain and judge the COMPOUND once
    // (acceptsBatch) — the gradient several reads create together. occ is preserved until accept → rollback is
    // free. OPT-IN (BATCH_SIZE>0); inert on a healthy climb (coldStartFloor false off the floor / on an open form).
    if (BATCH_SIZE > 0 && coldStartFloor({ score: prev.score, closure, scoreFloor: SCORE_FLOOR })) {
      const batchApertureCols = new Set();                 // rebuild aperture cols staged for accept-only promotion
      const batchClosure = (o) => eaveRingClosure(o, { floor: o.bounds.min[1], eaveY: CFG.eaveY, program: PROGRAM,
        openCols: new Set([...openColumns, ...batchApertureCols]) });
      let occN = occ, batchDigest = prevDigest, bp = pick;
      const batchPicks = [], batchDepts = new Set();
      while (batchPicks.length < BATCH_SIZE && round + batchPicks.length <= maxRounds) {
        if (bp.tool === "done" || !TOOLS[bp.tool]) break;
        // A wall-shell FORM move (close_shell/construct_walls) must NOT be stacked in a detail batch — it moves
        // the perimeter and can REOPEN the shell (re-climb 1: construct_walls dropped closure 1.000→0.068). End
        // the batch and let it go through the per-move form-credit path (which judges its closure delta).
        if (closureDecidedMove(bp.tool)) break;
        if (!formReadyGate({ tool: bp.tool, closure: batchClosure(occN) }).allow) break; // shell re-opened — stop
        const candOcc = TOOLS[bp.tool](occN);
        const stagedCols = pendingRebuildCols; pendingRebuildCols = null;
        const d = buildDigest(occToCells(candOcc));
        if (d === batchDigest) {                            // no-op / self-revert — skip, re-ask, don't count it
          history.push({ tool: bp.tool, qBefore: prev.score, qAfter: prev.score, accepted: false, reason: "no-op (batch, identical build)" });
          bp = await agentPick(prev, history, batchClosure(occN));
          continue;
        }
        occN = candOcc; batchDigest = d; batchPicks.push(bp.tool);
        for (const dep of (TOOL_DEPARTMENTS[bp.tool] ?? [])) batchDepts.add(dep);
        if (bp.tool === "rebuild_arch" && stagedCols) for (const c of stagedCols) batchApertureCols.add(c);
        history.push({ tool: bp.tool, qBefore: prev.score, qAfter: prev.score, accepted: true, reason: `provisional (batch ${batchPicks.length}/${BATCH_SIZE})` });
        bp = await agentPick(prev, history, batchClosure(occN)); // re-pick on the UNCHANGED prev score
      }
      if (batchPicks.length > 0) {                          // something stacked → judge the compound once
        let compound;
        try { compound = await scoreBuild(occN, template, round, "batch"); }
        catch (e) { if (e instanceof RoundAbortedError) { await writeAbortRecord(e, trajectory, outPath); return; } throw e; }
        const targetDepartments = [...batchDepts];
        const beforeDeptMajors = deptMajorCounts(prev.items), afterDeptMajors = deptMajorCounts(compound.items);
        const beforeDeptItems = deptItemCounts(prev.items), afterDeptItems = deptItemCounts(compound.items);
        const closureAfter = batchClosure(occN);
        const gate = acceptsBatch(prev, compound, { targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems, closureBefore: closure, closureAfter });
        if (gate.accept) { occ = occN; prevDigest = batchDigest; openColumns = new Set([...openColumns, ...batchApertureCols]); }
        noAcceptStreak = gate.accept ? 0 : noAcceptStreak + 1;
        history.push({ tool: `batch[${batchPicks.join("+")}]`, qBefore: prev.score, qAfter: compound.score, accepted: gate.accept, reason: gate.reason });
        console.error(`[round ${round}] BATCH ${batchPicks.join("+")}: ${prev.score}→${compound.score} (${compound.scores.join("/")}) — ${gate.accept ? "KEPT" : "ROLLED BACK"} (${gate.reason})`);
        trajectory.push({ round, score: prev.score, evidence: evOf(prev), items: prev.items,
          pick: { tool: batchPicks[batchPicks.length - 1] }, applied: true, accepted: gate.accept, gate,
          scoreAfter: { score: compound.score, scores: compound.scores },
          targetDepartments, deptMajorsBefore: beforeDeptMajors, deptMajorsAfter: afterDeptMajors,
          deptItemsBefore: beforeDeptItems, deptItemsAfter: afterDeptItems, framing: compound.framing ?? null,
          closure, closureAfter, voteOutcomes: compound.voteOutcomes ?? null,
          batch: { size: batchPicks.length, picks: batchPicks, accepted: gate.accept } });
        prev = gate.accept ? compound : prev;
        round += batchPicks.length - 1;                     // the batch consumed batchPicks.length budget rounds
        pick = (bp.tool && TOOLS[bp.tool]) ? bp : await agentPick(prev, history, closureNow(occ));
        console.error(`           next: ${pick.tool} — ${pick.reason}`);
        const stopB = stoppingDecision({ round, agentDone: pick.tool === "done", noAcceptStreak, margin, stallK, maxRounds, minRounds });
        if (stopB.stop) { stopReason = stopB.reason; break; }
        continue;
      }
      // nothing stacked (all no-ops / agent done immediately) → fall through to the per-move path below.
    }

    const cand = TOOLS[pick.tool](occ);

    // No-op guard (T-190-01): an idempotent re-pick that produces a byte-identical build is not progress and
    // must not be re-scored (the +8 vote-noise phantom T-188 §2 accepted). Record it, advance the stall
    // counter, spend nothing, do not change occ.
    const candDigest = buildDigest(occToCells(cand));
    if (candDigest === prevDigest) {
      noAcceptStreak += 1;
      history.push({ tool: pick.tool, qBefore: prev.score, qAfter: prev.score, accepted: false, reason: "no-op (identical build)" });
      console.error(`[round ${round}] ${pick.tool}: no-op (identical build) — ROLLED BACK, no spend`);
      trajectory.push({ round, score: prev.score, evidence: evOf(prev), items: prev.items,
        pick, applied: true, accepted: false, gate: { accept: false, delta: 0, reason: "no-op (identical build)" }, noop: true, closure });
      pick = await agentPick(prev, history, closure);
      console.error(`           next: ${pick.tool} — ${pick.reason}`);
      const stopNoop = stoppingDecision({ round, agentDone: pick.tool === "done", noAcceptStreak, margin, stallK, maxRounds, minRounds });
      if (stopNoop.stop) { stopReason = stopNoop.reason; break; }
      continue;
    }

    let candScore;
    try { candScore = await scoreBuild(cand, template, round, "cand"); }
    catch (e) { if (e instanceof RoundAbortedError) { await writeAbortRecord(e, trajectory, outPath); return; } throw e; }
    // Department-dominant accept signal (T-190-01 + T-191-01): keep a tool that cleared a major in a
    // department it targets and grew no targeted dept's total burden, even on a whole-build scalar REGRESSION
    // (the judge promoted a pre-existing major in an UNtargeted dept — attention-shift, not regression). The
    // net (major+minor) counts are the falsification guard: they reject "cleared a major but added minors in
    // its own target" (S-191). All counts are derived purely from the items already on each scored build.
    const targetDepartments = TOOL_DEPARTMENTS[pick.tool];
    const beforeDeptMajors = deptMajorCounts(prev.items);
    const afterDeptMajors = deptMajorCounts(candScore.items);
    const beforeDeptItems = deptItemCounts(prev.items);
    const afterDeptItems = deptItemCounts(candScore.items);
    // FORM-CREDIT (T-199-01, E-49): the candidate's wall-band closure — the SAME eaveRingClosure definition,
    // computed on the APPLIED build BEFORE the gate decision (the recorded value the gate evaluates). This is
    // the form-readiness signal the gate's form clause credits: close_shell raises it 0.615→1.000 and is now
    // KEPT on a picture-score tie instead of rolled back (the T-198 deadlock).
    // the candidate's closure-except-aperture: a rebuild candidate forgives ITS OWN pending aperture columns
    // too, so the recorded closureAfter reflects the gate-surviving reading (not the mid-build dip).
    const closureAfter = eaveRingClosure(cand, { floor: cand.bounds.min[1], eaveY: CFG.eaveY, program: PROGRAM,
      openCols: pendingRebuildCols ? new Set([...openColumns, ...pendingRebuildCols]) : openColumns });
    // FORM-MOVE ROUTING (T-200-01, S-200): a wall-shell form move (close_shell/construct_walls) is decided on
    // closureOf ALONE — the picture vote (a 0–76 same-seed swing) is removed from its keep/rollback so the
    // decision is stable across re-runs. Roof-form/detail picks keep the picture gradient (isFormMove false).
    const gate = acceptsRound(prev, candScore, { margin, targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems, closureBefore: closure, closureAfter, isFormMove: closureDecidedMove(pick.tool) });
    if (gate.accept) {
      occ = cand; prevDigest = candDigest;
      // promote the kept rebuild's declared-open columns into the closure-except-aperture set (T-203-01).
      if (pick.tool === "rebuild_arch" && pendingRebuildCols) { openColumns = new Set([...openColumns, ...pendingRebuildCols]); console.error(`  [rebuild_arch] kept → ${pendingRebuildCols.size} aperture columns now declared-open (closure-except-aperture)`); }
    }
    pendingRebuildCols = null;
    noAcceptStreak = gate.accept ? 0 : noAcceptStreak + 1;
    history.push({ tool: pick.tool, qBefore: prev.score, qAfter: candScore.score, accepted: gate.accept, reason: gate.reason });
    console.error(`[round ${round}] ${pick.tool}: ${prev.score}→${candScore.score} (${candScore.scores.join("/")}) — ${gate.accept ? "KEPT" : "ROLLED BACK"} (${gate.reason})`);

    trajectory.push({ round, score: prev.score, evidence: evOf(prev), items: prev.items,
      pick, applied: true, accepted: gate.accept, gate, scoreAfter: { score: candScore.score, scores: candScore.scores },
      targetDepartments, deptMajorsBefore: beforeDeptMajors, deptMajorsAfter: afterDeptMajors,
      deptItemsBefore: beforeDeptItems, deptItemsAfter: afterDeptItems, framing: candScore.framing ?? null,
      closure, closureAfter, voteOutcomes: candScore.voteOutcomes ?? null });

    prev = gate.accept ? candScore : prev;
    pick = await agentPick(prev, history, closureNow(occ));
    console.error(`           next: ${pick.tool} — ${pick.reason}`);
    const stop = stoppingDecision({ round, agentDone: pick.tool === "done", noAcceptStreak, margin, stallK, maxRounds, minRounds });
    if (stop.stop) { stopReason = stop.reason; break; }
  }
  // terminal entry carries the FINAL build score (so classifyInventory's scoreLast reads the kept build)
  trajectory.push({ round, score: prev.score, items: [], pick: { tool: "—" }, applied: false, accepted: false, terminal: true });

  const inventory = classifyInventory(trajectory, { margin });
  const spread = trajectory.filter((t) => t.scoreAfter?.scores).flatMap((t) => t.scoreAfter.scores);
  // The guard's health summary (T-198-01): how many votes were dropped to a subprocess TIMEOUT across the
  // climb. >0 with a completed climb = degraded-but-survived (median held on the surviving votes). The
  // all-votes-timed-out case never reaches here — it returns via writeAbortRecord.
  const votesTimedOut = trajectory.flatMap((t) => t.voteOutcomes ?? []).filter((o) => o.status === "timeout").length;
  const out = {
    schema: "picture-climb/v1", subject: SUBJECT, seed: SEED_ARTIFACT, program: PROGRAM_PATH, pack: "rustic",
    concept: CONCEPT, tier: TIER, votes: VOTES, margin, stopReason,
    observedScoreSpread: { min: Math.min(...prev.scores), max: Math.max(...prev.scores), allRoundVotes: spread },
    framingResidual: prev.framing?.residual ?? [], // the wider eyes' named gap on the kept build (→ E-49)
    formReadyClosure: FORM_READY_CLOSURE,
    closureFirst: trajectory[0]?.closure ?? null, // the seed's open shell
    closureLast: closureNow(occ),                  // the kept build's shell after the climb
    subprocessTimeoutMs: CLAUDE_SUBPROCESS_TIMEOUT_MS, votesTimedOut,
    trajectory, inventory,
  };
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(out, null, 2) + "\n");

  const trend = trajectory.map((t) => t.score).join(" → ");
  console.error(`\n================ PICTURE-DRIVEN CLIMB (gatehouse) ================`);
  console.error(`trend: ${trend}  (Δ ${inventory.verdict.delta >= 0 ? "+" : ""}${inventory.verdict.delta}; stop: ${stopReason})`);
  console.error(`verdict: climbed=${inventory.verdict.climbed} stalled=${inventory.verdict.stalled} oscillated=${inventory.verdict.oscillated} actionable=${inventory.verdict.actionableFrac}`);
  console.error(`shell closure: ${(out.closureFirst ?? 0).toFixed(3)} → ${out.closureLast.toFixed(3)} (form-ready ≥ ${FORM_READY_CLOSURE})`);
  console.error(`acted-on: ${inventory.actedOn.map((a) => a.department).join(", ") || "(none)"}`);
  console.error(`eyes-only (named, no lever): ${inventory.eyesOnly.map((e) => e.department).join(", ") || "(none)"}`);
  console.error(`framing residual (wider eyes, → E-49): ${out.framingResidual.map((r) => `${r.axis} (${r.note})`).join("; ") || "(none — orientation+scale read clean)"}`);
  console.error(`wrote ${outPath} + per-round beside renders under builds/${SUBJECT}/picture-climb/`);
  console.error("==================================================================");
}
main().catch((e) => { console.error("FATAL:", e.message, "\n", e.stack); process.exit(1); });
