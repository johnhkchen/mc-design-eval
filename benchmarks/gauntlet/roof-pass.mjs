// ROOF PASS: the roof is the part every builder gets wrong, so it gets its own step with the plugin's procedural roof
// tool. Detect the eave and footprint, let a model write a roof SPEC (style, pitch, eave, pediment, dormers, chimneys,
// tower, keep boxes) from the concept + the detection + the tool's reference, build it with `mcd roof`, and keep the
// better of old roof / new roof (Opus pick on a 2x2 render grid).
//
//   node benchmarks/gauntlet/roof-pass.mjs <run-dir> [--input final.nbt] [--model claude-sonnet-5-5]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = join(HERE, "..", "..", "..", "minecraft-design");
const MCD = join(PLUGIN, "tools", "bin", "mcd.mjs");
const img = (p) => ({ data: readFileSync(p), mediaType: /\.jpe?g$/i.test(p) ? "image/jpeg" : "image/png" });

function grid(nbt, tiles, out) {
  execFileSync("node", [MCD, "render", nbt, "--front", "n", "--tiles", tiles, "--out", tiles + ".png"], { stdio: "ignore", env: { ...process.env, MCD_TILE_SCALE: "2" } });
  execFileSync("magick", ["(", "(", join(tiles, "front-elevation.png"), "-resize", "700x700", ")", "(", join(tiles, "front-left.png"), "-resize", "700x700", ")", "+append", ")",
    "(", "(", join(tiles, "front-right.png"), "-resize", "700x700", ")", "(", join(tiles, "right-elevation.png"), "-resize", "700x700", ")", "+append", ")", "-background", "white", "-append", out]);
}

export async function roofPass(dir, { input = "final.nbt", model = "claude-sonnet-5-5" } = {}) {
  const t0 = Date.now(); let cost = 0;
  const src = join(dir, input), concept = ["concept.jpg", "concept.png"].map((f) => join(dir, f)).find(existsSync);
  const detect = execFileSync("node", [MCD, "roof", src, "--detect"], { encoding: "utf8" });
  // a height map above the eave helps the model see towers / chimneys it may want to keep
  const above = execFileSync("node", ["-e", `
    import(${JSON.stringify(join(PLUGIN, "tools", "src", "structure.mjs"))}).then(({ load }) => {
      const g = load(${JSON.stringify(src)}); const m = new Map();
      for (const c of g.solids()) { const k = c.pos[0] + "," + c.pos[2]; m.set(k, Math.max(m.get(k) ?? -1, c.pos[1])); }
      const rows = []; for (let z = 0; z < g.size[2]; z++) { let s = ""; for (let x = 0; x < g.size[0]; x++) { const h = m.get(x + "," + z); s += h == null ? "." : String.fromCharCode(48 + Math.min(42, h)); } rows.push(String(z).padStart(2) + " " + s); }
      console.log("top height per column (char code 48+y, '.' empty), x left->right, z = rows (z=0 is the FRONT/north):\\n" + rows.join("\\n"));
    });`], { encoding: "utf8" });
  grid(src, join(dir, "roof-before"), join(dir, "roof-before.png"));
  const ref = readFileSync(join(PLUGIN, "skills", "minecraft-design", "references", "roofs.md"), "utf8");
  const r = await requestTextWithImage({
    prompt: [
      "You design the ROOF for a finished Minecraft build with a procedural roof tool. Image 1 is the concept; image 2 is the build now (front elevation,",
      "front-left / front-right 3/4, side). The front faces north (-z); x runs along the street. Write a roof SPEC (JSON) for `mcd roof --spec` that",
      "makes the roof match the concept: style, pitch, eave treatment, material, trim, ridge, overhang, the eave course y (wall top + 1), the footprint",
      "if the detected one is wrong, pediment/dormers/chimneys/tower as the concept shows, and KEEP boxes ({from:[x,y,z], to:[x,y,z]}) for anything",
      "above the eave that must survive (an existing tower, chimney or parapet the concept has). Use the concept's palette. Reply ONLY the JSON.",
      "", "Detection:", detect, "", above.slice(0, 6000), "", "The roof tool reference:", ref.slice(0, 14000),
    ].join("\n"),
    images: [img(concept), img(join(dir, "roof-before.png"))], model, effort: "medium",
  });
  cost += r.raw?.total_cost_usd || 0;
  const spec = JSON.parse(r.text.slice(r.text.indexOf("{"), r.text.lastIndexOf("}") + 1));
  writeFileSync(join(dir, "roof.json"), JSON.stringify(spec, null, 1) + "\n");
  const out = join(dir, "roofed.nbt");
  const log = execFileSync("node", [MCD, "roof", src, out, "--spec", join(dir, "roof.json")], { encoding: "utf8" });
  grid(out, join(dir, "roof-after"), join(dir, "roof-after.png"));
  const flip = Math.random() < 0.5, A = flip ? "roof-after.png" : "roof-before.png", B = flip ? "roof-before.png" : "roof-after.png";
  const p = await requestTextWithImage({
    prompt: "Image 1 is the concept. Images 2 (A) and 3 (B) are the same Minecraft build with two different ROOFS (grid: front elevation, 3/4 left / 3/4 right, side). " +
      "Which roof better matches the concept and is better crafted (silhouette, pitch, edges, pediment/dormers/tower)? Reply ONLY JSON: {\"better\": \"A\"|\"B\", \"why\": \"one sentence\"}",
    images: [img(concept), img(join(dir, A)), img(join(dir, B))], model: "claude-opus-5-5",
  });
  cost += p.raw?.total_cost_usd || 0;
  const j = JSON.parse(p.text.slice(p.text.indexOf("{"), p.text.lastIndexOf("}") + 1));
  const kept = (j.better === "A" ? A : B) === "roof-after.png" ? "roofed.nbt" : input;
  const summary = { input, kept, why: j.why, spec, tool: log.trim().split("\n")[0], costUsd: cost, durationMs: Date.now() - t0 };
  writeFileSync(join(dir, "roof-summary.json"), JSON.stringify(summary, null, 1) + "\n");
  return summary;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
  console.log(JSON.stringify(await roofPass(process.argv[2], { input: arg("--input", "final.nbt"), model: arg("--model", "claude-sonnet-5-5") })));
}
