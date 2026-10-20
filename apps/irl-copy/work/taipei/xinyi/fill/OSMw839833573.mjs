import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s Taipei commercial block: two storeys over a shopfront,
// white tiled-concrete walls, light-grey storey bands, aluminium-framed
// blue-tinted windows, flat roof with a cornice, parapet and water tank.
const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw839833573";
const W = 25, H = 23, D = 20;

const cells = JSON.parse(readFileSync(`${SRC}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> ground y
const fp = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) fp.set(`${x},${z}`, Math.min(gr, H - 2));
}
const has = (x, z) => fp.has(`${x},${z}`);
const gr = (x, z) => fp.get(`${x},${z}`);

const B = Math.min(...fp.values());   // lowest ground under the footprint
const TOP = B + 11;                   // roof/parapet top, 11 blocks above lowest ground

const DIRS = [
  { dx: 0, dz: -1, f: "north" },
  { dx: 0, dz: 1, f: "south" },
  { dx: -1, dz: 0, f: "west" },
  { dx: 1, dz: 0, f: "east" },
];
const faces = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

// Write only above the cell's own foundation (ground) and inside the grid.
function put(x, y, z, id, props) {
  if (y < 0 || y >= H || y <= gr(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [k, ground] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= ground; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Entrance: longest facade gets the door, at a cell on the lowest ground.
const faceCount = { north: 0, south: 0, west: 0, east: 0 };
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  const fs = faces(x, z);
  if (fs.length) faceCount[fs[0].f]++;
}
const doorFace = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const doorCandidates = [];
for (const [k, ground] of fp) {
  const [x, z] = k.split(",").map(Number);
  const fs = faces(x, z);
  if (fs.length && fs[0].f === doorFace && ground === B) {
    doorCandidates.push({ x, z, t: fs[0].dz !== 0 ? x : z });
  }
}
doorCandidates.sort((a, b) => a.t - b.t);
const doorCell = doorCandidates.length
  ? doorCandidates[Math.floor(doorCandidates.length / 2)]
  : null;

// 3. Interior: floor slabs at storey lines and the roof deck.
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (faces(x, z).length) continue;
  put(x, B + 5, z, "light_gray_concrete");
  put(x, B + 10, z, "light_gray_concrete");
}

// 4. Facade walls, windows, shopfront, door, warm lights.
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  const fs = faces(x, z);
  if (!fs.length) continue;
  const f = fs[0];
  const t = f.dz !== 0 ? x : z;                       // position along the face
  const isDoor = doorCell && doorCell.x === x && doorCell.z === z && f.f === doorFace;
  const pier = t % 3 === 0;
  const ground = gr(x, z);

  for (let y = B + 1; y <= Math.min(TOP, H - 1); y++) {
    const rel = y - B;
    let id = "white_concrete";
    let props;

    if (rel === 11) {
      id = "smooth_quartz";                          // parapet cap
    } else if (rel === 10) {
      id = "light_gray_concrete";                    // cornice
    } else if (rel === 5) {
      id = "light_gray_concrete";                    // storey line
    } else if (rel <= 4) {                           // ground storey: shopfront
      if (isDoor && rel === 1) { id = "oak_door"; props = { facing: f.f, half: "lower", hinge: "left", open: "false", powered: "false" }; }
      else if (isDoor && rel === 2) { id = "oak_door"; props = { facing: f.f, half: "upper", hinge: "left", open: "false", powered: "false" }; }
      else if (isDoor && rel === 3) id = "glass_pane";
      else if (isDoor && rel === 4) id = "light_gray_concrete";
      else if (pier) id = "white_concrete";
      else if (rel === 1) id = "stone_bricks";        // base course
      else if (rel <= 3) id = "glass_pane";           // shop glass
      else id = "light_gray_concrete";                // lintel
    } else if (rel >= 6 && rel <= 9) {               // upper storey: office/residential windows
      if (pier) id = "white_concrete";
      else if (rel === 6) id = "white_concrete";      // sill
      else if (rel <= 8) id = "light_blue_stained_glass_pane";
      else id = "light_gray_concrete";                // head
    }

    if (y <= ground) continue;
    if (props) g.set(x, y, z, id, props);
    else g.set(x, y, z, id);
  }

  // Warm light behind selected windows (glowstone on the floor slab, inside).
  const inX = x - f.dx, inZ = z - f.dz;
  if (has(inX, inZ) && !faces(inX, inZ).length && !pier) {
    if (t % 6 === 4) put(inX, B + 1, inZ, "glowstone");   // ground storey
    if (t % 6 === 1) put(inX, B + 6, inZ, "glowstone");   // upper storey
  }
}

// 5. Roof equipment: a 3x3 water tank on the roof deck, if its 5x5 surround is inside the footprint.
let tankCx = null, tankCz = null;
for (const [k] of fp) {
  const [cx, cz] = k.split(",").map(Number);
  let ok = true;
  for (let dx = -2; dx <= 2 && ok; dx++) for (let dz = -2; dz <= 2 && ok; dz++) {
    if (!has(cx + dx, cz + dz)) ok = false;
  }
  if (ok && (tankCx === null || Math.abs(cx - W / 2) < Math.abs(tankCx - W / 2))) {
    tankCx = cx; tankCz = cz;
  }
}
if (tankCx !== null) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const x = tankCx + dx, z = tankCz + dz;
    g.set(x, B + 11, z, "light_gray_concrete");
    g.set(x, B + 12, z, "light_gray_concrete");
  }
  g.set(tankCx, B + 13, tankCz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${SRC}.nbt`);
