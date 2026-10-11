// Fresh-subject test of the SHIPPED workflow: stock one-liner vs the plugin's own `mcd-agent build`.
// Per subject, in parallel: stock (`claude -p`, no plugin) and build (the plugin's one-shot build). Then eye cards for a
// blind labelling set. (fresh-2 ran the since-removed taste rounds: minecraft-design d38a1b3, `collect --rounds 2`.)
//   node benchmarks/plugin-baseline/fresh.mjs --run fresh-2 --subjects "art-deco=an Art Deco cinema;beach=a modern minimalist beach house"
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PLUGIN } from "./l0.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const ROOT = join(HERE, "runs", opt("--run", "fresh-2"));
const SUBJECTS = opt("--subjects", "").split(";").filter(Boolean).map((s) => { const [key, subject] = s.split("="); return { key, subject }; });
const MCD = join(PLUGIN, "tools", "bin", "mcd.mjs"), AGENT = join(PLUGIN, "tools", "bin", "mcd-agent.mjs");
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

function run(cmd, args, cwd, out) {
  return new Promise((res) => {
    const t0 = Date.now(), p = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let o = "", e = "";
    p.stdout.on("data", (d) => (o += d)); p.stderr.on("data", (d) => (e += d));
    p.on("close", (code) => { writeFileSync(out, o + (e ? `\n--- stderr ---\n${e}` : "")); res({ code, o, minutes: +((Date.now() - t0) / 60000).toFixed(1) }); });
  });
}

async function stock({ key, subject }) {
  const dir = join(ROOT, `${key}-stock`); mkdirSync(dir, { recursive: true });
  if (existsSync(join(dir, "build.nbt"))) return { reused: true };
  const r = await run("claude", ["-p", "--model", "claude-sonnet-5-5", "--setting-sources", "", "--strict-mcp-config", "--permission-mode", "bypassPermissions",
    "--output-format", "stream-json", "--verbose", "--max-budget-usd", "4", `Make me a Minecraft .nbt file of ${subject}. Save it as ./build.nbt. Don't ask questions.`], dir, join(dir, "session.jsonl"));
  const res = r.o.split("\n").filter((l) => l.includes('"type":"result"')).map((l) => JSON.parse(l)).at(-1) || {};
  return { code: r.code, cost: res.total_cost_usd ?? 0, minutes: r.minutes };
}

async function build({ key, subject }) {
  const dir = join(ROOT, `${key}-build`); mkdirSync(dir, { recursive: true });
  if (existsSync(join(dir, "summary.json"))) return JSON.parse(readFileSync(join(dir, "summary.json"), "utf8"));
  writeFileSync(join(dir, "brief.txt"), `BUILD: ${subject}.\n`);
  const r = await run("node", [AGENT, "build", "--dir", dir, "--name", key, "--brief-file", join(dir, "brief.txt")], dir, join(dir, "build.log"));
  return existsSync(join(dir, "summary.json")) ? JSON.parse(readFileSync(join(dir, "summary.json"), "utf8")) : { failed: r.code, minutes: r.minutes };
}

mkdirSync(ROOT, { recursive: true });
const results = {};
await Promise.all(SUBJECTS.map(async (s) => {
  log(s.key, "start");
  const [st, co] = await Promise.all([stock(s), build(s)]);
  // eye cards for every arm/version (the labelling page uses these)
  spawnSync("node", [MCD, "card", join(ROOT, `${s.key}-stock`, "build.nbt"), "--out", join(ROOT, `${s.key}-stock`, "card-eye.png"), "--tiles", join(ROOT, `${s.key}-stock`, "card-tiles"), "--layout", "eye", "--front", "n"]);
  results[s.key] = { subject: s.subject, stock: st, build: co.failed ? co : { kept: co.kept, cost: co.cost_usd, seconds: co.seconds } };
  log(s.key, JSON.stringify(results[s.key]));
}));
writeFileSync(join(ROOT, "summary.json"), JSON.stringify(results, null, 1));
log("done");
