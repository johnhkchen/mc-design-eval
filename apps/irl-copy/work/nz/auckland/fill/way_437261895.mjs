// Way 437261895: a 1920s-30s Auckland Stripped Classical block on a street front (north, z 0). The lidar reads a
// plastered parapet across the front at 11 over a one-storey body at 5 and a two-storey east bay at 8; the ground
// steps down a block to the west. Shopfronts on the street, a cream string course and cap, a brick body, glass in
// frames, a few warm lamps behind the glass, and flat roofs with plant. Interiors are air with a floor per storey.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_437261895.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..17, z 0..5

const SIZE = [18, 24, 6];
const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));   // each cell's ground (its third number)
const inside = (x, z) => ground.has(`${x},${z}`);

// clean flat tiers from the lidar roof: the street parapet at 11, the east bay at 8, the rest one storey at 5
const top = (x, z) => !inside(x, z) ? 0 : z === 0 ? 11 : x >= 12 && x <= 16 ? 8 : 5;
const lower = (x, z, dx, dz) => top(x + dx, z + dz) < top(x, z);   // a neighbour that is lower (or outside): an exposed face
const isWall = (x, z) => lower(x, z, 0, -1) || lower(x, z, 0, 1) || lower(x, z, -1, 0) || lower(x, z, 1, 0);

const Q = { block: "smooth_quartz" }, BRICK = { block: "bricks" }, GLASS = { block: "glass_pane" };
const CAP_STREET = { block: "smooth_quartz_stairs", state: { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" } };
const CAP = { block: "smooth_quartz_slab", state: { type: "bottom", waterlogged: "false" } };

// one wall cell's block at height y: base, string courses, shopfront or bays of glass in white frames, parapet cap
function wallBlock(x, y, z, g, T) {
  const front = z === 0;
  const ns = lower(x, z, 0, -1) || lower(x, z, 0, 1);   // a north or south face: bays run along x
  const pier = ns && x % 5 === 0;
  const glassAt = ns ? (x % 5 === 2 || x % 5 === 3) : (z === 2 || z === 3);
  const frame = ns && (x % 5 === 1 || x % 5 === 4);
  const corner = (x === 0 || x === 16 || x === 17) && (z === 0 || z === 5);
  if (y === T - 1) return front ? CAP_STREET : CAP;
  if (corner) return Q;
  if (y === g) return { block: "stone_bricks" };
  if (y === 4 || (T === 11 && y === 8)) {
    if (front && y === 4 && x >= 6 && x <= 9) return { block: x % 2 === 0 ? "red_wool" : "white_wool" };   // the striped awning over the door
    return Q;
  }
  if (T === 11 && y === 9) return pier ? Q : x % 5 === 2 ? { block: "polished_andesite" } : BRICK;   // the frieze
  if (y < 4) {   // ground storey
    if (front && y === g + 1) {
      if (x === 7) return { block: "dark_oak_door", state: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } };
      return pier ? Q : { block: "dark_oak_planks" };   // the bulkhead under the glass
    }
    if (front && x === 7 && y === g + 2) return { block: "dark_oak_door", state: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } };
    if (glassAt && y >= g + 2) return GLASS;
    if (pier) return Q;
    if (frame && front) return { block: "dark_oak_planks" };
    return BRICK;
  }
  // upper storey
  if (glassAt) return GLASS;
  if (T === 11 && y === 7) return pier ? Q : { block: "white_concrete" };   // the lintel band over the bays
  if (pier) return Q;
  if (frame) return { block: "white_concrete" };
  return BRICK;
}

// an interior cell: the building's floor on each storey and a flat roof; air between
const interiorBlock = (y, g, T) =>
  y === g || (y === 4 && T > 5) ? { block: "smooth_stone" } : y === T - 1 ? { block: "stone" } : null;

// the model, cell by cell, before writing
const model = new Map();
const put = (x, y, z, block, state) => model.set(`${x},${y},${z}`, { block, state });
for (const [key, g] of ground) {
  const [x, z] = key.split(",").map(Number), T = top(x, z), wall = isWall(x, z);
  for (let y = 0; y < T; y++) {
    if (y < g) { put(x, y, z, "cobblestone"); continue; }   // the fill under a cell that stands on higher ground
    const b = wall ? wallBlock(x, y, z, g, T) : interiorBlock(y, g, T);
    if (b) put(x, y, z, b.block, b.state);
  }
}

// roof plant on the flat roofs (each stands on a roof slab)
put(3, 5, 3, "iron_block"); put(9, 5, 3, "iron_block"); put(14, 8, 3, "iron_block");
// warm lights behind the glass: lanterns hung from the ceiling, a glowstone on the upper floor
put(2, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });
put(13, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });
put(13, 5, 1, "glowstone");

// glass panes connect to the blocks and panes beside them
const has = (x, y, z) => model.has(`${x},${y},${z}`);
const yes = (b) => (b ? "true" : "false");
for (const [k, c] of model) {
  if (c.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  c.state = { east: yes(has(x + 1, y, z)), north: yes(has(x, y, z - 1)), south: yes(has(x, y, z + 1)), west: yes(has(x - 1, y, z)), waterlogged: "false" };
}

const g = new Voxels(SIZE);
for (const [k, c] of model) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, c.block, c.state); }
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_437261895.nbt");
