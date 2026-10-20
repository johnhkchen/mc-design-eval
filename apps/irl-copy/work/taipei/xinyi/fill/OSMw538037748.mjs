import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538037748";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 24;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height (y 0 is lowest ground)
const k = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(k(x, z), gr);
const has = (x, z) => ground.has(k(x, z));

// Safe setter: ignores out-of-volume writes; props optional
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward directions: [dx, dz, facing]
const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [1, 0, "east"],
  [-1, 0, "west"],
];

function outwardFaces(x, z) {
  return DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
}

// Glass pane connection props for a wall plane facing the given direction
function paneProps(facing) {
  const alongZ = facing === "east" || facing === "west"; // wall plane runs north-south
  return {
    north: alongZ ? "true" : "false",
    south: alongZ ? "true" : "false",
    east: alongZ ? "false" : "true",
    west: alongZ ? "false" : "true",
    waterlogged: "false",
  };
}

// Main centroid for rooftop penthouse
let sx = 0, sz = 0;
for (const [x, z] of cells) { sx += x; sz += z; }
const cx = Math.round(sx / cells.length);
const cz = Math.round(sz / cells.length);

// Choose the main entrance: south-facing perimeter cell nearest the middle of the front
let entrance = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    for (const [dx, dz, facing] of outwardFaces(x, z)) {
      if (facing !== "south") continue;
      const d = Math.abs(x - 13);
      if (d < best) { best = d; entrance = { x, z, facing, t: x }; }
    }
  }
  if (!entrance) {
    // fallback: any perimeter cell nearest the middle of the footprint
    best = Infinity;
    for (const [x, z] of cells) {
      const f = outwardFaces(x, z);
      if (!f.length) continue;
      const d = Math.abs(x - cx) + Math.abs(z - cz);
      if (d < best) { best = d; entrance = { x, z, facing: f[0][2], t: x }; }
    }
  }
}

let roofLevelAtCentre = 10;

for (const [x, z, gr0] of cells) {
  const G = Math.min(Math.max(0, gr0), 12);          // ground under this cell
  const R = Math.max(10, G + 10);                    // roof slab top block (about 11 above lowest ground)
  if (x === cx && z === cz) roofLevelAtCentre = R;

  // 1. Foundation solid from y 0 up to ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  // 2. Base course at ground level
  put(x, G, z, "smooth_stone");

  // 3. Floor slab over the first storey (solid across footprint, no interior air beyond the shell)
  put(x, G + 5, z, "light_gray_concrete");

  // 4. Roof slab across footprint
  put(x, R, z, "light_gray_concrete");

  const faces = outwardFaces(x, z);
  if (faces.length === 0) continue; // interior cell: slabs only, leaving an air gap

  const [, , facing] = faces[0];
  const alongNS = facing === "north" || facing === "south";
  const t = alongNS ? x : z;                // position along the wall
  const corner = faces.length > 1;
  const pier = corner || t % 3 === 0;
  const isEntrance = entrance && x === entrance.x && z === entrance.z;

  // Ground storey: piers, glass shopfront, lintel
  for (let y = G + 1; y <= G + 3; y++) {
    if (isEntrance) {
      if (y === G + 1) put(x, y, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === G + 2) put(x, y, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else if (pier) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass_pane", paneProps(facing));
    }
  }
  // Lintel / canopy band at G+4
  if (isEntrance) {
    put(x, G + 4, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  } else {
    put(x, G + 4, z, "white_concrete");
  }

  // Upper storey: spandrel at G+6, windows G+7..R-2, spandrel at R-1
  put(x, G + 6, z, "light_gray_concrete");
  put(x, R - 1, z, "light_gray_concrete");
  for (let y = G + 7; y <= R - 2; y++) {
    if (pier) {
      put(x, y, z, "white_concrete");
    } else if (t % 6 === 4 && y === G + 8) {
      put(x, y, z, "shroomlight"); // warm light in some windows
    } else {
      put(x, y, z, "glass_pane", paneProps(facing));
    }
  }

  // Parapet and cornice cap on the perimeter
  put(x, R + 1, z, "white_concrete");
  put(x, R + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Rooftop mechanical penthouse near the centroid
for (const [x, z] of cells) {
  if (Math.abs(x - cx) > 3 || Math.abs(z - cz) > 2) continue;
  if (outwardFaces(x, z).length) continue; // keep the parapet clear
  put(x, roofLevelAtCentre + 1, z, "light_gray_concrete");
  put(x, roofLevelAtCentre + 2, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
