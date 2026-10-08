// Put a structure .nbt facade through the CLASSIC benchmark camera + judge, so builds made outside the harness (e.g. by
// the minecraft-design plugin agentically) compare with runs 001-037.
//   MC_JUDGE_MODEL_ID=claude-opus-4-8 node benchmarks/temple-facade/nbt-classic.mjs <facade.nbt> <out-dir> [--note "..."]
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TEMPLE_FACADE_TASK } from "./task.mjs";
import { judgeRender } from "./judge.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const { load } = await import(join(HERE, "..", "..", "..", "minecraft-design", "tools", "src", "structure.mjs"));
const [nbtPath, outDir] = process.argv.slice(2);
const note = process.argv.includes("--note") ? process.argv[process.argv.indexOf("--note") + 1] : "";
mkdirSync(outDir, { recursive: true });
const g = load(nbtPath);
const placements = g.solids().map((c) => ({ op: "voxel", pos: c.pos, block: c.block, ...(c.state ? { state: c.state } : {}) }));
const artifact = { placements };
writeFileSync(join(outDir, "artifact.json"), JSON.stringify(artifact) + "\n");
const { renderArtifact } = await import("../../render/src/render-tool.mjs");
const rep = await renderArtifact(artifact, { outPath: join(outDir, "render.png"), view: TEMPLE_FACADE_TASK.view });
const score = await judgeRender({ imagePath: join(outDir, "render.png"), brief: TEMPLE_FACADE_TASK.goal });
writeFileSync(join(outDir, "summary.json"), JSON.stringify({ source: nbtPath, blocks: rep.placed, unmapped: rep.unmapped?.length ?? 0, score, note }, null, 1) + "\n");
console.log(JSON.stringify({ blocks: rep.placed, unmapped: rep.unmapped?.length ?? 0, overall: score.overall, detail: score.detail }));
