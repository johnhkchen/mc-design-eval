// Tribunal House: Concord courthouse (stone brick / tuff / andesite, deepslate accent, stripped oak columns) with a light
// Operator layer at the door (quartz surround, glass transom, plaque). x east along the street, y up, z south; front faces NORTH.
// Pipeline: node build.mjs  ->  stage1.nbt ; then  mcd paint stage1.nbt build.nbt --rules rules.txt --face north,south,east,west,roof
import { Grid, B, roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const OUT = new URL("./stage1.nbt", import.meta.url).pathname;
const g = new Grid([27, 19, 23]);
const set = (x, y, z, b, s) => g.set(x, y, z, b, s);
const put = (x, y, z, pair) => g.set(x, y, z, ...pair);
const fill = (a, b, blk, s) => g.fill(a, b, blk, s);
const air = (a, b) => g.fill(a, b, "minecraft:air");
const hash = (x, y, z) => { let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const pane = (x, y, z, axis, blk = "glass_pane") => set(x, y, z, blk, axis === "x" ? { east: "true", west: "true" } : { north: "true", south: "true" });
const SOUTH = { facing: "south" };

// palette: dominant stone brick (+ tuff), supporting andesite, ACCENT deepslate, columns/beams stripped oak
const wallAt = (x, y, z) => { const r = hash(x, y, z); return r < 0.22 ? "tuff_bricks" : r < 0.30 ? "polished_andesite" : "stone_bricks"; };
const baseAt = (x, y, z) => { const r = hash(x, y, z); return r < 0.12 ? "mossy_stone_bricks" : r < 0.2 ? "cracked_deepslate_bricks" : "deepslate_bricks"; };
const COLS = [[0, 1], [5, 6], [10, 11], [15, 16], [20, 21], [25, 26]];   // 2x2 shafts, 3-wide bays, symmetric about x=13
const FLOOR = 3;                                                          // standing level (plinth y0..2)

// ---- 1. plinth / platform (whole footprint, 1 ledge round the walls) + broad flight -------------------------------------
for (let x = 0; x <= 26; x++) for (let z = 3; z <= 22; z++) {
  for (let y = 0; y <= 1; y++) set(x, y, z, baseAt(x, y, z));
  set(x, 2, z, z <= 9 ? ((x + z) % 2 ? "polished_andesite" : "stone_bricks") : "stone_bricks");   // portico floor: checkered
}
for (let z = 0; z <= 2; z++) {
  for (let x = 7; x <= 19; x++) { for (let y = 0; y < z; y++) set(x, y, z, "stone_bricks"); put(x, z, z, B.stairs("stone_brick", "south")); }
  for (const x of [5, 6, 20, 21]) { for (let y = 0; y <= z + 1; y++) set(x, y, z, baseAt(x, y, z)); set(x, z + 2, z, "stone_brick_slab", { type: "bottom" }); }
}
// cheek-wall extension flanking the portico platform (low plinth wing walls), lamp posts at the foot
for (const x of [5, 21]) { set(x, 2, 0, "chiseled_stone_bricks"); set(x, 3, 0, "stone_brick_wall", { up: "true" }); put(x, 4, 0, B.lantern(false)); }
for (const x of [6, 20]) { set(x, 3, 2, "stone_brick_wall", { up: "true" }); }

// ---- 2. body: front wall, flanks, rear wall; ceiling ----------------------------------------------------------------------
const solid = (a, b) => { for (let x = a[0]; x <= b[0]; x++) for (let y = a[1]; y <= b[1]; y++) for (let z = a[2]; z <= b[2]; z++) set(x, y, z, wallAt(x, y, z)); };
solid([1, 3, 10], [25, 11, 11]);                                   // front wall (behind the portico)
solid([1, 3, 6], [2, 11, 21]); solid([24, 3, 6], [25, 11, 21]);    // flanks
solid([1, 3, 20], [25, 11, 21]);                                   // rear
solid([1, 10, 3], [25, 11, 9]);                                    // portico ceiling slab + frieze fill
air([3, 3, 12], [23, 10, 19]);                                     // the courtroom
for (let x = 3; x <= 23; x++) for (let z = 12; z <= 19; z++) set(x, 11, z, "spruce_planks");  // courtroom ceiling
for (let x = 3; x <= 23; x++) for (let z = 12; z <= 19; z++) set(x, 3, z, (x + z) % 2 ? "polished_andesite" : "stone_bricks"); // floor

// ---- 3. portico: columns (stripped oak between deepslate base and capital), entablature, ceiling -----------------------------
for (const [xa, xb] of COLS) {
  for (let x = xa; x <= xb; x++) for (let z = 4; z <= 5; z++) {
    set(x, 3, z, "polished_deepslate");
    for (let y = 4; y <= 8; y++) set(x, y, z, "stripped_oak_log", { axis: "y" });
    set(x, 9, z, "chiseled_deepslate");
  }
  // collars: ring of stairs round capital (upside-down) and base (upright)
  for (let x = xa - 1; x <= xb + 1; x++) for (let z = 3; z <= 6; z++) {
    if (x < 0 || x > 26) continue;
    if (x >= xa && x <= xb && z >= 4 && z <= 5) continue;
    const dx = x < xa ? -1 : x > xb ? 1 : 0, dz = z < 4 ? -1 : z > 5 ? 1 : 0;
    if (dx && dz) { set(x, 9, z, "polished_deepslate_slab", { type: "top" }); set(x, 3, z, "polished_deepslate_slab", { type: "bottom" }); continue; }
    const f = dz === -1 ? "south" : dz === 1 ? "north" : dx === -1 ? "east" : "west";
    put(x, 9, z, B.stairs("polished_deepslate", f, "top")); put(x, 3, z, B.stairs("polished_deepslate", f, "bottom"));
  }
}
// architrave y11 (tuff) and frieze y12 (stone brick, deepslate triglyph over each column)
for (let x = 0; x <= 26; x++) for (let z = 3; z <= 5; z++) {
  set(x, 10, z, "tuff_bricks");
  set(x, 11, z, COLS.some(([a, b]) => x >= a && x <= b) ? "chiseled_deepslate" : "stone_bricks");
}
for (const x of [0, 26]) for (let z = 6; z <= 9; z++) { set(x, 10, z, "tuff_bricks"); set(x, 11, z, "stone_bricks"); }
// ceiling: oak planks with stripped-oak beams (cross beams on the column lines, long beams on the bay lines)
for (let x = 1; x <= 25; x++) for (let z = 6; z <= 9; z++) set(x, 10, z, "oak_planks");
for (const [xa, xb] of COLS) for (let x = Math.max(xa, 1); x <= Math.min(xb, 25); x++) for (let z = 6; z <= 9; z++) set(x, 10, z, "stripped_oak_log", { axis: "z" });
for (let x = 1; x <= 25; x++) for (const z of [6, 9]) if (!COLS.some(([a, b]) => x >= a && x <= b)) set(x, 10, z, "stripped_oak_log", { axis: "x" });
// hanging lanterns in each bay (chain not needed: lantern hangs from the ceiling beam)
for (const x of [3, 8, 13, 18, 23]) put(x, 9, 7, B.lantern(true));

// ---- 4. roof: stone-brick gable over the whole body, with pediment gable to the street ----------------------------------------
const rr = roof(g, [1, 3, 25, 21], "gable", {
  y: 12, ridgeAxis: "z", pitch: 0.42, overhang: 1, eave: "cornice", material: "stone_brick", trim: "deepslate_tile",
  gable: "stone_bricks", verge: "oak", ridge: "slab",
});
console.log("roof", JSON.stringify(rr?.bounds || rr?.shift || ""));

// two chimneys on the slopes (rise above the slope, below the ridge)
for (const x0 of [6, 19]) { fill([x0, 12, 15], [x0 + 1, 16, 16], "stone_bricks"); fill([x0, 17, 15], [x0 + 1, 17, 16], "stone_brick_slab", { type: "bottom" }); }

// ---- 5. front wall: tall windows, door bay -------------------------------------------------------------------------------------
const frontWin = (xa, xb) => {
  for (let x = xa; x <= xb; x++) {
    air([x, 5, 10], [x, 8, 10]);                                    // 1-deep reveal
    for (let y = 5; y <= 8; y++) pane(x, y, 11, "x");
    set(x, 4, 10, "deepslate_brick_slab", { type: "top" });         // sill
    put(x, 9, 10, B.stairs("deepslate_brick", "south", "top"));      // lintel
  }
  const m = (xa + xb) / 2; for (let y = 5; y <= 8; y++) set(m, y, 11, "stripped_oak_log", { axis: "y" });
};
[[2, 4], [7, 9], [17, 19], [22, 24]].forEach(([a, b]) => frontWin(a, b));
// double doors set back in the old opening; new clean glass transom + quartz surround (Operators)
air([12, 3, 10], [14, 7, 11]);
for (const [x, hinge] of [[12, "left"], [14, "right"]]) { put(x, 3, 11, B.door("dark_oak", "north", "lower", hinge)); put(x, 4, 11, B.door("dark_oak", "north", "upper", hinge)); }
set(13, 3, 11, "stripped_oak_log", { axis: "y" }); set(13, 4, 11, "stripped_oak_log", { axis: "y" });
for (let x = 12; x <= 14; x++) { pane(x, 5, 11, "x"); pane(x, 6, 11, "x"); }
for (let y = 3; y <= 7; y++) for (const x of [11, 15]) set(x, y, 10, "smooth_quartz");
for (let x = 11; x <= 15; x++) set(x, 7, 10, "smooth_quartz");
put(12, 7, 10, B.stairs("smooth_quartz", "south", "top")); put(14, 7, 10, B.stairs("smooth_quartz", "south", "top")); set(13, 7, 10, "smooth_quartz");
for (let x = 11; x <= 15; x++) set(x, 3, 9, "smooth_quartz_slab", { type: "bottom" });   // threshold
// tall window above the door (the courtroom's clerestory)
for (let x = 12; x <= 14; x++) { air([x, 9, 10], [x, 9, 10]); pane(x, 9, 11, "x"); }
// plaque: quartz board with signs and gold fittings (Operators)
for (let x = 11; x <= 15; x++) set(x, 8, 9, "smooth_quartz");
set(11, 8, 9, "gold_block"); set(15, 8, 9, "gold_block");
put(12, 8, 8, B.sign("birch", ["TRIBUNAL", "HOUSE"], { facing: "north", color: "orange", glow: true }));
put(14, 8, 8, B.sign("birch", ["HEARD", "HERE"], { facing: "north", color: "orange", glow: true }));
set(13, 8, 8, "waxed_copper_block");
// pilasters on the portico back wall
for (const x of [5, 6, 20, 21]) for (let y = 3; y <= 9; y++) set(x, y, 9, y === 3 || y === 9 ? "polished_deepslate" : "polished_andesite");

// ---- 6. side galleries: windows full of boxes of permit filings ----------------------------------------------------------------
for (const west of [true, false]) {
  const xo = west ? 1 : 25, xg = west ? 2 : 24, xi = west ? 3 : 23, f = west ? "east" : "west";
  for (const [za, zb] of [[13, 14], [17, 18]]) for (let z = za; z <= zb; z++) {
    air([xo, 5, z], [xo, 8, z]);
    for (let y = 5; y <= 8; y++) pane(xg, y, z, "z");
    set(xo, 4, z, "deepslate_brick_slab", { type: "top" });
    put(xo, 9, z, B.stairs("deepslate_brick", f, "top"));
    set(xi, 5, z, "barrel", { facing: "up", open: "false" }); set(xi, 6, z, "bookshelf"); set(xi, 7, z, "barrel", { facing: "north", open: "false" });
    set(xi, 8, z, z === za ? "bookshelf" : "barrel", z === za ? undefined : { facing: "up", open: "false" });
  }
  // portico flank: blind niche with a lantern
  for (const z of [7, 8]) { air([xo, 5, z], [xo, 8, z]); set(xg, 5, z, "polished_andesite"); }
}
// rear: three windows
for (const [xa, xb] of [[4, 6], [12, 14], [20, 22]]) for (let x = xa; x <= xb; x++) {
  air([x, 5, 21], [x, 8, 21]);
  for (let y = 5; y <= 8; y++) pane(x, y, 20, "x");
  set(x, 4, 21, "deepslate_brick_slab", { type: "top" });
  put(x, 9, 21, B.stairs("deepslate_brick", "north", "top"));
  set(x, 5, 19, "barrel", { facing: "up", open: "false" }); set(x, 6, 19, "bookshelf");
}

// ---- 7. pediment seal: scales of justice, deepslate on a bright quartz panel in a light frame (kept low: the raking verge clips the apex) ------
for (let x = 11; x <= 15; x++) for (let y = 12; y <= 15; y++) {
  const frame = x === 11 || x === 15 || y === 12 || y === 15;
  set(x, y, 3, frame ? "polished_andesite" : "smooth_quartz");
}
for (let x = 12; x <= 14; x++) set(x, 14, 3, "deepslate_tiles");                       // beam
set(13, 13, 3, "deepslate_tiles");                                                     // post
for (const x of [12, 14]) set(x, 13, 3, "deepslate_tile_slab", { type: "top" });      // pans
// rear gable: round-ish louvred window so the back gable is not a blank
for (let x = 12; x <= 14; x++) for (let y = 13; y <= 15; y++) set(x, y, 21, "deepslate_bricks");
set(13, 14, 21, "glass_pane"); set(12, 14, 21, "iron_bars"); set(14, 14, 21, "iron_bars");

// ---- 7b. side pilasters (polished andesite, deepslate foot and cap) at the window rhythm ---------------------------------------------
for (const xo of [0, 26]) for (const z of [11, 15, 19]) {
  set(xo, 3, z, "polished_deepslate");
  for (let y = 4; y <= 9; y++) set(xo, y, z, "polished_andesite");
  set(xo, 10, z, "polished_deepslate");
}

// ---- 8. life: planters, lamp posts, boxes at the door --------------------------------------------------------------------------
for (const x of [3, 23]) { set(x, 3, 8, "barrel", { facing: "up", open: "false" }); set(x, 4, 8, "azalea_leaves", { persistent: "true" }); }
for (const [x, z] of [[2, 2], [24, 2]]) { set(x, 0, z, "barrel", { facing: "up", open: "false" }); set(x, 1, z, "oak_leaves", { persistent: "true" }); }
for (const x of [9, 17]) { set(x, 3, 9, "barrel", { facing: "north", open: "false" }); set(x, 4, 9, "barrel", { facing: "north", open: "false" }); }  // filings waiting by the door

g.save(OUT);
console.log("saved", OUT, "refused", g.refused?.length ?? 0);
