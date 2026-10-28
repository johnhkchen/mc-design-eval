// The founding kit (thread 0012) per kingdom: the parts, the set file and a demo square, all checked.
//   node src/lordaeron/build-founding.mjs [--kingdom lordaeron]
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { lordaeronFounding } from "./founding.mjs";
import { foundingKit } from "../founding/kits.mjs";
import { Grid } from "../grid.mjs";
import { check } from "../../../../tools/check-asset.mjs";
const HERE = dirname(fileURLToPath(import.meta.url)), DATA = join(HERE, "../../bundle/core/src/main/resources/data/enterprise");
const ki = process.argv.indexOf("--kingdom"), K = ki > 0 ? process.argv[ki + 1] : "lordaeron";
const KITS = { lordaeron: lordaeronFounding, dalaran: () => foundingKit("dalaran"), stormwind: () => foundingKit("stormwind") };
const F = join(DATA, `structure/${K}/founding`);
const write = (f, s) => { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); };
rmSync(F, { recursive: true, force: true }); mkdirSync(F, { recursive: true });
const parts = KITS[K](), report = [];
for (const t of parts) {
  const f = join(F, `${t.id}.nbt`); t.grid.save(f);
  const meta = { id: `enterprise:${K}/founding/${t.id}`, rev: 1, kingdom: K, kind: "part", slot: "prop:founding", palette: "fixed", size: t.grid.size, mirror: true, ground: 2, ...t.meta };
  write(f.replace(".nbt", ".json"), JSON.stringify(meta, null, 2) + "\n");
  const c = check(f, meta); report.push([t.id, c.ok, c.errors]);
}
write(join(DATA, `town_kits/${K}/founding.json`), JSON.stringify({
  set: `${K}/founding`, rev: 1,
  about: "What a town founded on open ground stands with before its houses come (thread 0012). Parts on the yard contract: layers 0-1 ground, 2 the surface (the site's graded ground), 3 up the features; authored with the street or the square to the south (z = depth - 1). No point-of-interest blocks (decorative twins only), no beds; every walkable full-block cell lit.",
  order: "At founding: the bell and desk (the settlers'), then founding_stone_3 at the forum's edge facing the square, notice_board_3 by the bell, market_cross_5 in the forum's middle, well_3 beside it or on the main street, camp_9x7 on a plot at the main street's end, gate_posts_5 astride the main street at the inner wall's line, stake_1 every 8 along the rest of that line.",
  temporary: "camp_9x7 is cleared when the first house has its beds; stake_1 and gate_posts_5 give way to the stockade at the first walled tier (the stockade, then the kingdom's wall, are later sets). The founding stone, notice board, market cross and well stay.",
  parts: parts.map((t) => ({ id: t.id, part: `enterprise:${K}/founding/${t.id}`, size: t.grid.size, ...t.meta })),
}, null, 2) + "\n");
// the demo: a founded square, 25 x 21: the cross in the middle, the stone and the board at its north edge, the well,
// the main street running south through the gate posts, the camp at its end, a stake line along the wall's line
const W = 25, D = 21, demo = new Grid([W, K === "lordaeron" ? 12 : 14, D]), byId = Object.fromEntries(parts.map((t) => [t.id, t.grid]));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { demo.set(x, 0, z, "dirt"); demo.set(x, 1, z, "dirt"); demo.set(x, 2, z, (Math.abs(x - 12) <= 5 && z >= 2 && z <= 12) ? ((x + z) % 3 ? "cobblestone" : "gravel") : Math.abs(x - 12) <= 1 ? "dirt_path" : "grass_block[snowy=false]"); }
demo.paste(byId.market_cross_5 || byId.well_pavilion_5 || byId.fountain_5, 10, 0, 5);
demo.paste(byId.founding_stone_3, 7, 0, 1); demo.paste(byId.notice_board_3, 14, 0, 2);
demo.paste(byId.well_3, 15, 0, 8);
demo.paste(byId.gate_posts_5, 10, 0, 16);
demo.paste(byId.camp_9x7, 15, 0, 13);
for (let x = 0; x < W; x += 8) if (x < 10 || x > 14) demo.paste(byId.stake_1, x, 0, 16);
demo.set(12, 3, 3, "bell[attachment=floor,facing=south,powered=false]");          // the settlers' bell (the game's), for the picture
mkdirSync(join(HERE, "../../out/founding"), { recursive: true });
demo.save(join(HERE, `../../out/founding/${K}_founding_demo.nbt`));
for (const [id, ok, e] of report) if (!ok) console.log("FAIL", id, e.join(" | "));
console.log(`${parts.length} parts, ${report.filter((r) => r[1]).length}/${report.length} pass; demo out/founding/${K}_founding_demo.nbt`);
