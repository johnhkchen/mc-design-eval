import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3335858";
const W = 5, H = 17, D = 7;

// Footprint: [x, z, ground, roof] per cell
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cell = new Map();
for (const [x, z, gr, rf] of cells) {
  const g = Math.max(0, Math.min(H - 4, Math.round(gr)));
  let r = Math.min(H, Math.round(rf));
  if (r < g + 3) r = Math.min(H, g + 3);
  cell.set(`${x},${z}`, { g, r, n: r - g });
}
const has = (x, z) => cell.has(`${x},${z}`);

function exposedFaces(x, z) {
  return {
    north: !has(x, z - 1),
    south: !has(x, z + 1),
    west: !has(x - 1, z),
    east: !has(x + 1, z),
  };
}
const exposedCount = (x, z) => Object.values(exposedFaces(x, z)).filter(Boolean).length;
const isExterior = (x, z) => exposedCount(x, z) > 0;

// Entrance: on the north (min z) exposed row, nearest the middle x
let doorCell = null;
{
  let minZ = Infinity;
  for (const k of cell.keys()) minZ = Math.min(minZ, Number(k.split(",")[1]));
  const cands = [...cell.keys()]
    .map((k) => k.split(",").map(Number))
    .filter(([x, z]) => z === minZ && !has(x, z - 1));
  if (cands.length) {
    const mid = (W - 1) / 2;
    cands.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid));
    doorCell = `${cands[0][0]},${cands[0][1]}`;
  }
}

// Windows: exterior, single exposed face, checkerboard, not a pier, not the door
function isWindow(x, z, h) {
  if (h % 2 !== 1) return false;
  if (!isExterior(x, z)) return false;
  if (`${x},${z}` === doorCell) return false;
  if (exposedCount(x, z) !== 1) return false;
  return (x + z) % 2 === 0;
}

// Interior cell behind a window gets a warm light
function behindLitWindow(x, z, h) {
  const nbrs = [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]];
  for (const [nx, nz] of nbrs) {
    if (!has(nx, nz)) continue;
    const c = cell.get(`${nx},${nz}`);
    if (h >= c.n) continue;
    if (isWindow(nx, nz, h) && (x + z) % 3 === 0) return true;
  }
  return false;
}

const g = new Voxels([W, H, D]);

for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  const ext = isExterior(x, z);
  const faces = exposedFaces(x, z);
  const corner = exposedCount(x, z) >= 2;

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < c.g; y++) g.set(x, y, z, "stone_bricks");

  for (let h = 0; h < c.n; h++) {
    const y = c.g + h;
    if (y >= H) break;

    // Parapet / roof deck
    if (h === c.n - 1) {
      g.set(x, y, z, ext ? "stone_bricks" : "smooth_stone");
      continue;
    }

    // Base course and ground floor slab
    if (h === 0) {
      g.set(x, y, z, ext ? "stone_bricks" : "smooth_stone");
      continue;
    }

    // Storey lines: stone string courses and floor slabs
    if (h % 2 === 0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // Storey bands
    if (ext) {
      if (corner) {
        // Stone piers frame the corners
        g.set(x, y, z, "stone_bricks");
      } else if (`${x},${z}` === doorCell && h <= 2) {
        const base = { facing: "north", hinge: "left", open: "false", powered: "false" };
        g.set(x, y, z, "spruce_door", { ...base, half: h === 1 ? "lower" : "upper" });
      } else if (isWindow(x, z, h)) {
        g.set(x, y, z, "glass_pane", {
          north: faces.north ? "true" : "false",
          south: faces.south ? "true" : "false",
          west: faces.west ? "true" : "false",
          east: faces.east ? "true" : "false",
          waterlogged: "false",
        });
      } else {
        g.set(x, y, z, "bricks");
      }
    } else if (h === 1 && behindLitWindow(x, z, h)) {
      g.set(x, y, z, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
