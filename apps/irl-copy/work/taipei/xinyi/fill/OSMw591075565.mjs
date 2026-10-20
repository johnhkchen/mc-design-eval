import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075565";
const W = 19, H = 20, D = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Normalise ground so the lowest footprint ground is y 0.
const gmin = Math.min(...cells.map((c) => c[2]));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr - gmin);

const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const maxg = Math.max(...ground.values());

// Roof deck: about 8 blocks above the lowest ground, never below the highest ground.
const RT = Math.max(8, maxg + 4);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const edge = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Front (street) side: the perimeter row with the smallest z.
const perimCells = cells.map(([x, z]) => [x, z]).filter(([x, z]) => edge(x, z));
const minZ = Math.min(...perimCells.map(([, z]) => z));
const frontXs = perimCells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

const PANE = "light_blue_stained_glass_pane";

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const gr = gnd(x, z);
  const per = edge(x, z);
  // Wall runs along x when the cell is missing a neighbour in z.
  const runsX = !has(x, z - 1) || !has(x, z + 1);
  const corner =
    (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
  const idx = runsX ? x : z;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Second-floor slab (storey line) at y 4 where the ground is below it.
  if (gr < 4) put(x, 4, z, per ? "light_gray_concrete" : "smooth_stone");

  // Roof deck.
  put(x, RT, z, "light_gray_concrete");

  if (per) {
    // Walls, window grids, storey lines.
    for (let y = gr + 1; y <= RT - 1; y++) {
      if (y === 4) continue; // storey line already placed

      // Front door on the street side.
      if (z === minZ && x === doorX && y <= gr + 2) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", {
          facing: "north",
          half,
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      if (y === 7) {
        // Spandrel / cornice band under the roof.
        put(x, y, z, "light_gray_concrete");
        continue;
      }

      const inGround = y <= 3;
      const upper = y === 5 || y === 6;
      const win = !corner && idx % 3 !== 0 && (inGround || upper);

      if (win) {
        put(x, y, z, PANE, runsX
          ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      } else {
        put(x, y, z, "white_concrete");
      }
    }

    // Lights behind some windows, placed on the floor of the interior cell.
    const dz = !has(x, z - 1) && has(x, z + 1) ? 1 : has(x, z - 1) && !has(x, z + 1) ? -1 : 0;
    const dx = !has(x - 1, z) && has(x + 1, z) ? 1 : has(x - 1, z) && !has(x + 1, z) ? -1 : 0;
    const ix = x + dx, iz = z + dz;
    if (!corner && (dx !== 0 || dz !== 0) && has(ix, iz)) {
      if (idx % 6 === 1) {
        const yl = gnd(ix, iz) + 1;
        if (yl <= 3 && !(x === doorX && z === minZ)) put(ix, yl, iz, "glowstone");
      }
      if (idx % 6 === 4) put(ix, 5, iz, "shroomlight");
    }

    // Parapet and cornice cap.
    put(x, RT + 1, z, "white_concrete");
    put(x, RT + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Roof plant on interior roof cells.
    if (x % 5 === 2 && z === 5) {
      put(x, RT + 1, z, "light_gray_concrete");
      put(x, RT + 2, z, "iron_block");
    }
  }
}

// Lantern over the front door.
{
  const gr = gnd(doorX, minZ);
  if (gr !== undefined) {
    put(doorX, gr + 3, minZ, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
