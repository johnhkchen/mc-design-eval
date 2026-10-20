import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538121681";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// 13 x 23 x 13: low-rise 1980s Xinyi commercial block, two storeys over a
// tiled base, flat roof with parapet, a small central penthouse.
const W = 13, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

const m = Math.min(...ground.values());
// Roof deck sits ~10 blocks above lowest ground; parapet one block above it,
// so the top of the building is ~11 blocks above lowest ground.
const R = Math.min(m + 10, H - 4);
const topFor = (gr) => Math.min(H - 3, Math.max(R, gr + 5));

// Front (south, max z) edge: entrance at the median x of that frontage.
let maxZ = -Infinity;
for (const [x, z] of cells) if (isEdge(x, z) && z > maxZ) maxZ = z;
const front = cells.filter(([x, z]) => z === maxZ && isEdge(x, z)).map(([x]) => x).sort((a, b) => a - b);
const dx = front[Math.floor(front.length / 2)];
const dz = maxZ;

// Pier every third bay along each wall; corners always piers.
const pier = (x, z) => {
  const along = (x === 0 || x === W - 1) ? z : x;
  return along % 3 === 0;
};

const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const top = topFor(gr);
  const e = isEdge(x, z);

  // Inward neighbour for glowstone "lights behind glass".
  let ix = 0, iz = 0;
  if (x === 0) ix = 1; else if (x === W - 1) ix = -1;
  else if (z === 0) iz = 1; else if (z === D - 1) iz = -1;
  const inward = inside(x + ix, z + iz) && !isEdge(x + ix, z + iz);

  for (let y = gr; y < top; y++) {
    const r = y - gr;
    const w = r % 5;
    if (e) {
      let placed = false;
      if (r === 0) {
        g.set(x, y, z, "stone_bricks");
      } else if (w === 0) {
        g.set(x, y, z, "white_concrete");
      } else if (w === 4) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (pier(x, z)) {
        g.set(x, y, z, "light_gray_concrete");
      } else {
        const alongZ = (x === 0 || x === W - 1);
        g.set(x, y, z, "light_blue_stained_glass_pane", {
          north: alongZ ? "true" : "false",
          south: alongZ ? "true" : "false",
          east: alongZ ? "false" : "true",
          west: alongZ ? "false" : "true",
          waterlogged: "false",
        });
        placed = true;
      }

      // Entrance: door on the south frontage, canopy-lantern above.
      if (x === dx && z === dz) {
        if (r === 1) g.set(x, y, z, "dark_oak_door", doorProps("lower"));
        if (r === 2) g.set(x, y, z, "dark_oak_door", doorProps("upper"));
        if (r === 3) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      }

      // Warm light behind some windows.
      if (placed && r === 2 && inward && (x + 2 * z) % 3 === 0) {
        g.set(x + ix, y, z + iz, "glowstone");
      }
    } else {
      // Interior: floor slabs only, air behind glass.
      if (r === 0 || w === 0) g.set(x, y, z, "smooth_stone");
    }
  }

  // Roof deck and parapet.
  g.set(x, top, z, "smooth_stone");
  if (e) g.set(x, top + 1, z, "white_concrete");
}

// Central penthouse for roof equipment.
const T0 = topFor(ground.get("6,6") ?? m);
for (let x = 4; x <= 8; x++) {
  for (let z = 4; z <= 8; z++) {
    if (!inside(x, z) || topFor(ground.get(key(x, z))) !== T0) continue;
    const ring = x === 4 || x === 8 || z === 4 || z === 8;
    if (ring) g.set(x, T0 + 1, z, "quartz_block");
    g.set(x, T0 + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${dir}/${id}.nbt`);
