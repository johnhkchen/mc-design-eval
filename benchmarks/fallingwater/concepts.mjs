// Fallingwater concept art through src/images.mjs (Codex on the ChatGPT plan by default): site sheets + iconic views.
//   node benchmarks/fallingwater/concepts.mjs [--sheets 3] [--iconic 2]
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { makeImage } from "../../src/images.mjs";
import { PROMPTS } from "./brief.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const out = join(HERE, "concepts");
mkdirSync(out, { recursive: true });
const jobs = [...Array.from({ length: Number(arg("--sheets", 3)) }, (_, i) => ["sheet", i + 1]), ...Array.from({ length: Number(arg("--iconic", 2)) }, (_, i) => ["iconic", i + 1])];
writeFileSync(join(out, "prompts.json"), JSON.stringify(PROMPTS, null, 1) + "\n");
let next = 0;
const done = [];
await Promise.all(Array.from({ length: 3 }, async () => {
  while (next < jobs.length) {
    const [kind, i] = jobs[next++];
    try {
      const r = await makeImage({ prompt: PROMPTS[kind], variant: `${kind}-${i}`, purpose: `fallingwater ${kind} ${i}` });
      const f = join(out, `${kind}-${i}.${r.mediaType === "image/png" ? "png" : "jpg"}`);
      writeFileSync(f, Buffer.from(r.base64, "base64"));
      done.push(f);
      console.log(`${kind} ${i}: ${r.provider} ${Math.round(r.ms / 1000)}s${r.cached ? " (cached)" : ""}`);
    } catch (e) { console.log(`${kind} ${i}: FAILED ${String(e).slice(0, 160)}`); }
  }
}));
const FONT = ["/System/Library/Fonts/Supplemental/Arial.ttf"].find(existsSync);
if (done.length) execFileSync("magick", [...done.sort().flatMap((f) => ["(", f, "-resize", "x420", ")"]), "+append", "-resize", "2400x>", "-quality", "85", join(out, "contact.jpg")]);
