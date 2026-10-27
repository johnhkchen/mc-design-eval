// The gatehouse quarter: stable, wagon yard, toll house, in a kingdom's palette, previewed and gated.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { stable, wagonYard, tollHouse } from "./gatehouse-quarter.mjs";
import { paletteMap } from "./assemble.mjs";
import { Grid } from "../grid.mjs";
const KINGDOM = process.argv[2] || "lordaeron";
const DATA = `bundle/core/src/main/resources/data/enterprise/structure/${KINGDOM}/gate_quarter`, PREV = `bundle/assets-src/${KINGDOM}/gate_quarter`;
const lord = JSON.parse(fs.readFileSync("bundle/assets-src/kingdoms/lordaeron/palettes.json", "utf8"));
const kp = KINGDOM === "lordaeron" ? null : JSON.parse(fs.readFileSync(`bundle/assets-src/kingdoms/${KINGDOM}/palettes.json`, "utf8"));
const palettes = kp ? { base: lord.base, palettes: { [lord.base]: lord.palettes[lord.base], ...Object.fromEntries(Object.entries(kp.palettes).map(([k, v]) => [`k:${k}`, v])) } } : lord;
const palOf = (n) => (kp ? `k:${kp.aliases[n] || n}` : n);
fs.mkdirSync(DATA, { recursive: true });
const ITEMS = [
  ["stable", stable, "daub", { slot: "stable", note: "stalls for the trains' llamas (the sim spawns them): open bays to the street, rails, hay, troughs" }],
  ["wagon_yard", wagonYard, "stone", { slot: "wagon_yard", note: "a paved yard with a loading dock along the back; the gate (3 wide) at the front's middle", relief_faces: [] }],
  ["toll_house", tollHouse, "stone", { slot: "toll_house", note: "astride a 3-wide road running north-south through x 3-5: two booths, a roofed arch, gates across the road (open)", relief_faces: [] }],
];
const names = [];
for (const [kind, f, pal, extra] of ITEMS) {
  const r = f(), map = paletteMap(palettes, palOf(pal)), g = new Grid(r.grid.size);
  for (const [x, y, z, s] of r.grid.each()) g.set(x, y, z, map(s));
  const name = `${kind}_${g.size[0]}x${g.size[2]}_a`; names.push(name);
  g.save(`${DATA}/${name}.nbt`);
  fs.writeFileSync(`${DATA}/${name}.json`, JSON.stringify({ id: `enterprise:${KINGDOM}/gate_quarter/${name}`, rev: 1, kingdom: KINGDOM, kind: "hall", palette: kp ? kp.aliases[pal] || pal : pal,
    footprint: [g.size[0], g.size[2]], height: g.size[1], ground: 2, beds: [], workstations: [], lockers: [], markers: [], entities: [], ...extra,
    ...(r.layout ? { assembly: { set: "lordaeron/timber_relief", layout: r.layout } } : {}) }, null, 2) + "\n");
  fs.mkdirSync(`${PREV}/${name}`, { recursive: true });
  execFileSync("node", ["../../tools/preview.mjs", `${DATA}/${name}.nbt`, `${PREV}/${name}/front.jpg`], { stdio: "ignore" });
}
try { execFileSync("node", ["../../tools/gate.mjs", ...names.map((n) => `${DATA}/${n}.nbt`)], { stdio: "inherit" }); } catch { process.exitCode = 1; }
