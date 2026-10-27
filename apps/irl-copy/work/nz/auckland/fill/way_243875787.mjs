// Auckland, Newton/Eden Terrace edge: a 1970s reinforced-concrete office block on a stone podium, ten storeys
// at its high (north-east) corner stepping down to a two-storey wing. Lidar roofs are median-smoothed per cell and
// quantised to 4-block storeys, so every tier stands on the foundation below it; the facade is a 1-block shell
// with an air gap behind the glass and a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875787.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875787.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..12, z 0..15

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const k = (x, z) => `${x},${z}`;
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
// Two median passes over the footprint: lidar spikes go, and the roof settles into flat tiers
const smoothRoof = (field) => new Map(cells.map(([x, z]) => {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (field.has(k(x + dx, z + dz))) near.push(field.get(k(x + dx, z + dz)));
  return [k(x, z), median(near)];
}));
const roofRaw = new Map(cells.map(([x, z, , r]) => [k(x, z), r]));
const roofSmooth = smoothRoof(smoothRoof(roofRaw));

// One column per footprint cell: foundation to its ground, then storeys up to a 4-block-aligned roof (absolute y)
const col = new Map();
for (const [x, z, g] of cells) {
  const lo = 4 * Math.ceil((g + 4) / 4);                                  // at least one storey over the ground
  const top = Math.min(44, Math.max(lo, 4 * Math.round(roofSmooth.get(k(x, z)) / 4)));   // 44 = ten storeys above a 4-block ground
  col.set(k(x, z), { x, z, g, top });
}
const at = (x, z) => col.get(k(x, z));
// sides of a cell that face open air (outside the footprint, or a neighbour whose roof is below y)
const openSides = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || y > n.top; });
const onEdge = (c) => DIRS.some(([dx, dz]) => !at(c.x + dx, c.z + dz));

const v = new Voxels([13, 55, 16]);
const windows = [];   // { x, y, z, dx, dz } for each glass pane, to place lamps behind some of them
const entrance = at(10, 0);

for (const c of col.values()) {
  const { x, z, g, top: H } = c;
  const wall = H <= 12 ? "stone_bricks" : "white_concrete";                 // podium vs tower
  const firstSlab = 4 * (Math.floor(g / 4) + 1);                           // first storey line above the ground
  for (let y = 0; y <= g; y++) v.set(x, y, z, "stone");                   // foundation, so nothing floats on a slope

  for (let y = g + 1; y <= H; y++) {
    const open = openSides(c, y);
    if (!open.length) {                                                    // interior: floor slabs and roof deck only
      if (y === H) v.set(x, y, z, "gray_concrete");
      else if (y % 4 === 0 && y > g + 1) v.set(x, y, z, "light_gray_concrete");
      continue;
    }
    const alongX = open.some(([dx]) => dx !== 0);                          // a face running along z (east/west)
    const t = alongX ? z : x;                                              // position along that face
    if (y === g + 1) v.set(x, y, z, "polished_andesite");                  // base course
    else if (y < firstSlab) {                                              // shopfront: glass with stone piers
      if (t % 3 === 0) v.set(x, y, z, "polished_andesite");
      else { v.set(x, y, z, "light_blue_stained_glass_pane", paneState(alongX)); windows.push({ x, y, z, dx: open[0][0], dz: open[0][1] }); }
    }
    else if (y === H) v.set(x, y, z, "smooth_stone");                      // cornice
    else if (y % 4 === 0) v.set(x, y, z, "light_gray_concrete");           // storey line
    else if (y % 4 === 3) v.set(x, y, z, wall);                            // spandrel, in the wall's material
    else if (t % 2 === 1) { v.set(x, y, z, "light_blue_stained_glass_pane", paneState(alongX)); windows.push({ x, y, z, dx: open[0][0], dz: open[0][1] }); }
    else v.set(x, y, z, "white_concrete");                                 // mullion, pale like the spandrels
  }
  if (onEdge(c) && H + 1 < 55) v.set(x, H + 1, z, "smooth_stone");        // parapet on the outer walls
}

// Plant rooms on the roof of the tallest tier: solid boxes stood on the roof deck, set back from the parapet
for (const c of col.values()) {
  if (c.top < 44 || onEdge(c) || (c.x + c.z) % 3 !== 0) continue;
  v.set(c.x, 45, c.z, "light_gray_concrete"); v.set(c.x, 46, c.z, "light_gray_concrete");
}

// Recessed entrance on the south face of the corner cell (10,0): a dark oak door, with a stone hood on the slab line
v.set(10, entrance.g + 1, 0, "dark_oak_door", doorState("lower"));
v.set(10, entrance.g + 2, 0, "dark_oak_door", doorState("upper"));
v.set(10, 4, 0, "stone_brick_slab", { type: "top" });

// Warm lamps behind about one pane in six, where the room behind the glass is air
for (const w of windows) {
  if ((w.x * 7 + w.y * 5 + w.z * 3) % 6 !== 0) continue;
  const ix = w.x - w.dx, iz = w.z - w.dz;
  if (!at(ix, iz) || v.val(ix, w.y, iz) !== 0) continue;
  v.set(ix, w.y, iz, "glowstone");
}

v.save(OUT);
console.log("built", v.count(), "blocks, palette", v.palette.length);

function paneState(alongX) {
  // a pane joins its neighbours along the face it sits in
  return alongX
    ? { north: "true", south: "true", east: "false", west: "false" }
    : { north: "false", south: "false", east: "true", west: "true" };
}
function doorState(half) {
  return { facing: "north", half, hinge: "left", open: "false", powered: "false" };
}
