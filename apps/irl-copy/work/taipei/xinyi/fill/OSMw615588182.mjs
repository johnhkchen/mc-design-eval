import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-century commercial block (c. 1970s-80s Taipei shophouse-style):
// stone plinth, cream tiled walls, quartz piers, shopfronts with a green fascia
// on the street face, upper-storey window bays, cornice, parapet, and roof plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw615588182";
const W = 42, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const G = new Map();
let maxG = 0;
for (const [x, z, g] of cells) {
  G.set(key(x, z), g);
  if (g > maxG) maxG = g;
}
const has = (x, z) => G.has(key(x, z));

// Roof sits at a fixed level (about 11 above the lowest ground); downhill cells
// show extra foundation and storeys stay on their own floor lines.
const ROOF = Math.max(11, maxG + 6);
const F2 = ROOF - 5;      // second-floor slab line
const CORN = ROOF - 1;    // cornice course

// Street-facing cells (no neighbour on the -z side), excluding corners.
const frontCells = cells
  .filter(([x, z]) => !has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z))
  .sort((a, b) => a[0] - b[0]);
const doorCell = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : null;
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

const vox = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) vox.set(x, y, z, b, p);
  else vox.set(x, y, z, b);
};

const cx = Math.floor(W / 2), cz = Math.floor(D / 2);

for (const [x, z, gr] of cells) {
  const miss = {
    n: !has(x, z - 1), // -z side: street face
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
  const ext = miss.n || miss.s || miss.w || miss.e;
  const corner = (miss.n || miss.s) && (miss.w || miss.e);
  const isDoor = key(x, z) === doorKey;

  // Foundation under the cell, then the ground-level floor / plinth.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, ext ? "polished_andesite" : "smooth_stone");

  // Roof deck and parapet.
  put(x, ROOF, z, "light_gray_concrete");
  if (ext) put(x, ROOF + 1, z, "quartz_block");

  // Walls, storey lines, and interior floor slabs.
  for (let y = gr + 1; y <= ROOF - 1; y++) {
    if (!ext) {
      if (y === F2 && F2 > gr) put(x, y, z, "smooth_stone");
      continue; // interior air
    }
    if (y === CORN) { put(x, y, z, "quartz_block"); continue; }
    if (y === F2) { put(x, y, z, "smooth_stone"); continue; }

    if (corner) { put(x, y, z, "quartz_block"); continue; }

    // Face orientation: x-running faces (north/south) or z-running faces (east/west).
    const alongX = miss.n || miss.s;
    const t = alongX ? x : z;
    const front = miss.n;
    const pier = t % 3 === 0;
    const paneProps = alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    if (y < F2) {
      // Ground storey.
      if (front && y >= gr + 1 && y <= F2 - 2) {
        if (isDoor && (y === gr + 1 || y === gr + 2)) {
          put(x, y, z, "oak_door", {
            facing: "north", half: y === gr + 1 ? "lower" : "upper",
            hinge: "left", open: "false", powered: "false",
          });
        } else if (pier) {
          put(x, y, z, "quartz_block");
        } else {
          put(x, y, z, "glass_pane", paneProps);
        }
      } else if (front && y === F2 - 1) {
        put(x, y, z, "green_concrete"); // shop fascia band
      } else if (!front && y >= gr + 2 && y <= F2 - 2 && !pier) {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      } else {
        put(x, y, z, pier ? "quartz_block" : "white_concrete");
      }
    } else {
      // Upper storey window bays.
      if (y >= F2 + 1 && y <= ROOF - 2 && !pier) {
        const lit = y === F2 + 2 && ((t * 5 + (alongX ? z : x) * 3) % 7 === 0);
        if (lit) put(x, y, z, "glowstone");
        else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      } else {
        put(x, y, z, pier ? "quartz_block" : "white_concrete");
      }
    }
  }

  // Roof plant on interior cells: AC condensers and a central water tank.
  if (!ext) {
    if (x % 6 === 2 && z % 5 === 2) put(x, ROOF + 1, z, "iron_block");
    if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
      put(x, ROOF + 1, z, "white_concrete");
      put(x, ROOF + 2, z, "smooth_stone");
    }
  }
}

// Lightning rod on the central tank.
if (has(cx, cz) && ROOF + 3 < H) {
  put(cx, ROOF + 3, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

vox.save(`${DIR}/${ID}.nbt`);
