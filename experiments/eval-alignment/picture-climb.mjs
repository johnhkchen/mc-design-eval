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
import { gableRecord, generateRoof } from "../../src/view/roof-generate.mjs";
import { constructWalls } from "../../src/view/wall-generate.mjs";
import { wallSkin } from "../../src/view/wall-skin.mjs";
import { extractApertures, dressOpenings } from "../../src/view/opening-dressing.mjs";
import { frameArchPlacements } from "../../src/view/arch-frame.mjs";
import { carveTargetCells, apertureCoherenceGate, carveAperture } from "../../src/view/aperture-carve.mjs";
import { buildWallRelief } from "../../src/view/wall-relief.mjs";
import { composeRoofTreatment, bareBlock } from "../../src/view/treatment-grammar.mjs";
import { roleBlock } from "../../src/recognition/compile.mjs";
import { infillPanel } from "../../src/view/facade-articulation.mjs";
import { rebuildArtifact } from "../../src/view/shell-integrity.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";
import { renderBesideConcept, assertGlAvailable } from "../../src/view/render-beside.mjs";
import { requestText } from "../../src/sdk-binding.mjs";

import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { loadStylePack } from "../../src/pack/style-pack.mjs";
import { runTieredOp } from "../../src/model-tier.mjs";
import { bamlRender, bamlParse } from "../../src/baml/bridge.mjs";
import { diagnoseRenderArgs } from "../../src/workshop/diagnose.mjs";
import { critiqueEvidence, itemStyleClass, styleFidelityScore } from "../../src/workshop/bakeoff-score.mjs";
import { acceptsRound, stoppingDecision, classifyInventory, deptMajorCounts, deptItemCounts, buildDigest, TOOL_DEPARTMENTS, CLIMB_DEFAULTS } from "../../src/workshop/climb-gate.mjs";
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
const { margin, stallK, maxRounds, minRounds } = CLIMB_DEFAULTS;
const GUARD_ONLY = process.env.GUARD_ONLY === "1";
const ROOF_MATERIAL_PROBE = process.env.ROOF_MATERIAL_PROBE === "1"; // T-189-01: render the brown→grey roof glance, zero spend

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const toB64 = async (p) => {
  const buf = await readFile(p);
  const mediaType = buf.slice(0, 3).toString("hex") === "ffd8ff" ? "image/jpeg" : "image/png";
  return { base64: buf.toString("base64"), mediaType };
};
const parse = (t) => { const s = t.indexOf("{"), e = t.lastIndexOf("}"); return JSON.parse(t.slice(s, e + 1)); };
const occToCells = (occ) => {
  const out = [];
  for (const [key, block] of occ.cells) out.push({ pos: key.split(",").map(Number), block, form: occ.forms.get(key), state: occ.states.get(key) });
  return out;
};

// ====================== the three HANDS (reused verbatim from autonomy-loop.mjs) ======================
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
  const gable = gableRecord({ footprint: { x0, x1, z0, z1 }, ridgeAxis: CFG.ridgeAxis, eaveY: CFG.eaveY, ridgeY: CFG.eaveY + Math.floor(perp / 2), pitch: 1, hip: { demanded: false } });
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

  const { remove, target } = carveTargetCells(occ, declared, { programW: door.w, scale });
  if (!remove.size) { console.error("  [carve_arch] nothing to carve (slot already at width) — framing only"); return frame_arch(occ); }
  const carved = carveAperture(occ, remove);
  const wideAp = apertureFromTarget(target);
  const { placements, perOpening } = frameArchPlacements(carved, [wideAp], { frameBlock });
  const dressed = occupancyFromCells([...occToCells(carved), ...placements.map((p) => ({ pos: p.pos, block: p.block }))]);

  const gate = apertureCoherenceGate(occ, dressed, target, { floor: occ.bounds.min[1], eaveY: CFG.eaveY });
  for (const r of perOpening) console.error(`  [carve_arch] ${r.dir}: width=${target.width} carved=${remove.size} framed=${r.framed} arched=${r.arched}`);
  console.error(`  [carve_arch] gate ok=${gate.ok}${gate.reason ? ` — ${gate.reason}` : ""} (scope=${gate.scope.ok} coherent=${gate.coherent.ok} closure=${gate.closure.ok})`);
  if (gate.ok) return dressed;
  console.error("  [carve_arch] REFUTE: aperture-coherence gate rejected the carve — reverting to recess-only (frame_arch)");
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

