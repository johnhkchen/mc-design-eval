// Fresh-subject test: does plugin + feedback + iterate beat stock? Three arms on one subject, in parallel where possible:
//   stock     bare one-liner, no plugin
//   plugin    the same one-liner with the minecraft-design plugin (one shot)
//   iterated  the plugin build, then N feedback rounds: eye card -> blind ObserveBuild + ObserveLook (Haiku) + L0 ->
//             a taste profile's review -> a plugin session revises the build from that feedback
// The builder sees the subject (it must); reviewers stay blind. Every round's .nbt is kept.
//   node benchmarks/plugin-baseline/iterate.mjs --key parisian --subject "a Parisian apartment building" [--rounds 2] [--profile owner]
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { l0, PLUGIN } from "./l0.mjs";
import { features, reviewOf } from "./profile-lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const KEY = opt("--key", "parisian"), SUBJECT = opt("--subject", "a Parisian apartment building");
const ROUNDS = Number(opt("--rounds", "2")), BUDGET = opt("--budget", "3");
const PROFILE = JSON.parse(readFileSync(join(HERE, "profiles", `${opt("--profile", "owner")}.json`), "utf8"));
const ROOT = join(HERE, "runs", opt("--run", "fresh-1"));
const MCD = join(PLUGIN, "tools", "bin", "mcd.mjs");
mkdirSync(ROOT, { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

function session(dir, prompt, plugin, tag) {
  const args = ["-p", "--model", "claude-sonnet-5-5", "--setting-sources", "", "--strict-mcp-config", "--permission-mode", "bypassPermissions",
    "--output-format", "stream-json", "--verbose", "--max-budget-usd", BUDGET, ...(plugin ? ["--plugin-dir", PLUGIN] : []), prompt];
  return new Promise((res) => {
    const p = spawn("claude", args, { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("close", (code) => {
      writeFileSync(join(dir, `session-${tag}.jsonl`), out);
      const r = out.split("\n").filter((l) => l.includes('"type":"result"')).map((l) => JSON.parse(l)).at(-1) || {};
      res({ code, cost: r.total_cost_usd ?? 0, turns: r.num_turns, minutes: +((r.duration_ms ?? 0) / 60000).toFixed(1) });
    });
  });
}
function baml(fn, args, ledger) {
  return new Promise((res) => {
    const p = spawn("baml", ["run", "--project", PLUGIN, "--agent-skill-check", "off", "--output-format", "json", `judge.${fn}`, "--", "--plugin", PLUGIN, ...args],
      { env: { ...process.env, MCD_LEDGER: ledger } });
    let out = ""; p.stdout.on("data", (d) => (out += d));
    p.on("close", () => { try { res(JSON.parse(out.slice(out.indexOf("{")))); } catch { res(null); } });
  });
}
const cost = (ledger) => (existsSync(ledger) ? readFileSync(ledger, "utf8").trim().split("\n").filter(Boolean).reduce((t, l) => t + (JSON.parse(l).cost || 0), 0) : 0);

// blind review of dir/build.nbt: card, observations, look, profile review
async function review(dir, tag) {
  const out = join(dir, `review-${tag}`); mkdirSync(out, { recursive: true });
  spawnSync("node", [MCD, "card", join(dir, "build.nbt"), "--out", join(out, "card.png"), "--front", "n"], { encoding: "utf8" });
  spawnSync("node", [MCD, "card", join(dir, "build.nbt"), "--out", join(out, "card-eye.png"), "--tiles", join(out, "card-tiles"), "--layout", "eye", "--reuse"], { encoding: "utf8" });
  const ledger = join(out, "ledger.jsonl"), common = ["--card", join(out, "card-eye.png"), "--model", "claude-haiku-5-5", "--effort", "low", "--out_dir", out];
  const [o1, o2, look] = await Promise.all([baml("observe", common, ledger), baml("observe", common, ledger), baml("look", common, ledger)]);
  const m = l0(dir), obs = [o1, o2].filter(Boolean), f = features(`${KEY}-${tag}`, m, obs, look);
  const r = { tag, observations: obs, look, l0: m, features: f, review: reviewOf(f, PROFILE), cost: cost(ledger) };
  writeFileSync(join(out, "review.json"), JSON.stringify(r, null, 1));
  return r;
}

// the review in a builder's words
const ADVICE = {
  visibleMaterials: "use a wider range of materials and textures", depth: "add wall relief: pilasters, recessed windows, cornices, frames",
  fenceWallTrapShare: "use fences, walls and trapdoors for railings, shutters and fine detail", props: "add small details a player notices (lanterns, planters, signs, awnings)",
  massing: "compose the massing: more than one box, setbacks, bays, a shaped top", colourInterest: "make the colours and textures livelier",
  harmony: "tighten the palette so the colours relate", formInterest: "give it a more distinctive silhouette", detailFinesse: "shape details with stairs and slabs (eaves, sills, trims)",
  wallGaps: "close holes in the walls that are not windows or doors", stray: "remove or attach blocks that float or jut out", blankWalls: "break up blank walls with openings or relief",
  oddElement: "remove or rework the element that looks out of place", grounded: "make every part rest on a base", readsClearly: "make its purpose obvious from its shape",
  stairShare: "use more stair blocks for detail", slabShare: "use slabs for ledges and fine steps", overhang: "let the roof overhang the walls", shapedRoof: "give it a shaped roof",
  windows: "add windows to the street face", door: "give it a street door", sign: "add a sign or emblem", rooflineVariety: "vary the roofline (dormers, chimneys, steps)",
  paletteFlags: "fix the palette warnings (same-tone trim or roof)", lidRoof: "make the roof read as a roof, not a lid",
  weathering: "add visible age where the style allows it (patina, worn or mixed blocks)", agedShare: "add aged block variants where the style allows (mossy, cracked, weathered)",
  wallRoofContrast: "set the roof apart from the walls in tone", lumStd: "mix light and dark tones", hueFamilies: "use a few distinct colour families",
  satMean: "adjust colour saturation", neutralShare: "balance neutral and coloured materials", footprintFill: "rework the footprint", heightToWidth: "rework the proportions",
  valid: "write a valid structure file", door: "give it a street door",
};
const KEEP = { lumStd: "the light/dark tone mix", wallGaps: "closed walls", hueFamilies: "the colour families", harmony: "the palette", colourInterest: "the lively colours",
  formInterest: "the silhouette", detailFinesse: "the small-block detail", depth: "the wall relief", massing: "the massing", props: "the props", weathering: "the weathering",
  visibleMaterials: "the material range", stray: "clean edges", blankWalls: "the facades", grounded: "the base", readsClearly: "its readable purpose" };
function feedback(r) {
  const o = r.observations[0] || {}, L = r.look || {};
  const lines = [
    `A reviewer who was NOT told what it is would call it: "${o.building_type}". It should read clearly as ${SUBJECT}.`,
    `What they saw: roof ${o.roof_form}${o.roof_overhang ? " with overhang" : ""}${o.roof_lid ? " (reads as a lid)" : ""}; massing ${o.massing}; wall depth ${o.facade_depth}; street windows ${o.street_windows}; props ${o.props}; wall gaps ${o.wall_gaps}.`,
    `Look: colour harmony ${L.colour_harmony}, colour interest ${L.colour_interest}, form interest ${L.form_interest}, detail finesse ${L.detail_finesse}${L.odd_element ? ", something looks out of place" : ""}${L.grounded === false ? ", something isn't grounded" : ""}.`,
    `Measured: ${r.l0.visibleMaterials} visible materials, ${r.l0.blankWalls} blank walls, ${r.l0.stray} stray blocks, ${(r.l0.stairShare * 100).toFixed(0)}% stairs, ${(r.l0.fenceWallTrapShare * 100).toFixed(1)}% fences/walls/trapdoors.`,
    "", "The person you are building for would most want, in order:",
    ...r.review.improve.map((x, i) => `${i + 1}. ${ADVICE[x.feature] || x.feature}${x.inTheirWords ? ` (they said of a build they preferred: "${x.inTheirWords}")` : ""}`),
    "", `Keep what already works: ${r.review.strengths.map((s) => KEEP[s.feature] || s.feature).join(", ")}.`,
    "Use your judgement: skip any item that doesn't suit the style of the building.",
  ];
  return lines.join("\n");
}

const NBT = "Save the result as a Minecraft Java structure file at ./build.nbt. Work autonomously; do not ask questions.";
const dirs = Object.fromEntries(["stock", "plugin", "iterated"].map((a) => [a, join(ROOT, `${KEY}-${a}`)]));
for (const d of Object.values(dirs)) mkdirSync(d, { recursive: true });
const summary = { key: KEY, subject: SUBJECT, profile: PROFILE.name, arms: {} };

log("stock + plugin one-shot");
const [st, pl] = await Promise.all([
  existsSync(join(dirs.stock, "build.nbt")) ? { reused: true } : session(dirs.stock, `Make me a Minecraft .nbt file of ${SUBJECT}. Save it as ./build.nbt. Don't ask questions.`, false, "build"),
  existsSync(join(dirs.plugin, "build.nbt")) ? { reused: true } : session(dirs.plugin, `Use the minecraft-design skill to design and build ${SUBJECT}. ${NBT}`, true, "build"),
]);
summary.arms.stock = { session: st }; summary.arms.plugin = { session: pl };
log("stock", JSON.stringify(st), "plugin", JSON.stringify(pl));

const [rs, rp] = await Promise.all([review(dirs.stock, "final"), review(dirs.plugin, "final")]);
summary.arms.stock.review = rs.review; summary.arms.plugin.review = rp.review;

// iterate from the plugin build
cpSync(dirs.plugin, dirs.iterated, { recursive: true, filter: (s) => !/session-|review-/.test(s) });
const rounds = [];
let prev = rp;
for (let r = 1; r <= ROUNDS; r++) {
  copyFileSync(join(dirs.iterated, "build.nbt"), join(dirs.iterated, `round-${r - 1}.nbt`));
  const fb = feedback(prev);
  writeFileSync(join(dirs.iterated, `feedback-${r}.md`), fb);
  log(`round ${r}: revising`);
  const s = await session(dirs.iterated, [
    `You built ${SUBJECT} in this directory (./build.nbt; the generator script is here too if you wrote one). Use the minecraft-design skill to revise it from this feedback.`,
    "", fb, "",
    `Revise the build to address the feedback, keeping what works. ${NBT} (The previous version is kept as ./round-${r - 1}.nbt.)`,
  ].join("\n"), true, `round-${r}`);
  prev = await review(dirs.iterated, `round-${r}`);
  rounds.push({ round: r, session: s, score: prev.review.score, review: prev.review });
  log(`round ${r}:`, JSON.stringify(s), "profile score", prev.review.score);
}
summary.arms.iterated = { rounds, start: rp.review.score };
summary.cost = { sessions: [st, pl, ...rounds.map((x) => x.session)].reduce((t, s) => t + (s.cost || 0), 0) };
writeFileSync(join(ROOT, `${KEY}-summary.json`), JSON.stringify(summary, null, 1));
log("done", JSON.stringify({ stock: rs.review.score, plugin: rp.review.score, rounds: rounds.map((x) => x.score), cost: summary.cost }));
