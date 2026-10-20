import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075551";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 6 x 16. Roof ~17 blocks above lowest ground: 3 storeys of ~5 blocks
// (ground shopfront storey plus two office storeys), parapet, small plant room.
const W = 6, H = 29, D = 16;
const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(k(x, z), gr);

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
// inward direction is opposite the exterior face
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

function faces(x, z) {
  const out = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!ground.has(k(x + dx, z + dz))) out.push(name);
  }
  return out;
}

function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const wallSet = new Set();
for (const [x, z] of cells) {
  if (faces(x, z).length > 0) wallSet.add(k(x, z));
}

// Entrance: north face (z = 0), x = 2
const entranceKey = k(2, 0);
const hasEntrance = ground.has(entranceKey);

// Position along the exterior face (for window/pier rhythm)
function tAlong(face, x, z) {
  return face === "north" || face === "south" ? x : z;
}

// Main pass: foundation, floors, walls, windows, shopfronts, door
for (const [x, z, gr] of cells) {
  const fs = faces(x, z);
  const wall = fs.length > 0;
  const corner = fs.length >= 2;
  const face = fs[0];
  const winOK = fs.length === 1 && tAlong(face, x, z) % 3 !== 0;
  const isEntrance = hasEntrance && x === 2 && z === 0;

  // Foundation: solid from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const b = gr; // building starts on this cell's ground

  // Floor slabs / storey lines / roof, at local heights
  put(x, b + 0, z, wall ? "polished_granite" : "smooth_stone");
  put(x, b + 5, z, wall ? "smooth_quartz" : "smooth_stone");
  put(x, b + 10, z, wall ? "smooth_quartz" : "smooth_stone");
  put(x, b + 16, z, wall ? "smooth_quartz" : "light_gray_concrete");

  if (!wall) {
    // Interior: air except floors (set above). Rooftop plant room handled below.
    continue;
  }

  for (let h = 1; h <= 15; h++) {
    if (h === 5 || h === 10) continue; // storey floors already placed
    const y = b + h;

    if (h >= 1 && h <= 3) {
      // Ground-floor shopfront
      if (isEntrance && (h === 1 || h === 2)) {
        continue; // door placed after the loop
      }
      if (isEntrance && h === 3) {
        put(x, y, z, "smooth_quartz");
        continue;
      }
      if (winOK) put(x, y, z, "glass_pane");
      else put(x, y, z, "smooth_quartz");
      continue;
    }

    if (h === 4) {
      put(x, y, z, "smooth_quartz"); // shopfront lintel
      continue;
    }

    if (h === 9 || h === 14) {
      put(x, y, z, "smooth_quartz"); // storey line
      continue;
    }

    if ((h >= 6 && h <= 8) || (h >= 11 && h <= 13)) {
      if (winOK) put(x, y, z, "glass_pane");
      else put(x, y, z, "white_concrete");
      continue;
    }

    // h = 15 cornice band and any remaining wall course
    put(x, y, z, corner ? "smooth_quartz" : "white_concrete");
  }

  // Parapet on perimeter (roof surface at b+16 already laid)
  put(x, b + 16, z, "smooth_quartz");
}

// Entrance door (two blocks tall) on the north face
if (hasEntrance) {
  const gr = ground.get(entranceKey);
  put(2, gr + 1, 0, "iron_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(2, gr + 2, 0, "iron_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Warm light behind some upper-storey windows: glowstone on the interior floor
// just inside the glass, sitting on the storey slab at h6 / h11.
for (const [x, z, gr] of cells) {
  const fs = faces(x, z);
  if (fs.length !== 1) continue;
  const face = fs[0];
  const winOK = tAlong(face, x, z) % 3 !== 0;
  if (!winOK) continue;
  const [dx, dz] = INWARD[face];
  const ix = x + dx, iz = z + dz;
  if (!ground.has(k(ix, iz)) || wallSet.has(k(ix, iz))) continue;
  const igr = ground.get(k(ix, iz));
  if (((x + z) % 3) === 0) {
    put(ix, igr + 6, iz, "glowstone");
  }
  if (((x + 2 * z) % 4) === 1) {
    put(ix, igr + 11, iz, "glowstone");
  }
}

// Lobby light just inside the entrance
if (hasEntrance) {
  const gr = ground.get(entranceKey);
  if (ground.has(k(2, 1)) && !wallSet.has(k(2, 1))) {
    put(2, ground.get(k(2, 1)) + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Rooftop plant room on the interior cells x 2..3, z 5..10 (above roof at local h16)
for (const [x, z, gr] of cells) {
  if (x < 2 || x > 3 || z < 5 || z > 10) continue;
  const top = gr + 16;
  for (let h = 1; h <= 2; h++) {
    put(x, top + h, z, "light_gray_concrete");
  }
  put(x, top + 3, z, "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);
