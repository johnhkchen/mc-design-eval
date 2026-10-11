// Layered judging: L0 = free metrics from the .nbt; L1 = blind factual observations (ObserveBuild, short enums, no
// verdict) on the eye card; L2 = deterministic scoring schemes, one per goal. Pairs are compared by code, so there is
// no pairwise call and no position bias. Haiku observes every build twice (test-retest); Sonnet spot-checks a few.
// One call goes first to write the prompt cache, then the rest fan out.
//   node benchmarks/plugin-baseline/layered.mjs [--run baseline-1] [--arms stock,plugin] [--sonnet a,b]
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SUBJECTS as ALL } from "../collection/subjects.mjs";
const JUDGES = new URL("../judges", import.meta.url).pathname; // the lab's judging instruments (BAML)

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = "/Volumes/ext1/swe/repos/minecraft-design";
const MCD = join(PLUGIN, "tools", "bin", "mcd.mjs");
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const RUN = join(HERE, "runs", opt("--run", "baseline-1"));
const ARMS = opt("--arms", "stock,plugin").split(",");
const SONNET_ON = opt("--sonnet", "").split(",").filter(Boolean);   // spot-checks cost ~$0.05 each: opt in
const V2 = argv.includes("--v2");   // pre-registered schemes.mjs + a pairs file + its own labels file
const OUT = join(RUN, V2 ? "layered-v2" : "layered");
const PAIRS = V2 ? JSON.parse(readFileSync(join(RUN, opt("--pairs", "pairs-2.json")), "utf8")).pairs : null;
const LABELS2 = V2 && existsSync(join(RUN, opt("--labels", "labels-2.json"))) ? JSON.parse(readFileSync(join(RUN, opt("--labels", "labels-2.json")), "utf8")).picks : null;
mkdirSync(OUT, { recursive: true });
const SUBJ = Object.keys(ALL);
const LABELS = existsSync(join(RUN, "labels.json")) ? JSON.parse(readFileSync(join(RUN, "labels.json"), "utf8")).pairs : {};

// ---- L0: free, from the file
const { load } = await import(join(PLUGIN, "tools", "src", "structure.mjs"));
const { faceMaps } = await import(join(PLUGIN, "tools", "src", "detail.mjs"));
const { plainMaps } = await import(join(PLUGIN, "tools", "src", "treatments.mjs"));
const AGED = /(mossy|cracked|weathered|exposed|oxidized|chipped|damaged|cobweb|vine)/;
const DETAIL = /(stairs|slab|fence|wall$|_wall|trapdoor|lantern|torch|pane|bars|door|sign|banner|button|chain|candle|pot|carpet|leaves|flower|vine|campfire|anvil|barrel|bell|grindstone|lectern|rod|scaffolding|head|skull|azalea|bamboo|hay|ladder)/;
function l0(dir) {
  const nbt = existsSync(join(dir, "build.fixed.nbt")) ? join(dir, "build.fixed.nbt") : join(dir, "build.nbt");
  const g = load(nbt), blocks = [...g.cells.values()].map((c) => c.block.replace("minecraft:", "")).filter((b) => b !== "air");
  const kinds = new Set(blocks);
  const chk = JSON.parse(spawnSync("node", [MCD, "check", nbt, "--json"], { encoding: "utf8" }).stdout);
  const pal = JSON.parse(spawnSync("node", [MCD, "palette", nbt, "--json"], { encoding: "utf8" }).stdout);
  const flat = Math.max(0, ...(chk.flatFields?.exterior || []).map((f) => f.area));
  // what a player sees: blocks on the four faces and the roof, from outside
  const maps = faceMaps(g), plain = plainMaps(g, maps), seen = [];
  let blankWalls = 0;
  for (const f of ["north", "south", "east", "west"]) {
    let n = 0, p = 0;
    maps[f].blocks.forEach((row, v) => row.forEach((b, u) => { if (b && b !== "minecraft:air" && b !== "air") { n++; if (plain[f][v][u]) p++; } }));
    if (n && p / n >= 0.5) blankWalls++;
  }
  for (const f of ["north", "south", "east", "west", "roof"]) for (const row of maps[f].blocks) for (const b of row) if (b && !/air$/.test(b)) seen.push(b.replace("minecraft:", ""));
  const share = {}; for (const b of seen) share[b] = (share[b] || 0) + 1 / seen.length;
  const visibleMaterials = Object.values(share).filter((x) => x >= 0.03).length;
  const agedShare = +seen.filter((b) => AGED.test(b)).length / Math.max(1, seen.length);
  return { blocks: blocks.length, kinds: kinds.size, detailShare: +(blocks.filter((b) => DETAIL.test(b)).length / Math.max(1, blocks.length)).toFixed(3),
    floating: chk.structure?.floatingCells ?? 0, stray: (chk.structure?.orphans?.length ?? 0) + (chk.structure?.floatingCells ?? 0), largestFlat: flat,
    paletteFlags: (pal.flags || []).length, blankWalls, visibleMaterials, agedShare: +agedShare.toFixed(3),
    valid: !existsSync(join(dir, "format-defect.json")) };
}

