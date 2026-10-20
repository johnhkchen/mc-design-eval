import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537991760";
const W = 17, H = 23, D = 15;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Missing neighbours tell us which faces are exterior.
const missing = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isPerim = (x, z) => { const m = missing(x, z); return m.N || m.S || m.W || m.E; };
const isCorner = (x, z) => { const m = missing(x, z); return [m.N, m.S, m.W, m.E].filter(Boolean).length >= 2; };

// Entrance: middle of the north-facing exterior cells (fallback: any perimeter cell).
let doorCell = null;
{
  const northFace = [];
  for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
    if (!has(x, z - 1)) northFace.push([x, z]);
  }
  northFace.sort((a, b) => a[0] - b[0]);
  if (northFace.length) doorCell = northFace[Math.floor(northFace.length / 2)];
  else {
    const any = [...ground.keys()].map(k => k.split(",").map(Number)).find(([x, z]) => isPerim(x, z));
    doorCell = any || null;
  }
}

// Plan centre for the plant room on the roof.
const xs = [...ground.keys()].map(k => +k.split(",")[0]);
const zs = [...ground.keys()].map(k => +k.split(",")[1]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
const cz = (Math.min(...zs) + Math.max(...zs)) / 2;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const b = gr;               // this cell's ground / ground-floor slab level
  const perim = isPerim(x, z);
  const corner = isCorner(x, z);
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;

  // Foundation from y 0 up to the ground under this cell.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Floor slabs for every storey and the roof, on every cell.
  put(x, b, z, "light_gray_concrete");
  put(x, b + 5, z, "light_gray_concrete");
  put(x, b + 10, z, "light_gray_concrete");

  if (!perim) {
    // Interior: air between slabs, roof plant room in the middle.
    if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 3 && b + 12 < H) {
      put(x, b + 11, z, "gray_concrete");
      put(x, b + 12, z, "gray_concrete");
    }
    continue;
  }

  // Exterior: two storeys of 5 blocks, cornice and parapet.
  for (let k = 0; k < 2; k++) {
    const base = b + 5 * k;
    // Window band (3 blocks) with spandrel above.
    for (let dy = 1; dy <= 3; dy++) {
      const y = base + dy;
      const pillar = corner || (x + z) % 3 === 0;
      if (pillar) {
        put(x, y, z, "white_concrete");
        continue;
      }
      if (isDoor && k === 0 && dy <= 2) continue; // door placed below
      const lit = k === 1 && dy === 2 && (x * 3 + z * 5) % 9 === 0;
      if (lit) put(x, y, z, "glowstone");
      else put(x, y, z, "light_blue_stained_glass");
    }
    // Spandrel / lintel course.
    put(x, base + 4, z, k === 0 && isDoor ? "stone_bricks" : "white_concrete");
  }

  // Parapet on the roof edge.
  put(x, b + 11, z, "white_concrete");

  // Cornice band at roof level is already the slab; add a stepped cap.
  if (!corner) put(x, b + 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance door and transom on the chosen cell.
if (doorCell) {
  const [dx, dz] = doorCell;
  const b = ground.get(`${dx},${dz}`);
  g.set(dx, b + 1, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, b + 2, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx, b + 3, dz, "light_blue_stained_glass");
}

g.save(`${DIR}/${ID}.nbt`);
