// IMPURE RUNNER — E-25 shell-integrity pass on the witnessed artifacts (S-091 / T-091-01). Three
// geometric defects no prior gate caught: FLOATING DEBRIS (the committed cottage skin carries 23
// 6-connected components — 126 cells off the main mass, visible around the silhouette in every render),
// SHELL VOIDS (the gatehouse build has a missing-mass cavity its concept does not show), and PLAN-ONLY
// CLOSURE (S-084 verified the roof from the sky; oblique views still found sky through the shell).
//
// Pipeline per subject (all pure src/view/shell-integrity.mjs cores, unit-tested):
//   componentStrip (keep largest + grounded, declare everything) → rebuildArtifact (no air op — a strip
//   is a REBUILD) → structuralZones + census dominants (the build's own exposure-shell majority per
//   zone — no E-21 map needed, E-25 Rule 3) → openingRegions (the build's declared door/window/arch
//   through-openings = the allow-list) → fillVoids (depth-basin repair, relief floor minDepth) →
//   plugClosure → closureCheck MUST report closed (a gate, not a logger — the run THROWS otherwise).
//
// THE SEAM INVARIANT: this file is impure wiring only (file I/O, best-effort GL renders, the durable
// record). The cottage AC numbers (23 → 1 components, 126 cells stripped) are HARD-ASSERTED — drift
// fails loudly. DETERMINISM (E-24 Rule 2): the core runs twice; the two final artifacts must be
// byte-identical (recorded sha256, re-checked by --offline).
//
// GL — run on demand, NOT in `npm test`:
//   npm run shell:cottage                 # strip + repair + closure gate + renders + record
//   npm run shell:gatehouse
//   npm run shell:cottage -- --offline    # re-assert the committed record + artifact hash, no GL
//
// Writes shell-integrity/<subj>.{json,md} (committed) + shell-integrity/<subj>/artifact.json (the
// repaired build) + PNGs (gitignored) + pr/assets/frames/shell-<subj>-{before,after}.png (committed
// evidence frames, oblique 135° — the angle the plan-only closure failed on).

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { artifactOccupancy } from "../../src/view/occupancy.mjs";
import { structuralZones } from "../../src/view/structural-read.mjs";
import { surfaceZoneHistogram } from "../../src/view/zone-fill.mjs";
import {
  componentStrip, rebuildArtifact, openingRegions, fillVoids, plugClosure, closureCheck,
} from "../../src/view/shell-integrity.mjs";
import { applyDeltas } from "../../src/view/surface-coherence.mjs";
import { assertArtifact } from "../../src/artifact.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "shell-integrity");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");

const MIN_DEPTH = 3;        // the relief floor: facade relief measures 1–2 deep; witnessed cavities ≥3
const MAX_PLUG_ITER = 8;    // plugClosure convergence cap (measured: both subjects close in 1)
const OBLIQUE = "+x-z";     // azimuth 135° — the witnessed sky-through-shell angle
const OBLIQUE2 = "-x-z";    // azimuth 225° — the durable-skin witness angle

// The witnessed artifacts. `expect` pins the ticket's AC numbers where the ticket states them.
const SUBJECTS = {
  cottage: {
    key: "cottage",
    build: "spray-paint/cottage/artifact.json",
    expect: { components: 23, strippedCells: 126, keptComponents: 1 },
  },
  gatehouse: {
    key: "gatehouse",
    build: "building/best/artifact.json",
    expect: null, // single witnessed defect is the void; strip report is recorded, not pinned
  },
};

/** Census dominants: each zone's most common block on the EXPOSURE shell (the camera's truth). */
function censusZones(occ, zoneOf) {
  const hist = surfaceZoneHistogram(occ, zoneOf, { skin: "exposure" });
  const zones = {};
  for (const [zone, h] of Object.entries(hist)) {
    let dom = null, best = -1;
    for (const [b, n] of Object.entries(h.byBlock)) if (n > best) { best = n; dom = b; }
    if (dom) zones[zone] = { dominant: dom };
  }
  return zones;
}

/** Best-effort GL render at a named angle (a lens, never logic). */
async function tryRender(artifact, angle, label, subjDir) {
  try {
    const { renderViews } = await import("../../src/view/multi-angle.mjs");
    const [r] = await renderViews(artifact, [angle], { outDir: subjDir, label: () => label });
    return { angle, path: r.path.replace(ROOT, "") };
  } catch (e) {
    return { angle, error: e.message };
  }
}

