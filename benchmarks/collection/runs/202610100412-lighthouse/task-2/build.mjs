// Coastal lighthouse + keeper's cottage. x east (front, street), y up, z south; front faces NORTH (-z).
// Tower R4 centred (5,7); cottage x8..13, z6..13 attached on the east; rocky outcrop under both (rock top y3, floor y4).
import { Grid, B, roof, cylinder, dome, disc, ringCells, circleCells, surround, fixture, planter } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const OUT = new URL("./stage.nbt", import.meta.url).pathname;
const g = new Grid([15, 28, 15]);
const set = (x, y, z, b, s) => g.set(x, y, z, b, s);
const put = (x, y, z, p) => g.set(x, y, z, ...p);
const fill = (a, b, blk, s) => g.fill(a, b, blk, s);
const air = (a, b) => g.fill(a, b, "minecraft:air");
const hash = (x, y, z) => { let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const CX = 5, CZ = 9, R = 4;

// ---- 1. rocky outcrop: rock top at y3 under the buildings, ragged ledges toward the edges ----------------------
const plateau = (x, z) => ((x - CX) ** 2 + (z - CZ) ** 2 <= 5.6 ** 2) || (x >= 7 && z >= 1 && x <= 14 && z <= 11);
const stairCol = (x) => x >= 4 && x <= 6;
const rockAt = (x, y, z) => { const r = hash(x, y, z); return r < 0.18 ? "mossy_cobblestone" : r < 0.4 ? "cobblestone" : r < 0.55 ? "andesite" : r < 0.62 ? "tuff" : "stone"; };
const heightAt = (x, z) => {
  if (plateau(x, z)) return 4;
  const dmin = Math.min(x, 14 - x, z, 14 - z);
  let h = 1 + dmin + (hash(x, 9, z) < 0.35 ? -1 : hash(x, 9, z) > 0.8 ? 1 : 0);
  if (z <= 4 && !stairCol(x)) h = Math.max(h, z + 1 - (hash(x, 3, z) < 0.4 ? 1 : 0));
  return Math.max(1, Math.min(4, h));
};
for (let x = 0; x <= 14; x++) for (let z = 0; z <= 14; z++) {
  const h = heightAt(x, z);
  for (let y = 0; y < h; y++) set(x, y, z, rockAt(x, y, z));
  // soft top: moss / grass on the ledges, bare rock on the faces
  const r = hash(x, 77, z), top = h - 1;
  if (h >= 2 && !stairCol(x) || z > 2) {
    if (z > 2 || x < 4 || x > 6) {
      if (r < 0.28) { set(x, top, z, "moss_block"); if (hash(x, 5, z) < 0.5 && top + 1 < 28 && !(plateau(x, z) && (x - CX) ** 2 + (z - CZ) ** 2 <= 4.6 ** 2)) set(x, top + 1, z, hash(x, 6, z) < 0.5 ? "short_grass" : "fern"); }
      else if (r < 0.4) set(x, top, z, "grass_block");
    }
  }
}
// the stair flight up to the door (x4..6, z2..4 -> stands at y4 at the door, z5)
for (let z = 2; z <= 4; z++) for (let x = 4; x <= 6; x++) { for (let y = 0; y <= z - 2; y++) set(x, y, z, "stone_bricks"); put(x, z - 1, z, B.stairs("stone_brick", "south")); }
for (let z = 2; z <= 4; z++) for (const x of [3, 7]) { fill([x, 0, z], [x, z - 1, z], "cobblestone"); if (z < 4) set(x, z, z, "mossy_cobblestone_slab", { type: "bottom" }); }

// ---- 2. cottage: plinth, plaster, timber, floor, interior ---------------------------------------------------------
const Z0 = 3, Z1 = 10;                                           // cottage x8..13, z3..10 (before the x-mirror)
fill([8, 3, Z0], [13, 3, Z1], "spruce_planks");                   // floor
fill([8, 4, Z0], [13, 4, Z1], "stone_bricks");                    // plinth course
for (let x = 8; x <= 13; x++) for (let z = Z0; z <= Z1; z++) if (x === 8 || x === 13 || z === Z0 || z === Z1) for (let y = 5; y <= 7; y++) set(x, y, z, "calcite");
air([9, 4, Z0 + 1], [12, 7, Z1 - 1]);
for (const [x, z] of [[8, Z0], [13, Z0], [8, Z1], [13, Z1]]) fill([x, 4, z], [x, 7, z], "stripped_spruce_log", { axis: "y" });
for (let x = 9; x <= 12; x++) { set(x, 7, Z0, "spruce_log", { axis: "x" }); set(x, 7, Z1, "spruce_log", { axis: "x" }); }
for (let z = Z0 + 1; z <= Z1 - 1; z++) { set(8, 7, z, "spruce_log", { axis: "z" }); set(13, 7, z, "spruce_log", { axis: "z" }); }
for (let x = 9; x <= 12; x++) for (let z = Z0 + 1; z <= Z1 - 1; z++) set(x, 7, z, "spruce_planks");   // ceiling
for (const z of [Z0 + 3, Z0 + 5]) for (const y of [5, 6]) set(13, y, z, "spruce_log", { axis: "y" });  // studs

// roof (before the tower so the tower wall overwrites the buried end)
const rr = roof(g, [8, Z0, 13, Z1], "cottage", {
  y: 8, ridgeAxis: "z", material: "brick", trim: "stone_brick", gable: "calcite", verge: "deepslate_tile", pitch: "steep", overhang: 1,
  chimneys: [{ at: [12, Z1 - 3], size: 2, material: "stone_bricks", rise: 2 }],
});
console.log("roof", JSON.stringify(rr?.bounds || rr?.shift || rr?.notes || ""));

// ---- 3. tower: stone ring at door level, red/white wool bands, plinth interior ----------------------------------------
const BANDS = [["red_wool", 6, 8], ["white_wool", 9, 11], ["red_wool", 12, 14], ["white_wool", 15, 17]];
cylinder(g, { base: [CX, 4, CZ], radius: R, height: 2, block: "stone_bricks", hollow: true, thickness: 1 });
for (const [blk, y0, y1] of BANDS) cylinder(g, { base: [CX, y0, CZ], radius: R, height: y1 - y0 + 1, block: blk, hollow: true, thickness: 1 });
// tower interior: clear to the ceiling, floor in stone
for (const [x, z] of circleCells(R - 1, { center: [CX, CZ] })) { set(x, 3, z, "stone_bricks"); for (let y = 4; y <= 17; y++) set(x, y, z, "minecraft:air"); }
// stone-brick belt under the stripes and a shadow ring
for (const [x, z] of circleCells(R - 1, { center: [CX, CZ] })) set(x, 18, z, "stone_bricks");

// ---- 4. gallery: corbels, floor, railing, lamps -----------------------------------------------------------------------------
const toward = (x, z) => { const dx = CX - x, dz = CZ - z; return Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? "east" : "west") : (dz > 0 ? "south" : "north"); };
disc(g, { center: [CX, 18, CZ], radius: 4, block: "stone_bricks" });
// stairs facing: back toward the wall = toward centre -> facing = direction of the centre
for (const [x, z] of ringCells(5, { center: [CX, CZ] })) put(x, 18, z, B.stairs("stone_brick", toward(x, z), "top"));
disc(g, { center: [CX, 19, CZ], radius: 5, block: "stone_bricks" });
for (const [x, z] of ringCells(5, { center: [CX, CZ] })) set(x, 19, z, hash(x, 19, z) < 0.5 ? "stone_bricks" : "chiseled_stone_bricks");
// the fence rail with connections
{
  const cells = ringCells(5, { center: [CX, CZ] }), has = new Set(cells.map(([x, z]) => `${x},${z}`)), q = (x, z) => (has.has(`${x},${z}`) ? "true" : "false");
  for (const [x, z] of cells) set(x, 20, z, "dark_oak_fence", { north: q(x, z - 1), south: q(x, z + 1), east: q(x + 1, z), west: q(x - 1, z), waterlogged: "false" });
  for (const [dx, dz] of [[0, -5], [5, 0], [0, 5], [-5, 0]]) { set(CX + dx, 20, CZ + dz, "dark_oak_fence", { waterlogged: "false" }); put(CX + dx, 21, CZ + dz, B.lantern(false)); }
}
// lantern room: dark sill, glass cage, mullions, the lamp
for (const [x, z] of ringCells(2, { center: [CX, CZ] })) {
  const mull = (x === CX || z === CZ) && (Math.abs(x - CX) === 2 || Math.abs(z - CZ) === 2) && false;
  for (const y of [20, 21, 22]) set(x, y, z, "glass");
}
for (const [dx, dz] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [-1, 2], [1, -2], [-1, -2]]) for (const y of [20, 21, 22]) set(CX + dx, y, CZ + dz, "iron_bars");
air([CX - 1, 20, CZ - 1], [CX + 1, 22, CZ + 1]);
set(CX, 20, CZ, "polished_blackstone_bricks"); set(CX, 21, CZ, "glowstone"); put(CX, 22, CZ, B.lantern(true));
// slate cap + rod + lamp
dome(g, { center: [CX, 23, CZ], radius: 3, height: 3, profile: "cone", block: "deepslate_tiles", stairsBlock: "deepslate_tile_stairs", slabBlock: "deepslate_tile_slab" });
set(CX, 26, CZ, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
put(CX, 27, CZ, B.lantern(false));

// ---- 5. tower openings: stacked slit windows per storey (4 high), door on the front -----------------------------------------
const win = (face, y) => {
  const [dx, dz] = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] }[face];
  const wx = CX + dx * R, wz = CZ + dz * R, px = dz ? 1 : 0, pz = dx ? 1 : 0;
  for (const yy of [y, y + 1]) { air([wx, yy, wz], [wx, yy, wz]); set(wx, yy, wz, "glass_pane", dz ? { east: "false", west: "false", north: "true", south: "true" } : { north: "false", south: "false", east: "true", west: "true" }); }
  for (const yy of [y, y + 1]) for (const s of [-1, 1]) set(wx + px * s, yy, wz + pz * s, "stone_bricks");
  put(wx, y - 1, wz, B.slab("stone_brick", "top"));
  const outF = face;
  put(wx, y + 2, wz, B.stairs("stone_brick", { north: "south", south: "north", east: "west", west: "east" }[outF], "top"));
  if (face === "north" || true) for (const s of [-1, 1]) set(wx + px * s, y + 2, wz + pz * s, "stone_bricks");
};
for (const y of [8, 12, 16]) { win("north", y); win("south", y); win("west", y); if (y > 11) win("east", y); }
// door: dark oak, stone-brick surround, lanterns on posts
{
  const wx = CX, wz = CZ - R;
  air([wx, 4, wz], [wx, 5, wz]);
  put(wx, 4, wz, B.door("dark_oak", "north", "lower", "left")); put(wx, 5, wz, B.door("dark_oak", "north", "upper", "left"));
  for (const s of [-1, 1]) { fill([wx + s, 4, wz], [wx + s, 5, wz], "chiseled_stone_bricks"); }
  put(wx, 6, wz, B.stairs("stone_brick", "south", "top")); set(wx - 1, 6, wz, "stone_bricks"); set(wx + 1, 6, wz, "stone_bricks");
  for (const x of [3, 7]) { set(x, 4, 2, "dark_oak_fence", { waterlogged: "false" }); put(x, 5, 2, B.lantern(false)); }
  put(wx, 3, wz - 1, B.block("stone_bricks"));
}

