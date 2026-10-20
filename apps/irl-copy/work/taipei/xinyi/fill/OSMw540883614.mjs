import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883614";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 23, D = 8;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const minG = Math.min(...ground.values());

// Mid-rise commercial block, c. 1990s: two storeys of shopfront and punched
// windows over a stone plinth, quartz-tile skin, cornice and parapet.
const R = minG + 11;                       // roof deck level from lidar
const ORDER = ["N", "S", "W", "E"];
const FACES = {
  N: { dx: 0, dz: -1, name: "north", axis: "x" },
  S: { dx: 0, dz: 1, name: "south", axis: "x" },
  W: { dx: -1, dz: 0, name: "west", axis: "z" },
  E: { dx: 1, dz: 0, name: "east", axis: "z" },
};
const exts = (x, z) => ORDER.filter(f => !has(x + FACES[f].dx, z + FACES[f].dz));
const isPerim = (x, z) => exts(x, z).length > 0;

// Front = face with the most exterior cells
const count = { N: 0, S: 0, W: 0, E: 0 };
for (const [x, z] of cells) for (const f of exts(x, z)) count[f]++;
const front = ORDER.reduce((a, b) => (count[b] > count[a] ? b : a));
const frontIdxs = cells
  .filter(([x, z]) => exts(x, z).includes(front))
  .map(([x, z]) => (FACES[front].axis === "x" ? x : z))
  .sort((a, b) => a - b);
const entranceIdx = frontIdxs[Math.floor(frontIdxs.length / 2)];

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const facade = (idx, rel, y, T) => {
  if (y === T - 1) return ["smooth_quartz_slab", { type: "top", waterlogged: "false" }];
  if (rel === 0) return ["stone_bricks"];
  if (rel >= 1 && rel <= 3) return idx % 3 === 0 ? ["polished_andesite"] : ["light_blue_stained_glass"];
  if (rel === 4 || rel === 5) return ["smooth_quartz"];
  if (rel === 6 || rel === 8) return ["white_concrete"];
  if (rel === 7) return idx % 2 === 0 ? ["light_blue_stained_glass"] : ["white_concrete"];
  if (rel === 9) return ["smooth_quartz"];
  return ["smooth_quartz"];
};

// Pass 1: foundation, walls, floors, roof deck, parapet
for (const [x, z, gr] of cells) {
  const ex = exts(x, z);
  const perim = ex.length > 0;
  const T = Math.max(R, gr + 1);

  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (perim) {
    const face = ex.includes(front) ? front : ex[0];
    const idx = FACES[face].axis === "x" ? x : z;
    for (let y = gr; y < T; y++) {
      const rel = y - gr;
      const isEntrance = face === front && idx === entranceIdx;
      if (isEntrance && rel === 1) {
        put(x, y, z, "dark_oak_door", { facing: FACES[face].name, half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isEntrance && rel === 2) {
        put(x, y, z, "dark_oak_door", { facing: FACES[face].name, half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isEntrance && rel === 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      const [id, p] = facade(idx, rel, y, T);
      put(x, y, z, id, p);
    }
    put(x, T + 1, z, "smooth_quartz");   // parapet
  } else {
    // interior: floor slabs per storey, air gap otherwise
    if (gr < T) put(x, gr, z, "smooth_stone");
    if (gr + 5 < T) put(x, gr + 5, z, "smooth_stone");
  }
  put(x, T, z, "light_gray_concrete");   // roof deck
}

// Pass 2: warm light behind some upper-storey windows (air gap, not interior)
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const ex = exts(x, z);
  const face = ex.includes(front) ? front : ex[0];
  const F = FACES[face];
  const idx = F.axis === "x" ? x : z;
  if (idx % 4 !== 0 || idx % 2 !== 0) continue;
  const ix = x - F.dx, iz = z - F.dz;
  const T = Math.max(R, gr + 1);
  if (has(ix, iz) && !isPerim(ix, iz) && gr + 7 < T - 1) {
    put(ix, gr + 7, iz, "glowstone");
  }
}

// Pass 3: roof plant and penthouse core
for (const [x, z, gr] of cells) {
  const T = Math.max(R, gr + 1);
  if (isPerim(x, z)) continue;
  const inPent = x >= 3 && x <= 5 && z >= 2 && z <= 4;
  if (inPent) {
    const edge = x === 3 || x === 5 || z === 2 || z === 4;
    put(x, T + 1, z, edge ? "light_blue_stained_glass" : "white_concrete");
    put(x, T + 2, z, "white_concrete");
    put(x, T + 3, z, "light_gray_concrete");
  }
  const isAC = (x === 1 && z === 1) || (x === 7 && z === 6);
  if (isAC && !inPent) put(x, T + 1, z, "gray_concrete");
}

// Roof lantern on the penthouse cap, if the height allows
{
  const pc = cells.find(([x, z]) => x === 4 && z === 3);
  if (pc) {
    const T = Math.max(R, pc[2] + 1);
    put(4, T + 4, 3, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
