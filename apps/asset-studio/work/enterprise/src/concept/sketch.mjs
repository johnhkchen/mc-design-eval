import { codexImage } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/codex-image.mjs";
import { writeFileSync } from "node:fs";
const prompt = `Concept art of a Minecraft build: a street scene inside the walls of Hearthglen, a town-tier market town of the kingdom of Lordaeron (World of Warcraft) built in the language of Tudor and late-medieval England. Everything is made of Minecraft blocks, seen at eye level from a 2-block-wide lane of packed dirt path and cobble edging, a warm late-afternoon light.

On both sides, narrow two-storey timber-framed houses 5 to 7 blocks wide stand one block apart, fronting the lane: dark oak close studding over white plaster (calcite / white concrete) infill, jettied upper storeys overhanging the street by one block on dark oak beams, steep gable ends facing the lane, roofs of thatch-coloured (hay / brown terracotta) and red clay tile (brick / red terracotta stairs), small leaded windows (glass panes), brick chimneys rising from a hearth set into the side wall. Lived-in detail: flower boxes under windows, a woodpile by a door, a bench, washing on a line between two upper windows, a kitchen garden behind a low hedge.

Signs of trade: on one side a smith's yard with an anvil, a quenching trough of water and a stack of iron; further on a farmer's domed brick bake oven with loaves on a board. Hanging lanterns on chain brackets. Oak trees in the gaps. At the end of the lane, rising on its hill above the rooftops, the grey stone abbey of Hearthglen with a Perpendicular Gothic tower and tall traceried windows, and a stretch of the town's stone inner wall with a gatehouse.

Painterly game concept art with a slight Warcraft warmth and saturated colour, but clearly blocky Minecraft geometry at true block scale (1 block = 1 m). No people, no villagers, no animals, no text.`;
const r = await codexImage({ prompt, size: "1536x1024 landscape" });
const buf = Buffer.isBuffer(r) ? r : Buffer.from(r.base64 ?? r, "base64");
writeFileSync("lordaeron-street-sketch.png", buf);
console.log("ok", buf.length);
