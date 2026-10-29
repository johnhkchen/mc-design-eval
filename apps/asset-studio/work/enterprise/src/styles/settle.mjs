// Who founds a town, and in what materials: the land picks the people, the people keep their materials. A town's biome
// tags choose a candidate list (styles/settlement.json); one race (and clan) is drawn by weight from the town's seed.
// A clan's palette is canonical (styles/<race>.json factions); only the yard follows the land (its ground and plants).
//   node src/styles/settle.mjs <in.nbt> <out.nbt> --biome desert [--clan sunscar] [--seed 7]
//     -> the part re-materialled for the clan drawn there (or the one named), by `mcd reskin`, one pass
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const ROOT = `${new URL(".", import.meta.url).pathname}../..`;
const MCD = "/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs";
const json = (f) => JSON.parse(readFileSync(`${ROOT}/${f}`, "utf8"));

/** the settlement entry for a biome, by its id or by the first entry any of its tags match */
export function biomeEntry(biome, S = json("styles/settlement.json")) {
  const tags = [].concat(biome);
  return S.biomes.find((b) => tags.includes(b.id) || b.tags.some((t) => tags.includes(t))) || { id: "fallback", ...S.fallback };
}

/** one candidate drawn by weight from the seed (only approved styles found towns unless drafts are allowed) */
export function settle(biome, seed = 0, { drafts = false } = {}) {
  const e = biomeEntry(biome);
  const ok = e.candidates.filter((c) => drafts || json(`styles/${c.style}.json`).status === "approved");
  const list = ok.length ? ok : json("styles/settlement.json").fallback.candidates;
  const total = list.reduce((s, c) => s + c.weight, 0);
  let r = ((Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0) % 1000) / 1000 * total;
  for (const c of list) if ((r -= c.weight) < 0) return { biome: e.id, ...c };
  return { biome: e.id, ...list.at(-1) };
}

/** the swaps for a part of `style` built by `clan` on `biome`: the clan's palette, then the yard to the land */
export function swapsFor(style, clan, biome) {
  const S = json("styles/settlement.json"), st = json(`styles/${style}.json`), e = biomeEntry(biome, S);
  const c = st.factions?.clans[clan || st.factions.default], pal = c ? c.swaps || c.palette : [];      // the expanded block ids when generated
  const yard = [e.ground !== S.yard.surface && `${S.yard.surface}=${e.ground}`, e.plant !== S.yard.plant && `${S.yard.plant}=${e.plant}`].filter(Boolean);
  return [...pal, ...yard];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2), opt = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
  const [inp, out] = argv.filter((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));
  const biome = opt("--biome") || "badlands", who = opt("--clan") ? { style: "orc", clan: opt("--clan") } : settle(biome, +(opt("--seed") || 0), { drafts: true });
  const swaps = swapsFor(who.style, who.clan, biome);
  console.log(`${biome}: ${who.style}${who.clan ? `/${who.clan}` : ""}  ${swaps.join(",")}`);
  execFileSync("node", [MCD, "reskin", inp, out, "--swap", swaps.join(","), "--version", "1.21.1"], { stdio: "inherit" });
}
