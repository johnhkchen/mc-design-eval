// A style's concept sheet: the same four views for every style (aerial, street, landmark, design sheet), from its
// styles/<id>.json and the shared look (look.mjs), so styles compare side by side and a new one is a data change.
// Existing images are kept; --redo <view> regenerates one, --note "..." adds a revision note (revise on comment).
//   node src/concept/style-concept.mjs <style ...> [--views aerial,street] [--redo street] [--note "..."]
import { codexImage } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/codex-image.mjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { prompt, VIEWS } from "./look.mjs";

const HERE = new URL(".", import.meta.url).pathname, ROOT = `${HERE}../..`;
const argv = process.argv.slice(2), opt = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
const ids = argv.filter((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
const views = (opt("--views") || Object.keys(VIEWS).join(",")).split(","), redo = opt("--redo"), note = opt("--note");
const jobs = [];
for (const id of ids) for (const v of views) jobs.push([JSON.parse(readFileSync(`${ROOT}/styles/${id}.json`, "utf8")), v]);
let i = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (i < jobs.length) {
    const [s, v] = jobs[i++], OUT = `${ROOT}/out/concept/styles/${s.id}`; mkdirSync(OUT, { recursive: true });
    const out = `${OUT}/${v}.png`;
    if (existsSync(out)) { if (redo !== v) continue; renameSync(out, `${OUT}/${v}.${Date.now()}.png`); }
    const p = prompt(s, v) + (note && redo === v ? `\n\nREVISION NOTE: ${note}` : "");
    writeFileSync(`${OUT}/${v}.prompt.txt`, p + "\n");
    try { const r = await codexImage({ prompt: p, size: VIEWS[v].size }); writeFileSync(out, Buffer.from(r.base64, "base64")); console.log(`done ${s.id} ${v}`); }
    catch (e) { console.log(`failed ${s.id} ${v}: ${e.message.slice(0, 160)}`); }
  }
}));
console.log("all done");
