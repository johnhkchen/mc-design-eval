// usage: node iv.mjs file.nbt outdir "label=u,y,z>u,y,z" ...   (screen coords; converted to world x = 29-u)
import { spawnSync } from "node:child_process";
import fs from "node:fs";
const [, , file, out, ...views] = process.argv;
fs.mkdirSync(out, { recursive: true });
const args = ["/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs", "render", file, "--front", "n", "--out", `${out}/sheet.png`, "--tiles", out];
const cv = (s) => { const [u, y, z] = s.split(",").map(Number); return `${29 - u},${y},${z}`; };
for (const v of views) {
  const [label, rest] = v.split("=");
  const [a, b] = rest.split(">");
  args.push("--eye", cv(a), "--look", cv(b), "--label", label);
}
const r = spawnSync("node", args, { encoding: "utf8", env: { ...process.env, MCD_TILE_SCALE: process.env.MCD_TILE_SCALE ?? "2" } });
const files = fs.readdirSync(out).filter((f) => /eye|view/i.test(f));
console.log(r.status, r.stderr.slice(0, 300), files.join(" "));
