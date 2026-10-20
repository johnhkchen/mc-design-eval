import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109966";
const W = 24, H = 33, D = 135;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance (in steps) from the outside: 1 = outer facade layer, 2 = inner wall layer.
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (NB.some(([dx, dz]) => !has(x + dx, z + dz))) {
    dist.set(key(x, z), 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}

// Facade along-coordinate: z on the x-facing sides, x on the end faces.
const xFace = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const sOf = (x, z) => (xFace(x, z) ? z : x);
const isPier = (s) => ((s % 3) + 3) % 3 === 0;

// Facade coordinate and pier status for a cell (inner-layer cells borrow from their facade neighbour).
function facadeS(x, z) {
  if (dist.get(key(x, z)) === 1) return sOf(x, z);
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (dist.get(key(nx, nz)) === 1) return sOf(nx, nz);
  }
  return null;
}

// Entrance on the west face, centred on the west-face cells.
const minX = Math.min(...cells.map((c) => c[0]));
const westZ = cells.filter(([x, z]) => !has(x - 1, z)).map((c) => c[1]).sort((a, b) => a - b);
const zc = westZ[Math.floor(westZ.length / 2)];
const doorZ = westZ.reduce((a, b) => (Math.abs(b - zc) < Math.abs(a - zc) ? b : a));
const doorCell = cells.filter(([x, z]) => z === doorZ).sort((a, b) => a[0] - b[0])[0];
const entZone = (x, z) => Math.abs(z - zc) <= 5 && x <= minX + 1;

// Rooftop plant enclosure.
const inBox = (x, z) => x >= 7 && x <= 16 && z >= zc - 14 && z <= zc + 14;

const g = new Voxels([W, H, D]);
function B(x, y, z, b, p) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

for (const [x, z, gr] of cells) {
  const d = dist.get(key(x, z));
  const s = facadeS(x, z);
  const ent = d === 1 && entZone(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) B(x, y, z, "stone_bricks");

  // Four storeys of 5 blocks: r 0 and 4 are slab/spandrel bands, r 1..3 are window zones.
  for (let r = 0; r <= 19; r++) {
    const y = gr + r;
    const rr = r % 5;
    const st = Math.floor(r / 5);
    if (rr === 0 || rr === 4) {
      if (d === 1) {
        if (ent && rr === 4) {
          B(x, y, z, "dark_oak_stairs", { facing: "west", half: "top", shape: "straight", waterlogged: "false" });
        } else if (r === 0) {
          B(x, y, z, "polished_andesite");
        } else {
          B(x, y, z, "light_gray_concrete");
        }
      } else {
        B(x, y, z, "stone");
      }
    } else {
      if (d === 1) {
        if (ent && r <= 3) {
          B(x, y, z, "light_blue_stained_glass");
        } else if (isPier(s)) {
          B(x, y, z, "white_concrete");
        } else {
          B(x, y, z, "light_blue_stained_glass");
        }
      } else if (d === 2) {
        if (ent && r <= 3) continue; // lobby air
        if (s !== null && isPier(s)) {
          B(x, y, z, "white_concrete");
        } else if (s !== null && rr === 2 && ((s * 5 + st * 7) % 13 + 13) % 13 === 0) {
          B(x, y, z, "glowstone"); // warm light behind the glass
        }
      }
    }
  }

  // Cornice and parapet on the facade.
  if (d === 1) {
    B(x, gr + 20, z, "smooth_quartz");
    B(x, gr + 21, z, "white_concrete");
  }

  // Rooftop plant enclosure: solid box with a cap and louvred band.
  if (inBox(x, z)) {
    for (let r = 20; r <= 22; r++) B(x, gr + r, z, "light_gray_concrete");
    B(x, gr + 23, z, "smooth_quartz");
    const perimeter = NB.some(([dx, dz]) => !inBox(x + dx, z + dz));
    if (perimeter && (x + z) % 2 === 0) B(x, gr + 21, z, "gray_stained_glass");
  }
}

// Entrance door on the west face.
{
  const [dx0, dz0, dgr] = doorCell;
  const hinge = { facing: "west", hinge: "left", open: "false", powered: "false" };
  B(dx0, dgr + 1, dz0, "dark_oak_door", { ...hinge, half: "lower" });
  B(dx0, dgr + 2, dz0, "dark_oak_door", { ...hinge, half: "upper" });
}

g.save(`${DIR}/${ID}.nbt`);
