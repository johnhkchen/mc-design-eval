// Coastal lighthouse + keeper's cottage. Generator for build.nbt. x east, y up, z south; front faces NORTH (-z).
// STAGES: node build.mjs  -> walls.nbt (no roofs)   then roofs applied in-code (DRY=1 prints the roof reports only).
import { Grid, B, boulder, cylinder, circleCells, ringCells, roof, surround, fixture, planter, glazing } from "../../../../../minecraft-design/tools/src/build.mjs";

const DRY = !!process.env.DRY;
const g = new Grid([15, 28, 15]);
const TX = 4, TZ = 6;                       // tower centre
const COT = { x0: 7, x1: 13, z0: 5, z1: 12 };  // cottage walls
const GROUND = 3;                           // rock top (surface block y)
const W = "minecraft:";

// ---- 1. ROCK BASE: ragged heightmap, mixed stone, moss and grass on the ledges --------------------------------------
const hash = (x, z, s = 0) => { let h = (x * 374761393 + z * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const protectedCell = (x, z) => (Math.hypot(x - TX, z - TZ) <= 4.6) || (x >= COT.x0 - 1 && x <= COT.x1 + 1 && z >= COT.z0 - 1 && z <= COT.z1 + 2) || (x >= 2 && x <= 6 && z <= 2);  // under tower, cottage, stair run
const dist = (x, z) => { let d = 99; for (let a = 0; a < 15; a++) for (let b = 0; b < 15; b++) if (protectedCell(a, b)) d = Math.min(d, Math.hypot(a - x, b - z)); return d; };
const heights = [];
for (let z = 0; z < 15; z++) { heights[z] = []; for (let x = 0; x < 15; x++) heights[z][x] = protectedCell(x, z) ? GROUND : Math.max(0, GROUND - Math.floor(dist(x, z) * 1.15 + hash(x, z) * 1.5)); }
const ROCK = [["stone", 34], ["cobblestone", 26], ["andesite", 14], ["mossy_cobblestone", 18], ["stone_bricks", 8]];
const pickRock = (r) => { let t = r * 100; for (const [b, w] of ROCK) { if ((t -= w) < 0) return b; } return "stone"; };
for (let z = 0; z < 15; z++) for (let x = 0; x < 15; x++) {
  const h = heights[z][x];
  for (let y = 0; y <= h; y++) g.set(x, y, z, pickRock(hash(x, z, y + 3)));
  const top = hash(x, z, 9), exposed = !(Math.hypot(x - TX, z - TZ) <= 4.6) && !(x >= COT.x0 - 1 && x <= COT.x1 + 1 && z >= COT.z0 && z <= COT.z1);
  if (exposed) {
    if (top < 0.38) { g.set(x, h, z, "grass_block", { snowy: "false" }); if (hash(x, z, 5) < 0.6) g.set(x, h + 1, z, hash(x, z, 6) < 0.5 ? "short_grass" : "fern"); }
    else if (top < 0.55) { g.set(x, h, z, "moss_block"); if (hash(x, z, 7) < 0.4) g.set(x, h + 1, z, "moss_carpet"); }
  }
}
// ---- stair run to the door (z 0..1, x 3..5), widest at the bottom ----------------------------------------------------
for (const x of [3, 4, 5]) {
  for (let y = 0; y <= 2; y++) g.set(x, y, 1, "stone_bricks"); for (let y = 0; y <= 1; y++) g.set(x, y, 0, "stone_bricks");
  g.set(x, 3, 1, ...B.stairs("stone_brick", "south")); g.set(x, 2, 0, ...B.stairs("stone_brick", "south"));
  for (let y = 3; y <= 3; y++) g.set(x, y, 2, "stone_bricks");
}
for (const x of [2, 6]) { g.set(x, 3, 1, "mossy_stone_bricks"); g.set(x, 2, 0, "mossy_stone_bricks"); g.set(x, 3, 0, ...B.slab("stone_brick")); }   // cheek walls

// ---- 2. TOWER ------------------------------------------------------------------------------------------------------
// plinth r=4 (y4-5), set-in course of stairs at y6 (r 3..4), shaft r=3 y6..16 in 3-high bands, corbel y17, deck y18, lantern room y19..22
cylinder(g, { base: [TX, 4, TZ], radius: 4, height: 2, block: "stone_bricks", hollow: true, thickness: 1 });
for (const [x, z] of circleCells(4, { center: [TX, TZ] })) {
  const d = Math.hypot(x - TX, z - TZ); if (d <= 3.5) continue;
  const dx = x - TX, dz = z - TZ, facing = Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? "west" : "east") : (dz > 0 ? "north" : "south");
  g.set(x, 6, z, ...B.stairs("stone_brick", facing));
}
const BANDS = [["red_concrete", 6], ["smooth_quartz", 9], ["red_concrete", 12], ["smooth_quartz", 15]];
for (const [block, y] of BANDS) cylinder(g, { base: [TX, y, TZ], radius: 3, height: y === 15 ? 2 : 3, block, hollow: true, thickness: 1 });
g.fill([TX - 3, 3, TZ - 3], [TX + 3, 3, TZ + 3], "stone_bricks");        // (under the tower is rock anyway)
// floor of the tower interior (plank) and landings
for (const [x, z] of circleCells(2, { center: [TX, TZ] })) { g.set(x, 3, z, "spruce_planks"); for (const y of [10, 15]) g.set(x, y, z, "spruce_planks"); }
// ladder up the west inside wall, hatches in landings
g.set(TX - 3, 4, TZ, "stone_bricks"); g.set(TX - 3, 5, TZ, "stone_bricks");
for (let y = 4; y <= 18; y++) g.set(TX - 2, y, TZ, "ladder", { facing: "east", waterlogged: "false" });
for (const y of [10, 15]) g.set(TX - 2, y, TZ, "ladder", { facing: "east", waterlogged: "false" });
// corbel course y17: solid at r<=3, upside-down stairs out to r=4
for (const [x, z] of circleCells(4, { center: [TX, TZ] })) {
  const d = Math.hypot(x - TX, z - TZ), dx = x - TX, dz = z - TZ;
  if (d <= 3.5) { if (d > 2.5) g.set(x, 17, z, "stone_bricks"); continue; }
  const facing = Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? "west" : "east") : (dz > 0 ? "north" : "south");
  g.set(x, 17, z, ...B.stairs("stone_brick", facing, "top"));
}
// deck y18 r=4 (hatch over the ladder)
for (const [x, z] of circleCells(4, { center: [TX, TZ] })) g.set(x, 18, z, hash(x, z, 2) < 0.2 ? "mossy_stone_bricks" : "stone_bricks");
g.set(TX - 2, 18, TZ, ...B.trapdoor("spruce", "east", "bottom", false));
// gallery railing y19: connected dark-oak fence ring on r=4, lanterns on posts
const ring4 = ringCells(4, { center: [TX, TZ], connected: 8 }), r4 = new Set(ring4.map(([x, z]) => `${x},${z}`));
for (const [x, z] of ring4) g.set(x, 19, z, "dark_oak_fence", { north: String(r4.has(`${x},${z - 1}`)), south: String(r4.has(`${x},${z + 1}`)), east: String(r4.has(`${x + 1},${z}`)), west: String(r4.has(`${x - 1},${z}`)), waterlogged: "false" });
for (const [dx, dz] of [[0, -4], [0, 4], [-4, 0], [4, 0], [-3, -3], [3, -3], [-3, 3], [3, 3]]) { const x = TX + dx, z = TZ + dz; if (r4.has(`${x},${z}`)) g.set(x, 20, z, ...B.lantern(false)); }
// lantern room y19..22: glass panes in dark-oak posts, lamp in the middle
const ring2 = ringCells(2, { center: [TX, TZ], connected: 8 }), r2 = new Set(ring2.map(([x, z]) => `${x},${z}`));
for (const [x, z] of ring2) {
  const post = (Math.abs(x - TX) === 2 && Math.abs(z - TZ) <= 1 && (z - TZ) !== 0) || (Math.abs(z - TZ) === 2 && Math.abs(x - TX) <= 1 && (x - TX) !== 0) || (Math.abs(x - TX) === 2 && Math.abs(z - TZ) === 2);
  const cardinal = (x === TX || z === TZ);
  for (let y = 19; y <= 22; y++) {
    if (cardinal) g.set(x, y, z, "dark_oak_log", { axis: "y" });
    else g.set(x, y, z, "glass_pane", { north: String(r2.has(`${x},${z - 1}`)), south: String(r2.has(`${x},${z + 1}`)), east: String(r2.has(`${x + 1},${z}`)), west: String(r2.has(`${x - 1},${z}`)), waterlogged: "false" });
  }
}
g.set(TX, 19, TZ, "stone_bricks"); g.set(TX, 20, TZ, "glowstone"); g.set(TX, 21, TZ, "glowstone");
for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.set(TX + dx, 21, TZ + dz, "air");
// (the glass has no solid floor gap: door onto the gallery at the south face)
g.set(TX, 19, TZ + 2, ...B.door("spruce", "south", "lower")); g.set(TX, 20, TZ + 2, ...B.door("spruce", "south", "upper"));

