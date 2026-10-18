// A project's before/after models for the 3-D views, slimmed to what can be seen: a block buried on all six sides by
// opaque blocks is left out, and everything a few blocks below the lowest ground is cut away (the cut is treated as
// solid, so no floor of faces is drawn under it). The box's sides stay, as a diorama's earth walls.
//   node scripts/models.mjs <in.nbt> <out.nbt> [--floor y]   (default: 3 below the ground's low point; give the
//   'before' model's floor to the 'after' one so the pair lines up)
import { load, Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";

const [IN, OUT] = process.argv.slice(2);
const arg = (k) => (process.argv.includes(k) ? +process.argv[process.argv.indexOf(k) + 1] : null);
const FOR_1_21_1 = [[/^minecraft:pale_oak_log$/, "minecraft:stripped_birch_log"], [/^minecraft:pale_oak_/, "minecraft:birch_"], [/^minecraft:iron_chain$/, "minecraft:chain"]];
const older = (b) => { for (const [re, to] of FOR_1_21_1) if (re.test(b)) return b.replace(re, to); return b; };
const n = (b) => b.replace(/^minecraft:/, "");
// full opaque cubes (the same idea as the viewer's culling): what hides a neighbour's face
const OPAQUE = /(_planks|_log|_wood|stone|cobblestone|bricks|dirt|grass_block|podzol|mycelium|sand|gravel|terracotta|concrete|_wool|_ore|deepslate|tuff|andesite|diorite|granite|^mud$|packed_mud|clay|calcite|smooth_|_block|bedrock|obsidian)$/;
const NOT = /slab|stairs|wall|fence|leaves|glass|pane|door|trapdoor|carpet|button|plate|path|farmland|snow$/;

const g = load(IN), [X, Y, Z] = g.size;
const solid = new Set(), K = (x, y, z) => `${x},${y},${z}`;
for (const c of g.cells.values()) { const b = n(c.block); if (OPAQUE.test(b) && !NOT.test(b)) solid.add(K(...c.pos)); }
// the floor: 3 below the ground's low point (the 2nd percentile of column tops, so a cave or a pit doesn't set it)
const tops = [];
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) for (let y = Y - 1; y >= 0; y--) { if (solid.has(K(x, y, z))) { tops.push(y); break; } }
const low = tops.sort((a, b) => a - b)[Math.floor(tops.length * 0.02)] ?? 0;
const floor = arg("--floor") ?? Math.max(0, low - 3);
const covered = (x, y, z) => (y < floor ? true : solid.has(K(x, y, z)));
const out = new Grid([X, Y - floor, Z], { dataVersion: 3955 });
let kept = 0, all = 0;
for (const c of g.cells.values()) {
  const [x, y, z] = c.pos; if (/air$/.test(c.block) || y < floor) continue; all++;
  if (solid.has(K(x, y, z)) && [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].every(([dx, dy, dz]) => {
    const p = [x + dx, y + dy, z + dz]; if (p[0] < 0 || p[2] < 0 || p[0] >= X || p[2] >= Z || p[1] >= Y) return false; return covered(...p); })) continue;
  out.set(x, y - floor, z, older(c.block), c.state, c.nbt); kept++;
}
// seal the floor: a cave running down through the cut would show the sky through the bottom
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (!out.get(x, 0, z) || /air$/.test(out.get(x, 0, z).block)) {
  const c = g.get(x, floor, z); if (!c || /air$|water|lava/.test(c.block)) { if (!/water|lava/.test(c?.block ?? "")) { out.set(x, 0, z, "stone"); kept++; } } }
out.save(OUT);
console.log(JSON.stringify({ in: IN, out: OUT, size: out.size, floor, blocks: all, kept }));
