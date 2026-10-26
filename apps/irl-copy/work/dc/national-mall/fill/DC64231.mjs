// DC64231: 1325 15th St NW, a 1920s-style brick apartment block (Residential-Apartment-Elevator).
// Massing follows the lidar roof: each cell's roof is smoothed over its 3x3 footprint neighbourhood and snapped to a flat
// tier (3 = low wing, 12 = body, 13 = setback, 14 = tower core). Columns stand on their own ground (foundation below),
// floors are slabs at the storey lines, the shell is brick with calcite trim and glass-pane window bays, and the interior is air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64231.cells.json", "utf8"));
const W = 11, D = 32, H = 26;

const BRICK = "bricks", TRIM = "calcite", BASE = "stone_bricks", SLAB = "smooth_stone", ROOF = "stone";
const GLASS = "glass_pane", EQUIP = "iron_block", LIGHT = "glowstone", DOOR = "dark_oak_door";
const FLOORS = [0, 3, 6, 9, 12];                       // storey lines: base course, then a floor every 3 blocks

// footprint and per-cell ground / lidar roof
const info = new Map();
for (const [x, z, g, r] of cells) info.set(`${x},${z}`, { g, r });
const inFp = (x, z) => info.has(`${x},${z}`);

// smoothed lidar roof (3x3 mean over the footprint), snapped to flat tiers
const tierOf = (v) => (v < 2.5 ? 3 : v < 13.2 ? 12 : 14);
const top = new Map();
for (const [key, { r }] of info) {
  const [x, z] = key.split(",").map(Number);
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const k = info.get(`${x + dx},${z + dz}`); if (k) { s += k.r; n++; }
  }
  top.set(key, tierOf(s / n));
}
const topAt = (x, z) => top.get(`${x},${z}`);
const gAt = (x, z) => info.get(`${x},${z}`).g;

// a face is exposed when the neighbour is outside the footprint or stands lower at this height
const exposed = (x, y, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
  const nx = x + dx, nz = z + dz;
  return !inFp(nx, nz) || topAt(nx, nz) <= y;
});

const v = new Voxels([W, H, D]);
const lights = [];                                      // interior glowstone cells behind glass, placed after the shell

// window bays: along the facade, a 1-block brick pier every third block, glass between
const isPier = (along) => ((along % 3) + 3) % 3 === 0;

for (const [key, { g }] of info) {
  const [x, z] = key.split(",").map(Number);
  const T = topAt(x, z);
  for (let y = 0; y < T; y++) {
    const ext = exposed(x, y, z);
    if (y < g) { v.set(x, y, z, BASE); continue; }                       // foundation under the lower ground
    if (y === 0) { v.set(x, y, z, ext ? BASE : SLAB); continue; }          // ground slab / base course
    if (y === T - 1) { v.set(x, y, z, ext ? TRIM : ROOF); continue; }      // parapet cap / roof deck
    if (FLOORS.includes(y)) { v.set(x, y, z, ext ? TRIM : SLAB); continue; } // storey line / floor slab
    if (!ext) continue;                                                    // interior air
    // facade: which face (-x, +x, -z, +z) and the along-wall index
    const alongZ = !inFp(x - 1, z) || !inFp(x + 1, z) ? z : x;
    const pier = isPier(alongZ);
    if (pier) { v.set(x, y, z, BRICK); continue; }
    const pane = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
    if (!inFp(x - 1, z) || !inFp(x + 1, z)) { pane.north = "true"; pane.south = "true"; pane.east = "false"; pane.west = "false"; }
    else { pane.north = "false"; pane.south = "false"; pane.east = "true"; pane.west = "true"; }
    v.set(x, y, z, GLASS, pane);
    if (y === 4 && (alongZ % 4 === 1) && !inFp(x - 1, z) && inFp(x + 1, z)) lights.push([x + 1, y, z]);
    if (y === 4 && (alongZ % 4 === 1) && inFp(x - 1, z) && !inFp(x + 1, z)) lights.push([x - 1, y, z]);
  }
}

// lit flats behind some glass (interior cells on the floor slab, the air gap behind the pane)
for (const [x, y, z] of lights) if (!v.get(x, y, z)) v.set(x, y, z, LIGHT);

// the entrance: a dark oak door set into the west face of the body, at the ground window row
const door = [2, 1, 7];
v.set(door[0], door[1], door[2], DOOR, { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(door[0], door[1] + 1, door[2], DOOR, { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });

// rooftop plant: two condenser blocks on the body's roof, clear of the parapet
for (const [x, z] of [[4, 2], [8, 11]]) v.set(x, topAt(x, z), z, EQUIP);

const res = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC64231.nbt");
console.log("saved", res);
