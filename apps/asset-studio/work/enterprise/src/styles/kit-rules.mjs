// Town rules for a kit race (a race whose buildings are whole delivered parts, not solved houses): which part fills
// which slot at each tier, the forum, the walls and the zoning, written from the race's delivered kit file so every id
// named is one we shipped. Lordaeron's rules (town_rules/lordaeron.json) are the model; its tiers and street bands are
// shared. Choice is deterministic as there: hash(town id, slot) picks among weighted options.
//   node src/styles/kit-rules.mjs <race> [kit]        e.g.  dwarf   |   dalaran spires
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const DATA = "bundle/core/src/main/resources/data/enterprise";
const [race, kitName = "core"] = process.argv.slice(2);
const kit = JSON.parse(readFileSync(`${DATA}/town_kits/${race}/${kitName}.json`, "utf8"));
const style = JSON.parse(readFileSync(`styles/${race}.json`, "utf8"));
const lor = JSON.parse(readFileSync(`${DATA}/town_rules/lordaeron.json`, "utf8"));
// the revision steps from the last committed file (re-running before a commit keeps the same rev)
const prev = (() => { try { return JSON.parse(execFileSync("git", ["show", `HEAD:./${DATA}/town_rules/${race}.json`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })); } catch { return null; } })();
const parts = kit.parts, by = (f) => parts.filter(f), id = (p) => p.part;
const homes = by((p) => p.kind === "home").sort((a, b) => a.size[0] * a.size[2] - b.size[0] * b.size[2]);
const [small, big] = [homes[0], homes.at(-1)];
const smith = by((p) => p.kind === "workshop")[0], stall = by((p) => p.kind === "stall")[0], forum = by((p) => p.kind === "forum")[0];
const hall = (re) => parts.find((p) => p.kind === "hall" && re.test(p.id));
const tavern = hall(/tavern|inn|lodge|hall_/), temple = hall(/temple|sanctum|lodge_spirit|shrine/) || parts.find((p) => p.kind === "hall" && p !== tavern);
const tower = parts.find((p) => p.kind === "wall" && /watchtower/.test(p.id)), curtain = parts.find((p) => p.slot === "wall:curtain"), gate = parts.find((p) => p.kind === "wall" && /gate/.test(p.id));
// a part's own metadata (structure/<path>.json) is the authority on its tiles
const metaOf = (p) => JSON.parse(readFileSync(`${DATA}/structure/${p.part.replace(/^enterprise:/, "")}.json`, "utf8"));
const size = (p) => { const m = metaOf(p); return m.tiles ? { tiles: m.tiles, footprint: m.footprint } : { footprint: m.footprint }; };
const opt = (p, weight) => ({ asset: id(p), ...size(p), beds: p.beds, weight });
const rules = {
  kingdom: race,
  rev: (prev?.rev || 0) + 1,
  about: `${style.name}: town rules for a kit race. Every building is a whole delivered part from town_kits/${race}/${kitName}.json (named here by id), placed on its plot as it is; the house solver is not used. A town's clan (from styles/settlement.json, by the land) recolours every part at placement with that clan's swaps in styles/${race}.json${style.factions ? "" : " (this race has no clans: no swaps)"}. The tiers and the street bands are Lordaeron's. Choice is deterministic: hash(town id, slot) picks among weighted options.`,
  set: `${race}/${kitName}`,
  tiers: lor.tiers,
  homes: {
    hamlet: [opt(small, 1)],
    village: [opt(small, 3), opt(big, 1)],
    town: [opt(small, 1), opt(big, 2)],
    city: [opt(small, 1), opt(big, 3)],
  },
  workshops: smith ? { from: "village", slot: smith.slot || "workshop:armorer", asset: id(smith), ...size(smith),
    trades: "the smiths (armorer, toolsmith, weaponsmith) take this workshop; every other trade works from a stall (stall:any, the trade's job block set at its marker) until its own workshop is delivered",
    on: "plots fronting an avenue or the forum, nearest the forum first" } : null,
  halls: Object.fromEntries([["tavern", tavern], ["temple", temple], ["watchtower", tower]].filter(([, p]) => p).map(([k, p]) => [k, { asset: id(p), ...size(p), from: k === "watchtower" ? "town" : "village" }])),
  forum: {
    hamlet: { centre: null, ring: [{ asset: id(stall), for: "each trade's stall: one part serves every trade (its marker takes the trade's job block)" }] },
    village: { centre: id(forum), ring: [{ stalls: "the trades' stalls, facing the bell" }] },
    town: { centre: id(forum), facing: `the ${tavern ? "tavern" : "hall"} on the forum's north side`, ring: [{ stalls: "facing the bell" }] },
  },
  walls: {
    hamlet: "marked out only", village: "marked out only",
    town: { curtain: curtain && id(curtain), gatehouse: gate && id(gate), tower: tower && id(tower), tiling: "curtain pieces end to end (each 8 long, ends cut to join), a gatehouse where an avenue leaves, a watchtower at each corner" },
    city: "as town",
  },
  yards: "no yard tiles yet for this race: the ring round each part is its yard, authored as the yard marker (red_sand, dead_bush) that the placer swaps for the land's ground and plant",
  growth: lor.growth,
  zoning: {
    ...lor.zoning,
    about: `${lor.zoning.about} For a kit race each rule names a part instead of a body; plots are whole tiles (thread 0016), as many as the part needs.`,
    rules: [
      { street: "forum_front", use: "the forum frontage: the tavern first, then the temple, then homes", part: tavern ? id(tavern) : id(big) },
      { street: "avenue", band: ["core", "inner"], part: { [id(big)]: 2, [id(small)]: 1 }, workshop: "the smith's workshop on the first avenue plot nearest the forum" },
      { street: "avenue", band: "outer", part: { [id(big)]: 1, [id(small)]: 2 } },
      { street: "lane", part: { [id(small)]: 2, [id(big)]: 1 } },
      { street: "ward_back", part: id(small) },
      { band: "fringe", use: "fields and pastures; no town houses" },
    ],
    rhythm: { mirror: "mirror a part (each is authored mirror: true) on alternate plots along a street, by the plot's hash" },
    placeholder: lor.zoning.placeholder,
  },
};
for (const k of Object.keys(rules)) if (rules[k] == null) delete rules[k];
if (prev?.keep) rules.keep = prev.keep;
writeFileSync(`${DATA}/town_rules/${race}.json`, JSON.stringify(rules, null, 2) + "\n");
console.log(`town_rules/${race}.json rev ${rules.rev}: homes ${small.id} / ${big.id}, workshop ${smith?.id}, halls ${Object.keys(rules.halls).join(" ")}`);
