import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87292";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 31, D = 6;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const [x, z, ground, roof] of cells) cellMap.set(`${x},${z}`, { x, z, ground, roof });
const has = (x, z) => cellMap.has(`${x},${z}`);

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const xmin = Math.min(...xs), xmax = Math.max(...xs);
const zmin = Math.min(...zs);

const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];
const TOP_MAX = H - 3;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function isEdge(x, z) {
  return !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
}
function isCorner(x, z) {
  const mx = !has(x - 1, z) || !has(x + 1, z);
  const mz = !has(x, z - 1) || !has(x, z + 1);
  return mx && mz;
}

// Entrance: the street-side (lowest z) edge cell nearest the centre of the front.
// Falls back to any ground-level edge cell if the front row is missing.
const doorTargetX = Math.floor((xmin + xmax) / 2);
let doorCell = null;
{
  const frontEdges = cells.filter(c => c[1] === zmin && isEdge(c[0], c[1]));
  const pool = frontEdges.length ? frontEdges : cells.filter(c => isEdge(c[0], c[1]));
  pool.sort((a, b) => Math.abs(a[0] - doorTargetX) - Math.abs(b[0] - doorTargetX));
  if (pool.length) doorCell = pool[0];
}
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;
// Outward facing direction for the door cell
function outwardFacing(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  return "east";
}

for (const c of cells) {
  const [x, z, groundRaw, roofRaw] = c;
  const gY = Math.max(0, Math.round(groundRaw));
  let T = Math.abs(roofRaw - med) <= 1 ? med : Math.round(roofRaw);
  T = Math.max(gY + 4, Math.min(TOP_MAX, T));

  const edge = isEdge(x, z);
  const corner = edge && isCorner(x, z);
  const isDoorCell = doorKey === `${x},${z}`;
  const facing = outwardFacing(x, z);

  // Solid foundation up to this cell's ground
  for (let y = 0; y < gY; y++) put(x, y, z, "granite");

  for (let y = gY; y < T; y++) {
    const rel = y - gY;

    if (y === T - 1) {
      put(x, y, z, edge ? "stone_bricks" : "smooth_stone");
      continue;
    }

    if (edge) {
      if (corner) { put(x, y, z, "white_concrete"); continue; }
      if (rel === 0) { put(x, y, z, "polished_granite"); continue; }

      if (rel < 4) {
        // Ground floor: entrance, storefront glazing, transom
        if (isDoorCell && rel === 1) {
          put(x, y, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (isDoorCell && rel === 2) {
          put(x, y, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (isDoorCell && rel === 3) { put(x, y, z, "light_gray_concrete"); continue; }
        if (rel === 3) { put(x, y, z, "white_concrete"); continue; }
        if ((x + z) % 2 === 0) put(x, y, z, "iron_bars");
        else put(x, y, z, "light_blue_stained_glass");
        continue;
      }

      // Upper storeys: spandrel bands, framed ribbon windows with iron mullions
      if (rel % 4 === 0) { put(x, y, z, "light_gray_concrete"); continue; }
      if (rel % 4 === 3) { put(x, y, z, "white_concrete"); continue; }
      if ((x + z) % 2 === 0) { put(x, y, z, "iron_bars"); continue; }
      put(x, y, z, "light_blue_stained_glass");
      continue;
    }

    // Interior: floor slabs, air, a few lights behind glass
    if (rel % 4 === 0) { put(x, y, z, "smooth_stone"); continue; }
    if (rel % 4 === 2 && (x + 2 * z) % 4 === 0) { put(x, y, z, "glowstone"); continue; }
  }

  // Cornice lip stacked on the top of the shell wall
  if (edge && T < H) {
    put(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Rooftop mechanical penthouse on interior central cells
  if (!edge && x >= 3 && x <= 7 && T + 2 <= H) {
    put(x, T, z, "light_gray_concrete");
    put(x, T + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
