// Stage 3 (DETAIL): relief + craft brushes on the roofed house. cap.nbt -> build.nbt.
// Order: massing details (bay gablet, porch) -> bands and belts (construction, not recolour) -> opening brushes -> garden -> life.
import {
  load, B, replace, carve, gableRoof, surround, glazing, pilaster, planter, fixture, signboard, bunting, plaque,
} from "../../../../../../minecraft-design/tools/src/build.mjs";

const here = (f) => new URL(`./${f}`, import.meta.url).pathname;
const g = load(here("cap.nbt"));

const P = { body: "light_blue_concrete_powder", base: "stone_bricks", trim: "smooth_quartz", pink: "cherry", gold: "quartz" };
const BODY = `minecraft:${P.body}`;
const set = (x, y, z, ...b) => g.set(x, y, z, ...b);
const stair = (mat, facing, half = "bottom", shape = "straight") => B.stairs(mat, facing, half, shape);
const OUT = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const IN = { north: "south", south: "north", east: "west", west: "east" };
const air = (x, y, z) => !g.inBounds(x, y, z) || /air$/.test(g.blockAt(x, y, z) ?? "air");

// outward facing of a wall cell: a horizontal ray to the edge of the grid that meets nothing (so it is the street side,
// not the interior). Several -> the dominant axis away from the building (or turret) centre.
function outward(x, y, z) {
  const free = [];
  for (const [d, [dx, dz]] of Object.entries(OUT)) {
    let px = x + dx, pz = z + dz, ok = true;
    while (g.inBounds(px, y, pz)) { if (!air(px, y, pz)) { ok = false; break; } px += dx; pz += dz; }
    if (ok) free.push(d);
  }
  if (free.length <= 1) return free[0] ?? null;
  const [cx, cz] = x <= 10 && z <= 10 ? [7, 7] : [12, 15.5];
  const ax = x - cx, az = z - cz;
  const pref = Math.abs(ax) >= Math.abs(az) ? (ax > 0 ? "east" : "west") : (az > 0 ? "south" : "north");
  return free.includes(pref) ? pref : free[0];
}
const eachBody = (y, fn) => { for (let x = 0; x < 26; x++) for (let z = 0; z < 30; z++) if (g.blockAt(x, y, z) === BODY) fn(x, z, outward(x, y, z)); };

// ---- 1. canted bay roof: a gablet in front of the mansard, pink fish-scale in its end ---------------------------------
carve(g, [16, 16, 4], [20, 19, 5]);
gableRoof(g, { from: [16, 16, 4], to: [20, 5], ridge: "z", material: "deepslate_tile", pitch: 1, overhang: 0, gableBlock: `${P.pink}_planks`, verge: { block: "smooth_quartz" } });

// ---- 2. bands: pink shingle band under the eave (stair lips = fish-scale ledges), quartz belt course between storeys --------
eachBody(14, (x, z, f) => f && set(x, 14, z, ...stair(P.pink, IN[f], "bottom")));
eachBody(15, (x, z, f) => f && set(x, 15, z, `${P.pink}_planks`));
eachBody(9, (x, z, f) => {                                              // belt: full quartz course + an upside-down stair lip proud of it
  if (!f) return;
  set(x, 9, z, "smooth_stone");
  const [dx, dz] = OUT[f];
  if (!(x <= 10 && z <= 10) && !(x >= 11 && x <= 15 && z === 6) && air(x + dx, 9, z + dz)) set(x + dx, 9, z + dz, ...B.slab("smooth_quartz", "top"));   // a slim top-slab lip, not a stair, so it does not stack on the hoods
});
// corner boards: quartz pillars up the back corners
for (const [x, z] of [[4, 25], [20, 25]]) for (let y = 3; y <= 13; y++) if (g.blockAt(x, y, z) === BODY) set(x, y, z, "quartz_pillar", { axis: "y" });


