// DC70170: a 3-storey Federal-to-Beaux-Arts commercial block, 8 x 6 blocks, flat roof at y 7 (lidar 6-7 above y 0).
// Red brick walls, a limestone-look (smooth quartz) string course, pilasters and cornice, a stone plinth, a shopfront
// on the ground floor of the street face (z 0), glass in the upper bays, warm light behind some panes.
// Each storey stands on the slab below; interiors are an air gap behind the glass (no rooms), one floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70170.cells.json", "utf8"));
const X = 8, Z = 6;
const ROOF = 7;                      // lidar roof 6-7 above y 0: smoothed to one flat tier
const H = 19;                        // headroom for the array, nothing built above the cornice

const g = new Voxels([X, H, Z]);

// rows: y0 plinth + ground floor slab, y1-2 ground storey, y3 floor slab / string course, y4-5 upper storey, y6 roof + cornice
const PLINTH = "stone_bricks", LIMESTONE = "smooth_quartz", STONE = "smooth_stone", BRICK = "bricks", PILLAR = "quartz_pillar";
const GLASS = "glass_pane", FRAME = "dark_oak_planks";

// footprint, from the cells file (every cell's ground is 0 here, so no foundation fill is needed)
const onFootprint = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFoot = (x, z) => onFootprint.has(`${x},${z}`);

// is (x, z) on the outer ring of the footprint, and which face is it on?
function faceOf(x, z) {
  if (z === 0) return "front";
  if (z === Z - 1) return "back";
  if (x === 0) return "west";
  if (x === X - 1) return "east";
  return null;
}
const isCorner = (x, z) => (x === 0 || x === X - 1) && (z === 0 || z === Z - 1);

// window bays along each face (index along the face, 1..6 on front/back, 1..4 on the sides)
const BAY = {
  front: { 1: "G", 2: "G", 3: "DOOR", 4: "P", 5: "G", 6: "G" },   // door on the street face, ground storey only
  back:  { 1: "G", 2: "G", 3: "P", 4: "G", 5: "G", 6: "P" },
  west:  { 1: "G", 2: "P", 3: "P", 4: "G" },
  east:  { 1: "G", 2: "P", 3: "P", 4: "G" },
};
const along = (face, x, z) => (face === "front" || face === "back" ? x : z);

// a ring cell at storey row y: returns [block, state?] for that cell
function ringCell(face, x, z, y) {
  if (isCorner(x, z) || y === 6) return null;                   // corners and cornice handled apart
  const k = along(face, x, z);
  const bay = BAY[face][k];
  const ground = y <= 2;
  if (bay === "G") {
    if (ground && face === "front") return [GLASS, glassState(face)];   // shopfront
    return [GLASS, glassState(face)];
  }
  if (bay === "DOOR") {
    if (y === 1) return ["dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (y === 2) return ["dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }];
    return null;
  }
  return [BRICK];                                                 // piers and solid spans
}
function glassState(face) {
  const ew = face === "front" || face === "back";
  return { north: String(!ew), south: String(!ew), east: String(ew), west: String(ew), waterlogged: "false" };
}

// storey rows: the ring is brick and glass; floor slabs and the roof are solid across the footprint
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const face = faceOf(x, z);

  // y0: plinth ring and a solid ground-floor slab
  g.set(x, 0, z, isCorner(x, z) || face ? PLINTH : STONE);

  // y3: floor slab between ground and upper storey (the string course on the ring)
  g.set(x, 3, z, face ? LIMESTONE : STONE);

  // y6: roof deck, with a quartz cornice slab on the ring
  if (face) g.set(x, 6, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  else g.set(x, 6, z, STONE);

  if (isCorner(x, z)) {
    for (const y of [1, 2, 4, 5]) g.set(x, y, z, PILLAR, { axis: "y" });
    continue;
  }

  if (face) {
    for (const y of [1, 2, 4, 5]) {
      const c = ringCell(face, x, z, y);
      if (!c) continue;
      // upper storey has no door
      if (y >= 4 && c[0] === "dark_oak_door") { g.set(x, y, z, BRICK); continue; }
      g.set(x, y, z, c[0], c[1]);
    }
  } else {
    // interior: air behind the glass. Warm light in a few rooms behind panes.
    // (air left out of the file; lights placed below)
  }
}

// upper-storey shopfront-like bay on the street face, lanterns hanging in the interior air under the roof
const warm = [
  [2, 1, 1, "glowstone"], [5, 1, 1, "glowstone"],
  [2, 4, 1, "glowstone"], [5, 4, 1, "glowstone"],
  [3, 4, 4, "shroomlight"],
];
for (const [x, y, z, b] of warm) g.set(x, y, z, b);
g.set(3, 5, 2, "lantern", { hanging: "true", waterlogged: "false" });
g.set(6, 5, 2, "lantern", { hanging: "true", waterlogged: "false" });

// the street face's ground bays get a dark frame strip along the door pier (shopfront mullions)
for (const x of [4]) g.set(x, 2, 0, FRAME);

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC70170.nbt");
console.log("DC70170.nbt written:", g.count(), "blocks");
