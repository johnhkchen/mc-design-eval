// Tribunal House: Concord courthouse (deepslate + stripped oak) with a light Operator layer (quartz, clean glass, small gold).
// x east along the street, y up, z south; front faces NORTH (-z).
import { Grid, B, gableRoof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const OUT = new URL("./build.nbt", import.meta.url).pathname;
const g = new Grid([27, 19, 23]);
const set = (x, y, z, b, s) => g.set(x, y, z, b, s);
const put = (x, y, z, pair) => g.set(x, y, z, ...pair);
const fill = (a, b, blk, s) => g.fill(a, b, blk, s);
const air = (a, b) => g.fill(a, b, "minecraft:air");
const hash = (x, y, z) => { let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ---- palette (Concord = deepslate + oak; Operators = quartz, glass, gold) ------------------------------------------
const WALL = "deepslate_bricks", TILE = "deepslate_tiles", POL = "polished_deepslate", CHI = "chiseled_deepslate", BASE = "cobbled_deepslate";
const wallAt = (x, y, z) => { const r = hash(x, y, z); return r < 0.12 ? "cracked_deepslate_bricks" : WALL; };
const baseAt = (x, y, z) => { const r = hash(x, y, z); return y <= 1 && r < 0.12 ? "mossy_cobblestone" : r < 0.2 ? "cracked_deepslate_bricks" : y === 2 ? POL : BASE; };
const pane = (x, y, z, axis, blk = "glass_pane") => set(x, y, z, blk, axis === "x" ? { east: "true", west: "true" } : { north: "true", south: "true" });

const COLS = [[0, 1], [5, 6], [10, 11], [15, 16], [20, 21], [25, 26]];   // 2-wide, 3-wide gaps, symmetric about x=13
const FLOOR = 3;                                                          // standing level (plinth y0..2)

// ---- 1. plinth / platform + steps ----------------------------------------------------------------------------------
for (let x = 0; x <= 26; x++) for (let z = 3; z <= 22; z++) for (let y = 0; y <= 2; y++) set(x, y, z, baseAt(x, y, z));
// portico floor: polished field with tile border
for (let x = 0; x <= 26; x++) for (let z = 3; z <= 10; z++) set(x, 2, z, (x + z) % 2 === 0 && x > 1 && x < 25 && z > 6 ? TILE : POL);
// broad flight x 7..19, three risers, cheek walls
for (let z = 0; z <= 2; z++) {
  for (let x = 7; x <= 19; x++) {
    for (let y = 0; y < z; y++) set(x, y, z, BASE);
    put(x, z, z, B.stairs("deepslate_tile", "south"));
  }
  for (const xs of [[5, 6], [20, 21]]) for (const x of xs) {
    for (let y = 0; y <= z + 1; y++) set(x, y, z, baseAt(x, y, z));
    set(x, z + 2, z, "polished_deepslate_slab", { type: "bottom" });
  }
}
// landing piers at the foot of the cheeks, with lanterns
for (const x of [5, 21]) { set(x, 2, 0, "smooth_quartz"); put(x, 3, 0, B.lantern(false)); }

// ---- 2. cella (two-thick walls), ceiling, floor --------------------------------------------------------------------
for (let x = 1; x <= 25; x++) for (let y = FLOOR; y <= 11; y++) for (let z = 11; z <= 21; z++) set(x, y, z, wallAt(x, y, z));
air([3, FLOOR, 13], [23, 10, 19]);
for (let x = 3; x <= 23; x++) for (let z = 13; z <= 19; z++) set(x, 2, z, (x + z) % 2 ? POL : TILE);
// plinth course of the cella (stair lip proud of walls at the platform edge is the slab edge below)
// belt course at y=9 on side/back walls (lintel line)
for (let z = 11; z <= 21; z++) for (const x of [1, 25]) set(x, 9, z, POL);
for (let x = 1; x <= 25; x++) set(x, 9, 21, POL);

// ---- 3. portico: columns, entablature, ceiling ---------------------------------------------------------------------
for (const [xa, xb] of COLS) {
  for (let x = xa; x <= xb; x++) for (let z = 5; z <= 6; z++) {
    set(x, 3, z, POL);
    for (let y = 4; y <= 8; y++) put(x, y, z, B.log("stripped_oak", "y"));
    set(x, 9, z, CHI);
  }
  // capital + base lips: ring of upside-down / upright stairs one cell out
  for (let x = xa - 1; x <= xb + 1; x++) for (let z = 4; z <= 7; z++) {
    if (x < 0 || x > 26) continue;
    const inside = x >= xa && x <= xb && z >= 5 && z <= 6; if (inside) continue;
    const dx = x < xa ? -1 : x > xb ? 1 : 0, dz = z < 5 ? -1 : z > 6 ? 1 : 0;
    if (dx && dz) { set(x, 9, z, POL + "_slab", { type: "top" }); continue; }
    const facing = dz === -1 ? "south" : dz === 1 ? "north" : dx === -1 ? "east" : "west";
    put(x, 9, z, B.stairs("polished_deepslate", facing, "top"));
    put(x, 3, z, B.stairs("polished_deepslate", facing, "bottom"));
  }
}
// architrave (y10) and frieze (y11) across the front, z 5..6
for (let x = 0; x <= 26; x++) for (let z = 5; z <= 6; z++) {
  put(x, 10, z, B.log("stripped_oak", "x"));
  const tri = COLS.some(([a, b]) => x >= a && x <= b);
  set(x, 11, z, tri ? "oak_planks" : (x % 2 ? TILE : WALL));
}
// side beams, ceiling of the portico
for (const x of [0, 26]) { for (let z = 7; z <= 10; z++) { put(x, 10, z, B.log("stripped_oak", "z")); set(x, 11, z, TILE); } }
for (let x = 1; x <= 25; x++) for (let z = 7; z <= 10; z++) set(x, 10, z, "oak_planks");
for (const [xa] of COLS) for (let z = 7; z <= 10; z++) { put(xa === 0 ? 1 : xa, 10, z, B.log("stripped_oak", "z")); }
for (let z = 7; z <= 10; z++) for (const x of [12, 14]) put(x, 10, z, B.log("stripped_oak", "z"));
// dentil/cornice lip in front of the frieze
for (let x = 0; x <= 26; x++) {
  if (x % 2 === 0) put(x, 10, 4, B.stairs("deepslate_brick", "south", "top"));
  else set(x, 10, 4, "deepslate_brick_slab", { type: "top" });
}
// hanging lanterns between columns
for (const x of [3, 8, 13, 18, 23]) { put(x, 9, 8, B.lantern(true)); }
//
// ---- 4. roof + pediment ----------------------------------------------------------------------------------------------
const roofRes = gableRoof(g, { from: [1, 12, 5], to: [25, 21], ridge: "z", material: "deepslate_tile", pitch: 0.5, overhang: 1, gableBlock: WALL, verge: { block: "oak" } });
console.log("roof", JSON.stringify(roofRes.bounds));

// ---- 5. front wall openings (portico back wall z=11..12) -----------------------------------------------------------
const frontWin = (xa, xb) => {
  for (let x = xa; x <= xb; x++) {
    air([x, 5, 11], [x, 8, 11]);
    for (let y = 5; y <= 8; y++) pane(x, y, 12, "x", (x === (xa + xb) / 2 ? "light_gray_stained_glass_pane" : "glass_pane"));
    set(x, 4, 11, POL + "_slab", { type: "top" });                         // sill in the reveal
    put(x, 9, 11, B.stairs("polished_deepslate", "south", "top"));            // lintel stair
  }
};
[[2, 4], [7, 9], [17, 19], [22, 24]].forEach(([a, b]) => frontWin(a, b));
// doorway: 3 wide x 4 tall opening, oak doors set back, clean glass transom (Operator re-glazing), quartz surround
air([12, 3, 11], [14, 6, 12]);
for (let x = 12; x <= 14; x++) { put(x, 3, 12, B.door("dark_oak", "north", "lower", x === 14 ? "right" : "left")); put(x, 4, 12, B.door("dark_oak", "north", "upper", x === 14 ? "right" : "left")); for (const y of [5, 6]) pane(x, y, 12, "x"); }
for (let y = 3; y <= 7; y++) for (const x of [11, 15]) set(x, y, 11, "smooth_quartz");
for (let x = 11; x <= 15; x++) set(x, 7, 11, "smooth_quartz");
// sign plate (new owners): quartz board hung over the old doorway, small gold lettering
for (let x = 11; x <= 15; x++) set(x, 8, 10, "smooth_quartz");
for (const x of [12, 14]) set(x, 8, 10, "gold_block");
set(13, 8, 10, "waxed_copper_block");
put(10, 8, 10, B.stairs("smooth_quartz", "east", "bottom")); put(16, 8, 10, B.stairs("smooth_quartz", "west", "bottom"));
// threshold: fresh quartz step in front of the door
for (let x = 11; x <= 15; x++) set(x, 2, 10, "smooth_quartz_slab", { type: "top" });
// pilasters on the portico back wall flanking the openings (polished deepslate, proud 1)
for (const x of [1, 6, 10, 16, 20, 25]) for (let y = 3; y <= 9; y++) set(x, y, 10, y === 3 ? "polished_deepslate" : POL);

// ---- 6. side walls: gallery windows with filing boxes, pilasters, sills --------------------------------------------
for (const side of ["w", "e"]) {
  const xo = side === "w" ? 0 : 26, xw = side === "w" ? 1 : 25, xg = side === "w" ? 2 : 24, xi = side === "w" ? 3 : 23;
  for (const z of [11, 16, 21]) for (let y = 3; y <= 10; y++) set(xo, y, z, POL);                 // pilasters proud of the wall
  for (const [za, zb] of [[13, 14], [18, 19]]) for (let z = za; z <= zb; z++) {
    air([xw, 5, z], [xw, 8, z]);
    for (let y = 5; y <= 8; y++) pane(xg, y, z, "z");
    set(xi, 5, z, "bookshelf"); set(xi, 6, z, "barrel", { facing: "up", open: "false" }); set(xi, 7, z, "bookshelf");   // stacked filing boxes
    set(xw, 4, z, POL + "_slab", { type: "top" });
    put(xw, 9, z, B.stairs("polished_deepslate", side === "w" ? "east" : "west", "top"));
    put(xo, 4, z, B.stairs("polished_deepslate", side === "w" ? "east" : "west", "top"));                  // proud sill on the outside
  }
}
// back wall: three windows
for (const [xa, xb] of [[5, 7], [12, 14], [19, 21]]) for (let x = xa; x <= xb; x++) {
  air([x, 5, 21], [x, 8, 21]);
  for (let y = 5; y <= 8; y++) pane(x, y, 20, "x");
  set(x, 4, 21, POL + "_slab", { type: "top" });
}

// ---- 7. pediment: scales of justice + framing; acroteria ---------------------------------------------------------------
for (let x = 11; x <= 15; x++) for (let y = 13; y <= 16; y++) {
  const frame = x === 11 || x === 15 || y === 13 || y === 16;
  if (g.blockAt(x, y, 5) && g.blockAt(x, y, 5).includes("deepslate")) set(x, y, 5, frame ? CHI : POL);
}
// scales (gold) on the plate
for (const [x, y] of [[13, 14], [13, 15], [12, 15], [14, 15]]) if (g.blockAt(x, y, 5)) set(x, y, 5, "gold_block");

// acroteria at the front corners of the pediment (chiselled block + wall cap)
for (const x of [0, 26]) { set(x, 12, 4, CHI); set(x, 13, 4, "deepslate_brick_wall", {}); }
// chimneys on the rear half of the roof (two stacks, symmetric)
const topY = (x, z) => { for (let y = 18; y >= 0; y--) { const b = g.blockAt(x, y, z); if (b && b !== "minecraft:air") return y; } return -1; };
for (const xa of [5, 20]) {
  const cells = [[xa, 16], [xa + 1, 16], [xa, 17], [xa + 1, 17]];
  const lo = Math.min(...cells.map(([x, z]) => topY(x, z))), hi = Math.max(...cells.map(([x, z]) => topY(x, z))) + 3;
  for (const [x, z] of cells) { for (let y = lo; y <= Math.min(hi, 18); y++) set(x, y, z, wallAt(x, y, z)); }
  for (const [x, z] of cells) set(x, Math.min(hi, 18), z, "deepslate_brick_slab", { type: "top" });
}
g.save(OUT);
console.log(JSON.stringify({ saved: OUT, census: g.census?.() && Object.keys(g.census()).length }));
