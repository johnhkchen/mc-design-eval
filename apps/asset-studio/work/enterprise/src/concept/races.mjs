// New faction aesthetics by Codex (owner, 2026-10-29): orc and dwarf towns with the Warcraft feel the earlier kingdom
// sets lacked. The earlier prompts described each kingdom through a real-world style (Tudor, Norman, Tang) with "a slight
// Warcraft warmth"; these describe the game's own look: chunky hand-painted forms, exaggerated proportions, oversized
// roofs and silhouettes, heavy timber and stone, saturated colour. Each view carries the character ideas: a skyline
// landmark, life in the streets, greenery or its absence as part of the place.
//   node races.mjs [race ...] [--view v]      (default: both races, every view)
import { codexImage } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/codex-image.mjs";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";

const HERE = new URL(".", import.meta.url).pathname;
const LOOK = "in the unmistakable art direction of World of Warcraft: hand-painted stylised forms, chunky exaggerated proportions (massive bases, thick walls, oversized roofs and beams, everything a little bulging and heroic), bold readable silhouettes, saturated warm colour, strong rim light";
const R = {
  orc: {
    place: "an orc war-town in a red rock canyon desert under a hot orange sky",
    build: "round and oval huts on low red sandstone and terracotta walls, roofs of stretched brown and tan hides over curved timber ribs, great curved tusk-like timbers and iron spikes jutting from every roof ridge and doorway, rusted iron plates bolted over the walls, bone and skull ornaments, heavy log palisades with sharpened tops, red banners with black clan marks on tall spiked poles",
    landmark: "a towering great hall fortress at the town's heart on a rock outcrop: tiers of spiked hide-and-timber roofs climbing over thick red stone walls, giant curved tusks framing its gate, smoke rising from braziers on every tier",
    life: "fire braziers and burning torches along the paths, war drums on wooden stands, weapon racks and training dummies, tanning racks with hides drying, a wolf kennel with gnawed bones, cookfire spits, crates of goods and spiky wagons at a dusty market",
    green: "sparse and harsh: thorny scrub, dry yellow grass, a few twisted dead trees, barrel cactus, a muddy oasis pool with reeds",
    blocks: "red sandstone, terracotta in orange, red and brown, acacia and dark oak logs, brown and orange wool and carpet for hides, iron bars and chains, bone blocks, campfires and lanterns",
  },
  dwarf: {
    place: "a dwarven mountain town in snowy peaks under a cold blue sky with warm light glowing everywhere",
    build: "squat heavy stone houses with walls a metre thick at the base, steep dark slate roofs with huge chimneys pouring smoke, round arched doors and windows glowing orange, bronze and gold trim on gables and doors, carved stone runes and knotwork, massive stone buttresses, timber balconies, everything broad, low and immovable",
    landmark: "an enormous carved stone gate into the mountain at the town's head: a colossal statue of a dwarf king with a hammer guarding it, the gate's arch lit by a forge glow from within, smoke vents carved into the cliff above",
    life: "forges with glowing lava and anvils in open workshops, mine carts on rails running through the town, a cable gondola strung between peaks, barrels of ale stacked outside a tavern, hanging iron lanterns, steam vents, a brewery with copper vats",
    green: "dark green spruce and fir trees heavy with snow, snowy terraces, a frozen stream with an arched stone bridge",
    blocks: "stone bricks, deepslate tiles and bricks, polished blackstone, chiselled stone with runes, copper and gold blocks for trim, spruce timber, lava behind iron bars, snow and packed ice, lanterns",
  },
};
const VIEW = {
  "town-aerial": ["1536x1024 landscape", (r) => `A whole town from the air at about 40 degrees, filling the frame: ${r.place}. Its streets wind and branch with the land, not a grid; ${r.build}. The landmark dominates the skyline: ${r.landmark}. The streets are full of life: ${r.life}. Greenery: ${r.green}.`],
  "street": ["1536x1024 landscape", (r) => `At eye level down the town's main street: ${r.place}. ${r.build}. The street is full of life: ${r.life}. Greenery: ${r.green}. At the end of the street the landmark rises over the roofs: ${r.landmark}.`],
  "landmark": ["1024x1536 portrait", (r) => `The town's landmark seen from below in its square, towering over everything: ${r.landmark}. Around its base: ${r.life}. The town's buildings frame the view: ${r.build}.`],
};
const argv = process.argv.slice(2), vi = argv.indexOf("--view"), only = vi >= 0 ? argv[vi + 1] : null;
const races = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--view");
const jobs = [];
for (const r of races.length ? races : Object.keys(R)) for (const v of Object.keys(VIEW)) if (!only || v === only) jobs.push([r, v]);
let i = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (i < jobs.length) {
    const [r, v] = jobs[i++], OUT = `${HERE}../../out/concept/races/${r}`; mkdirSync(OUT, { recursive: true });
    const out = `${OUT}/${v}.png`; if (existsSync(out)) continue;
    const prompt = `Concept art of a Minecraft build, ${LOOK}. Everything is built of Minecraft blocks at true block scale (1 block = 1 metre), with the blocks' texture readable up close but the shapes and colour of Warcraft concept paintings: ${R[r].blocks}. Warm painterly light, game concept art. No people, creatures or text.\n\nVIEW: ${VIEW[v][1](R[r])}`;
    try { const res = await codexImage({ prompt, size: VIEW[v][0] }); writeFileSync(out, Buffer.from(res.base64, "base64")); console.log(`done ${r} ${v}`); }
    catch (e) { console.log(`failed ${r} ${v}: ${e.message.slice(0, 160)}`); }
  }
}));
console.log("all done");
