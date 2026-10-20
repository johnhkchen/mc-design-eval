import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280198";
const W = 19, H = 38, D = 16;

// Record: no name. Roof ~26 blocks above lowest ground, so ~5 storeys of 5 blocks.
// Read as a 1990s Xinyi mid-rise office/retail block: cream smooth-quartz facade,
// light-blue glass curtain bays, stone-brick base and cornice, a dark-oak entrance
// on the street face, and a rooftop plant room.
const ROOF = 26;      // parapet top (blocks above lowest ground)
const CORNICE = 25;   // roof / cornice course
const STOREY = 5;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const cells = new Map();
for (const c of raw) {
  const [x, z, g] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cells.set(key(x, z), Math.max(0, Math.round(g)));
}
const has = (x, z) => cells.has(key(x, z));
const gnd = (x, z) => cells.get(key(x, z));
const parse = (k) => k.split(",").map(Number);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const facesOf = (x, z) =>
  Object.keys(DIRS).filter((f) => {
    const [dx, dz] = DIRS[f];
    return !has(x + dx, z + dz);
  });

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of cells.keys()) {
  const [x, z] = parse(k);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

// Street-facing entrance: the z+ face (south), middle of its run; fall back to others.
let doorCell = null, doorFace = null;
for (const f of ["south", "north", "east", "west"]) {
  const cand = [...cells.keys()]
    .map(parse)
    .filter(([x, z]) => facesOf(x, z).includes(f))
    .sort((a, b) => (f === "east" || f === "west" ? a[1] - b[1] : a[0] - b[0]));
  if (cand.length) {
    doorCell = cand[Math.floor(cand.length / 2)];
    doorFace = f;
    break;
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const lightHash = (x, y, z) => Math.abs((x * 73856093) ^ (y * 83492791) ^ (z * 19349663)) % 6;

// 1. Foundations, walls, interior floors and roof for every footprint cell.
for (const k of cells.keys()) {
  const [x, z] = parse(k);
  const ground = gnd(x, z);
  const faces = facesOf(x, z);
  const boundary = faces.length > 0;

  // Foundation under everything.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  if (boundary) {
    const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;
    const face = isDoor ? doorFace : faces[0];
    const along = face === "north" || face === "south" ? x - minX : z - minZ;
    const pier = along % 3 === 0;
    const inward = OPP[face];
    const [idx, idz] = DIRS[inward];
    const ix = x + idx, iz = z + idz;
    const inwardOK = has(ix, iz);

    for (let y = ground; y <= ROOF; y++) {
      if (y === CORNICE) { put(x, y, z, "stone_bricks"); continue; }
      if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; }
      const r = y % STOREY;
      const k5 = Math.floor(y / STOREY);
      if (r === 0) { put(x, y, z, "light_gray_concrete"); continue; } // storey line
      if (r === 4) { put(x, y, z, "smooth_quartz"); continue; }       // spandrel / lintel
      if (pier) { put(x, y, z, "smooth_quartz"); continue; }          // mullion pier
      if (k5 === 0) {
        put(x, y, z, "glass_pane", paneProps(face));                   // clear shopfront
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
        if (inwardOK && y >= gnd(ix, iz) && !facesOf(ix, iz).length && lightHash(x, y, z) === 0) {
          put(ix, y, iz, "glowstone");                                  // warm light behind glass
        }
      }
    }
  } else {
    // Interior: air behind the glass, floor slabs per storey, roof deck.
    for (let y = ground; y <= CORNICE; y++) {
      if (y % STOREY === 0 || y === CORNICE) put(x, y, z, "light_gray_concrete");
    }
  }
}

// 2. Entrance on the street face: double dark-oak door with a warm light just inside.
if (doorCell) {
  const [dx, dz] = doorCell;
  const gy = gnd(dx, dz);
  const doorProps = (half) => ({
    facing: doorFace, half, hinge: "left", open: "false", powered: "false",
  });
  put(dx, gy, dz, "dark_oak_door", doorProps("lower"));
  put(dx, gy + 1, dz, "dark_oak_door", doorProps("upper"));
  const [idx, idz] = DIRS[OPP[doorFace]];
  if (has(dx + idx, dz + idz)) {
    put(dx + idx, gy, dz + idz, "glowstone");
    put(dx + idx, gy + 2, dz + idz, "glowstone");
  }
}

// 3. Rooftop plant room on the interior core, stands on the roof deck.
for (let x = cx - 2; x <= cx + 2; x++) {
  for (let z = cz - 2; z <= cz + 2; z++) {
    if (!has(x, z) || facesOf(x, z).length) continue;
    put(x, ROOF, z, "gray_concrete");
    put(x, ROOF + 1, z, "gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