const TOOLS = { apply_gable_roof, recolor_roof, construct_walls, add_timber_framing, frame_arch, carve_arch, articulate_walls, relief_walls, band_eave };
const MENU = [
  "- apply_gable_roof: replace the roof with a crisp parametric gable. Best when the worst divergence is the ROOF FORM/SHAPE/presence (not its colour).",
  "- recolor_roof: rebuild the roof in the CONCEPT-TRUE material recognition read (e.g. grey stone when the concept roof is stone, not the program's default brown timber). Best when the worst divergence is ROOF COLOUR / MATERIAL — the roof reads the wrong material vs the concept.",
  "- construct_walls: REBUILD the wall envelope and skin it as construction from the pack roles (per-storey material, dressed quoins, clinker courses, a plinth, dressed openings). Best for STRUCTURAL wall holes / missing walls / a monotone single-material wall.",
  "- add_timber_framing: add timber-frame studs + plaster infill on the upper storey. Best for a uniform/monotone WALL with no material contrast / missing half-timber detail.",
  "- frame_arch: build a dark-timber FRAME + arch head over the through-passage(s). Best when the worst divergence is the OPENING — a raw/undressed passage void with no arch head or timber surround.",
  "- carve_arch: CARVE the declared gate WIDER then frame + arch it (the only tool that can WIDEN an opening). Best when the OPENING divergence is a NARROW slot where the concept shows a WIDE arched gate — frame_arch can only frame the narrow slot, this opens it. Self-reverts to a frame if the carve can't stay clean.",
  "- articulate_walls: recolor the wall field to the pale dressed stone, keeping the rubble corner quoins. Best when the WALL field reads too dark/monotone, killing the contrast with the corner quoins.",
  "- relief_walls: build proud dressed-stone RELIEF — recolor the field pale AND stand cobblestone quoins + a plinth course PROUD of it (construction, not a flat recolor). Best when the WALL reads flat: the dressed field must read DISTINCT FROM / recessed behind the rough rubble corners, not just a colour swap.",
  "- band_eave: add a lighter-stone eave/verge banding course along the roof edges. Best when the ROOF field runs to the edges with no contrasting eave/verge trim band.",
  "- done: stop — the build reads like the concept, or no tool addresses the worst remaining divergence.",
].join("\n");

// ============================= the GRADIENT: picture-anchored DiagnoseBuild =============================
let PROGRAM, PACK, CONCEPT_IMG;            // loaded once in main (after the guard)

const itemsOf = (critique) => (critique?.items ?? []).map((it) => ({
  department: it.department, severity: it.severity, present: it.present ?? "", missing: it.missing ?? "",
  kind: it.kind ?? null, styleClass: itemStyleClass(it),
}));

/** One DiagnoseBuild → {ev, items, score}. No re-ask (a zero-token notice only burns budget). */
async function diagnose(renders) {
  const args = diagnoseRenderArgs({ program: PROGRAM, pack: PACK, azimuths: AZIMUTHS });
  const { prompt, images } = await bamlRender({ fn: "DiagnoseBuild", args, images: { concept: CONCEPT_IMG, renders } });
  const { text } = await runTieredOp({ tier: TIER, prompt, images });
  const critique = await bamlParse({ fn: "DiagnoseBuild", text });
  return { ev: critiqueEvidence(critique), items: itemsOf(critique), score: styleFidelityScore(critique) };
}

/** Render the four azimuths + the beside sheet, then score the build by VOTES median DiagnoseBuild. */
async function scoreBuild(occ, template, round, tag) {
  const roundDir = join(ROOT, `builds/${SUBJECT}/picture-climb/round-${round}`);
  const artifact = rebuildArtifact(occ, template);
  await renderViews(artifact, AZIMUTHS, { outDir: roundDir, label: (a) => a, width: 512, height: 512 });
  await renderBesideConcept(artifact, join(ROOT, CONCEPT), join(roundDir, "beside-concept.png"), { label: `r${round}` });
  if (GUARD_ONLY) return { score: null, dir: roundDir }; // render seam proven, no spend
  const renders = await Promise.all(AZIMUTHS.map((a) => toB64(join(roundDir, `view-${a}.png`))));
  const samples = [];
  for (let v = 0; v < VOTES; v++) {
    try { samples.push(await diagnose(renders)); }
    catch (e) { console.error(`  [${tag} r${round}] vote ${v + 1} dropped (malformed, no re-ask): ${e.message}`); }
  }
  if (!samples.length) throw new Error(`scoreBuild: all ${VOTES} diagnoses failed at round ${round}`);
  const scores = samples.map((s) => s.score);
  const med = samples.find((s) => s.score === median(scores)) ?? samples[0];
  return { ...med.ev, score: med.score, items: med.items, scores, dir: roundDir };
}

