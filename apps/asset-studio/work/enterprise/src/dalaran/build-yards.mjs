// Dalaran yard tiles and their set file (on Lordaeron's yard contract), all checked, and a preview strip: a front and a
// back yard laid side by side as a tiler would.
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { dalaranYards } from "./yards.mjs";
import { strip } from "../lordaeron/yards.mjs";
import { Grid } from "../grid.mjs";
import { check } from "../../../../tools/check-asset.mjs";
const HERE = dirname(fileURLToPath(import.meta.url)), BUNDLE = join(HERE, "../../bundle"), DATA = join(BUNDLE, "core/src/main/resources/data/enterprise");
const Y = join(DATA, "structure/dalaran/yard");
const write = (f, s) => { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); };
rmSync(Y, { recursive: true, force: true }); mkdirSync(Y, { recursive: true });
const tiles = dalaranYards(), report = [];
// as Lordaeron's: 1-wide tiles run freely, a feature stands alone, a 2-wide plain tile at most twice; a trade says it once
for (const t of tiles) t.meta.max_run = t.meta.width === 1 ? null : t.meta.width === 2 && !t.meta.tags.some((g) => g.startsWith("trade:") || g === "well") ? 2 : 1;
for (const t of tiles) if (t.meta.tags.some((g) => g.startsWith("trade:"))) t.meta.once = true;
for (const t of tiles) {
  const f = join(Y, `${t.id}.nbt`); t.grid.save(f);
  const meta = { id: `enterprise:dalaran/yard/${t.id}`, rev: 1, kingdom: "dalaran", kind: "part", palette: "fixed", size: t.grid.size, mirror: true, ground: 2, ...t.meta };
  write(f.replace(".nbt", ".json"), JSON.stringify(meta, null, 2) + "\n");
  const c = check(f, meta); report.push([t.id, c.ok, c.errors]);
}
write(join(DATA, "town_kits/dalaran/yards.json"), JSON.stringify({
  set: "dalaran/yards", rev: 1,
  about: "Dalaran's yard tiles on Lordaeron's yard contract: front yards 3 deep (z 0 against the house, z 2 the street edge), back yards 4 deep (z 0 the rear boundary, z 3 against the house), tiles 1, 2 or 3 wide laid left to right (as seen from the street) to fill the plot's width. Layers 0-1 ground, 2 the surface (the plot's ground row), 3+ features.",
  sockets: "left/right name the edge treatment along the street edge (front) or rear boundary (back): wall (the white compound wall: polished andesite plinth, calcite, a purpur tile coping; a course taller at the back), rail (a dark oak balustrade on a polished andesite kerb); '*' fits any. Neighbours should match so the boundary runs on.",
  path: "The client cuts the door path: lay front_path_1 (paved) at the door's column, or cut through any cell listed in a tile's path_ok.",
  light: "Every walkable full-block cell must be lit 8+. Tiles tagged lamp carry a light (a stone lantern or a lantern on a post); keep lamp tiles at most 5 columns apart in a strip (front and back), counting the house's own door lantern for the front.",
  max_run: "Each tile's max_run is how many of it may stand side by side in one strip (null: no limit). Features stand alone.",
  once: "A tile with once: true (the trade yards) appears at most once in a strip; fill round it with the plain tiles of the plot's tier.",
  rules: ["no point-of-interest blocks (decorative twins only)", "no beds", "front yards: nothing over 3 high", "back yards: trees allowed"],
  choice: "Pick by tags (plain, cottage, town, hens, kitchen, wash, woodpile, well, tree, trade:<trade>) for the plot's tier and occupant's trade, by the seed: the same vocabulary as Lordaeron's, so one chooser serves both. Town tiles are walled and paved; cottage tiles are railed and planted.",
  tiles: tiles.map((t) => ({ id: t.id, part: `enterprise:dalaran/yard/${t.id}`, ...t.meta })),
}, null, 2) + "\n");
// the preview: a town front (walled) and a cottage front (railed) over two back strips, 12 wide, a street below
const front1 = strip(tiles, ["front_wall_1", "front_court_2", "front_lamp_1", "front_path_1", "front_pond_3", "front_lamp_1", "front_smith_3"], 3);
const front2 = strip(tiles, ["front_rail_1", "front_azalea_2", "front_path_1", "front_garden_3", "front_lamp_1", "front_dyer_3", "front_rail_1"], 3);
const back1 = strip(tiles, ["back_bamboo_2", "back_lamp_1", "back_tree_3", "back_well_2", "back_lamp_1", "back_wash_3"], 4);
const back2 = strip(tiles, ["back_pond_3", "back_woodpile_2", "back_lamp_1", "back_kitchen_3", "back_wall_1", "back_dyer_2"], 4);
const W = 12, demo = new Grid([2 * W + 3, 10, 4 + 3 + 3 + 2]);
// two plots side by side, 3 apart: back yard (z 0-3), a 3-deep house stand-in (z 4-6, left as a paved slot), front (z 7-9), the street (z 10-11)
for (let x = 0; x < demo.size[0]; x++) for (let z = 0; z < demo.size[2]; z++) { demo.set(x, 0, z, "dirt"); demo.set(x, 1, z, "dirt"); demo.set(x, 2, z, z >= 10 ? ((x + z) % 3 ? "stone_bricks" : "polished_andesite") : z >= 4 && z <= 6 ? "polished_andesite" : "grass_block[snowy=false]"); }
for (const [i, b, f] of [[0, back1, front1], [1, back2, front2]]) { demo.paste(b, i * (W + 3), 0, 0); demo.paste(f, i * (W + 3), 0, 7); }
mkdirSync(join(HERE, "../../out/yards"), { recursive: true });
demo.save(join(HERE, "../../out/yards/dalaran_yards_demo.nbt"));
for (const [id, ok, e] of report) if (!ok) console.log("FAIL", id, e.join(" | "));
console.log(`${tiles.length} tiles, ${report.filter((r) => r[1]).length}/${report.length} pass; demo out/yards/dalaran_yards_demo.nbt`);
