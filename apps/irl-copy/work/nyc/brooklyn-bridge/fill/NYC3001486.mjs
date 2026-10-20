import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001486";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 15 x 6 footprint, 26 tall. Brownstone Italianate walk-up, c.1860, Columbia Heights.
const W = 15, H = 26, D = 6;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) {
  cellMap.set(key(x, z), { x, z, gr: Math.max(0, Math.round(gr)), rf: Number(rf) });
}
const has = (x, z) => cellMap.has(key(x, z));

// Common roof level: median of lidar roofs, so the massing reads as one clean cornice line.
const roofs = [...cellMap.values()].map(c => c.rf).sort((a, b) => a - b);
const median = Math.round(roofs[Math.floor(roofs.length / 2)]);

for (const c of cellMap.values()) {
  // Smooth lidar over a 3x3 neighbourhood, then pull it to within 1 block of the common level.
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = cellMap.get(key(c.x + dx, c.z + dz));
    if (o) { sum += o.rf; n++; }
  }
  const mean = n ? sum / n : c.rf;
  const pulled = Math.max(median - 1, Math.min(median + 1, Math.round(mean)));
  c.top = Math.max(c.gr + 6, Math.min(H - 3, pulled));
  c.n = !has(c.x, c.z - 1);
  c.s = !has(c.x, c.z + 1);
  c.w = !has(c.x - 1, c.z);
  c.e = !has(c.x + 1, c.z);
  c.zFace = c.n || c.s;
  c.xFace = c.w || c.e;
  c.wall = c.n || c.s || c.w || c.e;
  c.corner = c.zFace && c.xFace;
}

// Window bays: pairs of glass with brownstone piers every third column.
function windowOK(c) {
  if (c.corner) return false;
  const u = c.zFace ? c.x : c.z;
  return u % 3 !== 0;
}

// Street door: the front (north-facing) wall cell nearest the middle.
let doorCell = null;
{
  const walls = [...cellMap.values()].filter(c => c.wall && !c.corner);
  const front = walls.filter(c => c.n);
  const pool = front.length ? front : walls;
  doorCell = pool.sort((a, b) => Math.abs(a.x - 7) - Math.abs(b.x - 7))[0] || null;
}
const doorFacing = doorCell
  ? (doorCell.n ? "north" : doorCell.s ? "south" : doorCell.w ? "west" : "east")
  : null;
const doorU = doorCell ? (doorCell.zFace ? doorCell.x : doorCell.z) : -99;

// Is this wall cell part of the door bay (door column plus one either side, on the same face)?
function inDoorBay(c) {
  if (!doorCell || !c.wall || c.corner) return false;
  if (doorCell.zFace) return c.zFace && c.z === doorCell.z && Math.abs(c.x - doorCell.x) <= 1;
  return c.xFace && c.x === doorCell.x && Math.abs(c.z - doorCell.z) <= 1;
}

for (const c of cellMap.values()) {
  const { x, z, gr: gy, top } = c;

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  if (c.wall) {
    for (let y = gy; y < top; y++) {
      const rel = y - gy;
      let id;
      if (y >= top - 1) id = "smooth_sandstone";              // cornice cap
      else if (y === top - 2) id = "chiseled_stone_bricks";   // cornice band
      else if (rel === 0) id = "stone_bricks";                // plinth course
      else if (rel % 3 === 0) id = "smooth_sandstone";        // storey line
      else if (windowOK(c)) id = "glass_pane";                // glazing
      else id = "brown_terracotta";                           // brownstone wall/pier
      g.set(x, y, z, id);
    }

    // Door bay: stone pilasters flanking the door, with a lit hall behind.
    if (inDoorBay(c) && c !== doorCell) {
      for (let y = gy + 1; y <= gy + 2; y++) g.set(x, y, z, "stone_bricks");
    }

    // Warm light behind some windows.
    for (let y = gy; y < top - 2; y++) {
      const rel = y - gy;
      if (rel % 3 !== 1 && rel % 3 !== 2) continue;
      if (!windowOK(c)) continue;
      if (((x + z + Math.floor(rel / 3)) % 4) !== 0) continue;
      let ix = x, iz = z;
      if (c.n) iz = z + 1; else if (c.s) iz = z - 1; else if (c.w) ix = x + 1; else if (c.e) ix = x - 1;
      const inner = cellMap.get(key(ix, iz));
      if (inner && !inner.wall) g.set(ix, y, iz, "glowstone");
    }

    // Street door with dark oak frame and a lit interior behind it.
    if (c === doorCell) {
      g.set(x, gy + 1, z, "dark_oak_door", {
        facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false",
      });
      g.set(x, gy + 2, z, "dark_oak_door", {
        facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false",
      });
      // Dark oak transom over the door.
      g.set(x, gy + 3, z, "dark_oak_planks");
      // Interior light just behind the door.
      let ix = x, iz = z;
      if (c.n) iz = z + 1; else if (c.s) iz = z - 1; else if (c.w) ix = x + 1; else if (c.e) ix = x - 1;
      const inner = cellMap.get(key(ix, iz));
      if (inner && !inner.wall) g.set(ix, gy + 2, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  } else {
    // Interior: floor slab per storey, roof deck on top. Air gap otherwise.
    for (let y = gy; y < top - 1; y++) {
      if ((y - gy) % 3 === 0) g.set(x, y, z, "dark_oak_planks");
    }
    g.set(x, top - 1, z, "stone");
  }
}

// Brick chimneys on two interior roof cells.
for (const [cx, cz] of [[3, 2], [11, 3]]) {
  const c = cellMap.get(key(cx, cz));
  if (!c || c.wall) continue;
  for (let y = c.top; y <= Math.min(H - 1, c.top + 1); y++) g.set(cx, y, cz, "bricks");
}

g.save(`${DIR}/${ID}.nbt`);