// ---- 3. TOWER OPENINGS: door + slit windows -------------------------------------------------------------------------
// door at north plinth face z=2 (x=4): carve and hang a door
g.set(TX, 4, 2, ...B.door("dark_oak", "north", "lower")); g.set(TX, 5, 2, ...B.door("dark_oak", "north", "upper"));
for (const y of [4, 5]) for (const z of [3]) g.set(TX, y, z, "air");
for (const y of [4, 5]) g.set(TX, y, 3, "air");

const slit = (x, y, z, face) => {
  // a 1x2 window in the shaft wall at the extremity cell, glass set into the wall
  for (const dy of [0, 1]) g.set(x, y + dy, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false", ...(face === "north" || face === "south" ? { east: "true", west: "true" } : { north: "true", south: "true" }) });
};
const WIN = [];
for (const y of [7, 11, 14]) { WIN.push([TX, y, TZ - 3, "north"]); WIN.push([TX, y, TZ + 3, "south"]); WIN.push([TX - 3, y, TZ, "west"]); }
WIN.push([TX + 3, 14, TZ, "east"]);
for (const [x, y, z, f] of WIN) slit(x, y, z, f);

// ---- 4. COTTAGE WALLS (ridge along x: the long eave side faces the street, the west gable runs into the tower) ------
const { x0, x1, z0, z1 } = COT;
const inTower = (x, z) => Math.hypot(x - TX, z - TZ) <= 4.5;
const cset = (x, y, z, ...a) => { if (!inTower(x, z)) g.set(x, y, z, ...a); };
for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
  const edge = x === x0 || x === x1 || z === z0 || z === z1;
  if (!inTower(x, z)) g.set(x, 3, z, "spruce_planks");
  if (!edge) continue;
  cset(x, 4, z, hash(x, z, 1) < 0.35 ? "mossy_cobblestone" : "cobblestone");
  for (let y = 5; y <= 7; y++) cset(x, y, z, "calcite");
}
// dark-oak timber: corner + intermediate posts, beam under the eaves
for (const x of [x0, x1]) for (const z of [z0, z1]) for (let y = 4; y <= 6; y++) cset(x, y, z, "dark_oak_log", { axis: "y" });
for (const z of [z0, z1, 8, 9]) for (const x of [x0, x1]) for (let y = 4; y <= 6; y++) if (z === z0 || z === z1) cset(x, y, z, "dark_oak_log", { axis: "y" });
for (let x = x0; x <= x1; x++) for (const z of [z0, z1]) cset(x, 7, z, "stripped_dark_oak_log", { axis: "x" });
for (let z = z0 + 1; z < z1; z++) for (const x of [x0, x1]) cset(x, 7, z, "stripped_dark_oak_log", { axis: "z" });
// openings: door + window on the street front, windows around
g.set(10, 4, z0, ...B.door("spruce", "north", "lower")); g.set(10, 5, z0, ...B.door("spruce", "north", "upper"));
g.set(10, 3, z0 - 1, "stone_bricks");
const pane = (x, y, z) => g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
const WINC = [[12, z0, "north"], [9, z1, "south"], [12, z1, "south"], [x1, 7, "east"], [x1, 10, "east"], [x0, 11, "west"]];
for (const [x, z] of WINC) for (const y of [5, 6]) pane(x, y, z);
// flagstones from the cottage door to the tower stair
for (const [x, z] of [[10, 4], [10, 3], [9, 3], [8, 3], [7, 3], [6, 3], [10, 2]]) g.set(x, 3, z, "stone_bricks");