// =================================================================================================
// THE DETERMINISTIC CORE — reads the committed input, writes nothing, no GL. Run twice per live pass.
// =================================================================================================
async function runShell(def) {
  const raw = JSON.parse(await readFile(join(HERE, def.build), "utf8"));
  assertArtifact(raw);
  const occ0 = artifactOccupancy(raw);

  // --- 1. COMPONENT STRIP (floating debris off; largest + grounded declared and kept) -------------
  const strip = componentStrip(occ0);
  if (def.expect) {
    const got = { components: strip.components, strippedCells: strip.strippedCells, keptComponents: strip.kept.length };
    for (const [k, v] of Object.entries(def.expect)) {
      if (got[k] !== v) {
        throw new Error(`${def.key} AC drift: expected ${k}=${v}, measured ${got[k]} ` +
          `(ticket numbers are pinned — the input artifact changed?)`);
      }
    }
  }
  const stripped = rebuildArtifact(strip.occ, raw);
  assertArtifact(stripped);

  // --- 2. ZONES + CENSUS DOMINANTS + DECLARED OPENINGS ---------------------------------------------
  const occS = artifactOccupancy(stripped);
  const { zoneOf, storeyDivide, upperTop } = structuralZones(occS);
  const zones = censusZones(occS, zoneOf);
  const regions = openingRegions(occS); // the build's own door/window/arch through-openings
  const closureBefore = closureCheck(occS, { regions });

  // --- 3. VOID REPAIR (depth-basin fill, relief floor, allow-list) ---------------------------------
  const voids = fillVoids(occS, { zoneOf, zones, minDepth: MIN_DEPTH, regions });
  const repaired = applyDeltas(stripped, voids.placements);
  const occR = artifactOccupancy(repaired);

  // --- 4. PLUG TO CLOSURE + THE GATE ----------------------------------------------------------------
  const plug = plugClosure(occR, { zoneOf, zones, regions, maxIterations: MAX_PLUG_ITER });
  const final = applyDeltas(repaired, plug.placements);
  assertArtifact(final);
  const closureFinal = plug.check; // plugClosure returns the PASSING check; re-assert anyway:
  if (!closureFinal.closed) throw new Error("closure gate FAILED after plugClosure — impossible by contract");

  return { raw, stripped, final, strip, zones, regions, storeyDivide, upperTop, voids, plug, closureBefore, closureFinal };
}

