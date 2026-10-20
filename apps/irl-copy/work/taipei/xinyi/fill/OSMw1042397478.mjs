import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397478";
const W = 22, H = 38, D = 18;
const ROOF = 26;            // roof deck top, about 26 blocks above lowest ground
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint map: "x,z" -> ground height
const FP = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr] of cells) {
  FP.set(`${x},${z}`, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => FP.has(`${x},${z}`);
const cx = Math.floor((minX + maxX) / 2);   // entrance centre column

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// Outward face of a perimeter cell (null if interior)
function faceOf(x, z) {
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  if (!n && !s && !w && !e) return null;
  if (s) return { dir: "south", ix: 0, iz: -1, idx: x, end: x === minX || x === maxX, pier: false };
  if (n) return { dir: "north", ix: 0, iz: 1, idx: x, end: x === minX || x === maxX, pier: false };
  if (e) return { dir: "east", ix: -1, iz: 0, idx: z, end: z === minZ || z === maxZ, pier: false };
  return { dir: "west", ix: 1, iz: 0, idx: z, end: z === minZ || z === maxZ, pier: false };
}

const lights = [];

for (const [key, gr] of FP) {
  const [x, z] = key.split(",").map(Number);
  const face = faceOf(x, z);

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!face) {
    // Interior: floor slabs per storey, roof deck, air elsewhere (air gap behind glass)
    for (let y = gr; y <= ROOF; y++) {
      if (y === ROOF) put(x, y, z, "light_gray_concrete");
      else if (y === gr || (y >= 1 && (y - 1) % 5 === 0)) put(x, y, z, "smooth_stone");
    }
    continue;
  }

  // Perimeter wall
  face.pier = face.end || face.idx % 3 === 0;
  const isSouthFront = face.dir === "south" && z === maxZ;
  const isDoor = isSouthFront && (x === cx - 1 || x === cx);
  const isCanopy = isSouthFront && x >= cx - 2 && x <= cx + 1;
  const s = (y) => (y >= 1 ? Math.floor((y - 1) / 5) : 0);

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; }   // cornice at roof edge
    if (isCanopy && y === gr + 3) {
      put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (isDoor) {
      if (y === gr) { put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 1) { put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 2) { put(x, y, z, "light_blue_stained_glass"); continue; }
    }
    if (y === gr) { put(x, y, z, "polished_granite"); continue; }   // base course

    const si = s(y);
    const rel = y - (1 + 5 * si);
    if (face.pier) { put(x, y, z, "smooth_quartz"); continue; }
    if (rel === 0 || rel === 4) put(x, y, z, "light_gray_concrete");   // floor line and head bands
    else if (rel === 1) put(x, y, z, "white_concrete");                 // sill band
    else {
      put(x, y, z, "light_blue_stained_glass");                         // glazing
      if (rel === 2 && (face.idx + si) % 4 === 0) {
        const ix = x + face.ix, iz = z + face.iz;
        if (has(ix, iz) && !faceOf(ix, iz)) {
          lights.push([ix, y, iz, si % 2 ? "shroomlight" : "glowstone"]);
        }
      }
    }
  }

  // Parapet on the roof edge
  put(x, ROOF + 1, z, "smooth_quartz");
  put(x, ROOF + 2, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
}

// Warm lights behind glass
for (const [x, y, z, id] of lights) put(x, y, z, id);

// Roof penthouse: x 6..15, z 5..12, walls y 27..29, roof slab at y 30
for (let x = 6; x <= 15; x++) {
  for (let z = 5; z <= 12; z++) {
    const ring = x === 6 || x === 15 || z === 5 || z === 12;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (ring) {
        if (y === ROOF + 2 && (x + z) % 2 === 0) put(x, y, z, "iron_bars");
        else put(x, y, z, "light_gray_concrete");
      }
    }
    put(x, ROOF + 4, z, "smooth_quartz");
  }
}

// Condenser units on the deck
for (const [bx, bz] of [[2, 2], [3, 2], [2, 3], [3, 3], [18, 13], [19, 13], [18, 14], [19, 14]]) {
  put(bx, ROOF + 1, bz, "iron_block");
}

// Antenna mast
for (let y = ROOF + 5; y <= ROOF + 8; y++) {
  put(10, y, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
