// Batch 003: Lordaeron yard tiles, the yard set file, and golden plots (house + yards), all checked.
import { mkdirSync, writeFileSync, rmSync, readFileSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { allYards } from "./yards.mjs";
import { check } from "../../../../tools/check-asset.mjs";
const HERE = dirname(fileURLToPath(import.meta.url)), BUNDLE = join(HERE, "../../bundle"), DATA = join(BUNDLE, "core/src/main/resources/data/enterprise");
const Y = join(DATA, "structure/lordaeron/yard"), P = join(DATA, "structure/lordaeron/plot");
const write = (f, s) => { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); };
rmSync(Y, { recursive: true, force: true }); mkdirSync(Y, { recursive: true });
const tiles = allYards(), report = [];
// how many of a tile may stand side by side: the 1-wide edge tiles run freely, a feature (a well, a wash line, a trade
// yard) stands alone, a 2-wide garden or woodpile at most twice
for (const t of tiles) t.meta.max_run = t.meta.width === 1 ? null : t.meta.width === 2 && !t.meta.tags.some((g) => g.startsWith("trade:") || g === "well") ? 2 : 1;
// a trade yard says the trade once: one per strip, plain tiles round it
for (const t of tiles) if (t.meta.tags.some((g) => g.startsWith("trade:"))) t.meta.once = true;
for (const t of tiles) {
  const f = join(Y, `${t.id}.nbt`); t.grid.save(f);
  const meta = { id: `enterprise:lordaeron/yard/${t.id}`, rev: 1, kingdom: "lordaeron", kind: "part", palette: "fixed", size: t.grid.size, mirror: true, ground: 2, ...t.meta };
  write(f.replace(".nbt", ".json"), JSON.stringify(meta, null, 2) + "\n");
  const c = check(f, meta); report.push([t.id, c.ok, c.errors]);
}
write(join(DATA, "town_kits/lordaeron/yards.json"), JSON.stringify({
  set: "lordaeron/yards", rev: 2,
  about: "Tileable yard strips: front yards 3 deep (z 0 against the house, z 2 the street edge), back yards 4 deep (z 0 the rear boundary, z 3 against the house), tiles 1, 2 or 3 wide laid left to right (as seen from the street) to fill the plot's width. Layers 0-1 ground, 2 the surface (the plot's ground row), 3+ features.",
  sockets: "left/right name the edge treatment along the street edge (front) or rear boundary (back): hedge, picket, wall, fence; '*' fits any. Neighbours should match so the boundary runs on.",
  path: "The client cuts the door path: lay front_path_1 at the door's column, or cut through any cell listed in a tile's path_ok.",
  light: "Every walkable full-block cell must be lit 8+. Tiles tagged lamp carry a light; keep lamp tiles at most 5 columns apart in a strip (front and back), counting the house's own door lantern for the front.",
  max_run: "Each tile's max_run is how many of it may stand side by side in one strip (null: no limit). Features stand alone; a tiler that penalises a tile beside itself should also respect this.",
  once: "A tile with once: true (the trade yards) appears at most once in a strip; fill round it with the plain tiles of the plot's tier.",
  rules: ["no point-of-interest blocks (decorative twins only)", "no beds", "front yards: nothing over 3 high", "back yards: trees allowed"],
  choice: "Pick by tags (plain, cottage, town, hens, kitchen, wash, woodpile, well, tree, trade:<trade>) for the plot's tier and occupant's trade, by the seed.",
  tiles: tiles.map((t) => ({ id: t.id, part: `enterprise:lordaeron/yard/${t.id}`, ...t.meta })),
}, null, 2) + "\n");
mkdirSync(P, { recursive: true });
for (const n of ["plot_burgage_11x16_a", "plot_smith_11x16_a"]) {
  copyFileSync(join(HERE, `../../out/plots/${n}.nbt`), join(P, `${n}.nbt`));
  const j = JSON.parse(readFileSync(join(HERE, `../../out/plots/${n}.json`), "utf8"));
  const meta = { id: `enterprise:lordaeron/plot/${n}`, rev: 1, kingdom: "lordaeron", kind: "plot", slot: "home:burgage", tiers: ["village", "town"], ...j, notes: "Golden plot: a house from timber_relief with yards from lordaeron/yards: front 3, house 9, back 4, side strips 1." };
  write(join(P, `${n}.json`), JSON.stringify(meta, null, 2) + "\n");
  const c = check(join(P, `${n}.nbt`), meta); report.push([n, c.ok, c.errors]);
}
for (const [id, ok, e] of report) if (!ok) console.log("FAIL", id, e.join(" | "));
console.log(`${tiles.length} tiles, ${report.filter((r) => r[1]).length}/${report.length} pass`);
