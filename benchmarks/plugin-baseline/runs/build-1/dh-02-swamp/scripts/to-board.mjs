import { readFileSync, writeFileSync, existsSync, renameSync } from "node:fs";
// Writes DH-02's projects, todos and cannon jobs into the Dragonholde board (apps/dragonholde-board/data/board.json).
// Run from dh-02-swamp/: node scripts/to-board.mjs. Jobs already on the board keep their status and cannon.
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
const BOARD = new URL("../../../../../../apps/dragonholde-board/data/board.json", import.meta.url).pathname;
const NBT = "benchmarks/plugin-baseline/runs/build-1/dh-02-swamp/delivery/cannon/";
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
put("towns", "dh", { code: "DH", name: "Dragonholde", namedBy: "villager mod (random; may change)" });
put("projects", "dh-01", { code: "DH-01", name: "Polarton", placeholder: true, town: "dh", client: "Antipolar", order: 1, stage: "done", bbox: [-1983, -232, -1891, -143], summary: "Terraced hill village, partly a demo of the terrain-aware build system. Landscape and buildings pasted.", exportCorner: [-1983, 59, -232] });
put("projects", "dh-02", { code: "DH-02", name: null, town: "dh", client: "Antipolar", order: 2, stage: "plan", bbox: [-1965, -168, -1826, 26], summary: "Swamp reclamation the client pointed us to after DH-01: levee ring, polder farms, waterfront, distillery, brewhouse, boatyard.", exportCorner: [-1965, 62, -168], note: "The first earthworks delivery (15 section files) is too slow: its critical path is about 8.5 h. It is expected to be dropped in favour of a re-plan from a capture of the swamp bed, cut into short waves for 20 cannons." });
const T = (id, project, stage, seq, title, extra = {}) => put("tasks", id, { project, stage, seq, title, kind: "todo", status: "queued", ...extra });
T("dh-01-capture", "dh-01", "capture", 1, "Capture: polarton_expansion_001_xl", { status: "done" });
T("dh-01-plan", "dh-01", "plan", 1, "Approve terraces, streets and plots", { status: "done" });
T("dh-01-land", "dh-01", "earthworks", 1, "Paste landscape.nbt (terraform)", { status: "done" });
T("dh-01-village", "dh-01", "buildings", 1, "Paste the village buildings over the landscape", { status: "done" });
T("dh-02-capture", "dh-02", "capture", 1, "Capture: antipolar_expansion_002_raw", { status: "done" });
T("dh-02-bed", "dh-02", "capture", 2, "Capture the swamp bed below the water line (spec to come)");
T("dh-02-plan", "dh-02", "plan", 1, "Approve roads, zoning, levees and waterfront (plan-3)", { status: "done" });
T("dh-02-pond", "dh-02", "plan", 2, "Pond test: does Replace Solid with Empty clear water source blocks?");
T("dh-02-align", "dh-02", "earthworks", 0, "Check the staging hologram's road sits on the real road");
T("dh-02-k1", "dh-02", "buildings", 1, "Kit 1: waterfront mixed-use, distillery, brewhouse, pump houses");
T("dh-02-k2", "dh-02", "buildings", 2, "Kit 2: boatyard and fleet");
T("dh-02-k3", "dh-02", "buildings", 3, "Kit 3: faubourg cottages and farmstead");
const ringFills = [];
let seq = 1;
for (const f of r.files) {
  const id = "dh-02-" + f.file.replace(/\.nbt$/, "").toLowerCase();
  const corner = [f.corner[0] + A[0], f.corner[1] + A[1], f.corner[2] + A[2]];
  const m = mats[f.file] || {}; const placed = Object.values(m).reduce((a, b) => a + b, 0);
  const rem = f.kind === "dig" ? removals(f) : 0;
  const deps = f.kind === "staging" ? [] : f.kind === "dig" ? null : ["dh-02-0-staging"];
  if (/^1-[ACE]-fill/.test(f.file)) ringFills.push(id);
  put("tasks", id, { project: "dh-02", stage: "earthworks", seq: seq++, kind: "cannon", status: "queued", cannon: null,
    title: f.kind === "staging" ? "Staging: cannon decks + markers" : `${f.section}: ${f.kind}`,
    file: f.file, corner, size: f.size, foot: [corner[0], corner[2], corner[0] + f.size[0] - 1, corner[2] + f.size[2] - 1],
    mode: f.mode, nbt: NBT + f.file, placed, removed: rem, work: placed + rem, materials: m, deps });
}
for (const d of docs) if (d.col === "tasks" && d.data.deps === null) d.data.deps = ringFills;
const board = existsSync(BOARD) ? JSON.parse(readFileSync(BOARD, "utf8")) : { towns: {}, projects: {}, tasks: {}, pool: {} };
const KEEP = ["status", "cannon", "updatedAt"];
for (const { col, id, data } of docs) {
  if (col === "config") { board.pool = { ...data, ...board.pool }; continue; }
  const old = board[col][id];
  board[col][id] = old && col === "tasks" ? { ...data, ...Object.fromEntries(KEEP.filter((k) => k in old).map((k) => [k, old[k]])) } : old && col === "projects" ? { ...data, stage: old.stage } : data;
}
writeFileSync(BOARD + ".tmp", JSON.stringify(board, null, 2) + "\n"); renameSync(BOARD + ".tmp", BOARD);
console.log(`${docs.length} entries written to ${BOARD}`);
