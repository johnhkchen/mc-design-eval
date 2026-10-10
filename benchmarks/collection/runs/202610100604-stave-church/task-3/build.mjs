// Nordic stave church, 13 x 17 x ~22. Front faces NORTH (-z). x east, y up, z south.
// Stage 1 (walls, gallery, plinth) -> shell.nbt; the roof then comes from the church preset (see ROOF below).
import { Grid, B, load } from "../../../../../minecraft-design/tools/src/build.mjs";
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const HERE = new URL(".", import.meta.url).pathname;
const g = new Grid([13, 30, 17]);
const W = 13, D = 17;
const WALL = "dark_oak_planks", STUD = "stripped_spruce_log", POST = "stripped_spruce", RAIL = "spruce";
const FL = 1;               // plinth top course; walking surface is y=2
const TOP = 6;              // wall top (eave course is y=7)

const at = (x, y, z, ...b) => g.set(x, y, z, ...b);
const put = (x, y, z, id, st) => (st ? at(x, y, z, id, st) : at(x, y, z, id));
const hash = (a, b) => ((a * 73856093) ^ (b * 19349663)) >>> 0;

// ---- plinth: 2 courses, mixed stone, quoins at the corners ------------------------------------------------------
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const h = hash(x, z) % 10;
  put(x, 0, z, h < 4 ? "mossy_stone_bricks" : h < 7 ? "cobblestone" : "stone_bricks");
  put(x, FL, z, edge && (x + z) % 4 === 0 ? "polished_andesite" : h < 2 ? "mossy_stone_bricks" : "stone_bricks");
}
for (const [x, z] of [[0, 0], [W - 1, 0], [0, D - 1], [W - 1, D - 1]]) { put(x, 0, z, "polished_andesite"); put(x, FL, z, "polished_andesite"); }
// nave floor (inside x4..8, z4..12)
for (let x = 4; x <= 8; x++) for (let z = 4; z <= 12; z++) put(x, FL, z, "spruce_planks");

// ---- entrance steps (stone-brick stairs, facing = the high back, so south) ---------------------------------------
for (const x of [5, 6, 7]) at(x, 0, 0, ...B.stairs("stone_brick", "south"));
at(6, FL, 1, ...B.stairs("stone_brick", "south"));
// ---- nave walls: perimeter of x3..9, z3..13, y2..TOP -------------------------------------------------------------
const NX0 = 3, NX1 = 9, NZ0 = 3, NZ1 = 13;
for (let y = FL + 1; y <= TOP; y++) for (let x = NX0; x <= NX1; x++) for (let z = NZ0; z <= NZ1; z++) {
  if (!(x === NX0 || x === NX1 || z === NZ0 || z === NZ1)) continue;
  const stud = ((x === NX0 || x === NX1) ? (z - NZ0) % 2 === 0 : (x - NX0) % 2 === 0);
  put(x, y, z, stud ? STUD : WALL, stud ? { axis: "y" } : undefined);
}
// ---- gallery (svalgang): posts on the F perimeter x1..11, z1..15 every 2 ----------------------------------------
const posts = [];
for (let x = 1; x <= 11; x += 2) { posts.push([x, 1], [x, 15]); }
for (let z = 3; z <= 13; z += 2) { posts.push([1, z], [11, z]); }
for (const [x, z] of posts) for (let y = FL + 1; y <= TOP; y++) at(x, y, z, ...B.log(POST));
// railings (1 high) between posts, except the front gap at x=6
const rail = (x, z) => at(x, FL + 1, z, `${RAIL}_fence`, {});
for (let x = 2; x <= 10; x += 2) { if (x !== 6) rail(x, 1); rail(x, 15); }
for (let z = 2; z <= 14; z += 2) { rail(1, z); rail(11, z); }
// gallery floor trim: a spruce slab walkway edge is plinth stone; fine.

