// FORM-SKETCH RUNNER (T-123-01, story S-123, epic E-31) — condition the registered building GLBs
// into committed form sketches. `node benchmarks/sculpture/form-sketch.mjs --subject <key> | --all
// [--repro] [--rotate-pins]`, or `npm run sketch:<key>`.
//
// Per subject: GLB (path from the SUBJECTS registry — registry-only, no subject constants here) →
// conditionGlb (pure core, src/form/form-sketch.mjs) → three artifacts in form-sketch/:
//   {key}.json       the form-sketch/v1 record (pin: guardedWriteRecord, preflight before work)
//   {key}.md         the human-review table (pin)
//   {key}-sheet.png  plan + elevations with the raw mesh outline (evidence, not a pin — though
//                    the raster is CPU-deterministic, PNGs never route through the guard)
//
// --repro re-derives the whole chain in a fresh process and byte-compares against the committed
// records (the challenge-milestone pattern); nothing is written, divergence exits nonzero.
//
// E-31 Rule 3 (no downstream coupling): this runner and the core's unit tests are the ONLY
// readers/writers of form-sketch artifacts. The sketch informs recognition (S-125); it is never
// a fit target, and no tolerance anywhere may reference it.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { conditionGlb } from "../../src/form/form-sketch.mjs";
import { renderSketchSheet } from "../../src/form/sketch-plot.mjs";
import { guardedWriteRecord, ROTATE_FLAG } from "../../src/form/pin-guard.mjs";
import { SUBJECTS } from "./durable-skin.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "form-sketch");
const REL_DIR = "benchmarks/sculpture/form-sketch";

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

/** The buildings of the registry: every entry that carries a GLB and a working scale. */
const buildingDefs = () =>
  Object.values(SUBJECTS).filter((def) => def.glb && def.generated?.scale);

async function deriveRecord(def) {
  const glbBytes = await readFile(join(HERE, def.glb));
  const out = conditionGlb(glbBytes, { subject: def.key, registryScale: def.generated.scale });
  out.sketch.source = { glbSha256: sha256(glbBytes), ...out.sketch.source };
  return { ...out, json: JSON.stringify(out.sketch, null, 2) + "\n" };
}

function summaryMd(sketch) {
  const g = sketch.grammar;
  const sym = sketch.symmetry;
  const fp = sketch.footprint;
  const pr = sketch.proportions;
  const shares = Object.entries(g.areaShareByOrientation)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `\`${k}\` ${(v * 100).toFixed(1)}%`)
    .join(", ");
  const storeys = pr.storeyCandidates
    .map((c) => `${c.n}→${c.perStoreyBlocks}${c.plausible ? "" : " (out of band)"}`)
    .join(", ");
  return `# Form sketch — ${sketch.subject}

Conditioned form sketch (\`${sketch.schema}\`): a sketch for recognition, **never a fit target**
(E-31 Rule 3). Check \`${sketch.subject}-sheet.png\` against the GLB at a glance: gray = conditioned
occupancy, black = raw mesh outline, red = footprint, blue = mirror, green/purple = eave/ridge.

| measure | value |
| --- | --- |
| mesh | ${sketch.source.triangleCount} triangles, sha \`${sketch.source.glbSha256.slice(0, 12)}…\` |
| coarse faces | ${g.keptFaces} kept of ${g.regionCount} regions (target ${sketch.params.faceTarget}); dropped area ${(g.droppedAreaFrac * 100).toFixed(1)}% |
| grammar fit | mean snap residual ${g.meanResidualDeg}° |
| orientation shares | ${shares} |
| roof pitch | **${sketch.pitch.class}** (dominant tilt ${sketch.pitch.dominantTiltDeg}°) |
| symmetry | axis ${sym.axis} @ ${sym.offsetCells} cells, score ${sym.score} (threshold ${sym.threshold}) → ${sym.applied ? `APPLIED, kept ${sym.keptSide} half` : "not applied — stays asymmetric"} |
| footprint | ${fp.polygon.length} vertices${fp.isRectangle ? " (clean rectangle)" : ""}, ${fp.polygonArea} cells² over a ${fp.planDims.join("×")} plan |
| masses | ${pr.massCount} body (${pr.masses.map((m) => m.role).join(", ") || "none"}) |
| proportions | eave ${pr.eaveBlocks} blocks / ridge ${pr.heightBlocks} blocks (eaveFrac ${pr.eaveFrac}); storeys ${storeys} |
`;
}

