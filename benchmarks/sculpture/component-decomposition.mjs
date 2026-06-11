// IMPURE RUNNER — E-27 component decomposition (S-103 / T-103-01). The blob becomes NAMED
// COMPONENTS WITH GEOMETRY: per subject, the committed shell is segmented by the pure core
// (src/form/component-decompose.mjs) into masses, roof planes (GLB-fitted, Rule 1), wall slabs, and
// opening groups, and the result is written as the component record — the SINGLE contract every
// downstream E-27 consumer reads (Rule 4; schema/component-record.schema.json, ajv-gated here).
//
// INPUT RESOLUTION (registry data, E-25 Rule 3 — no subject constants in code): the T-102
// regularized shell is preferred when committed (the epic's chain order is regularize → decompose);
// the raw shell is the fallback, keeping this ticket independent of T-102 in the DAG. `--shell
// <path>` overrides both (the tolerance seam — the same command runs on any schema-valid artifact).
//
// THE SEAM INVARIANT: this file is impure wiring only (file I/O, best-effort GL renders, the
// durable record). DETERMINISM (E-24 Rule 2): the core runs twice from a fresh parse; the two
// record bodies must be byte-identical; sha256s recorded; `--offline` re-asserts the committed
// record (shell hash, ajv, expectations) with no recompute and no GL. Pinned per-subject MINIMUM
// expectations (the shell-integrity `expect` idiom) make the run a test: cottage must yield its 2
// pitched planes + protected chimney, the gatehouse its arch candidate, the church its tower+nave —
// a miss THROWS (E-25 Rule 6, honest failure), it is never written around.
//
// GL — run on demand, NOT in `npm test`:
//   npm run components:cottage                # decompose + record + colored renders + frame
//   npm run components:gatehouse
//   npm run components:church
//   npm run components:cottage -- --offline   # re-assert the committed record, no GL
//   npm run components:cottage -- --shell <path> [--regularized true|false]
//
// Writes components/<subj>.{json,md} (committed) + components/<subj>/*.png (gitignored) +
// pr/assets/frames/components-<subj>.png (committed evidence: the component-colored oblique).

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

import { artifactOccupancy, occupancyFromCells } from "../../src/view/occupancy.mjs";
import { rebuildArtifact } from "../../src/view/shell-integrity.mjs";
import { assertArtifact } from "../../src/artifact.mjs";
import { decompose, runCells } from "../../src/form/component-decompose.mjs";
import { scaleAlignment, aabbAlignment } from "../../src/form/component-glb-fit.mjs";
import { parseGlbMesh } from "../../src/form/glb-mesh.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "components");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");
const SCHEMA_PATH = join(ROOT, "schema/component-record.schema.json");
const OBLIQUE = "+x-z";   // azimuth 135° evidence angle
const OBLIQUE2 = "-x-z";  // azimuth 225° second witness

// Registry DATA per subject: shell resolution order (regularized first) + pinned minimums.
const EXTRAS = {
  cottage: {
    shells: ["regularize/cottage/artifact.json", "styled/cottage/shell-artifact.json"],
    expect: { pitchedRoofPlanes: 2, protrusionMasses: 1, ridges: 1 },
  },
  gatehouse: {
    shells: ["regularize/gatehouse/artifact.json", "styled/gatehouse/shell-artifact.json"],
    expect: { archCandidates: 1 },
  },
  church: {
    shells: ["regularize/church/artifact.json", "challenge/church/shell-artifact.json"],
    expect: { masses: 2, roofPlanes: 2 },
  },
};

// Component palette (presentation only — never part of the record): body masses cycle wools,
// protrusions are always red; roof planes cycle concretes on the top surface; jamb/head outlines black.
const MASS_BLOCKS = ["white_wool", "orange_wool", "light_blue_wool", "lime_wool", "pink_wool", "gray_wool"];
const PLANE_BLOCKS = ["blue_concrete", "yellow_concrete", "magenta_concrete", "cyan_concrete", "purple_concrete", "green_concrete", "brown_concrete", "lime_concrete"];
const PROTRUSION_BLOCK = "red_wool";
const OUTLINE_BLOCK = "black_concrete";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const recordJson = (r) => JSON.stringify(r, null, 2) + "\n";

