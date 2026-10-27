// Auckland, Eden Terrace side of Maungawhau: a 6 x 7 footprint, two storeys on a 10-block roof, built as an
// Edwardian brick shop-house. Brick walls with a stone base, string course and cornice, a brick parapet,
// white-painted sash frames, a timber shopfront with a door on the street (north) side, a brick chimney.
// Ground under each cell is its third number (y 0 is the lowest); the foundation is solid from y 0 up to it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170820.cells.json", "utf8"));

const FL = 4;                                    // the upper floor's slab: the ground storey is y ground+1 .. FL-1
const by = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { x, z, g, r }]));
const inF = (x, z) => by.has(`${x},${z}`);
const exposed = (x, z) => ({ N: !inF(x, z - 1), S: !inF(x, z + 1), W: !inF(x - 1, z), E: !inF(x + 1, z) });

const g = new Voxels([6, 23, 7]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);
const glassAlong = (along) => (along === "x"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const lantern = { hanging: "true", waterlogged: "false" };

const interior = [];
for (const { x, z, g: gr, r } of by.values()) {
  const ex = exposed(x, z);
  const perim = ex.N || ex.S || ex.W || ex.E;
  const corner = (ex.N || ex.S) && (ex.W || ex.E);
  const along = ex.N || ex.S ? "x" : "z";
  const shop = ex.N && z <= 1 && !corner;                       // the street frontage
  const win = perim && !corner && !shop && (x + z) % 2 === 0;   // every other plain wall cell
  if (!perim) interior.push({ x, z, gr });

  // foundation and base course: solid under the building, from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone");
  set(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  // ground storey: shopfront (stallboard, glass, fascia, door under a hanging lantern) or brick with sash windows
  const gRows = FL - 1 - gr;
  for (let k = 0; k < gRows && perim; k++) {
    const y = gr + 1 + k, top = k === gRows - 1, bottom = k === 0;
    if (shop) {
      if (x === 2 && z === 0) {
        if (k < 2) set(x, y, z, "dark_oak_door", door(k === 0 ? "lower" : "upper"));
        else set(x, y, z, "lantern", lantern);
      } else if (k === 1 && gRows >= 3) set(x, y, z, "glass_pane", glassAlong(along));
      else set(x, y, z, "dark_oak_planks");
    } else if (win) {
      if (gRows === 2) set(x, y, z, top ? "white_concrete" : "glass_pane", top ? undefined : glassAlong(along));
      else if (bottom) set(x, y, z, "stone_bricks");
      else if (top) set(x, y, z, "white_concrete");
      else set(x, y, z, "glass_pane", glassAlong(along));
    } else set(x, y, z, "bricks");
  }

  // string course: the upper floor's slab (stone on the walls, smooth stone over the rooms)
  set(x, FL, z, perim ? "stone_bricks" : "smooth_stone");

  // upper storey: stone quoins at the corners, sash windows in white frames, brick between
  for (let y = FL + 1; y <= r - 3 && perim; y++) {
    const k = y - (FL + 1), top = y === r - 3;
    if (win) set(x, y, z, k === 0 || top ? "white_concrete" : "glass_pane", k === 0 || top ? undefined : glassAlong(along));
    else set(x, y, z, "bricks");
  }

  // cornice and roof deck on every cell, a brick parapet on the edge
  set(x, r - 2, z, perim ? "stone_bricks" : "smooth_stone");
  if (perim) set(x, r - 1, z, "bricks");
}

// warm light: a hanging lantern in a shop-side room, and two in the upper rooms
const nearest = (tx, tz, list) => list.reduce((a, b) => (Math.abs(b.x - tx) + Math.abs(b.z - tz) < Math.abs(a.x - tx) + Math.abs(a.z - tz) ? b : a));
const lanternAt = (c, y) => set(c.x, y, c.z, "lantern", lantern);
const groundRooms = interior.filter((c) => c.gr === 0);
lanternAt(nearest(2, 1, groundRooms), FL - 1);
for (const [tx, tz] of [[2, 3], [3, 5]]) lanternAt(nearest(tx, tz, interior), FL + 3);

// one brick chimney on the roof above the rooms, capped with a stone slab
const chimney = nearest(2, 4, interior);
const rt = by.get(`${chimney.x},${chimney.z}`).r;
for (let y = rt - 1; y <= rt; y++) set(chimney.x, y, chimney.z, "bricks");
set(chimney.x, rt + 1, chimney.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170820.nbt");
console.log("built", g.count(), "blocks,", g.palette.length - 1, "palette entries");
