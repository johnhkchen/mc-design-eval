// Brush catalog runner (T-128-01, story S-128, epic E-32) — every registered brush realized
// once, on one sheet, with the committed page. The idiom-card ladder:
//   0. CONTRACT  — validateBrushRegistry over the real registry MUST be clean (the only-door
//                  guarantee: an entry without tests/preview/composition fails here too).
//   1. COVERAGE  — every registry brush plotted (constructs AND passes — the widened pin).
//   2. GATE      — the catalog artifact passes the live AJV validator (assertArtifact).
//   3. MAPPING   — buildWorldFromVoxels places every voxel; `unmapped` MUST be empty.
//   4. RENDER    — best-effort GL at the four gate azimuths + front, sha256 receipts
//                  (`reproducibility-excludes-gl-from-decisions`: evidence, never verdict).
//
// record.json carries `brushCount` — THE FACTORY BASELINE the E-32 milestone (S-132) measures
// growth against.
//
// THE SEAM INVARIANT: impure wiring only — realization, layout, artifact, and the page live in
// the PURE modules (src/pack/brush-catalog.mjs et al.) under the unit glob.
//
// Usage: npm run brush:catalog   (exit 0 ⇔ contract + coverage + gate + mapping pass)

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { assertArtifact } from "../../src/artifact.mjs";
import { expandArtifact } from "../../src/expand.mjs";
import { MULTI_ANGLE_GATE } from "../../src/config.mjs";
import { brushNames, BRUSH_REGISTRY } from "../../src/pack/idiom-registry.mjs";
import { validateBrushRegistry } from "../../src/pack/brush-contract.mjs";
import {
  BRUSH_CATALOG_SCHEMA, catalogPlots, brushCatalogLayout, catalogCoverage, brushCatalog,
  brushCatalogMarkdown,
} from "../../src/pack/brush-catalog.mjs";
import { renderViews } from "../../src/view/multi-angle.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(here, "brush-catalog");
const ROOT = join(here, "..", "..");

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  // ---- 0. CONTRACT -----------------------------------------------------------------------------------
  const contract = validateBrushRegistry();
  for (const f of contract.findings) console.error(`  contract ${f.level}: ${f.brush} — ${f.msg}`);
  if (!contract.ok) {
    console.error("contract: the registry does not satisfy the brush contract");
    process.exit(1);
  }
  console.error(`contract: clean over ${contract.count} brushes`);

  // ---- 1. COVERAGE -----------------------------------------------------------------------------------
  const plotList = catalogPlots();
  const { missing } = catalogCoverage(plotList);
  if (missing.length) {
    console.error(`coverage: brushes missing from the catalog: ${missing.join(", ")}`);
    process.exit(1);
  }

  // ---- 2. GATE ---------------------------------------------------------------------------------------
  const catalog = assertArtifact(brushCatalog());
  await writeFile(join(OUT_DIR, "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
  console.error(`gate: catalog passes the live AJV validator (${catalog.placements.length} placements)`);

  // ---- 3. MAPPING ------------------------------------------------------------------------------------
  const { buildWorldFromVoxels } = await import("../../render/src/world.mjs");
  const voxels = expandArtifact(catalog);
  const build = await buildWorldFromVoxels(voxels);
  console.error(`mapping: placed ${build.placed}/${voxels.length}, unmapped ${build.unmapped.length}`);
  for (const u of build.unmapped) console.error(`  UNMAPPED [${u.pos}] ${u.block}: ${u.reason}`);

  // ---- 4. RENDER (evidence) --------------------------------------------------------------------------
  const angles = [...MULTI_ANGLE_GATE.azimuths, "front"];
  const renders = [];
  let renderError = null;
  try {
    const views = await renderViews(catalog, angles, { outDir: OUT_DIR, label: (a) => `catalog-${a}`, width: 1024, height: 1024 });
    for (const v of views) {
      const buf = await readFile(v.path);
      renders.push({ angle: v.angle, path: relative(ROOT, v.path), bytes: v.bytes, sha256: sha256(buf) });
      console.error(`render ${v.angle}: ${v.path}`);
    }
  } catch (err) {
    renderError = err.message;
    console.error(`render: unavailable (${renderError})`);
  }

  // ---- receipt + the page ----------------------------------------------------------------------------
  const { plots } = brushCatalogLayout(plotList);
  const names = brushNames();
  const ok = build.unmapped.length === 0;
  const record = {
    schema: BRUSH_CATALOG_SCHEMA,
    ticket: "T-128-01",
    // THE FACTORY BASELINE (S-132 reads this number)
    brushCount: names.length,
    constructs: names.filter((n) => BRUSH_REGISTRY[n].kind === "construct").length,
    passes: names.filter((n) => BRUSH_REGISTRY[n].kind === "pass").length,
    verdict: { ok, contractOk: contract.ok, gate: "pass", unmapped: build.unmapped.length, plots: plots.length },
    plots,
    unmapped: build.unmapped,
    evidence: { renders, renderError }, // GL-dependent: evidence, never part of the verdict
  };
  await writeFile(join(OUT_DIR, "record.json"), JSON.stringify(record, null, 2) + "\n");

  const md = brushCatalogMarkdown({
    plots,
    renders: renders.map((r) => ({ file: r.path, sha256: r.sha256 })),
  });
  await writeFile(join(OUT_DIR, "brush-catalog.md"), md);

  console.error(`record: ${join(OUT_DIR, "record.json")} (brushCount ${record.brushCount})`);
  if (!ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
