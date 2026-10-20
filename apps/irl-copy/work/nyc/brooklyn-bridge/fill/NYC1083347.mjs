import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1083347";
const W = 29, H = 26, D = 41;

const FOUND = "stone_bricks";
const WALL = "bricks";
const PIER = "bricks";
const BASE = "polished_andesite";
const SPAN = "smooth_stone";
const ROOF = "light_gray_concrete";
const PARAPET = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane";
const SHROOM = "shroomlight";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint and smoothed massing -------------------------------------
const cell = new Map();
const roofs = [];
for (const [x, z, ground, roof] of cells) {
  cell.set(`${x},${z}`, { x, z, ground, roof });
  roofs.push(roof);
}
roofs.sort((a, b) => a - b);
const median = roofs[Math.floor(roofs.length / 2)];
const snapMedian = Math.round(median / 2) * 2;

const cellList = [...cell.values()];
for (const c of cellList) {
  c.ground = Math.max(0, Math.min(H - 6, Math.round(c.ground)));
  let top = Math.abs(c.roof - median) <= 2.5
    ? snapMedian
    : Math.round(c.roof / 2) * 2;
  top = Math.max(c.ground + 2, Math.min(H - 3, top));
  c.top = top;
}

const at = (x, z) => cell.get(`${x},${z}`);

const DIRS = [
  { n: "N", dx: 0, dz: -1, axis: "z" },
  { n: "S", dx: 0, dz: 1, axis: "z" },
  { n: "E", dx: 1, dz: 0, axis: "x" },
  { n: "W", dx: -1, dz: 0, axis: "x" },
];

// Faces of a cell's voxel at height y that are exposed to air.
function exposed(c, y) {
  const out = [];
  if (!c || y < c.ground || y >= c.top) return out;
  for (const d of DIRS) {
    const n = at(c.x + d.dx, c.z + d.dz);
    if (!n) out.push({ ...d, ext: true });
    else if (y >= n.top) out.push({ ...d, ext: false });
  }
  out.sort((a, b) => (b.ext ? 1 : 0) - (a.ext ? 1 : 0));
  return out;
}

// Main entrance: middle of the exterior north (lowest z) face.
const northXs = cellList
  .filter((c) => !at(c.x, c.z - 1))
  .map((c) => c.x)
  .sort((a, b) => a - b);
const doorA = northXs[Math.floor(northXs.length / 2)];

const paneProps = (axis) =>
  axis === "z"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

function wall(c, y, fs) {
  const rel = y - c.ground;
  const f = fs[0];
  const a = f.axis === "z" ? c.x : c.z;

  // Entrance door on the north face, two blocks tall.
  const nf = fs.find((q) => q.n === "N" && q.ext);
  if (nf && a === doorA && rel < 2) {
    const half = rel === 0 ? "lower" : "upper";
    g.set(c.x, y, c.z, "oak_door", {
      facing: "north", half, hinge: "left", open: "false", powered: "false",
    });
    return;
  }

  // Base course at street level.
  if (rel === 0) {
    g.set(c.x, y, c.z, BASE);
    return;
  }

  // Storey lines (floor spandrels) on even rows above the base.
  if (rel % 2 === 0) {
    g.set(c.x, y, c.z, SPAN);
    return;
  }

  // Window row: piers at a%4 == 0 and 3, glass at 1 and 2.
  const m = ((a % 4) + 4) % 4;
  if (m === 0 || m === 3) {
    g.set(c.x, y, c.z, PIER);
    return;
  }

  g.set(c.x, y, c.z, GLASS, paneProps(f.axis));

  // Warm light behind some panes, in the interior cell just inside.
  const ic = at(c.x - f.dx, c.z - f.dz);
  if (
    ic &&
    exposed(ic, y).length === 0 &&
    y < ic.top - 1 &&
    (c.x * 31 + c.z * 17 + y * 7) % 5 === 0
  ) {
    g.set(ic.x, y, ic.z, SHROOM);
  }
}

// ---- build ------------------------------------------------------------------
for (const c of cellList) {
  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < c.ground; y++) g.set(c.x, y, c.z, FOUND);

  // Walls, storey slabs, roof deck.
  for (let y = c.ground; y < c.top; y++) {
    const fs = exposed(c, y);
    if (fs.length) {
      wall(c, y, fs);
    } else {
      const rel = y - c.ground;
      if (y === c.top - 1) g.set(c.x, y, c.z, ROOF);
      else if (rel % 2 === 0) g.set(c.x, y, c.z, SPAN);
    }
  }

  // Parapet on the exterior ring.
  const isExt = DIRS.some((d) => !at(c.x + d.dx, c.z + d.dz));
  if (isExt && c.top < H) g.set(c.x, c.top, c.z, PARAPET);
}

// Roof bulkhead (elevator and stair core) near the middle of the roof.
const midX = Math.floor(W / 2);
const midZ = Math.floor(D / 2);
for (const c of cellList) {
  if (c.top + 2 > H) continue;
  const isExt = DIRS.some((d) => !at(c.x + d.dx, c.z + d.dz));
  if (isExt) continue;
  if (exposed(c, c.top - 1).length) continue;
  if (Math.abs(c.x - midX) <= 2 && Math.abs(c.z - midZ) <= 3) {
    g.set(c.x, c.top, c.z, ROOF);
    g.set(c.x, c.top + 1, c.z, ROOF);
  }
}

g.save(`${DIR}/${ID}.nbt`);
