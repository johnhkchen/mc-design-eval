// Earthworks props: retaining-wall tiles (straights, lamps, buttresses, corners, steps) for rises 1-4, the set file,
// and a demo cut (a 3-high bank with all of them) for the preview. All checked as parts.
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { allEarthworks, LORDAERON } from "./earthworks.mjs";
import { DALARAN } from "../dalaran/earthworks.mjs";
import { Grid } from "../grid.mjs";
import { check } from "../../../../tools/check-asset.mjs";
const HERE = dirname(fileURLToPath(import.meta.url)), BUNDLE = join(HERE, "../../bundle"), DATA = join(BUNDLE, "core/src/main/resources/data/enterprise");
// --kingdom dalaran builds the same tiles in Dalaran's dress (default lordaeron)
const ki = process.argv.indexOf("--kingdom"), K = ki > 0 ? process.argv[ki + 1] : "lordaeron";
const STYLES = { lordaeron: { style: LORDAERON, rev: 6, demo: "demo_h3.nbt",
  cut_face: "cutface_h<rise>_1a/b/c leave a levelled face natural instead of walled: stone, tuff, mossy cobble, rooted dirt and moss, roots hanging from the lip, a little scree at the foot. Same alignment as the straights; mix them with the walls (walls near buildings and streets, cut faces in yards and the open).",
  detail: "A cobble footing course, mixed coursed stone (stone, mossy and cracked bricks, a little andesite), a battered stair footing from rise 2, a stone coping and a low cobble parapet from rise 2, ivy down faces from rise 3, a coarse drain strip at the foot." },
  dalaran: { style: DALARAN, rev: 2, demo: "dalaran_demo_h3.nbt", tile_rev: (t) => (t.meta.kind_of === "cut_face" ? 2 : 1),   // rev 2: its own cut face
  cut_face: "cutface_h<rise>_1a/b/c finish a levelled face that is not walled: in Dalaran an old terrace's dressed stone gone green, not raw rock: stone brick courses (cracked, a little polished andesite) below, mossy brick and moss in the upper half, a moss lip with ivy hanging from it, a fallen polished slab or moss at the foot. Same alignment as the straights; mix them with the walls (walls near buildings and streets, cut faces in yards and the open).",
  detail: "Dalaran's dress on Lordaeron's geometry: a polished andesite footing and coping, dressed stone brick courses (a little cracked, mossy and chiselled), a battered polished andesite footing from rise 2, a dark oak balustrade on red mangrove fence posts from rise 2 (a post wherever it ends, turns or carries a lamp), ivy down faces from rise 3, polished andesite flights lit on both cheeks, terraces paved to walk on with flowering beds (azalea, peony, lilac, rose, bamboo, pink petals) and lanterns on dark oak posts. Cut faces are dressed stone gone mossy (rev 2)." } };
