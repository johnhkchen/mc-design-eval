// The Lordaeron concept set: 2 tiers x 4 views, painted by Codex with the approved street sketch as the style reference.
import { codexImage } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/codex-image.mjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const ref = { base64: readFileSync("lordaeron-street-sketch.png").toString("base64"), mediaType: "image/png" };
const STYLE = `Concept art of a Minecraft build, matching the attached reference image's style, palette, light and block scale exactly: painterly game concept art with a slight Warcraft warmth, but true blocky Minecraft geometry at 1 block = 1 m. The kingdom of Lordaeron (World of Warcraft) in the language of Tudor and late-medieval England: dark oak close-studded timber frames over white plaster, jettied upper storeys, thatch and red clay tile roofs, brick chimneys set into side walls, grey stone for churches and walls. The town is Hearthglen, a hilltop abbey town: the abbey stands on a hill to the north of the town, a river and lakes lie to the south, rolling oak woodland all round. No people, villagers, animals or text.`;

const TOWN = {
  village: `VILLAGE tier (8 to 23 villagers): about fifteen single-storey and storey-and-a-half cottages, each 5 x 5 blocks with a thatched roof, standing one block apart along 2-block-wide packed dirt lanes, with kitchen gardens and hedges between them. A 13 x 13 paved square round a bell at the centre with a well and a few market stalls (3 x 3 awnings). A small stone chapel. A timber palisade of sharpened logs with a simple timber gatehouse surrounds it, gardens between the palisade and an outer ring of strip fields. The abbey on the hill is still modest: a Norman stone church with a square tower and a few cloister ranges.`,
  town: `TOWN tier (24 to 47 villagers): two-storey timber-framed houses 5 to 7 blocks wide with trade yards, standing one block apart along 2-block lanes in a grid of wards, 3-block-wide avenues lined with young oak and lime trees and lanterns on posts running from the central square to four gates. Halls: a granary, a smithy, a counting house, a guildhall with a jettied upper floor. A stone inner wall about 6 blocks high with square towers and a stone gatehouse on each avenue. The abbey on the hill is grown: a Perpendicular Gothic church with a tall pinnacled tower, cloisters and a gatehouse, but still within about 48 blocks long and tall.`,
};
const VIEWS = {
  road: `VIEW: the town seen from the caravan road coming in from the south, about 60 blocks out, crossing a timber bridge over the river, the road climbing toward the south gate, the whole town and the abbey on its hill behind visible, wide landscape framing.`,
  street: `VIEW: eye level in a 2-block-wide lane inside the walls, houses on both sides one block apart with their doors to the lane, lived-in detail (window boxes, woodpiles, benches, washing lines, kitchen gardens) and one sign of trade: a shepherd's yard with dye vats (made of barrels and water, not cauldrons) and fleeces drying on a rack.`,
  forum: `VIEW: the central 13 x 13 square around the town's bell, seen from a corner at eye level: the bell hanging in a centrepiece at the middle, paving, market stalls with striped awnings along the edges showing their goods (bread, wool, tools, fish), lanterns, a bench, the avenues leaving from the square's edges, the abbey tower over the roofs.`,
  abbey: `VIEW: the abbey on its hill from the town side, three-quarter view: the church, its tower, the cloister, the abbey gatehouse, the path winding up from the town through orchards and herb gardens (the cleric's herb garden), with the town's roofs in the foreground below.`,
};
const SIZE = { road: "1536x1024 landscape", street: "1536x1024 landscape", forum: "1536x1024 landscape", abbey: "1024x1536 portrait" };

const jobs = [];
for (const tier of Object.keys(TOWN)) for (const view of Object.keys(VIEWS)) jobs.push({ tier, view });
mkdirSync("concept", { recursive: true });
const pool = 4;
let i = 0;
async function worker() {
  while (i < jobs.length) {
    const { tier, view } = jobs[i++], out = `concept/${tier}-${view}.png`;
    if (existsSync(out)) continue;
    const t0 = Date.now();
    try {
      const r = await codexImage({ prompt: `${STYLE}\n\n${TOWN[tier]}\n\n${VIEWS[view]}`, images: [ref], size: SIZE[view] });
      writeFileSync(out, Buffer.from(r.base64, "base64"));
      console.log(`done ${out} ${Math.round((Date.now() - t0) / 1000)} s`);
    } catch (e) { console.log(`failed ${out}: ${e.message.slice(0, 200)}`); }
  }
}
await Promise.all(Array.from({ length: pool }, worker));
console.log("all done");
