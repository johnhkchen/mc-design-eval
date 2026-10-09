// Vocabulary ELICITATION: show Haiku a finished build as face maps (rows x columns per face, seen from outside) plus the
// concept and a render, and let it write detailing instructions in WHATEVER light notation it finds natural, for a
// deterministic program to execute later. No interpreter exists yet; we collect what it reaches for, then a stronger
// model designs the language and writes the interpreter.
//
//   node benchmarks/detail-lang/elicit.mjs [--samples 3] [--model claude-haiku-5-5]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const MCD = join(HERE, "..", "..", "..", "minecraft-design", "tools", "bin", "mcd.mjs");
const RUNS = join(HERE, "..", "gauntlet", "runs");
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const samples = Number(arg("--samples", 3)), model = arg("--model", "claude-haiku-5-5");
export const BUILDS = {
  "dance-hall": { run: "202610090515-dance-hall-sonnet-high-rerun-respec-trace-redraw-thin-views-2pass", nbt: "round-2.nbt", faces: "north,west,roof" },
  "grocery": { run: "202610090515-grocery-store-sonnet-high-rerun-respec-trace-redraw-thin-views-2pass", nbt: "round-1.nbt", faces: "north,west,roof" },
  "taj": { run: "202610090214-taj-mahal-sonnet-high-rerun-respec-trace", nbt: "round-2.nbt", faces: "north,roof" },
};
const img = (p) => ({ data: readFileSync(p), mediaType: /\.jpe?g$/i.test(p) ? "image/jpeg" : "image/png" });
const PROMPT = (maps) => [
  "You are detailing a finished Minecraft build. Its FORM is final (massing, layout, openings); your job is FINISHING CRAFT: turning plain strips,",
  "fields, edges and openings into crafted ones (stairs and slabs for profiles and ledges, texture mixes, sills and lintels, copings, trims, accents),",
  "in the spirit of the attached concept (image 1). Image 2 is the build as it stands.",
  "Below, the build is given as FACE MAPS: each face as rows x columns seen from outside, a letter per block, and a depth map.",
  "",
  "Write detailing instructions in WHATEVER compact notation feels most natural to you: address faces, rows, columns, ranges, letters, patterns,",
  "repeats; English-like lines, little code, a mini language: your choice. A simple deterministic program will execute it against these maps, so be",
  "precise about WHERE (face / rows / columns / which blocks) and WHAT (block, form such as stairs/slab/wall, facing or 'out from the wall', pattern).",
  "Prefer instructions that cover many blocks at once over one block at a time. You may invent verbs and shorthands.",
  "",
  "Output: (1) the instructions in a fenced block, (2) then 3-6 lines describing your notation so someone could implement it.",
  "",
  maps,
].join("\n");

const out = join(HERE, "corpus");
mkdirSync(out, { recursive: true });
const jobs = [];
for (const [name, b] of Object.entries(BUILDS)) {
  const dir = join(RUNS, b.run), nbt = join(dir, b.nbt);
  const maps = execFileSync("node", [MCD, "faces", nbt, "--face", b.faces], { encoding: "utf8", maxBuffer: 1 << 26 });
  writeFileSync(join(out, `${name}.faces.txt`), maps);
  const tiles = join(out, `${name}-tiles`);
  if (!existsSync(join(tiles, "front-left.png"))) execFileSync("node", [MCD, "render", nbt, "--front", "n", "--tiles", tiles, "--out", join(out, `${name}-sheet.png`)], { stdio: "ignore" });
  const concept = ["concept.jpg", "concept.png"].map((f) => join(dir, f)).find(existsSync);
  for (let i = 1; i <= samples; i++) jobs.push((async () => {
    const t0 = Date.now();
    const r = await requestTextWithImage({ prompt: PROMPT(maps), images: [img(concept), img(join(tiles, "front-left.png"))], model });
    writeFileSync(join(out, `${name}-${i}.md`), r.text + "\n");
    console.log(`${name} #${i}: ${Math.round((Date.now() - t0) / 1000)}s $${(r.raw?.total_cost_usd || 0).toFixed(3)} ${r.text.length} chars`);
    return r.raw?.total_cost_usd || 0;
  })());
}
const costs = await Promise.all(jobs);
console.log(`total $${costs.reduce((a, b) => a + b, 0).toFixed(2)}`);