const { style, rev, demo: DEMO, detail, cut_face, tile_rev = () => 1 } = STYLES[K];
const E = join(DATA, `structure/${K}/earthworks`);
const write = (f, s) => { mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); };
rmSync(E, { recursive: true, force: true }); mkdirSync(E, { recursive: true });
const tiles = allEarthworks(style), report = [];
for (const t of tiles) {
  const f = join(E, `${t.id}.nbt`); t.grid.save(f);
  const meta = { id: `enterprise:${K}/earthworks/${t.id}`, rev: tile_rev(t), kingdom: K, kind: "part", slot: "prop:earthworks", palette: "fixed", size: t.grid.size, depth: t.grid.size[2], mirror: true, ground: 2, ...t.meta };
  write(f.replace(".nbt", ".json"), JSON.stringify(meta, null, 2) + "\n");
  const c = check(f, meta); report.push([t.id, c.ok, c.errors]);
}
write(join(DATA, `town_kits/${K}/earthworks.json`), JSON.stringify({
  set: `${K}/earthworks`, rev,
  about: "Retaining walls for the cuts levelling leaves in a slope. Authored with the low ground to the south: z = depth-1 is the low edge and every tile aligns on it; the wall face looks south; the high ground runs north. Layers 0-1 ground, 2 the low surface, 2 + rise the high surface. Rotate and mirror freely (the corners are drawn for high ground to the north-west).",
  rise: "Each tile is made for one rise, 1 to 4 (retain_h<rise>_*). Use the tile whose rise is the cut's height at that column; at a change of height, let the higher tile's wall run on one column past the step.",
  tiling: "Straights are 1 wide (variants a, b, c: pick by hash so the coursing never repeats), with a lamp tile at most 5 apart and, from rise 3, a buttress about every 4. Corners are 3 x 3. Steps are 4 wide (two cheek walls and a 2-wide flight) or 3 wide (a 1-wide flight for a door path) and 2 x rise + 1 deep, so they reach back into the bank; cut the bank behind them to the steps' landing.",
  cut_face,
  steps_side: "steps_side_h<rise> (rise 2-4) fit a 3-deep front yard: 2 x rise + 1 long, 3 deep. The landing is at x 0, z 1, beside the door's column (z 0 touches the house). The flight runs along the yard to +x, down to the street at the far end, where the street-edge wall is open. Mirror it for a flight to -x. The rest of the street edge carries on as retain_h<rise> tiles.",
  plinth: "plinth_h<rise>_1 (rise 1-3) is a stepped stone plinth at a house's foot where the house stands on a fill above its yard: rise + 1 deep, run along each wall, row 0 against the wall coped flush with the house's ground, each row out a course lower under a stair. plinth_h<rise>_corner is the outer corner (house to the north-west; rotate). Over 3, use the retaining courses.",
  terrace: "terrace_1a-f and terrace_lamp_1 dress the terrace between two courses: 1 wide, 2 deep, laid on the lower course's top with z 0 at the upper course's foot (planted: azalea, fern, flowers, allium, a clipped shrub) and z 1 along the lower course's edge (grass and moss, walkable). Pick variants by hash; a lamp tile at most every 5th column. Layers 0-1 ground, 2 the terrace surface. If your terrace is wider than 2, fill the rest with grass.",
  walk: "Steps go up by half steps only (bottom slab, full block, ...), as the shared validator's walk requires; the landing is level with the high ground.",
  detail,
  tiles: tiles.map((t) => ({ id: t.id, part: `enterprise:${K}/earthworks/${t.id}`, depth: t.grid.size[2], ...t.meta })),
}, null, 2) + "\n");

// the demo: a 3-high bank, 22 long, turning north at the east end, with steps, buttresses and lamps, on a low street
const byId = Object.fromEntries(tiles.map((t) => [t.id, t.grid])), h = 3;
const demo = new Grid([26, 2 + h + 3, 12]);
const D0 = 12 - 3;                                    // the straights' north edge, so their low edge is the demo's z 11
const seq = ["lamp", "a", "b", "buttress", "c", "a", "steps", "b", "lamp", "c", "buttress", "a", "b", "c", "lamp", "a", "buttress", "b", "c"];
let x = 0;
for (const s of seq) {
  if (s === "steps") { const g = byId[`steps_h${h}_4`]; demo.paste(g, x, 0, 12 - g.size[2]); x += 4; continue; }
  demo.paste(byId[`retain_h${h}_${s === "lamp" ? "lamp_1" : s === "buttress" ? "buttress_1" : "1" + s}`], x, 0, D0); x += 1;
}
// the outer corner turns the wall north (rotated so its high ground is to the west), then a straight run north
demo.paste(byId[`retain_h${h}_outer_3`], x, 0, D0);
for (let z = D0 - 1, i = 0; z >= 0; z--, i++) demo.paste(byId[`retain_h${h}_${i % 4 === 2 ? "lamp_1" : "1" + "abc"[i % 3]}`], x, 0, z, { q: 3 });
// fill the high ground behind the bank and the low ground east of the turn
for (let xx = 0; xx < demo.size[0]; xx++) for (let z = 0; z < demo.size[2]; z++) if (!demo.get(xx, 2, z)) {
  const high = xx < x + 1 && z < D0 + 1;
  for (let y = 0; y < (high ? 2 + h : 2); y++) demo.set(xx, y, z, "dirt"); demo.set(xx, high ? 2 + h : 2, z, "grass_block[snowy=false]");
}
mkdirSync(join(HERE, "../../out/earthworks"), { recursive: true });
demo.save(join(HERE, "../../out/earthworks", DEMO));
for (const [id, ok, e] of report) if (!ok) console.log("FAIL", id, e.join(" | "));
console.log(`${tiles.length} tiles, ${report.filter((r) => r[1]).length}/${report.length} pass; demo out/earthworks/${DEMO}`);
