// Avenue frontage: terrace and corner houses (plan.json kinds), golden in each palette, and a demo row (corner, two
// terraces, corner) for the preview. Gated (contract, relief on the street faces, interiors).
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { compose, layoutOf, metaOf } from "./compose.mjs";
import { paletteMap } from "./assemble.mjs";
import { Grid } from "../grid.mjs";
const KINGDOM = process.argv[2] || "lordaeron";
const DATA = `bundle/core/src/main/resources/data/enterprise/structure/${KINGDOM}/home`, PREV = `bundle/assets-src/${KINGDOM}/home`;
const lord = JSON.parse(fs.readFileSync("bundle/assets-src/kingdoms/lordaeron/palettes.json", "utf8"));
const kp = KINGDOM === "lordaeron" ? null : JSON.parse(fs.readFileSync(`bundle/assets-src/kingdoms/${KINGDOM}/palettes.json`, "utf8"));
const palettes = kp ? { base: lord.base, palettes: { [lord.base]: lord.palettes[lord.base], ...Object.fromEntries(Object.entries(kp.palettes).map(([k, v]) => [`k:${k}`, v])) } } : lord;
const palOf = (n) => (kp ? `k:${kp.aliases[n] || n}` : n);
const KINDS = {
  terrace: { party: [true, true] },
  corner: { party: [true, false], corner: "east", shop: true, trade: "any" },
};
fs.mkdirSync(DATA, { recursive: true });
const out = [];
for (const [kind, k] of Object.entries(KINDS)) for (const pal of ["stone", "brick", "daub"]) {
  const p = { W: 10, D: 7, storeys: 3, roof: "gable_x", ...k }, L = layoutOf(p), g0 = compose(L), m = metaOf(L);
  const map = paletteMap(palettes, palOf(pal)), g = new Grid(g0.size); for (const [x, y, z, s] of g0.each()) g.set(x, y, z, map(s));
  const name = `${kind}_${g.size[0]}x${g.size[2]}_a${pal === "stone" ? "" : `__${kp ? kp.aliases[pal] || pal : pal}`}`;
  g.save(`${DATA}/${name}.nbt`); out.push(name);
  fs.writeFileSync(`${DATA}/${name}.json`, JSON.stringify({ id: `enterprise:${KINGDOM}/home/${name}`, rev: 1, kingdom: KINGDOM, kind: "home", body_kind: kind, palette: kp ? kp.aliases[pal] || pal : pal,
    footprint: [g.size[0], g.size[2]], height: g.size[1], ground: 2, party_faces: [k.party[0] && "west", k.party[1] && "east"].filter(Boolean),
    relief_faces: kind === "corner" ? ["south", "east"] : ["south"], entrances: [m.entrance], beds: m.beds, workstations: [], lockers: [], markers: [], entities: [],
    assembly: { set: "lordaeron/timber_relief", layout: L } }, null, 2) + "\n");
}
// the demo row: corner (mirrored, to the west), two terraces, corner (east), shoulder to shoulder, the way town_rules
// varies a street: palettes alternate, and a terrace turns its gable to the street (gable_z) every other house
const unit = (k, roof, pal) => { const g0 = compose(layoutOf({ W: 10, D: 7, storeys: 3, roof, ...k })), map = paletteMap(palettes, palOf(pal)), g = new Grid(g0.size); for (const [x, y, z, s] of g0.each()) g.set(x, y, z, map(s)); return g; };
const parts = [unit({ party: [false, true], corner: "west", shop: true, trade: "any" }, "gable_x", "stone"), unit({ party: [true, true], doorBay: 0 }, "gable_z", "daub"),
  unit({ party: [true, true], doorBay: 2, shop: true, trade: "any" }, "gable_x", "brick"), unit({ party: [true, true], doorBay: 1 }, "gable_z", "daub"), unit(KINDS.corner, "gable_x", "stone")];
const row = new Grid([parts.reduce((a, g) => a + g.size[0], 0), Math.max(...parts.map((g) => g.size[1])), 9]);
let x = 0; for (const g of parts) { row.paste(g, x, 0, 0); x += g.size[0]; }
fs.mkdirSync("out/frontage", { recursive: true }); row.save(`out/frontage/${KINGDOM}_avenue_row.nbt`);
for (const n of out.filter((n) => !n.includes("__"))) { fs.mkdirSync(`${PREV}/${n}`, { recursive: true }); execFileSync("node", ["../../tools/preview.mjs", `${DATA}/${n}.nbt`, `${PREV}/${n}/front.jpg`], { stdio: "ignore" }); }
execFileSync("node", ["../../tools/preview.mjs", `out/frontage/${KINGDOM}_avenue_row.nbt`, `out/frontage/${KINGDOM}_avenue_row.jpg`, "--width", "1400"], { stdio: "ignore" });
try { execFileSync("node", ["../../tools/gate.mjs", ...out.map((n) => `${DATA}/${n}.nbt`)], { stdio: "inherit" }); } catch { process.exitCode = 1; }
