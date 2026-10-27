// Mt Eden / Eden Terrace: a 1930s stripped-classical commercial block, reinforced concrete under a plaster skin.
// Four storeys over a basement on the downhill side, a three-storey wing at the south-west, shopfront and a verandah-style
// canopy on the north street front, pilaster bays of two glazed bays to one pier, cornice and roof plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241844.cells.json", "utf8"));   // [x, z, ground, roof]

const W = 34, H = 24, D = 49;
// Lidar roof heights snapped to two flat tiers: the main block to 21 (four 4-block storeys), the south-west wing to 17.
const TOP_MAIN = 21, TOP_WING = 17;
// Storey lines: a slab at L, glazing at L+1 and L+2, a spandrel at L+3. Line 1 is the basement on the downhill side.
const LINES = [1, 5, 9, 13, 17];
const GROUND_LINE = 5;
const DOOR_X = 16, DOOR_Z = 0;

const fp = new Map();
for (const [x, z, g, r] of cells) fp.set(`${x},${z}`, { g, top: r >= 20 ? TOP_MAIN : TOP_WING });
const at = (x, z) => fp.get(`${x},${z}`);
// a cell has volume at y when it is in the footprint and y is below its top (foundation and building are one column)
const hasVolume = (x, z, y) => { const c = at(x, z); return !!c && y < c.top; };
// the faces of a building cell at y that meet air: the neighbour has no volume there, so the wall is outside
const exposedFaces = (x, z, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !hasVolume(x + dx, z + dz, y));

const v = new Voxels([W, H, D]);
const glow = [];
const storeyLine = (y) => Math.max(...LINES.filter((l) => l <= y));

for (const [key, { g, top }] of fp) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone");                       // foundation up to the lidar ground
  for (let y = g; y < top; y++) {
    const faces = exposedFaces(x, z, y);
    const outer = faces.length > 0;
    if (y === g) { v.set(x, y, z, outer ? "stone_bricks" : "smooth_stone"); continue; }   // base course / floor
    if (y === top - 1) { v.set(x, y, z, outer ? "smooth_quartz" : "smooth_stone"); continue; }  // cornice / roof deck
    if (!outer) { if (LINES.includes(y)) v.set(x, y, z, "smooth_stone"); continue; }  // floor slabs; the rest is air
    const L = storeyLine(y), o = y - L;
    if (o === 0) { v.set(x, y, z, "smooth_quartz"); continue; }               // string course
    if (o === 3) { v.set(x, y, z, L === GROUND_LINE && faces.some(([, dz]) => dz === -1) ? "dark_oak_planks" : "white_concrete"); continue; }  // spandrel; fascia on the shopfront
    // glazing band: the shopfront is glass along the north street face; elsewhere two glazed bays to one pier
    const shop = L === GROUND_LINE && faces.some(([, dz]) => dz === -1);
    const glassFace = shop ? faces.find(([, dz]) => dz === -1)
      : faces.find(([dx, dz]) => ((dz !== 0 ? x : z) % 3) !== 0);
    if (!glassFace) { v.set(x, y, z, "white_concrete"); continue; }            // pier
    v.set(x, y, z, "light_blue_stained_glass");
    // a warm light in the air behind about one glass in five, a block inside the wall
    if (o === 1 && (x * 7 + z * 3 + L) % 5 === 0) {
      const [dx, dz] = glassFace, ix = x - dx, iz = z - dz;
      const c = at(ix, iz);
      if (c && y >= c.g && y < c.top && exposedFaces(ix, iz, y).length === 0) glow.push([ix, y, iz]);
    }
  }
}

for (const [x, y, z] of glow) v.set(x, y, z, "glowstone");

// Entrance on the north street front: a dark oak door in the shopfront, under a canopy slab.
const doorState = { facing: "north", hinge: "left", open: "false", powered: "false" };
v.set(DOOR_X, GROUND_LINE, DOOR_Z, "dark_oak_door", { ...doorState, half: "lower" });
v.set(DOOR_X, GROUND_LINE + 1, DOOR_Z, "dark_oak_door", { ...doorState, half: "upper" });
for (const dx of [-1, 0, 1]) v.set(DOOR_X + dx, GROUND_LINE + 2, DOOR_Z, "dark_oak_slab", { type: "top", waterlogged: "false" });

// Roof plant on the main block, kept one cell in from the cornice: a lift overrun and two condensers.
const roofMain = (x, z) => at(x, z)?.top === TOP_MAIN;
const mx = cells.reduce((s, c) => s + c[0], 0) / cells.length, mz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
let plant = null;
for (const [key, c] of fp) {
  if (c.top !== TOP_MAIN) continue;
  const [x0, z0] = key.split(",").map(Number);
  let ok = true;
  for (let dx = -1; dx <= 3 && ok; dx++) for (let dz = -1; dz <= 2 && ok; dz++) ok = roofMain(x0 + dx, z0 + dz);
  if (!ok) continue;
  const d = Math.hypot(x0 + 1 - mx, z0 + 0.5 - mz);
  if (!plant || d < plant.d) plant = { x0, z0, d };
}
if (plant) {
  const { x0, z0 } = plant;
  for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 2; dz++) {
    for (let y = TOP_MAIN; y < TOP_MAIN + 2; y++) v.set(x0 + dx, y, z0 + dz, "white_concrete");
    v.set(x0 + dx, TOP_MAIN + 2, z0 + dz, "smooth_quartz");
  }
  v.set(x0 - 1, TOP_MAIN, z0, "iron_block");
  v.set(x0 + 3, TOP_MAIN, z0 + 1, "iron_block");
}

const info = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241844.nbt");
console.log(JSON.stringify({ cells: cells.length, glow: glow.length, plant: plant ? [plant.x0, plant.z0] : null, ...info }));