// ---- L1: observations
function observe(name, card, model, effort) {
  const file = join(OUT, `${name}.json`);
  if (existsSync(file)) return Promise.resolve(JSON.parse(readFileSync(file, "utf8")));
  const ledger = join(OUT, `${name}.ledger.jsonl`);
  return new Promise((res) => {
    const p = spawn("baml", ["run", "--project", JUDGES, "--agent-skill-check", "off", "--output-format", "json", "judge.observe", "--",
      "--plugin", PLUGIN, "--card", card, "--model", model, "--effort", effort, "--out_dir", OUT], { env: { ...process.env, MCD_LEDGER: ledger } });
    let out = "", err = "";
    p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (err += d));
    p.on("close", () => {
      let v = null; try { v = JSON.parse(out.slice(out.indexOf("{"))); } catch {}
      const rows = existsSync(ledger) ? readFileSync(ledger, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
      const r = { name, obs: v, cost: rows.reduce((s, x) => s + (x.cost || 0), 0), cacheRead: rows.reduce((s, x) => s + (x.cacheRead || 0), 0), out: rows.reduce((s, x) => s + (x.out || 0), 0),
        error: v ? undefined : err.split("\n").filter((l) => l && !l.startsWith("warning")).slice(-2).join(" | ") };
      if (v) writeFileSync(file, JSON.stringify(r, null, 1));
      res(r);
    });
  });
}

// ---- L2: deterministic schemes (each a goal; weights are explicit and auditable)
const amt = { None: 0, Few: 1, Many: 2 };
const SCHEMES = {
  // would a player place it without it looking broken or unfinished?
  placeable: (o, m) => -1.5 * amt[o.wall_gaps] - 1 * amt[o.stray_blocks] - 2 * o.roof_lid - 1 * Math.min(4, o.blank_walls) - 2 * !o.street_door
    - (m.floating > 0 ? 2 : 0) - (m.valid ? 0 : 5),
  // how much craft shows: shape, relief, roof, openings, detail, texture
  crafted: (o, m) => ({ Box: 0, Some: 1, Varied: 2 })[o.massing] + ({ Flat: 0, Some: 1, Deep: 2 })[o.facade_depth] + 1 * o.roof_overhang
    + (["None", "Flat"].includes(o.roof_form) ? 0 : 1) + ({ None: 0, OneToThree: 0.5, FourToEight: 1, NineOrMore: 1 })[o.street_windows]
    + amt[o.props] + (o.weathering === "None" ? 0 : 1) + 0.5 * o.sign + (o.materials >= 3 && o.materials <= 7 ? 1 : 0)
    + (m.detailShare >= 0.3 ? 2 : m.detailShare >= 0.15 ? 1 : 0),
};
if (V2) { for (const k of Object.keys(SCHEMES)) delete SCHEMES[k]; Object.assign(SCHEMES, (await import("./schemes.mjs")).SCHEMES); }
else SCHEMES.collection = (o, m) => SCHEMES.placeable(o, m) + SCHEMES.crafted(o, m);
// weathered/ruined styles are intended: gaps and jutting blocks cost little when the build is visibly weathered
// (written after seeing the steampunk result, at the owner's word that the weathering is deliberate: validate on new labels)
if (!V2) SCHEMES.characterful = (o, m) => {
  const aged = o.weathering !== "None", soft = aged ? 0.25 : 1;
  return SCHEMES.crafted(o, m) - soft * (1.5 * amt[o.wall_gaps] + amt[o.stray_blocks]) - 2 * o.roof_lid - 0.5 * Math.min(4, o.blank_walls)
    - 2 * !o.street_door - (m.floating > 0 ? 2 : 0) - (m.valid ? 0 : 5) + (aged ? amt[o.weathering] : 0);
};

