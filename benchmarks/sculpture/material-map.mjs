// LLM MATERIAL-MAP sweep — the E-21 "define style" step (T-071-01 / S-071 / E-21).
//
// For each subject (gatehouse, cottage) it runs the multimodal MaterialMap BAML function over the
// concept image + design doc and writes a validated material map to material-map/<subj>.json. The map
// PRESERVES near-tone-distinct materials (stone_bricks AND cobblestone, not one merged grey) — the fix
// for the mean-color collapse. The map DEFINES E-21's allowed palette (the downstream geometric-feature
// assignment consumes it).
//
// PURE/LIVE split (project idiom): the parse + validate + near-tone metric is src/form/material-map.mjs
// (unit-tested, no live call). This runner is the IMPURE leaf — it spawns the metered tsx bridge
// (src/form/baml-material-map.mts → claude -p subscription) and does file I/O.
//
//   node benchmarks/sculpture/material-map.mjs            # live metered sweep, writes <subj>.json + <subj>.raw.json
//   node benchmarks/sculpture/material-map.mjs --offline  # re-validate committed <subj>.raw.json, no live call
//
// Writes material-map/{gatehouse,cottage}.{json,raw.json}. The JSON is the durable record (committed);
// there are no PNG renders, so nothing is gitignored.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";

import {
  parseMaterialMap,
  preservesDistinctGreys,
  nearTonePairs,
} from "../../src/form/material-map.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const OUT_DIR = join(HERE, "material-map");
const BRIDGE = join(REPO, "src", "form", "baml-material-map.mts");

const RUNS = join(HERE, "runs");
const SUBJECTS = [
  {
    key: "gatehouse",
    runDir: join(RUNS, "015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate"),
  },
  { key: "cottage", runDir: join(RUNS, "014-vConcept-a-cottage") },
];

const OFFLINE = process.argv.includes("--offline");

/** Spawn the metered tsx bridge with {conceptPath, docPath?} on stdin → parsed {materials}. LIVE. */
function callBridge(conceptPath, docPath) {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", BRIDGE], { cwd: REPO, stdio: ["pipe", "pipe", "inherit"] });
    let out = "";
    child.stdout.on("data", (c) => (out += c.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`baml-material-map exited ${code}`));
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject(new Error(`baml-material-map: unparseable output (${e.message})\n${out.slice(0, 300)}`));
      }
    });
    child.stdin.end(JSON.stringify({ conceptPath, ...(docPath ? { docPath } : {}) }));
  });
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  const summary = [];

  for (const { key, runDir } of SUBJECTS) {
    const conceptPath = join(runDir, "concept.png");
    const docPath = join(runDir, "design-doc.md");
    const hasDoc = existsSync(docPath);
    const rawPath = join(OUT_DIR, `${key}.raw.json`);

    let raw;
    if (OFFLINE) {
      if (!existsSync(rawPath)) {
        console.error(`[${key}] --offline: no committed ${key}.raw.json — skipping`);
        continue;
      }
      raw = JSON.parse(await readFile(rawPath, "utf8"));
      console.error(`[${key}] offline: re-validating committed raw reply`);
    } else {
      if (!existsSync(conceptPath)) {
        console.error(`[${key}] no concept.png at ${conceptPath} — skipping`);
        continue;
      }
      console.error(`[${key}] live: concept=${conceptPath} doc=${hasDoc ? "yes" : "(none)"}`);
      raw = await callBridge(conceptPath, hasDoc ? docPath : undefined);
      await writeFile(rawPath, JSON.stringify(raw, null, 2) + "\n");
    }

    const { map, dropped, palette, stats } = parseMaterialMap(raw);
    const preserves = preservesDistinctGreys(map);
    const nearTone = nearTonePairs(map).map(([a, b, dL]) => ({ a, b, dL }));

    const record = {
      schema: "material-map/v1",
      subject: key,
      generatedFrom: {
        concept: `runs/${key === "gatehouse" ? "015-vBuilding-a-stone-gatehouse-with-a-peaked-gable-roof-and-an-arched-gate" : "014-vConcept-a-cottage"}/concept.png`,
        designDoc: hasDoc ? "design-doc.md" : null,
      },
      map,
      palette,
      dropped,
      stats,
      preservesNearTone: preserves,
      nearTonePairs: nearTone,
    };
    await writeFile(join(OUT_DIR, `${key}.json`), JSON.stringify(record, null, 2) + "\n");

    summary.push({ key, kept: stats.kept, dropped: stats.dropped, distinct: stats.distinctBlocks, preserves });
    console.error(
      `[${key}] kept=${stats.kept} dropped=${stats.dropped} distinct=${stats.distinctBlocks} ` +
        `preservesNearTone=${preserves} palette=${palette.join(", ")}`,
    );
  }

  console.error("\n== material-map summary ==");
  for (const s of summary) {
    console.error(`  ${s.key.padEnd(10)} kept=${s.kept} dropped=${s.dropped} distinct=${s.distinct} nearTone=${s.preserves}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
