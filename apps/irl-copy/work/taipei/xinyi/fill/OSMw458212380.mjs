import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Teaching Building, Xinyi district: a 1980s-style campus block.
// Three storeys of about 5 blocks each, a light tiled concrete frame with
// grey piers and bands, tinted glazing, a stone base, a cornice and a
// parapet. Footprint 125 x 24, roof about 16 blocks above lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw458212380";
const W = 125, H = 28, D = 24;
const TOP_REL = 16; // roof height above lowest ground

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(c => c[2]));

const ground = new Map();
for (const [x, z, g] of raw) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, g - minG);
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const has = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Entrance: front (z-min) face, centred on the footprint's median x.
const xs = [...ground.keys()].map(k => +k.split(",")[0]).sort((a, b) => a - b);
const cx = xs[Math.floor(xs.length / 2)];
const entrance = new Map(); // key -> facing
const frontCells = [...ground.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([x, z]) => !has(x, z - 1) && Math.abs(x - cx) <= 1);
if (frontCells.length >= 3) {
  for (const [x, z] of frontCells) entrance.set(`${x},${z}`, "north");
} else {
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!has(x, z + 1) && Math.abs(x - cx) <= 1) entrance.set(k, "south");
  }
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const per = isPerim(x, z);
  const zEdge = !has(x, z - 1) || !has(x, z + 1);
  const xEdge = !has(x - 1, z) || !has(x + 1, z);
  const corner = zEdge && xEdge;
  const u = zEdge && !xEdge ? x : (xEdge && !zEdge ? z : -1);
  const pier = corner || (u >= 0 && u % 4 === 0);
  const top = Math.min(H - 1, Math.max(TOP_REL, gr + 2));
  const cornice = top - 1;

  // Foundation: solid from y0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!per) {
    // Interior cell: floor slabs per storey, roof deck, air between.
    put(x, gr, z, "light_gray_concrete");
    for (const s of [1, 2]) {
      const yb = gr + 5 * s;
      if (yb < cornice) put(x, yb, z, "light_gray_concrete");
    }
    if (cornice > gr) put(x, cornice, z, "light_gray_concrete");
    // Roof plant on a few interior cells.
    if (x % 12 === 6 && z % 8 === 4 && cornice > gr) put(x, top, z, "iron_block");
    continue;
  }

  // Perimeter cell: stone base course, tiled wall, grey bands and piers.
  put(x, gr, z, "smooth_stone");
  for (let y = gr + 1; y < top; y++) put(x, y, z, "white_concrete");
  for (const s of [1, 2]) {
    const yb = gr + 5 * s;
    if (yb < cornice) put(x, yb, z, "light_gray_concrete");
  }
  if (cornice > gr) put(x, cornice, z, "light_gray_concrete");
  put(x, top, z, "white_concrete"); // parapet

  // Window zones per storey.
  for (let s = 0; s < 3; s++) {
    const yb = gr + 5 * s;
    for (let y = yb + 1; y <= yb + 3; y++) {
      if (y <= gr || y >= cornice) continue;
      if (pier) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass");
        // Warm light behind some glazing, on the inward interior cell.
        if (y === yb + 1 && (u + s * 3) % 5 === 0) {
          let ix = x, iz = z;
          if (!has(x, z - 1) && has(x, z + 1)) iz = z + 1;
          else if (!has(x, z + 1) && has(x, z - 1)) iz = z - 1;
          else if (!has(x - 1, z) && has(x + 1, z)) ix = x + 1;
          else if (!has(x + 1, z) && has(x - 1, z)) ix = x - 1;
          if ((ix !== x || iz !== z) && has(ix, iz)) put(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // Entrance: glazed storefront with a central door, lintel above.
  const ek = `${x},${z}`;
  if (entrance.has(ek)) {
    const facing = entrance.get(ek);
    if (x === cx) {
      put(x, gr + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "light_blue_stained_glass");
    } else {
      put(x, gr + 1, z, "light_blue_stained_glass");
      put(x, gr + 2, z, "light_blue_stained_glass");
      put(x, gr + 3, z, "light_blue_stained_glass");
    }
    put(x, gr + 4, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
