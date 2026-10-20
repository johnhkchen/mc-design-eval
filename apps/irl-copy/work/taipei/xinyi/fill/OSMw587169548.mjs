import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169548";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 45, H = 33, D = 17;
const g = new Voxels([W, H, D]);

// Four-storey 1990s mixed-use office block: 5-block storeys (about 3.5 m),
// stone base, white tiled piers, blue-tinted glazing, parapet, roof plant.
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => gmap.has(`${x},${z}`);
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));

function put(x, y, z, name, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
}

// Entrance: middle of the south-facing exposed cells.
const southXs = cells
  .filter(([x, z]) => !has(x, z + 1))
  .map((c) => c[0])
  .sort((a, b) => a - b);
const doorX = southXs[Math.floor(southXs.length / 2)];
const doorZ = cells.find(([x, z]) => x === doorX && !has(x, z + 1))?.[1];

const glassEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const glassNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);

  // Foundation under every cell.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const N = has(x, z - 1), S = has(x, z + 1), Wd = has(x - 1, z), E = has(x + 1, z);

  if (N && S && Wd && E) {
    // Interior: floor slabs per storey and roof deck, air between.
    for (let k = 0; k < 4; k++) put(x, gr + 5 * k, z, "gray_concrete");
    put(x, gr + 20, z, "light_gray_concrete");
    if ((x * 7 + z * 3) % 13 === 0) put(x, gr + 21, z, "iron_block"); // roof plant
    continue;
  }

  // Perimeter cell: determine outward face and facade index.
  const expN = !N, expS = !S, expW = !Wd, expE = !E;
  const count = [expN, expS, expW, expE].filter(Boolean).length;
  let nx, nz, axisEW, idx;
  if (expN) { nx = 0; nz = -1; axisEW = true; idx = x - minX; }
  else if (expS) { nx = 0; nz = 1; axisEW = true; idx = x - minX; }
  else if (expW) { nx = -1; nz = 0; axisEW = false; idx = z - minZ; }
  else { nx = 1; nz = 0; axisEW = false; idx = z - minZ; }

  const pillar = count >= 2 || idx % 5 === 0;
  const isDoor = expS && x === doorX && z === doorZ;
  const glassProps = axisEW ? glassEW : glassNS;

  for (let rel = 0; rel <= 20; rel++) {
    const y = gr + rel;
    if (rel === 20) { put(x, y, z, "smooth_stone"); continue; }     // parapet cap
    if (rel === 0) { put(x, y, z, "stone_bricks"); continue; }      // base course
    if (isDoor && (rel === 1 || rel === 2)) {
      const half = rel === 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (pillar) { put(x, y, z, "white_concrete"); continue; }
    const k = Math.floor(rel / 5);
    const r = rel % 5;
    if (r === 0) { put(x, y, z, "smooth_stone"); continue; }        // storey line
    if (r === 4) {
      put(x, y, z, k === 0 ? "light_gray_concrete" : "white_concrete"); // spandrel / transom
      continue;
    }
    // Glazing band r = 1..3
    if (k === 0) put(x, y, z, "glass_pane", glassProps);
    else put(x, y, z, "light_blue_stained_glass_pane", glassProps);

    // Warm lanterns on the floor just inside some window bays.
    if (r === 2 && idx % 10 === 2) {
      const ix = x - nx, iz = z - nz;
      if (has(ix, iz)) {
        const inN = has(ix, iz - 1), inS = has(ix, iz + 1), inW = has(ix - 1, iz), inE = has(ix + 1, iz);
        if (inN && inS && inW && inE) {
          const gi = gmap.get(`${ix},${iz}`);
          put(ix, gi + 5 * k + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
        }
      }
    }
  }
}

// Roof mast on the interior cell nearest the footprint centre.
{
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  let best = null, bestD = Infinity;
  for (const [x, z, gr0] of cells) {
    if (!(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1))) continue;
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (d < bestD) { bestD = d; best = [x, z, Math.round(gr0)]; }
  }
  if (best) {
    const [x, z, gr] = best;
    put(x, gr + 21, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    put(x, gr + 22, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
