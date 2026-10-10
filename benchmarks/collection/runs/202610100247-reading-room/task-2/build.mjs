// The Reading Room — Charter Row annex. Grid 7 x 7 x 9; front faces north (-z); x along the street.
// Body x0..5, z1..7, floor y0, walls y1..3, roof from y4 (top y6). Lane x6 = garden strip with the open gate.
import { Grid, roof, B } from "../../../../../minecraft-design/tools/src/build.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "build-base.nbt");
const g = new Grid([7, 7, 9]);
const P = { wall: "stone_bricks", plinth: "deepslate_bricks", band: "tuff_bricks", post: "oak_log", beam: "stripped_oak_log" };
const X0 = 0, X1 = 5, Z0 = 1, Z1 = 7, TOP = 4;
const set = (x, y, z, b, s, n) => (Array.isArray(b) ? g.set(x, y, z, ...b) : g.set(x, y, z, b, s, n));

// --- ground: interior planks, paved apron, lane path ---
g.fill([X0, 0, Z0], [X1, 0, Z1], "oak_planks");
g.fill([0, 0, 0], [6, 0, 0], "stone_bricks");                 // street apron
g.fill([0, 0, 8], [6, 0, 8], "stone_bricks");
for (let z = 1; z <= 7; z++) set(6, 0, z, B.slab("cobblestone"));  // lane path
for (let z = 1; z <= 7; z++) set(6, 0, z, z % 2 ? "cobblestone" : "mossy_cobblestone");
g.fill([0, 0, 8], [5, 0, 8], "mossy_stone_bricks");

// --- walls (hollow box), plinth, band ---
for (let y = 1; y <= TOP; y++)
  for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) {
    const edge = x === X0 || x === X1 || z === Z0 || z === Z1;
    if (!edge) continue;
    set(x, y, z, y === 1 ? P.plinth : y === TOP ? P.band : P.wall);
  }
// oak corner posts (full height)
for (const [x, z] of [[X0, Z0], [X1, Z0], [X0, Z1], [X1, Z1]]) for (let y = 1; y <= TOP; y++) set(x, y, z, B.log("oak"));
// stripped-oak beam over the door and across the back
set(1, TOP, Z0, B.log("oak", "x"));   // lintel beam over the door

// --- front (north, z1). Seen from the street east is on the LEFT: door x1, shutters x2 & x4, window x3, lane x6 on the left ---
set(3, 2, Z0, B.pane()); set(3, 3, Z0, B.pane());
for (const x of [2, 4]) for (const y of [2, 3]) set(x, y, 0, B.trapdoor("spruce", "south", "bottom", true));   // open shutters flat on the wall
set(3, 1, 0, B.slab("stone_brick", "top"));
set(3, 4, 0, B.fence("oak")); set(3, 3, 0, ...B.lantern(true));   // lantern on a bracket over the window                      // sill
set(3, 2, 0, "potted_red_tulip");                               // window-box
// door, set one block back inside a reveal
set(1, 1, Z0, "air"); set(1, 2, Z0, "air");
set(1, 1, Z0 + 1, ...B.door("oak", "north", "lower", "left")); set(1, 2, Z0 + 1, ...B.door("oak", "north", "upper", "left"));
set(1, 0, 0, "stone_brick_slab", { type: "top" });             // doorstep
// hand-painted board above the door, on the wall
set(1, 3, 0, ...B.sign("oak", ["READING", "ROOM"], { facing: "north", color: "black" }));
// barrel by the door with a lantern on it
set(0, 1, 0, "barrel", { facing: "up", open: "false" });
set(0, 2, 0, ...B.lantern(false));
set(5, 1, 0, "potted_azure_bluet");

// --- curtains: red banner, white centre stripe, just behind the window ---
for (const y of [2, 3]) set(3, y, Z0 + 1, ...B.banner("red", [["stripe_center", "white"]], { facing: "south" }));

