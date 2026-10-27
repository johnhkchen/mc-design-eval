// Auckland way 162320319: a two-storey interwar shop-front block, the Stripped Classical brick-and-plaster type that
// lines the older streets of Eden Terrace and Newton. Flat footprint (every cell's ground is 0), so no foundation fill.
// The lidar roof reads 9 or 10 blocks; that noise is smoothed into one flat tier, the roof deck at y 9 with a parapet
// course on the outer ring to y 10, which puts the top at 11 blocks as the record says. Bricks on the walls, stone
// bricks for the plinth, piers and cornice, a smooth-stone band at each storey line. The north face is the street: a
// glass shop-front on the ground floor under a fascia band, a dark-oak door in the middle, and piers every third
// cell. Upper windows are two cells wide with a stone sill, glass panes, and a few glowstone lit windows. Two lamps stand
// behind the shop glass on the floor slab. The roof has a plant block with a lantern. Interiors are air, with a floor
// slab on y 0 and y 5 and the roof deck on y 9.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162320319.cells.json`, "utf8"));
const W = 10, D = 20, MAXY = 12;
const FLOOR = 0, STOREY = 5, SILL = 6, GLASS = [7, 8], CORNICE = 9, PARAPET = 10;
const DOOR_X = 4;   // on the north (street) face, z = 0

const set = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => set.has(`${x},${z}`);
const s = (b) => (b ? "true" : "false");
const g = new Voxels([W, MAXY, D]);
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// a glass pane joins the panes and piers beside it on its own face
const pane = (x, z, face) => {
  const ns = face === "N" || face === "S";
  return ns
    ? { north: "false", south: "false", east: s(has(x + 1, z)), west: s(has(x - 1, z)), waterlogged: "false" }
    : { north: s(has(x, z - 1)), south: s(has(x, z + 1)), east: "false", west: "false", waterlogged: "false" };
};

for (const [x, z] of cells) {
  const out = FACES.filter(([, dx, dz]) => !has(x + dx, z + dz));
  // interior: floor slabs, the roof deck, nothing between
  if (!out.length) {
    g.set(x, FLOOR, z, "smooth_stone");
    g.set(x, STOREY, z, "smooth_stone");
    g.set(x, CORNICE, z, "stone");
    continue;
  }
  const [face] = out[0];
  const k = face === "N" || face === "S" ? x : z;   // position along the face, so bays line up on every face
  const pier = out.length > 1 || k % 3 === 0;      // corners and every third cell are piers
  const door = face === "N" && z === 0 && x === DOOR_X;
  const lit = !pier && (x * 5 + z * 3) % 7 === 2;   // a few upper windows lit, spread over the block

  // base course, shop-front band, storey line, upper storey, cornice and parapet
  g.set(x, FLOOR, z, "stone_bricks");
  if (door) {
    g.set(x, 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, 3, z, "glass");
  } else if (pier) {
    for (let y = 1; y <= 3; y++) g.set(x, y, z, "stone_bricks");
  } else {
    for (let y = 1; y <= 3; y++) g.set(x, y, z, "glass");
  }
  g.set(x, 4, z, "smooth_stone");                     // fascia band
  g.set(x, STOREY, z, "smooth_stone");                // storey line, and the upper floor slab
  if (pier) {
    for (let y = SILL; y <= 8; y++) g.set(x, y, z, "bricks");
  } else {
    g.set(x, SILL, z, "smooth_stone");                 // stone sill
    for (const y of GLASS) {
      if (lit) g.set(x, y, z, "glowstone");
      else g.set(x, y, z, "glass_pane", pane(x, z, face));
    }
  }
  g.set(x, CORNICE, z, "stone_bricks");               // cornice course
  g.set(x, PARAPET, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// lamps behind the shop glass, standing on the ground floor slab, at x 2 and 5 on the street side
for (const x of [2, 5]) if (has(x, 1) && has(x, 0)) g.set(x, 1, 1, "glowstone");

// roof plant: a 2 x 2 block of iron with a lantern on top, at the back of the roof
const plant = [[6, 14], [7, 14], [6, 15], [7, 15]];
if (plant.every(([x, z]) => has(x, z))) {
  for (const [x, z] of plant) g.set(x, PARAPET, z, "iron_block");
  g.set(6, 11, 14, "lantern", { hanging: "false", waterlogged: "false" });
}

const out = `${DIR}/way_162320319.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries`);
