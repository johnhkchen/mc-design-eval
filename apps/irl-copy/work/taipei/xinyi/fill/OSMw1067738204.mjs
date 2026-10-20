import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738204";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 23 x 22 footprint, ~21 blocks to roof: four storeys of 5 blocks, parapet and plant on top.
const W = 23, H = 33, D = 22;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y of that cell.
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);

const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const isPerim = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
const outward = (x, z) => DIRS.find(([dx, dz]) => !has(x + dx, z + dz));

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Main entrance: on the north face (z min) if present, nearest the middle of that face.
const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length;
let door = null;
{
  const northCands = cells.filter(([x, z]) => isPerim(x, z) && !has(x, z - 1));
  const pool = northCands.length ? northCands : cells.filter(([x, z]) => isPerim(x, z));
  let best = Infinity;
  for (const [x, z] of pool) {
    const d = Math.abs(x - cx);
    if (d < best) { best = d; door = { x, z }; }
  }
}
const doorOut = door ? outward(door.x, door.z) : null;
const doorFacing = doorOut ? doorOut[2] : "north";

const isDoorAwning = (x, z) =>
  door && doorOut && Math.abs(x - door.x) <= 2 && Math.abs(z - door.z) <= 2 &&
  isPerim(x, z) && outward(x, z) && outward(x, z)[2] === doorOut[2];

for (const [x, z, base] of cells) {
  const gb = base;
  const perim = isPerim(x, z);

  // Foundation from y 0 up to the cell's ground, then the ground-floor slab.
  for (let y = 0; y < gb; y++) put(x, y, z, "stone_bricks");
  put(x, gb, z, "light_gray_concrete");

  const mx = !has(x - 1, z) || !has(x + 1, z);
  const mz = !has(x, z - 1) || !has(x, z + 1);
  const corner = mx && mz;
  const pillar = corner || (x + z) % 3 === 0;

  for (let s = 0; s < 4; s++) {
    const yb = gb + 5 * s;
    if (s > 0) put(x, yb, z, perim ? "white_concrete" : "light_gray_concrete");

    if (!perim) continue;

    const out = outward(x, z);
    for (let k = 1; k <= 4; k++) {
      const y = yb + k;
      const isDoorCell = door && x === door.x && z === door.z && s === 0;

      if (s === 0) {
        if (k === 1) {
          if (isDoorCell) {
            put(x, y, z, "oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
          } else {
            put(x, y, z, "stone_bricks"); // base course
          }
        } else if (k === 2 || k === 3) {
          if (isDoorCell) {
            put(x, y, z, "oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
          } else if (pillar) {
            put(x, y, z, "white_concrete");
          } else {
            put(x, y, z, "cyan_stained_glass");
          }
        } else {
          // k === 4: shopfront head, with a dark awning band over the entrance
          if (isDoorAwning(x, z)) {
            put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
          } else {
            put(x, y, z, "white_concrete");
          }
        }
      } else {
        if (k === 1 || k === 4) {
          put(x, y, z, "white_concrete"); // spandrels and storey lines
        } else if (pillar) {
          put(x, y, z, "white_concrete");
        } else {
          put(x, y, z, "cyan_stained_glass");
          // warm glow behind some windows, one block inside the glass
          if (out && (x + z * 2 + s * 3) % 4 === 0 && k === 2) {
            const ix = x - out[0], iz = z - out[1];
            if (has(ix, iz) && !isPerim(ix, iz)) put(ix, y, iz, "glowstone");
          }
        }
      }
    }
  }

  // Roof deck, parapet and cornice.
  const deck = gb + 20;
  put(x, deck, z, "light_gray_concrete");
  if (perim) {
    put(x, deck + 1, z, "white_concrete");
    put(x, deck + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

// Rooftop plant room in the centre of the roof.
for (const [x, z, base] of cells) {
  if (isPerim(x, z)) continue;
  if (x < 8 || x > 14 || z < 7 || z > 13) continue;
  const top = base + 20;
  put(x, top + 1, z, "light_gray_concrete");
  put(x, top + 2, z, "light_gray_concrete");
  put(x, top + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
