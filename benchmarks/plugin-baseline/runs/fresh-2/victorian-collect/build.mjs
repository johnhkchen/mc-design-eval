// Stage 1 (FORM) of the Victorian painted-lady townhouse: massing, openings, porch roof.
// Writes form.nbt; then `mcd roof` (mansard preset + turret cap) -> roofed.nbt; then detail.mjs -> build.nbt (see make.sh).
// x east, y up, z south; the street is north (z < 0).
import { Grid, shell, carve, B, cylinder, gableRoof } from "../../../../../../minecraft-design/tools/src/build.mjs";

const g = new Grid([26, 40, 30]);

// ---- palette by role -------------------------------------------------------------------------------------------
export const P = {
  body: "light_blue_concrete_powder",     // dominant: soft sky-blue siding
  base: "stone_bricks",              // plinth
  trim: "smooth_quartz",             // cream trim: corner boards, belts, surrounds
  gable: "cherry_planks",            // pink fish-scale gables
  gold: "bamboo_planks",             // gold sunburst accent
  floor: "birch_planks",
};

// ---- levels ----------------------------------------------------------------------------------------------------
// y1 plinth, y2 floor/plinth top, storey 1 walls y3..8 (windows y4..7), floor 2 at y9, storey 2 walls y10..15
// (windows y11..14), wall top y15, roof from y16.
export const M = { x0: 4, x1: 20, z0: 6, z1: 25, wallTop: 15 };

const pane = "glass_pane";
const solid = (a, b, block, state) => g.fill(a, b, block, state);
const win = (face, a, b, y0, y1) => { // glass pane run in the wall plane. face north/south: a..b are x, plane z; east/west: a..b are z, plane x
  for (let u = a[0]; u <= a[1]; u++) for (let y = y0; y <= y1; y++) face === "z" ? g.set(u, y, b, pane) : g.set(b, y, u, pane);
};

// ---- main block ------------------------------------------------------------------------------------------------
shell(g, [M.x0, 1, M.z0], [M.x1, M.wallTop, M.z1], P.body, { floor: false, ceiling: false });
solid([M.x0, 1, M.z0], [M.x1, 1, M.z1], P.base);                        // foundation slab
for (const y of [1, 2]) shell(g, [M.x0, y, M.z0], [M.x1, y, M.z1], P.base, { floor: false, ceiling: false });   // plinth ring
solid([M.x0 + 1, 2, M.z0 + 1], [M.x1 - 1, 2, M.z1 - 1], P.floor);
solid([M.x0 + 1, 9, M.z0 + 1], [M.x1 - 1, 9, M.z1 - 1], P.floor);
solid([M.x0 + 1, 15, M.z0 + 1], [M.x1 - 1, 15, M.z1 - 1], P.floor);

// ---- canted bay (x16..20): front x17..19 at z4, splays at x16 / x20 on z5, two storeys -------------------------------
const bayWall = (x, z) => solid([x, 1, z], [x, M.wallTop, z], P.body);
for (const x of [17, 18, 19]) bayWall(x, 4);
for (const x of [16, 20]) bayWall(x, 5);
for (const [x, z] of [[17, 4], [18, 4], [19, 4], [16, 5], [20, 5]]) solid([x, 1, z], [x, 2, z], P.base);
solid([16, 1, 4], [20, 1, 5], P.base);
solid([17, 2, 5], [19, 2, 5], P.floor); solid([17, 9, 5], [19, 9, 5], P.floor);
solid([17, 3, 5], [19, 8, 5], "air"); solid([17, 10, 5], [19, 14, 5], "air");
solid([17, 3, 6], [19, 8, 6], "air"); solid([17, 10, 6], [19, 14, 6], "air");   // open the main wall into the bay
for (const y of [3, 10]) solid([17, y, 5], [19, y, 5], "air");
// the bay's top: ceiling of its upper storey
solid([17, 15, 4], [19, 15, 5], P.body);
for (const [y0, y1] of [[4, 7], [11, 13]]) {
  win("z", [17, 19], 4, y0, y1);
  for (const x of [16, 20]) for (let y = y0; y <= y1; y++) g.set(x, y, 5, pane);
}

