// Judge a sweep of concept builds (e.g. one subject at several efforts): render each round with the minecraft-design
// renderer, then (1) a categorical BAML grade per build and (2) a BLIND RANKING of all builds against the shared
// concept, repeated over several shuffles (position bias) and averaged. The ranking separates builds that a
// categorical rubric scores identically ("strong" everywhere).
//
//   MC_JUDGE_MODEL_ID=claude-opus-5-5 node benchmarks/concept-builds/judge-sweep.mjs --match old-west-saloon-effort [--shuffles 3]
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";
import { judgeRender } from "../temple-facade/judge.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const MCD = join(HERE, "..", "..", "..", "minecraft-design", "tools", "bin", "mcd.mjs");
const JUDGE = process.env.MC_JUDGE_MODEL_ID || "claude-opus-5-5";
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const match = arg("--match"), shuffles = Number(arg("--shuffles", 3));
if (!match) throw new Error("--match <run-id substring>");

const runs = readdirSync(join(HERE, "runs")).filter((d) => d.includes(match)).sort();
const builds = [];
for (const r of runs) {
  const dir = join(HERE, "runs", r);
  const summary = JSON.parse(readFileSync(join(dir, "summary.json"), "utf8"));
  for (const round of [0, 1]) {
    const art = join(dir, `round-${round}.artifact.json`);
    if (!existsSync(art)) continue;
    const nbt = join(dir, `round-${round}.nbt`), tiles = join(dir, `round-${round}-tiles`);
    execFileSync("node", ["-e", `
      import("${join(HERE, "..", "..", "src", "expand.mjs")}").then(async ({ expandArtifact }) => {
        const { Grid } = await import("${join(HERE, "..", "..", "..", "minecraft-design", "tools", "src", "structure.mjs")}");
        const ex = expandArtifact(JSON.parse(require("fs").readFileSync("${art}", "utf8")));
        const list = Array.isArray(ex) ? ex : ex.voxels;
        const mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9];
        for (const v of list) for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], v.pos[i]); mx[i] = Math.max(mx[i], v.pos[i]); }
        const g = new Grid([mx[0]-mn[0]+1, mx[1]-mn[1]+1, mx[2]-mn[2]+1], { dataVersion: 3465 });
        for (const v of list) g.set(v.pos[0]-mn[0], v.pos[1]-mn[1], v.pos[2]-mn[2], v.block, v.state);
        g.save("${nbt}");
      });`]);
    execFileSync("node", [MCD, "render", nbt, "--front", "n", "--out", join(dir, `round-${round}-sheet.png`), "--tiles", tiles], { stdio: ["ignore", "ignore", "ignore"] });
    const composite = join(dir, `round-${round}-judge.png`);
    execFileSync("magick", [join(tiles, "street.png"), "(", join(tiles, "front-left.png"), "-resize", "x350", ")", "(", join(tiles, "front-elevation.png"), "-resize", "x350", ")", "+append", composite]);
    builds.push({ run: r, effort: summary.effort, round, composite, costUsd: summary.costUsd, durationMs: summary.durationMs, tokensOut: summary.tokensOut });
  }
}
const concept = readdirSync(join(HERE, "runs", runs[0])).find((f) => f.startsWith("concept."));
const conceptImg = { data: readFileSync(join(HERE, "runs", runs[0], concept)), mediaType: concept.endsWith(".jpg") ? "image/jpeg" : "image/png" };
const brief = "An old west saloon on a frontier main street: tall false front with a sign, swinging doors, covered boardwalk porch, balcony with railings, weathered timber — a skilled-builder Minecraft build matching its concept art.";

// (1) categorical grade per build
process.env.MC_JUDGE_MODEL_ID = JUDGE;
for (const b of builds) {
  const s = await judgeRender({ imagePath: b.composite, brief });
  b.grade = { overall: s.overall, proportion: s.proportion, color: s.color, detail: s.detail, fidelity: s.fidelity };
  console.log(`grade ${b.effort} r${b.round}: ${JSON.stringify(b.grade)}`);
}

// (2) blind rankings over shuffles
const letters = "ABCDEFGHIJ";
const rankSum = new Map(builds.map((b) => [b, 0]));
const rankings = [];
for (let s = 0; s < shuffles; s++) {
  const order = [...builds].sort(() => Math.random() - 0.5);
  const prompt = [
    "You are judging Minecraft builds. Image 1 is the CONCEPT ART everyone built from. The following images are builds,",
    `labelled in order ${letters.slice(0, order.length).split("").join(", ")} (image 2 = A, image 3 = B, ...). Each build image shows a`,
    "street view at eye height, a front-corner view, and the front elevation.",
    "Rank ALL builds from best to worst as a skilled human builder would judge them: fidelity to the concept's character,",
    "massing and roofline, depth and relief, detail craft, palette, and whether it reads as a finished saloon from the street.",
    "Be decisive; no ties. Reply with ONLY JSON: {\"ranking\": [\"letters best to worst\"], \"notes\": {\"A\": \"one line\", ...}}",
  ].join(" ");
  const { text } = await requestTextWithImage({ prompt, images: [conceptImg, ...order.map((b) => ({ data: readFileSync(b.composite), mediaType: "image/png" }))], model: JUDGE });
  const j = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  j.ranking.forEach((L, i) => { const b = order[letters.indexOf(L)]; if (b) rankSum.set(b, rankSum.get(b) + i + 1); });
  rankings.push({ order: order.map((b) => `${b.effort}/r${b.round}`), ranking: j.ranking.map((L) => { const b = order[letters.indexOf(L)]; return b ? `${b.effort}/r${b.round}` : L; }), notes: Object.fromEntries(Object.entries(j.notes || {}).map(([L, n]) => { const b = order[letters.indexOf(L)]; return [b ? `${b.effort}/r${b.round}` : L, n]; })) });
  console.log(`ranking ${s + 1}: ${rankings.at(-1).ranking.join(" > ")}`);
}
for (const b of builds) b.meanRank = rankSum.get(b) / shuffles;
builds.sort((a, b) => a.meanRank - b.meanRank);
const out = { judge: JUDGE, shuffles, builds: builds.map(({ composite, ...b }) => ({ ...b, composite: composite.replace(HERE + "/", "") })), rankings };
mkdirSync(join(HERE, "sweeps"), { recursive: true });
writeFileSync(join(HERE, "sweeps", `${match}.json`), JSON.stringify(out, null, 1) + "\n");
console.log("\nmean rank (1 = best):");
for (const b of builds) console.log(`  ${b.meanRank.toFixed(2)}  ${b.effort}/r${b.round}  grade ${b.grade.overall}/${b.grade.detail}  $${b.costUsd?.toFixed(2)}  ${Math.round(b.durationMs / 1000)}s`);
