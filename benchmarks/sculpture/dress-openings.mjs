// IMPURE RUNNER — opening dressing (T-099-01, story S-099, epic E-26). The witnessed case: the
// cottage concept's windows have trapdoor shutters and lattice infill; the shipped durable skin's
// windows are SEALED PANES (probed: the skin pipeline filled the through-holes, `openings` finds
// zero). This runner walks the openings the concept declared — measured on the RAW pre-seal build,
// the E-25 openingRegions precedent — and applies the kit's treatment to the shipped artifact.
//
// THE LADDER (deterministic steps gate; renders are evidence — `reproducibility-excludes-gl-from-
// decisions`):
//   1. TREATMENTS  — kit/v1 record → slots (derivations + unfulfilled logged and recorded).
//   2. APERTURES   — extractApertures(refOcc); zero apertures is a wiring bug here, hard fail.
//   3. DETERMINISM — the pure core twice on fresh occupancies; placements must be byte-identical.
//   4. GATE        — applyDressing → assertArtifact (the live AJV gate), sha256 recorded.
//   5. INTEGRITY   — openings on the target before vs after (every window aperture re-detected,
//                    dressed); closureCheck closed-with-dressing under openingRegions(dressedOcc);
//                    strayFixtures empty under the composed allow-list (op regions, design D8).
//   6. ACCEPTANCE  — every window fully dressed (infill + both shutters + lintel + sill) or exit 1.
//                    Door: none-detected is a NAMED honesty row (the cottage doorway is not a
//                    through-hole — design D7), recorded, not fatal; a detected door must be framed.
//   7. RENDERS     — before/after at the angles where the windows are visible + committed frames.
//
// THE SEAM INVARIANT: pure logic lives in src/view/opening-dressing.mjs (unit-tested offline);
// this file is wiring only (file I/O, GL, the durable record).
//
//   npm run dress:cottage                # the full ladder + renders + frames
//   npm run dress:cottage -- --offline   # re-assert the committed record + artifact hash, no GL
//
// Writes dress-openings/<subj>.{json,md} (committed) + dress-openings/<subj>/artifact.json (the
// dressed build, committed) + PNGs (gitignored) + pr/assets/frames/dress-<subj>-{before,after}.png.

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { openings } from "../../src/view/structural-read.mjs";
import { openingRegions, closureCheck, strayFixtures, SIDE_FACES } from "../../src/view/shell-integrity.mjs";
import {
  treatmentsFromKit, extractApertures, dressOpenings, applyDressing,
} from "../../src/view/opening-dressing.mjs";
import { assertArtifact } from "../../src/artifact.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "dress-openings");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");

// THE SUBJECT REGISTRY — data only (the durable-skin pattern): the shipped target, the raw
// reference whose openings the concept declared, the recognized kit, and the angles where this
// subject's windows are visible (cottage: the through-windows live on the ±x elevations).
export const SUBJECTS = {
  cottage: {
    key: "cottage",
    target: "durable-skin/cottage/artifact.json",
    ref: "concept-materials/cottage/after-artifact.json",
    kit: "kit/cottage.json",
    angles: ["right", "+x+z", "-x-z"],
    frameAngle: "+x+z",
  },
};

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

