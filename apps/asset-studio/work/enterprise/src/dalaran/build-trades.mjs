// Dalaran's trade buildings: a workshop per trade (platform_hall shell) and a market stall per trade, with metadata as
// the client reads Lordaeron's and Stormwind's (workshop: footprint { at, size } and overhang, as Dalaran's houses),
// checked by the shared contract, and a preview of each kind.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { dalaranWorkshop, TRADES } from "./workshops.mjs";
import { dalaranStall } from "./stalls.mjs";
import { WS } from "../lordaeron/stalls.mjs";
import { EAVE } from "./modules.mjs";
import { Grid } from "../grid.mjs";
import { check } from "../../../../tools/check-asset.mjs";
const K = "bundle/core/src/main/resources/data/enterprise/structure/dalaran", PREV = "bundle/assets-src/dalaran";
const report = [], TIERS = ["hamlet", "village", "town"];                 // as Lordaeron's stalls
for (const dir of ["workshop", "stall"]) { fs.rmSync(`${K}/${dir}`, { recursive: true, force: true }); fs.mkdirSync(`${K}/${dir}`, { recursive: true }); }
const save = (dir, name, g, meta) => {
  g.save(`${K}/${dir}/${name}.nbt`); const full = { id: `enterprise:dalaran/${dir}/${name}`, rev: 1, kingdom: "dalaran", ...meta };
  fs.writeFileSync(`${K}/${dir}/${name}.json`, JSON.stringify(full, null, 2) + "\n");
  const c = check(`${K}/${dir}/${name}.nbt`, full); report.push([name, c.ok, c.errors]);
};
for (const t of TRADES) {
  const r = dalaranWorkshop(t), g = r.grid;
  save("workshop", `workshop_${t}_${g.size[0]}x${g.size[2]}_a`, g, { kind: "workshop", slot: `workshop:${t}`, tiers: ["village", "town"], set: "dalaran/platform_hall",
    style: `the ${t}'s hall and workshop: shop bays on the street showing its goods, the workstation in the hall, a chamber above, one hipped roof`,
    footprint: { at: [EAVE, EAVE], size: [g.size[0] - 2 * EAVE, g.size[2] - 2 * EAVE] }, overhang: EAVE, size: g.size, height: g.size[1], ground: 2, mirror: true,
    entrances: [r.meta.entrance], beds: r.meta.beds, workstations: r.meta.workstations.map((w) => ({ ...w, block: `minecraft:${WS[t].replace(/\[.*$/, "")}` })),
    lockers: [], markers: [], pilings: [], entities: [], relief_faces: ["south", "north", "east", "west"], assembly: { set: "dalaran/platform_hall", layout: r.layout } });
  const s = dalaranStall(t);
  save("stall", `stall_${t}_3x3_a`, s.grid, { kind: "stall", slot: `stall:${t}`, tiers: TIERS, ...s.meta, relief_faces: [] });
}
for (const [n, ok, e] of report) if (!ok) console.log("FAIL", n, e.join(" | "));
console.log(`${report.filter((r) => r[1]).length}/${report.length} pass`);
// previews: one workshop, and every stall in a market row
const one = fs.readdirSync(`${K}/workshop`).find((f) => f.startsWith("workshop_cleric") && f.endsWith(".nbt"));
fs.mkdirSync(`${PREV}/workshop`, { recursive: true });
execFileSync("node", ["../../tools/preview.mjs", `${K}/workshop/${one}`, `${PREV}/workshop/${one.replace(".nbt", "")}.jpg`], { stdio: "ignore" });
// the stalls in a market row on paving, one apart
const row = new Grid([TRADES.length * 4 + 1, 10, 5]);
for (let x = 0; x < row.size[0]; x++) for (let z = 0; z < 5; z++) row.set(x, 0, z, (x + z) % 2 ? "stone_bricks" : "polished_andesite");
TRADES.forEach((t, i) => row.paste(dalaranStall(t).grid, 1 + i * 4, 0, 1));
fs.mkdirSync(`${PREV}/stall`, { recursive: true }); row.save("out/dalaran_market_row.nbt");
execFileSync("node", ["../../tools/preview.mjs", "out/dalaran_market_row.nbt", `${PREV}/stall/market_row.jpg`], { stdio: "ignore" });
