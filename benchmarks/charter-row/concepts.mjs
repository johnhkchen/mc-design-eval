// Concept sheets for Charter Row: several candidates per building (Nano Banana 2.1, reference-sheet prompt with the
// Row style guide + 1:1 scale), each measured (Gemini box + block pitch) against the brief's width x height.
//   node benchmarks/charter-row/concepts.mjs [--only key,key] [--n 3]
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { generateImage } from "../../src/nano-banana.mjs";
import { locateWithGemini, findElevation } from "../gauntlet/sheet-trace.mjs";
import { BUILDINGS, conceptPrompt } from "./row.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const tag = arg("--tag", "");          // e.g. v2: files v2-c1.png ..., strip v2-strip.jpg (keeps earlier rounds)
const keys = arg("--only") ? arg("--only").split(",") : Object.keys(BUILDINGS), n = Number(arg("--n", 3));
const stripsOnly = process.argv.includes("--strips-only");   // re-measure existing candidates and rebuild the strips
const FONT = ["/System/Library/Fonts/Supplemental/Arial.ttf", "/System/Library/Fonts/Helvetica.ttc"].find(existsSync);
const jobs = keys.flatMap((k) => Array.from({ length: n }, (_, i) => ({ k, i: i + 1 })));
const results = [];
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const { k, i } = jobs[next++];
    const dir = join(HERE, "concepts", k);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${tag ? tag + "-" : ""}prompt.txt`), conceptPrompt(k) + "\n");
    const file = join(dir, `${tag ? tag + "-" : ""}c${i}.png`);
    try {
      const img = stripsOnly ? { ms: 0 } : await generateImage({ prompt: conceptPrompt(k) });
      if (stripsOnly && !existsSync(file)) continue;
      if (!stripsOnly) writeFileSync(file, Buffer.from(img.base64, "base64"));
      const b = BUILDINGS[k].size;
      let m = null;
      try { const box = await locateWithGemini(file); const f = findElevation(file, box); m = { cols: f.cols, rows: f.rows, err: +Math.max(Math.abs(f.cols - b.w) / b.w, Math.abs(f.rows - b.h) / b.h).toFixed(2) }; } catch { /* unmeasurable */ }
      results.push({ k, i, file, ms: img.ms, measured: m });
      console.log(`${k} c${i}: ${img.ms} ms, measured ${m ? `${m.cols}x${m.rows} (target ${b.w}x${b.h}, err ${m.err})` : "?"}`);
    } catch (e) { console.log(`${k} c${i}: FAILED ${String(e).slice(0, 120)}`); }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
// one contact strip per building, labelled
for (const k of keys) {
  const rs = results.filter((r) => r.k === k).sort((a, b) => a.i - b.i);
  if (!rs.length) continue;
  const b = BUILDINGS[k];
  const parts = rs.flatMap((r) => ["(", r.file, "-resize", "x360", "-gravity", "north", "-background", "white", "-splice", "0x28", ...(FONT ? ["-font", FONT] : []), "-pointsize", "20", "-annotate", "+0+4",
    `c${r.i}  ${r.measured ? `${r.measured.cols}x${r.measured.rows} blocks` : "?"}`, ")"]);
  execFileSync("magick", [...parts, "+append", "-gravity", "northwest", "-splice", "0x34", ...(FONT ? ["-font", FONT] : []), "-pointsize", "24", "-annotate", "+8+4", `${b.name}  (brief ${b.size.w}w x ${b.size.h}h, newness ${b.newness})`, join(HERE, "concepts", k, `${tag ? tag + "-" : ""}strip.jpg`)]);
}
writeFileSync(join(HERE, "concepts", `${tag ? tag + "-" : ""}results.json`), JSON.stringify(results.map((r) => ({ ...r, file: r.file.replace(HERE + "/", "") })), null, 1) + "\n");
