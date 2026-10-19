import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// HILLCLIMB COURT CONDOMINIUM (1982, condominium over commercial, 1425 Western Ave): two storeys of red brick over a
// stone commercial ground floor, a cornice, and a flat roof with a corner terrace and HVAC boxes. Floors are level in
// the world: storey 1 runs from each cell's ground up to y 4 (transom), the upper storey from the storey line at y 5
// to the lintel at y 9, and the cornice caps the walls at y 10. The downhill cells show their extra foundation courses.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill";
const cells = JSON.parse(readFileSync(`${DIR}/SEA1270125675.cells.json`, "utf8"));

const TOP = 10, BAND = 5, GF_TOP = 4, LINTEL = 9;
const g = new Voxels([22, 23, 36]);
const gnd = new Map(cells.map(([x, z, h]) => [`${x},${z}`, h]));
const has = (x, z) => gnd.has(`${x},${z}`);
const FACES = [
  { name: "north", dx: 0, dz: -1, axis: "x" },
  { name: "south", dx: 0, dz: 1, axis: "x" },
  { name: "west", dx: -1, dz: 0, axis: "z" },
  { name: "east", dx: 1, dz: 0, axis: "z" },
];
const faceOf = (x, z) => FACES.find((f) => !has(x + f.dx, z + f.dz));  // outward face of an edge cell, undefined inside
const sameFace = (x, z, f) => faceOf(x, z)?.name === f.name;
const tan = (x, z, f) => (f.axis === "x" ? x : z);                      // coordinate running along the facade
const pane = (f) => {                                                     // a pane joins its neighbours along the facade
  const along = f.axis === "x" ? "true" : "false", across = f.axis === "z" ? "true" : "false";
  return { east: along, west: along, north: across, south: across, waterlogged: "false" };
};

// 1. Envelope: foundation, plinth, storey lines, cornice, roof deck; then the facade of every edge cell.
for (const [x, z, h] of cells) {
  const f = faceOf(x, z);
  for (let y = 0; y < h; y++) g.set(x, y, z, "stone_bricks");            // foundation up to this cell's ground
  g.set(x, h, z, "smooth_stone");                                          // plinth course, also the ground-floor slab
  g.set(x, BAND, z, f ? "white_concrete" : "light_gray_concrete");        // storey line on the walls, floor slab inside
  g.set(x, TOP, z, f ? "stone_bricks" : "gray_concrete");                 // cornice coping, roof deck
  if (!f) continue;
  const t = tan(x, z, f);
  for (let y = h + 1; y < TOP; y++) {
    if (y === BAND) continue;
    if (y <= GF_TOP) {                                                     // commercial storey: shopfront glass
      if (y === GF_TOP) g.set(x, y, z, t % 4 === 0 ? "stone_bricks" : "dark_oak_planks");
      else if (t % 4 === 0) g.set(x, y, z, "stone_bricks");
      else if (t % 4 === 2) g.set(x, y, z, "dark_oak_planks");
      else g.set(x, y, z, "glass");
    } else if (y === LINTEL) g.set(x, y, z, "white_concrete");
    else if (t % 4 === 0) g.set(x, y, z, "bricks");                       // brick pier
    else if (t % 4 === 2) g.set(x, y, z, "white_concrete");               // window mullion
    else g.set(x, y, z, "light_blue_stained_glass_pane", pane(f));        // glass pane in a white frame
  }
}

// 2. Entrances: the lowest edge cell takes the lobby door under a canopy; a second shop door sits on the same face.
const lowEdges = cells.filter(([x, z, h]) => faceOf(x, z) && h <= 1)
  .sort((a, b) => a[2] - b[2] || a[0] - b[0] || a[1] - b[1]);
const doors = [];
if (lowEdges.length) {
  const [x0, z0, h0] = lowEdges[0], f0 = faceOf(x0, z0);
  doors.push([x0, z0, h0, f0]);
  const far = lowEdges.find(([x, z, h]) => sameFace(x, z, f0) && Math.abs(tan(x, z, f0) - tan(x0, z0, f0)) >= 8 && h <= h0 + 1);
  if (far) doors.push([far[0], far[1], far[2], f0]);
}
for (const [x, z, h, f] of doors) {
  const along = (k) => (f.axis === "x" ? [x + k, z] : [x, z + k]);
  const state = { facing: f.name, hinge: "left", open: "false", powered: "false" };
  g.set(x, h + 1, z, "dark_oak_door", { ...state, half: "lower" });
  g.set(x, h + 2, z, "dark_oak_door", { ...state, half: "upper" });
  for (const k of [-1, 0, 1]) {                                            // canopy across the door bay
    const [cx, cz] = along(k);
    if (sameFace(cx, cz, f)) g.set(cx, h + 3, cz, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
  for (const k of [-1, 1]) {                                               // lanterns hang from the canopy
    const [lx, lz] = along(k);
    if (sameFace(lx, lz, f)) g.set(lx, h + 2, lz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 3. Warm light behind some glass: glowstone and shroomlight on the inside cell, in the air gap behind the pane.
for (const [x, z, h] of cells) {
  const f = faceOf(x, z);
  if (!f) continue;
  const t = tan(x, z, f);
  if (t % 4 !== 1) continue;
  const ix = x - f.dx, iz = z - f.dz;
  if (!has(ix, iz) || faceOf(ix, iz)) continue;                            // only where a room sits behind the glass
  const bay = t >> 2;
  if (h + 2 <= GF_TOP && (bay + x) % 3 === 0) g.set(ix, h + 2, iz, "shroomlight");
  if ((bay * 7 + x * 3 + z) % 5 === 0) g.set(ix, LINTEL - 2, iz, "glowstone");   // upper storey, y 7
}

// 4. Roof: a corner terrace with planters, and HVAC boxes on the rest of the roof.
const interior = (x, z) => has(x, z) && !faceOf(x, z);
for (const [x, z] of cells) {
  if (!interior(x, z)) continue;
  if (x >= 13 && z >= 24) {                                                // terrace deck
    g.set(x, TOP, z, "spruce_planks");
    if ((x + z) % 6 === 0) g.set(x, TOP + 1, z, "oak_leaves", { persistent: "true", distance: "7", waterlogged: "false" });
  } else if (x % 6 === 2 && z % 7 === 3) {                                 // HVAC box, 2 blocks tall
    g.set(x, TOP + 1, z, "light_gray_concrete");
    g.set(x, TOP + 2, z, "light_gray_concrete");
  }
}

const out = `${DIR}/SEA1270125675.nbt`;
const r = g.save(out);
console.log(JSON.stringify({ file: out, ...r, doors: doors.map(([x, z, h, f]) => ({ x, z, ground: h, face: f.name })) }));
