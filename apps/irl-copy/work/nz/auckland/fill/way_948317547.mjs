// Way 948317547: a 1930s stripped-classical commercial block, four storeys on a 7 x 9 footprint. Plastered brick
// (smooth quartz over the walls) on a stone plinth, a timber shopfront with a door at street level, three storeys of
// window bays on pilasters, a quartz cornice and parapet, and flat roofs stepping down to the east and north.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317547.cells.json", "utf8"));

// lidar roof heights (above y 0) smoothed into flat tiers of whole storeys: 8, 12, 16 and 19 blocks
const tier = (r) => (r >= 18 ? 19 : r >= 15 ? 16 : r >= 11 ? 12 : 8);
const col = new Map();
for (const [x, z, ground, roof] of cells) col.set(`${x},${z}`, { ground, top: tier(roof) });
const at = (x, z) => col.get(`${x},${z}`);

// the sides of a block with air beside it: outside the footprint, or the neighbour's top is below y
const SIDES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const exposed = (x, y, z) => SIDES.filter(([, dx, dz]) => { const n = at(x + dx, z + dz); return !n || n.top <= y; }).map(([s]) => s);
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// the street front is the south side; the door sits in its middle bay
const DOOR = { x: 3, z: 8 };

const g = new Voxels([7, 32, 9]);
const panes = [];
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [key, c] of col) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.top; y++) {
    if (y < c.ground) { put(x, y, z, "stone_bricks"); continue; }
    const ex = exposed(x, y, z);
    if (!ex.length) {
      // inside: an air gap behind the glass, a floor slab per storey, the roof deck under the parapet
      if (y % 4 === 0 || y === c.top - 1) put(x, y, z, "smooth_stone");
      continue;
    }
    const face = ex[0];
    const idx = face === "N" || face === "S" ? x : z;
    const pillar = ex.length > 1 || idx % 3 === 0;
    const [ix, iz] = INWARD[face];
    const inner = at(x + ix, z + iz);
    // a warm light on the floor just inside a window, in some bays
    const lamp = (ly) => { if (inner && inner.top > ly) put(x + ix, ly, z + iz, "glowstone"); };

    if (y === 0) put(x, y, z, "polished_andesite");                     // plinth
    else if (y === c.top - 1) put(x, y, z, "quartz_block");            // cornice under the parapet
    else if (y < 4) {                                                   // shopfront
      if (x === DOOR.x && z === DOOR.z) {
        if (y === 3) put(x, y, z, "dark_oak_planks");                  // hood over the door
        else put(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (pillar) put(x, y, z, "smooth_quartz");
      else if (y === 1) { put(x, y, z, "dark_oak_planks"); if (idx % 6 === 1) lamp(1); }
      else put(x, y, z, "glass");
    }
    else if (y % 4 === 0 || y % 4 === 3) put(x, y, z, "smooth_quartz"); // string course and lintel
    else if (pillar) put(x, y, z, "smooth_quartz");
    else {
      panes.push([x, y, z]);
      put(x, y, z, "glass_pane", { east: "false", north: "false", south: "false", west: "false", waterlogged: "false" });
      if (y % 4 === 1 && (idx + Math.floor(y / 4)) % 4 === 0) lamp(y);
    }
  }
}

// a parapet along every edge that stands over air, on the cornice
for (const [key, c] of col) {
  const [x, z] = key.split(",").map(Number);
  if (exposed(x, c.top - 1, z).length) put(x, c.top, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// a roof plant room on the tallest tier, two cells square and two blocks high, set on the roof deck
for (const [x, z] of [[2, 3], [2, 4]]) for (const y of [19, 20]) put(x, y, z, "stone_bricks");

// glass panes join the panes and the piers beside them, as a run of glazing in a frame does
const joins = (x, y, z, dx, dz) => (["minecraft:glass_pane", "minecraft:smooth_quartz"].includes(g.get(x + dx, y, z + dz)?.block) ? "true" : "false");
for (const [x, y, z] of panes) {
  put(x, y, z, "glass_pane", {
    east: joins(x, y, z, 1, 0), west: joins(x, y, z, -1, 0),
    north: joins(x, y, z, 0, -1), south: joins(x, y, z, 0, 1), waterlogged: "false",
  });
}

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317547.nbt");
console.log(`way_948317547: ${blocks} blocks, ${palette} palette entries`);
