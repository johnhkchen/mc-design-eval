// Calls every vocab.mjs helper once on one grid and checks: each call changed cells, every placed id is in
// palette.json, every placed state is valid for its block (mcd states), and a few placements are where plan.md says.
// Run: node test-vocab.mjs   (exit 1 on any failure)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import * as V from "./vocab.mjs";

const MCD = "/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs";
const palette = JSON.parse(readFileSync(new URL("./palette.json", import.meta.url), "utf8"));
const allowed = new Set([...Object.values(palette.roles).flat(), ...palette.objects]);

// The same wrapper build.mjs puts around its grid: writes below y=0 are dropped and counted, not thrown.
const grid = new Grid(V.GRID_SIZE, { dataVersion: DATA_VERSIONS["26.3"] });
let dropped = 0;
const g = new Proxy(grid, {
  get(target, prop) {
    if (prop === "set") return (x, y, z, ...rest) => { if (y < 0) { dropped++; return g; } return target.set(x, y, z, ...rest); };
    const v = Reflect.get(target, prop);
    return typeof v === "function" ? v.bind(target) : v;
  },
});
const at = (x, y, z) => grid.get(x, y, z);
const failures = [];
const called = new Set();

// Every helper once, with plan.md's arguments (world coordinates).
const calls = [
  ["stucco_wall", () => V.stucco_wall(g, 10, 8, 31, 8)],
  ["header_course", () => V.header_course(g, 10, 8, 31, 8)],
  ["post", () => V.post(g, 28, 25)],
  ["glass_bay", () => V.glass_bay(g, 22, 24, 25)],
  ["slider_gap", () => V.slider_gap(g, 14, 25)],
  ["clerestory", () => V.clerestory(g, 8, 4)],
  ["orange_entry", () => V.orange_entry(g)],
  ["ledgestone_wall", () => V.ledgestone_wall(g, 11, 17, 7, 1, 4, 1)],
  ["roof_band", () => {
    V.roof_band(g, 6, 10, 6, "bottom");
    V.roof_band(g, 23, 27, 6, "bottom");
    V.roof_band(g, 11, 13, 6, "top");
    V.roof_band(g, 20, 22, 6, "top");
    V.roof_band(g, 14, 15, 7, "bottom");
    V.roof_band(g, 18, 19, 7, "bottom");
    V.roof_band(g, 16, 17, 7, "top");
  }],
  ["fascia_ring", () => V.fascia_ring(g)],
  ["beam_line", () => V.beam_line(g, 19)],
  ["carport", () => V.carport(g)],
  ["breeze_screen", () => V.breeze_screen(g, 21)],
  ["joint_row", () => V.joint_row(g, 4)],
  ["stepping_pad", () => V.stepping_pad(g, 3)],
  ["car_50s", () => V.car_50s(g, 3, 1)],
  ["palm", () => V.palm(g, 12, 3)],
  ["saguaro", () => V.saguaro(g, 26, 3, 3)],
  ["barrel_cactus", () => V.barrel_cactus(g, 28, 2)],
  ["mailbox", () => V.mailbox(g, 9, 1)],
  ["kidney_pool", () => V.kidney_pool(g)],
  ["lounger", () => V.lounger(g, 12, 27, "x")],
  ["patio_table", () => V.patio_table(g, 20, 27)],
  ["garden_lamp", () => V.garden_lamp(g, 17, 5)],
  ["hung_lantern", () => V.hung_lantern(g, 19, 10)],
  ["terrazzo_floor", () => V.terrazzo_floor(g, [11, 1, 9, 15, 1, 13])],
  ["panel_wall", () => V.panel_wall(g, 22, 2, 4, 15, "east")],
  ["sofa_low", () => V.sofa_low(g, 11, 20, 2, "z", "east")],
  ["egg_chair", () => V.egg_chair(g, 19, 22, "west")],
  ["sideboard", () => V.sideboard(g, 11, 14, 3, "z")],
  ["coffee_table", () => V.coffee_table(g, 14, 10)],
  ["conversation_pit", () => V.conversation_pit(g, 13, 20, 17, 23)],
  ["fireplace_stack", () => V.fireplace_stack(g)],
  ["dining_set", () => V.dining_set(g, 12, 15)],
  ["galley_kitchen", () => V.galley_kitchen(g)],
  ["bed_double", () => V.bed_double(g, 27, 10, "south", "orange")],
  ["wardrobe", () => V.wardrobe(g, 28, 9, 3, "x")],
  ["bath_fit", () => V.bath_fit(g, [26, 2, 14, 27, 4, 16])],
];

