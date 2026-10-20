import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682856";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 25;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground height (rounded, >= 0)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(`${x},${z}`);
const grAt = (x, z) => ground.get(`${x},${z}`);

// Exterior faces of a footprint cell (a face is exposed where the neighbour is outside)
function faces(x, z) {
  const f = [];
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  return f;
}
const isEdge = (x, z) => faces(x, z).length > 0;

// Coordinate running along a face (x for north/south faces, z for east/west faces)
const alongOf = (face, x, z) => (face === "north" || face === "south" ? x : z);

// Cell just inside the building from an exterior face
const inward = {
  west: (x, z) => [x + 1, z],
  east: (x, z) => [x - 1, z],
  north: (x, z) => [x, z + 1],
  south: (x, z) => [x, z - 1],
};

// 1. Foundation: solid from y 0 up to each cell's ground
for (const [x, z] of cells) {
  const gr = grAt(x, z === undefined ? 0 : z);
  for (let y = 0; y < grAt(x, z); y++) g.set(x, y, z, "stone_bricks");
}

// 2. Floor slabs (storey lines at y 5) and roof deck (y 10), across the whole footprint
for (const [x, z] of cells) {
  g.set(x, 5, z, "smooth_stone");
  g.set(x, 10, z, "light_gray_concrete");
}

// 3. Entrance: the south-facing exposed cell nearest the median along-coordinate
const southCells = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => faces(x, z).includes("south") && faces(x, z).length === 1);
let doorCell = null;
if (southCells.length) {
  const us = southCells.map(([x]) => x).sort((a, b) => a - b);
  const med = us[Math.floor(us.length / 2)];
  doorCell = southCells.reduce((best, c) =>
    Math.abs(c[0] - med) < Math.abs(best[0] - med) ? c : best
  );
}

// 4. Exterior envelope, storey by storey
for (const [x, z] of cells) {
  const fs = faces(x, z);
  if (!fs.length) continue;
  const corner = fs.length > 1;
  const face = fs[0];
  const along = alongOf(face, x, z);
  const pier = corner || along % 3 === 0;
  const gr = grAt(x, z);
  const runsX = face === "north" || face === "south";
  const paneProps = runsX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = gr; y <= 11; y++) {
    if (y === 11) { g.set(x, y, z, "white_concrete"); continue; }        // parapet
    if (y === 10) { g.set(x, y, z, "smooth_quartz"); continue; }        // cornice
    if (y === gr && y <= 4) { g.set(x, y, z, "polished_granite"); continue; } // base course
    if (y === 4 || y === 9) { g.set(x, y, z, "smooth_quartz"); continue; }    // storey lines
    if (pier) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (y >= 1 && y <= 3) {
      g.set(x, y, z, "light_blue_stained_glass_pane", paneProps);      // shopfront glazing
    } else if (y === 5) {
      g.set(x, y, z, "white_concrete");                                  // spandrel
    } else if (y >= 6 && y <= 8) {
      g.set(x, y, z, "gray_stained_glass_pane", paneProps);            // upper windows
    }
  }
}

// 5. Entrance door and recessed lobby light
if (doorCell) {
  const [x, z] = doorCell;
  const gr = grAt(x, z);
  const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
  g.set(x, gr + 1, z, "dark_oak_door", { ...base, half: "lower" });
  g.set(x, gr + 2, z, "dark_oak_door", { ...base, half: "upper" });
}

// 6. Warm lights behind some windows (inside the building, in the air gap)
for (const [x, z] of cells) {
  const fs = faces(x, z);
  if (!fs.length || fs.length > 1) continue;
  const face = fs[0];
  const along = alongOf(face, x, z);
  const [ix, iz] = inward[face](x, z);
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  if (doorCell && x === doorCell[0] && z === doorCell[1]) continue;
  if (along % 4 !== 1) continue;
  const gr = grAt(x, z);
  if (gr <= 2) g.set(ix, 2, iz, "glowstone");
  g.set(ix, 7, iz, "glowstone");
}

// 7. Roof plant: a small penthouse on the roof, centred on the footprint
for (const [x, z] of cells) {
  if (x < 4 || x > 9 || z < 8 || z > 16) continue;
  const edge = isEdge(x, z);
  for (let y = 11; y <= 12; y++) {
    g.set(x, y, z, edge ? "smooth_quartz" : "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
