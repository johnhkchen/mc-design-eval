// The forum frontage set, golden in its palette (or another kingdom's), previews and the gate.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { forumFront, FRONTS } from "./forum-front.mjs";
import { paletteMap } from "./assemble.mjs";
import { Grid } from "../grid.mjs";
const KINGDOM = process.argv[2] || "lordaeron";
const DATA = `bundle/core/src/main/resources/data/enterprise/structure/${KINGDOM}/hall`, PREV = `bundle/assets-src/${KINGDOM}/hall`;
const lord = JSON.parse(fs.readFileSync("bundle/assets-src/kingdoms/lordaeron/palettes.json", "utf8"));
const kp = KINGDOM === "lordaeron" ? null : JSON.parse(fs.readFileSync(`bundle/assets-src/kingdoms/${KINGDOM}/palettes.json`, "utf8"));
const palettes = kp ? { base: lord.base, palettes: { [lord.base]: lord.palettes[lord.base], ...Object.fromEntries(Object.entries(kp.palettes).map(([k, v]) => [`k:${k}`, v])) } } : lord;
const palOf = (n) => (kp ? `k:${kp.aliases[n] || n}` : n);
fs.mkdirSync(DATA, { recursive: true });
const names = [];
for (const kind of Object.keys(FRONTS)) {
  const r = forumFront(kind), map = paletteMap(palettes, palOf(r.spec.palette)), g = new Grid(r.grid.size);
  for (const [x, y, z, s] of r.grid.each()) g.set(x, y, z, map(s));
  const name = `${kind}_${g.size[0]}x${g.size[2]}_a`; names.push(name);
  g.save(`${DATA}/${name}.nbt`);
  fs.writeFileSync(`${DATA}/${name}.json`, JSON.stringify({ id: `enterprise:${KINGDOM}/hall/${name}`, rev: 1, kingdom: KINGDOM, kind: "hall", slot: `forum_front:${kind}`, style: r.spec.note,
    palette: kp ? kp.aliases[r.spec.palette] || r.spec.palette : r.spec.palette, footprint: [g.size[0], g.size[2]], height: g.size[1], ground: 2, faces: "the forum (front, south)",
    beds: [], workstations: [], lockers: [], markers: [], entities: [], assembly: { set: "lordaeron/timber_relief", layout: r.layout } }, null, 2) + "\n");
  fs.mkdirSync(`${PREV}/${name}`, { recursive: true });
  execFileSync("node", ["../../tools/preview.mjs", `${DATA}/${name}.nbt`, `${PREV}/${name}/front.jpg`], { stdio: "ignore" });
  execFileSync("node", ["../../tools/preview.mjs", `${DATA}/${name}.nbt`, `${PREV}/${name}/cutaway.jpg`, "--cut", String(2 + 5 + 4)], { stdio: "ignore" });
}
try { execFileSync("node", ["../../tools/gate.mjs", ...names.map((n) => `${DATA}/${n}.nbt`)], { stdio: "inherit" }); } catch { process.exitCode = 1; }
