// Planned towns by Codex: what a whole town should look like when it's designed as one city build rather than grown
// piece by piece. Per kingdom: the town tier from the air, the city tier from the air, an illustrated plan (the
// planner's map), and a hillside quarter (terraced streets on retaining walls). Each painted against the kingdom's
// approved street sketch, grounded in the client's real grid (wards 33 x 33, lanes 39 apart, plots 16 deep) and our kits.
//   node town-plan.mjs [kingdom ...]          (default: all three)
import { codexImage } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/codex-image.mjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const HERE = new URL(".", import.meta.url).pathname;
const K = {
  lordaeron: {
    sketch: `${HERE}lordaeron-street-sketch.png`,
    style: "the kingdom of Lordaeron (World of Warcraft) in the language of Tudor and late-medieval England: dark oak close-studded timber frames over white plaster, jettied upper storeys, red clay tile and slate roofs, brick chimneys set into side walls, grey stone for the abbey, halls and walls, oak woodland and green hedged fields",
    heart: "a stone market cross round the town bell in a paved market square, a timber market hall on stone arcades facing it, the abbey church on a rise at the north edge",
    edge: "hedged strip fields of wheat, carrots and beets, orchards and a water meadow outside the wall, pastures with split-rail fences beyond, a windmill on a knoll",
  },
  stormwind: {
    sketch: `${HERE}../../out/concept/stormwind/street-sketch.png`,
    style: "the kingdom of Stormwind (World of Warcraft) in the language of Norman and early Gothic England and northern France: white stone ground storeys, timber and plaster above in the outer streets, all-stone houses on the main streets, dark blue-grey slate roofs with dormers, round towers with conical slate spires on the walls, blue and gold lion banners",
    heart: "a white stone belfry over the town bell on a stepped plinth in a paved square with striped blue-and-white stalls, a white cathedral with slate spires facing it",
    edge: "dry-stone walled fields of wheat and sunflowers, vineyards on the south slope, a watermill on the river",
  },
  dalaran: {
    sketch: `${HERE}../../out/concept/dalaran/street-sketch.png`,
    style: "the kingdom of Dalaran (World of Warcraft) in the language of Tang and Song China: walled square wards with gate towers on stone platforms, timber halls and houses on raised stone bases with red lacquered columns below and white plaster in dark timber above, deep eaves on bracket sets, concave hipped roofs of violet glazed tile with upturned corners, paifang arches over the avenues, courtyard houses, willows and gold ginkgo",
    heart: "a bell pavilion with red columns on a stepped stone base in the central square, a drum tower opposite, a many-eaved violet pagoda rising beside the square",
    edge: "terraced rice and grain fields stepping down the slopes in curved stone-edged terraces, mulberry orchards, a canal with a stone bridge",
  },
};
const GRID = "The town is planned as one: a square inner wall with a gatehouse on each side; straight avenues from the four gates meet at the central square; the wall's inside is cut into square wards (each about 33 blocks) by lanes; every ward is lined with house plots, each 16 deep (front garden 3, house 9, back garden 4), the houses all facing the lanes and avenues in continuous street fronts of 2 and 3 storeys with workshops and shops on the avenues; gardens and yards fill the ward's middle; trees and lanterns line the avenues";
const VIEW = {
  "town-aerial": ["1536x1024 landscape", `TOWN tier, from the air at about 45 degrees, the whole walled town filling the frame: ${GRID}. The heart: HEART. Outside the wall: EDGE. Every building in the same family, the town reads as designed, not grown.`],
  "city-aerial": ["1536x1024 landscape", `CITY tier, a high bird's-eye view: the town grown into a city, the old inner wall kept, a second outer wall round new wards in the same grid, suburbs along the roads out, docks on a river. ${GRID}. The heart: HEART. Beyond the outer wall: EDGE.`],
  "plan": ["1024x1536 portrait", `An illustrated town planner's map seen straight down, like a beautiful hand-painted game map but still made of Minecraft blocks seen from above: ${GRID}. The heart: HEART. EDGE. Colour-washed zones (houses, workshops, gardens, fields, pasture) readable at a glance, roofs in the kingdom's colours. No text labels.`],
  "hillside": ["1536x1024 landscape", "A hillside quarter at eye level from the lower street: streets of houses on terraces cut into a slope, each terrace held by a coursed stone retaining wall with a parapet, a planted strip and lamps along the terrace, stone stairs climbing between the terraces, house fronts in continuous rows on every level, the town's landmark at the top of the hill."],
};
const kingdoms = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(K);
const jobs = [];
for (const k of kingdoms) for (const v of Object.keys(VIEW)) jobs.push([k, v]);
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < jobs.length) {
    const [k, v] = jobs[i++], spec = K[k], OUT = `${HERE}../../out/concept/${k}/planned`; mkdirSync(OUT, { recursive: true });
    const out = `${OUT}/${v}.png`; if (existsSync(out)) continue;
    const base = `Concept art of a Minecraft build: everything is made of Minecraft blocks at true block scale (1 block = 1 m), painterly game concept art with a slight Warcraft warmth and saturated colour, warm late-afternoon light. No people, villagers, animals or text. ${spec.style}.`;
    const prompt = `Match the attached reference's style, palette, light and block scale exactly.\n\n${base}\n\nVIEW: ${VIEW[v][1].replace("HEART", spec.heart).replace("EDGE", spec.edge)}`;
    try { const r = await codexImage({ prompt, images: [{ base64: readFileSync(spec.sketch).toString("base64"), mediaType: "image/png" }], size: VIEW[v][0] });
      writeFileSync(out, Buffer.from(r.base64, "base64")); console.log(`done ${k} ${v}`); } catch (e) { console.log(`failed ${k} ${v}: ${e.message.slice(0, 160)}`); }
  }
}));
console.log("all done");
