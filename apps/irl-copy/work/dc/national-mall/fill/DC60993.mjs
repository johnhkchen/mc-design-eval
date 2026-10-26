// DC60993: a Federal-style office block for the Mall's east end. Red brick walls on a stone plinth, pale stone
// trim (belt, lintel band, cornice), two storeys over a ground floor, a flat roof deck and a one-tier penthouse on
// the taller north-west cells. Every wall, floor and cap rests on what is below it; interiors are air behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC60993.cells.json`, "utf8"));

// the lidar roof height per footprint cell (its top is the roof value minus one); the taller cells form the penthouse
const roof = new Map();
for (const [x, z, , r] of cells) roof.set(`${x},${z}`, r);
const roofAt = (x, z) => roof.get(`${x},${z}`) ?? 0;
// a cell holds building at height y when y is below its roof; outside the footprint is 0, so an edge is exposed
const built = (x, z, y) => y < roofAt(x, z);
const FACES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposedFaces = (x, z, y) => FACES.filter(([dx, dz]) => !built(x + dx, z + dz, y));

// one facade: piers every third cell, windows (two cells) between; a window pane joins along its run
function facade(x, z, y, [dx]) {
  const u = dx !== 0 ? z : x;
  const pier = u % 3 === 0;
  if (y === 8) return pier ? { name: "smooth_quartz" } : { name: "light_blue_stained_glass" };
  if (pier) return { name: "bricks" };
  const along = dx !== 0 ? { north: "true", south: "true" } : { east: "true", west: "true" };
  return { name: "glass_pane", state: { east: "false", west: "false", north: "false", south: "false", waterlogged: "false", ...along } };
}

// what stands at (x, y, z): null is air (an interior, or a height nothing reaches)
function blockAt(x, z, y) {
  if (y === 0) return { name: "stone_bricks" };                       // plinth, the whole footprint
  const ext = exposedFaces(x, z, y);
  if (y === 3) return ext.length ? { name: "smooth_quartz" } : null;  // ground-storey lintel band
  if (y === 4) return ext.length ? { name: "smooth_quartz" } : { name: "smooth_stone" };  // belt course and the upper floor slab
  if (y === 7) return ext.length ? { name: "smooth_quartz" } : { name: "stone" };         // cornice and roof deck
  if (y === 8) return ext.length ? facade(x, z, y, ext[0]) : { name: "stone_bricks" };    // penthouse tier
  if (ext.length) return facade(x, z, y, ext[0]);                    // ground and upper storeys
  return null;
}

const g = new Voxels([7, 21, 16]);
for (const [x, z] of cells) {
  const top = roofAt(x, z);
  for (let y = 0; y < top; y++) {
    const b = blockAt(x, z, y);
    if (b) g.set(x, y, z, b.name, b.state);
  }
}

// the main entrance on the east front (z 5-7, a flush dark band above it), and a recessed one in the south notch
const door = (x, z, facing) => {
  g.set(x, 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
};
door(5, 6, "east");
for (const z of [5, 7]) { g.set(5, 1, z, "smooth_quartz"); g.set(5, 2, z, "smooth_quartz"); }
for (const z of [5, 6, 7]) g.set(5, 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
door(3, 14, "south");
for (const x of [2, 4]) { g.set(x, 1, 14, "smooth_quartz"); g.set(x, 2, 14, "smooth_quartz"); }
for (const x of [2, 3, 4]) g.set(x, 3, 14, "dark_oak_slab", { type: "top", waterlogged: "false" });

// warm light behind the glass: lanterns standing on the floors, a shroomlight on the ground floor
const lantern = { hanging: "false", waterlogged: "false" };
for (const z of [4, 9]) g.set(4, 1, z, "lantern", lantern);
for (const z of [4, 8, 11]) g.set(4, 5, z, "lantern", lantern);
g.set(4, 1, 12, "shroomlight");
g.set(3, 1, 13, "lantern", lantern);

// roof plant on the deck, north of the wing
g.set(4, 8, 12, "iron_block");
g.set(4, 8, 13, "iron_block");

const result = g.save(`${DIR}/DC60993.nbt`);
console.log(JSON.stringify(result));