for (const [name, run] of calls) {
  called.add(name);
  const before = new Map(grid.cells);
  try {
    run();
  } catch (e) {
    failures.push(`${name}: threw ${e.message}`);
    continue;
  }
  let changed = 0;
  for (const [k, c] of grid.cells) {
    const b = before.get(k);
    if (!b || b.block !== c.block || JSON.stringify(b.state ?? {}) !== JSON.stringify(c.state ?? {})) changed++;
  }
  console.log(`${name}: ${changed} cells changed`);
  if (changed === 0) failures.push(`${name}: placed nothing`);
}

// Every helper in vocab.mjs was called.
for (const [name, v] of Object.entries(V)) {
  if (typeof v === "function" && !called.has(name)) failures.push(`${name}: not covered by the test`);
}

// Every placed block is a palette id (or air), and every state is valid for its block (mcd states).
const pairs = new Map();
for (const c of grid.cells.values()) {
  const id = c.block.replace("minecraft:", "");
  if (id === "air") continue;
  if (!allowed.has(id)) failures.push(`off palette: ${id}`);
  const key = id;
  if (!pairs.has(key)) pairs.set(key, new Set());
  for (const [k, v] of Object.entries(c.state ?? {})) pairs.get(key).add(`${k}=${v}`);
}
for (const [id, states] of pairs) {
  if (states.size === 0) continue;
  const info = JSON.parse(execFileSync("node", [MCD, "states", id], { encoding: "utf8" }));
  for (const s of states) {
    const [k, v] = s.split("=");
    if (!(info.properties?.[k] ?? []).includes(v)) failures.push(`bad state on ${id}: ${k}=${v}`);
  }
}

// Spot checks against plan.md.
const spot = (label, ok) => { if (!ok) failures.push(`spot check failed: ${label}`); };
spot("door lower half at (19,2,9)", at(19, 2, 9)?.block === "minecraft:acacia_door" && at(19, 2, 9).state.half === "lower");
spot("door faces north", at(19, 2, 9)?.state?.facing === "north");
spot("header skips beam line x=13 at y=5", at(13, 5, 8) === undefined && at(12, 5, 8)?.block === "minecraft:dark_oak_planks");
spot("roof hole is open at (19,6,14)", at(19, 6, 14) === undefined);
spot("roof hole is open at (19,7,14)", at(19, 7, 14) === undefined);
spot("fascia at the eave corner (9,6,6)", at(9, 6, 6)?.block === "minecraft:dark_oak_slab" && at(9, 6, 6).state.type === "bottom");
spot("ridge slab top half at (12,7,16)", at(12, 7, 16)?.state?.type === "top");
spot("pool water at (15,0,30)", at(15, 0, 30)?.block === "minecraft:water");
spot("pool floor and bedding (y<0) dropped, not stored", dropped > 0 && at(15, -2, 30) === undefined);
spot("campfire lit at (20,2,21)", at(20, 2, 21)?.state?.lit === "true");

const counts = `${called.size} helpers, ${grid.cells.size} cells, ${pairs.size} block ids, ${dropped} writes below y=0 dropped`;
if (failures.length) {
  console.log(`\nFAIL (${counts}):`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log(`\nPASS (${counts})`);
