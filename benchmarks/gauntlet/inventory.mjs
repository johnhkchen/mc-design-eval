// FEATURE INVENTORY: the small things on a concept that every other stage misses (railings, finials, louvres,
// brackets, rods, lamps, banners, planters, signs). Tracing works at whole blocks and the jobs step looks at the whole
// sheet, so nothing ever zooms in. Here the concept is cut into overlapping close-up crops, a vision model lists every
// small ornament in each crop (where, size in blocks, likely blocks), and one merge call dedupes them into a numbered
// inventory that the detail pass must implement item by item.
//
//   node benchmarks/gauntlet/inventory.mjs <concept.png|jpg> <out-dir>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";

const MODEL = process.env.MC_INVENTORY_MODEL || "claude-sonnet-5-5";
const img = (p) => ({ data: readFileSync(p), mediaType: /\.jpe?g$/i.test(p) ? "image/jpeg" : "image/png" });

/** Overlapping crops over the whole sheet (rows x cols grid, 30% overlap), each upscaled so a fence post is visible. */
function crops(concept, dir, { rows = 3, cols = 4 } = {}) {
  const [w, h] = execFileSync("magick", [concept, "-format", "%w %h", "info:"], { encoding: "utf8" }).trim().split(" ").map(Number);
  const cw = Math.round(w / cols * 1.3), ch = Math.round(h / rows * 1.3), out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = Math.min(w - cw, Math.max(0, Math.round(c * w / cols - cw * 0.115))), y = Math.min(h - ch, Math.max(0, Math.round(r * h / rows - ch * 0.115)));
    const f = join(dir, `crop-r${r}c${c}.png`);
    execFileSync("magick", [concept, "-crop", `${cw}x${ch}+${x}+${y}`, "+repage", "-resize", "1000x1000", f]);
    out.push({ f, r, c, where: `${["top", "middle", "bottom"][r] || `row ${r}`} band, ${["far left", "left-centre", "right-centre", "far right"][c] || `col ${c}`} of the sheet` });
  }
  return out;
}

export async function featureInventory(concept, dir) {
  mkdirSync(dir, { recursive: true });
  const cs = crops(concept, dir);
  const found = [];
  // three crops per call keeps each image large enough to read
  for (let i = 0; i < cs.length; i += 3) {
    const batch = cs.slice(i, i + 3);
    const r = await requestTextWithImage({
      prompt: [
        "Image 1 is a Minecraft builder's reference sheet (front elevation on the left half, 3/4 view on the right half). The other images are CLOSE-UP crops of it:",
        ...batch.map((b, k) => `image ${k + 2} = the ${b.where}.`),
        "List every SMALL ORNAMENT or fitting you can see in the crops, the things a builder adds last: railings and fences, finials and rods, lanterns",
        "and lamps, louvres and grilles, brackets and corbels, sills and hoods, dentils, banners and flags, signs and lettering, planters and flowers, steps,",
        "chimney pots, flagpoles, awnings, trims of a contrasting material, window mullions. Ignore the main walls, the roof field and big masses.",
        "For each: WHAT it is, WHERE on the building (which mass: main block, tower/elevator head, entrance porch, glass shaft, roof, pediment; which face;",
        "which level: ground, upper storeys, eave, roof top), SIZE in blocks if you can judge it, and the likely vanilla blocks (e.g. oak_fence, lightning_rod,",
        "end_rod, oak_trapdoor, lantern, polished_deepslate_stairs). Reply ONLY a JSON array: [{\"what\":..., \"where\":..., \"size\":..., \"blocks\":...}].",
      ].join(" "),
      images: [img(concept), ...batch.map((b) => img(b.f))], model: MODEL, effort: "low",
    });
    try { found.push(...JSON.parse(r.text.slice(r.text.indexOf("["), r.text.lastIndexOf("]") + 1))); } catch { /* skip a malformed batch */ }
  }
  writeFileSync(join(dir, "raw.json"), JSON.stringify(found, null, 1) + "\n");
  const merged = await requestTextWithImage({
    prompt: [
      "Below is a raw list of small ornaments spotted in close-up crops of the attached concept (with duplicates, since crops overlap and the sheet shows",
      "the building twice). Merge it into ONE deduplicated inventory of the building's small features, as a numbered markdown list. For each item:",
      "**what** — where (mass / face / level, as a builder would locate it) — size in blocks — blocks — and which detail-language treatment fits",
      "(railing, finial, louvres, brackets, sills, lintels, frames, cornice, coping, plinth, quoins, pilasters, attach, or raw rules).",
      "Keep only features you can confirm in the concept image. Most visible first. Output only the list.",
      "", JSON.stringify(found),
    ].join("\n"),
    images: [img(concept)], model: MODEL, effort: "medium",
  });
  writeFileSync(join(dir, "inventory.md"), merged.text.trim() + "\n");
  return { items: (merged.text.match(/^\d+\./gm) || []).length, file: join(dir, "inventory.md"), raw: found.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(await featureInventory(process.argv[2], process.argv[3])));
}
