// Modern glass café. Designed in "u" (as the concept is seen from the street: u=0 is the viewer's left, which is the
// +x end of a north-facing build), then mapped x = 16 - u. Front faces NORTH (-z).
import { Grid, B, roof, plaque, planter, fixture, face } from "../../../../../minecraft-design/tools/src/build.mjs";

const g = new Grid([17, 7, 13]);
const W = 17;
const X = (u) => W - 1 - u;
const mf = (s) => (s && s.facing ? { ...s, facing: face.mirrorX(s.facing) } : s);
const put = (u, y, z, block, state, nbt) => g.set(X(u), y, z, block, mf(state), nbt);
const fill = (u0, y0, z0, u1, y1, z1, block, state) => {
  for (let u = Math.min(u0, u1); u <= Math.max(u0, u1); u++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) put(u, y, z, block, state);
};
const putB = (u, y, z, b) => put(u, y, z, ...b);

// palette: concrete plinth (light) / dark steel + slate roof (dark) / spruce timber (warm) / glass + quartz interior
const P = { plinth: "polished_andesite", deck: "smooth_stone", steel: "black_concrete", slate: "deepslate_tiles", panel: "deepslate_bricks", timber: "spruce_planks", floor: "smooth_quartz" };

// ---- plinth (y0): whole 17x13 slab, edge ring in plinth block, field in smooth stone -------------------------------
fill(0, 0, 0, 16, 0, 12, P.deck);
for (let u = 0; u <= 16; u++) for (let z = 0; z <= 12; z++) if (u === 0 || u === 16 || z === 0 || z === 12) put(u, 0, z, P.plinth);
// entry steps: half-height course in front of the door (rise 1 = two half steps)
for (let u = 6; u <= 9; u++) putB(u, 0, 0, B.slab("smooth_stone", "bottom"));
// interior floor
fill(2, 0, 5, 12, 0, 10, P.floor);

// ---- core: walls u1..13, z4..11, steel frame, glass on the front (u7..12) and the u13 side -------------------------
const posts = { front: [1, 6, 9, 13], side: [4, 7, 11] };
// dark solid walls first (panel front u1..5, back z11, u1 side wall), glass elsewhere
fill(1, 1, 4, 5, 4, 4, P.panel);          // front panel
fill(1, 1, 11, 13, 4, 11, P.panel);       // back wall
fill(1, 1, 4, 1, 4, 11, P.panel);         // u1 side
// glass faces
fill(7, 1, 4, 12, 4, 4, "glass");    // front glass
fill(13, 1, 5, 13, 4, 10, "glass");  // side glass
// steel frame: posts, head rail y4 skipped (glass to the soffit), sill rail y1 inside frame
for (const u of posts.front) fill(u, 1, 4, u, 4, 4, P.steel);
for (const z of posts.side) fill(13, 1, z, 13, 4, z, P.steel);
fill(13, 1, 4, 13, 4, 4, P.steel);
fill(13, 1, 11, 13, 4, 11, P.steel);
fill(1, 1, 11, 1, 4, 11, P.steel);
// double door u7..8 (replaces glass), transom stays glass
for (const [u, hinge] of [[7, "right"], [8, "left"]]) {
  putB(u, 1, 4, B.door("dark_oak", "north", "lower", hinge));
  putB(u, 2, 4, B.door("dark_oak", "north", "upper", hinge));
}
// glass sidelights flank the door: panes already at u9? post there; add a lantern pair at the door
// west wall (u1) slit windows
fill(1, 2, 6, 1, 4, 7, "glass_pane");
fill(1, 2, 9, 1, 4, 9, "glass_pane");
// back clerestory + service door
for (const u of [3, 4, 5, 7, 8]) fill(u, 3, 11, u, 4, 11, "glass_pane");
putB(11, 1, 11, B.door("dark_oak", "south", "lower", "left"));
putB(11, 2, 11, B.door("dark_oak", "south", "upper", "left"));
// frame rails: steel header band at the top of the panel/back so the glass reads as framed

