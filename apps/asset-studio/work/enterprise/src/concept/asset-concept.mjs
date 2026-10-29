// Per-asset concept art: every asset the client's town generator lays (styles/assets.json), in a style, at its real
// footprint and storeys, so each picture maps 1:1 to a build. Files are named by asset id under the style.
//   node src/concept/asset-concept.mjs <style ...> [--core] [--only id,id] [--redo id --note "..."]
import { codexImage } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/codex-image.mjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { assetPrompt } from "./look.mjs";

const ROOT = `${new URL(".", import.meta.url).pathname}../..`;
const argv = process.argv.slice(2), opt = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
const ids = argv.filter((a, i) => !a.startsWith("--") && !["--only", "--redo", "--note"].includes(argv[i - 1]));
const catalog = JSON.parse(readFileSync(`${ROOT}/styles/assets.json`, "utf8")).assets;
const only = opt("--only")?.split(","), redo = opt("--redo"), note = opt("--note");
const pick = catalog.filter((a) => (only ? only.includes(a.id) : redo ? a.id === redo : argv.includes("--core") ? a.core : true));
const jobs = [];
for (const id of ids) for (const a of pick) jobs.push([JSON.parse(readFileSync(`${ROOT}/styles/${id}.json`, "utf8")), a]);
let i = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (i < jobs.length) {
    const [s, a] = jobs[i++], OUT = `${ROOT}/out/concept/styles/${s.id}/assets`; mkdirSync(OUT, { recursive: true });
    const out = `${OUT}/${a.id}.png`;
    if (existsSync(out)) { if (redo !== a.id) continue; renameSync(out, `${OUT}/${a.id}.${Date.now()}.png`); }
    const p = assetPrompt(s, a) + (note && redo === a.id ? `\n\nREVISION NOTE: ${note}` : "");
    writeFileSync(`${OUT}/${a.id}.prompt.txt`, p + "\n");
    const size = a.footprint[1] > a.footprint[0] * 1.6 ? "1024x1536" : "1536x1024";
    try { const r = await codexImage({ prompt: p, size }); writeFileSync(out, Buffer.from(r.base64, "base64")); console.log(`done ${s.id} ${a.id}`); }
    catch (e) { console.log(`failed ${s.id} ${a.id}: ${e.message.slice(0, 160)}`); }
  }
}));
console.log("all done");
