import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE94-0222-18F: 2005 Xinyi office tower, ~18 storeys (roof y=88 above lowest ground).
// Glass-and-spandrel curtain wall on a stepped, setback massing with a penthouse and mast.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0222-18F";
const W = 35, H = 100, D = 56;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// ground[x][z] = ground y for footprint cells, -1 outside
const ground = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground[x][z] = gr;
}
const inFp = (x, z) => x >= 0 && x < W && z >= 0 && z < D && ground[x][z] >= 0;

// Inset distance from the outside edge of the footprint (boundary cells = 1)
const dist = Array.from({ length: W }, () => Array(D).fill(0));
{
  const q = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    if (!inFp(x, z)) continue;
    const edge = !inFp(x + 1, z) || !inFp(x - 1, z) || !inFp(x, z + 1) || !inFp(x, z - 1);
    if (edge) { dist[x][z] = 1; q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    for (const [nx, nz] of [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]) {
      if (inFp(nx, nz) && dist[nx][nz] === 0) {
        dist[nx][nz] = dist[x][z] + 1;
        q.push([nx, nz]);
      }
    }
  }
}

// Roof level per column: ring terrace 50, middle tier 75, crown tier 88, penthouse 91
function topOf(x, z) {
  const d = dist[x][z];
  const gr = ground[x][z];
  let t;
  if (d >= 12) t = 91;
  else if (d <= 4) t = 50;
  else if (d <= 9) t = 75;
  else t = 88;
  return Math.max(t, gr + 5);
}

const occ = (x, z, y) => inFp(x, z) && y >= ground[x][z] && y <= topOf(x, z);
const isShell = (x, z, y) =>
  occ(x, z, y) && (!occ(x + 1, z, y) || !occ(x - 1, z, y) || !occ(x, z + 1, y) || !occ(x, z - 1, y));

// Entrance: the middle cell of the street-side (minimum z) row
let minZ = Infinity;
for (const [x, z] of cells) if (z < minZ) minZ = z;
const doorXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = doorXs[Math.floor(doorXs.length / 2)];
const doorZ = minZ;
const doorGr = ground[doorX][doorZ];
const isDoorCell = (x, z) => x === doorX && z === doorZ;

const g = new Voxels([W, H, D]);

// Main massing pass
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inFp(x, z)) continue;
    const gr = ground[x][z];
    const top = topOf(x, z);
    const d = dist[x][z];

    for (let y = 0; y <= top; y++) {
      if (y < gr) { g.set(x, y, z, "gray_concrete"); continue; }
      if (y === top) { g.set(x, y, z, "smooth_stone"); continue; }
      if (y === gr) {
        g.set(x, y, z, isShell(x, z, y) ? "polished_andesite" : "smooth_stone");
        continue;
      }

      const s = isShell(x, z, y);
      if (!s) {
        if (d >= 12 && y >= 89) g.set(x, y, z, "light_gray_concrete");
        else if (y % 5 === 0) g.set(x, y, z, "smooth_quartz");
        continue; // air interior
      }

      const rel = y - gr;
      if (isDoorCell(x, z) && (rel === 1 || rel === 2)) continue; // door set later

      const xFace = !occ(x + 1, z, y) || !occ(x - 1, z, y);
      const zFace = !occ(x, z + 1, y) || !occ(x, z - 1, y);

      if (xFace && zFace) {
        // corner column: solid vertical emphasis
        g.set(x, y, z, "white_concrete");
      } else if (y === top - 1) {
        // cornice band under each roof line
        g.set(x, y, z, "white_concrete");
      } else if (y % 5 === 0) {
        g.set(x, y, z, "white_concrete"); // floor spandrel band
      } else {
        const mullion = xFace ? (z % 3 === 0) : (x % 3 === 0);
        g.set(x, y, z, mullion ? "light_gray_concrete" : "cyan_stained_glass");
      }
    }
  }
}

// Parapets on outer edges of every terrace / roof
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inFp(x, z)) continue;
    const top = topOf(x, z);
    if (isShell(x, z, top)) g.set(x, top + 1, z, "light_gray_concrete");
  }
}

// Entrance: stone door surround, lintel, doors, and a lantern just inside
for (const dx of [doorX - 1, doorX + 1]) {
  if (inFp(dx, doorZ) && isShell(dx, doorZ, doorGr + 1)) {
    for (let rel = 1; rel <= 3; rel++) g.set(dx, doorGr + rel, doorZ, "polished_andesite");
  }
}
g.set(doorX, doorGr + 1, doorZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(doorX, doorGr + 2, doorZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(doorX, doorGr + 3, doorZ, "polished_andesite"); // lintel over the door
if (inFp(doorX, doorZ + 1)) {
  g.set(doorX, doorGr + 3, doorZ + 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Warm light: glowstone just inside some lit window bays
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inFp(x, z)) continue;
    const gr = ground[x][z];
    const top = topOf(x, z);
    for (let y = gr + 1; y < top; y++) {
      if (y % 5 === 0) continue;
      if (!isShell(x, z, y)) continue;
      if (((x * 31 + z * 17 + y * 7) % 11) !== 0) continue;
      const nbrs = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];
      for (const [nx, nz] of nbrs) {
        if (occ(nx, nz, y) && !isShell(nx, nz, y) && y % 5 !== 0 && y !== topOf(nx, nz)) {
          g.set(nx, y, nz, "glowstone");
          break;
        }
      }
    }
  }
}

// Penthouse mast on the centroid of the penthouse footprint
{
  let sx = 0, sz = 0, n = 0;
  for (const [x, z] of cells) if (dist[x][z] >= 12) { sx += x; sz += z; n++; }
  if (n > 0) {
    const cx = Math.round(sx / n), cz = Math.round(sz / n);
    if (inFp(cx, cz) && dist[cx][cz] >= 12) {
      for (let y = 92; y <= 96; y++) g.set(cx, y, cz, "copper_block");
      g.set(cx, 97, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
