import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833532";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y of that cell
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward normals of exposed faces
const NORM = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const outs = (x, z) => NORM.filter(([dx, dz]) => !has(x + dx, z + dz));

// Storey plan (relative to each cell's ground gr), ~5 blocks per storey:
//   gr+1      floor slab / base course
//   gr+2..4   ground storey (shopfront)
//   gr+5      storey line
//   gr+6..9   second storey
//   gr+10     roof slab / cornice
//   gr+11     parapet (perimeter) or roof plant (interior, up to gr+12)

// Pass 1: foundations, slabs, walls
for (const [x, z, gr] of cells) {
  const o = outs(x, z);
  const per = o.length > 0;

  // Foundation from y=0 up to ground under the cell
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab at ground-floor level
  put(x, gr + 1, z, per ? "polished_andesite" : "smooth_stone");

  // Storey line and roof slab
  put(x, gr + 5, z, "smooth_stone");
  put(x, gr + 10, z, per ? "smooth_stone" : "light_gray_concrete");

  if (per) {
    // Parapet cap on the perimeter
    put(x, gr + 11, z, "white_concrete");

    const rows = [gr + 2, gr + 3, gr + 4, gr + 6, gr + 7, gr + 8, gr + 9];
    for (const y of rows) {
      let id = "white_concrete";
      if (o.length === 1) {
        const [dx, dz] = o[0];
        const i = dz !== 0 ? x : z;           // position along the face
        const isWindow = i % 3 !== 0;         // every third column is a pier
        if (isWindow) id = "light_blue_stained_glass";
      }
      put(x, y, z, id);
    }
  } else {
    // Interior: air between slabs, no interior fill
  }
}

// Pass 2: warm lights behind second-storey windows (interior air only)
for (const [x, z, gr] of cells) {
  const o = outs(x, z);
  if (o.length !== 1) continue;
  const [dx, dz] = o[0];
  const i = dz !== 0 ? x : z;
  if (i % 3 === 0) continue;   // pier, not a window
  if (i % 2 !== 0) continue;   // thin out the lights
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz)) continue;
  if (outs(ix, iz).length > 0) continue; // inward cell is also perimeter: no air behind
  const gi = gnd(ix, iz);
  put(ix, gi + 7, iz, "lantern", { hanging: "false" });
}

// Pass 3: entrance on the south face, centred along its frontage
{
  const south = cells.filter(([x, z]) => {
    const o = outs(x, z);
    return o.length === 1 && o[0][1] === 1;
  });
  const pool = south.length ? south : cells.filter(([x, z]) => outs(x, z).length > 0);
  if (pool.length) {
    const xs = pool.map(c => c[0]).sort((a, b) => a - b);
    const ex = xs[Math.floor(xs.length / 2)];
    const cand = pool.find(c => c[0] === ex) || pool[0];
    const [ax, az, agr] = cand;
    const doorPart = (y, half) => g.set(ax, y, az, "dark_oak_door",
      { facing: "south", half, hinge: "left", open: "false", powered: "false" });
    // Clear the wall where the door goes, then place the two door halves
    put(ax, agr + 2, az, "air");
    put(ax, agr + 3, az, "air");
    doorPart(agr + 2, "lower");
    doorPart(agr + 3, "upper");
    // Lintel above the door
    put(ax, agr + 4, az, "smooth_stone");
    // Lanterns flanking the entrance on the ground storey, inside the wall line
    const pair = [ax - 1, ax + 1].filter(x => has(x, az) && outs(x, az).some(([, dz]) => dz === 1));
    for (const lx of pair) {
      put(lx, gnd(lx, az) + 4, az, "lantern", { hanging: "false" });
    }
  }
}

// Pass 4: roof plant on interior roof cells (sits on the roof slab)
for (const [x, z, gr] of cells) {
  if (outs(x, z).length > 0) continue;
  if (x % 7 === 3 && z % 7 === 3) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