// ---- turret: round tower at the NW corner, centre (7,7) radius 3 --------------------------------------------------
cylinder(g, { base: [7, 1, 7], radius: 3, height: 2, block: P.base, hollow: false });
cylinder(g, { base: [7, 3, 7], radius: 3, height: 17, block: P.body, hollow: true, thickness: 1 });
// open the turret into the house: clear main-wall cells inside the tube
solid([5, 3, 6], [9, 15, 9], "air");  // (tube re-run below)
for (const y of [2, 9, 15]) for (let x = 5; x <= 9; x++) for (let z = 5; z <= 9; z++) if ((x - 7) ** 2 + (z - 7) ** 2 <= 4 + 1) solid([x, y, z], [x, y, z], P.floor);   // floors only inside the tube
// the tube's own cells are kept by re-running the hollow shell over the cleared box
cylinder(g, { base: [7, 3, 7], radius: 3, height: 17, block: P.body, hollow: true, thickness: 1 });
// turret windows: a 3-pane window on the N face and on the W face of the tube, both storeys (the attic storey is added with the tube top)
for (const [y0, y1] of [[4, 7], [11, 13]]) for (let k = 6; k <= 8; k++) for (let y = y0; y <= y1; y++) { g.set(k, y, 4, pane); g.set(4, y, k, pane); }

// ---- front wall openings (north, z=6): entry door + sidelights, upper triple window ---------------------------------
const doorBlock = (half) => ["spruce_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" }];
g.set(13, 3, 6, ...doorBlock("lower")); g.set(13, 4, 6, ...doorBlock("upper"));
win("z", [12, 12], 6, 3, 5); win("z", [14, 14], 6, 3, 5); g.set(13, 5, 6, pane);
win("z", [12, 14], 6, 11, 13);

// ---- side and back windows (pitch 5 so the surrounds' jambs never merge into one white wall) -------------------------
for (const [y0, y1] of [[4, 7], [11, 13]]) {
  for (const z of [[12, 13], [17, 18], [22, 23]]) win("x", z, M.x0, y0, y1);               // west wall
  for (const z of [[8, 9], [13, 14], [18, 19], [23, 24]]) win("x", z, M.x1, y0, y1);        // east wall
  for (const x of [[7, 8], [16, 17]]) win("z", x, M.z1, y0, y1);                              // back wall
}
win("z", [11, 13], M.z1, 11, 13);                                                             // back stair window
// back door at x=12..13 with a stoop
g.set(12, 3, M.z1, ...["spruce_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }]);
g.set(12, 4, M.z1, ...["spruce_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }]);
for (const x of [11, 12, 13]) solid([x, 1, 26], [x, 2, 27], P.base);
g.set(12, 1, 28, ...B.stairs("stone_brick", "north", "bottom"));
solid([12, 2, 27], [12, 2, 27], P.base);
g.set(12, 2, 28, "air");

// ---- entry porch: deck, steps, gabled roof ----------------------------------------------------------------------------
solid([11, 1, 3], [15, 1, 5], P.base);
solid([11, 2, 3], [15, 2, 5], P.base);
g.set(13, 1, 2, ...B.stairs("stone_brick", "south", "bottom"));         // step up from the garden path
g.set(12, 1, 2, ...B.stairs("stone_brick", "south", "bottom"));
g.set(14, 1, 2, ...B.stairs("stone_brick", "south", "bottom"));
// porch gable: ridge along z, gable end faces the street at z=3
gableRoof(g, { from: [11, 8, 3], to: [15, 5], ridge: "z", material: "deepslate_tile", pitch: 1, overhang: 0, gableBlock: P.gable, verge: { block: "smooth_quartz" } });

// hall behind the front door: a back wall and a runner so the sidelights look into a room, not an empty box
solid([11, 3, 9], [15, 8, 9], "stripped_birch_log", { axis: "y" });
solid([12, 3, 7], [14, 3, 8], "red_carpet");

// ground: lawn
for (let x = 0; x < 26; x++) for (let z = 0; z < 30; z++) if (g.blockAt(x, 0, z) === "minecraft:air" || !g.blockAt(x, 0, z)) g.set(x, 0, z, "grass_block");

g.save(new URL("./form.nbt", import.meta.url).pathname);
console.log("form.nbt written; refused:", g.refused?.length ?? 0);
