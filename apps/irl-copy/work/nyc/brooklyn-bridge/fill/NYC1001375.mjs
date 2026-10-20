import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1001375.cells.json`, "utf8"));

const W = 6, H = 24, D = 15;
const STOREY = 3;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// footprint lookup
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(`${x},${z}`, { g: Math.round(gr), r: Math.round(roof) });
}
const has = (x, z) => map.has(`${x},${z}`);

// one clean roof tier for the whole building: median of the lidar roofs
const roofs = [...map.values()].map((v) => v.r).sort((a, b) => a - b);
const TARGET_ROOF = roofs[Math.floor(roofs.length / 2)];

// outward normal of each side
const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

const paneProps = (d) => {
  const alongZ = d[0] !== 0;
  return {
    north: alongZ ? "true" : "false",
    south: alongZ ? "true" : "false",
    east: alongZ ? "false" : "true",
    west: alongZ ? "false" : "true",
    waterlogged: "false",
  };
};

// Per-cell massing: every cell stops on a storey line at the common roof tier
const info = [];
for (const [key, v] of map) {
  const [x, z] = key.split(",").map(Number);
  let N = Math.max(1, Math.round((TARGET_ROOF - v.g) / STOREY));
  let top = v.g + N * STOREY;
  if (top > H - 3) {
    top = H - 3;
    N = Math.max(1, Math.floor((top - v.g) / STOREY));
    top = v.g + N * STOREY;
  }
  const faces = DIRS.filter((d) => !has(x + d[0], z + d[1]));
  info.push({ x, z, g: v.g, N, top, faces, perim: faces.length > 0 });
}

// 1. foundation, walls, floor and roof slabs
for (const c of info) {
  const { x, z, g: gr, N, top, perim } = c;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (perim) {
    for (let y = gr + 1; y < top; y++) put(x, y, z, "bricks");
  }
  for (let k = 0; k <= N; k++) {
    const y = gr + k * STOREY;
    if (k === N) {
      put(x, y, z, perim ? "smooth_stone" : "stone");
    } else {
      put(x, y, z, perim ? "smooth_stone" : "oak_planks");
    }
  }
  if (perim) {
    // low cornice cap on the wall line, flush and clean
    put(x, top + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 2. windows, shopfront, door, lanterns
let doorCell = null;
const northCells = info
  .filter((c) => c.perim && c.faces.length === 1 && c.faces[0][1] === -1)
  .sort((a, b) => a.x - b.x);
if (northCells.length) {
  doorCell = northCells[Math.floor(northCells.length / 2)];
} else {
  const any = info.filter((c) => c.perim && c.faces.length === 1);
  if (any.length) doorCell = any[Math.floor(any.length / 2)];
}

for (const c of info) {
  if (!c.perim || c.faces.length !== 1) continue;
  const d = c.faces[0];
  const along = d[0] !== 0 ? c.z : c.x;
  const pane = paneProps(d);

  for (let k = 0; k < c.N; k++) {
    const base = c.g + k * STOREY;
    const isShop = k === 0;
    const isWindow = isShop || along % 2 === 1;
    if (!isWindow) continue;

    const isDoor = doorCell && c === doorCell && k === 0;
    if (isDoor) {
      const doorProps = (half) => ({
        facing: d[2],
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      put(c.x, base + 1, c.z, "oak_door", doorProps("lower"));
      put(c.x, base + 2, c.z, "oak_door", doorProps("upper"));
      // lanterns flanking the entrance on the glass either side
      const lx = d[0] !== 0 ? c.x : c.x;
      const lz = d[0] !== 0 ? c.z : c.z;
      for (const s of [-1, 1]) {
        const ex = d[0] !== 0 ? c.x : c.x + s;
        const ez = d[0] !== 0 ? c.z + s : c.z;
        if (has(ex, ez)) {
          const fc = info.find((q) => q.x === ex && q.z === ez);
          if (fc && fc.perim && fc.faces.length === 1) {
            put(ex, base + 1, ez, "glass_pane", pane);
            put(ex, base + 2, ez, "glass_pane", pane);
          }
        }
      }
      continue;
    }

    put(c.x, base + 1, c.z, "glass_pane", pane);
    put(c.x, base + 2, c.z, "glass_pane", pane);

    // warm light just inside some windows
    const inX = c.x - d[0];
    const inZ = c.z - d[1];
    if (has(inX, inZ) && (isShop ? along % 2 === 0 : (along + k) % 4 === 1)) {
      put(inX, base + 1, inZ, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// 3. short roof stubs on interior roof cells
for (const c of info) {
  if (c.perim) continue;
  if ((c.x + c.z) % 7 !== 0) continue;
  if (c.top + 2 >= H) continue;
  put(c.x, c.top + 1, c.z, "bricks");
}

g.save(`${DIR}/NYC1001375.nbt`);
