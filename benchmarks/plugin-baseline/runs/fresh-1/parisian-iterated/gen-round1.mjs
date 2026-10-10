// Round 1 revision of the Parisian apartment building: side/back relief, weathering, rear annex, props.
import { load, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
const g = load("round-0.nbt");
g.resize([23, 32, 24]);
const S = (x, y, z, b, st) => g.set(x, y, z, b, st);
const stair = (x, y, z, mat, f, half = "bottom") => S(x, y, z, ...B.stairs(mat, f, half));
const slab = (x, y, z, mat, t = "bottom") => S(x, y, z, ...B.slab(mat, t));
const pots = ["potted_red_tulip", "potted_azure_bluet", "potted_fern", "potted_pink_tulip"];
let rnd = 7; const R = () => ((rnd = (rnd * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const WIN = [2, 7, 11, 15, 18]; // window base y per storey (2 tall)
// wall planes: side x=1 (out -x), x=21 (out +x), back z=16 (out +z)
const planes = [
  { out: "west", at: (t, d) => [1 - d, t], ts: [7, 11], pil: [5, 9, 13], lo: 2, hi: 16 },
  { out: "east", at: (t, d) => [21 + d, t], ts: [7, 11], pil: [5, 9, 13], lo: 2, hi: 16 },
];
function cell(p, t, y, d) { // returns x,y,z for plane p at lateral t, depth d (outward)
  if (p.out === "south") return [t, y, 16 + d];
  const [x, z] = p.at(t, d); return [x, y, z];
}
const inward = { west: "east", east: "west", south: "north" };
function plane(p) {
  const f = p.out, mat = "smooth_sandstone";
  for (const t of p.pil) {
    for (let y = 1; y <= 19; y++) S(...cell(p, t, y, 1), mat);
    S(...cell(p, t, 1, 1), "stone_bricks");
    stair(...cell(p, t, 20, 1), "smooth_sandstone", inward[f], "top");
    S(...cell(p, t, 0, 1), "stone_bricks");
  }
  // string course under the eave
  for (let t = p.lo; t <= p.hi; t++) if (!p.pil.includes(t)) slab(...cell(p, t, 20, 1), "stone_brick", "top");
  for (const t of p.ts) for (const b of WIN) {
    for (const dy of [0, 1]) S(...cell(p, t, b + dy, 0), "glass_pane");
    slab(...cell(p, t, b, 1), "stone_brick", "bottom");
    stair(...cell(p, t, b + 2, 1), "stone_brick", inward[f], "top");
    const pot = pots[Math.floor(R() * pots.length)];
    if (b > 2) S(...cell(p, t, b + 1, 1), pot);
    for (const s of [-1, 1]) for (const dy of [0, 1]) S(...cell(p, t + s, b + dy, 1), ...B.trapdoor("dark_oak", f, "bottom", true));
  }
}
planes.forEach(plane);
// back wall (z=16) is partly hidden by the annex (x 6..16): pilasters/windows at the ends
const back = { out: "south", ts: [3, 19], pil: [2, 4, 18, 20], lo: 2, hi: 20 };
back.pil = [2, 21, 5, 17]; // corners + flanks
plane({ ...back, ts: [3, 19], pil: [4, 18, 1, 21], lo: 2, hi: 20 });
// ---- rear annex: lower wing, flat roof with balustrade ----
for (let x = 6; x <= 16; x++) for (let z = 17; z <= 22; z++) for (let y = 1; y <= 7; y++) {
  const edge = x === 6 || x === 16 || z === 22;
  if (y === 1 && !edge && z > 16) { S(x, y, z, "stone_bricks"); continue; }
  if (edge && y > 1 && y <= 6) S(x, y, z, (x === 6 || x === 16) && (z === 22 || z === 17) ? "stone_bricks" : "calcite");
  if (y === 7 && z >= 17) {
    if (edge) S(x, y, z, "stone_brick_wall", {});
    else S(x, y, z, ...B.slab("smooth_stone"));
  }
}
for (let x = 6; x <= 16; x++) for (let z = 17; z <= 22; z++) if (!(x === 6 || x === 16 || z === 22)) S(x, 6, z, ...B.slab("stone_brick", "top"));
for (let x = 6; x <= 16; x++) for (let z = 17; z <= 22; z++) if (x > 6 && x < 16 && z < 22) S(x, 7, z, ...B.slab("stone_brick", "top"));
for (let x = 5; x <= 17; x++) { stair(x, 6, 23, "stone_brick", "north", "top"); }
for (const z of [19, 21]) for (const x of [6, 16]) { S(x, 3, z, "glass_pane"); S(x, 4, z, "glass_pane"); S(x === 6 ? 5 : 17, 3, z, ...B.trapdoor("dark_oak", x === 6 ? "west" : "east", "bottom", true)); }
for (const x of [9, 13]) { S(x, 3, 22, "glass_pane"); S(x, 4, 22, "glass_pane"); S(x, 2, 23, ...B.slab("stone_brick")); S(x, 3, 23, pots[1]); }
S(11, 2, 22, ...B.door("dark_oak", "south", "lower")); S(11, 3, 22, ...B.door("dark_oak", "south", "upper"));
S(10, 2, 23, "stone_brick_wall", {}); S(10, 3, 23, ...B.lantern(false)); S(12, 2, 23, "stone_brick_wall", {}); S(12, 3, 23, ...B.lantern(false));
// ---- weathering: pale walls stain with diorite/andesite/tuff patches, darker toward the plinth ----
const wallCells = g.solids().filter((c) => c.block === "minecraft:calcite");
for (const c of wallCells) {
  const [x, y, z] = c.pos, low = y <= 3, r = R();
  const pick = low ? (r < 0.1 ? "stone_bricks" : r < 0.15 ? "tuff" : null)
    : r < 0.05 ? "diorite" : r < 0.09 ? "polished_andesite" : r < 0.11 ? "tuff" : r < 0.15 ? "smooth_sandstone" : null;
  if (pick && !(g.get(x, y + 1, z) && /stair|slab/.test(g.blockAt(x, y + 1, z)) && false)) S(x, y, z, pick);
}
// rain streaks below sills
for (const c of g.solids().filter((c) => /stone_brick_slab/.test(c.block))) {
  const [x, y, z] = c.pos; const b = g.blockAt(x, y - 1, z);
  if ((x === 0 || x === 22 || z === 17) && R() < 0.5) { /* under a sill, outside plane: nothing below */ }
  const w = x === 0 ? [1, y - 1, z] : x === 22 ? [21, y - 1, z] : z === 17 ? [x, y - 1, 16] : null;
  if (w && g.blockAt(...w) === "minecraft:calcite") S(...w, "tuff");
}
// roof: slate with aged variation
for (const c of g.solids()) if (/deepslate_tile_stairs|deepslate_brick_stairs/.test(c.block) && R() < 0.06) { const [x, y, z] = c.pos; g.set(x, y, z, c.block.includes("tile") ? "minecraft:deepslate_brick_stairs" : "minecraft:deepslate_tile_stairs", c.state); }
// lantern pair at front door
g.save("build.nbt");
console.log(g.census().slice(0, 14));
