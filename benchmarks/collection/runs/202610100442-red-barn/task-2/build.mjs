// Red gambrel farm barn. Front (gable end) faces NORTH (-z), x along the front. Grid 15 x 17 x 21.
// Body x0..14, z2..20 (walls 1 thick), floor y0, foundation course y1, red walls y2..4, gambrel roof from y5.
// z0..1 is the farmyard apron (grass, gravel path, fence, hay, barrels).
import { Grid, B, roof, paint } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

let g = new Grid([15, 18, 21]);
const OUT = process.env.OUT ?? "build.nbt";
const put = (x, y, z, ...p) => g.set(x, y, z, ...p);
const fill = (a, b, blk, s) => g.fill(a, b, blk, s);
const air = (x, y, z) => put(x, y, z, "air");

const WALL = "red_terracotta", WHITE = "smooth_quartz", TIMBER = "dark_oak", ROOF = "deepslate_tile", LEAF = "red_nether_bricks";
const X0 = 0, X1 = 14, Z0 = 2, Z1 = 20, WT = 5, CX = 7;                 // wall footprint, wall top y, centre x
const hay = (x, y, z, axis = "x") => put(x, y, z, "hay_block", { axis });
const logB = (x, y, z, axis) => put(x, y, z, ...B.log(TIMBER, axis));

// ---- floor, foundation, walls ----
fill([X0, 0, Z0], [X1, 0, Z1], "stone_bricks");
fill([0, 0, 0], [14, 0, 1], "grass_block");
for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) {
  if (!(x === X0 || x === X1 || z === Z0 || z === Z1)) continue;
  const h = (x * 7 + z * 13) % 5;
  put(x, 1, z, h === 0 ? "cobblestone" : h === 1 ? "mossy_cobblestone" : h === 3 ? "andesite" : "stone_bricks");
  for (let y = 2; y <= WT; y++) put(x, y, z, WALL);
}
for (const x of [X0, X1]) for (const z of [Z0, Z1]) for (let y = 2; y <= WT; y++) put(x, y, z, WHITE);   // white corner boards
for (const x of [X0, X1]) for (let z = Z0 + 1; z < Z1; z++) put(x, WT, z, WHITE);                       // white eave board, long sides

// ---- roof: the granary preset (tall, dark slate) overridden to a gambrel, ridge along z, white barge boards ----
const rr = roof(g, [[X0, Z0, X1, Z1]], "granary", {
  y: WT + 1, style: "gambrel", ridgeAxis: "z", material: ROOF, gable: WALL, verge: "quartz", trim: "quartz",
  pitch: 1.5, lower: 2, upperPitch: 0.34, ridge: "slab", overhang: 0, monitor: false,
});
console.log("roof", JSON.stringify({ top: rr.top, shift: rr.shift, notes: rr.notes, refused: rr.refused }));

// ---- the sliding double door + loft door, on a gable end. dir -1 = front (north), +1 = back (south) ----
function gableEnd(zw, dir, withBeam) {
  const zi = zw - dir;                                                  // interior side of the wall
  // door opening x3..11: leaves x3..6 and x8..11 (4 wide x 4 tall) recessed one block, centre post x7, white jambs x2 / x12
  for (let x = 3; x <= 11; x++) for (let y = 1; y <= 4; y++) { air(x, y, zw); put(x, y, zi, x === CX ? TIMBER + "_planks" : LEAF); }
  for (let y = 1; y <= 4; y++) { put(2, y, zw, WHITE); put(12, y, zw, WHITE); }
  for (let x = 2; x <= 12; x++) put(x, 5, zw, WHITE);                   // header
  for (const x0 of [3, 8]) for (let i = 0; i < 4; i++) { put(x0 + i, 4 - i, zi, WHITE); put(x0 + 3 - i, 4 - i, zi, WHITE); }   // white X brace on each leaf
  // loft door: white frame x5..9, y6..9 ; opening x6..8 y7..8, open shutters, hay behind
  for (let x = 5; x <= 9; x++) { put(x, 6, zw, WHITE); put(x, 9, zw, ...B.log(TIMBER, "x")); }
  for (let y = 7; y <= 8; y++) { put(5, y, zw, WHITE); put(9, y, zw, WHITE); for (const x of [6, 7, 8]) air(x, y, zw); }
  for (let y = 7; y <= 8; y++) { put(6, y, zw, ...B.trapdoor("pale_oak", "west", "bottom", true)); put(8, y, zw, ...B.trapdoor("pale_oak", "east", "bottom", true)); }
  for (const x of [6, 7, 8]) { hay(x, 7, zi, "z"); hay(x, 7, zi - dir, "z"); }
  hay(6, 8, zi, "x"); hay(7, 8, zi - dir, "z"); hay(8, 8, zi - dir, "z");
  // windows flanking the door (1 wide x 2 tall, white lintel and sill), x1 and x13
  for (const x of [1, 13]) { air(x, 2, zw); air(x, 3, zw); put(x, 2, zi, "gray_stained_glass_pane"); put(x, 3, zi, "gray_stained_glass_pane"); put(x, 2, zi - dir, "dark_oak_planks"); put(x, 3, zi - dir, "dark_oak_planks"); }
  if (withBeam) {
    for (let x = 1; x <= 13; x++) logB(x, 6, zw + dir, "x");            // sliding-door track beam, proud
    for (const x of [2, 12]) put(x, 5, zw + dir, ...B.lantern(true));   // lanterns hung from the track
        // hoist beam over the loft door, with chain + hay bale
    logB(CX, 10, zw, "z"); logB(CX, 10, zw + dir, "z"); logB(CX, 10, zw + 2 * dir, "z");
    put(CX, 9, zw + dir, ...B.stairs(TIMBER, dir < 0 ? "south" : "north", "top"));
    for (const y of [9, 8]) put(CX, y, zw + 2 * dir, ...B.chain("y"));
    hay(CX, 7, zw + 2 * dir, "z");
  }
}
gableEnd(Z0, -1, true);
gableEnd(Z1, +1, false);
// the front lintel stairs sit on iron-bar hangers: keep bars only where they have the beam above (done)

