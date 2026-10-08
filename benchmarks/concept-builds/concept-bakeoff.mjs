// Concept-art bake-off: the "builder's reference sheet" prompt (one isolated building, front elevation + 3/4 view at
// the same scale, block-count size, vanilla palette by role, no scene) across image models and subjects.
//   node benchmarks/concept-builds/concept-bakeoff.mjs [--subjects a,b] [--models m1,m2]
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateImage } from "../../src/nano-banana.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "concept-bakeoff");
export const MODELS = ["gemini-3-pro-image", "gemini-3-pro-image-preview", "gemini-nano-banana-2.1", "gemini-3.1-flash-image"];

export const SUBJECTS = {
  "burgage-shop": {
    what: "a medieval burgage-plot shop in an English market town: a narrow timber-framed shop house with its gable end to the street, a ground-floor shop with a hinged stall-board counter and shutters, two jettied upper storeys overhanging the street, a steep roof, a brick chimney, and a long narrow plot running back with a small rear workshop",
    size: "7 blocks wide along the street, 20 deep, three storeys plus a steep gable (about 18 tall)",
    palette: "dark oak and spruce logs for the timber frame (supporting), pale plaster infill in white terracotta or calcite (dominant), cobblestone and stone-brick plinth, deepslate-tile or spruce roof, red brick chimney, a coloured shop sign (accent)",
  },
  "redstone-workshop": {
    what: "a redstone engineer's workshop in a market town that houses a part-picking machine: one tall workshop storey plus a mezzanine office, a big viewing window or open bay where passers-by can watch the machine of hoppers, droppers and conveyors, a loading door, chimneys or vents, and a painted sign — proud of its machine, workshop not factory",
    size: "16 blocks wide, 14 deep, about 12 tall",
    palette: "red bricks (dominant), dark oak frame and doors (supporting), cut copper and oxidised copper trim and vents, iron bars, glass panes, a smooth-stone base, glimpses of redstone (accent)",
  },
  "canal-warehouse": {
    what: "a tall spruce warehouse in a canal district: four storeys of stacked loading doors under a projecting hoist beam with a chain and pulley at the gable, a stone quay along the canal in front with mooring posts, crates, barrels and a small boat, small windows, a steep gable or stepped front",
    size: "12 blocks wide along the canal, 18 deep, four storeys plus gable (about 22 tall)",
    palette: "spruce planks and spruce logs (dominant), dark oak doors and frames (supporting), stone-brick and cobblestone quay and plinth, iron chain, water in the canal, lanterns (accent)",
  },
  "financial-market": {
    what: "a financial market — a grand stock exchange (bourse) on a city square: a classical portico of tall columns under a pediment with a carved frieze, a broad flight of steps, a big clock, tall arched windows along the sides, a balustraded roofline with statues or urns, bronze doors",
    size: "24 blocks wide, 20 deep, about 18 tall plus pediment",
    palette: "smooth quartz and calcite (dominant), polished andesite and stone bricks (supporting), polished deepslate base, gold blocks and copper for the clock and accents (accent), glass panes",
  },
};

export function referenceSheetPrompt({ what, size, palette }) {
  return [
    "Minecraft builder reference sheet for ONE building, vanilla Minecraft blocks only, crisp voxel style, plain light background,",
    "no characters, no animals, no neighbouring buildings, no street scene.",
    "Two views side by side: LEFT a straight-on FRONT ELEVATION (orthographic, no perspective); RIGHT a three-quarter view from the street at the same scale.",
    `Subject: ${what}.`,
    `Size: ${size}.`,
    `Palette by role: ${palette}.`,
    "Skilled human builder quality: real massing (not a box), depth (things proud of the wall, recessed openings), framed openings,",
    "real roof edges (verges, eaves, ridge), sub-block detail (stairs, slabs, fences, walls, trapdoors, lanterns).",
  ].join(" ");
}

async function main() {
  const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1].split(",") : null);
  const subjects = arg("--subjects") || Object.keys(SUBJECTS), models = arg("--models") || MODELS;
  const jobs = subjects.flatMap((s) => models.map((m) => ({ s, m })));
  const results = [];
  let i = 0;
  async function worker() {
    while (i < jobs.length) {
      const { s, m } = jobs[i++];
      const dir = join(OUT, s); mkdirSync(dir, { recursive: true });
      const prompt = referenceSheetPrompt(SUBJECTS[s]);
      writeFileSync(join(dir, "prompt.txt"), prompt + "\n");
      try {
        const img = await generateImage({ prompt, model: m });
        const f = join(dir, `${m}.${img.mediaType === "image/jpeg" ? "jpg" : "png"}`);
        writeFileSync(f, Buffer.from(img.base64, "base64"));
        results.push({ subject: s, model: m, ms: img.ms, file: f.replace(HERE + "/", "") });
        console.log(`${s} · ${m}: ${img.ms} ms`);
      } catch (e) { results.push({ subject: s, model: m, error: e.message.slice(0, 200) }); console.log(`${s} · ${m}: FAILED ${e.message.slice(0, 120)}`); }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  writeFileSync(join(OUT, `results-${Date.now()}.json`), JSON.stringify(results, null, 1) + "\n");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