if (DRY) console.log("(walls only)");
g.save("walls.nbt");

// ---- 5. ROOFS --------------------------------------------------------------------------------------------------------
const R = {
  cottage: { ...roof(g, [[x0, z0, x1, z1]], "cottage", { y: 8, dryRun: DRY, grow: false, material: { mix: [["bricks", 60], ["granite", 25], ["polished_granite", 15]], eave: "mud_bricks", ridge: "stone_bricks", verge: "cobbled_deepslate", gradient: "none" }, gable: "calcite", ridgeAxis: "x", overhang: { north: 1, south: 1, east: 1, west: 0 }, why: "west eave abuts the lighthouse tower: concept shows the cottage roof running into the tower wall", chimneys: [{ at: [12, 9], size: 1, material: "stone_bricks", rise: 2 }] }) },
};
console.log("SHIFT", JSON.stringify(R.cottage.shift), JSON.stringify(R.cottage.bounds), g.size);
console.log("COTTAGE", JSON.stringify({notes:R.cottage.notes,warnings:R.cottage.warnings,look:R.cottage.lookNotes,facts:R.cottage.facts}, null, 1).slice(0, 2500));
const cap = roof(g, [[TX - 2, TZ - 2, TX + 2, TZ + 2]], "lantern-cap", { y: 23, dryRun: DRY, grow: false, material: "dark-slate", why: "concept: dark slate lantern cap above a white and red tower" });
console.log("CAP", JSON.stringify({notes:cap.notes,warnings:cap.warnings,look:cap.lookNotes,facts:cap.facts}, null, 1).slice(0, 2500));