// =================================================================================================
async function main() {
  const argv = process.argv.slice(2);
  const def = SUBJECTS[argv[argv.indexOf("--subject") + 1]];
  if (!def) throw new Error(`--subject must be one of: ${Object.keys(SUBJECTS).join(", ")}`);
  const offline = argv.includes("--offline");
  const subjDir = join(OUT_DIR, def.key);
  const recPath = join(OUT_DIR, `${def.key}.json`);
  const artPath = join(subjDir, "artifact.json");

  if (offline) {
    if (!existsSync(recPath) || !existsSync(artPath)) throw new Error(`committed record/artifact absent — run npm run shell:${def.key} first`);
    const rec = JSON.parse(await readFile(recPath, "utf8"));
    const artBytes = await readFile(artPath, "utf8");
    assertArtifact(JSON.parse(artBytes));
    const sha = createHash("sha256").update(artBytes).digest("hex");
    const checks = {
      sha: sha === rec.reproducible?.sha256,
      closed: rec.closure?.final?.closed === true,
      strip: !def.expect || (rec.strip?.components === def.expect.components &&
        rec.strip?.strippedCells === def.expect.strippedCells),
    };
    const ok = Object.values(checks).every(Boolean);
    console.error(`[offline] ${def.key}: artifact sha ${checks.sha ? "MATCHES" : "DIVERGES"}; ` +
      `closure ${checks.closed ? "closed" : "VIOLATED"}; strip ACs ${checks.strip ? "OK" : "VIOLATED"}; AJV ok`);
    if (!ok) process.exitCode = 1;
    return;
  }

  await mkdir(subjDir, { recursive: true });
  await mkdir(FRAMES_DIR, { recursive: true });

  // THE REPRODUCIBILITY PROOF (E-24 Rule 2): the deterministic core, twice; byte-equal or no record.
  const r1 = await runShell(def);
  const r2 = await runShell(def);
  const j1 = JSON.stringify(r1.final);
  if (j1 !== JSON.stringify(r2.final)) throw new Error("NON-DETERMINISTIC: two in-process runs produced different artifacts");
  console.error(`[${def.key}] reproducible: double-run artifacts identical (${r1.final.placements.length} placements)`);
  console.error(`[${def.key}] strip: ${r1.strip.components} → ${r1.strip.kept.length} components, ` +
    `${r1.strip.strippedCells} cells stripped (sizes ${r1.strip.stripped.map((s) => s.size).join(",") || "none"}); ` +
    `kept exceptions: ${r1.strip.kept.filter((k) => !k.largest).map((k) => `${k.size}@y${k.minY}`).join(",") || "none"}`);
  console.error(`[${def.key}] zones: ${JSON.stringify(r1.zones)} (divide ${r1.storeyDivide}, eave ${r1.upperTop}); ` +
    `declared openings: ${r1.regions.map((r) => r.kind).join(",") || "none"}`);
  console.error(`[${def.key}] closure before repair: reached ${r1.closureBefore.reached}/${r1.closureBefore.interiorCells}, ` +
    `byDirection ${JSON.stringify(r1.closureBefore.byDirection)}`);
  console.error(`[${def.key}] voids: ${r1.voids.filled} cells filled — ` +
    Object.entries(r1.voids.byDir).map(([d, s]) => `${d} ${s.filled}(allow-skipped ${s.skippedAllowed})`).join(", "));
  console.error(`[${def.key}] plug: ${r1.plug.placements.length} cells over ${r1.plug.iterations} iteration(s) → ` +
    `closure CLOSED (interior ${r1.closureFinal.interiorCells}, reached 0)`);

  const artJson = JSON.stringify(r1.final, null, 2) + "\n";
  await writeFile(artPath, artJson);
  const sha256 = createHash("sha256").update(artJson).digest("hex");

  // --- before/after renders (best-effort) + committed frames ----------------------------------------
  const renders = [];
  for (const [angle, tag] of [["front", "front"], [OBLIQUE, "oblique135"], [OBLIQUE2, "oblique225"], ["top", "top"]]) {
    renders.push({ when: "before", ...(await tryRender(r1.raw, angle, `${tag}-before`, subjDir)) });
    renders.push({ when: "after", ...(await tryRender(r1.final, angle, `${tag}-after`, subjDir)) });
  }
  for (const r of renders) console.error(`render ${r.when} ${r.angle}: ${r.path ?? `unavailable (${r.error})`}`);
  const frames = [];
  try {
    const before = renders.find((r) => r.when === "before" && r.angle === OBLIQUE);
    const after = renders.find((r) => r.when === "after" && r.angle === OBLIQUE);
    if (before?.path && after?.path) {
      await copyFile(join(ROOT, before.path), join(FRAMES_DIR, `shell-${def.key}-before.png`));
      await copyFile(join(ROOT, after.path), join(FRAMES_DIR, `shell-${def.key}-after.png`));
      frames.push(`pr/assets/frames/shell-${def.key}-before.png`, `pr/assets/frames/shell-${def.key}-after.png`);
    }
  } catch (e) {
    console.error(`frames: ${e.message}`);
  }

  // --- the durable record -----------------------------------------------------------------------------
  const record = {
    schema: "shell-integrity/v1",
    subject: def.key,
    inputs: { build: def.build },
    expect: def.expect,
    strip: {
      components: r1.strip.components,
      keptComponents: r1.strip.kept.length,
      strippedCells: r1.strip.strippedCells,
      kept: r1.strip.kept,
      stripped: r1.strip.stripped,
      note: "keep the largest 6-connected component + GROUNDED components (a standing structure — the " +
        "gatehouse's inner passage — is not debris; floating is what makes debris debris). Kept " +
        "exceptions are declared above. Deletion has no artifact op, so the strip REBUILDS the " +
        "artifact in canonical voxel order.",
    },
    zones: { census: r1.zones, storeyDivide: r1.storeyDivide, upperTop: r1.upperTop,
      note: "dominants are the build's own exposure-shell majority per structural zone — no E-21 map, " +
        "no subject constants (E-25 Rule 3)." },
    openings: {
      regions: r1.regions,
      note: "the allow-list: the build's declared through-openings (structural read `openings` — the " +
        "arch is the door), back-projected to world AABBs. The concept-image opening reader is E-26 " +
        "kit scope; the raw build's own openings are today's data-driven equivalent.",
    },
    voids: {
      minDepth: MIN_DEPTH, filled: r1.voids.filled, byDir: r1.voids.byDir,
      note: "a cavity is a BASIN in a face's depth field (priority-flood spill levels — the same " +
        "hydrology as the T-087 course fill, over -depth): pockets ≥ minDepth below their rim are " +
        "missing mass, filled flush in the owning zone's dominant; depth-1..2 facade relief drains or " +
        "sits above the floor and is kept; declared openings are never filled.",
    },
    closure: {
      before: { reached: r1.closureBefore.reached, interiorCells: r1.closureBefore.interiorCells,
        byDirection: r1.closureBefore.byDirection },
      plug: { cells: r1.plug.placements.length, iterations: r1.plug.iterations, maxIterations: MAX_PLUG_ITER },
      final: { closed: r1.closureFinal.closed, interiorCells: r1.closureFinal.interiorCells,
        reached: r1.closureFinal.reached, byDirection: r1.closureFinal.byDirection },
      note: "GROUND-SOLID six-direction watertightness of the STANDING build (flood seeds from sky + " +
        "sides; a -y ray exiting the bbox rests on terrain); declared openings are honorary skin; " +
        "breaches attributed to the shaft's escape direction(s). plugClosure THROWS rather than " +
        "returning unclosed — the gate cannot be passed by an unclosed shell.",
    },
    reproducible: {
      doubleRun: true, sha256,
      determinism: "no LLM, no GL on the path — every stage is a pure function of the committed input " +
        "artifact. Two in-process executions byte-matched.",
    },
    placements: { input: r1.raw.placements.length, stripped: r1.stripped.placements.length,
      voidFills: r1.voids.placements.length, plugs: r1.plug.placements.length, final: r1.final.placements.length },
    renders, frames,
  };
  await writeFile(recPath, JSON.stringify(record, null, 2) + "\n");
  await writeFile(join(OUT_DIR, `${def.key}.md`), renderMd(record));
  console.error(`\n✓ wrote ${recPath} + ${artPath} (sha256 ${sha256.slice(0, 12)}…)`);
}