const evOf = (b) => ({ score: b.score, nItems: b.nItems, nMajor: b.nMajor, nWrongStyle: b.nWrongStyle, wrongStyleBreadth: b.wrongStyleBreadth, departments: b.departments, missing: b.missing });

async function agentPick(build, history) {
  const top = [...build.items].sort((a, b) => (a.severity === "major" ? 0 : 1) - (b.severity === "major" ? 0 : 1))
    .slice(0, 5).map((it) => `  - ${it.department} (${it.severity}, ${it.kind ?? "?"}): ${it.missing || it.present || "diverges"}`).join("\n");
  const hist = history.length
    ? history.map((h) => `- ${h.tool}: score ${h.qBefore}→${h.qAfter} (${h.accepted ? "KEPT" : "ROLLED BACK — " + h.reason})`).join("\n")
    : "(nothing tried yet)";
  const prompt = [
    "You improve a Minecraft build to look like its CONCEPT IMAGE. A picture-critique reports the build's",
    `current divergences from the concept (picture-fidelity score ${build.score}/100, higher = closer):`,
    top || "  (no items — the build reads like the concept)",
    "Tools already applied, and whether the accept-gate KEPT them (kept only if they moved toward the concept):",
    hist,
    "RULES:",
    "- A tool that was ROLLED BACK did not move this build toward the concept — do NOT pick it again.",
    "- If no tool addresses the worst remaining divergence (e.g. it names a chimney, an interior, or fine",
    "  trim no tool builds), pick `done` — naming a defect you cannot fix is the honest answer.",
    "Pick ONE tool:", MENU,
    'Output ONE JSON: {"tool":"<apply_gable_roof|recolor_roof|construct_walls|add_timber_framing|frame_arch|carve_arch|articulate_walls|relief_walls|band_eave|done>","reason":"<short>"}',
  ].join("\n");
  const { text } = await requestText({ prompt, model: AGENT_MODEL });
  return parse(text);
}

