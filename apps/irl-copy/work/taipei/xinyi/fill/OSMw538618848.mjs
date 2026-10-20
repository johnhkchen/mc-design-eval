// Taipei Xinyi, OSMw538618848: an 11 x 23 block, two-storey 1970s-80s concrete shophouse.
// Whitewashed concrete walls, grey pilasters, a shopfront with a centre door, and a flat roof
// with a parapet and a rooftop water tank. Storeys are 5 blocks pitched (about 3.5 m at 1.4 blocks/m).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618848";
const W = 11, H = 23, D = 23;

const cellsList = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"))
  .map(([x, z, gr]) => [x, z, Math.round(gr)]);
const ground = new Map(cellsList.map(([x, z, gr]) => [`${x},${z}`, gr]));
const inF = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) =>
  inF(x, z) && (!inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1));

const xs = cellsList.map(c => c[0]), zs = cellsList.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const fb = Math.max(...cellsList.map(c => c[2])); // ground-floor level, above the highest ground

const g = new Voxels([W, H, D]);
const put = (x, y, z, name, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D || !inF(x, z)) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

// Pane lying in a z-plane (front/back faces): connects east-west
const paneZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
// Pane lying in an x-plane (side faces): connects north-south
const paneX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundation: rock below ground, plinth concrete from each cell's ground up to the floor level
for (const [x, z, gr] of cellsList) {
  for (let y = 0; y < fb; y++) put(x, y, z, y < gr ? "stone" : "stone_bricks");
}

// 2. Shell: walls on the edge cells, floor and roof slabs on the interior
const wallName = y => {
  if (y === fb) return "polished_andesite";          // base course
  if (y === fb + 5 || y === fb + 10) return "smooth_stone"; // storey line and cornice
  if (y === fb + 12) return "smooth_stone";          // parapet cap
  return "white_concrete";
};
for (const [x, z] of cellsList.map(c => [c[0], c[1]])) {
  const edge = isEdge(x, z);
  for (let y = fb; y <= fb + 12; y++) {
    if (edge) put(x, y, z, wallName(y));
    else if (y === fb) put(x, y, z, "smooth_stone");                     // ground floor slab
    else if (y === fb + 5 || y === fb + 10) put(x, y, z, "light_gray_concrete"); // floor and roof slabs
  }
}

// 3. Front (street) facade at z = minZ: pilasters, shopfront, upper window grid, door
const frontPillars = [0, 3, 7, 10];
for (let t = 0; t <= 10; t++) {
  const x = minX + t;
  const pillar = frontPillars.includes(t);
  if (pillar) {
    for (let y = fb + 1; y <= fb + 9; y++) put(x, y, minZ, "light_gray_concrete");
    continue;
  }
  // shopfront glass, ground floor (door sits at t=5, transom glass above it)
  for (let y = fb + 1; y <= fb + 3; y++) {
    if (t === 5) { if (y === fb + 3) put(x, y, minZ, "glass_pane", paneZ); continue; }
    put(x, y, minZ, "glass_pane", paneZ);
  }
  put(x, fb + 4, minZ, "stone_bricks");            // shopfront lintel / fascia
  for (let y = fb + 6; y <= fb + 8; y++) put(x, y, minZ, "glass_pane", paneZ); // upper windows
}
// Entrance door (dark oak, lower and upper halves, facing out to the street)
put(minX + 5, fb + 1, minZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(minX + 5, fb + 2, minZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// Warm lights behind the glass (two shopfront glowstones, one upper shroomlight)
put(minX + 2, fb + 2, minZ + 2, "glowstone");
put(minX + 8, fb + 2, minZ + 2, "glowstone");
put(minX + 5, fb + 7, minZ + 2, "shroomlight");

// 4. Back face at z = maxZ: service door and a plain window grid
for (let t = 0; t <= 10; t++) {
  const x = minX + t;
  if ([2, 3, 7, 8].includes(t)) {
    for (let y = fb + 1; y <= fb + 3; y++) put(x, y, maxZ, "glass_pane", paneZ);
    for (let y = fb + 6; y <= fb + 8; y++) put(x, y, maxZ, "glass_pane", paneZ);
  }
}
put(minX + 5, fb + 1, maxZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(minX + 5, fb + 2, maxZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
put(minX + 3, fb + 7, maxZ - 2, "glowstone");

// 5. Side walls (west and east): pilasters and window bays along the depth
const sidePillars = [6, 12, 18];
const sideUpper = [2, 3, 4, 8, 9, 10, 14, 15, 16, 20, 21];
const sideLower = [2, 3, 4, 14, 15, 16];
for (const x of [minX, maxX]) {
  const inward = x === minX ? 1 : -1;
  for (let z = minZ; z <= maxZ; z++) {
    const t = z - minZ;
    if (sidePillars.includes(t)) {
      for (let y = fb + 1; y <= fb + 9; y++) put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (sideLower.includes(t)) for (let y = fb + 1; y <= fb + 3; y++) put(x, y, z, "glass_pane", paneX);
    if (sideUpper.includes(t)) for (let y = fb + 6; y <= fb + 8; y++) put(x, y, z, "glass_pane", paneX);
  }
  put(x + inward * 2, fb + 7, minZ + 3, "shroomlight");
}

// 6. Roof: rooftop water tank, condenser units, and a parapet already built by the shell
for (let x = minX + 3; x <= minX + 5; x++) {
  for (let z = minZ + 14; z <= minZ + 17; z++) {
    put(x, fb + 11, z, "stone_bricks");
    put(x, fb + 12, z, "stone_bricks");
  }
}
for (let x = minX + 7; x <= minX + 8; x++) {
  for (let z = minZ + 5; z <= minZ + 6; z++) {
    put(x, fb + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
