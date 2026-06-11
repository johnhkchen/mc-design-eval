// IMPURE RUNNER — concept-derived zone map (T-092-01, story S-092, epic E-25).
//
// The T-092 measurement record: derive each subject's zone map FROM ITS CONCEPT via the durable-skin
// pipeline (buildSkin, zoneSource "derived" — the same pure cores, the same committed inputs), then
//   1. SAVE the map to zone-map/<subject>.json (schema zone-map/v1) — the committed record durable-skin
//      asserts agreement with on every later run (the value-select precedent), with the registry PRIOR
//      and the derived-vs-prior DIFF embedded so the replacement of the building prior is auditable;
//   2. for the cottage, run the pipeline BOTH ways (zoneSource "prior" vs "derived") and render the
//      same front view of both finals — the before/after evidence that the ground storey now reads
//      half-timbered over a low plinth instead of the prior's full stone storey.
//
// Pure logic lives in src/color/band-profile.mjs + src/view/zone-map.mjs (unit-tested); this file is
// wiring: file I/O, GL renders (best-effort — a lens, never logic), frames, the records.
//
// GL — run on demand, NOT in `npm test`:
//   npm run zone:map                       # both subjects + cottage before/after frames
//   npm run zone:map -- --subject cottage  # one subject
//   npm run zone:map -- --no-render        # records only (GL-free)
//
// Writes zone-map/<subj>.{json,md} (committed) + zone-map/cottage/*.png (gitignored renders) +
// pr/assets/frames/zonemap-cottage-{before,after,strip}.png (committed evidence frames).

import { writeFile, mkdir, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildSkin, SUBJECTS } from "./durable-skin.mjs";
import { ROTATE_FLAG, guardedWriteRecord } from "../../src/form/pin-guard.mjs";
import { ZONE_MAP_SCHEMA } from "../../src/color/band-profile.mjs";
import { decodeImage } from "../../src/color/palette-extract.mjs";
import { resampleRgba, composeTriptych, RESEMBLANCE_DEFAULTS } from "../../src/form/resemblance.mjs";
import { encodeRgbaToPng } from "../../render/src/headless-canvas.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const HERE = join(ROOT, "benchmarks/sculpture");
const OUT_DIR = join(HERE, "zone-map");
const FRAMES_DIR = join(ROOT, "pr/assets/frames");
const DIR_TO_ANGLE = { "+z": "front", "-z": "back", "+x": "right", "-x": "left" };

/** Best-effort GL render at a named angle (a lens, never logic) — durable-skin's pattern. */
async function tryRenderAngle(artifact, angle, label, outDir) {
  try {
    const { renderViews } = await import("../../src/view/multi-angle.mjs");
    const [r] = await renderViews(artifact, [angle], { outDir, label: () => label });
    return { angle, path: r.path.replace(ROOT, "") };
  } catch (e) {
    return { angle, error: e.message };
  }
}

function recordOf(def, r) {
  const zm = r.zoneMap;
  return {
    schema: ZONE_MAP_SCHEMA,
    subject: def.key,
    inputs: { concept: def.concept, map: def.map, build: def.build },
    source: zm.source,                       // "concept" | "prior-fallback"
    ...(zm.reason ? { reason: zm.reason } : {}),
    derived: zm.source === "concept" ? { bands: zm.bands, roof: zm.roof } : null,
    prior: { policy: def.policy, storeyDivide: r.zones.storeyDivide, upperTop: r.zones.upperTop },
    diff: zm.diff ?? null,
    params: zm.params ?? null,
    note: "bands/roof are NAMED (pre-substitution) block space; durable-skin asserts agreement with " +
      "`derived` on every run (divergence throws). The prior is the recorded fallback + diff baseline.",
  };
}

function recordMd(rec) {
  const head = `# Zone map — ${rec.subject} (T-092-01)\n\n` +
    `Source: **${rec.source}**${rec.reason ? ` (${rec.reason})` : ""} — bands + dominants read from ` +
    `\`${rec.inputs.concept}\`, aligned to the structural floor-lines; the registry prior below is the ` +
    `recorded fallback, never an override.\n\n`;
  if (!rec.derived) {
    return head + `The concept region was unreadable; the prior policy applies and the use is recorded.\n` +
      `\n\`\`\`json\n${JSON.stringify(rec.prior.policy, null, 2)}\n\`\`\`\n`;
  }
  const bandRows = rec.derived.bands.map((b) =>
    `| ${b.name} | y ${b.yRange[0]}..${b.yRange[1]} | \`${b.dominantBlock}\` | ${b.dominantRole} | ` +
    `${b.secondaries.map((s) => `\`${s.block}\` (${Math.round(s.share * 100)}%)`).join(", ") || "—"} |`).join("\n");
  const roof = rec.derived.roof;
  const diffLines = rec.diff?.wallDiffs?.length
    ? rec.diff.wallDiffs.map((d) => `- y ${d.yRange[0]}..${d.yRange[1]}: prior \`${d.prior}\` → derived \`${d.derived}\``).join("\n")
    : "- walls: no per-y dominant differences";
  return head +
    `| band | yRange | dominant | role | secondaries |\n|---|---|---|---|---|\n${bandRows}\n` +
    `| roof | (membership ∪ y ≥ ${rec.prior.upperTop}) | \`${roof.dominantBlock}\` | ${roof.dominantRole} | ` +
    `${roof.secondaries.map((s) => `\`${s.block}\` (${Math.round(s.share * 100)}%)`).join(", ") || "—"} |\n\n` +
    `## Diff vs the prior (base=\`${rec.prior.policy.base.dominant}\` to y ${rec.prior.storeyDivide - 1}, ` +
    `upper=\`${rec.prior.policy.upper.dominant}\`, roof=\`${rec.prior.policy.roof.dominant}\`)\n${diffLines}\n` +
    `- roof: prior \`${rec.diff.roofDominant.prior}\` → derived \`${rec.diff.roofDominant.derived}\`` +
    `${rec.diff.roofDominant.changed ? " (CHANGED)" : " (same)"}\n`;
}

