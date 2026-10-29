// The harbour district set per kingdom: the waterside parts and boats (checked as parts), the buildings in their
// palettes or shell (gated in full), and the set file with the district's placement rules.
//   node src/harbour/build-harbour.mjs [--kingdom lordaeron|dalaran|stormwind]
import fs from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { harbourParts, harbourBuildings } from "./harbour.mjs";
import { paletteMap } from "../lordaeron/assemble.mjs";
import { Grid } from "../grid.mjs";
import { check } from "../../../../tools/check-asset.mjs";
// --kingdom lordaeron | dalaran | stormwind
const ki = process.argv.indexOf("--kingdom"), K = ki > 0 ? process.argv[ki + 1] : "lordaeron";
const DATA = `bundle/core/src/main/resources/data/enterprise`, H = `${DATA}/structure/${K}/harbour`, PREV = `bundle/assets-src/${K}/harbour`;
const lord = JSON.parse(fs.readFileSync("bundle/assets-src/kingdoms/lordaeron/palettes.json", "utf8"));
const kp = K === "stormwind" ? JSON.parse(fs.readFileSync(`bundle/assets-src/kingdoms/${K}/palettes.json`, "utf8")) : null;
const palettes = kp ? { base: lord.base, palettes: { [lord.base]: lord.palettes[lord.base], ...Object.fromEntries(Object.entries(kp.palettes).map(([k, v]) => [`k:${k}`, v])) } } : lord;
const palOf = (n) => (kp ? `k:${kp.aliases[n] || n}` : n), palName = (n) => (kp ? kp.aliases[n] || n : n);
// a part's rev goes up only when its blocks change (the last delivery's files are read before they're replaced)
const oldRev = {};
if (fs.existsSync(H)) for (const f of fs.readdirSync(H)) if (f.endsWith(".nbt")) { const j = JSON.parse(fs.readFileSync(join(H, f.replace(".nbt", ".json")), "utf8")); oldRev[f.replace(".nbt", "")] = { rev: j.rev || 1, bytes: fs.readFileSync(join(H, f)) }; }
const revOf = (id, f) => { const o = oldRev[id]; if (!o) return 1; return Buffer.compare(o.bytes, fs.readFileSync(f)) === 0 ? o.rev : o.rev + 1; };
fs.rmSync(H, { recursive: true, force: true }); fs.mkdirSync(H, { recursive: true }); fs.rmSync(PREV, { recursive: true, force: true }); fs.mkdirSync(PREV, { recursive: true });
const write = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + "\n");
const report = [], parts = harbourParts(K), buildings = harbourBuildings(K);
for (const t of parts) {
  const f = join(H, `${t.id}.nbt`); t.grid.save(f);
  const meta = { id: `enterprise:${K}/harbour/${t.id}`, rev: revOf(t.id, f), kingdom: K, kind: "part", slot: `prop:${t.meta.contract === "boat" ? "boat" : "harbour"}`, palette: "fixed", size: t.grid.size, mirror: true, ground: t.meta.water_line, relief_faces: [], ...t.meta };
  write(f.replace(".nbt", ".json"), meta);
  const c = check(f, meta); report.push([t.id, c.ok, c.errors]);
}
// buildings: the module set's authoring palette mapped to the building's (Dalaran's halls carry their own materials)
const trim = (g) => { let top = g.size[1] - 1; const filled = new Set([...g.each()].filter(([, , , s]) => s !== "air").map(([, y]) => y)); while (top > 0 && !filled.has(top)) top--; const o = new Grid([g.size[0], top + 2, g.size[2]]); for (const [x, y, z, s] of g.each()) if (y <= top + 1) o.set(x, y, z, s); return o; };
const names = [];
for (const b of buildings) {
  const pal = b.pal, map = pal ? paletteMap(palettes, palOf(pal)) : (s) => s;
  let g = new Grid(b.grid.size); for (const [x, y, z, s] of b.grid.each()) g.set(x, y, z, map(s));
  g = trim(g);
  const f = join(H, `${b.id}.nbt`); g.save(f); names.push(f);
  const dal = K === "dalaran" && b.layout, E = 2;                   // Dalaran's eaves overhang the ground part by 2
  write(f.replace(".nbt", ".json"), { id: `enterprise:${K}/harbour/${b.id}`, rev: revOf(b.id, f), kingdom: K, kind: "hall", ...b.meta, palette: pal ? palName(pal) : "fixed",
    footprint: dal ? { at: [E, E], size: [g.size[0] - 2 * E - (b.id.startsWith("warehouse") ? 2 : 0), g.size[2] - 2 * E] } : [g.size[0], g.size[2]], ...(dal ? { overhang: E, size: g.size } : {}), height: g.size[1], ground: 2, mirror: true, beds: [], workstations: [], lockers: [], markers: [], entities: [],
    ...(b.layout ? { assembly: { set: K === "dalaran" ? "dalaran/platform_hall" : "lordaeron/timber_relief", layout: b.layout } } : { relief_faces: [] }) });
  execFileSync("node", ["../../tools/preview.mjs", f, `${PREV}/${b.id}.jpg`], { stdio: "ignore" });
}
write(`${DATA}/town_kits/${K}/harbour.json`, {
  set: `${K}/harbour`, rev: K === "lordaeron" ? 2 : 1,
  about: "The harbour district: what a town on the sea or on a river builds at its water. Waterside parts on the dock contract (layer water_line at the water's surface; the deck at layer `deck`; each declared piling run down from the water line to the bed); boats on the boat contract (water_line at the surface, solid hull below it, nothing floods); buildings on the relief module set (ground 2, front south, facing the quay). No point-of-interest blocks (decorative twins only), no beds; every walkable cell lit. `use` says whether a part is for the sea, a river, or both.",
  district: {
    when: "A town whose plan meets water: `sea` where the water body is open (it reaches the plan's outer edge, or holds 2,000 columns or more); `river` where it's narrower (a river, a lake's inlet). Some towns have both.",
    quay_street: "Along the shore, inside the outer wall, the plan lays a quay street: a street on the water's edge, its water side a run of quay tiles (stone at sea; stone or timber on a river), its land side the district's plots facing the water. The quay street joins the avenue nearest the water at the quay's head.",
    sea: [
      "the customs house at the quay's head, facing the water, beside the avenue that meets it: the first build of the district (the town's port opens with it)",
      "warehouses along the quay's land side, one every other plot, loading bays to the quay; a crane tile on the quay in front of each",
      "the fish market at the quay's far end, near the fishing boats",
      "a jetty (timber segments ending in a head) every 24 along the quay, out to the deep water; at sea, the mole: segments out from the shore to shelter the harbour's mouth, its head the lighthouse",
      "boats moored: a cog alongside the quay by the customs house or a warehouse, fishing boats at the jetties",
      "quay tiles: a bollard every 3rd, a lamp every 5th, a ladder every 8th, steps down to the water by each jetty"
    ],
    river: [
      "a wharf: a run of timber quay (with a crane tile) on the river's edge where the avenue or the main street meets it, 8 to 16 long",
      "the river warehouse behind it, loading bays to the wharf",
      "the river customs booth at the wharf's upstream end, or at the head of the town's bridge (the toll on the river), its counter to the water",
      "a jetty with a head for the fishing boats, a barge moored alongside the wharf",
      "the fish market where the town has no sea, by the wharf"
    ],
    growth: "hamlet: a jetty and a fishing boat (river or sea). village: the wharf (river) or the quay's first run and the customs house (sea), a warehouse, the fish market. town: the full quay, warehouses, the mole and lighthouse (sea), cogs and barges.",
    plots: "Sizes are in each part's metadata (Dalaran's halls are 2 wider each side for their eaves, the customs house 13 x 7 under one hipped roof). All fit a 16-wide plot except the customs house, which takes a forum-front plot at the quay's head; a warehouse's hoist reaches 2 past its east wall."
  },
  parts: parts.map((t) => ({ id: t.id, part: `enterprise:${K}/harbour/${t.id}`, size: t.grid.size, ...t.meta, pilings: undefined })),
  buildings: buildings.map((b) => ({ id: b.id, part: `enterprise:${K}/harbour/${b.id}`, palette: b.pal ? palName(b.pal) : "fixed", ...b.meta })),
});
for (const [id, ok, e] of report) if (!ok) console.log("FAIL", id, e.join(" | "));
console.log(`${parts.length} parts ${report.filter((r) => r[1]).length}/${report.length} pass; ${buildings.length} buildings`);
try { execFileSync("node", ["../../tools/gate.mjs", ...names], { stdio: "inherit" }); } catch { process.exitCode = 1; }