// ---- cupola on the ridge: 3x3, red body, white corners, louvres, slate pyramid cap, weather vane ----
const CZ = Math.round((Z0 + Z1) / 2);
for (let x = CX - 1; x <= CX + 1; x++) for (let z = CZ - 1; z <= CZ + 1; z++) for (const y of [11, 12]) {
  const corner = x !== CX && z !== CZ, centre = x === CX && z === CZ;
  put(x, y, z, centre ? "air" : corner ? WHITE : WALL);
}
for (const [x, z, f] of [[CX, CZ - 1, "north"], [CX, CZ + 1, "south"], [CX - 1, CZ, "west"], [CX + 1, CZ, "east"]]) put(x, 12, z, ...B.trapdoor("spruce", f, "bottom", true));
const cap = roof(g, [[CX - 1, CZ - 1, CX + 1, CZ + 1]], "pyramid", { y: 13, material: ROOF, pitch: 1, overhang: 0, ridge: "none", contrast: false });
console.log("cap", JSON.stringify({ top: cap.top, shift: cap.shift }));
const capTop = cap.top;
put(CX, capTop + 1, CZ, "iron_bars");
for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) put(CX + dx, capTop + 2, CZ + dz, "iron_bars");   // vane arrow + compass cross
put(CX, capTop + 2, CZ, "iron_bars");

// ---- side walls: paired dark windows on a rhythm, white sills ----
for (const x of [X0, X1]) for (const z0 of [4, 8, 12, 16]) {
  if (x === X1 && z0 === 8) continue;                                   // east man-door goes at z9 beside z8
  for (const z of [z0, z0 + 1]) { for (const y of [2, 3]) { put(x, y, z, "gray_stained_glass_pane"); put(x === X0 ? 1 : 13, y, z, "dark_oak_planks"); } }
}
for (const x of [X0, X1]) for (const z of [6, 10, 14, 18]) {        // dark board-and-batten posts between the window pairs
  if (x === X1 && z === 10) continue;
  for (let y = 2; y <= 4; y++) put(x, y, z, ...B.log(TIMBER, "y"));
}
// east man-door at z9: spruce door, white frame, hung lantern
{ const x = X1, z = 9, f = "east";
  air(x, 2, z); air(x, 3, z);
  put(x, 1, z, ...B.door("spruce", f, "lower")); put(x, 2, z, ...B.door("spruce", f, "upper"));
  for (const dz of [-1, 1]) for (let y = 1; y <= 3; y++) put(x, y, z + dz, WHITE);
  put(x, 3, z, WHITE); put(x, 4, z, WHITE);
}
// ---- yard: gravel path, fence with gap at the doors, hay bales, barrels, tufts ----
fill([4, 0, 0], [10, 0, 1], "gravel");
for (let x = 0; x <= 14; x++) if (x <= 3 || x >= 11) put(x, 1, 0, ...B.fence("oak"));
for (const x of [0, 14]) put(x, 1, 1, ...B.fence("oak"));
put(3, 1, 1, ...B.fence("oak")); put(11, 1, 1, ...B.fence("oak"));
hay(1, 1, 1, "x"); hay(2, 1, 1, "x"); hay(1, 2, 1, "z"); hay(2, 1, 0 + 0 === 0 ? 1 : 1, "x");
hay(12, 1, 1, "x"); hay(13, 1, 1, "x"); hay(13, 2, 1, "x"); hay(12, 2, 1, "z");
put(4, 1, 1, "barrel", { facing: "up", open: "false" }); put(10, 1, 1, "barrel", { facing: "up", open: "false" });
for (const [x, z] of [[1, 0], [3, 0 + 1], [12, 0], [11, 0], [2, 0]]) if (g.blockAt(x, 1, z) === "minecraft:air") put(x, 1, z, "short_grass");

g.save(OUT);
console.log(JSON.stringify({ saved: OUT, size: g.size, refused: g.refused }));
