// Way 448579566, Mt Eden / Auckland CBD edge: a three-storey brick-and-plaster Edwardian shop block on the north-west
// and east corners, stepping down through a two-storey setback to a single-storey shop wing on the street (south) side.
// Solid massing with a one-block air gap behind each glass pane; floor lines, spandrels and a quartz cornice; a
// shopfront with a door and canopy on the street face; warm light behind some glass.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_448579566.cells.json", "utf8"));
const W = 14, D = 7, H = 26;

// roof height per footprint cell (0 outside); a lone 4 inside the one-storey wing is smoothed to its tier's 5
const top = new Map();
for (const [x, z, , r] of cells) top.set(`${x},${z}`, r === 4 ? 5 : r);
const R = (x, z) => top.get(`${x},${z}`) ?? 0;

// outward faces of cell (x, z) at height y: no footprint neighbour there, or one whose roof is below y
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faces = (x, z, y) => Object.keys(DIRS).filter((d) => R(x + DIRS[d][0], z + DIRS[d][1]) <= y);

const g = new Voxels([W, H, D]);
const gaps = new Map();                       // "x,y,z" -> block for the air cell behind a glass face (air unless lit)
const gapBehind = (x, y, z, out, block = "air") => gaps.set(`${x - DIRS[out][0]},${y},${z - DIRS[out][1]}`, block);

for (const [key, r] of top) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < r; y++) {
    const out = faces(x, z, y), exposed = out.length > 0;
    // plinth course, interior massing and the roof deck
    if (y === 0) { g.set(x, y, z, exposed ? "stone_bricks" : "stone"); continue; }
    if (y === r - 1) { g.set(x, y, z, exposed ? "smooth_quartz" : "smooth_stone"); continue; }
    if (!exposed) { g.set(x, y, z, "stone"); continue; }

    const k = Math.floor((y - 1) / 4), h = (y - 1) % 4;      // storey index and row within the storey (4 blocks)
    const corner = out.some((d) => d === "N" || d === "S") && out.some((d) => d === "E" || d === "W");
    if (corner) { g.set(x, y, z, "stone_bricks"); continue; }  // quoins

    const o = out[0], pos = o === "N" || o === "S" ? x : z, m = pos % 4;   // bays: pier at 0, glass 1 and 3, mullion at 2
    const street = k === 0 && o === "S";
    const door = street && x === 9;                           // the one entrance, on the street face

    if (h === 0) {                                            // floor line (riser on the shopfront)
      if (door) g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, street ? "stone_bricks" : "smooth_quartz");
      if (door) gapBehind(x, y, z, o);
      continue;
    }
    if (h === 3) {                                            // spandrel band; the shopfront's canopy
      g.set(x, y, z, street ? "dark_oak_slab" : "bricks", street ? { type: "top", waterlogged: "false" } : undefined);
      continue;
    }
    if (door && h === 1) { g.set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); gapBehind(x, y, z, o); continue; }

    if (m === 0) { g.set(x, y, z, street ? "stone_bricks" : "bricks"); continue; }      // pier
    if (m === 2) { g.set(x, y, z, street ? "dark_oak_planks" : "smooth_quartz"); continue; }   // mullion
    // glass with its air gap behind, where the cell behind is still inside the building (a setback face onto a lower roof is a wall)
    if (R(x - DIRS[o][0], z - DIRS[o][1]) <= y) { g.set(x, y, z, "bricks"); continue; }
    // warm light in some gaps on the floor-level row (lantern in the shops, glowstone above)
    g.set(x, y, z, "glass_pane");
    let lit = "air";
    if (h === 1 && street && (x === 7 || x === 11)) lit = "lantern";
    else if (h === 1 && !street && (x + z + k) % 3 === 0) lit = "glowstone";
    gapBehind(x, y, z, o, lit);
  }
}

// roof equipment on the three-storey roofs
for (const [x, y, z] of [[2, 13, 0], [5, 13, 1], [11, 13, 2]]) g.set(x, y, z, "iron_block");

// the air gaps behind the glass (and the door's inner side); lanterns hang on their floor
for (const [key, block] of gaps) {
  const [x, y, z] = key.split(",").map(Number);
  if (block === "lantern") g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
  else g.set(x, y, z, block);
}

// glass panes connect to their in-plane neighbours, as vanilla panes do
for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (!g.get(x, y, z) || g.get(x, y, z).block !== "minecraft:glass_pane") continue;
  const link = (dx, dz) => (g.val(x + dx, y, z + dz) ? "true" : "false");
  g.set(x, y, z, "glass_pane", { north: link(0, -1), south: link(0, 1), east: link(1, 0), west: link(-1, 0) });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_448579566.nbt");
