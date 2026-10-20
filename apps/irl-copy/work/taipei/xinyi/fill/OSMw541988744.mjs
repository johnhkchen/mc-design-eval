import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988744";
const W = 24, H = 23, D = 13;

// Two-storey 1990s Xinyi commercial block: stone base, quartz-clad piers,
// tinted glazing, red shopfront awning, grey fascia lines, parapet roof.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(c => Array.isArray(c)
  ? { x: c[0], z: c[1], g: c[2] }
  : { x: c.x, z: c.z, g: c.ground ?? c.g });

const G = new Map();
for (const c of cells) G.set(`${c.x},${c.z}`, c.g);
const has = (x, z) => G.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const missingCount = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz)).length;
const isPerim = (x, z) => missingCount(x, z) > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const minZ = Math.min(...cells.map(c => c.z));

for (const { x, z, g: gr } of cells) {
  // Foundation and ground course, solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");

  if (!isPerim(x, z)) {
    // Interior: floor slab at the storey line and roof deck, air between.
    put(x, gr + 5, z, "smooth_quartz");
    put(x, gr + 10, z, "gray_concrete");
    // Simple roof plant boxes.
    if (x % 7 === 3 && z % 4 === 1) put(x, gr + 11, z, "light_gray_concrete");
    continue;
  }

  const pier = missingCount(x, z) >= 2 || (x + z) % 3 === 0;

  // Storey 1: shopfront glazing with piers, red awning band above.
  for (let y = gr + 1; y <= gr + 3; y++) {
    put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass_pane");
  }
  put(x, gr + 4, z, pier ? "white_concrete" : "red_concrete");

  // Fascia / floor line.
  put(x, gr + 5, z, "light_gray_concrete");

  // Storey 2: punched windows with sills and headers.
  put(x, gr + 6, z, pier ? "white_concrete" : "smooth_quartz_slab", pier ? undefined : { type: "bottom" });
  put(x, gr + 7, z, pier ? "white_concrete" : "light_blue_stained_glass_pane");
  put(x, gr + 8, z, pier ? "white_concrete" : "light_blue_stained_glass_pane");
  put(x, gr + 9, z, pier ? "white_concrete" : "smooth_quartz");

  // Parapet cap, roof level at gr + 11.
  put(x, gr + 10, z, "smooth_quartz");

  // Warm lights set just inside some windows, only where the inside is open air.
  if (!pier) {
    const inward = DIRS
      .map(([dx, dz]) => [x + dx, z + dz])
      .find(([nx, nz]) => has(nx, nz) && !isPerim(nx, nz));
    if (inward) {
      const [ix, iz] = inward;
      if ((x * 5 + z * 3) % 4 === 0) put(ix, gr + 7, iz, "shroomlight");
      else if ((x + 2 * z) % 5 === 0) put(ix, gr + 2, iz, "glowstone");
    }
  }
}

// Entrance: a non-pier front-facing cell on the north face (toward -z), nearest the middle.
const doorCands = cells
  .filter(c => c.z === minZ && isPerim(c.x, c.z) && !(missingCount(c.x, c.z) >= 2 || (c.x + c.z) % 3 === 0))
  .sort((a, b) => Math.abs(a.x - 12) - Math.abs(b.x - 12));
const door = doorCands[0] ?? cells.filter(c => c.z === minZ).sort((a, b) => Math.abs(a.x - 12) - Math.abs(b.x - 12))[0];
if (door) {
  const props = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(door.x, door.g + 1, door.z, "dark_oak_door", props("lower"));
  put(door.x, door.g + 2, door.z, "dark_oak_door", props("upper"));
}

g.save(`${DIR}/${ID}.nbt`);
