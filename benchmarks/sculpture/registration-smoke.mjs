// IMPURE RUNNER — pre-spend registration smoke (T-120-01, story S-120, epic E-30).
//
// Runs the (role-aware) zone lens + the kit-extract dry-run against a candidate concept BEFORE
// any TRELLIS call (the barn lesson: its `no-field-cells` refusal was decidable from the concept
// + map alone, but was discovered only after the GLB spend). A refusal here is cheap, named, and
// blocks registration: regenerate or re-concept before a GLB exists — concepts become immutable
// only AT registration (E-25 Rule 2), so this is S-094-compatible. The S-094 checklist's item 8;
// `trellis-glb.mjs` refuses to spend when the sibling record beside its input PNG says fail.
//
// Pure logic lives in src/form/registration-smoke.mjs (unit-tested); this file is wiring: image
// decode, the exact buildSkin grid construction, file I/O through the pin-guard. NO model calls,
// NO network, NO GL — structurally zero-spend. See docs/knowledge/registration-runbook.md.
//
//   npm run registration:smoke -- --subject barn \
//     --concept benchmarks/sculpture/runs/017-.../concept.png \
//     --map benchmarks/sculpture/_archive/material-map/barn.json
//
// Takes explicit paths — a pre-registration subject has no SUBJECTS entry and must not need one.
// Writes registration-smoke.{json,md} BESIDE the concept (guarded; --rotate-pins to re-pin).
// Exit 0 pass / 1 refusal / 2 usage.

import { readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { ROTATE_FLAG, guardedWriteRecord } from "../../src/form/pin-guard.mjs";
import { registrationSmoke } from "../../src/form/registration-smoke.mjs";
import { loadBlockVocab } from "../../src/form/kit.mjs";
import { bareList } from "../../src/view/reference-quantize.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { gridFromPixels } from "../../src/color/image-grid.mjs";
import { SAMPLE_GRID_N, estimateBorderColor } from "../../src/color/value-select.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

function parseArgs(argv) {
  const out = { concept: undefined, map: undefined, subject: undefined, rotate: argv.includes(ROTATE_FLAG) };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--concept") out.concept = argv[++i];
    else if (argv[i] === "--map") out.map = argv[++i];
    else if (argv[i] === "--subject") out.subject = argv[++i];
    else if (argv[i] !== ROTATE_FLAG) throw new Error(`unknown arg "${argv[i]}"`);
  }
  return out;
}

function recordMd(rec, conceptRel, mapRel) {
  const head = `# Registration smoke — ${rec.subject ?? "(unnamed)"} (${rec.schema})\n\n` +
    `Pre-spend lens-readability gate (S-094 checklist item 8): concept \`${conceptRel}\` against ` +
    `map \`${mapRel}\`, run BEFORE any TRELLIS call. ${rec.note}.\n\n`;
  if (!rec.pass) {
    return head + `## ✗ REFUSED — ${rec.refusal.stage}: \`${rec.refusal.reason}\`\n\n` +
      `Registration is blocked. Regenerate the concept (and its map — they travel together ` +
      `pre-registration) or pick another; nothing has been spent.\n`;
  }
  const bands = rec.lens.bands.map((b) =>
    `| ${b.name} | \`${b.dominantBlock}\` | ${b.dominantRole} | ${b.share} |`).join("\n");
  return head +
    `## ✓ PASS — eave via ${rec.proxy.eave.source}, ${rec.proxy.layers} proxy layers\n\n` +
    `| band | dominant | role | share |\n|---|---|---|---|\n${bands}\n` +
    `| roof | \`${rec.lens.roof.dominantBlock}\` | ${rec.lens.roof.dominantRole} | ${rec.lens.roof.share} |\n\n` +
    (rec.lens.params.fieldResolution
      ? `Role-aware rung engaged: \`${JSON.stringify(rec.lens.params.fieldResolution)}\`.\n\n` : "") +
    `Kit dry-run: bands ${rec.kitDryRun.bandNames.join(", ")}; prompt ${rec.kitDryRun.promptChars} chars. ` +
    `TRELLIS may now be spent (next: \`trellis-glb.mjs\`, then \`glb-smoke.mjs\` — see the runbook).\n`;
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
  if (!args.concept || !args.map) {
    console.error("usage: node benchmarks/sculpture/registration-smoke.mjs --concept <png> --map <material-map.json> [--subject <name>] [--rotate-pins]");
    process.exit(2);
  }

  // Preflights, all zero-spend: the map parses, the kit's vocabulary loads (part of the
  // dry-run's claim that kit-extract WILL be runnable), the concept decodes.
  const materialMap = JSON.parse(await readFile(join(ROOT, args.map), "utf8"));
  loadBlockVocab();
  const conceptImg = await decodeImage(join(ROOT, args.concept));

  // The grid is built EXACTLY as buildSkin builds it (durable-skin.mjs) — same whitelist,
  // same n, same border drop — so the smoke sees what the chain will see.
  const gridResult = gridFromPixels(conceptImg, {
    whitelist: bareList(materialMap.palette),
    n: SAMPLE_GRID_N,
    dropColor: estimateBorderColor(conceptImg),
    cellMeans: true,
  });

  const rec = registrationSmoke({ gridResult, materialMap, subject: args.subject ?? materialMap.subject ?? null });
  const full = { ...rec, inputs: { concept: args.concept, map: args.map } };

  const outDir = dirname(join(ROOT, args.concept));
  const relJson = relative(ROOT, join(outDir, "registration-smoke.json"));
  const relMd = relative(ROOT, join(outDir, "registration-smoke.md"));
  await guardedWriteRecord({ root: ROOT, rel: relJson, content: JSON.stringify(full, null, 2) + "\n", rotate: args.rotate });
  await guardedWriteRecord({ root: ROOT, rel: relMd, content: recordMd(rec, args.concept, args.map), rotate: args.rotate });

  if (rec.pass) {
    console.error(`✓ PASS — lens readable (${rec.lens.bands.length} band(s), roof ${rec.lens.roof.dominantBlock}); ` +
      `kit dry-run ok (${rec.kitDryRun.bandNames.join(", ")}). Records: ${relJson} + .md`);
    process.exit(0);
  }
  console.error(`✗ REFUSED — ${rec.refusal.stage}: ${rec.refusal.reason} (cheap: no TRELLIS call was made). ` +
    `Records: ${relJson} + .md`);
  process.exit(1);
}

main().catch((e) => {
  console.error(`registration-smoke failed:\n  ${e.message}`);
  process.exit(1);
});