// ---- openings in the nave ---------------------------------------------------------------------------------------
// front door (x=6, z=3), 2 tall
at(6, FL + 1, NZ0, ...B.door("spruce", "north", "lower", "left"));
at(6, FL + 2, NZ0, ...B.door("spruce", "north", "upper", "left"));
// timber frame above the door
for (const x of [5, 6, 7]) at(x, FL + 3, NZ0, ...B.log(POST, "x"));
at(5, FL + 1, NZ0, ...B.log(POST)); at(5, FL + 2, NZ0, ...B.log(POST));
at(7, FL + 1, NZ0, ...B.log(POST)); at(7, FL + 2, NZ0, ...B.log(POST));
// back door (x=6, z=13)
at(6, FL + 1, NZ1, ...B.door("spruce", "south", "lower", "left"));
at(6, FL + 2, NZ1, ...B.door("spruce", "south", "upper", "left"));
// side/back lattice windows (dark oak trapdoor shutters + panes) at y=FL+2 (one block up)
const win = (x, z, along) => { // along: 'x' means wall runs along x (north/south wall)
  put(x, FL + 2, z, "glass_pane", along === "x" ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" });
  put(x, FL + 3, z, "glass_pane", along === "x" ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" });
};
for (const z of [5, 8, 11]) { win(NX0, z, "z"); win(NX1, z, "z"); }
for (const x of [4, 8]) { win(x, NZ0, "x"); win(x, NZ1, "x"); }

g.save(HERE + "shell.nbt");
console.log("shell saved; refused:", g.refused?.length ?? 0);

// ---- ROOF: church preset (tiers 2, gable top, spire tower), slate shingle mix with dark-oak eave/ridge, from roof.json -----
execFileSync("node", ["/Volumes/ext1/swe/repos/minecraft-design/tools/bin/mcd.mjs", "roof", HERE + "shell.nbt", HERE + "roofed.nbt", "--spec", HERE + "roof.json"], { stdio: "inherit" });

// ---- DETAIL pass on the roofed build ------------------------------------------------------------------------------
const d = load(HERE + "roofed.nbt");
const dat = (x, y, z, ...b) => d.set(x, y, z, ...b);
// gallery beam: a spruce log course joining the post tops (y=TOP), skipping the front door bay
for (let x = 2; x <= 10; x += 2) { if (x !== 6) dat(x, TOP, 1, ...B.log("stripped_spruce", "x")); dat(x, TOP, 15, ...B.log("stripped_spruce", "x")); }
for (let z = 2; z <= 14; z += 2) { dat(1, TOP, z, ...B.log("stripped_spruce", "z")); dat(11, TOP, z, ...B.log("stripped_spruce", "z")); }
// door lanterns: chain from the eave, lantern hanging beside the door, a name sign over it
for (const x of [5, 7]) { dat(x, TOP, 2, ...B.chain("y")); dat(x, TOP - 1, 2, ...B.lantern(true)); }
dat(6, TOP - 1, 2, ...B.sign("spruce", ["STAVKIRKE", "", "", ""], { facing: "north", color: "white" }));
// stone-wall posts with lanterns flanking the steps
for (const x of [4, 8]) { dat(x, FL + 1, 0, ...B.wall("stone_brick")); dat(x, FL + 2, 0, ...B.lantern(false)); }

// dragon heads on both ridge ends (z=2 front, z=14 back); dir = +1 faces out to the back, -1 to the front
function dragon(zr, out) {
  const away = out < 0 ? "south" : "north";          // stairs' full back faces away from the snout
  dat(6, 18, zr, ...B.block("dark_oak_planks"));
  dat(6, 19, zr, ...B.block("dark_oak_planks"));
  dat(6, 20, zr, ...B.stairs("dark_oak", away, "bottom"));                 // brow sloping out
  dat(6, 21, zr, ...B.slab("dark_oak", "bottom"));                         // crest
  dat(6, 19, zr + out, ...B.stairs("dark_oak", away, "top"));              // upper jaw
  dat(6, 20, zr + out, ...B.block("dark_oak_planks"));                     // snout
  dat(6, 18, zr + out, ...B.trapdoor("dark_oak", out < 0 ? "north" : "south", "bottom", true));   // lower jaw
}
dragon(2, -1); dragon(14, 1);
d.save(HERE + "build.nbt");
console.log("build saved; refused:", d.refused?.length ?? 0);
