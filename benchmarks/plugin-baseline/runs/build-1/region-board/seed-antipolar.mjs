import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
// Seeds the region board (https://claude.ai/artifact/9RmeQiUydkE3bDTuHVuTSJ) from the Antipolar cannon delivery. Run from antipolar-site/: node ../region-board/seed-antipolar.mjs <out-dir>; then ArtifactData batch the JSON files.
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const A = [-1965, 62, -168];
const r = JSON.parse(readFileSync("delivery/cannon/report.json"));
const md = readFileSync("delivery/cannon/MATERIALS.md", "utf8");
const mats = {}; let cur = null;
for (const l of md.split("\n")) { const h = l.match(/^## (\S+\.nbt)/); if (h) { cur = h[1]; mats[cur] = {}; continue; }
  const g = l.match(/^\/give @s minecraft:([a-z_]+)\S* (\d+)/); if (g && cur) mats[cur][g[1]] = (mats[cur][g[1]] || 0) + +g[2]; }
const L = load("delivery/landfill-world.nbt"), F = load("delivery/final-world.nbt"); const YS = 4;
const removals = (f) => { let n = 0; const [cx, cy, cz] = f.corner; for (let x = cx; x < cx + f.size[0]; x++) for (let y = cy; y < cy + f.size[1]; y++) for (let z = cz; z < cz + f.size[2]; z++) { const l = L.get(x, y + YS, z), fi = F.get(x, y + YS, z); if (l && !/air|water/.test(l.block) && (!fi || /air|water/.test(fi.block))) n++; } return n; };
const docs = [];
const put = (col, id, data) => docs.push({ col, id, data });
put("config", "pool", { cannons: 20, secPerBlock: 1.5, setupMin: 5, feed: "Bank System block download" });
put("projects", "polarton", { name: "Polarton", order: 1, stage: "done", bbox: [-1983, -232, -1891, -143], summary: "Terraced hill village on the bluff. Landscape and buildings pasted.", exportCorner: [-1983, 59, -232] });
put("projects", "antipolar", { name: "Antipolar", order: 2, stage: "earthworks", bbox: [-1965, -168, -1826, 26], summary: "Swamp reclamation: levee ring, polder farms, waterfront, distillery, brewhouse, boatyard.", exportCorner: [-1965, 62, -168], note: "Earthworks re-plan pending: minimal-change, from a capture of the swamp bed. These jobs are the current delivery and get replaced when the re-plan lands." });
const T = (id, project, stage, seq, title, extra = {}) => put("tasks", id, { project, stage, seq, title, kind: "todo", status: "queued", ...extra });
T("pol-capture", "polarton", "capture", 1, "Export polarton_expansion_001_xl", { status: "done" });
T("pol-plan", "polarton", "plan", 1, "Approve terraces, streets and plots", { status: "done" });
T("pol-land", "polarton", "earthworks", 1, "Paste landscape.nbt (terraform)", { status: "done" });
T("pol-village", "polarton", "buildings", 1, "Paste the village buildings over the landscape", { status: "done" });
T("ap-capture", "antipolar", "capture", 1, "Export antipolar_expansion_002_raw", { status: "done" });
T("ap-bed", "antipolar", "capture", 2, "Capture the swamp bed below the water line (spec to come)");
T("ap-plan", "antipolar", "plan", 1, "Approve roads, zoning, levees and waterfront (plan-3)", { status: "done" });
T("ap-pond", "antipolar", "plan", 2, "Pond test: does Replace Solid with Empty clear water source blocks?");
T("ap-align", "antipolar", "earthworks", 0, "Check the staging hologram's road sits on the real road");
T("ap-k1", "antipolar", "buildings", 1, "Kit 1: waterfront mixed-use, distillery, brewhouse, pump houses");
T("ap-k2", "antipolar", "buildings", 2, "Kit 2: boatyard and fleet");
T("ap-k3", "antipolar", "buildings", 3, "Kit 3: faubourg cottages and farmstead");
const ringFills = [];
let seq = 1;
for (const f of r.files) {
  const id = "ap-" + f.file.replace(/\.nbt$/, "").toLowerCase();
  const corner = [f.corner[0] + A[0], f.corner[1] + A[1], f.corner[2] + A[2]];
  const m = mats[f.file] || {}; const placed = Object.values(m).reduce((a, b) => a + b, 0);
  const rem = f.kind === "dig" ? removals(f) : 0;
  const deps = f.kind === "staging" ? [] : f.kind === "dig" ? null : ["ap-0-staging"];
  if (/^1-[ACE]-fill/.test(f.file)) ringFills.push(id);
  put("tasks", id, { project: "antipolar", stage: "earthworks", seq: seq++, kind: "cannon", status: "queued", cannon: null,
    title: f.kind === "staging" ? "Staging: cannon decks + markers" : `${f.section}: ${f.kind}`,
    file: f.file, corner, size: f.size, foot: [corner[0], corner[2], corner[0] + f.size[0] - 1, corner[2] + f.size[2] - 1],
    mode: f.mode, placed, removed: rem, work: placed + rem, materials: m, deps });
}
for (const d of docs) if (d.col === "tasks" && d.data.deps === null) d.data.deps = ringFills;
for (const d of docs) writeFileSync(`${OUT}/${d.col}--${d.id}.json`, JSON.stringify(d.data));
console.log(docs.length, "docs"); for (const d of docs.filter((d) => d.data.kind === "cannon")) console.log(d.id, d.data.work, d.data.foot.join(" "));
