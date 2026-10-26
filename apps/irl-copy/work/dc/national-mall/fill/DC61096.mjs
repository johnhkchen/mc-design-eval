import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC61096";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 30, D = 13;
const MAXY = 26;
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const put = (x, y, z, name, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

// Footprint: "x,z" -> { gr: ground, top: exclusive roof level }
const fp = new Map();
for (const [x, z, gr0, rf] of cells) {
  const gr = clamp(Math.round(gr0), 0, MAXY - 6);
  const top = clamp(Math.round(rf / 3) * 3, gr + 3, MAXY);
  fp.set(`${x},${z}`, { gr, top });
}
const has = (x, z) => fp.has(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const doorX = Math.floor((minX + maxX) / 2);

const exposure = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});

// Pick a sparse set of warm windows so they read as lit rooms, not noise.
const warm = (x, y, z) => ((x * 7 + y * 5 + z * 3) % 23 === 0);

for (const [x, z] of cells) {
  const { gr, top } = fp.get(`${x},${z}`);
  const ex = exposure(x, z);
  const exCount = Object.values(ex).filter(Boolean).length;
  const perimeter = exCount > 0;
  const corner = exCount >= 2;
  const isDoor = ex.N && z === minZ && x === doorX;

  // Foundation: solid from y0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perimeter) {
    // Interior core: solid mass with a gray roof membrane.
    for (let y = gr; y < top - 1; y++) put(x, y, z, "stone_bricks");
    put(x, top - 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    put(x, top - 1, z, "smooth_stone");
  } else {
    for (let y = gr; y < top; y++) {
      const rel = y - gr;
      if (rel === 0) {
        // Plinth: stone base course, with the door's threshold on the entrance cell.
        put(x, y, z, "stone_bricks");
        continue;
      }
      if (y === top - 1) {
        // Cornice: a projecting-looking course of chiseled quartz.
        put(x, y, z, "chiseled_quartz_block");
        continue;
      }
      if (corner) {
        // Full-height pilasters at the corners read as stone columns.
        put(x, y, z, "quartz_pillar", { axis: "y" });
        continue;
      }
      if (isDoor && rel <= 2) {
        // Doorway surround: upper part is solid stone above the door.
        if (rel === 2) put(x, y, z, "chiseled_stone_bricks");
        continue; // rel 1 is the door's upper half, set below
      }
      if (rel % 3 === 0) {
        put(x, y, z, "smooth_quartz");           // storey line
      } else {
        const block = warm(x, y, z) ? "glowstone" : "glass";
        put(x, y, z, block);
      }
    }

    // Parapet on the outer edge.
    put(x, top, z, "stone_bricks");

    if (isDoor) {
      const props = { facing: "north", hinge: "left", open: "false", powered: "false" };
      put(x, gr + 1, z, "dark_oak_door", { ...props, half: "upper" });
      put(x, gr, z, "dark_oak_door", { ...props, half: "lower" });
    }
  }
}

// Entrance flanking lanterns on the street wall beside the door.
for (const dx of [-1, 1]) {
  const x = doorX + dx;
  const z = minZ;
  if (has(x, z) && !has(x, z - 1)) {
    const { gr } = fp.get(`${x},${z}`);
    put(x, gr + 2, z, "glowstone");
  }
}

// Central plant room on the roof: one block-wide box over the middle of the interior.
for (const [x, z] of cells) {
  const { top } = fp.get(`${x},${z}`);
  const exCount = Object.values(exposure(x, z)).filter(Boolean).length;
  if (exCount > 0) continue;
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 2 && top + 2 <= H) {
    put(x, top, z, "smooth_quartz");
    put(x, top + 1, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
