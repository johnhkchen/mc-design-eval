// Way 270737182, Mt Eden / Newton edge: a three-storey 1960s precast-concrete office block on a slope. The lidar roof is
// flat at 15 everywhere, so it is one prism: storeys at 4-block lines, a 3-block parapet, and a plant room on the roof.
// Ground floor is a glazed shopfront on the downhill faces (+x, +z), with the entrance on the lowest +z edge.
// Cells below their ground are foundation; the rest is precast wall, ribbon glazing and floor slabs, with air behind the glass.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_270737182.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..27, z 0..31

const X = 28, Y = 28, Z = 32;
const ROOF = 15;                                    // lidar roof is flat (14 at one cell, smoothed to the tier)
const K = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [K(x, z), g]));
const inF = (x, z) => ground.has(K(x, z));
const perim = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inF(x + dx, z + dz));
// the first outward face: +z (south), then +x, -z, -x
const outward = (x, z) => [[0, 1], [1, 0], [0, -1], [-1, 0]].find(([dx, dz]) => !inF(x + dx, z + dz)) ?? null;
const shopFace = (x, z) => { const n = outward(x, z); return !!n && (n[0] > 0 || n[1] > 0); };

// the entrance: the lowest +z edge cell (the street side), centred
const south = [...cells].filter(([x, z]) => perim(x, z) && outward(x, z)?.[1] === 1);
const medianX = south.map(([x]) => x).sort((a, b) => a - b)[Math.floor(south.length / 2)];
const [ex, ez] = south.sort((a, b) => a[2] - b[2] || Math.abs(a[0] - medianX) - Math.abs(b[0] - medianX))[0];
if (ground.get(K(ex, ez)) > 1) throw new Error(`entrance cell ${ex},${ez} sits above the door`);
const lintel = (x, z) => perim(x, z) && Math.abs(x - ex) <= 1 && Math.abs(z - ez) <= 1;

// the rooftop plant room: an interior rectangle of the roof, solid below its cap
const PLANT = { x0: 10, x1: 13, z0: 13, z1: 16 };
const inPlant = (x, z) => x >= PLANT.x0 && x <= PLANT.x1 && z >= PLANT.z0 && z <= PLANT.z1;
const plantWall = (x, z) => inPlant(x, z) && (x === PLANT.x0 || x === PLANT.x1 || z === PLANT.z0 || z === PLANT.z1);

// window bays: a mullion every third cell, a warm light in some panes (glowstone or shroomlight behind the glass)
const bay = (x, z, y, shop) => {
  if ((x + z) % 3 === 0) return { b: "gray_concrete" };
  if (!shop && (x * 5 + z * 7 + y * 3) % 11 === 0) return { b: "glowstone" };
  if (shop && (x * 2 + z * 3 + y) % 9 === 0) return { b: "shroomlight" };
  return { b: "light_blue_stained_glass_pane" };
};

// one cell's block at height y, or null for air
function plan(x, z, y) {
  const g = ground.get(K(x, z)), P = perim(x, z), shop = shopFace(x, z);
  if (y < g) return P ? { b: "stone_bricks" } : { b: "stone" };         // foundation below the ground
  if (inPlant(x, z)) {
    if (y === 15) return { b: "light_gray_concrete" };                  // plant cap
    if (y === 13 || y === 14) {
      if (!plantWall(x, z)) return { b: "stone" };                      // solid core, nothing to see
      return y === 14 && (x + z) % 2 === 0 ? { b: "iron_bars" } : { b: "white_concrete" };
    }
  }
  if (y === 0) return { b: P ? "polished_andesite" : "stone" };        // base course, floor slab
  if (y === 4 || y === 8) return { b: "light_gray_concrete" };         // storey slabs (and bands on the wall)
  if (y === 12) return { b: P ? "light_gray_concrete" : "white_concrete" };  // cornice / roof membrane (light, so it reads as a flat roof from the air)
  if (!P) return null;                                                 // interior air behind the glass
  if (y === 3) return { b: lintel(x, z) ? "smooth_stone" : "light_gray_concrete" };
  if (y === 1 || y === 2) {
    if (x === ex && z === ez) return { b: "iron_door", door: y };      // entrance, lower and upper half
    return bay(x, z, y, shop);
  }
  if (y === 5 || y === 6 || y === 9 || y === 10) return bay(x, z, y, false);
  if (y === 7 || y === 11) return { b: "white_concrete" };             // spandrel
  if (y === 13) return { b: "white_concrete" };                        // parapet
  if (y === 14) return { b: "smooth_stone" };                          // coping
  return null;
}

// fill the volume, then set the states that depend on neighbours
const grid = new Map(), at = (x, y, z) => grid.get(`${x},${y},${z}`);
for (const [x, z] of cells) for (let y = 0; y < ROOF + (inPlant(x, z) ? 2 : 0) && y < Y; y++) {
  const c = plan(x, z, y); if (c) grid.set(`${x},${y},${z}`, c);
}
// the rest of the plant cap sits in the same cells; every cell is in the footprint above

const g = new Voxels([X, Y, Z]);
for (const [key, c] of grid) {
  const [x, y, z] = key.split(",").map(Number);
  if (c.door !== undefined) {
    const lower = c.door === 1, half = lower ? "lower" : "upper";
    g.set(x, y, z, "iron_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
  } else if (c.b === "light_blue_stained_glass_pane") {
    const side = (dx, dz) => (at(x + dx, y, z + dz) ? "true" : "false");
    g.set(x, y, z, c.b, { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" });
  } else if (c.b === "iron_bars") {
    const side = (dx, dz) => (at(x + dx, y, z + dz) ? "true" : "false");
    g.set(x, y, z, c.b, { north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" });
  } else {
    g.set(x, y, z, c.b);
  }
}

const out = `${DIR}/way_270737182.nbt`;
const { blocks, palette } = g.save(out);
console.log(`way_270737182: ${cells.length} footprint cells, ${blocks} blocks, ${palette} block states, entrance at ${ex},${ez} -> ${out}`);