// ---- run
const builds = V2
  ? [...new Set(PAIRS.flatMap((p) => [`${p.subject}|${p.A}`, `${p.subject}|${p.B}`]))].map((k) => { const [s, a] = k.split("|"); return { s, a, dir: join(RUN, `${s}-${a}`) }; })
  : SUBJ.flatMap((s) => ARMS.map((a) => ({ s, a, dir: join(RUN, `${s}-${a}`) })));
const card = (b) => join(b.dir, "judge", "card-eye.png");
const H = ["claude-haiku-5-5", "low"], S = ["claude-sonnet-5-5", "medium"];
const first = await observe(`${builds[0].s}-${builds[0].a}-haiku-1`, card(builds[0]), ...H);   // writes the cache
const jobs = builds.flatMap((b) => [1, 2].map((i) => ({ b, name: `${b.s}-${b.a}-haiku-${i}`, m: H })))
  .concat(builds.filter((b) => SONNET_ON.includes(b.s)).map((b) => ({ b, name: `${b.s}-${b.a}-sonnet`, m: S })));
const sFirst = jobs.find((j) => j.m === S);
if (sFirst) await observe(sFirst.name, card(sFirst.b), ...S);
const res = Object.fromEntries((await Promise.all(jobs.map((j) => observe(j.name, card(j.b), ...j.m)))).map((r) => [r.name, r]));
res[first.name] ||= first;

// reliability: per field, how often the two Haiku passes agree, and Haiku pass 1 vs Sonnet
const fields = Object.keys(res[`${builds[0].s}-${builds[0].a}-haiku-1`].obs || {}).filter((f) => f !== "building_type");
const agree = (x, y) => fields.map((f) => [f, x.filter((_, i) => x[i] && y[i]).filter((_, i) => true) && x.reduce((n, o, i) => n + (o && y[i] && JSON.stringify(o[f]) === JSON.stringify(y[i][f]) ? 1 : 0), 0) / x.filter((o, i) => o && y[i]).length]);
const h1 = builds.map((b) => res[`${b.s}-${b.a}-haiku-1`]?.obs), h2 = builds.map((b) => res[`${b.s}-${b.a}-haiku-2`]?.obs);
const sb = builds.filter((b) => res[`${b.s}-${b.a}-sonnet`]);
const retest = Object.fromEntries(agree(h1, h2)), vsSonnet = Object.fromEntries(agree(sb.map((b) => res[`${b.s}-${b.a}-haiku-1`]?.obs), sb.map((b) => res[`${b.s}-${b.a}-sonnet`]?.obs)));

