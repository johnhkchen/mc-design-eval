// IMPURE RUNNER — E-24 surface-pattern pass on the cottage (S-087 / T-087-01). The zone-filled skin is
// watertight and base-coated but does not READ cleanly: the roof's height field is a chunky jumble
// (dents/pits accreted across passes) and the zones carry stray-material salt (isolated off-dominant
// specks that survived zoneFill's occupancy-connectivity minRun test). Two pure ops fix the PATTERN:
// regularizeRoofCourses (basin-fill the +y height field to its spill level, adds-only) then
// stripStraySalt (run/line-shaped secondaries kept, salt recolored to the zone field) — geometry first,
// pattern second, so the strip judges the final skin.
//
// THE SEAM INVARIANT: both ops + the metrics are pure src/view/surface-pattern.mjs cores (unit-tested).
// This file is impure wiring only: file I/O, the best-effort GL renders, the durable record. Mirrors the
// value-select runner (T-086-01 precedent): it CONSUMES spray-paint/cottage/artifact.json and does NOT
// touch spray-paint.mjs (T-085/T-088 turf; pipeline consolidation is the S-089/E-25 story's call).
//
// GL — run on demand, NOT in `npm test`:
//   node benchmarks/sculpture/surface-pattern.mjs            # course fill + salt strip + renders
//   node benchmarks/sculpture/surface-pattern.mjs --offline  # re-assert the committed record, no GL
//
// Writes surface-pattern/cottage.{json,md} (committed) + surface-pattern/cottage/artifact.json (the
// patterned, AJV-valid build) + before/after PNGs (gitignored). The deterministic core ALWAYS runs and
// is recorded; renders degrade to a recorded error, never a crash.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { structuralZones } from "../../src/view/structural-read.mjs";
import { regularizeRoofCourses, stripStraySalt } from "../../src/view/surface-pattern.mjs";
import { applyPaint } from "../../src/view/face-paint.mjs";
import { assertArtifact } from "../../src/artifact.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const ART_PATH = join(ROOT, "benchmarks/sculpture/spray-paint/cottage/artifact.json");
const REC_PATH = join(ROOT, "benchmarks/sculpture/spray-paint/cottage.json");
const OUT_DIR = join(ROOT, "benchmarks/sculpture/surface-pattern");
const SUBJ_DIR = join(OUT_DIR, "cottage");

/** Best-effort GL render of one angle → recorded path, or a recorded error (GL is a lens, not logic). */
async function tryRender(artifact, angle, label) {
  try {
    const { renderViews } = await import("../../src/view/multi-angle.mjs");
    const [r] = await renderViews(artifact, [angle], { outDir: SUBJ_DIR, label: () => label });
    return { angle, path: r.path.replace(ROOT, "") };
  } catch (e) {
    return { angle, error: e.message };
  }
}