function parseArgs(argv) {
  const args = { subject: null, shell: null, regularized: null, offline: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--subject") args.subject = argv[++i];
    else if (argv[i] === "--shell") args.shell = argv[++i];
    else if (argv[i] === "--regularized") args.regularized = argv[++i] === "true";
    else if (argv[i] === "--offline") args.offline = true;
    else throw new Error(`unknown arg: ${argv[i]}`);
  }
  if (!args.subject) throw new Error("usage: --subject <key> [--shell <path>] [--offline]");
  return args;
}

function counts(record) {
  return {
    masses: record.masses.length,
    protrusionMasses: record.masses.filter((m) => m.role === "protrusion").length,
    roofPlanes: record.roofPlanes.length,
    pitchedRoofPlanes: record.roofPlanes.filter((p) => p.kind === "pitched").length,
    flatRoofPlanes: record.roofPlanes.filter((p) => p.kind === "flat").length,
    ridges: new Set(record.roofPlanes.filter((p) => p.ridge)
      .map((p) => [p.id, p.ridge.withPlane].sort().join("+"))).size,
    wallSlabs: record.wallSlabs.length,
    openingGroups: record.openingGroups.length,
    archCandidates: record.openingGroups
      .flatMap((g) => g.openings).filter((o) => o.archCandidate).length,
    glbFits: record.roofPlanes.filter((p) => p.glbFit).length,
    findings: record.findings.length,
  };
}

function assertExpectations(record, expect) {
  const got = counts(record);
  const misses = Object.entries(expect).filter(([k, v]) => (got[k] ?? 0) < v);
  if (misses.length) {
    throw new Error(`expectation MISS: ${misses.map(([k, v]) => `${k} ${got[k] ?? 0} < ${v}`).join("; ")}`);
  }
  return got;
}

function validateRecord(record, schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  if (!validate(record)) {
    throw new Error(`component record fails its schema:\n${JSON.stringify(validate.errors, null, 2)}`);
  }
}

/** Component-colored artifact for the at-a-glance check (AC): mass colors, plane-colored top
 *  surface, protrusions red, opening jamb/head outlines black. Presentation only. */
function coloredArtifact(occ, record, template) {
  const colorOfColumn = new Map();
  let bodyIdx = 0;
  for (const m of record.masses) {
    const block = m.role === "protrusion" ? PROTRUSION_BLOCK : MASS_BLOCKS[bodyIdx++ % MASS_BLOCKS.length];
    for (const [x, z] of runCells(m.plan.runs)) colorOfColumn.set(`${x},${z}`, block);
  }
  const topOf = new Map(); // column → top solid y
  for (const key of occ.cells.keys()) {
    if (occ.formOf(...key.split(",").map(Number)) !== "cube") continue;
    const [x, y, z] = key.split(",").map(Number);
    const k = `${x},${z}`;
    if (!topOf.has(k) || y > topOf.get(k)) topOf.set(k, y);
  }
  const planeColor = new Map(); // "x,z" → plane block (top surface only)
  record.roofPlanes.forEach((p, i) => {
    const block = PLANE_BLOCKS[i % PLANE_BLOCKS.length];
    for (const [x, z] of runCells(p.extent.runs)) planeColor.set(`${x},${z}`, block);
  });
  const cells = [];
  for (const key of occ.cells.keys()) {
    const [x, y, z] = key.split(",").map(Number);
    if (occ.formOf(x, y, z) !== "cube") continue;
    const k = `${x},${z}`;
    const isTop = topOf.get(k) === y;
    const block = (isTop && planeColor.get(k)) || colorOfColumn.get(k) || "gray_concrete";
    cells.push({ pos: [x, y, z], block: `minecraft:${block}` });
  }
  // jamb + head outlines: the wall cells beside/above the aperture, on the owning slab's plane
  const slabOf = new Map(record.wallSlabs.map((s) => [`${s.massId}|${s.dir}`, s]));
  const colored = new Map(cells.map((c) => [c.pos.join(","), c]));
  const outline = (pos) => {
    const c = colored.get(pos.join(","));
    if (c) c.block = `minecraft:${OUTLINE_BLOCK}`;
  };
  for (const g of record.openingGroups) {
    const slab = slabOf.get(`${g.massId}|${g.dir}`);
    if (!slab) continue;
    for (const o of g.openings) {
      const at = (u) => (o.extent.axis === "x" ? [u, slab.value] : [slab.value, u]);
      const place = (u, y) => { const [x, z] = at(u); outline([x, y, z]); };
      const [j0, j1] = o.jambs;
      for (let y = j0.y0; y <= j0.y1; y++) place(j0.at - 1, y);
      for (let y = j1.y0; y <= j1.y1; y++) place(j1.at + 1, y);
      for (const h of o.headProfile) place(h.at, h.topY + 1);
    }
  }
  return rebuildArtifact(occupancyFromCells([...colored.values()]), template);
}

