// The DETAIL PASS: a small model (Haiku by default) details a finished build with the minecraft-design detailing
// vocabulary (mcd features / mcd detail), writing a plan of operations on named features instead of placing blocks.
// Then an external keep-better pick (Opus) decides between the undetailed build and the detailed one.
//
//   node benchmarks/gauntlet/detail-pass.mjs <run-dir> [--input final.nbt] [--model claude-haiku-5-5] [--effort high]
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";
const { decodePng } = await import(new URL("../../../minecraft-design/tools/src/png.mjs", import.meta.url));

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = join(HERE, "..", "..", "..", "minecraft-design");
const MCD = join(PLUGIN, "tools", "bin", "mcd.mjs");
const PICKER = process.env.MC_PICK_MODEL_ID || "claude-opus-5-5";
const img = (p) => ({ data: readFileSync(p), mediaType: /\.jpe?g$/i.test(p) ? "image/jpeg" : "image/png" });

export async function detailPass(runDir, { input = "final.nbt", model = "claude-haiku-5-5", effort = "high", lang = false, faces = "north,west,roof", jobs = false, jobsModel = "claude-sonnet-5-5", greedy = false, judgeModel = "claude-sonnet-5-5", scale = 2, inventory = false } = {}) {
  // big renders for everyone (detailer, judges): fine detail is invisible on 300 px tiles
  process.env.MCD_TILE_SCALE = String(scale);
  const t0 = Date.now();
  let cost0 = 0;
  const dir = join(runDir, `detail-${model.replace(/^claude-/, "").replace(/-\d.*$/, "")}-${effort}${lang ? "-lang" : ""}${jobs ? "-jobs" : ""}${greedy ? "-greedy" : ""}${inventory ? "-inv" : ""}${input !== "final.nbt" ? "-" + basename(input, ".nbt") : ""}`);
  mkdirSync(dir, { recursive: true });
  copyFileSync(join(runDir, input), join(dir, "input.nbt"));
  const concept = ["concept.jpg", "concept.png"].map((f) => join(runDir, f)).find(existsSync);
  copyFileSync(concept, join(dir, basename(concept)));
  for (const f of ["side.png", "trace.png", "spec.md"]) if (existsSync(join(runDir, f))) copyFileSync(join(runDir, f), join(dir, f));
  // JOBS: a stronger model looks at the build beside the concept and names the specific detail jobs (where, which
  // treatment, why); the cheap model only turns each job into rules, and the tools execute them
  let jobsText = "";
  if (jobs) {
    const t0j = join(dir, "t-jobs");
    execFileSync("node", [MCD, "render", join(dir, "input.nbt"), "--front", "n", "--tiles", t0j, "--out", join(dir, "jobs-sheet.png")], { stdio: "ignore" });
    const maps = execFileSync("node", [MCD, "faces", join(dir, "input.nbt"), "--face", faces], { encoding: "utf8", maxBuffer: 1 << 26 });
    const spec = existsSync(join(PLUGIN, "skills", "minecraft-design", "references", "detail-language.md")) ? readFileSync(join(PLUGIN, "skills", "minecraft-design", "references", "detail-language.md"), "utf8") : "";
    const j = await requestTextWithImage({
      prompt: [
        "You are the lead designer reviewing a finished Minecraft build before its DETAIL pass (form is final). Image 1: the concept. Image 2: front elevation.",
        "Image 3: front 3/4 view. Image 4: side elevation. Name the 5-8 DETAIL JOBS that would most bring this build toward the concept's craft:",
        "profiles (cornices, copings, plinths, sills, lintels, frames), relief (pilasters, projections), and restrained surface treatment (variation,",
        "weathering, gradients, coursing) only where the concept shows it. For each job: WHERE (face + rows/cols or selector such as openings, wall tops,",
        "ground row, corners, by block letter), WHAT (a treatment from the language below, with block names from the concept's palette), WHY (one",
        "clause). Prefer few strong jobs over many small ones; skip anything already right. Output only a numbered list.",
        "", "The detail language:", spec.slice(0, 12000), "", "Face maps:", maps.slice(0, 30000),
      ].join("\n"),
      images: [img(concept), img(join(t0j, "front-elevation.png")), img(join(t0j, "front-left.png")), img(join(t0j, "right-elevation.png"))],
      model: jobsModel, effort: "medium",
    });
    jobsText = j.text;
    cost0 += j.raw?.total_cost_usd || 0;
    writeFileSync(join(dir, "jobs.md"), jobsText + "\n");
  }
  // INVENTORY: close-up crops of the concept -> every small feature (railings, finials, louvres, brackets, lamps, ...);
  // each becomes a required job (the zoomed-out jobs step never sees them)
  if (inventory) {
    const { featureInventory } = await import("./inventory.mjs");
    const inv = await featureInventory(concept, join(dir, "inventory"));
    jobsText = "FEATURE INVENTORY of the concept's small features (from close-up crops). Implement EACH item as its own JOB, most visible first; " +
      "skip an item only if the build already has it or it cannot fit (say so in a # comment):\n" + readFileSync(inv.file, "utf8");
    writeFileSync(join(dir, "jobs.md"), jobsText + "\n");
  }
  // LANG mode: the face-map rule language (rows, columns, faces) that Haiku itself converged on, run by mcd paint
  const langPrompt = [
    "You are the DETAIL pass for a finished Minecraft build. The form is done and correct: do NOT change massing, layout or the design.",
    `Your job is finishing craft: turn plain strips, fields, edges and openings into crafted ones, as the concept (${basename(concept)}) shows.`,
    "You work by writing RULES against the build's FACE MAPS (rows x columns per face, seen from outside). Read the minecraft-design skill's",
    "references/detail-language.md first (it is short). Toolkit: MCD=\"node " + MCD + "\".",
    `1. $MCD render input.nbt --front n --tiles t0 and look at t0/front-elevation.png, t0/front-left.png, t0/right-elevation.png next to the concept.`,
    `2. $MCD faces input.nbt --face ${faces}  (the maps; the side shown is the west wall = what render calls right-elevation; mirror rules to the east with ALL FACES or an east block if you like).`,
    ...(jobsText ? ["3. The lead designer named these DETAIL JOBS (in jobs.md). Write rules.txt implementing EACH job, preferring the language's TREATMENTS",
      "   (coping, cornice, plinth, sills, lintels, frames, pilasters, vary, weather, gradient, courses, quoins) over raw block replacement. Do not add",
      "   jobs of your own beyond small fixes.", ...jobsText.split("\n").map((l) => "   " + l)] :
    ["3. Write rules.txt: copings and cornices on wall tops and bands, plinths, sills and lintels at openings, restrained variation on large flat",
      "   fields, relief where the concept has it, a few accents. Prefer the language's TREATMENTS over raw replacement. Keep the concept's palette."]),
    `4. $MCD paint input.nbt detail-1.nbt --rules rules.txt --face ${faces} ; read the per-line report (fix lines that errored or wrote 0);`,
    "   $MCD render detail-1.nbt --front n --tiles t1 ; compare t1 with t0 and the concept: what got better, what got busier or wrong?",
    `5. Edit rules.txt (drop what hurt, add what is missing) and paint AGAIN FROM input.nbt: $MCD paint input.nbt detail-2.nbt --rules rules.txt --face ${faces} ; render to t2.`,
    ...(greedy ? [
      "FORMAT: group rules.txt into JOBS, each starting with a header line '## JOB <n>: <short title>' followed by its 1-6 rules. Each job must stand",
      "on its own (it will be accepted or rejected separately by a reviewer looking at large renders). " + (inventory ? "One job per inventory item. Then add" : "Aim for 8-14 jobs") + " covering the whole",
      "building: base/plinth, every kind of opening (sills, lintels, frames), the entrance, piers/pilasters (capitals, bases), string courses,",
      "eaves and cornices, wall tops/copings, the roof edge, the sides and the back, and restrained surface treatment (weathering is welcome).",
      "Do not be lazy: a careful detailer writes many precise jobs; small ones are fine.",
      "When a job REPLACES something that is already there (e.g. battlements that should become a railing, a wrong chimney, a stub), write it as",
      "two passes inside the job: the clearing rules, a line 'then', and the building rules; after 'then' refer to blocks by NAME, not letter.",
      "Ornaments must read at street distance and suit the palette: prefer the treatments' visible defaults (lantern fittings, handrails with posts,",
      "mullions on big glass) and avoid colours that clash with the walls and trim.",
    ] : []),
    "Never edit .nbt files or write build scripts; only rules. Report in ≤6 lines: the treatments you chose and whether detail-2 beats input.",
  ].join("\n");
  const prompt = lang ? langPrompt : [
    "You are the DETAIL pass for a finished Minecraft build. The form is done and correct: do NOT change massing, layout or the design.",
    `Your job is finishing craft: turn plain surfaces into crafted ones, as the concept (${basename(concept)}) shows, using ONLY the detailing vocabulary.`,
    "Read the minecraft-design skill's references/detailing.md first. Toolkit: MCD=\"node " + MCD + "\".",
    "1. $MCD render input.nbt --front n --tiles t0 and look at t0/front-elevation.png, t0/front-left.png, t0/right-elevation.png next to the concept.",
    "2. $MCD features input.nbt (try --face n, --face e, --face w, --face up, --kind band etc.) and $MCD detail --vocabulary.",
    "3. Write plan.txt: one operation per line on feature ids (aim for 15-40 operations): copings and cornices on wall tops and bands, plinths,",
    "   sills and lintels on openings, texture mixes on the large flat fields, relief where the concept has it, a few accents. Repeat a treatment across",
    "   like features. Keep the concept's palette; name a material when the automatic form would drift in colour.",
    "4. $MCD detail input.nbt detail-1.nbt --plan plan.txt ; read the report (fix ops that wrote 0 or errored); $MCD render detail-1.nbt --front n --tiles t1;",
    "   compare t1 with t0 and the concept: what got better, what got busier or wrong?",
    "5. Edit plan.txt (drop what hurt, add what is missing) and apply it AGAIN TO input.nbt: $MCD detail input.nbt detail-2.nbt --plan plan.txt ; render to t2.",
    "Never edit .nbt files or build scripts directly; only plans. Report in ≤6 lines: the treatments you chose and whether detail-2 beats input.",
  ].join("\n");
  const r = spawnSync("claude", ["-p", "--plugin-dir", PLUGIN, "--model", model, "--effort", effort, "--allowedTools", "Bash Read Write Edit Glob Grep",
    "--output-format", "json", prompt], { cwd: dir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  let o = {}; try { o = JSON.parse(r.stdout); } catch { o = { result: r.stdout?.slice(0, 2000) }; }
  writeFileSync(join(dir, "agent-report.md"), (o.result || "") + "\n");
  let cost = (o.total_cost_usd || 0) + cost0;
  // GREEDY: apply the jobs one at a time; a reviewer keeps a job only if it improves the build on large renders
  let greedyLog = [];
  if (greedy && lang && existsSync(join(dir, "rules.txt"))) {
    const text = readFileSync(join(dir, "rules.txt"), "utf8");
    const parts = text.split(/^(?=## JOB )/m);
    const preamble = parts[0].startsWith("## JOB") ? "" : parts.shift();
    const jobsList = parts.filter((p) => p.startsWith("## JOB"));
    let conceptBox = null;
    try { const { locateWithGemini } = await import("./sheet-trace.mjs"); conceptBox = await locateWithGemini(concept); } catch { /* no colour guard */ }
    let accepted = preamble, curNbt = join(dir, "input.nbt"), curTiles = join(dir, "g-0");
    const renderTiles = (nbt, tiles) => execFileSync("node", [MCD, "render", nbt, "--front", "n", "--tiles", tiles, "--out", tiles + ".png"], { stdio: "ignore" });
    const composite = (tiles, out) => execFileSync("magick", ["(", join(tiles, "street.png"), "-resize", "x700", ")", "(", join(tiles, "front-elevation.png"), "-resize", "x700", ")",
      "(", join(tiles, "front-left.png"), "-resize", "x700", ")", "(", join(tiles, "right-elevation.png"), "-resize", "x700", ")", "+append", out]);
    renderTiles(curNbt, curTiles); composite(curTiles, curTiles + "-c.png");
    for (const [n, job] of jobsList.entries()) {
      const title = job.split("\n")[0].replace(/^## /, "");
      const rulesFile = join(dir, `g-${n + 1}.rules.txt`), nbt = join(dir, `g-${n + 1}.nbt`), tiles = join(dir, `g-${n + 1}`);
      writeFileSync(rulesFile, accepted + "\n" + job);
      try { execFileSync("node", [MCD, "paint", join(dir, "input.nbt"), nbt, "--rules", rulesFile, "--face", faces], { stdio: "ignore" }); }
      catch { greedyLog.push({ job: title, kept: false, why: "paint failed" }); continue; }
      renderTiles(nbt, tiles); composite(tiles, tiles + "-c.png");
      // show the reviewer WHERE the job changed the build, at a size it can see: per view, diff before/after pixels, crop
      // tightly around the change (with context) and upscale. A wide strip of whole tiles gets downscaled by the vision
      // model until a sill is a pixel. No changed pixels at all = no visible change, without a model call.
      const views = ["street", "front-elevation", "front-left", "right-elevation"].map((v) => {
        const a = decodePng(readFileSync(join(curTiles, `${v}.png`))), b = decodePng(readFileSync(join(tiles, `${v}.png`)));
        let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
        for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
          const i = 4 * (y * a.width + x);
          if (Math.abs(a.rgba[i] - b.rgba[i]) + Math.abs(a.rgba[i + 1] - b.rgba[i + 1]) + Math.abs(a.rgba[i + 2] - b.rgba[i + 2]) > 30) { n++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
        }
        return { v, n, box: n ? { x0, y0, x1, y1, w: a.width, h: a.height } : null };
      }).filter((d) => d.n > 40).sort((p, q) => q.n - p.n).slice(0, 2);
      if (!views.length) { greedyLog.push({ job: title, kept: false, verdict: "no-pixels-changed", why: "the job changed no visible pixels in any view" }); continue; }
      // colour guard: a job that moves the front's colours further from the concept is rejected without a model call
      if (conceptBox) {
        const { paletteCheck } = await import("./palette-check.mjs");
        const before = paletteCheck(concept, join(curTiles, "front-elevation.png"), { box: conceptBox }).meanDeltaE;
        const after = paletteCheck(concept, join(tiles, "front-elevation.png"), { box: conceptBox }).meanDeltaE;
        if (after > before + 1) { greedyLog.push({ job: title, kept: false, verdict: "colour-drift", why: `front colours moved away from the concept (mean ΔE ${before} -> ${after})` }); continue; }
      }
      const crops = [];
      for (const { v, box } of views) {
        const pad = Math.round(Math.max(box.x1 - box.x0, box.y1 - box.y0) * 0.35) + 24;
        const cx0 = Math.max(0, box.x0 - pad), cy0 = Math.max(0, box.y0 - pad), cw = Math.min(box.w, box.x1 + pad) - cx0, ch = Math.min(box.h, box.y1 + pad) - cy0;
        const pair = join(dir, `g-${n + 1}-${v}-pair.png`);
        execFileSync("magick", ["(", join(curTiles, `${v}.png`), "-crop", `${cw}x${ch}+${cx0}+${cy0}`, "+repage", "-resize", "700x700", ")",
          "(", join(tiles, `${v}.png`), "-crop", `${cw}x${ch}+${cx0}+${cy0}`, "+repage", "-resize", "700x700", ")", "-background", "white", "-splice", "12x0", "+append", pair]);
        crops.push({ v, pair });
      }
      const v = await requestTextWithImage({
        prompt: `Image 1 is the concept. ${crops.map((c, i) => `Image ${i + 2} is a close-up of the ${c.v} view: LEFT = before, RIGHT = after`).join("; ")}. ` +
          `The only change is one detailing job ("${title}") on a Minecraft build. Judge as a skilled builder: does the change make the build more crafted ` +
          "and closer to the concept (profiles, depth, finish, believable weathering), or is it noise, clutter, a wrong colour or a broken silhouette? " +
          "Reply ONLY JSON: {\"verdict\": \"improves\"|\"neutral\"|\"worse\", \"why\": \"one sentence\"}",
        images: [img(concept), ...crops.map((c) => img(c.pair))], model: judgeModel, effort: "low",
      });
      cost0 += v.raw?.total_cost_usd || 0;
      let j = {}; try { j = JSON.parse(v.text.slice(v.text.indexOf("{"), v.text.lastIndexOf("}") + 1)); } catch { /* treat as reject */ }
      const kept = j.verdict === "improves";
      greedyLog.push({ job: title, kept, verdict: j.verdict, views: crops.map((c) => c.v), why: j.why || v.text.slice(0, 200) });
      if (kept) { accepted += "\n" + job; curNbt = nbt; curTiles = tiles; }
    }
    writeFileSync(join(dir, "rules-accepted.txt"), accepted + "\n");
    execFileSync("node", [MCD, "paint", join(dir, "input.nbt"), join(dir, "detail-greedy.nbt"), "--rules", join(dir, "rules-accepted.txt"), "--face", faces], { stdio: "ignore" });
    writeFileSync(join(dir, "greedy.json"), JSON.stringify(greedyLog, null, 1) + "\n");
  }
  const cand = ["detail-greedy.nbt", "detail-2.nbt", "detail-1.nbt"].find((f) => existsSync(join(dir, f)));
  let kept = "input", why = "no detailed file";
  if (cand) {
    const comp = {};
    for (const f of ["input.nbt", cand]) {
      const tiles = join(dir, `${f}-judge`);
      execFileSync("node", [MCD, "render", join(dir, f), "--front", "n", "--tiles", tiles, "--out", join(dir, `${f}-sheet.png`)], { stdio: "ignore" });
      comp[f] = join(dir, `${f}-matched.png`);
      // a 2x2 grid about 1400 px square (a wide strip would be downscaled by the vision model until detail vanishes)
      execFileSync("magick", ["(", "(", join(tiles, "front-elevation.png"), "-resize", "700x700", ")", "(", join(tiles, "front-left.png"), "-resize", "700x700", ")", "+append", ")",
        "(", "(", join(tiles, "street.png"), "-resize", "700x700", ")", "(", join(tiles, "right-elevation.png"), "-resize", "700x700", ")", "+append", ")", "-background", "white", "-append", comp[f]]);
    }
    // order shuffled against position bias
    const flip = Math.random() < 0.5, A = flip ? cand : "input.nbt", Bf = flip ? "input.nbt" : cand;
    const p = await requestTextWithImage({
      prompt: "Image 1 is the reference concept. Images 2 (A) and 3 (B) are two versions of the same Minecraft build, each a grid of [front elevation, 3/4 view / street view, side elevation]. " +
        "They have the same form; one has an extra detailing pass. Which is the better finished build: closer to the concept's craft and character, " +
        "with detail that reads as skilled (not noisy or busy)? Reply ONLY JSON: {\"better\": \"A\"|\"B\", \"why\": \"one sentence\"}",
      images: [img(concept), img(comp[A]), img(comp[Bf])], model: PICKER,
    });
    cost += p.raw?.total_cost_usd || 0;
    const j = JSON.parse(p.text.slice(p.text.indexOf("{"), p.text.lastIndexOf("}") + 1));
    kept = (j.better === "A" ? A : Bf).replace(/\.nbt$/, ""); why = j.why;
  }
  const planFile = join(dir, lang ? "rules.txt" : "plan.txt");
  const plan = existsSync(planFile) ? readFileSync(planFile, "utf8").split("\n").filter((l) => l.trim() && !l.startsWith("#")).length : 0;
  const summary = { model, effort, lang, greedy, jobsAccepted: greedyLog.filter((g) => g.kept).length, jobsTotal: greedyLog.length, input, kept, why, planOps: plan, turns: o.num_turns, costUsd: cost, durationMs: Date.now() - t0 };
  writeFileSync(join(dir, "summary.json"), JSON.stringify(summary, null, 1) + "\n");
  return { dir, ...summary };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
  const r = await detailPass(process.argv[2], { input: arg("--input", "final.nbt"), model: arg("--model", "claude-haiku-5-5"), effort: arg("--effort", "high"), lang: process.argv.includes("--lang"), faces: arg("--faces", "north,west,roof"), jobs: process.argv.includes("--jobs"), greedy: process.argv.includes("--greedy"), scale: Number(arg("--scale", 2)), inventory: process.argv.includes("--inventory") });
  console.log(JSON.stringify(r));
}
