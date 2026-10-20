import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-2000s Xinyi office tower: stone plinth, cyan curtain wall with
// white concrete floor bands, corner pilasters, two setbacks, a roof cap,
// a penthouse, a lit entrance and a mast.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407650500";
const W = 25, H = 86, D = 30;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) vox.set(x, y, z, block, props);
  else vox.set(x, y, z, block);
};

// ---- footprint bookkeeping -------------------------------------------------
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const dist = new Map();
const queue = [];
const missingCount = new Map();
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  const missing = NB.filter(([dx, dz]) => !ground.has(key(x + dx, z + dz))).length;
  missingCount.set(key(x, z), missing);
  if (missing > 0) {
    dist.set(key(x, z), 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const k = key(x + dx, z + dz);
    if (ground.has(k) && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push([x + dx, z + dz]);
    }
  }
}

const cellList = [...ground.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return {
    x, z, g: gr,
    dist: dist.get(k) ?? 1,
    corner: (missingCount.get(k) ?? 0) >= 2,
  };
});

// ---- massing ---------------------------------------------------------------
const ROOF = 70;
const tierD = (y) => (y < 40 ? 0 : y < 60 ? 1 : 3);
const LEDGES = [40, 60];

const edgeCells = cellList.filter((c) => c.dist === 1);
const minZ = Math.min(...edgeCells.map((c) => c.z));
const frontCells = edgeCells.filter((c) => c.z === minZ);
const meanX = frontCells.reduce((s, c) => s + c.x, 0) / frontCells.length;
const doorCell = frontCells.reduce((best, c) =>
  Math.abs(c.x - meanX) < Math.abs(best.x - meanX) ? c : best);

const mastCell = cellList.reduce((best, c) => (c.dist > best.dist ? c : best));

function facade(c, y) {
  const { x, z, g: gr } = c;
  if (y % 5 === 0) {
    put(x, y, z, "white_concrete");
    return;
  }
  // corner pilasters run the full height of the facade
  if (c.corner) {
    put(x, y, z, "quartz_pillar", { axis: "y" });
    return;
  }
  const ground = y < gr + 5;
  const mullion = ground ? (x + z) % 2 === 0 : (x + z) % 3 === 0;
  if (mullion) {
    put(x, y, z, "quartz_pillar", { axis: "y" });
    return;
  }
  put(x, y, z, "cyan_stained_glass");
  if ((x * 37 + z * 91 + y * 13) % 9 === 0) {
    const inward = NB
      .map(([dx, dz]) => ({ dx, dz, d: dist.get(key(x + dx, z + dz)) }))
      .filter((n) => n.d !== undefined && n.d >= c.dist + 1)
      .sort((a, b) => b.d - a.d)[0];
    if (inward && inward.d >= tierD(y) + 2) {
      put(x + inward.dx, y, z + inward.dz, "glowstone");
    }
  }
}

for (const c of cellList) {
  const { x, z, g: gr } = c;

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < ROOF; y++) {
    const d = tierD(y);
    const prevD = y > 0 ? tierD(y - 1) : 0;
    if (c.dist < d + 1) {
      if (LEDGES.includes(y) && c.dist >= prevD + 1) {
        put(x, y, z, "smooth_quartz");
      }
      continue;
    }
    if (c.dist === d + 1) {
      facade(c, y);
    } else if (y % 5 === 0) {
      put(x, y, z, "light_gray_concrete");
    }
  }

  if (c.dist >= 4) put(x, ROOF, z, "smooth_quartz");
  if (c.dist === 4) {
    put(x, 71, z, "white_concrete");
    put(x, 72, z, "white_concrete");
  }
  if (c.dist === 6) {
    if ((x + z) % 3 === 0) {
      put(x, 71, z, "quartz_pillar", { axis: "y" });
      put(x, 72, z, "quartz_pillar", { axis: "y" });
    } else {
      put(x, 71, z, "cyan_stained_glass");
      put(x, 72, z, "cyan_stained_glass");
    }
    put(x, 73, z, "quartz_block");
  } else if (c.dist >= 7) {
    put(x, 71, z, "light_gray_concrete");
    put(x, 72, z, "light_gray_concrete");
    put(x, 73, z, "light_gray_concrete");
  }
}

// ---- entrance: framed, lit lobby read from the street ----------------------
{
  const { x, z, g: gr } = doorCell;
  // stone frame: pillars either side of the door, polished plinth beneath
  for (const dx of [-2, -1, 1, 2]) {
    put(x + dx, gr, z, "polished_granite");
    put(x + dx, gr + 1, z, "quartz_pillar", { axis: "y" });
    put(x + dx, gr + 2, z, "quartz_pillar", { axis: "y" });
    put(x + dx, gr + 3, z, "white_concrete");
  }
  put(x, gr + 3, z, "white_concrete");
  put(x, gr + 4, z, "white_concrete");

  // door, with a hanging lantern in the lintel gap above it
  put(x, gr, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "lantern", { hanging: "true" });

  // lit lobby just behind the door
  put(x, gr + 2, z + 1, "glowstone");
  put(x - 1, gr + 2, z + 1, "glowstone");
  put(x + 1, gr + 2, z + 1, "glowstone");
}

// ---- mast and aviation light ----------------------------------------------
{
  const { x, z } = mastCell;
  for (let y = 74; y <= 79; y++) put(x, y, z, "iron_bars");
  for (let y = 80; y <= 82; y++) put(x, y, z, "lightning_rod");
  put(x, 83, z, "redstone_lamp", { lit: "true" });
}

vox.save(`${DIR}/${ID}.nbt`);
