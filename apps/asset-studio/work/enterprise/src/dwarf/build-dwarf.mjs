// The dwarf core set (batch 039): ten Sonnet builds (out/builds/dwarf, briefs from styles/assets.json and the dwarf
// style) delivered on the town's contract. Each build is authored in the dwarf base palette (Deepforge); the clans
// recolour it at placement from styles/dwarf.json `swaps`. Per build: turned so the front faces south (mcd builds face
// north), two dirt layers under it so layer 2 is the yard's surface (red_sand, the yard marker the placer swaps for the
// land's ground), and every point of interest either declared or made a decorative twin.
//   node src/dwarf/build-dwarf.mjs
import fs from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { Grid, splitState, joinState } from "../grid.mjs";
import { check } from "../../../../tools/check-asset.mjs";

const SRC = "out/builds/dwarf", DATA = "bundle/core/src/main/resources/data/enterprise", OUT = `${DATA}/structure/dwarf`, PREV = "bundle/assets-src/dwarf";
const JOB = /^minecraft:(barrel|blast_furnace|brewing_stand|cartography_table|(water_|lava_|powder_snow_)?cauldron|composter|fletching_table|grindstone|lectern|loom|smithing_table|smoker|stonecutter)$/;
const SLOT_OF = { blast_furnace: "armorer", smithing_table: "toolsmith", grindstone: "weaponsmith", brewing_stand: "cleric" };
// what each build is in the town: its folder, id, slot, tiers, and which job block (if any) it keeps as the workstation
const SET = [
  { src: "cottage_7x7", kind: "home", id: "cottage_7x7_a", keep: [], roof: { from: 4, full: true } },
  { src: "house_10x7", kind: "home", id: "house_10x7_a", keep: [], roof: { from: 7 } },
  { src: "workshop_smith", hold: "interior: circulation 0.62 (cap 0.45)", kind: "workshop", id: "workshop_smith_12x9_a", keep: ["blast_furnace", "smithing_table", "grindstone"], tiers: ["village", "town"] },
  { src: "stall", kind: "stall", id: "stall_3x3_a", marker: "anvil", tiers: ["hamlet", "village", "town"] },
  { src: "forum_centre", kind: "forum", id: "forum_centre_7x7_a", open: true },
  { src: "tavern", hold: "interior: 4 guest rooms reached through another room", kind: "hall", id: "tavern_15x9_a", keep: [], tiers: ["village", "town"] },
  { src: "temple", kind: "hall", id: "temple_9x9_a", keep: ["brewing_stand"], tiers: ["village", "town"] },
  { src: "watchtower", kind: "wall", id: "watchtower_7x7_a", keep: [], tiers: ["town"] },
  { src: "wall_curtain", kind: "wall", id: "curtain_8_a", part: true, tiers: ["town"] },
  { src: "wall_gatehouse", kind: "wall", id: "gatehouse_11x7_a", keep: [], tiers: ["town"] },
];

