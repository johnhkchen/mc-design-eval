#!/usr/bin/env node
// Rebuild every Lordaeron asset from source, gate them all, and (with --pack <name>) pack them as one batch. An
// improvement to a module, a palette or a rule reaches every asset in one run: run this, read the gate, ship.
//   node src/lordaeron/build-all.mjs [--pack 010-lordaeron-refresh] [--thread 0005]     (from work/enterprise)
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { paletteMap } from "./assemble.mjs";
import { Grid } from "../grid.mjs";
import { hall, HALLS } from "./halls.mjs";
import { marketHall } from "./market.mjs";
import { marketCross } from "./forum.mjs";
import { masonsSquare } from "./square.mjs";
import { PIECES, watchtower } from "./walls.mjs";
import { pierSegment, dockHead } from "./docks.mjs";
import { stall, TRADES as STALL_TRADES, WS as STALL_WS } from "./stalls.mjs";
import { workshop, TRADES } from "./workshops.mjs";
import { comfort, COMFORTS } from "./comforts.mjs";

const argv = process.argv.slice(2), opt = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
// --kingdom k: the same module set and plans in another kingdom's palettes (assets-src/kingdoms/<k>/palettes.json,
// whose `aliases` map Lordaeron's palette names to its own); even the fixed-material pieces take its town palette
const KINGDOM = opt("--kingdom") || "lordaeron", OTHER = KINGDOM !== "lordaeron";
const DATA = `bundle/core/src/main/resources/data/enterprise/structure/${KINGDOM}`, PREV = `bundle/assets-src/${KINGDOM}`;
const lordaeron = JSON.parse(fs.readFileSync("bundle/assets-src/kingdoms/lordaeron/palettes.json", "utf8"));
const kp = OTHER ? JSON.parse(fs.readFileSync(`bundle/assets-src/kingdoms/${KINGDOM}/palettes.json`, "utf8")) : null;
const palettes = OTHER ? { base: lordaeron.base, palettes: { [lordaeron.base]: lordaeron.palettes[lordaeron.base], ...Object.fromEntries(Object.entries(kp.palettes).map(([k, v]) => [`k:${k}`, v])) } } : lordaeron;
const palOf = (name) => (OTHER ? `k:${kp.aliases[name] || name}` : name);
const FIXED = OTHER ? "stone" : null;
const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit" });
const written = [];
function save(dir, name, grid, meta, palette) {
  fs.mkdirSync(`${DATA}/${dir}`, { recursive: true });
  let g = grid;
  palette = palette || FIXED;
  if (palette) { const map = paletteMap(palettes, palOf(palette)), p = new Grid(grid.size); for (const [x, y, z, s] of grid.each()) p.set(x, y, z, map(s)); g = p; }
  g.save(`${DATA}/${dir}/${name}.nbt`);
  const old = fs.existsSync(`${DATA}/${dir}/${name}.json`) ? JSON.parse(fs.readFileSync(`${DATA}/${dir}/${name}.json`, "utf8")) : {};
  fs.writeFileSync(`${DATA}/${dir}/${name}.json`, JSON.stringify({ ...old, ...meta, id: `enterprise:${KINGDOM}/${dir}/${name}`, rev: (old.rev || 0) + 1, kingdom: KINGDOM,
    ...(OTHER ? { palette: kp.aliases[palette] || palette } : {}),
    footprint: [g.size[0], g.size[2]], height: g.size[1] }, null, 2) + "\n");
  written.push(`${dir}/${name}`);
}