/** Best-effort GL render (a lens, never logic) — the established runner idiom. */
async function tryRenderAngle(artifact, angle, label, outDir) {
  try {
    const { renderViews } = await import("../../src/view/multi-angle.mjs");
    const [r] = await renderViews(artifact, [angle], { outDir, label: () => label });
    return { angle, path: r.path.replace(ROOT, "") };
  } catch (e) {
    return { angle, error: e.message };
  }
}

function recordMd(key, record, got, expect, determinism, renders) {
  const lines = [];
  lines.push(`# component record — ${key}`, "");
  lines.push(`- shell: \`${record.source.shellPath}\` (regularized: ${record.source.regularized})`);
  lines.push(`- shell sha256: \`${record.source.sha256}\``);
  lines.push(`- alignment: ${record.alignment.mode}${record.alignment.voxelSize ? ` (voxelSize ${record.alignment.voxelSize})` : ""}`);
  lines.push(`- determinism: double-run record bodies byte-identical (sha256 \`${determinism}\`)`, "");
  lines.push(`## counts vs pinned minimums`, "");
  lines.push(`| metric | got | min |`, `| --- | --- | --- |`);
  for (const [k, v] of Object.entries(got)) {
    lines.push(`| ${k} | ${v} | ${expect[k] ?? ""} |`);
  }
  lines.push("", `## masses`, "");
  lines.push(`| id | role | protected | plan area | yRange | volume | junctions |`, `| --- | --- | --- | --- | --- | --- | --- |`);
  for (const m of record.masses) {
    lines.push(`| ${m.id} | ${m.role} | ${m.protected} | ${m.plan.area} | ${m.yRange.join("..")} | ${m.volume} | ${m.junctions.map((j) => `${j.kind}→${j.withMass}`).join(", ") || "—"} |`);
  }
  lines.push("", `## roof planes`, "");
  lines.push(`| id | mass | kind | gradient | rmse (raw) | eave | ridge | glbFit |`, `| --- | --- | --- | --- | --- | --- | --- | --- |`);
  for (const p of record.roofPlanes) {
    const glb = p.glbFit ? `Δ${p.glbFit.angleToVoxelDeg}° / ${p.glbFit.triangles} tris / rmse ${p.glbFit.rmse}` : "MISS";
    lines.push(`| ${p.id} | ${p.massId} | ${p.kind} | [${p.voxelFit.gradient}] | ${p.voxelFit.rmse} (${p.voxelFit.rmseRaw}) | ${p.eave.dir ?? "perimeter"} | ${p.ridge ? `${p.ridge.axis}@${p.ridge.y}` : "—"} | ${glb} |`);
  }
  lines.push("", `## wall slabs`, "");
  lines.push(`| id | ${"axis=value"} | coverage |`, `| --- | --- | --- |`);
  for (const s of record.wallSlabs) lines.push(`| ${s.id} | ${s.axis}=${s.value} | ${s.coverage} |`);
  lines.push("", `## opening groups`, "");
  if (record.openingGroups.length === 0) lines.push("(none found)");
  else {
    lines.push(`| id | mass | dir | kind | n | arches |`, `| --- | --- | --- | --- | --- | --- |`);
    for (const g of record.openingGroups) {
      lines.push(`| ${g.id} | ${g.massId} | ${g.dir} | ${g.kind} | ${g.openings.length} | ${g.openings.filter((o) => o.archCandidate).length} |`);
    }
  }
  lines.push("", `## findings`, "");
  if (record.findings.length === 0) lines.push("(none)");
  for (const f of record.findings) lines.push(`- **${f.code}** @ ${f.where} — ${f.detail}`);
  lines.push("", `## renders`, "");
  for (const r of renders) lines.push(`- ${r.angle}: ${r.path ?? `render unavailable (${r.error})`}`);
  return lines.join("\n") + "\n";
}

