// SEA1270127532: Denny Way strip, two storeys (restaurant/retail below, offices above).
// Local (0,0) = box corner (442,485); x east, z south. North face (z=0) is the street front.
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
import { readFileSync } from "node:fs";

const ID = "SEA1270127532";
const MAN = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const b = MAN.buildings.find((q) => q.id === ID);
const [X0, Z0] = [442, 485];
const W = 49, D = 19, HMAX = 16;

const FP = new Set(b.footprint.map(([x, z]) => `${x - X0},${z - Z0}`));
const inFP = (x, z) => FP.has(`${x},${z}`);
const ring = (x, z) => inFP(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inFP(x + dx, z + dz));
const put = (x, y, z, blk, st) => { if (inFP(x, z)) g.set(x, y, z, blk, st); };

const g = new Voxels([W, HMAX, D]);

const AW = ["red_wool", "green_wool", "blue_wool", "yellow_wool"];
const PANE_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_NS = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
const SLAB_BOT = { type: "bottom", waterlogged: "false" };
const door = (x, y, z, facing, half) => put(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });

const cells = [...FP].map((k) => k.split(",").map(Number));

// Pass 1: foundation, floors, roof deck, interior storefront behind the recess, awnings.
for (const [x, z] of cells) {
  const r = ring(x, z);
  put(x, 0, z, "stone_bricks");
  put(x, 1, z, r ? "polished_andesite" : "smooth_stone");
  put(x, 5, z, r ? "smooth_quartz" : "smooth_stone");
  put(x, 10, z, r ? "smooth_sandstone" : "white_concrete");
  if (r) continue;
  // Storefront glass sits one block behind the street wall (recess); awning projects over it.
  if (z === 1 && x % 6 >= 1 && x % 6 <= 5) {
    const bay = Math.floor((x - 1) / 6);
    if (x === 21) { door(x, 2, z, "north", "lower"); door(x, 3, z, "north", "upper"); }
    else { put(x, 2, z, "glass_pane", PANE_EW); put(x, 3, z, "glass_pane", PANE_EW); }
    put(x, 4, z, AW[bay % 4]);
  }
}

// Pass 2: exterior shell (ring cells).
for (const [x, z] of cells) {
  if (!ring(x, z)) continue;
  const f = z === 0 ? "N" : z === D - 1 ? "S" : x === 0 ? "W" : "E";
  const u = f === "N" || f === "S" ? x : z;
  const pier = u % 6 === 0;
  const win = u % 6 >= 1 && u % 6 <= 5;
  const bay = Math.floor((u - 1) / 6);

  // Ground floor (y 2-4).
  if (f === "N") {
    if (pier) { for (const y of [2, 3, 4]) put(x, y, z, "bricks"); }
    else put(x, 4, z, AW[bay % 4]); // awning on the ring; recess (y 2-3) left as air
  } else if (f === "S") {
    for (const y of [2, 3, 4]) put(x, y, z, "bricks");
    if (win) { put(x, 2, z, "glass_pane", PANE_EW); put(x, 3, z, "glass_pane", PANE_EW); }
  } else {
    for (const y of [2, 3, 4]) put(x, y, z, "bricks");
    if (f === "W" && z === 10) { door(x, 2, z, "west", "lower"); door(x, 3, z, "west", "upper"); }
  }

  // Sign band (y 5): black sign panels in each bay on the street face, smooth quartz elsewhere.
  if (f === "N" && !pier) put(x, 5, z, "black_concrete");

  // Upper storey (y 6-9): cream smooth sandstone piers, a window per bay with a mullion, sill and cornice.
  if (win) put(x, 6, z, "smooth_sandstone_slab", SLAB_BOT); else put(x, 6, z, "smooth_sandstone");
  for (const y of [7, 8]) {
    if (pier || u % 6 === 3) put(x, y, z, "cut_sandstone");
    else put(x, y, z, "glass_pane", f === "N" || f === "S" ? PANE_EW : PANE_NS);
  }
  put(x, 9, z, "cut_sandstone");

  // Stepped parapet: the ring stays at y 10, raised one block at each pier and corner.
  if (pier) put(x, 11, z, "cut_sandstone");
}

// Pass 3: roof equipment on the white roof deck (y 10): two HVAC units, a few vents.
for (const [x1, z1, x2, z2] of [[10, 5, 13, 7], [33, 11, 36, 13]]) {
  for (let x = x1; x <= x2; x++) for (let z = z1; z <= z2; z++) {
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
    put(x, 13, z, "iron_block");
  }
}
for (const [x, z] of [[22, 4], [22, 14], [40, 6], [8, 15]]) put(x, 11, z, "iron_bars");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/SEA1270127532.nbt");
console.log(ID, "size", [W, HMAX, D], "blocks", g.count());
