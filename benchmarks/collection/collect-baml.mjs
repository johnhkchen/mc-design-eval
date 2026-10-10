// Run subjects through the PLUGIN's packed BAML workflow (minecraft-design/tools/bin/mcd-agent.mjs collect) instead of
// build.mjs: same brief and Codex concept, all subjects at once (parallel, never serial).
//   node benchmarks/collection/collect-baml.mjs <subject>... | --all     (subjects.mjs keys)
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { SUBJECTS, conceptPrompt } from "./subjects.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const AGENT = join(HERE, "..", "..", "..", "minecraft-design", "tools", "bin", "mcd-agent.mjs");
const SCALE = "1:1 scale, a player is 2 blocks tall (doors 2 tall, storeys 4)";
const keys = process.argv.includes("--all") ? Object.keys(SUBJECTS) : process.argv.slice(2);
if (!keys.length || keys.some((k) => !SUBJECTS[k])) throw new Error(`subjects: ${Object.keys(SUBJECTS).join(", ")} | --all`);
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");

await Promise.all(keys.map(async (key) => {
  const s = SUBJECTS[key], dir = join(HERE, "runs", `${stamp}-${key}-baml`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "brief.txt"), `BUILD: ${s.name}: ${s.what}.\nSIZE: about ${s.size.w} wide (front, x), ${s.size.d} deep, ${s.size.h} tall; ${SCALE}\n`);
  const { makeImage } = await import("../../src/images.mjs");
  const r = await makeImage({ prompt: conceptPrompt(s), variant: "c1", purpose: `collection concept ${key}` });
  const concept = join(dir, "concept." + (r.mediaType === "image/png" ? "png" : "jpg"));
  if (!existsSync(concept)) writeFileSync(concept, Buffer.from(r.base64, "base64"));
  await new Promise((res) => spawn("node", [AGENT, "collect", "--dir", dir, "--name", key, "--brief-file", join(dir, "brief.txt"), "--concept", concept],
    { stdio: ["ignore", "inherit", "inherit"] }).on("close", res));
}));
