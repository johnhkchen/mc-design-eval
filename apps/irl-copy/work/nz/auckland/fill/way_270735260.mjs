// Way 270735260: a 1960s-70s Auckland commercial block (three storeys of cream concrete and glass on a stone
// plinth, a stone cornice and parapet), on the Mt Eden slope: flat roof at y 14 from the lidar, storey lines on
// absolute levels, foundation down to each cell's ground.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270735260.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..38, z 0..38

const g = new Voxels([39, 28, 39]);

const FOOT = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const has = (x, z) => FOOT.has(`${x},${z}`);
// faces that look out of the footprint: north is -z, east is +x (Minecraft's axes)
const FACES = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];
const outward = (x, z) => FACES.filter(([, dx, dz]) => !has(x + dx, z + dz));
const isPerimeter = (x, z) => outward(x, z).length > 0;

const FLOORS = [0, 4, 8, 12];      // storey slabs on absolute levels (12 is the roof slab)
const PARAPET = 14;                // lidar roof 14 (15 at the lidar's edges): the parapet sits on the flat roof

// the warm glass: the interior cell behind a window, on the floor slab
const BEHIND = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };

// the entrance: the lowest perimeter cell, on the low west side of the slope
let entrance = null;
for (const [x, z, ground] of cells) {
  if (!isPerimeter(x, z)) continue;
  if (!entrance || ground < entrance.ground) entrance = { x, z, ground, face: outward(x, z)[0] };
}

for (const [x, z, ground] of cells) {
  const faces = outward(x, z), perim = faces.length > 0, corner = faces.length > 1, u = x + z;

  // foundation: solid from y 0 up to this cell's ground, so nothing floats on the slope
  for (let y = 0; y < ground; y++) g.set(x, y, z, perim ? "stone_bricks" : "stone");

  if (!perim) {
    // interior: floor slabs and the roof slab, no interior walls; an air gap behind the glass
    for (const L of FLOORS) g.set(x, L, z, "smooth_stone");
    continue;
  }

  for (let y = ground; y <= PARAPET; y++) {
    let block;
    if (y >= 12) block = y === 13 ? "smooth_quartz" : "stone_bricks";        // cornice shelf, cornice face, parapet cap
    else if (y % 4 === 0 || y % 4 === 3) block = "stone_bricks";              // storey lines: sill and head
    else if (!corner && (u % 4 === 1 || u % 4 === 2)) block = "light_blue_stained_glass";
    else block = "smooth_quartz";                                              // piers, corners, spandrels
    g.set(x, y, z, block);
  }

  // warm lights behind some windows, on the floor slab inside the gap
  for (const [name] of faces) {
    const [ix, iz] = BEHIND[name];
    if (!has(x + ix, z + iz)) continue;
    const inward = FOOT.get(`${x + ix},${z + iz}`);
    for (const y of [5, 6, 9, 10]) {
      if (y < inward.ground || u % 4 === 0 || u % 4 === 3) continue;
      if ((u + y) % 5 === 0) g.set(x + ix, y, z + iz, "glowstone");
      else if ((u + y) % 5 === 2) g.set(x + ix, y, z + iz, "shroomlight");
    }
  }

}

// the entrance: a steel-framed door in the lowest wall, a stone canopy band over it and its two neighbours
{
  const { x, z, ground, face } = entrance;
  const [fname] = face;
  const facing = fname;
  g.set(x, ground, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, ground + 1, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  const along = fname === "north" || fname === "south" ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
  for (const [dx, dz] of [[0, 0], ...along]) {
    if (isPerimeter(x + dx, z + dz)) g.set(x + dx, ground + 2, z + dz, "stone_bricks");
  }
}

// roof plant on the flat roof, set in from the parapet
for (let x = 15; x <= 19; x++) for (let z = 15; z <= 17; z++) {
  if (has(x, z) && !isPerimeter(x, z)) g.set(x, 13, z, "light_gray_concrete");
}
for (let x = 16; x <= 18; x++) {
  if (has(x, 18) && !isPerimeter(x, 18)) g.set(x, 13, 18, "light_gray_concrete");
}
g.set(17, 14, 16, "smooth_quartz");

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270735260.nbt");
