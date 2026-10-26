import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86583";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 29, D = 10;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const map = new Map();
for (const [x, z, ground, roof] of cells) map.set(`${x},${z}`, { ground, roof });
const isIn = (x, z) => map.has(`${x},${z}`);

// One clean roof tier: median lidar roof height, allowing at most a 1-block step
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];
const TOP = med; // flat roof line shared by the whole block (clean tier, no spikes)

const put = (x, y, z, name, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

const outward = (x, z) => {
  const dirs = [];
  if (!isIn(x, z - 1)) dirs.push("north");
  if (!isIn(x, z + 1)) dirs.push("south");
  if (!isIn(x - 1, z)) dirs.push("west");
  if (!isIn(x + 1, z)) dirs.push("east");
  return dirs;
};
const inwardOffset = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Entrance: middle cell of the north (z minimum) row
const northRow = cells.filter(([x, z]) => !isIn(x, z - 1));
const midX = Math.floor(northRow.reduce((s, c) => s + c[0], 0) / northRow.length);
const doorCell = northRow.reduce((best, c) =>
  Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best, northRow[0]);
const [doorX, doorZ] = doorCell;

// ---- build -------------------------------------------------------------------
for (const [x, z, gnd] of cells) {
  const top = Math.max(TOP, gnd + 6);
  const out = outward(x, z);
  const perim = out.length > 0;
  const corner = out.length >= 2;
  const alongX = !isIn(x, z - 1) || !isIn(x, z + 1); // facade runs east-west
  const isDoor = x === doorX && z === doorZ;

  // Foundation: solid from y0 to ground
  for (let y = 0; y < gnd; y++) put(x, y, z, "stone_bricks");

  for (let y = gnd; y <= top - 1; y++) {
    const rel = y - gnd;

    // Cornice / roof course
    if (y === top - 1) {
      put(x, y, z, perim ? "smooth_stone" : "stone_bricks");
      continue;
    }

    // Base course and storey bands (solid on every cell: floor slabs)
    if (rel % 4 === 0) {
      put(x, y, z, rel === 0 ? "stone_bricks" : "smooth_stone");
      continue;
    }

    if (!perim) continue; // interior air behind glass

    // Stone quoins at the corners (alternating courses read as dressed stone)
    if (corner) {
      put(x, y, z, (rel % 8 < 4) ? "stone_bricks" : "polished_andesite");
      continue;
    }

    const isWindowRow = rel % 4 === 1 || rel % 4 === 2;
    const isWindowCell = (x + z) % 2 === 1 && !isDoor;

    if (isWindowRow && isWindowCell && y <= top - 2) {
      put(x, y, z, "glass_pane", {
        north: alongX ? "true" : "false",
        south: alongX ? "true" : "false",
        east: alongX ? "false" : "true",
        west: alongX ? "false" : "true",
        waterlogged: "false",
      });
    } else {
      put(x, y, z, "bricks");
    }
  }
}

// Warm light behind a subset of windows (interior cell just inside the glass)
for (const [x, z, gnd] of cells) {
  const out = outward(x, z);
  if (out.length !== 1) continue; // face cells only, not corners
  if ((x + z) % 4 !== 1) continue;
  if (x === doorX && z === doorZ) continue;
  const [ox, oz] = inwardOffset[out[0]];
  const ix = x + ox, iz = z + oz;
  if (!isIn(ix, iz)) continue;
  const top = Math.max(TOP, gnd + 6);
  for (let k = 0; ; k++) {
    const rel = 4 * k + 1;
    const y = gnd + rel;
    if (y + 1 > top - 2) break;
    put(ix, y, iz, "glowstone");
  }
}

// Entrance: stone surround, dark oak door, lanterns flanking the steps
{
  const { ground: gnd } = map.get(`${doorX},${doorZ}`);
  const facing = "north";
  // Lintel and jamb surround in dressed stone
  put(doorX, gnd + 3, doorZ, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  put(doorX, gnd + 1, doorZ, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorX, gnd + 2, doorZ, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 1]) {
    const nx = doorX + dx;
    if (!isIn(nx, doorZ)) continue;
    put(nx, gnd + 1, doorZ, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    put(nx, gnd + 2, doorZ, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
