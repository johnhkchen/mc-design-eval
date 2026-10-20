import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542014627";
const W = 13, H = 23, D = 16;

// Low-rise two-storey commercial block, 1970s-80s Taipei: pale tiled concrete,
// tinted glazing, shopfront at ground, string courses, cornice and parapet.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, Math.round(g));
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const perim = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);

// Pier (solid mullion) positions on the bounding-box faces, every 3 blocks, corners solid.
function isPier(x, z) {
  const xEdge = x === 0 || x === W - 1;
  const zEdge = z === 0 || z === D - 1;
  if (xEdge && zEdge) return true;
  if (zEdge) return x % 3 === 0;
  if (xEdge) return z % 3 === 0;
  return true; // notch / concave perimeter cells read as solid wall
}

const SHOP_GLASS = "cyan_stained_glass_pane";
const UPPER_GLASS = "light_blue_stained_glass_pane";
const WALL = "white_concrete";
const CORNICE = "smooth_stone";

const B = new Map();
const put = (x, y, z, name, props = {}) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  B.set(`${x},${y},${z}`, { name, props });
};
const has = (x, y, z) => B.has(`${x},${y},${z}`);

// 1. Foundation: solid from y 0 up to and including each cell's ground.
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const g = gAt(x, z);
  for (let y = 0; y <= g; y++) put(x, y, z, "stone_bricks");
}

// 2. Building shell, floors and roof deck above each cell's ground.
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const g = gAt(x, z);
  if (perim(x, z)) {
    const pier = isPier(x, z);
    for (let y = g + 1; y <= 11; y++) {
      let name = WALL;
      let props = {};
      if (y === 1) name = "stone_bricks";                       // base course
      else if (y === 2 || y === 3) {                             // shopfront
        if (!pier) { name = SHOP_GLASS; }
      } else if (y === 4) name = "gray_concrete";                // fascia
      else if (y === 5) name = CORNICE;                          // string course
      else if (y >= 6 && y <= 8) {                               // upper windows
        if (!pier) name = UPPER_GLASS;
      } else if (y === 9) name = WALL;                           // lintel
      else if (y === 10) name = CORNICE;                         // cornice
      else if (y === 11) name = WALL;                            // parapet
      put(x, y, z, name, props);
    }
  } else {
    // interior: floor slab at storey line, roof deck at top; air between (no interiors)
    if (5 > g) put(x, 5, z, "light_gray_concrete");
    if (10 > g) put(x, 10, z, "light_gray_concrete");
  }
}

// 3. Entrance on the low-z (street) face, nearest the centre line.
{
  const minZ = Math.min(...cells.map(([, z]) => z));
  const cand = cells
    .filter(([x, z]) => z === minZ && perim(x, z))
    .sort((a, b) => Math.abs(a[0] - 6) - Math.abs(b[0] - 6));
  for (const [x, z, gr] of cand) {
    const g = Math.round(gr);
    const dy = Math.max(2, g + 1);
    if (dy + 1 > 4) continue;
    const facing = "south"; // player stands outside (low z) and faces into the building
    put(x, dy, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, dy + 1, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    break;
  }
}

// 4. Penthouse plant room on the roof, interior only, if all its cells are in the footprint.
{
  const px0 = 4, px1 = 8, pz0 = 5, pz1 = 10;
  let ok = true;
  for (let x = px0; x <= px1; x++)
    for (let z = pz0; z <= pz1; z++)
      if (!inFp(x, z) || perim(x, z) || gAt(x, z) > 10) ok = false;
  if (ok) {
    for (let x = px0; x <= px1; x++)
      for (let z = pz0; z <= pz1; z++)
        for (let y = 11; y <= 13; y++) put(x, y, z, WALL);
    for (let x = px0; x <= px1; x++)
      for (let z = pz0; z <= pz1; z++) put(x, 14, z, CORNICE);
    // clerestory band of glass on the outer ring (corners stay solid)
    for (let x = px0; x <= px1; x++)
      for (let z = pz0; z <= pz1; z++) {
        const edgeX = x === px0 || x === px1;
        const edgeZ = z === pz0 || z === pz1;
        if ((edgeX || edgeZ) && !(edgeX && edgeZ)) put(x, 12, z, UPPER_GLASS);
      }
  }
}

// 5. Warm lights behind some window glass (glowstone on the inward interior cell).
for (const [x, z, gr] of cells) {
  if (!perim(x, z) || isPier(x, z)) continue;
  const g = Math.round(gr);
  let dx = 0, dz = 0;
  if (z === 0) dz = 1; else if (z === D - 1) dz = -1;
  else if (x === 0) dx = 1; else if (x === W - 1) dx = -1;
  if (dx === 0 && dz === 0) continue;
  const ix = x + dx, iz = z + dz;
  if (!inFp(ix, iz) || perim(ix, iz)) continue;
  for (const y of [3, 7]) {
    if (y <= g) continue;
    if ((x + z) % 2 !== 0) continue;
    if (has(ix, y, iz)) continue;
    put(ix, y, iz, "glowstone");
  }
}

// 6. Glass panes: connect to neighbouring panes and solid walls, not to lights or doors.
const DIRS = [
  ["east", 1, 0], ["west", -1, 0], ["north", 0, -1], ["south", 0, 1],
];
for (const [key, entry] of B) {
  if (!entry.name.endsWith("_pane")) continue;
  const [x, y, z] = key.split(",").map(Number);
  const props = {};
  for (const [side, dx, dz] of DIRS) {
    const n = B.get(`${x + dx},${y},${z + dz}`);
    const connect = n && n.name !== "glowstone" && !n.name.includes("door");
    props[side] = connect ? "true" : "false";
  }
  entry.props = props;
}

// 7. Write the voxel volume.
const g = new Voxels([W, H, D]);
for (const [key, { name, props }] of B) {
  const [x, y, z] = key.split(",").map(Number);
  if (Object.keys(props).length) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}
g.save(`${DIR}/${ID}.nbt`);