// --- back (south, z7): window x2, small door-less wall with lantern ---
set(2, 2, Z1, B.pane()); set(2, 3, Z1, B.pane());
set(3, 2, Z1, B.pane()); set(3, 3, Z1, B.pane());
for (const x of [1, 4]) for (const y of [2, 3]) set(x, y, Z1 + 1, B.trapdoor("spruce", "north", "bottom", true));
set(2, 1, Z1 + 1, "potted_dandelion");
// --- west (x0): window at z3..4 ---
for (const z of [3, 4]) for (const y of [2, 3]) set(X0, y, z, B.pane());
// --- east (x5), lane side: two windows with shutters ---
for (const z of [3, 5]) for (const y of [2, 3]) set(X1, y, z, B.pane());

// --- lane (x6): open gate, hedge, fence ---
set(6, 1, 0, ...["oak_fence_gate", { facing: "north", open: "true", in_wall: "false" }]);
set(6, 1, 1, B.fence("oak"));
for (const z of [3, 4, 5, 6]) { set(6, 1, z, "oak_leaves", { persistent: "true", distance: "1" }); }
set(6, 2, 4, "oak_leaves", { persistent: "true", distance: "1" });
for (const z of [3, 5]) for (const y of [2, 3]) set(6, y, z, B.trapdoor("spruce", "west", "bottom", true));
set(6, 1, 2, "potted_cornflower"); set(6, 1, 7, "potted_red_tulip");


// --- interior ---
set(1, 1, 3, "bookshelf"); set(1, 2, 3, "bookshelf"); set(1, 1, 4, "bookshelf"); set(1, 2, 4, "bookshelf"); set(1, 1, 5, "bookshelf"); set(1, 2, 5, "bookshelf");
set(1, 1, 6, "bookshelf"); set(1, 2, 6, "chiseled_bookshelf", { facing: "east" });
set(3, 1, 2, "lectern", { facing: "north", has_book: "true", powered: "false" });   // desk under the window
set(3, 1, 3, B.stairs("spruce", "north", "bottom"));                                        // clerk's stool
set(4, 1, 5, "red_bed", { facing: "south", part: "foot" }); set(4, 1, 6, "red_bed", { facing: "south", part: "head" });
set(2, 4, 4, ...B.chain("y", false)); set(2, 3, 4, ...B.chain("y", false)); set(2, 2, 4, ...B.lantern(true));
set(2, 1, 6, "barrel", { facing: "up", open: "false" }); set(3, 1, 6, "chest", { facing: "north", type: "single", waterlogged: "false" });

// --- roof: deepslate-tile gable, ridge along x, via the roof tool ---
const r = roof(g, [[X0, Z0, X1, Z1]], "gable", { y: TOP + 1, material: "deepslate_tiles", pitch: 0.4, overhang: 0, ridgeAxis: "x", ridge: "none", gable: P.wall });
console.log(JSON.stringify({ roof: r.top, size: g.size, refused: g.refused }));
// eave lips: upside-down deepslate-tile stairs at y5 along the north (z0) and south (z8) roof edges, one block past the wall
for (let x = X0; x <= X1; x++) {
  set(x, TOP + 1, 0, B.stairs("deepslate_tile", "south", "top"));
  set(x, TOP + 1, 8, B.stairs("deepslate_tile", "north", "top"));
}
// gable-end attic windows (after the roof fills the gable)
set(X0, 5, 4, B.pane()); set(X1, 5, 4, B.pane());
g.save(OUT);
if (process.env.DEBUG_TOP) { let top = 0; for (let y = 0; y < g.size[1]; y++) for (let x = 0; x < 7; x++) for (let z = 0; z < 9; z++) { const b = g.get ? g.get(x, y, z) : null; if (b && b[0] !== "air") { top = y; if (y>=6) console.log(x,y,z,JSON.stringify(b).slice(0,60)); } } console.log("top y", top); }