async function main() {
  const argv = process.argv.slice(2);
  const subjArg = argv.includes("--subject") ? argv[argv.indexOf("--subject") + 1] : "all";
  const render = !argv.includes("--no-render");
  const keys = subjArg === "all" ? Object.keys(SUBJECTS) : [subjArg];
  for (const k of keys) if (!SUBJECTS[k]) throw new Error(`unknown subject "${k}" (${Object.keys(SUBJECTS).join(", ")})`);
  await mkdir(OUT_DIR, { recursive: true });

  const results = {};
  for (const k of keys) {
    const def = SUBJECTS[k];
    let r;
    try {
      r = await buildSkin(def); // derived by default; throws on any pipeline gate failure
    } catch (e) {
      // A sweep DEFERS a failing subject (material-map precedent) — no record is written for it;
      // its own named command (skin:<k> / challenge:<k>) is where that failure is the result.
      // An explicit --subject <k> request still fails loudly.
      if (subjArg !== "all") throw e;
      console.error(`[${k}] DEFERRED — pipeline gate threw: ${e.message}`);
      continue;
    }
    results[k] = r;
    const rec = recordOf(def, r);
    // T-119-01: the deterministic derivation regenerates committed maps byte-identically (passes
    // the guard untouched); a DIFFERING derivation is a pin rotation and refuses without the flag.
    const rotate = argv.includes(ROTATE_FLAG);
    await guardedWriteRecord({ root: ROOT, rel: `benchmarks/sculpture/zone-map/${k}.json`, content: JSON.stringify(rec, null, 2) + "\n", rotate });
    await guardedWriteRecord({ root: ROOT, rel: `benchmarks/sculpture/zone-map/${k}.md`, content: recordMd(rec), rotate });
    console.error(`[${k}] zone map: ${rec.source}` + (rec.reason ? ` (${rec.reason})` : ""));
    if (rec.derived) {
      for (const b of rec.derived.bands) {
        console.error(`[${k}]   ${b.name} y ${b.yRange[0]}..${b.yRange[1]} ${b.dominantBlock} (${b.dominantRole})`);
      }
      console.error(`[${k}]   roof ${rec.derived.roof.dominantBlock} (${rec.derived.roof.dominantRole})`);
      const d = rec.diff.wallDiffs.map((x) => `y${x.yRange[0]}..${x.yRange[1]} ${x.prior}→${x.derived}`).join("; ");
      console.error(`[${k}]   diff vs prior: ${d || "walls identical"}`);
    }
    console.error(`✓ wrote zone-map/${k}.json + .md`);
  }

  // --- cottage before/after: the SAME pipeline, prior vs derived zone source ----------------------
  if (render && results.cottage) {
    const def = SUBJECTS.cottage;
    const subjDir = join(OUT_DIR, "cottage");
    await mkdir(subjDir, { recursive: true });
    await mkdir(FRAMES_DIR, { recursive: true });
    const prior = await buildSkin(def, { zoneSource: "prior" });
    const angle = DIR_TO_ANGLE[def.frontDir] ?? "front";
    const rBefore = await tryRenderAngle(prior.final, angle, "prior-front", subjDir);
    const rAfter = await tryRenderAngle(results.cottage.final, angle, "derived-front", subjDir);
    for (const [tag, r] of [["before(prior)", rBefore], ["after(derived)", rAfter]]) {
      console.error(`render ${tag}: ${r.path ?? `unavailable (${r.error})`}`);
    }
    try {
      if (rBefore.path && rAfter.path) {
        await copyFile(join(ROOT, rBefore.path), join(FRAMES_DIR, "zonemap-cottage-before.png"));
        await copyFile(join(ROOT, rAfter.path), join(FRAMES_DIR, "zonemap-cottage-after.png"));
        const P = RESEMBLANCE_DEFAULTS.panel;
        const panels = [
          resampleRgba(await decodeImage(join(HERE, def.concept)), P, P, "aspect"),
          resampleRgba(await decodeImage(join(ROOT, rBefore.path)), P, P, "aspect"),
          resampleRgba(await decodeImage(join(ROOT, rAfter.path)), P, P, "aspect"),
        ];
        const strip = composeTriptych(panels, {});
        await writeFile(join(FRAMES_DIR, "zonemap-cottage-strip.png"), encodeRgbaToPng(strip.data, strip.w, strip.h));
        console.error(`✓ frames: pr/assets/frames/zonemap-cottage-{before,after,strip}.png`);
      }
    } catch (e) {
      console.error(`frames: ${e.message}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
