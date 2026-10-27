// Way 1097140905: a two-storey Edwardian brick shop block (red brick on a stone plinth, cream plaster bands and
// pilasters, glazed shopfront on the downhill street front, flat roof with a cream cornice). Footprint 15 x 10 blocks,
// 85 cells on the lidar: each cell stands on its own ground (stone foundation to y = ground), the storey lines sit at
// fixed heights above y 0, and the roof is the lidar's flat 7 (top solid y 6, roof surface y 7 for the equipment).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1097140905.cells.json`, "utf8"));
const g = new Voxels([15, 20, 10]);

const byXZ = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inside = (x, z) => byXZ.has(`${x},${z}`);
// the cell on the other side of a face, and the cell inward from it (the room behind a window)
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const exposed = (x, z) => Object.keys(OUT).filter((f) => !inside(x + OUT[f][0], z + OUT[f][1]));
const perimeter = (x, z) => exposed(x, z).length > 0;

const PANE = (along) => ({ north: "false", east: "false", south: "false", west: "false", waterlogged: "false", ...along });
const DOOR = { x: 2, z: 9 };       // the street door, on the downhill (south) front

for (const [x, z, ground, roof] of cells) {
  const top = roof - 1;            // the last solid course (cornice and flat roof)
  const upper = top - 3;           // first-floor slab line: ground storey 0..upper-1, upper storey upper..top
  // foundation and base course: stone from y 0 up to and including the cell's ground
  for (let y = 0; y <= ground; y++) g.set(x, y, z, "stone_bricks", {});
  if (!perimeter(x, z)) {
    // interior: the floor slabs only, air between them (the rooms behind the glass)
    g.set(x, upper, z, "smooth_quartz", {});
    g.set(x, top, z, "stone", {});
    continue;
  }
  const faces = exposed(x, z), face = faces[0];
  const idx = face === "N" || face === "S" ? x : z;   // position along the exposed face
  const bay = idx % 2 === 1;                         // every other cell is a window bay; the rest is brick
  const alongState = face === "N" || face === "S" ? { east: "true", west: "true" } : { north: "true", south: "true" };
  const street = face === "S" && ground <= 1;
  for (let y = ground + 1; y <= top; y++) {
    if (y === top) { g.set(x, y, z, "smooth_quartz", {}); continue; }                 // cornice
    if (y === upper) {                                                                // fascia / storey band
      if (z === DOOR.z && Math.abs(x - DOOR.x) <= 1) g.set(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });  // canopy over the door
      else g.set(x, y, z, "smooth_quartz", {});
      continue;
    }
    if (y < upper && street) {                                                        // shopfront
      if (x === DOOR.x && z === DOOR.z) g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === ground + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "glass_pane", PANE(alongState));
      continue;
    }
    if (bay) g.set(x, y, z, "glass_pane", PANE(alongState));                           // window bay
    else g.set(x, y, z, "bricks", {});
  }
  // warm lights in the room behind some windows: hanging lanterns from the slab above
  if (bay || street) {
    const [dx, dz] = IN[face];
    const ix = x + dx, iz = z + dz;
    if (inside(ix, iz) && !perimeter(ix, iz)) {
      const lightY = street ? ground + 1 : top - 1;
      const lit = street ? idx % 4 === 0 : idx % 6 === 1;
      if (lit) g.set(ix, lightY, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// roof plant on a few interior roof cells (on the flat roof, standing on the slab below)
const roofCells = cells.filter(([x, z]) => !perimeter(x, z) && (x + z) % 7 === 3);
for (const [x, z, , roof] of roofCells.slice(0, 3)) g.set(x, roof, z, "iron_block", {});

const out = `${DIR}/way_1097140905.nbt`;
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, palette ${r.palette}`);
