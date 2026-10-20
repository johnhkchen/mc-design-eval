import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi mid-rise office block, 8 x 7 footprint, ~34 blocks to roof.
// Era read from the record: 1980s-90s Taipei commercial block. Reinforced
// concrete frame, light-grey spandrels and mullions, blue-tinted curtain
// glass in bays, stone-brick base and shopfront, parapet with a stone cap,
// and a small plant penthouse on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265960";
const W = 8, H = 46, D = 7;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => fp.has(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of fp.keys().map(k => k.split(",").map(Number))) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Common floor level: the highest cell ground. Lower cells get a stone fill up to it.
const B = Math.max(...fp.values());
// Storeys of 5 blocks; keep the parapet cap inside the grid.
const N = Math.max(1, Math.min(6, Math.floor((H - 4 - B) / 5)));
const ROOF = B + 5 * N;     // roof slab level
const TOP = ROOF + 3;       // parapet cap level

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isExt = (x, z) => has(x, z) && (!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z));
const exposed = (x, z) => {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  return "east";
};

// 1. Foundation: solid from y 0 up to the common base under every footprint cell.
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");
}

// 2. Choose the entrance: a street-facing (north) exterior cell nearest the middle.
const midX = (minX + maxX) / 2;
let door = null;
{
  let best = Infinity;
  for (const k of fp.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!isExt(x, z)) continue;
    const face = exposed(x, z);
    const score = (face === "north" ? 0 : 100) + Math.abs(x - midX);
    if (score < best) { best = score; door = { x, z, face }; }
  }
}

// 3. Storeys: floor slab at each level, then the facade ring on exterior cells.
for (let k = 0; k < N; k++) {
  const y0 = B + 5 * k;
  for (const key of fp.keys()) {
    const [x, z] = key.split(",").map(Number);
    put(x, y0, z, "smooth_stone");
  }
  for (const key of fp.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (!isExt(x, z)) continue;
    const face = exposed(x, z);
    const alongX = face === "north" || face === "south";
    const r = alongX ? x - minX : z - minZ;
    const span = alongX ? maxX - minX : maxZ - minZ;
    const mullion = r === 0 || r === span || r % 3 === 0;

    for (let w = 0; w < 4; w++) {
      const y = y0 + 1 + w;
      let id;
      if (mullion) {
        id = (k === 0 && w === 0) ? "stone_bricks" : "light_gray_concrete";
      } else if (k === 0) {
        if (w === 0) id = "stone_bricks";
        else if (w === 3) id = "light_gray_concrete";
        else id = "glass";
      } else {
        id = (w === 0 || w === 3) ? "light_gray_concrete" : "light_blue_stained_glass";
      }
      put(x, y, z, id);
    }

    // Entrance: door at ground floor, hooded lintel above.
    if (k === 0 && door && x === door.x && z === door.z) {
      const f = door.face;
      put(x, y0 + 1, z, "oak_door", { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, y0 + 2, z, "oak_door", { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, y0 + 4, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }

    // Warm lanterns hung inside some bays, under the storey slab above.
    if (!mullion && (k === 0 || k > 0) && ((x * 3 + z + k) % 5 === 0)) {
      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (const [dx, dz] of dirs) {
        const nx = x + dx, nz = z + dz;
        if (has(nx, nz) && !isExt(nx, nz)) {
          put(nx, y0 + 4, nz, "lantern", { hanging: "true", waterlogged: "false" });
          break;
        }
      }
    }
  }
}

// 4. Roof slab, parapet and stone cap.
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  put(x, ROOF, z, "smooth_stone");
}
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!isExt(x, z)) continue;
  put(x, ROOF + 1, z, "light_gray_concrete");
  put(x, ROOF + 2, z, "light_gray_concrete");
  put(x, ROOF + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Plant penthouse on the central roof cells, with a lightning rod.
let penthouseCells = [];
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (isExt(x, z)) continue;
  if (x >= minX + 2 && x <= maxX - 2 && z >= minZ + 2 && z <= maxZ - 2) penthouseCells.push([x, z]);
}
for (const [x, z] of penthouseCells) {
  put(x, ROOF + 1, z, "gray_concrete");
  put(x, ROOF + 2, z, "gray_concrete");
}
if (penthouseCells.length) {
  const [x, z] = penthouseCells[Math.floor(penthouseCells.length / 2)];
  put(x, ROOF + 3, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