function renderMd(r) {
  const dirLine = (bd) => Object.entries(bd).map(([d, n]) => `${d} ${n}`).join(" · ");
  const renders = r.renders.map((f) => `- ${f.when} ${f.angle}: ${f.path ?? `GL unavailable (${f.error})`}`).join("\n");
  return `# Shell integrity — ${r.subject} (T-091-01)\n\n` +
    `Strip floating debris → repair shell voids → six-direction closure gate, all pure cores behind ` +
    `\`npm run shell:${r.subject}\`. **Reproducible**: double-run byte-identical, artifact sha256 ` +
    `\`${r.reproducible.sha256.slice(0, 16)}…\`.\n\n` +
    `## Component strip\n` +
    `**${r.strip.components} → ${r.strip.keptComponents} components, ${r.strip.strippedCells} cells stripped** ` +
    `(sizes: ${r.strip.stripped.map((s) => s.size).join(", ") || "none"}).\n` +
    `Kept: ${r.strip.kept.map((k) => `${k.size} cells${k.largest ? " (largest)" : ""}${k.grounded ? " (grounded)" : ""}`).join("; ")}.\n` +
    (r.expect ? `Ticket pins: ${JSON.stringify(r.expect)} — asserted in the runner.\n` : "") +
    `\n## Void repair (minDepth ${r.voids.minDepth})\n` +
    `**${r.voids.filled} cells filled** — ` +
    Object.entries(r.voids.byDir).map(([d, s]) => `${d}: ${s.filled} (allow-skipped ${s.skippedAllowed})`).join(", ") + `.\n` +
    `Declared openings honored: ${r.openings.regions.map((x) => `${x.kind}@${x.dir}`).join(", ") || "(none)"}.\n\n` +
    `## Six-direction closure\n` +
    `- before repair: ${r.closure.before.reached}/${r.closure.before.interiorCells} interior cells ` +
    `exterior-reachable — breaches by direction: ${dirLine(r.closure.before.byDirection)}\n` +
    `- plug: ${r.closure.plug.cells} cells in ${r.closure.plug.iterations} iteration(s)\n` +
    `- **final: CLOSED** (0/${r.closure.final.interiorCells} reached; the gate THROWS otherwise)\n\n` +
    `## Renders\n${renders}\n\nFrames: ${r.frames.join(", ") || "(none — GL unavailable)"}\n\n` +
    `> ${r.strip.note}\n\n> ${r.voids.note}\n\n> ${r.closure.note}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
