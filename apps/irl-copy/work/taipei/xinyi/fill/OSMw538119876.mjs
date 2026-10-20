import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538119876";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Low-rise two-storey commercial block: stone plinth, white concrete piers and
// pane bands, quartz storey lines, parapet, a rooftop penthouse and AC plant.
const ROOF = 10;   // top of the body (roof slab level)
const FL = 5;      // storey floor line
const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), gr);
const has = (x, z) => fp.has(key(x, z));
const gAt = (x, z) => fp.get(key(x, z));

function put(x, y, z, id, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

// Choose the street-facing side: the outward face with the most perimeter cells.
const faceCount = {};
for (const [x, z] of cells) {
  for (const d of DIRS) {
    if (!has(x + d.dx, z + d.dz)) faceCount[d.n] = (faceCount[d.n] || 0) + 1;
  }
}
const frontName = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const frontDir = DIRS.find((d) => d.n === frontName);
const alongOf = (x, z, d) => (d.dx !== 0 ? z : x);
const frontCells = cells
  .filter(([x, z]) => frontDir && !has(x + frontDir.dx, z + frontDir.dz))
  .sort((a, b) => alongOf(a[0], a[1], frontDir) - alongOf(b[0], b[1], frontDir));
const doorCell = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;

// Ground: foundation, floor slab, roof slab, body walls.
const shroom = [];
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (gr > ROOF) continue;

  put(x, FL, z, "light_gray_concrete");
  put(x, ROOF, z, "light_gray_concrete");

  const faces = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
  if (!faces.length) continue;
  const corner = faces.length > 1;
  const face = faces[0];
  const along = alongOf(x, z, face);
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z && face === frontDir;

  for (let y = gr; y <= ROOF; y++) {
    if (isDoor && (y === gr + 1 || y === gr + 2) && y <= ROOF) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: frontDir.n, half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }
    if (y <= 3) {
      // ground-floor shopfront band
      if (corner || along % 3 === 0) put(x, y, z, "light_gray_concrete");
      else if (face.dx !== 0) put(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      else put(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
      continue;
    }
    if (y === 4 || y === 9) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === 5) { put(x, y, z, "smooth_quartz"); continue; }
    if (y <= 8) {
      if (corner || along % 3 === 0) put(x, y, z, "light_gray_concrete");
      else if (face.dx !== 0) put(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
      else put(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      continue;
    }
    if (y === 10) { put(x, y, z, "smooth_quartz"); continue; }
  }

  // Parapet on the perimeter.
  put(x, ROOF + 1, z, corner ? "light_gray_concrete" : "white_concrete");

  // Warm light behind some windows (interior cell just inside the face).
  if (!corner && !isDoor && along % 6 === 2) {
    const ix = x - face.dx, iz = z - face.dz;
    if (has(ix, iz)) shroom.push([ix, 7, iz]);
    if (has(ix, iz) && gr <= 2) shroom.push([ix, 2, iz]);
  }
}

for (const [x, y, z] of shroom) put(x, y, z, "shroomlight");

// Rooftop penthouse on the most central cell with a 5x5 margin inside the footprint.
let cx = 0, cz = 0;
for (const [x, z] of cells) { cx += x; cz += z; }
cx /= cells.length; cz /= cells.length;
let best = null, bestD = Infinity;
for (const [x, z, gr] of cells) {
  let ok = true;
  for (let dx = -2; dx <= 2 && ok; dx++)
    for (let dz = -2; dz <= 2 && ok; dz++)
      if (!has(x + dx, z + dz) || gAt(x + dx, z + dz) > ROOF) ok = false;
  if (!ok) continue;
  const d = Math.hypot(x - cx, z - cz);
  if (d < bestD) { bestD = d; best = [x, z]; }
}

const inPent = (x, z) => best && Math.abs(x - best[0]) <= 1 && Math.abs(z - best[1]) <= 1;
if (best) {
  const [px, pz] = best;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      put(px + dx, ROOF + 1, pz + dz, "white_concrete");
      put(px + dx, ROOF + 2, pz + dz, "white_concrete");
      put(px + dx, ROOF + 3, pz + dz, "smooth_quartz");
    }
  // Glass on the penthouse's street-facing side.
  for (let dx = -1; dx <= 1; dx++) {
    const fx = px + dx, fz = pz + frontDir.dz * 1;
    if (frontDir.dz !== 0) {
      put(fx, ROOF + 1, pz + frontDir.dz, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    }
  }
}

// AC plant on interior roof cells, kept clear of the penthouse.
for (const [x, z, gr] of cells) {
  if (gr > ROOF || inPent(x, z)) continue;
  let interior = true;
  for (const d of DIRS) if (!has(x + d.dx, z + d.dz)) interior = false;
  if (!interior) continue;
  if (x % 6 === 3 && z % 6 === 3) put(x, ROOF + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