// the module set and golden houses (its own builder: modules, set file, goldens x palettes, reference composer)
if (!OTHER) run("node", ["src/lordaeron/build-relief.mjs"]);
// halls
for (const kind of Object.keys(HALLS)) { const h = hall(kind), g = h.grid; save("hall", `${kind}_${g.size[0]}x${g.size[2]}_a`, g, { assembly: { set: "lordaeron/timber_relief", layout: h.layout } }, h.spec.palette); }
{ const r = marketHall(); save("hall", "market_hall_12x12_a", r.grid, { assembly: { set: "lordaeron/timber_relief", layout: r.layout } }, "stone"); }
{ const r = masonsSquare(); save("hall", "square_9x9_a", r.grid, { ...r.meta, relief_faces: [] }); }
save("hall", "watchtower_7x7_a", watchtower(), {});
{ const r = marketCross(); save("forum", "market_cross_7x7_a", r.grid, r.meta); }
for (const [n, f] of [["dock_pier_3x4_a", pierSegment], ["dock_head_5x5_a", dockHead]]) { const r = f(); save("dock", n, r.grid, { pilings: r.pilings, relief_faces: [] }); }
for (const [name, f] of Object.entries(PIECES)) save("wall", name.includes("x") ? name.replace(/_(\d+x\d+)$/, "_$1_a") : `${name}_a`, f(), { relief_faces: name.match(/tower|corner|gatehouse/) ? ["north", "south", "east", "west"].slice(0, name.startsWith("gatehouse") ? 2 : 4) : ["north", "south"] });
for (const t of STALL_TRADES) { const s = stall(t); save("stall", `stall_${t}_3x3_a`, s.grid, { ...s.meta, relief_faces: [] }); }
const PAL = ["stone", "brick", "daub"];
TRADES.forEach((t, i) => {
  const r = workshop(t);
  save("workshop", `workshop_${t}_12x9_a`, r.grid, { kind: "workshop", slot: `workshop:${t}`, ground: 2, mirror: true, entrances: [r.meta.entrance], beds: r.meta.beds,
    workstations: r.meta.workstations.map((w) => ({ ...w, block: `minecraft:${STALL_WS[t].replace(/\[.*$/, "")}` })), lockers: [], markers: [], pilings: [], entities: [],
    assembly: { set: "lordaeron/timber_relief", layout: r.layout } }, PAL[i % 3]);
});
for (const k of Object.keys(COMFORTS)) { const r = comfort(k), g = r.grid; save("comfort", `${r.spec.name.replace(/ /g, "_")}_${g.size[0]}x${g.size[2]}_a`, g, { kind: "comfort", slot: `comfort:${k}`, style: `the ${r.spec.name}`, beds: [], workstations: [], lockers: [], markers: [], entities: [], ground: 2, assembly: { set: "lordaeron/timber_relief", layout: r.layout } }, r.spec.palette); }
console.log(`rebuilt ${written.length} structures (plus the module set and golden houses)`);

// previews for everything rebuilt here, then the gate over the whole kingdom's production folders
for (const w of written) { const d = `${PREV}/${w}`; fs.mkdirSync(d, { recursive: true }); run("node", ["../../tools/preview.mjs", `${DATA}/${w}.nbt`, `${d}/front.jpg`]); }
const prod = ["hall", "forum", "dock", "wall", "stall", "workshop", "comfort"].map((d) => `${DATA}/${d}`).concat(OTHER ? [] : ["cottage_9x9_b", "townhouse_12x9_b", "terrace_21x9_b"].map((n) => `${DATA}/home/${n}.nbt`));
try { run("node", ["../../tools/gate.mjs", ...prod, "--no-interior"]); } catch { console.log("GATE: failures above"); process.exitCode = 1; }
if (opt("--pack") && !process.exitCode) run("node", ["../../tools/pack.mjs", "bundle", opt("--pack"), "--thread", opt("--thread") || "0005", "--out", "out/batches",
  "--only", [`core/src/main/resources/data/enterprise/structure/${KINGDOM}/`, "core/src/main/resources/data/enterprise/town_kits/lordaeron/", "core/src/main/resources/data/enterprise/town_rules/", `assets-src/${KINGDOM}/`, "assets-src/kingdoms/", "scripts/assets/lordaeron-ref/"].join(",")]);