// ---- timber soffit + dark fascia + roof deck ------------------------------------------------------------------------
// roof footprint u0..15, z2..12 (2 over the front and u13 side, 1 elsewhere)
fill(0, 5, 2, 15, 5, 12, P.timber);
for (let u = 0; u <= 15; u++) for (let z = 2; z <= 12; z++) if (u === 0 || u === 15 || z === 2 || z === 12) { put(u, 5, z, P.slate); }
// recessed downlights in the soffit
for (const u of [3, 7, 11, 14]) for (const z of [3, 6, 9]) if (!(u === 14 && z === 9)) put(u, 5, z, "glowstone");
// the roof itself, from the preset
roof(g, [[X(15), 2, X(0), 12]], "modern", { y: 6, parapet: 0, rail: false, eave: "plain", material: "deepslate_tile", trim: "deepslate_tile", grow: false, contrast: false, protect: new Set() });

// ---- sign: neon CAFE on the dark panel ---------------------------------------------------------------------------
plaque(g, "CAFE", { at: [X(1), 3, 4], face: "north", width: 5, height: 2, material: P.panel, letter: "orange_concrete", style: "banner" });
for (let u = 2; u <= 4; u++) put(u, 2, 4, "shroomlight");   // neon underline
// glowing OPEN sign beside the door, wall lanterns flanking the entrance and the service door
putB(5, 2, 3, B.sign("spruce", ["", "OPEN", "7AM - 5PM", ""], { facing: "north", color: "orange", glow: true }));
// back wall: planter bed + wall lantern at the service door
planter(g, { at: [X(4), 1, 11], face: "south", width: 3, kind: "ground", depth: 1 });
fixture(g, { at: [X(10), 2, 11], face: "south", mount: "arm" });
// ---- terrace --------------------------------------------------------------------------------------------------------
const chair = (u, z, dir) => putB(u, 1, z, B.stairs("spruce", dir, "bottom"));
const table = (u, z) => { put(u, 1, z, "spruce_fence"); putB(u, 2, z, B.trapdoor("dark_oak", "north", "bottom", false)); };
// front terrace tables (z1..2 under/outside the cantilever) and the u14..16 side terrace
for (const u of [8, 11]) { table(u, 2); chair(u - 1, 2, "west"); chair(u + 1, 2, "east"); }
table(15, 6); chair(15, 5, "north"); chair(15, 7, "south");
table(15, 10); chair(15, 9, "north"); chair(15, 11, "south");
table(3, 1); chair(3, 0, "north"); 
// glass screens along the terrace edge (z0 and u16), steel posts every 3
const screen = (u, z, post) => (post ? put(u, 1, z, "black_concrete") : put(u, 1, z, "glass"));
for (let u = 0; u <= 16; u++) if (!(u >= 6 && u <= 9)) screen(u, 0, u % 8 === 0 || u === 16);
for (let z = 1; z <= 12; z++) screen(16, z, z === 12 || z === 6);
// planters: ground beds beside the steps, hedge against the panel
planter(g, { at: [X(10), 1, 0], face: "north", width: 2, kind: "ground", depth: 1 });
planter(g, { at: [X(2), 1, 3], face: "north", width: 3, kind: "ground", depth: 1 });
for (const u of [1, 2]) { for (let y = 1; y <= 3; y++) put(u, y, 3, "oak_leaves", { persistent: "true", distance: "7" }); put(u, 1, 3, "spruce_planks"); }
// hanging lanterns: pendants inside, terrace
for (const [u, z] of [[4, 7], [8, 7], [11, 7], [8, 3], [12, 3], [14, 7], [14, 9]]) {
  putB(u, 4, z, B.chain("y"));
  putB(u, 3, z, B.lantern(true));
}
// counter + back bar
fill(4, 1, 9, 11, 1, 9, "smooth_quartz");
fill(4, 2, 9, 11, 2, 9, "polished_andesite_slab", { type: "bottom", waterlogged: "false" });
fill(4, 1, 10, 11, 1, 10, "spruce_planks");
fill(4, 2, 10, 11, 2, 10, "bookshelf");
for (const u of [4, 6, 8, 10]) putB(u, 1, 8, B.stairs("spruce", "north", "bottom"));

g.save(new URL("./build.nbt", import.meta.url).pathname);
console.log(JSON.stringify({ saved: "build.nbt" }));
