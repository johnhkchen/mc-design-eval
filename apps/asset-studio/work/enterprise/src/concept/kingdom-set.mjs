// A kingdom's concept set by Codex: a street sketch first (the style reference), then village and town tiers x
// (road, street, forum, landmark), each painted against the sketch. Deterministic prompts from one spec per kingdom.
//   node kingdom-set.mjs <kingdom> [outdir]
import { codexImage } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/codex-image.mjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const K = {
  stormwind: {
    style: "the kingdom of Stormwind (World of Warcraft) in the language of Norman and early Gothic England and northern France: white Caen-like stone (smooth white and pale stone blocks), blue slate roofs (dark blue-grey), round Romanesque arches on the older buildings and pointed Gothic ones on the newer, timber-and-plaster cottages in the villages (Goldshire), a great white cathedral with blue spires at the capital's heart, banners in blue and gold with a lion",
    town: "Goldshire-like market town in Elwynn: an inn with a stone ground floor and timber upper storey, white stone houses with blue slate roofs, oaks and green meadows",
    landmark: "the town's white stone church with a blue slate spire and pointed windows",
  },
  dalaran: {
    style: "the kingdom of Dalaran (World of Warcraft) in the language of Tang and Song China: walled wards with gate towers on stone platforms, timber halls on raised stone bases with red lacquered columns and deep eaves, roofs of violet glazed tiles with upturned ridge ends, drum and bell towers, paifang arches over avenues, courtyard houses with white walls and grey tile, willows and ginkgo, a scholarly orderly city",
    town: "a walled ward town with a grid of streets, courtyard houses and a market",
    landmark: "a tall pagoda with violet tiled eaves above the roofs",
  },
};
const kingdom = process.argv[2], spec = K[kingdom], OUT = process.argv[3] || `../../out/concept/${kingdom}`;
if (!spec) { console.error(`kingdoms: ${Object.keys(K).join(", ")}`); process.exit(1); }
mkdirSync(OUT, { recursive: true });
const base = `Concept art of a Minecraft build: everything is made of Minecraft blocks at true block scale (1 block = 1 m), painterly game concept art with a slight Warcraft warmth and saturated colour, warm late-afternoon light. No people, villagers, animals or text. ${spec.style}.`;
const sketch = `${OUT}/street-sketch.png`;
if (!existsSync(sketch)) {
  const r = await codexImage({ prompt: `${base}\n\nVIEW: eye level in a 4-block-wide street inside the town walls, houses of 2 to 3 storeys on both sides set back behind small front gardens, signs of trade (a smith's yard, a baker's oven), lanterns on brackets, ${spec.landmark} rising at the end of the street. ${spec.town}.`, size: "1536x1024 landscape" });
  writeFileSync(sketch, Buffer.from(r.base64, "base64")); console.log("sketch done");
}
const ref = { base64: readFileSync(sketch).toString("base64"), mediaType: "image/png" };
const TIER = {
  village: "VILLAGE tier: one- and two-storey houses with gardens, a market square with a well and a few stalls, a small chapel, a timber palisade with a gatehouse, fields around.",
  town: "TOWN tier: two- and three-storey houses with shop fronts and trade yards, avenues lined with trees and lanterns from a central square to four gates, halls (granary, guildhall), a stone town wall with towers and gatehouses.",
};
const VIEW = {
  road: ["the town seen from the road coming in, about 60 blocks out, the whole town and its landmark behind, wide landscape framing", "1536x1024 landscape"],
  street: ["eye level in a street inside the walls, houses on both sides with front gardens, lived-in detail and one sign of trade", "1536x1024 landscape"],
  forum: ["the central square round the town bell from a corner at eye level: the bell in a centrepiece, paving, stalls showing their goods, lanterns, the landmark over the roofs", "1536x1024 landscape"],
  landmark: [`${spec.landmark}, three-quarter view, the town's roofs in the foreground`, "1024x1536 portrait"],
};
const jobs = []; for (const t of Object.keys(TIER)) for (const v of Object.keys(VIEW)) jobs.push([t, v]);
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < jobs.length) {
    const [t, v] = jobs[i++], out = `${OUT}/${t}-${v}.png`;
    if (existsSync(out)) continue;
    try { const r = await codexImage({ prompt: `Match the attached reference's style, palette, light and block scale exactly.\n\n${base}\n\n${TIER[t]}\n\nVIEW: ${VIEW[v][0]}.`, images: [ref], size: VIEW[v][1] });
      writeFileSync(out, Buffer.from(r.base64, "base64")); console.log(`done ${t}-${v}`); } catch (e) { console.log(`failed ${t}-${v}: ${e.message.slice(0, 160)}`); }
  }
}));
console.log("all done");