async function main() {
  const args = parseArgs(process.argv);
  const key = args.subject;
  const subject = SUBJECTS[key];
  const extra = EXTRAS[key];
  if (!subject || !extra) throw new Error(`unknown subject "${key}" (registry keys: ${Object.keys(EXTRAS).join(", ")})`);
  const schema = JSON.parse(await readFile(SCHEMA_PATH, "utf8"));
  const recordPath = join(OUT_DIR, `${key}.json`);

  // resolve the shell (regularized preferred; explicit --shell wins)
  let shellRel, regularized;
  if (args.shell) {
    shellRel = args.shell;
    regularized = args.regularized; // null unless stated — provenance stays honest
  } else {
    shellRel = extra.shells.find((p) => existsSync(join(HERE, p)));
    if (!shellRel) throw new Error(`no shell on disk for ${key} (tried: ${extra.shells.join(", ")})`);
    regularized = shellRel.startsWith("regularize/");
  }
  const shellAbs = args.shell ? shellRel : join(HERE, shellRel);
  const shellRaw = await readFile(shellAbs, "utf8");
  const shellSha = sha256(shellRaw);

  if (args.offline) {
    const committed = JSON.parse(await readFile(recordPath, "utf8"));
    if (committed.source.sha256 !== shellSha) {
      throw new Error(`offline: shell hash drift (record ${committed.source.sha256}, disk ${shellSha})`);
    }
    validateRecord(committed, schema);
    const got = assertExpectations(committed, extra.expect);
    console.log(`[components:${key}] OFFLINE PASS — record valid, shell hash pinned, minimums met:`,
      JSON.stringify(got));
    return;
  }

  const glbBytes = await readFile(join(HERE, subject.glb));
  const mesh = parseGlbMesh(glbBytes);

  const runOnce = () => {
    const artifact = JSON.parse(shellRaw);
    assertArtifact(artifact);
    const occ = artifactOccupancy(artifact);
    const alignment = subject.provision?.scale
      ? scaleAlignment(mesh.bounds, subject.provision.scale)
      : aabbAlignment(mesh.bounds, occ.bounds);
    return { occ, artifact, body: decompose(occ, { glb: mesh, alignment }) };
  };
  const first = runOnce();
  const second = runOnce();
  const b1 = JSON.stringify(first.body), b2 = JSON.stringify(second.body);
  if (b1 !== b2) throw new Error("determinism breach: double-run record bodies differ");
  const determinism = sha256(b1);

  const record = {
    schema: first.body.schema,
    subject: key,
    source: { shellPath: shellRel, sha256: shellSha, regularized },
    alignment: first.body.alignment,
    bounds: first.body.bounds,
    masses: first.body.masses,
    roofPlanes: first.body.roofPlanes,
    wallSlabs: first.body.wallSlabs,
    openingGroups: first.body.openingGroups,
    findings: first.body.findings,
  };
  validateRecord(record, schema);
  const got = assertExpectations(record, extra.expect);

  await mkdir(OUT_DIR, { recursive: true });
  const subjDir = join(OUT_DIR, key);
  await mkdir(subjDir, { recursive: true });
  await mkdir(FRAMES_DIR, { recursive: true });
  await writeFile(recordPath, recordJson(record));

  // visualization: component-colored renders at the two witness obliques
  const colored = coloredArtifact(first.occ, record, first.artifact);
  const renders = [];
  for (const angle of [OBLIQUE, OBLIQUE2]) {
    renders.push(await tryRenderAngle(colored, angle, `components-${key}-${angle.replace(/[+]/g, "p").replace(/-/g, "m")}`, subjDir));
  }
  const frameSrc = renders[0].path ? join(ROOT, renders[0].path) : null;
  if (frameSrc && existsSync(frameSrc)) {
    await copyFile(frameSrc, join(FRAMES_DIR, `components-${key}.png`));
  }

  await writeFile(join(OUT_DIR, `${key}.md`), recordMd(key, record, got, extra.expect, determinism, renders));
  console.log(`[components:${key}] PASS —`, JSON.stringify(got));
  for (const r of renders) {
    console.log(`  render ${r.angle}: ${r.path ?? `UNAVAILABLE (${r.error})`}`);
  }
}

main().catch((e) => {
  console.error(`[component-decomposition] FAIL: ${e.message}`);
  process.exit(1);
});