// scores: mean of the two Haiku passes per scheme
const score = {};
for (const b of builds) {
  const m = l0(b.dir), obs = [1, 2].map((i) => res[`${b.s}-${b.a}-haiku-${i}`]?.obs).filter(Boolean);
  score[`${b.s}-${b.a}`] = { l0: m, type: obs.map((o) => o.building_type), ...Object.fromEntries(Object.entries(SCHEMES).map(([k, f]) => [k, +(obs.reduce((t, o) => t + f(o, m), 0) / obs.length).toFixed(2)])) };
}
if (V2) {
  const cost2 = Object.values(res).reduce((t, r) => t + (r.cost || 0), 0);
  const rows = PAIRS.map((p) => {
    const a = score[`${p.subject}-${p.A}`], b = score[`${p.subject}-${p.B}`];
    const picks = Object.fromEntries(Object.keys(SCHEMES).map((k) => { const d = b[k] - a[k]; return [k, Math.abs(d) < 0.5 ? "tie" : d > 0 ? "B" : "A"]; }));
    return { ...p, owner: LABELS2?.[p.id] ?? null, picks, scores: Object.fromEntries(Object.keys(SCHEMES).map((k) => [k, [a[k], b[k]]])) };
  });
  writeFileSync(join(OUT, "scores.json"), JSON.stringify({ version: (await import("./schemes.mjs")).VERSION, score, retest, rows }, null, 1));
  if (!LABELS2) { console.log(`observations done for ${builds.length} builds; $${cost2.toFixed(3)}; scores sealed in layered-v2/scores.json until labels-2.json exists`); process.exit(0); }
  const L2 = [`| pair | subject | A / B | owner | ${Object.keys(SCHEMES).join(" | ")} |`, `|---|---|---|---|${Object.keys(SCHEMES).map(() => "---").join("|")}|`];
  const hit = Object.fromEntries(Object.keys(SCHEMES).map((k) => [k, 0]));
  for (const r of rows) L2.push(`| ${r.id} | ${r.subject} | ${r.A} / ${r.B} | ${r.owner} | ${Object.keys(SCHEMES).map((k) => { if (r.picks[k] === r.owner) hit[k]++; return `${r.scores[k][0]} / ${r.scores[k][1]} → ${r.picks[k]}${r.picks[k] === r.owner ? " ✓" : ""}`; }).join(" | ")} |`);
  const n = rows.filter((r) => r.owner && r.owner !== "tie").length;
  L2.push("", `Agreement with the owner (pre-registered ${(await import("./schemes.mjs")).VERSION}): ${Object.entries(hit).map(([k, v]) => `${k} ${v}/${rows.length}`).join(", ")}.`, `Observation cost: $${cost2.toFixed(3)}.`);
  writeFileSync(join(OUT, "results.md"), L2.join("\n") + "\n"); console.log(L2.join("\n")); process.exit(0);
}
const [A, B] = ARMS;
const L = [`| subject | owner | ${Object.keys(SCHEMES).map((k) => `${k} ${A}/${B} → pick`).join(" | ")} |`, `|---|---|${Object.keys(SCHEMES).map(() => "---").join("|")}|`];
const hits = Object.fromEntries(Object.keys(SCHEMES).map((k) => [k, 0]));
for (const s of SUBJ) {
  const a = score[`${s}-${A}`], b = score[`${s}-${B}`];
  L.push(`| ${s} | ${LABELS[s] ?? "-"} | ${Object.keys(SCHEMES).map((k) => { const d = b[k] - a[k], pick = Math.abs(d) < 0.5 ? "tie" : d > 0 ? B : A; if (pick === LABELS[s]) hits[k]++; return `${a[k]} / ${b[k]} → ${pick}`; }).join(" | ")} |`);
}
const cost = Object.values(res).reduce((t, r) => t + (r.cost || 0), 0);
L.push("", `Agreement with the owner: ${Object.entries(hits).map(([k, n]) => `${k} ${n}/${SUBJ.filter((s) => LABELS[s]).length}`).join(", ")}.`,
  "", "| field | Haiku test-retest | Haiku vs Sonnet |", "|---|---|---|", ...fields.map((f) => `| ${f} | ${(retest[f] * 100).toFixed(0)}% | ${isNaN(vsSonnet[f]) ? "-" : (vsSonnet[f] * 100).toFixed(0) + "%"} |`),
  "", `Calls: ${Object.keys(res).length}; cost $${cost.toFixed(3)}; mean output tokens ${(Object.values(res).reduce((t, r) => t + (r.out || 0), 0) / Object.keys(res).length).toFixed(0)}; cache-read tokens ${Object.values(res).reduce((t, r) => t + (r.cacheRead || 0), 0)}.`);
writeFileSync(join(OUT, "scores.json"), JSON.stringify({ score, retest, vsSonnet }, null, 1));
writeFileSync(join(OUT, "results.md"), L.join("\n") + "\n");
console.log(L.join("\n"));
for (const r of Object.values(res)) if (r.error) console.log("ERR", r.name, r.error);
