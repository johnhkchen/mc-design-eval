// Batch 006: the stone wall kit into the bundle, with metadata and its tiling rules.
import fs from "node:fs";
const LEN = { corner_7x7: 7, gatehouse_11x7: 11, tower_7x7: 7, curtain_8: 8, curtain_4: 4, filler_1: 1, filler_2: 2, filler_3: 3 };
const W = "bundle/core/src/main/resources/data/enterprise/structure/lordaeron/wall";
fs.rmSync(W, { recursive: true, force: true }); fs.mkdirSync(W, { recursive: true });
for (const f of fs.readdirSync("out/walls").filter((f) => f.endsWith("_a.nbt"))) {
  const id = f.replace(".nbt", ""), name = id.replace(/_a$/, "");
  fs.copyFileSync(`out/walls/${f}`, `${W}/${f}`);
  const doorX = name.startsWith("gatehouse") ? 2 : /tower|corner/.test(name) ? 3 : null;
  const meta = { id: `enterprise:lordaeron/wall/${id}`, rev: 1, kingdom: "lordaeron", kind: "wall", slot: `wall:${name.replace(/_\d.*$/, "")}`, tiers: ["town"],
    palette: "fixed", tier_kit: "stone", footprint: [LEN[name], 7], ground: 4, mirror: !name.startsWith("corner"), wall_line_z: 3, run: "x", outside: "north (z 0)",
    entrances: doorX != null ? [{ at: [doorX, 5, 6], facing: "south", width: 1 }] : [], beds: [], workstations: [], lockers: [], markers: [], pilings: [], entities: [],
    ...(name.startsWith("gatehouse") ? { passage: { x: [4, 6], width: 3, height: 4 } } : {}),
    notes: name.startsWith("corner") ? "authored as the town's north-west corner: walls leave it east and south; the walk opens east and south" : "" };
  fs.writeFileSync(`${W}/${id}.json`, JSON.stringify(meta, null, 2) + "\n");
}
fs.writeFileSync("bundle/core/src/main/resources/data/enterprise/town_kits/lordaeron/wall_stone.json", JSON.stringify({
  set: "lordaeron/wall_stone", rev: 1, tier: "town",
  about: "The stone wall kit for the inner wall (town tier). Pieces 7 thick, centred on the wall line (z 3), run along x, outside to the north; 4 foundation layers (ground 4). Battered plinth, buttresses and loops on the town side, a machicolated parapet with merlons, a wall-walk lit every 4. Towers (blind arcades, a newel stair) and the gatehouse carry stairs from a town-side door to the walk.",
  pieces: Object.fromEntries(Object.entries(LEN).map(([k, v]) => [k, { length: v, part: `enterprise:lordaeron/wall/${k}_a` }])),
  tiling: "scripts/assets/lordaeron-ref/wall-tiling.mjs tileSide(L, gates): corners at both ends (at -3 and L-4, centred on the corner columns), a gatehouse centred on each avenue, towers about every 24 in equal stretches, curtains of 8 and 4, fillers 1-3 to close exactly. Proven on Hearthglen: north and south 95 (15 pieces), west and east 59 (10 pieces), no gaps or overlaps, every passage centred on its avenue.",
  turning: "Turn each side's pieces to face out: the north side as authored; east q1, south q2, west q3 (quarter turns clockwise). Corners turn so their open sides follow the run.",
  slopes: "Each piece stands at its own ground height on its 4-layer foundation; steps of up to 3 between neighbours are hidden by the battered plinth (step pieces to follow if the terrain needs more).",
}, null, 2) + "\n");
fs.copyFileSync("src/lordaeron/wall-tiling.mjs", "bundle/scripts/assets/lordaeron-ref/wall-tiling.mjs");
console.log("staged");
