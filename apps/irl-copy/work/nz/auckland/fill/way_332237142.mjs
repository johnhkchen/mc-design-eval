// Way 332237142, Mt Eden / Eden Terrace side of the CBD: a two-storey Edwardian brick shop-top block with a
// single-storey shop wing on its south-east corner. Lidar roof 7-8 is the main block (2 storeys of 4), 3-4 the wing.
// Brick walls on a stone plinth, cream string and cornice courses, sash-style glass panes with white heads and
// sills, a shopfront with a dark fascia, a door with a canopy, warm light behind some glass, and roof plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237142.cells.json", "utf8"));

// the footprint, with each cell's ground and a smoothed roof tier: 8 (two storeys) or 4 (one storey wing)
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { x, z, g: ground, T: roof >= 6 ? 8 : 4 });
const at = (x, z) => cell.get(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exterior = (c) => NB.filter(([dx, dz]) => !at(c.x + dx, c.z + dz)).length;
// a wall cell: on the outside, or against a neighbour of another tier
const isRing = (c) => NB.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.T !== c.T; });

const g = new Voxels([14, 21, 10]);
const panes = [];
const glass = (x, y, z) => { g.set(x, y, z, "glass_pane"); panes.push([x, y, z]); };
const pattern = (c) => (c.x + c.z) % 2 === 0;      // window bays on the walls with one open face

for (const c of cell.values()) {
  const { x, z, g: gr, T } = c;
  const ring = isRing(c), ext = exterior(c);
  // foundation under the ground, then the floor slab (plinth course on the walls)
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, ring ? "stone_bricks" : "smooth_stone");

  if (!ring) {
    // interior: floor slabs per storey and the roof deck; air between (no interiors)
    if (T === 8) g.set(x, 4, z, "smooth_stone");
    g.set(x, T - 1, z, "smooth_stone");
    continue;
  }

  const shop = T === 4 && z === 9 && ext === 1;           // the wing's street front
  const door = x === 10 && z === 9;                       // the main block's street door
  const win = ext === 1 && pattern(c) && !shop && !door;

  // storey one: bricks, with glass in the window bays (rows gr+1 .. 2), a white head at 3
  for (let y = gr + 1; y <= 2; y++) {
    if (shop) g.set(x, y, z, "glass");
    else if (door) g.set(x, y, z, "oak_door", { facing: "south", half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    else if (win) glass(x, y, z);
    else g.set(x, y, z, "bricks");
  }
  // the head course (main and wing): a white band, or the shop fascia, or the door canopy
  if (shop) g.set(x, 3, z, "dark_oak_planks");
  else if (door || (x === 9 && z === 9)) g.set(x, 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
  else g.set(x, 3, z, "white_concrete");

  if (T === 8) {
    g.set(x, 4, z, "quartz_block");                      // string course between the storeys
    for (let y = 5; y <= 6; y++) {
      if (win) glass(x, y, z);
      else g.set(x, y, z, "bricks");
    }
    g.set(x, 7, z, "quartz_block");                      // cornice
    g.set(x, 8, z, "stone_brick_wall");                  // parapet
  }
}

// window heads and lamps: some bays get a warm light on the inside face (a floor slab is always below)
for (const c of cell.values()) {
  if (!isRing(c) || exterior(c) !== 1 || !pattern(c)) continue;
  const inward = NB.map(([dx, dz]) => at(c.x + dx, c.z + dz)).find((n) => n && !isRing(n) && n.T === c.T);
  if (!inward) continue;
  if ((c.x * 3 + c.z) % 3 !== 0) continue;
  g.set(inward.x, c.g + 1, inward.z, "glowstone");
  if (c.T === 8) g.set(inward.x, 5, inward.z, "lantern", { hanging: "false", waterlogged: "false" });
}

// roof plant on the main block: a few condenser units set back from the parapet
for (const c of cell.values()) {
  if (c.T !== 8 || isRing(c)) continue;
  if ((c.x * 7 + c.z * 3) % 11 === 0) g.set(c.x, 8, c.z, "light_gray_concrete");
}

// glass panes connect to their neighbours, as the vanilla block states do
for (const [x, y, z] of panes) {
  const link = (dx, dz) => (g.get(x + dx, y, z + dz) ? "true" : "false");
  g.set(x, y, z, "glass_pane", { east: link(1, 0), west: link(-1, 0), south: link(0, 1), north: link(0, -1), waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332237142.nbt");
console.log("way_332237142.nbt written:", g.count(), "blocks");