// ---- 6. DETAIL PASS (craft brushes) ----------------------------------------------------------------------------------
const log = [];
const note = (n, r) => { log.push(`${n}: ${r.cells} cells${r.skipped ? ` (${r.skipped} skipped)` : ""}${r.notes?.length ? " " + r.notes.join("; ") : ""}`); };
// tower windows: stone surrounds (classical hood + sill); `at` = bottom-left as seen from outside
const leftOf = { north: [1, 0], south: [-1, 0], east: [0, -1], west: [0, 1] };   // (u=0 cell) shift not needed for width 1
if (!DRY) {
  // tower windows: restraint — a proud sill slab and a stone lintel with a stair hood (a full surround eats the stripes on a 3-wide face)
  const OUT = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }, IN = { north: "south", south: "north", east: "west", west: "east" };
  for (const [x, y, z, f] of WIN) {
    const [ox, oz] = OUT[f];
    g.set(x, y + 2, z, "stone_bricks");
    g.set(x + ox, y + 2, z + oz, ...B.stairs("stone_brick", IN[f], "top"));
    g.set(x + ox, y - 1, z + oz, ...B.slab("stone_brick", "top"));
    g.set(x + ox, y - 1 + 0, z + oz, ...B.slab("stone_brick", "top"));
    log.push(`window ${f}@${y}`);
  }
  // tower door: keystone over the door, lanterns on brackets either side
  g.set(TX, 6, 2, "chiseled_stone_bricks");
  for (const x of [2, 6]) note("door lantern", fixture(g, { at: [x, 5, 2], face: "north", mount: "bracket", bracket: "stone_bricks" }));
  // cottage: shutters beside the windows, flower box, door hood, lanterns, front fence
  note("cottage lantern", fixture(g, { at: [9, 6, 5], face: "north", mount: "arm", arm: "dark_oak_fence" }));
  note("planter N", planter(g, { at: [12, 4, 5], face: "north", width: 1, kind: "box", rim: "spruce_trapdoor" }));
  note("planter S", planter(g, { at: [9, 4, 12], face: "south", width: 1, kind: "box", rim: "spruce_trapdoor" }));
}
// shutters beside the windows: open trapdoors on the wall face (hinged on the wall side)
const OUTV = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] }, INV = { north: "south", south: "north", east: "west", west: "east" };
for (const [x, z, f] of WINC) {
  const [ox, oz] = OUTV[f], along = f === "north" || f === "south" ? [1, 0] : [0, 1];
  for (const side of [-1, 1]) { const sx = x + along[0] * side + ox, sz = z + along[1] * side + oz; if (sx < 0 || sx > 14 || sz < 0 || sz > 14) continue;
    for (const y of [5, 6]) g.set(sx, y, sz, ...B.trapdoor("spruce", INV[f], "bottom", true)); }
}
// timber lintel over the door
g.set(10, 6, 5, "stripped_dark_oak_log", { axis: "x" });
// rock details: a boulder, a front fence along the cottage lawn, a flower bed
try { boulder(g, [11, 4, 2], [1.6, 1.4, 1.3], { moss: 0.3 }); } catch (e) { log.push("boulder: " + e.message); }
for (const x of [9, 11, 12, 13]) g.set(x, 4, 4, "dark_oak_fence", { north: "false", south: "false", east: String(x < 13 && x !== 9), west: String(x > 11), waterlogged: "false" });
for (const [x, z, b] of [[12, 3, "poppy"], [11, 3, "cornflower"], [10, 3, "oxeye_daisy"], [9, 3, "red_tulip"], [13, 3, "allium"]]) { if (g.blockAt(x, 3, z).includes("stone") || true) g.set(x, 3, z, "grass_block", { snowy: "false" }); g.set(x, 4, z, b); }