const empty = (s) => !s || /:(cave_|void_)?air$/.test(s) || /(dead_bush|short_grass|fern)$/.test(s);
const bare = (s) => splitState(s).name.replace(/^minecraft:/, "");
const report = [], names = [];
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(PREV, { recursive: true });
// held builds pass the contract but not yet the interior check: built and gated here, not delivered
const HELD = SET.filter((a) => a.hold), LIVE = SET.filter((a) => !a.hold);
for (const a of LIVE) {
  // the build's latest version (revisions count up from v1)
  const ver = a.ver || fs.readdirSync(join(SRC, a.src)).filter((f) => /^v\d+\.nbt$/.test(f)).sort((x, y) => parseInt(x.slice(1)) - parseInt(y.slice(1))).at(-1);
  const src = Grid.load(join(SRC, a.src, ver)), [W, H, D] = src.size;
  // a roof Sonnet laid in the plinth's deepslate brick goes to the roof's deepslate tile (so the clans' roofs apply)
  if (a.roof) for (const [x, y, z, st] of [...src.each()]) if (y >= a.roof.from) {
    const t = st.replace(/deepslate_brick_(stairs|slab)/, "deepslate_tile_$1").replace(a.roof.full ? /deepslate_bricks$/ : /^$/, "deepslate_tiles");
    if (t !== st) src.set(x, y, z, t);
  }
  // turn to face south, lift onto two dirt layers, the 1.21.1 chain, the stall's trade block left to the placer
  const g = new Grid([W, H + 2, D]);
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); }
  g.paste(src, 0, 2, 0, { q: 2, map: (s) => s.replace(/^minecraft:iron_chain/, "minecraft:chain") });
  // every cell stored: an unstored cell is void to the placer and the walk check (a structure block keeps air as air)
  for (let x = 0; x < W; x++) for (let y = 2; y < H + 2; y++) for (let z = 0; z < D; z++) if (!g.get(x, y, z)) g.set(x, y, z, "air");
  const meta = { id: `enterprise:dwarf/${a.kind}/${a.id}`, rev: 1, style: "dwarf", kind: a.part ? "part" : a.kind, ...(a.part ? { slot: "wall:curtain" } : {}),
    ...(a.tiers ? { tiers: a.tiers } : {}), palette: "deepforge", footprint: [W, D], height: H + 2, ground: 2, mirror: true,
    entrances: [], beds: [], workstations: [], lockers: [], markers: [], entities: [], relief_faces: a.part ? ["south", "north"] : ["south", "north", "east", "west"] };
  const cands = [];
  for (const [x, y, z, s] of [...g.each()]) {
    const n = splitState(s).name;
    if (a.marker && bare(s) === a.marker) { g.set(x, y, z, null); meta.workstations.push({ at: [x, y, z], block: "any" }); continue; }
    if (n.endsWith("_bed") && splitState(s).props.part === "head") {
      const d = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] }[splitState(s).props.facing];
      meta.beds.push({ head: [x, y, z], foot: [x + d[0], y, z + d[1]] });
    } else if (n === "minecraft:bell") meta.markers.push({ what: "bell", at: [x, y, z] });
    else if (JOB.test(n)) {
      const b = bare(s).replace(/^(water|lava|powder_snow)_cauldron$/, "cauldron");
      if ((a.keep || []).includes(b)) cands.push({ at: [x, y, z], block: n, b, s });
      g.set(x, y, z, joinState({ name: `enterprise:decor_${b}`, props: b === "cauldron" ? {} : splitState(s).props }));
    }
  }
  if (a.kind === "stall") meta.slot = "stall:any";
  // the workstation: the first kept job block the door reaches (the others stay decorative twins)
  const lockersFor = (w) => { for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]]) {
    const p = [w.at[0] + dx, w.at[1] + dy, w.at[2] + dz], s = g.get(...p);
    if (s && /(chest|barrel)/.test(s)) meta.lockers.push({ at: p, for: w.at });
  } };
  const use = (c) => { g.set(...c.at, c.s); meta.workstations = [{ at: c.at, block: c.block }]; meta.lockers = []; lockersFor(meta.workstations[0]); meta.slot = SLOT_OF[c.b] ? `${a.kind}:${SLOT_OF[c.b]}` : meta.slot; };
  if (cands.length) use(cands.shift());
  // entrances: each door on the south half with open ground outside it; open builds enter mid-front
  for (const [x, y, z, s] of g.each()) if (/_door\[/.test(s) && splitState(s).props.half === "lower" && y === 3 && z >= D / 2 && empty(g.get(x, 3, z + 1))) meta.entrances.push({ at: [x, 3, z + 1], facing: "south", width: 1 });
  if (!meta.entrances.length && !a.part) meta.entrances.push({ at: [Math.floor(W / 2), 3, D - 1], facing: "south", width: 1 });
  const dir = join(OUT, a.kind), f = join(dir, `${a.id}.nbt`); fs.mkdirSync(dir, { recursive: true });
  // save and check; light any dark walkable cell with a standing lantern, and move an unreached workstation to the next
  let c;
  for (let round = 0; round < 15; round++) {
    g.save(f); fs.writeFileSync(f.replace(".nbt", ".json"), JSON.stringify(meta, null, 2) + "\n");
    c = check(f, meta);
    const dark = c.errors.find((e) => e.includes("under light 8"));
    const far = c.errors.find((e) => /^workstation at .* not reachable/.test(e));
    if (far && cands.length) { const w = meta.workstations[0]; g.set(...w.at, joinState({ name: `enterprise:decor_${bare(w.block)}`, props: {} })); use(cands.shift()); continue; }
    if (!dark) break;
    for (const m of dark.matchAll(/\((\d+),(\d+),(\d+)\)/g)) { const p = [+m[1], +m[2], +m[3]]; if (empty(g.get(...p))) g.set(...p, "lantern[hanging=false,waterlogged=false]"); }
  }
  names.push(f); report.push([a.id, c.ok, c.errors]);
  execFileSync("node", ["../../tools/preview.mjs", f, `${PREV}/${a.id}.jpg`], { stdio: "ignore" });
}
fs.mkdirSync(`${DATA}/town_kits/dwarf`, { recursive: true });
fs.writeFileSync(`${DATA}/town_kits/dwarf/core.json`, JSON.stringify({
  set: "dwarf/core", rev: 1, style: "dwarf",
  about: "The dwarf town's core set: ten whole buildings, each authored in the dwarf base palette (Deepforge hold). A town's clan comes from styles/settlement.json; recolour every part at placement with that clan's `swaps` from styles/dwarf.json (Deepforge has none). Every part is on the usual contract: layers 0-1 dirt, layer 2 the surface, the front to the south, every cell stored (air as air), points of interest declared or decorative twins, every walkable cell lit. The yard round each building is authored in red_sand with dead_bush: swap them for the land's ground and plant from the town's settlement entry (`ground`, `plant`).",
  parts: LIVE.map((a) => { const m = JSON.parse(fs.readFileSync(join(OUT, a.kind, `${a.id}.json`), "utf8")); return { id: a.id, part: m.id, kind: m.kind, slot: m.slot, tiers: m.tiers, size: [m.footprint[0], m.height, m.footprint[1]], beds: m.beds.length, workstations: m.workstations.map((w) => w.block) }; }),
  held: HELD.map((a) => ({ id: a.id, why: a.hold })),
  notes: [
    "Footprints include a one-block yard round the building (the catalog's size plus 2 each way); the stall's 5 x 5 is its 3 x 3 on a yard.",
    "stall_3x3_a has a workstation marker (block any, air) behind its counter: the placer sets the trade's job block there, so one stall serves every trade.",
    "forum_centre_7x7_a carries the town bell as a marker.",
    "curtain_8_a is a part: an 8-long wall piece, both ends cut to join the next; the battered base course sits in layer 2.",
  ],
}, null, 2) + "\n");
for (const [id, ok, e] of report) console.log(ok ? "ok  " : "FAIL", id, ok ? "" : e.slice(0, 6).join(" | "));
try { execFileSync("node", ["../../tools/gate.mjs", ...names], { stdio: "inherit" }); } catch { process.exitCode = 1; }
