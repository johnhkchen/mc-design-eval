// Way 541489281: a 1930s-50s Auckland commercial block, three storeys over a shopfront, flat roof on a parapet.
// The lidar roof is 14 above y 0 across the main body, so it stands three 4-block storeys (floor lines at y 2, 6, 10)
// with a roof at 14; the low south-east wing (roof 0-8) is one storey on a flat roof at y 7. Plaster walls, stone
// base and cornice, quartz piers, glass panes between them, a shopfront with a dark-oak door on the north face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_541489281.cells.json", "utf8"));
const g = new Voxels([25, 27, 18]);

const foot = new Map();                                   // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof });
const inside = (x, z) => foot.has(`${x},${z}`);
const perimeter = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

const MAIN_ROOF = 14;                                     // lidar roof for the main body; anything lower is a wing
const WING_ROOF = 7;                                      // wing roof surface, a clean tier one storey up
const isMain = (roof) => roof >= 10;

// Facade faces: north/south run along x, east/west along z; u is the position along the face.
// Every third column is a pier; the two between are glass. The north door sits at x 4.
const DOOR = { x: 4, z: 0 };
const bay = (u) => u % 3 === 0;

const paneState = (x, z, face) => {
  const axisA = face === "n" || face === "s" ? [x - 1, z] : [x, z - 1];
  const axisB = face === "n" || face === "s" ? [x + 1, z] : [x, z + 1];
  const on = (c) => (inside(c[0], c[1]) ? "true" : "false");
  const a = on(axisA), b = on(axisB);
  const ew = face === "n" || face === "s";
  return ew
    ? { north: "false", south: "false", east: b, west: a, waterlogged: "false" }
    : { north: a, south: b, east: "false", west: "false", waterlogged: "false" };
};

// The face a perimeter cell shows (north wins a corner; then south, west, east).
const faceOf = (x, z) => (!inside(x, z - 1) ? "n" : !inside(x, z + 1) ? "s" : !inside(x - 1, z) ? "w" : "e");
const uOf = (x, z, face) => (face === "n" || face === "s" ? x : z);

// Foundation, floors, roof, and the walls of every footprint cell.
for (const [key, { ground: gr, roof }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const main = isMain(roof);
  const perim = perimeter(x, z);

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");                 // foundation up to the lowest-to-highest ground
  g.set(x, gr, z, perim ? "stone_bricks" : "smooth_stone");                   // plinth course / ground floor slab

  if (main) {
    g.set(x, 6, z, "smooth_stone");                                           // storey line / floor
    g.set(x, 10, z, "smooth_stone");                                          // storey line / floor
    if (perim) {
      g.set(x, 13, z, "stone_bricks");                                        // cornice
      g.set(x, 14, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });  // parapet
    } else {
      g.set(x, 13, z, "stone");                                               // roof membrane
    }
  } else {
    g.set(x, 6, z, perim ? "stone_bricks" : "stone");                         // wing cornice / wing roof
  }

  if (!perim) continue;                                                       // interior: air behind the glass
  const face = faceOf(x, z);
  const u = uOf(x, z, face);
  const isDoor = x === DOOR.x && z === DOOR.z;

  // Ground storey: a shopfront from the plinth to the fascia at y 5.
  for (let y = gr + 1; y <= 5; y++) {
    if (y === 5) { g.set(x, y, z, "dark_oak_planks"); continue; }              // fascia
    if (isDoor && y <= gr + 2) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoor && y === gr + 3) { g.set(x, y, z, "polished_andesite"); continue; } // door head frame
    if (bay(u)) { g.set(x, y, z, "polished_andesite"); continue; }             // shopfront pier
    g.set(x, y, z, "glass_pane", paneState(x, z, face));
  }

  if (!main) continue;

  // Upper storeys: glass in the middle rows, a spandrel under the second storey's glass, quartz piers all the way up.
  const upper = [
    [7, 8, "glass"], [9, 9, "spandrel"],
    [11, 12, "glass"],
  ];
  for (const [y0, y1, kind] of upper) {
    for (let y = y0; y <= y1; y++) {
      if (bay(u)) g.set(x, y, z, "smooth_quartz");
      else if (kind === "glass") g.set(x, y, z, "glass_pane", paneState(x, z, face));
      else g.set(x, y, z, "white_concrete");
    }
  }
}

// Warm lights two cells in from the glass, on the floor of each storey: lanterns up top, a shroomlight at the shop.
const lightAt = (x, y, z, dx, dz) => {
  const x1 = x + dx, z1 = z + dz, x2 = x + 2 * dx, z2 = z + 2 * dz;
  if (!inside(x1, z1) || !inside(x2, z2) || perimeter(x1, z1) || perimeter(x2, z2)) return;
  return [x2, y, z2];
};
for (const [key, { ground: gr, roof }] of foot) {
  const [x, z] = key.split(",").map(Number);
  if (!perimeter(x, z)) continue;
  const face = faceOf(x, z);
  if (face !== "n" && face !== "s") continue;
  const dz = face === "n" ? 1 : -1;
  const u = uOf(x, z, face);
  if (bay(u)) continue;
  if (isMain(roof) && u % 6 === 2) {
    const a = lightAt(x, 7, z, 0, dz);
    if (a) g.set(a[0], a[1], a[2], "lantern", { hanging: "false" });
    const b = lightAt(x, 11, z, 0, dz);
    if (b) g.set(b[0], b[1], b[2], "lantern", { hanging: "false" });
  }
  if (u % 6 === 5 && gr <= 1) {
    const s = lightAt(x, gr + 1, z, 0, dz);
    if (s) g.set(s[0], s[1], s[2], "shroomlight");
  }
}

// Roof plant: a penthouse box and a smaller plant room on the main roof, set in from the parapet.
const plant = (x0, x1, z0, z1) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const f = foot.get(`${x},${z}`);
    if (!f || !isMain(f.roof) || perimeter(x, z)) continue;
    g.set(x, 14, z, "light_gray_concrete");
    g.set(x, 15, z, "light_gray_concrete");
    g.set(x, 16, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
};
plant(8, 13, 6, 8);
plant(16, 18, 10, 11);

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_541489281.nbt");
console.log("built way_541489281", g.count(), "blocks");