async function tryRender(artifact, angle, label, subjDir) {
  try {
    const { renderViews } = await import("../../src/view/multi-angle.mjs");
    const [r] = await renderViews(artifact, [angle], {
      outDir: subjDir, label: () => label, width: 1024, height: 1024,
    });
    return { angle, path: r.path.replace(ROOT, "") };
  } catch (e) {
    return { angle, error: e.message };
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const def = SUBJECTS[argv[argv.indexOf("--subject") + 1]];
  if (!def) throw new Error(`--subject must be one of: ${Object.keys(SUBJECTS).join(", ")}`);
  const offline = argv.includes("--offline");
  const subjDir = join(OUT_DIR, def.key);
  const recPath = join(OUT_DIR, `${def.key}.json`);
  const artPath = join(subjDir, "artifact.json");

  if (offline) {
    if (!existsSync(recPath) || !existsSync(artPath)) {
      throw new Error(`committed record/artifact absent — run npm run dress:${def.key} first`);
    }
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    const artBytes = await readFile(artPath, "utf8");
    assertArtifact(JSON.parse(artBytes));
    const checks = {
      sha: sha256(artBytes) === rec.reproducible?.sha256,
      windows: rec.acceptance?.windowsFullyDressed === true,
      closure: rec.integrity?.closure?.closed === true && (rec.integrity?.closure?.dressedCells ?? 0) > 0,
      strays: rec.integrity?.strayFixturesComposed === 0,
      reopened: (rec.integrity?.openingsAfter ?? 0) >= (rec.integrity?.openingsBefore ?? 0) &&
        (rec.integrity?.openingsAfter ?? 0) > 0,
    };
    const ok = Object.values(checks).every(Boolean);
    console.error(`[offline] ${def.key}: artifact sha ${checks.sha ? "MATCHES" : "DIVERGES"}; ` +
      `windows ${checks.windows ? "fully dressed" : "VIOLATED"}; closure ${checks.closure ? "closed+dressed" : "VIOLATED"}; ` +
      `strays ${checks.strays ? "none" : "VIOLATED"}; openings re-detected ${checks.reopened ? "OK" : "VIOLATED"}; AJV ok`);
    if (!ok) process.exitCode = 1;
    return;
  }

  await mkdir(subjDir, { recursive: true });
  await mkdir(FRAMES_DIR, { recursive: true });

  const target = JSON.parse(await readFile(join(HERE, def.target), "utf8"));
  const ref = JSON.parse(await readFile(join(HERE, def.ref), "utf8"));
  const kitRec = JSON.parse(await readFile(join(HERE, def.kit), "utf8"));
  assertArtifact(target);
  if (kitRec.schema !== "kit/v1") throw new Error(`${def.kit} is not a kit/v1 record`);

  // ---- 1. TREATMENTS -------------------------------------------------------------------------
  const treatments = treatmentsFromKit(kitRec);
  console.error(`[${def.key}] treatments: ` + Object.entries(treatments.slots)
    .map(([s, v]) => `${s}=${v.block}(${v.source})`).join(", "));
  for (const d of treatments.derivations) console.error(`[${def.key}] derived ${d.slot}: ${d.block} ← ${d.from} (${d.reason})`);
  for (const u of treatments.unfulfilled) console.error(`[${def.key}] unfulfilled ${u.slot}: ${u.reason}`);

  // ---- 2. APERTURES (measured on the reference — the openings the concept declared) ------------
  const refOcc = artifactOccupancy(ref);
  const apertures = extractApertures(refOcc);
  if (!apertures.length) throw new Error("no apertures on the reference build — wiring bug, not a result");
  const windows = apertures.filter((a) => a.kind === "window");
  const doors = apertures.filter((a) => a.kind === "door");
  console.error(`[${def.key}] apertures: ${windows.length} window face-openings, ${doors.length} doors ` +
    `(${apertures.map((a) => `${a.dir}:${a.kind}`).join(", ")})`);

  // ---- 3. DETERMINISM (the pure core twice, fresh occupancies) ---------------------------------
  const r1 = dressOpenings(artifactOccupancy(target), apertures, treatments);
  const r2 = dressOpenings(artifactOccupancy(target), apertures, treatments);
  if (JSON.stringify(r1.placements) !== JSON.stringify(r2.placements)) {
    throw new Error("NON-DETERMINISTIC: two dressings of the same target diverged");
  }
  console.error(`[${def.key}] reproducible: double-run placements identical (${r1.placements.length} placements, ` +
    `${r1.stats.conflicts} conflicts, ${r1.stats.alreadyDressed} already dressed)`);
  for (const o of r1.perOpening) {
    console.error(`  ${o.dir} ${o.kind} u${o.bbox.u0}..${o.bbox.u1} v${o.bbox.v0}..${o.bbox.v1} planeW=${o.planeW}: ` +
      Object.entries(o.applied).filter(([, n]) => n > 0).map(([s, n]) => `${s}=${n}`).join(" ") +
      (o.conflicts.length ? ` CONFLICTS ${o.conflicts.map((c) => `${c.slot}:${c.name}→${c.reduction}`).join(", ")}` : ""));
  }

  // ---- 4. GATE ---------------------------------------------------------------------------------
  const dressed = applyDressing(target, r1.placements);
  assertArtifact(dressed);
  const artJson = JSON.stringify(dressed, null, 2) + "\n";
  const artSha = sha256(artJson);
  console.error(`[${def.key}] gate: dressed artifact passes the live AJV validator (${dressed.placements.length} placements)`);

  // ---- 5. INTEGRITY ----------------------------------------------------------------------------
  const occBefore = artifactOccupancy(target);
  const occAfter = artifactOccupancy(dressed);
  const count = (occ) => SIDE_FACES.reduce((n, d) => n + openings(occ, d).length, 0);
  const openingsBefore = count(occBefore);
  const openingsAfter = count(occAfter);
  const afterDressed = SIDE_FACES.flatMap((d) => openings(occAfter, d)).filter((o) => o.dressing.cells > 0).length;
  const regionsAfter = openingRegions(occAfter);
  const closure = closureCheck(occAfter, { regions: regionsAfter });
  const straysBare = strayFixtures(occAfter, regionsAfter).length;
  const straysComposed = strayFixtures(occAfter, [...regionsAfter, ...r1.regions]).length;
  console.error(`[${def.key}] integrity: openings ${openingsBefore} before → ${openingsAfter} after ` +
    `(${afterDressed} report dressing); closure ${closure.closed ? "CLOSED" : "BREACHED"} ` +
    `(${closure.dressed.cells} dressed cells); strays ${straysBare} bare → ${straysComposed} composed`);
  if (openingsAfter < windows.length) {
    throw new Error(`dressed apertures not re-detected as openings: ${openingsAfter} < ${windows.length}`);
  }
  if (!closure.closed) throw new Error("closure BREACHED on the dressed build — dressing must not open the shell");
  if (straysComposed !== 0) throw new Error(`${straysComposed} stray fixtures under the composed allow-list`);

  // ---- 6. ACCEPTANCE ---------------------------------------------------------------------------
  const windowReports = r1.perOpening.filter((o) => o.kind === "window");
  const badWindows = windowReports.filter((o) => o.conflicts.length > 0 ||
    o.applied.infill === 0 || o.applied.shutterLeft === 0 || o.applied.shutterRight === 0 ||
    o.applied.lintel === 0 || o.applied.sill === 0);
  if (badWindows.length) {
    throw new Error(`${badWindows.length} window(s) not fully dressed: ` +
      badWindows.map((o) => `${o.dir} ${JSON.stringify(o.conflicts)}`).join("; "));
  }
  const doorReports = r1.perOpening.filter((o) => o.kind === "door");
  const doorRow = doorReports.length
    ? { detected: doorReports.length, framed: doorReports.every((o) => o.applied.door > 0 && o.applied.lintel > 0) }
    : { detected: 0, note: "none-detected: the doorway is not a through-hole; `openings` is silhouette-" +
        "based and cannot see it (T-099 design D7 — named honesty row, detector gap for S-101)" };
  if (doorReports.length && !doorRow.framed) throw new Error("a detected door was not framed");
  console.error(`[${def.key}] acceptance: ${windowReports.length}/${windowReports.length} windows fully dressed; ` +
    `door: ${doorReports.length ? "framed" : "none detected (recorded)"}`);

  // ---- 7. RENDERS + FRAMES (evidence) -----------------------------------------------------------
  const renders = [];
  for (const angle of def.angles) {
    renders.push({ when: "before", ...(await tryRender(target, angle, `before-${angle}`, subjDir)) });
    renders.push({ when: "after", ...(await tryRender(dressed, angle, `after-${angle}`, subjDir)) });
  }
  for (const r of renders) console.error(`render ${r.when} ${r.angle}: ${r.path ?? `unavailable (${r.error})`}`);
  const frames = [];
  for (const when of ["before", "after"]) {
    const r = renders.find((x) => x.when === when && x.angle === def.frameAngle && x.path);
    if (r) {
      await copyFile(join(ROOT, r.path), join(FRAMES_DIR, `dress-${def.key}-${when}.png`));
      frames.push(`pr/assets/frames/dress-${def.key}-${when}.png`);
    }
  }

  // ---- the durable record -----------------------------------------------------------------------
  await writeFile(artPath, artJson);
  const record = {
    schema: "dress-openings/v1",
    subject: def.key,
    inputs: { target: def.target, ref: def.ref, kit: def.kit },
    treatments: {
      slots: treatments.slots, derivations: treatments.derivations,
      unfulfilled: treatments.unfulfilled, ignored: treatments.ignored,
    },
    apertures: apertures.map((a) => ({ dir: a.dir, kind: a.kind, bbox: a.bbox, region: a.region, cells: a.cells.length })),
    dressing: {
      placements: r1.placements.length, stats: r1.stats, perOpening: r1.perOpening, regions: r1.regions,
      note: "apertures measured on the RAW reference (the openings the concept declared — the E-25 " +
        "openingRegions precedent); sealed panes re-opened by last-write-wins replacement.",
    },
    integrity: {
      openingsBefore, openingsAfter, openingsReportingDressing: afterDressed,
      closure: { closed: closure.closed, dressedCells: closure.dressed.cells },
      strayFixturesBare: straysBare, strayFixturesComposed: straysComposed,
      note: "strays composed = openingRegions(dressed) ∪ the op's placement-footprint regions (D8).",
    },
    acceptance: { windowsFullyDressed: true, windows: windowReports.length, door: doorRow },
    reproducible: {
      doubleRun: true, sha256: artSha,
      determinism: "no LLM on this path — the kit record, raw reference, and shipped target are " +
        "committed inputs; the dressing core is pure. Two executions placement-matched.",
    },
    renders, frames,
  };
  await writeFile(recPath, JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, `${def.key}.md`), renderMd(record));
  console.error(`\n✓ wrote ${recPath} + ${artPath} (sha256 ${artSha.slice(0, 12)}…)`);
}

