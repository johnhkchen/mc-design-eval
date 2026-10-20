import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-rise commercial block (c. 1990s), cream concrete with
// tinted glazing, stone base course, storey bands, cornice and parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408109";
const W = 17, D = 22, H = 23;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(c => c[2]));
const cells = new Map();                     // "x,z" -> base y of that cell
for (const [x, z, gr] of raw) cells.set(`${x},${z}`, gr - minG);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};
const has = (x, z) => cells.has(`${x},${z}`);

// Outward faces of a cell: north = -z, south = +z, west = -x, east = +x.
const outward = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};

// Centre-of-south-wall entrance: the boundary cell on the south face nearest x = 8.
let doorX = null;
{
  let best = Infinity;
  for (const [key] of cells) {
    const [x, z] = key.split(",").map(Number);
    if (outward(x, z).includes("south") && Math.abs(x - 8) < best) {
      best = Math.abs(x - 8);
      doorX = x;
    }
  }
}

for (const [key, b] of cells) {
  const [x, z] = key.split(",").map(Number);
  const faces = outward(x, z);
  const boundary = faces.length > 0;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Floor slab on the ground line and at the second-storey line.
  if (boundary) put(x, b, z, "stone_bricks");
  else put(x, b, z, "light_gray_concrete");
  if (!boundary) put(x, b + 5, z, "light_gray_concrete");

  // Roof deck at b+10 for every cell.
  if (boundary) put(x, b + 10, z, "polished_andesite");
  else put(x, b + 10, z, "light_gray_concrete");

  if (!boundary) {
    // Warm light behind some interior glass, standing on a floor.
    const h = (x * 7 + z * 13) % 5;
    if (h === 0) put(x, b + 6, z, "glowstone");
    if (h === 3) put(x, b + 1, z, "glowstone");
    // Rooftop plant on the centre of the roof.
    if (x >= 6 && x <= 10 && z >= 8 && z <= 13 && (x + z) % 2 === 0) {
      put(x, b + 11, z, "gray_concrete");
      if ((x + z) % 4 === 0) put(x, b + 12, z, "gray_concrete");
    }
    continue;
  }

  // Boundary walls: piers every three cells along each outward face.
  const corner = faces.length >= 2;
  const along = (faces.includes("north") || faces.includes("south")) ? x : z;
  const pier = corner || along % 3 === 0;

  // Storey lines and cornice bands on every wall cell.
  put(x, b + 4, z, "white_concrete");           // ground-floor lintel
  put(x, b + 5, z, "light_gray_concrete");      // storey band
  put(x, b + 9, z, "white_concrete");           // upper sill band
  put(x, b + 10, z, "polished_andesite");       // cornice
  put(x, b + 11, z, "white_concrete");          // parapet

  // Ground floor: shopfront glazing between piers.
  for (let y = b + 1; y <= b + 3; y++) {
    put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
  }
  // Upper storey: window grid.
  for (let y = b + 6; y <= b + 8; y++) {
    put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
  }

  // Warm light in some shopfronts and office windows.
  if (!pier && (x + z) % 4 === 1) put(x, b + 2, z, "shroomlight");

  // Entrance on the south face.
  if (faces.includes("south") && x === doorX) {
    put(x, b + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false", hinge_side: "left" });
    put(x, b + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, b + 3, z, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
