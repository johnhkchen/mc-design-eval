import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC75964.cells.json`, "utf8"));

const W = 9, H = 19, D = 8;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, st) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

const key = (x, z) => x + "," + z;
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(key(x, z), { g: gr, r: rf });
const has = (x, z) => map.has(key(x, z));
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// Common storey datum (lowest ground) and one levelled roof height (median lidar roof).
const G = Math.min(...cells.map(c => c[2]));
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const T = Math.min(Math.max(medRoof, G + 6), H - 4); // T = first empty y above the building

const info = new Map();
for (const [x, z, gr] of cells) {
  const missing = Object.keys(DIRS).filter(d => !has(x + DIRS[d][0], z + DIRS[d][1]));
  info.set(key(x, z), {
    x, z, g: gr, missing,
    ext: missing.length > 0,
    corner: missing.length >= 2,
  });
}

// Pass 1: foundations, walls on absolute storey bands, roof.
for (const c of info.values()) {
  const { x, z, g: gr, ext, corner, missing } = c;

  // Foundation fill from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!ext) {
    // Interior: floor slabs and roof cover only; air between.
    put(x, gr, z, "smooth_stone");
    if (G + 3 > gr) put(x, G + 3, z, "smooth_stone");
    put(x, T - 1, z, "deepslate_tiles");
    continue;
  }

  const alongX = missing.includes("N") || missing.includes("S");
  const idx = alongX ? x : z;

  for (let y = gr; y <= T - 1; y++) {
    const rel = y - G;
    if (y === T - 1) {
      put(x, y, z, "smooth_quartz");            // cornice / parapet, levelled
    } else if (rel === 0) {
      put(x, y, z, "stone_bricks");             // base course
    } else if (rel === 3 || corner) {
      put(x, y, z, "smooth_quartz");            // storey belt and corner pillars
    } else if ((rel === 1 || rel === 2 || rel === 4 || rel === 5) && idx % 2 === 1) {
      put(x, y, z, "glass_pane");               // windows
    } else {
      put(x, y, z, "bricks");                   // piers
    }
  }
}

// Pass 2: warm light behind some windows, in the room cell just inside.
for (const c of info.values()) {
  if (!c.ext || c.corner) continue;
  const alongX = c.missing.includes("N") || c.missing.includes("S");
  const idx = alongX ? c.x : c.z;
  if (idx % 2 !== 1) continue;
  if ((c.x + c.z) % 3 !== 0) continue;

  let ix = c.x, iz = c.z;
  const side = c.missing[0];
  if (side === "N") iz = c.z + 1;
  else if (side === "S") iz = c.z - 1;
  else if (side === "W") ix = c.x + 1;
  else if (side === "E") ix = c.x - 1;

  const inner = info.get(key(ix, iz));
  if (!inner || inner.ext) continue;

  for (const y of [G + 1, G + 4]) {
    if (y >= inner.g && y < T - 1) put(ix, y, iz, "glowstone");
  }
}

// Pass 3: entrance on the south (front) face, nearest the middle, with a hood.
let door = null;
for (const c of info.values()) {
  if (!c.ext || c.corner || !c.missing.includes("S")) continue;
  if (!door || Math.abs(c.x - 4) < Math.abs(door.x - 4)) door = c;
}
if (door) {
  const { x, z } = door;
  put(x, G + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, G + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, G + 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" }); // door hood
}

// Pass 4: brick chimney on the interior cell nearest the centre, above the roof.
let chim = null;
let bestD = Infinity;
for (const c of info.values()) {
  if (c.ext) continue;
  const d = Math.hypot(c.x - 4, c.z - 3.5);
  if (d < bestD) { bestD = d; chim = c; }
}
if (chim) {
  const { x, z } = chim;
  put(x, T, z, "bricks");
  put(x, T + 1, z, "bricks");
  put(x, T + 2, z, "brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/DC75964.nbt`);
