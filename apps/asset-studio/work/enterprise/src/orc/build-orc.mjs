// The orc core set (batch 044): ten Sonnet builds of the orc war-town (out/builds/orc, briefs from styles/assets.json
// and the orc style; the huts' low walls and hide domes laid by the toolkit's yurt() and vault() brushes) delivered on
// the town's contract, the same converter as the Dalaran spires (src/dalaran/build-spires.mjs). Each part is authored
// in the orc base palette (red sandstone hide, red terracotta walls); every clan, Mudhide the default included, has
// swaps in styles/orc.json. Per build: turned so the front faces south (mcd builds face north), two dirt layers under
// it so layer 2 is the yard's surface, and every point of interest either declared or made a decorative twin.
//   node src/orc/build-orc.mjs
import fs from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { Grid, splitState, joinState } from "../grid.mjs";
import { check } from "../../../../tools/check-asset.mjs";

const SRC = "out/builds/orc", DATA = "bundle/core/src/main/resources/data/enterprise", OUT = `${DATA}/structure/orc`, PREV = "bundle/assets-src/orc";
const JOB = /^minecraft:(barrel|blast_furnace|brewing_stand|cartography_table|(water_|lava_|powder_snow_)?cauldron|composter|fletching_table|grindstone|lectern|loom|smithing_table|smoker|stonecutter)$/;
const SLOT_OF = { blast_furnace: "armorer", smithing_table: "toolsmith", grindstone: "weaponsmith", brewing_stand: "cleric" };
// what each build is in the town: its folder, id, slot, tiers, and which job block (if any) it keeps as the workstation
const SIX = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const PANE = "purple_stained_glass_pane[east=true,west=true,north=false,south=false,waterlogged=false]";
const SET = [
  // a skull stood in the hide over the door (a skull does not close it, so the hut read as open): the hide is closed
  // there and the skull hangs on its face
  { src: "cottage_7x7", tiles: [3, 3], kind: "home", id: "hut_10x10_a", keep: [], fill: [[5, 7, 8, "red_sandstone"], [5, 7, 9, "skeleton_wall_skull[facing=south,powered=false]"],
    // a family hut: two more beds against the back wall (29 floor for two beds was over the 8.5 a bed cap)
    [3, 3, 2, "red_bed[facing=north,occupied=false,part=head]"], [3, 3, 3, "red_bed[facing=north,occupied=false,part=foot]"],
    [6, 3, 2, "red_bed[facing=north,occupied=false,part=head]"], [6, 3, 3, "red_bed[facing=north,occupied=false,part=foot]"]] },
  { src: "house_10x7", tiles: [4, 3], kind: "home", id: "longhut_14x10_a", keep: [] },
  { src: "workshop_smith", tiles: [4, 3], kind: "workshop", id: "forge_14x10_a", keep: ["blast_furnace", "smithing_table", "grindstone"], tiers: ["village", "town"] },
  { src: "stall", kind: "stall", id: "stall_3x3_a", marker: "anvil", tiers: ["hamlet", "village", "town"] },
  { src: "forum_centre", kind: "forum", id: "war_square_7x7_a", open: true },
  { src: "tavern", tiles: [5, 4], kind: "hall", id: "feast_hall_18x14_a", keep: [], tiers: ["village", "town"], pockets: 6 },
  { src: "temple", kind: "hall", id: "spirit_lodge_9x9_a", keep: ["brewing_stand"], tiers: ["village", "town"] },
  // a lookout is not a home: the bed in its top room goes, a barrel in its place
  { src: "watchtower", kind: "wall", id: "watchtower_7x7_a", keep: [], tiers: ["town"], clear: [[5, 7, 4]], fill: [[5, 7, 5, "barrel[facing=up,open=false]"]] },
  { src: "wall_curtain", kind: "wall", id: "curtain_8_a", part: true, tiers: ["town"] },
  { src: "wall_gatehouse", ends: true, kind: "wall", id: "gatehouse_11x7_a", keep: [], tiers: ["town"] },
];