// ---- 6. cottage openings, shutters, door, porch ---------------------------------------------------------------------------------------
const pane = (x, y, z, axis) => set(x, y, z, "glass_pane", axis === "x" ? { east: "true", west: "true" } : { north: "true", south: "true" });
// north gable face: window x10-11, door x12, round-ish gable window
for (const x of [10, 11]) for (const y of [5, 6]) pane(x, y, Z0, "x");
put(12, 4, Z0, B.door("dark_oak", "north", "lower", "left")); put(12, 5, Z0, B.door("dark_oak", "north", "upper", "left"));
put(12, 6, Z0, B.stairs("dark_oak", "south", "top"));
for (const x of [10, 11]) put(x, 7, Z0, B.stairs("dark_oak", "south", "top"));
for (const y of [5, 6]) { put(9, y, Z0 - 1, B.trapdoor("dark_oak", "east", "bottom", true)); put(12, y, Z0 - 1, B.trapdoor("dark_oak", "west", "bottom", true)); }
for (const x of [10, 11]) set(x, 4, Z0 - 1, "spruce_slab", { type: "top" });
// east wall (x=13): two windows with shutters; south wall: one window
for (const z of [Z0 + 2, Z0 + 5]) {
  for (const y of [5, 6]) { pane(13, y, z, "z"); put(14, y, z - 1, B.trapdoor("dark_oak", "west", "bottom", true)); put(14, y, z + 1, B.trapdoor("dark_oak", "west", "bottom", true)); }
  put(14, 4, z, B.slab("spruce", "top"));
}
for (const x of [10, 11]) for (const y of [5, 6]) pane(x, y, Z1, "x");
// porch: fence posts, a stair awning, rail, flower pots, lantern
for (const x of [9, 13]) for (const y of [4, 5, 6]) set(x, y, Z0 - 2, "spruce_fence", { waterlogged: "false" });
for (let x = 9; x <= 13; x++) put(x, 7, Z0 - 2, B.stairs("spruce", "south", "bottom"));
for (const x of [10, 11]) set(x, 4, Z0 - 2, "spruce_fence", { east: "true", west: "true", waterlogged: "false" });
for (const x of [10, 11, 12]) put(x, 7, Z0 - 1, B.stairs("spruce", "south", "bottom"));
set(10, 4, Z0 - 1, "potted_poppy"); set(11, 4, Z0 - 1, "potted_cornflower");
put(12, 6, Z0 - 2, B.lantern(true));
// gable window (pane + dark frame) in the front gable
for (const x of [10, 11]) set(x, 9, Z0, "glass_pane", { east: "true", west: "true" });

// mirror in x so the cottage stands to the viewer's RIGHT from the street (north-facing front: east is the viewer's left)
const flip = { east: "west", west: "east", north: "north", south: "south", up: "up", down: "down" };
const swapLR = (v) => v.replace("left", "@").replace("right", "left").replace("@", "right");
const m = new Grid(g.size, { dataVersion: g.dataVersion });
for (const c of g.cells.values()) {
  let st = c.state ? { ...c.state } : undefined;
  if (st) {
    if (st.facing) st.facing = flip[st.facing] ?? st.facing;
    if ("east" in st || "west" in st) { const e = st.east, w = st.west; if (e !== undefined) st.west = e; else delete st.west; if (w !== undefined) st.east = w; else delete st.east; }
    if (st.shape) st.shape = swapLR(st.shape);
    if (st.hinge) st.hinge = swapLR(st.hinge);
  }
  m.set(g.size[0] - 1 - c.pos[0], c.pos[1], c.pos[2], c.block, st, c.nbt);
}
m.save(OUT);
console.log(JSON.stringify({ saved: OUT, size: g.size }));
