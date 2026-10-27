import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// No record, so the building is read from the lidar footprint: a three-storey brick commercial block of the
// 1920s-30s (red brick on piers, cream render string courses and cornice, shopfront and a timber canopy at the
// entrance, a brick parapet on a flat roof). Storey lines at y 4 and 8, cornice at 11, parapet at 12.
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170788.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170788.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));    // [x, z, ground, roof]; x 0..8 west to east, z 0..6 north to south
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const ROOF = roofs[roofs.length >> 1];                    // one flat tier: the lidar roof, median-smoothed (all 12)
const DECK = ROOF - 1, CORNICE = ROOF - 1, PARAPET = ROOF;
const FLOORS = [4, 8];                                    // floor slabs and string courses at these rows

const g = new Voxels([9, 25, 7]);
const plan = new Map(cells.map(([x, z, ground]) => [`${x},${z}`, ground]));
const has = (x, z) => plan.has(`${x},${z}`);
const outward = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const panes = [], lights = [];

for (const [key, ground] of plan) {
  const [x, z] = key.split(",").map(Number);
  const out = outward(x, z);
  const perim = out.length > 0;
  const along = out.includes("N") || out.includes("S") ? "ns" : "ew";  // the facade this cell faces; N/S runs along x
  const bay = (along === "ns" ? x : z) % 3 !== 0;                     // glass bays, every third block a brick pier
  const entrance = x === 6 && z === 0;                                 // the door in the middle of the front
  const canopy = z === 0 && x >= 5 && x <= 7;                          // dark timber fascia over the entrance bay

  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // inside: floor slabs and the flat roof deck; air between (no interiors, the glass gives onto air)
    put(x, ground, z, "smooth_stone");
    for (const y of FLOORS) put(x, y, z, "smooth_stone");
    put(x, DECK, z, "gray_concrete");
    continue;
  }

  put(x, ground, z, "stone_bricks");                                   // base course
  for (let y = ground + 1; y <= 3; y++) {                              // shopfront storey
    if (entrance && y <= ground + 2) put(x, y, z, "dark_oak_door", { facing: "north", half: y === ground + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
    else if (bay) { put(x, y, z, "glass_pane"); panes.push([x, y, z, along]); }
    else put(x, y, z, "bricks");
  }
  for (const y of FLOORS) put(x, y, z, canopy && y === 4 ? "dark_oak_planks" : "quartz_block");
  for (let y = 5; y <= 7; y++) {                                       // second storey, header course at 7
    if (y === 7) put(x, y, z, bay ? "quartz_block" : "bricks");
    else if (bay) { put(x, y, z, "glass_pane"); panes.push([x, y, z, along]); }
    else put(x, y, z, "bricks");
  }
  for (let y = 9; y <= 10; y++) {                                      // third storey, under the cornice
    if (bay) { put(x, y, z, "glass_pane"); panes.push([x, y, z, along]); }
    else put(x, y, z, "bricks");
  }
  put(x, CORNICE, z, "quartz_block");
  put(x, PARAPET, z, "bricks");

  // warm light behind some panes: glowstone in the second storey, a shroomlight at the shopfront
  const [dx, dz] = INWARD[out[0]];
  const ix = x + dx, iz = z + dz;
  if (bay && has(ix, iz) && !(outward(ix, iz).length) && (x + z) % 4 === 0) lights.push([ix, 5, iz, "glowstone"]);
  if (bay && has(ix, iz) && !(outward(ix, iz).length) && (x + z) % 5 === 2) lights.push([ix, 2, iz, "shroomlight"]);
}

// the interior of the top storey: a few hanging lanterns under the roof deck
for (const [key] of plan) {
  const [x, z] = key.split(",").map(Number);
  if (outward(x, z).length === 0 && (x + 2 * z) % 5 === 0) put(x, 10, z, "lantern", { hanging: "true" });
}
for (const [x, y, z, block] of lights) put(x, y, z, block);

// roof plant room on the deck, 2 x 2, with a slab cap
for (const [x, z] of [[3, 3], [4, 3], [3, 4], [4, 4]]) {
  put(x, DECK + 1, z, "light_gray_concrete");
  put(x, DECK + 2, z, "light_gray_concrete");
  put(x, DECK + 3, z, "smooth_stone_slab", { type: "bottom" });
}

// glass panes connect only to the neighbouring pane or brick along their own facade
for (const [x, y, z, along] of panes) {
  const [a, b] = along === "ns" ? [[x - 1, z], [x + 1, z]] : [[x, z - 1], [x, z + 1]];
  const link = (p) => g.get(p[0], y, p[1]) !== null;
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (along === "ns") { state.west = String(link(a)); state.east = String(link(b)); }
  else { state.north = String(link(a)); state.south = String(link(b)); }
  put(x, y, z, "glass_pane", state);
}

g.save(OUT);