function renderMd(r) {
  const slotLine = Object.entries(r.treatments.slots)
    .map(([s, v]) => `\`${s}\` → \`${v.block}\` (${v.source})`).join(" · ");
  const rows = r.dressing.perOpening.map((o) =>
    `| ${o.dir} | ${o.kind} | u${o.bbox.u0}..${o.bbox.u1} v${o.bbox.v0}..${o.bbox.v1} | ` +
    Object.entries(o.applied).filter(([, n]) => n > 0).map(([s, n]) => `${s}=${n}`).join(" ") + ` | ` +
    (o.conflicts.length ? o.conflicts.map((c) => `${c.slot}:${c.name}→${c.reduction}`).join("; ") : "—") + ` |`)
    .join("\n");
  const renders = r.renders.map((f) => `- ${f.when} ${f.angle}: ${f.path ?? `GL unavailable (${f.error})`}`).join("\n");
  return `# Opening dressing — ${r.subject} (T-099-01)\n\n` +
    `The kit's declared treatment applied to every opening the concept declared. ` +
    `**Reproducible**: double-run placement-identical, dressed artifact sha256 \`${r.reproducible.sha256.slice(0, 16)}…\`.\n\n` +
    `## Treatments (from \`${r.inputs.kit}\`)\n${slotLine}\n` +
    (r.treatments.derivations.length
      ? r.treatments.derivations.map((d) => `- derived: \`${d.block}\` ← \`${d.from}\` — ${d.reason}`).join("\n") + "\n" : "") +
    (r.treatments.unfulfilled.length
      ? r.treatments.unfulfilled.map((u) => `- unfulfilled: ${u.slot} — ${u.reason}`).join("\n") + "\n" : "") +
    `\n## Openings (measured on \`${r.inputs.ref}\`)\n\n` +
    `| face | kind | bbox | applied | conflicts |\n|---|---|---|---|---|\n${rows}\n\n` +
    `${r.dressing.placements} placements; ${r.dressing.stats.conflicts} conflicts; ` +
    `${r.dressing.stats.alreadyDressed} already dressed.\n\n` +
    `## Integrity (T-097 semantics)\n` +
    `- openings on the shipped target: **${r.integrity.openingsBefore} before → ${r.integrity.openingsAfter} after** ` +
    `(${r.integrity.openingsReportingDressing} report dressing) — the sealed panes are OPENINGS again, dressed.\n` +
    `- closure: ${r.integrity.closure.closed ? "**CLOSED**" : "**BREACHED**"} with ` +
    `${r.integrity.closure.dressedCells} dressed cells (dressed ≠ hole, dressed ≠ wall).\n` +
    `- stray fixtures: ${r.integrity.strayFixturesBare} under bare openingRegions → ` +
    `**${r.integrity.strayFixturesComposed}** under the composed allow-list.\n\n` +
    `## Acceptance\n` +
    `- windows: **${r.acceptance.windows}/${r.acceptance.windows} fully dressed** ` +
    `(infill + both shutters + lintel + sill).\n` +
    `- door: ${r.acceptance.door.detected ? "framed" : `none detected — ${r.acceptance.door.note}`}\n\n` +
    `## Renders\n${renders}\n\nFrames: ${r.frames.join(", ") || "(none — GL unavailable)"}\n\n` +
    `> ${r.reproducible.determinism}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