// ===================================== the loop with the accept-gate =====================================
async function main() {
  const guard = [SEED_ARTIFACT, PROGRAM_PATH, PACK_PATH, MATERIAL_MAP_PATH, CONCEPT];
  for (const rel of guard) if (!existsSync(join(ROOT, rel))) throw new Error(`missing asset: ${rel}`);
  assertGlAvailable();
  console.error(`[guard] assets present; GL available. subject=${SUBJECT} azimuths=${AZIMUTHS.join(",")} votes=${VOTES} margin=${margin}`);

  const template = JSON.parse(readFileSync(join(ROOT, SEED_ARTIFACT), "utf8"));
  let occ = artifactOccupancy(template);

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
    console.error(`[ROOF_MATERIAL_PROBE] wrote seed/gable-brown/recolored beside sheets to ${outDir}; no spend; exiting clean.`);
    return;
  }

  if (GUARD_ONLY) {
    await scoreBuild(occ, template, 0, "guard"); // renders round-0 views + beside sheet, zero spend
    console.error(`[guard] GUARD_ONLY — round-0 renders + beside sheet written; no spend; exiting clean.`);
    return;
  }

  PROGRAM = JSON.parse(await readFile(join(ROOT, PROGRAM_PATH), "utf8"));
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

  const trajectory = [];
  const history = [];
  let prev = await scoreBuild(occ, template, 0, "seed");
  let prevDigest = buildDigest(occToCells(occ)); // the kept build's digest (T-190-01 no-op guard)
  let pick = await agentPick(prev, history);
  console.error(`\n[round 0] score=${prev.score} (${prev.scores.join("/")}) → agent picks ${pick.tool}: ${pick.reason}`);
  trajectory.push({ round: 0, score: prev.score, evidence: evOf(prev), items: prev.items, pick, applied: false, accepted: false });

  let noAcceptStreak = 0, stopReason = "maxRounds", round = 1;
  for (; round <= maxRounds; round++) {
    if (pick.tool === "done" || !TOOLS[pick.tool]) { stopReason = "agent-done"; break; }
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
        pick, applied: true, accepted: false, gate: { accept: false, delta: 0, reason: "no-op (identical build)" }, noop: true });
      pick = await agentPick(prev, history);
      console.error(`           next: ${pick.tool} — ${pick.reason}`);
      const stopNoop = stoppingDecision({ round, agentDone: pick.tool === "done", noAcceptStreak, margin, stallK, maxRounds, minRounds });
      if (stopNoop.stop) { stopReason = stopNoop.reason; break; }
      continue;
    }

    const candScore = await scoreBuild(cand, template, round, "cand");
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
    const gate = acceptsRound(prev, candScore, { margin, targetDepartments, beforeDeptMajors, afterDeptMajors, beforeDeptItems, afterDeptItems });
    if (gate.accept) { occ = cand; prevDigest = candDigest; }
    noAcceptStreak = gate.accept ? 0 : noAcceptStreak + 1;
    history.push({ tool: pick.tool, qBefore: prev.score, qAfter: candScore.score, accepted: gate.accept, reason: gate.reason });
    console.error(`[round ${round}] ${pick.tool}: ${prev.score}→${candScore.score} (${candScore.scores.join("/")}) — ${gate.accept ? "KEPT" : "ROLLED BACK"} (${gate.reason})`);

    trajectory.push({ round, score: prev.score, evidence: evOf(prev), items: prev.items,
      pick, applied: true, accepted: gate.accept, gate, scoreAfter: { score: candScore.score, scores: candScore.scores },
      targetDepartments, deptMajorsBefore: beforeDeptMajors, deptMajorsAfter: afterDeptMajors,
      deptItemsBefore: beforeDeptItems, deptItemsAfter: afterDeptItems });

    prev = gate.accept ? candScore : prev;
    pick = await agentPick(prev, history);
    console.error(`           next: ${pick.tool} — ${pick.reason}`);
    const stop = stoppingDecision({ round, agentDone: pick.tool === "done", noAcceptStreak, margin, stallK, maxRounds, minRounds });
    if (stop.stop) { stopReason = stop.reason; break; }
  }
  // terminal entry carries the FINAL build score (so classifyInventory's scoreLast reads the kept build)
  trajectory.push({ round, score: prev.score, items: [], pick: { tool: "—" }, applied: false, accepted: false, terminal: true });

  const inventory = classifyInventory(trajectory, { margin });
  const spread = trajectory.filter((t) => t.scoreAfter?.scores).flatMap((t) => t.scoreAfter.scores);
  const out = {
    schema: "picture-climb/v1", subject: SUBJECT, seed: SEED_ARTIFACT, program: PROGRAM_PATH, pack: "rustic",
    concept: CONCEPT, tier: TIER, votes: VOTES, margin, stopReason,
    observedScoreSpread: { min: Math.min(...prev.scores), max: Math.max(...prev.scores), allRoundVotes: spread },
    trajectory, inventory,
  };
  const outPath = join(ROOT, process.env.CLIMB_OUT ?? "docs/active/work/T-188-01/trajectory.json");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(out, null, 2) + "\n");

  const trend = trajectory.map((t) => t.score).join(" → ");
  console.error(`\n================ PICTURE-DRIVEN CLIMB (gatehouse) ================`);
  console.error(`trend: ${trend}  (Δ ${inventory.verdict.delta >= 0 ? "+" : ""}${inventory.verdict.delta}; stop: ${stopReason})`);
  console.error(`verdict: climbed=${inventory.verdict.climbed} stalled=${inventory.verdict.stalled} oscillated=${inventory.verdict.oscillated} actionable=${inventory.verdict.actionableFrac}`);
  console.error(`acted-on: ${inventory.actedOn.map((a) => a.department).join(", ") || "(none)"}`);
  console.error(`eyes-only (named, no lever): ${inventory.eyesOnly.map((e) => e.department).join(", ") || "(none)"}`);
  console.error(`wrote ${outPath} + per-round beside renders under builds/${SUBJECT}/picture-climb/`);
  console.error("==================================================================");
}
main().catch((e) => { console.error("FATAL:", e.message, "\n", e.stack); process.exit(1); });