async function main() {
  const offline = process.argv.includes("--offline");

  if (offline) {
    const recPath = join(OUT_DIR, "cottage.json");
    if (!existsSync(recPath)) throw new Error("surface-pattern/cottage.json absent — run the live pass first");
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    const saltOk = (rec.salt?.stripped ?? 0) > 0;
    const courseOk = (rec.course?.after?.stepSmoothness ?? 0) > (rec.course?.before?.stepSmoothness ?? 1);
    const artifact = JSON.parse(await readFile(join(SUBJ_DIR, "artifact.json"), "utf8"));
    assertArtifact(artifact); // the committed patterned build must stay AJV-valid
    console.error(`[offline] course smoothness ${rec.course.before.stepSmoothness} → ${rec.course.after.stepSmoothness} ` +
      `(${courseOk ? "improved" : "NOT improved"}); salt stripped ${rec.salt.stripped} (${saltOk ? "OK" : "none"}); AJV ok`);
    if (!saltOk || !courseOk) process.exitCode = 1;
    return;
  }

  if (!existsSync(ART_PATH)) throw new Error(`${ART_PATH} absent — run npm run spray:paint first`);
  if (!existsSync(REC_PATH)) throw new Error(`${REC_PATH} absent — run npm run spray:paint first`);
  await mkdir(SUBJ_DIR, { recursive: true });
  const artifact = JSON.parse(await readFile(ART_PATH, "utf8"));
  const sprayRec = JSON.parse(await readFile(REC_PATH, "utf8"));
  const policy = sprayRec.fill?.policy;
  if (!policy?.roof?.dominant) throw new Error("spray-paint record carries no fill.policy — re-run spray:paint");

  // ONE zoning for both ops, derived from the input build (raised cells classify roof by geometry anyway).
  const occ = artifactOccupancy(artifact);
  const { zoneOf, storeyDivide } = structuralZones(occ);

  // --- 1. ROOF-COURSE REGULARIZATION (geometry first) ----------------------------------------------
  const course = regularizeRoofCourses(occ, { dominant: policy.roof.dominant });
  console.error(`course fill: ${course.columnsRaised} columns raised, ${course.voxelsAdded} voxels added ` +
    `(${policy.roof.dominant}); smoothness ${course.before.stepSmoothness} → ${course.after.stepSmoothness}, ` +
    `cliff pairs ${course.before.cliff} → ${course.after.cliff}`);
  const courseBuild = applyPaint(artifact, course.placements);
  const occCoursed = artifactOccupancy(courseBuild);

  // --- 2. STRAY-SALT STRIP (pattern, on the final skin) --------------------------------------------
  const MIN_KEEP = 3, MIN_EXTENT = 3;
  const salt = stripStraySalt(occCoursed, { zoneOf, zones: policy, minKeep: MIN_KEEP, minExtent: MIN_EXTENT });
  console.error(`salt strip: ${salt.stripped} cells stripped, ${salt.kept} kept — ` +
    Object.entries(salt.byZone).map(([z, s]) => `${z} ${s.strippedCells}/${s.offDominant}`).join(", "));
  const patterned = applyPaint(courseBuild, salt.placements);
  assertArtifact(patterned); // the patterned build is still AJV-valid

  // --- 3. before/after renders (best-effort; the top view is where the courses read) ---------------
  const faces = [];
  for (const angle of ["front", "right", "top"]) {
    faces.push({ ...(await tryRender(artifact, angle, `${angle}-before`)), when: "before" });
    faces.push({ ...(await tryRender(patterned, angle, `${angle}-after`)), when: "after" });
  }
  for (const f of faces) console.error(`render ${f.when} ${f.angle}: ${f.path ?? `unavailable (${f.error})`}`);

  // --- 4. the durable record ------------------------------------------------------------------------
  await writeFile(join(SUBJ_DIR, "artifact.json"), JSON.stringify(patterned, null, 2) + "\n");
  const record = {
    schema: "surface-pattern/v1",
    subject: "cottage",
    inputs: { build: ART_PATH.replace(ROOT, ""), policyFrom: REC_PATH.replace(ROOT, "") },
    zones: { storeyDivide, policy },
    course: {
      dominant: policy.roof.dominant,
      columnsRaised: course.columnsRaised,
      voxelsAdded: course.voxelsAdded,
      before: course.before,
      after: course.after,
      note: "basin-fill of the +y height field to its hydrological spill level (priority-flood): " +
        "enclosed dents/pits raised in the roof dominant; draining valleys + bumps untouched by " +
        "construction (no delete — bump residual is honest). stepSmoothness = fraction of adjacent " +
        "column joints within one block; 1.0 is unreachable (legit gable/verge edges count).",
    },
    salt: {
      minKeep: MIN_KEEP,
      minExtent: MIN_EXTENT,
      stripped: salt.stripped,
      kept: salt.kept,
      byZone: salt.byZone,
      note: "off-dominant VISIBLE-SKIN cells judged by the PATTERN of their same-material skin " +
        "component (whole-skin 6-connected — the chimney crosses zones): kept iff size>=minKeep AND " +
        "max-extent>=minExtent (a run/line: studs, trim, the chimney shaft); salt recolored to the " +
        "cell's zone dominant. Material legality was zoneFill's gate; this judges pattern.",
    },
    placements: { courseAdds: course.placements.length, saltRecolors: salt.placements.length },
    faces,
    note: "surface-pattern pass (S-087): coverage ≠ a clean pattern — this raises the READ of the " +
      "already watertight (S-084), base-coated (S-085) skin. Consumes the spray-paint build; " +
      "spray-paint.mjs deliberately untouched (pipeline consolidation is S-089/E-25).",
  };
  await writeFile(join(OUT_DIR, "cottage.json"), JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, "cottage.md"), renderMd(record));
  console.error(`\n✓ wrote ${join(OUT_DIR, "cottage.json")} + artifact.json`);
}

function renderMd(r) {
  const m = (s) => `pairs ${s.pairs}, flat ${s.flat}, step1 ${s.step1}, cliff ${s.cliff}, ` +
    `smoothness **${s.stepSmoothness}**, mean|Δy| ${s.meanAbsStep}`;
  const zoneLine = Object.entries(r.salt.byZone)
    .map(([z, s]) => `${z} ${s.strippedCells}/${s.offDominant} stripped (` +
      Object.entries(s.byBlock).map(([b, t]) => `${b} −${t.stripped}/+${t.kept}`).join(", ") + ")")
    .join("; ");
  const faces = r.faces.map((f) => `- ${f.when} ${f.angle}: ${f.path ?? `GL unavailable (${f.error})`}`).join("\n");
  return `# Surface-pattern — cottage (T-087-01)\n\n` +
    `## Roof courses (basin-fill, \`${r.course.dominant}\`)\n` +
    `${r.course.columnsRaised} columns raised / ${r.course.voxelsAdded} voxels added.\n` +
    `- before: ${m(r.course.before)}\n- after: ${m(r.course.after)}\n\n` +
    `## Stray salt (minKeep ${r.salt.minKeep}, minExtent ${r.salt.minExtent})\n` +
    `**${r.salt.stripped} cells stripped**, ${r.salt.kept} kept as runs/lines.\n${zoneLine}\n\n` +
    `## Renders\n${faces}\n\n> ${r.note}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