// plinth weathering: cracked and mossy courses (hand-rolled weather: no brush call on a round wall)
for (const [x, z] of ringCells(4, { center: [TX, TZ], connected: 8 })) for (const y of [4, 5]) {
  if (g.blockAt(x, y, z) !== W + "stone_bricks") continue;
  const h = hash(x, z, y + 40); if (h < 0.18) g.set(x, y, z, "mossy_stone_bricks"); else if (h < 0.34) g.set(x, y, z, "cracked_stone_bricks");
}
// vines on the rock ledges: wherever a lower rock column sits against a higher one, the higher face grows a vine
const VN = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
let vines = 0;
for (let x = 0; x < 15; x++) for (let z = 0; z < 15; z++) for (const [face, [dx, dz]] of Object.entries(VN)) {
  const nx = x + dx, nz = z + dz; if (nx < 0 || nx > 14 || nz < 0 || nz > 14) continue;
  if (protectedCell(x, z) && protectedCell(nx, nz)) continue;
  const h = heights[z][x], hn = heights[nz][nx];
  for (let y = h + 1; y <= hn; y++) {
    if (hash(x * 3 + dx, z * 5 + dz, y + 77) > 0.42) continue;
    if (g.blockAt(x, y, z) !== W + "air" || g.blockAt(nx, y, nz) === W + "air") continue;
    g.set(x, y, z, "vine", { north: String(face === "north"), south: String(face === "south"), east: String(face === "east"), west: String(face === "west"), up: "false" }); vines++;
  }
}
log.push(`vines: ${vines}`);
// east gable: a small attic window with shutters
for (const z of [8, 9]) g.set(13, 9, z, "glass_pane", { north: String(z === 9), south: String(z === 8), east: "false", west: "false", waterlogged: "false" });
for (const z of [7, 10]) g.set(14, 9, z, ...B.trapdoor("spruce", "west", "bottom", true));
// a name post by the stair foot
g.set(7, 4, 2, ...B.sign("spruce", ["KEEPER'S", "COTTAGE", "& LIGHT"], { wall: false, rotation: 8 }));
g.set(7, 3, 2, "stone_bricks");

console.log(log.join("\n"));
g.save("build.nbt");
console.log("saved build.nbt", g.size, "refused:", g.refused?.length ?? 0);