async function encodePng(sheet) {
  const { PNG } = await import("pngjs"); // devDep, off the pure path
  const png = new PNG({ width: sheet.width, height: sheet.height });
  sheet.data.forEach((v, i) => { png.data[i] = v; });
  return PNG.sync.write(png);
}

async function runSubject(def, { rotate }) {
  const t0 = Date.now();
  const { sketch, occupied, mesh, json } = await deriveRecord(def);
  const sheet = renderSketchSheet({ sketch, occupied, mesh });
  await mkdir(OUT_DIR, { recursive: true });
  for (const [rel, content] of [
    [`${REL_DIR}/${def.key}.json`, json],
    [`${REL_DIR}/${def.key}.md`, summaryMd(sketch)],
  ]) {
    await guardedWriteRecord({ root: ROOT, rel, content, rotate });
  }
  await writeFile(join(OUT_DIR, `${def.key}-sheet.png`), await encodePng(sheet));
  console.log(`[form-sketch] ${def.key}: faces ${sketch.grammar.keptFaces}, pitch ${sketch.pitch.class}, ` +
    `symmetry ${sketch.symmetry.applied ? `applied (${sketch.symmetry.score})` : `not applied (${sketch.symmetry.score})`}, ` +
    `footprint ${sketch.footprint.polygon.length}v${sketch.footprint.isRectangle ? " rect" : ""}, ` +
    `masses ${sketch.proportions.massCount} — ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

async function reproSubject(def) {
  const committedPath = join(OUT_DIR, `${def.key}.json`);
  const committed = await readFile(committedPath, "utf8").catch(() => {
    throw new Error(`--repro: no committed record at ${REL_DIR}/${def.key}.json`);
  });
  const { json } = await deriveRecord(def);
  const same = sha256(json) === sha256(committed);
  console.error(`[repro] ${def.key}: fresh-process derivation ${same ? "REPRODUCES the committed sketch" : "DIVERGES"} ` +
    `(sha ${sha256(json).slice(0, 12)}… vs ${sha256(committed).slice(0, 12)}…)`);
  return same;
}

// --- CLI ----------------------------------------------------------------------------------------

const argv = process.argv.slice(2);
const argOf = (flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : null;
};
const onlySubject = argOf("--subject");
const all = argv.includes("--all");
const repro = argv.includes("--repro");
const rotate = argv.includes(ROTATE_FLAG);

const defs = buildingDefs();
if (!all && !onlySubject) throw new Error(`pass --subject <${defs.map((d) => d.key).join("|")}> or --all`);
if (onlySubject && !defs.some((d) => d.key === onlySubject)) {
  throw new Error(`--subject must be one of: ${defs.map((d) => d.key).join(", ")}`);
}
const selected = defs.filter((d) => !onlySubject || d.key === onlySubject);

if (repro) {
  const results = await Promise.all(selected.map((def) => reproSubject(def)));
  if (results.some((ok) => !ok)) process.exit(1);
} else {
  // No preflightPins here: preflight exists to land refusals BEFORE metered spend, and this
  // chain spends nothing. guardedWriteRecord still rules every record write per-file — a
  // byte-identical re-derivation passes (the deterministic-regeneration flow), a differing one
  // refuses without --rotate-pins (fail closed).
  for (const def of selected) await runSubject(def, { rotate });
}