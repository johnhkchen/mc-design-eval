import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000035";
const W = 6, H = 24, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(`${x},${z}`, { g: gr, r: rf });
const has = (x, z) => map.has(`${x},${z}`);

const NB = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const exposedOf = (x, z) => NB.filter(([dx, dz]) => !has(x + dx, z + dz));

// Flat, storey-stepped roof level from the lidar median (even heights).
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const flatR = Math.round(medRoof / 2) * 2;

// Street-front entrance: the -z cell nearest the middle of the front row.
let door = null;
{
  const front = cells.filter(([x, z]) => !has(x, z - 1));
  if (front.length) {
    const minZ = Math.min(...front.map(c => c[1]));
    const row = front.filter(c => c[1] === minZ);
    const midX = (Math.min(...row.map(c => c[0])) + Math.max(...row.map(c => c[0]))) / 2;
    row.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
    door = `${row[0][0]},${row[0][1]}`;
  }
}

for (const [x, z, gr] of cells) {
  const R = Math.min(H - 3, Math.max(gr + 4, flatR));
  const ex = exposedOf(x, z);
  const isDoor = door === `${x},${z}`;

  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const facade = ex.length === 1 ? ex[0] : null;
  const [nx, nz] = facade || [0, 0];
  const along = nx !== 0 ? z : x;
  const paneProps = nx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

  if (isDoor) {
    const dp = { facing: "north", hinge: "left", open: "false", powered: "false" };
    put(x, gr, z, "dark_oak_door", { ...dp, half: "lower" });
    put(x, gr + 1, z, "dark_oak_door", { ...dp, half: "upper" });
  }

  for (let y = gr; y < R; y++) {
    const off = y - gr;

    if (isDoor && off < 2) continue;

    // Top course: stone cornice on the rim, smooth roof deck inside.
    if (y === R - 1) {
      put(x, y, z, ex.length === 0 ? "smooth_stone" : "stone_bricks");
      continue;
    }

    // Interior: floor slabs at each storey line, otherwise an air gap.
    if (ex.length === 0) {
      if (off % 2 === 0) put(x, y, z, "oak_planks");
      continue;
    }

    // Corner piers: brick, with stone string courses every other storey.
    if (ex.length >= 2) {
      if (off % 2 === 0) put(x, y, z, off % 4 === 0 && off > 0 ? "stone_bricks" : "bricks");
      else put(x, y, z, "bricks");
      continue;
    }

    // Facade cell.
    if (off === 0) {
      // Base course at street level in stone; brick above the first storey line.
      put(x, y, z, "stone_bricks");
      continue;
    }

    if (off % 2 === 0) {
      // Storey line: stone string course on every second storey, brick otherwise.
      put(x, y, z, off % 4 === 0 ? "stone_bricks" : "bricks");
      continue;
    }

    if (off === 1) {
      // Ground-floor shopfront: dark piers and wide glass bays.
      if (along % 3 === 0) put(x, y, z, "dark_oak_planks");
      else put(x, y, z, "glass_pane", paneProps);
      continue;
    }

    // Upper window row: two-block bays between brick piers.
    if (along % 3 !== 0) {
      put(x, y, z, "glass_pane", paneProps);
      // Warm light behind some glass, in the interior cell just inside.
      const ix = x - nx, iz = z - nz;
      const lit = ((x * 7 + z * 13 + y * 5) % 4) === 0;
      if (lit && has(ix, iz) && exposedOf(ix, iz).length === 0 && y < R - 1) {
        put(ix, y, iz, "glowstone");
      }
    } else {
      put(x, y, z, "bricks");
    }
  }

  // Parapet on the exterior rim.
  if (ex.length > 0) put(x, R, z, "stone_brick_wall");
}

// Roof chimneys on interior roof cells.
for (const [x, z, gr] of cells) {
  const R = Math.min(H - 3, Math.max(gr + 4, flatR));
  if (exposedOf(x, z).length === 0 && x === 2 && z % 7 === 3) {
    put(x, R, z, "bricks");
    put(x, R + 1, z, "bricks");
    put(x, R + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
