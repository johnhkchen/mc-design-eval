// The harbour district set (Lordaeron): the waterside parts and boats (checked as parts), the buildings in their
// palettes (gated in full), the set file with the district's placement rules, and two demo scenes for the preview: a
// sea harbour and a river wharf.
import fs from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { harbourParts, harbourBuildings } from "./harbour.mjs";
import { paletteMap } from "../lordaeron/assemble.mjs";
import { Grid } from "../grid.mjs";
import { check } from "../../../../tools/check-asset.mjs";
const K = "lordaeron", DATA = `bundle/core/src/main/resources/data/enterprise`, H = `${DATA}/structure/${K}/harbour`, PREV = `bundle/assets-src/${K}/harbour`;
const palettes = JSON.parse(fs.readFileSync(`bundle/assets-src/kingdoms/${K}/palettes.json`, "utf8"));
fs.rmSync(H, { recursive: true, force: true }); fs.mkdirSync(H, { recursive: true }); fs.mkdirSync(PREV, { recursive: true });
const write = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + "\n");
const report = [], parts = harbourParts(), buildings = harbourBuildings();
for (const t of parts) {
  const f = join(H, `${t.id}.nbt`); t.grid.save(f);
  const meta = { id: `enterprise:${K}/harbour/${t.id}`, rev: 1, kingdom: K, kind: "part", slot: `prop:${t.meta.contract === "boat" ? "boat" : "harbour"}`, palette: "fixed", size: t.grid.size, mirror: true, ground: t.meta.water_line, relief_faces: [], ...t.meta };
  write(f.replace(".nbt", ".json"), meta);
  const c = check(f, meta); report.push([t.id, c.ok, c.errors]);
}
// buildings: the module set's authoring palette mapped to the building's
const PAL = { customs_house_13x10: "stone", warehouse_13x7: "brick", warehouse_10x7: "brick", fish_market_10x7: "stone" };
const trim = (g) => { let top = g.size[1] - 1; const filled = new Set([...g.each()].filter(([, , , s]) => s !== "air").map(([, y]) => y)); while (top > 0 && !filled.has(top)) top--; const o = new Grid([g.size[0], top + 2, g.size[2]]); for (const [x, y, z, s] of g.each()) if (y <= top + 1) o.set(x, y, z, s); return o; };
const names = [];
for (const b of buildings) {
  const pal = PAL[b.id], map = pal ? paletteMap(palettes, pal) : (s) => s;
  let g = new Grid(b.grid.size); for (const [x, y, z, s] of b.grid.each()) g.set(x, y, z, map(s));
  g = trim(g);
  const f = join(H, `${b.id}.nbt`); g.save(f); names.push(f);
  write(f.replace(".nbt", ".json"), { id: `enterprise:${K}/harbour/${b.id}`, rev: 1, kingdom: K, kind: "hall", ...b.meta, palette: pal || "fixed",
    footprint: [g.size[0], g.size[2]], height: g.size[1], ground: 2, mirror: true, beds: [], workstations: [], lockers: [], markers: [], entities: [],
    ...(b.layout ? { assembly: { set: "lordaeron/timber_relief", layout: b.layout } } : { relief_faces: [] }) });
  execFileSync("node", ["../../tools/preview.mjs", f, `${PREV}/${b.id}.jpg`], { stdio: "ignore" });
}
write(`${DATA}/town_kits/${K}/harbour.json`, {
  set: `${K}/harbour`, rev: 1,
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
    plots: "The customs house is 15 x 12 with its cupola and flag (13 x 10 body), a warehouse 17 x 9 (13 x 7 and its hoist), the river warehouse 14 x 9, the fish market 12 x 9, the river booth 7 x 5: all fit a 16-wide plot except the customs house, which takes a forum-front plot at the quay's head."
  },
  parts: parts.map((t) => ({ id: t.id, part: `enterprise:${K}/harbour/${t.id}`, size: t.grid.size, ...t.meta, pilings: undefined })),
  buildings: buildings.map((b) => ({ id: b.id, part: `enterprise:${K}/harbour/${b.id}`, palette: PAL[b.id] || "fixed", ...b.meta })),
});
for (const [id, ok, e] of report) if (!ok) console.log("FAIL", id, e.join(" | "));
console.log(`${parts.length} parts ${report.filter((r) => r[1]).length}/${report.length} pass; ${buildings.length} buildings`);
try { execFileSync("node", ["../../tools/gate.mjs", ...names], { stdio: "inherit" }); } catch { process.exitCode = 1; }
