import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831857623";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const edge = (x, z, d) => !has(x + DIRS[d][0], z + DIRS[d][1]);
const isBoundary = (x, z) => edge(x, z, "N") || edge(x, z, "S") || edge(x, z, "W") || edge(x, z, "E");

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const minG = Math.min(...cells.map((c) => c[2]));
// Roof deck sits at T-1, parapet at T: roof about 11 blocks above lowest ground.
const T = Math.min(H - 3, minG + 11);

// Door: on the south face, the boundary cell closest to the footprint's mean x.
const southCells = cells.filter(([x, z]) => edge(x, z, "S"));
let doorCell = null;
if (southCells.length) {
  const meanX = southCells.reduce((s, c) => s + c[0], 0) / southCells.length;
  doorCell = southCells.reduce((best, c) =>
    Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best
  );
}

const glowList = [];

// Pass 1: foundations, interiors, boundary walls.
for (const [x, z, gr] of cells) {
  const top = Math.max(T, gr + 6);
  const bnd = isBoundary(x, z);

  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) {
    put(x, y, z, bnd ? "stone_bricks" : "smooth_stone");
  }

  if (!bnd) {
    // Interior: one floor slab per storey, roof deck, air elsewhere.
    if (gr + 5 < top - 1) put(x, gr + 5, z, "smooth_stone");
    put(x, top - 1, z, "smooth_quartz");
    // Rooftop plant boxes on a sparse pattern.
    if ((x * 3 + z * 7) % 11 === 0 && x >= 2 && x <= W - 3) {
      put(x, top, z, "light_gray_concrete");
      put(x, top + 1, z, "light_gray_concrete");
    }
  } else {
    // Boundary: full wall from ground to deck, base course, storey line, cornice, parapet.
    for (let y = gr + 1; y <= top - 1; y++) put(x, y, z, "white_concrete");
    put(x, gr, z, "polished_granite");
    if (gr + 5 <= top - 1) put(x, gr + 5, z, "smooth_quartz");
    if (top - 2 > gr + 5) put(x, top - 2, z, "smooth_quartz");
    put(x, top, z, "smooth_quartz");
  }
}

// Pass 2: windows, shopfront, door, and warm light placement on boundary cells.
for (const [x, z, gr] of cells) {
  if (!isBoundary(x, z)) continue;
  const top = Math.max(T, gr + 6);
  const eN = edge(x, z, "N"), eS = edge(x, z, "S");
  const eW = edge(x, z, "W"), eE = edge(x, z, "E");
  const corner = (eN || eS) && (eW || eE);
  if (corner) continue; // corner cells stay as solid piers

  for (const d of ["N", "S", "W", "E"]) {
    if (!edge(x, z, d)) continue;
    const along = d === "N" || d === "S" ? x : z;
    const isWin = along % 4 === 1 || along % 4 === 2;
    if (!isWin) continue;

    const isDoor = d === "S" && doorCell && doorCell[0] === x && doorCell[1] === z;

    // Ground floor shopfront glass.
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (isDoor && y <= gr + 2) continue;
      put(x, y, z, "glass");
    }

    // Upper floor window glass.
    if (gr + 8 <= top - 3) {
      for (let y = gr + 6; y <= gr + 8; y++) put(x, y, z, "glass");
    }

    // Door on the south face, with a lintel above.
    if (isDoor) {
      put(x, gr + 1, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "smooth_quartz");
    }

    // Glowstone behind some upper windows, in the interior air gap.
    if (gr + 8 <= top - 3 && along % 8 === 1) {
      const ix = x - DIRS[d][0], iz = z - DIRS[d][1];
      if (has(ix, iz) && !isBoundary(ix, iz) && gr + 7 < top - 1) {
        glowList.push([ix, gr + 7, iz]);
      }
    }
  }
}

// Pass 3: glowstone lights behind windows.
for (const [x, y, z] of glowList) put(x, y, z, "glowstone");

g.save(`${DIR}/${ID}.nbt`);