// ---- 3. entry porch: turned posts, header, brackets, ceiling, rails, steps, door set ----------------------------------------
const PORCH = { x0: 11, x1: 15, z0: 3, z1: 5, deck: 2 };
for (const x of [11, 15]) {
  set(x, 3, 3, "polished_andesite");                                    // post base
  for (const y of [4, 5, 6]) set(x, y, 3, "pale_oak_fence");                          // spindle shaft
  set(x, 7, 3, "smooth_quartz");                                                    // capital block
}
for (let x = 12; x <= 14; x++) set(x, 7, 3, "smooth_quartz");    // header between the posts
for (let x = 11; x <= 15; x++) for (let z = 4; z <= 5; z++) set(x, 7, z, "smooth_quartz");   // porch ceiling
set(12, 6, 3, ...stair("stone_brick", "west", "top")); set(14, 6, 3, ...stair("stone_brick", "east", "top"));   // knee brackets
set(13, 6, 3, "pale_oak_fence");                                                       // spindle drop at the centre
for (const x of [11, 15]) set(x, 3, 4, "pale_oak_fence");                             // side rails
for (const x of [11, 15]) { set(x, 3, 5, "pale_oak_fence"); }
for (const x of [12, 14]) set(x, 6, 4, ...B.lantern(true));                         // hanging lanterns either side of the door
set(11, 1, 2, ...B.wall("stone_brick")); set(15, 1, 2, ...B.wall("stone_brick")); set(11, 2, 2, ...B.wall("stone_brick")); set(15, 2, 2, ...B.wall("stone_brick"));   // step cheeks
set(12, 3, 5, "potted_pink_tulip"); set(14, 3, 5, "potted_azure_bluet");                // pots by the door
// sunburst in the porch gable: gold rays fanned over the pink
set(13, 8, 3, "polished_andesite"); set(12, 8, 3, ...stair("polished_andesite", "south")); set(14, 8, 3, ...stair("polished_andesite", "south")); set(13, 9, 3, "polished_andesite");
set(13, 11, 3, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
// door set: classical surround over the door + sidelights + transom, then a fanlight bar
surround(g, { at: [14, 3, 6], face: "north", width: 3, height: 3, preset: "classical", trim: "polished_andesite", door: true });
for (const x of [11, 15]) pilaster(g, { at: [x, 3, 6], face: "north", height: 6, out: 1, material: "smooth_quartz", profile: "classical" });

// ---- 4. windows: classical surrounds, then glazing bars; bay and turret get their own ------------------------------------
const CREAM = "smooth_quartz";
const SIDE = "cherry_planks";                                                       // polychrome: pink jambs and hoods on the flanks, cream on the front
const win = (face, a, b, y0, h, preset = "classical", plane, trim = CREAM) => {
  const at = face === "north" ? [b, y0, plane] : face === "south" ? [a, y0, plane] : face === "east" ? [plane, y0, b] : [plane, y0, a];
  surround(g, { at, face, width: b - a + 1, height: h, preset, trim, ...(preset === "classical" ? { keystone: "chiseled_stone_bricks" } : {}) });
  if (preset === "classical") {                                                       // a grey stone lintel under the cream hood, so the two read apart
    const [ox, oz] = OUT[face], alongX = face === "north" || face === "south";
    for (let u = a - 1; u <= b + 1; u++) { const p = alongX ? [u, y0 + h, plane] : [plane, y0 + h, u]; if (g.blockAt(...p) === "minecraft:smooth_quartz") set(...p, "smooth_stone"); }
  }
};
// flank and back windows: hood + sill in cream, open pink shutters either side (a brush-free trim so the jambs do not stripe the wall)
const FACE_IN = { north: "south", south: "north", east: "west", west: "east" };
function flank(face, a, b, y0, h, plane, shutters = true) {
  const [ox, oz] = OUT[face], alongX = face === "north" || face === "south";
  const cell = (u, y, d) => alongX ? [u, y, plane + oz * d] : [plane + ox * d, y, u];
  for (let u = a - 1; u <= b + 1; u++) {
    if (g.blockAt(...cell(u, y0, 0)) === "minecraft:quartz_pillar") continue;           // never run a hood or sill across a corner board
    set(...cell(u, y0 + h, 1), ...stair("smooth_quartz", FACE_IN[face], "top"));       // drip hood
    set(...cell(u, y0 - 1, 1), ...B.slab("smooth_quartz", "top"));                      // sill
  }
  if (!shutters) return;
  for (const u of [a - 1, b + 1]) for (let y = y0; y < y0 + h; y++) set(...cell(u, y, 1), ...B.trapdoor("cherry", FACE_IN[face], "bottom", true));
}
for (const [y0, h] of [[4, 4], [11, 3]]) {
  win("north", 17, 19, y0, h, "classical", 4);                                       // bay front
  win("north", 16, 16, y0, h, "plain", 5); win("north", 20, 20, y0, h, "plain", 5);  // bay splays
  for (const [a, b] of [[8, 9], [13, 14], [18, 19], [23, 24]]) flank("east", a, b, y0, h, 20);
  for (const [a, b] of [[12, 13], [17, 18], [22, 23]]) flank("west", a, b, y0, h, 4);
  for (const [a, b] of [[7, 8], [16, 17]]) flank("south", a, b, y0, h, 25);
}
flank("south", 11, 13, 11, 3, 25);
win("north", 12, 14, 11, 3, "classical", 6);
// turret: 3-pane windows on the N and W faces, cream hoods and sills; the quartz ring under the cap
for (const [y0, h] of [[4, 4], [11, 3], [18, 3]]) { win("north", 6, 8, y0, h, "classical", 4); win("west", 6, 8, y0, h, "classical", 4); }
eachBody(22, (x, z, f) => { set(x, 22, z, CREAM); });                                // quartz ring under the cap
eachBody(8, () => {});

// hood and sill ends that overhang the round turret / the canted bay hang in air: trim them back to the window width
for (const y of [3, 8, 10, 14, 17, 21]) for (const [x, z] of [[5, 3], [9, 3], [3, 5], [3, 9], [16, 3], [20, 3]]) if (/smooth_quartz_(stairs|slab)$/.test(g.blockAt(x, y, z) || "")) set(x, y, z, "air");
for (const [x, y, z] of [[3, 13, 7], [13, 13, 5]]) if (g.blockAt(x, y, z) === "minecraft:stone_bricks") set(x, y, z, "air");   // two stray dentils left by the eave

// ---- 5. garden: dwarf wall + iron railings, gate pillars with lamps and signs, path, beds, hedge --------------------
for (let x = 2; x <= 24; x++) {
  const pillar = [2, 6, 11, 15, 20, 24].includes(x);
  if (x >= 12 && x <= 14) continue;                                                  // the gate
  if (pillar) { for (const y of [1, 2]) set(x, y, 1, "stone_bricks"); set(x, 3, 1, ...B.wall("stone_brick")); if (x === 11 || x === 15) set(x, 4, 1, ...B.lantern(false)); }
  else { set(x, 1, 1, ...B.wall("stone_brick")); set(x, 2, 1, "iron_bars"); set(x, 3, 1, "iron_bars"); }
}
for (let x = 12; x <= 14; x++) for (const z of [0, 1]) set(x, 0, z, "stone_bricks");   // path
const bed = ["pink_tulip", "azure_bluet", "pink_tulip", "oxeye_daisy", "cornflower", "pink_tulip"];   // pink + white (+ a little blue): the house's own families
for (let x = 3; x <= 23; x++) for (let z = 2; z <= 3; z++) {
  if (x >= 11 && x <= 15) continue;
  if ((x * 7 + z * 13) % 5 === 4) continue;                                          // rest areas
  set(x, 1, z, bed[(x * 3 + z * 5) % bed.length]);
}
for (let z = 2; z <= 28; z++) for (const x of [2, 23]) for (const y of [1]) set(x, y, z, (x + y + z) % 4 === 0 ? "flowering_azalea_leaves" : "azalea_leaves", { persistent: "true", distance: "7", waterlogged: "false" });
// the house name and number on the gate pillars
set(11, 2, 0, ...B.sign("spruce", ["No. 7", "", "1887"], { facing: "north", color: "black" }));
set(15, 2, 0, ...B.sign("spruce", ["THE PAINTED", "LADY", "TOWNHOUSE"], { facing: "north", color: "black" }));
// window boxes under the bay's ground-floor windows
planter(g, { at: [19, 3, 4], face: "north", width: 3, kind: "box" });

// ---- 6. life: a pennant on the turret tip, the back stoop's roof, gold fish-scale in the bay gable ----------------------------
set(7, 35, 7, "smooth_quartz"); set(7, 36, 7, "smooth_quartz");
set(7, 37, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
set(7, 36, 6, ...B.banner("pink", [["triangle_top", "white"], ["border", "white"]], { facing: "north" }));   // a pennant hung off the finial post
for (let x = 17; x <= 19; x++) set(x, 17, 4, "smooth_quartz");                                  // cream course in the bay gable
set(18, 18, 4, ...stair("smooth_quartz", "south"));
// back stoop: two posts and a small gabled hood over the door
for (const x of [10, 14]) { for (let y = 3; y <= 6; y++) set(x, y, 27, "pale_oak_fence"); set(x, 2, 27, "stone_bricks"); set(x, 1, 27, "stone_bricks"); }
for (const x of [10, 14]) set(x, 7, 27, "smooth_quartz");
gableRoof(g, { from: [10, 8, 26], to: [14, 27], ridge: "x", material: "deepslate_tile", pitch: 1, overhang: 0, gableBlock: "cherry_planks", verge: { block: "smooth_quartz" } });
for (const x of [11, 12, 13]) set(x, 7, 26, "smooth_quartz");
set(12, 6, 26, ...B.lantern(true));

// window boxes under the ground-floor flank windows (pink + white blooms; they stand in for the cream sill slab)
const BLOOM = ["pink_tulip", "azure_bluet"];
for (const [a, b] of [[8, 9], [13, 14], [18, 19], [23, 24]]) planter(g, { at: [20, 3, b], face: "east", width: 2, kind: "box", plants: BLOOM });
for (const [a, b] of [[12, 13], [17, 18], [22, 23]]) planter(g, { at: [4, 3, a], face: "west", width: 2, kind: "box", plants: BLOOM });
// stray blocks the cap and the eave left sticking out sideways
for (const [x, y, z] of [[12, 25, 14], [12, 25, 17], [6, 30, 4], [7, 31, 4], [8, 30, 4], [7, 31, 11], [12, 25, 15], [12, 25, 16], [7, 31, 10], [7, 31, 9], [7, 31, 8], [7, 31, 6], [7, 31, 5]]) if (!air(x, y, z)) set(x, y, z, "air");

g.save(here("build.nbt"));
console.log(JSON.stringify({ saved: "build.nbt", refused: g.refused?.length ?? 0 }));
