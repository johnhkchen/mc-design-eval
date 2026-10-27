// A golden plot: front yard (3) + house (9 deep with relief) + back yard (4), side strips 1 wide; 16 deep.
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { Grid } from "../grid.mjs";
import { allYards, strip } from "./yards.mjs";
import { compose, layoutOf, metaOf } from "./compose.mjs";
import { paletteMap } from "./assemble.mjs";
import { check } from "../../../../tools/check-asset.mjs";

const HEDGE = "oak_leaves[distance=1,persistent=true,waterlogged=false]";
export function plot(houseParams, front, back) {
  const L = layoutOf(houseParams), house = compose(L), m = metaOf(L), tiles = allYards();
  const [hw, hh, hd] = house.size, W = hw + 2, D = 3 + hd + 4;
  const fs = strip(tiles, front, 3), bs = strip(tiles, back, 4);
  if (fs.size[0] !== W || bs.size[0] !== W) throw new Error(`yards ${fs.size[0]} / ${bs.size[0]} wide, plot ${W}`);
  const g = new Grid([W, Math.max(hh, 8), D]);
  g.paste(bs, 0, 0, 0); g.paste(house, 1, 0, 4); g.paste(fs, 0, 0, 4 + hd);
  for (const x of [0, W - 1]) for (let z = 4; z < 4 + hd; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); g.set(x, 2, z, "grass_block[snowy=false]"); g.set(x, 3, z, HEDGE); g.set(x, 4, z, HEDGE); }
  const sh = ([x, y, z]) => [x + 1, y, z + 4];
  return { grid: g, entrance: { ...m.entrance, at: sh(m.entrance.at) }, beds: m.beds.map((b) => ({ head: sh(b.head), foot: sh(b.foot) })),
    workstations: m.workstations.map((w) => ({ ...w, at: sh(w.at) })), front, back, house: L };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const OUT = new URL("../../out/plots/", import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
  const palettes = JSON.parse(readFileSync(new URL("../../bundle/assets-src/kingdoms/lordaeron/palettes.json", import.meta.url), "utf8"));
  const P = {
    plot_burgage_11x16_a: [{ W: 7, D: 7, storeys: 2, roof: "gable_z", palette: "daub", core: "turned", beds: 2 },
      ["front_cottage_2", "front_lamp_1", "front_picket_1", "front_path_1", "front_garden_3", "front_cottage_2", "front_picket_1"],
      ["back_wash_3", "back_lamp_1", "back_kitchen_3", "back_woodpile_2", "back_well_2"]],
    plot_smith_11x16_a: [{ W: 7, D: 7, storeys: 2, roof: "gable_z", palette: "stone", core: "turned", beds: 2, trade: "minecraft:smithing_table" },
      ["front_smith_3", "front_path_1", "front_forecourt_3", "front_bench_2", "front_lamp_1", "front_hedge_1"],
      ["back_hens_3", "back_tree_3", "back_dyer_2", "back_hedge_1", "back_lamp_1", "back_hedge_1"]],
  };
  for (const [name, [hp, front, back]] of Object.entries(P)) {
    const r = plot(hp, front, back), map = paletteMap(palettes, hp.palette), g = new Grid(r.grid.size);
    for (const [x, y, z, s] of r.grid.each()) g.set(x, y, z, map(s));
    const f = `${OUT}${name}.nbt`; g.save(f);
    const meta = { footprint: [g.size[0], g.size[2]], ground: 2, entrances: [r.entrance], beds: r.beds, workstations: r.workstations, lockers: [], markers: [], entities: [] };
    writeFileSync(f.replace(".nbt", ".json"), JSON.stringify({ ...meta, golden: { house: hp, front, back } }, null, 2));
    const c = check(f, meta);
    console.log(`${c.ok ? "PASS" : "FAIL"} ${name} ${g.size.join("x")} ${c.errors.join(" | ")}`);
  }
}