const empty = (s) => !s || /:(cave_|void_)?air$/.test(s) || /(dead_bush|short_grass|fern)$/.test(s);
const bare = (s) => splitState(s).name.replace(/^minecraft:/, "");
const report = [], names = [];
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(PREV, { recursive: true });
// held builds pass the contract but not yet the interior check: built and gated here, not delivered
const HELD = SET.filter((a) => a.hold), LIVE = SET.filter((a) => !a.hold);
for (const a of LIVE) {
  // the build's latest version (revisions count up from v1), or the one named (the stall's shape pass floated its beam)
  const ver = a.ver || fs.readdirSync(join(SRC, a.src)).filter((f) => /^v\d+\.nbt$/.test(f)).sort((x, y) => parseInt(x.slice(1)) - parseInt(y.slice(1))).at(-1);
  let src = Grid.load(join(SRC, a.src, ver));
  // a tiled build is authored on its whole tiles; the outer ring is yard (the placer fills it), so the part is the body
  if (a.tiles) {
    const [w, h, d] = src.size, body = new Grid([w - 2, h, d - 2]);
    for (const [x, y, z, s] of src.each()) if (x > 0 && z > 0 && x < w - 1 && z < d - 1) body.set(x - 1, y, z - 1, s);
    if (w - 2 > 4 * a.tiles[0] - 2 || d - 2 > 4 * a.tiles[1] - 2) throw new Error(`${a.id}: body ${w - 2} x ${d - 2} does not fit tiles ${a.tiles}`);
    src = body;
  }
  const [W, H, D] = src.size;
  // turn to face south, lift onto two dirt layers, the 1.21.1 chain, a lightning rod (a point of interest) to an end rod,
  // and stairs or slabs of bone (they don't exist) to smooth sandstone's
  const g = new Grid([W, H + 2, D]);
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) { g.set(x, 0, z, "dirt"); g.set(x, 1, z, "dirt"); }
  g.paste(src, 0, 2, 0, { q: 2, map: (s) => s.replace(/^minecraft:iron_chain/, "minecraft:chain").replace(/^minecraft:lightning_rod/, "minecraft:end_rod")
    .replace(/^minecraft:bone_block_(stairs|slab)/, "minecraft:smooth_sandstone_$1") });
  // every cell stored: an unstored cell is void to the placer and the walk check (a structure block keeps air as air)
  for (let x = 0; x < W; x++) for (let y = 2; y < H + 2; y++) for (let z = 0; z < D; z++) if (!g.get(x, y, z)) g.set(x, y, z, "air");
  // a hearth flue walled to the roof but open to the sky makes the whole room "outside" to the interior walk: cap its
  // top walled cell in the chimney's own stone (campfire smoke rises through blocks, so the fire still smokes)
  for (const [x, y, z, s] of [...g.each()]) if (/campfire/.test(s)) {
    let top = null, k = y + 1;
    for (; k < H + 2 && empty(g.get(x, k, z)); k++) {
      const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => g.get(x + dx, k, z + dz));
      if (sides.every((n) => !empty(n))) top = [k, sides.find((n) => !/stairs|slab|glass|bars|fence/.test(n)) || sides[0]];
    }
    if (k >= H + 2 && top && top[0] > y + 2) g.set(x, top[0], z, top[1]);
  }
  // a steep roof is hollow, and the interior walk counts the floor of a sealed roof void as an idle storey: from layer
  // `attic` up, air that no door or opening reaches (not joined to the outside air) is filled solid, out of sight
  if (a.attic) {
    const out = new Set(), q = [], k = (x, y, z) => `${x},${y},${z}`;
    for (let x = 0; x < W; x++) for (let y = 2; y < H + 2; y++) for (let z = 0; z < D; z++)
      if ((x === 0 || z === 0 || x === W - 1 || z === D - 1 || y === H + 1) && empty(g.get(x, y, z))) { out.add(k(x, y, z)); q.push([x, y, z]); }
    while (q.length) {
      const [x, y, z] = q.pop();
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
        const p = [x + dx, y + dy, z + dz];
        if (p[0] < 0 || p[2] < 0 || p[0] >= W || p[2] >= D || p[1] < 2 || p[1] >= H + 2 || out.has(k(...p)) || !empty(g.get(...p))) continue;
        out.add(k(...p)); q.push(p);
      }
    }
    for (let x = 0; x < W; x++) for (let y = a.attic; y < H + 2; y++) for (let z = 0; z < D; z++)
      if (!out.has(k(x, y, z)) && g.get(x, y, z) === "minecraft:air" && !SIX.some(([dx, dy, dz]) => /glass|pane|bars|trapdoor|_door|fence/.test(g.get(x + dx, y + dy, z + dz) || "")))
        g.set(x, y, z, "minecraft:dark_oak_planks");   // (behind a window it stays air, so the window still looks in)
  }
  // decoration that shuts the entry off from the room is left out
  // under a hide that steps in from a low wall, the top of the wall inside is a pocket 2 high: the floor-plan walk reads
  // it as a cramped passage. From layer `pockets` up, an enclosed standing cell with exactly 2 of headroom is filled
  if (a.pockets) for (const [x, y, z, st] of [...g.each()]) if (y >= a.pockets && empty(st) && st && empty(g.get(x, y + 1, z)) && g.get(x, y + 1, z)
    && !empty(g.get(x, y + 2, z)) && !empty(g.get(x, y - 1, z)) && !/stairs|slab|carpet|bed|_door\[/.test(g.get(x, y - 1, z)) && x > 0 && z > 0 && x < W - 1 && z < D - 1)
    g.set(x, y, z, "minecraft:dark_oak_planks");
  for (const p of a.clear || []) g.set(...p, "air");
  // a roof block left out over the hearth (its smoke hole) opens the room to the sky: closed with its neighbour's block
  for (const [x, y, z, st] of a.fill || []) g.set(x, y, z, st);
  const meta = { id: `enterprise:orc/${a.kind}/${a.id}`, rev: 1, style: "orc", kind: a.part ? "part" : a.kind, ...(a.part ? { slot: "wall:curtain" } : {}),
    ...(a.tiers ? { tiers: a.tiers } : {}), palette: "base", ...(a.tiles ? { tiles: a.tiles } : {}), footprint: [W, D], height: H + 2, ground: 2, mirror: true,
    entrances: [], beds: [], workstations: [], lockers: [], markers: [], entities: [], relief_faces: a.part || a.ends ? ["south", "north"] : ["south", "north", "east", "west"] };
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
  // entrances: each door on the south half with open ground outside it (at grade or up to two steps: Dalaran's front
  // doors stand on a raised stone plinth); open builds enter mid-front
  for (const [x, y, z, s] of g.each()) if (/_door\[/.test(s) && splitState(s).props.half === "lower" && y >= 3 && y <= 5 && z >= D / 2 && empty(g.get(x, y, z + 1))) meta.entrances.push({ at: [x, y, z + 1], facing: "south", width: 1 });
  // an open front (no door) enters mid-front, standing on whatever is there (a step's slab, a sill)
  if (!meta.entrances.length && !a.part) { const x = Math.floor(W / 2); let y = 3; while (y < H && !empty(g.get(x, y, D - 1))) y++; meta.entrances.push({ at: [x, y, D - 1], facing: "south", width: 1 }); }
  const dir = join(OUT, a.kind), f = join(dir, `${a.id}.nbt`); fs.mkdirSync(dir, { recursive: true });
  // save and check; light any dark walkable cell (a lantern hung from the ceiling, else standing), and move an unreached workstation to the next
  let c;
  for (let round = 0; round < 15; round++) {
    g.save(f); fs.writeFileSync(f.replace(".nbt", ".json"), JSON.stringify(meta, null, 2) + "\n");
    c = check(f, meta);
    const dark = c.errors.find((e) => e.includes("under light 8"));
    let far = c.errors.find((e) => /^workstation at .* not reachable/.test(e));
    // the interior walk is stricter (it starts at doors, through closed space): move off a workstation it can't reach too
    if (!far && cands.length && meta.workstations[0]?.at && !a.marker) {
      const fp = JSON.parse(execFileSync("python3", ["-I", "../../tools/py/floorplan.py", f, "--json"], { encoding: "utf8" }))[0];
      if (fp.unreached.some((u) => u.endsWith(`at [${meta.workstations[0].at.join(", ")}]`))) far = "interior";
    }
    if (far && cands.length) { const w = meta.workstations[0]; g.set(...w.at, joinState({ name: `enterprise:decor_${bare(w.block)}`, props: {} })); use(cands.shift()); continue; }
    if (!dark) break;
    for (const m of dark.matchAll(/\((\d+),(\d+),(\d+)\)/g)) {
      const [x, y, z] = [+m[1], +m[2], +m[3]];
      // hang it from the ceiling (2 or 3 above the feet) so it never stands in a doorway or at a stair's foot
      const top = [y + 2, y + 3].find((t) => empty(g.get(x, t, z)) && !empty(g.get(x, t + 1, z)) && (t === y + 2 || empty(g.get(x, y + 2, z))));
      if (top && empty(g.get(x, y + 1, z))) g.set(x, top, z, "lantern[hanging=true,waterlogged=false]");
      else {
        // a standing lantern never on a doorstep or a stair's foot: there, the next cell over that is free
        const busy = (cx, cz) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => [-1, 0, 1].some((dy) => /_door|_stairs/.test(g.get(cx + dx, y + dy, cz + dz) || "")));
        const at = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [x + dx, z + dz]).find(([cx, cz]) => cx >= 0 && cz >= 0 && cx < W && cz < D && empty(g.get(cx, y, cz)) && !empty(g.get(cx, y - 1, cz)) && !busy(cx, cz));
        if (at) g.set(at[0], y, at[1], "lantern[hanging=false,waterlogged=false]");
        else {
          // all taken (banners, flaps): the nearest free spot within two blocks, hung under a block or standing on one
          let best = null;
          for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = 0; dy <= 2; dy++) {
            const p = [x + dx, y + dy, z + dz], d = Math.abs(dx) + Math.abs(dz) + dy;
            if (p[0] < 0 || p[2] < 0 || p[0] >= W || p[2] >= D || !empty(g.get(...p)) || (best && best.d <= d)) continue;
            if (dy === 0 && busy(p[0], p[2])) continue;
            const hang = !empty(g.get(p[0], p[1] + 1, p[2])) && dy > 0, stand = !empty(g.get(p[0], p[1] - 1, p[2])) && dy !== 1;
            if (hang || stand) best = { p, d, hang };
          }
          if (best) g.set(...best.p, `lantern[hanging=${best.hang},waterlogged=false]`);
        }
      }
    }
  }
  names.push(f); report.push([a.id, c.ok, c.errors]);
  execFileSync("node", ["../../tools/preview.mjs", f, `${PREV}/${a.id}.jpg`], { stdio: "ignore" });
}
fs.mkdirSync(`${DATA}/town_kits/orc`, { recursive: true });
fs.writeFileSync(`${DATA}/town_kits/orc/core.json`, JSON.stringify({
  set: "orc/core", rev: 1, style: "orc",
  about: "The orc war-town's core set: ten whole buildings, each authored in the orc base palette (red sandstone hide, red terracotta walls, dark oak timber, blackstone footings). Every clan has swaps, the default Mudhide included: recolour every part at placement with the town's clan swaps from styles/orc.json. Every part is on the usual contract: layers 0-1 dirt, layer 2 the surface, the front to the south, every cell stored (air as air), points of interest declared or decorative twins, every walkable cell lit. The yard round each building is authored as ground; where it is red_sand with dead_bush (the yard markers), swap those for the land's ground and plant.",
  parts: LIVE.map((a) => { const m = JSON.parse(fs.readFileSync(join(OUT, a.kind, `${a.id}.json`), "utf8")); return { id: a.id, part: m.id, kind: m.kind, slot: m.slot, tiers: m.tiers, ...(m.tiles ? { tiles: m.tiles } : {}), size: [m.footprint[0], m.height, m.footprint[1]], beds: m.beds.length, workstations: m.workstations.map((w) => w.block) }; }),
  held: HELD.map((a) => ({ id: a.id, why: a.hold })),
  notes: [
    "The homes, the forge and the feast hall are on building tiles (thread 0016): tiles [W, D], body at most 4W-2 x 4D-2.",
    "The other parts keep the catalog's size plus a one-block yard each way.",
    "stall_3x3_a has a workstation marker (block any, air) behind its counter: the placer sets the trade's job block there.",
    "war_square_7x7_a carries the town bell as a marker.",
    "curtain_8_a is a part: an 8-long palisade piece, both ends cut to join the next.",
    "gatehouse_11x7_a joins the curtain at its east and west ends, so only its south and north faces carry relief.",
  ],
}, null, 2) + "\n");
for (const [id, ok, e] of report) console.log(ok ? "ok  " : "FAIL", id, ok ? "" : e.slice(0, 6).join(" | "));
try { execFileSync("node", ["../../tools/gate.mjs", ...names], { stdio: "inherit" }); } catch { process.exitCode = 1; }
