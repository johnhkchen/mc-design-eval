import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3339163.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3339163.nbt";

const W = 10, H = 16, D = 5;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const c of cells) {
  const x = Math.round(c[0]), z = Math.round(c[1]);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  raw.set(key(x, z), { g: Math.max(0, Math.round(c[2])), r: Math.round(c[3]) });
}

// Smooth the lidar roof into one clean flat tier (median of the footprint)
const roofs = [...raw.values()].map(v => v.r).sort((a, b) => a - b);
const medianRoof = roofs.length ? roofs[Math.floor(roofs.length / 2)] : 4;

const info = new Map();
for (const [k, v] of raw) {
  let ground = Math.min(v.g, H - 5);
  let roof = Math.min(Math.max(medianRoof, ground + 3), H - 3);
  info.set(k, { g: ground, r: roof });
}

const inFp = (x, z) => info.has(key(x, z));
const isPerim = (x, z) =>
  !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

const put = (x, y, z, block, props) => {
  if (!inFp(x, z) || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

for (const [k, { g: gr, r }] of info) {
  const [x, z] = k.split(",").map(Number);
  const perim = isPerim(x, z);
  const corner = isCorner(x, z);
  const frontOrBack = z === 0 || z === D - 1;

  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (perim) {
    // Base course
    put(x, gr, z, "stone_bricks");

    for (let y = gr + 1; y <= r - 2; y++) {
      const off = y - gr;
      if (corner) { put(x, y, z, "stone_bricks"); continue; }

      // Storey line (even offsets): concrete band over brick
      if (off % 2 === 0) { put(x, y, z, "smooth_stone"); continue; }

      // Window row (odd offsets): panes between brick piers
      let pane;
      if (frontOrBack) pane = x % 3 !== 0;
      else pane = true; // end walls, non-corner cells

      if (!pane) { put(x, y, z, "bricks"); continue; }

      const connect = frontOrBack
        ? { north: "false", south: "false", east: "true", west: "true" }
        : { north: "true", south: "true", east: "false", west: "false" };
      put(x, y, z, "glass_pane", { ...connect, waterlogged: "false" });

      // Warm light behind some panes, in the interior cell beside them
      if ((x * 7 + z * 13 + y * 3) % 3 === 0) {
        let dx = 0, dz = 0;
        if (x === 0) dx = 1; else if (x === W - 1) dx = -1;
        if (z === 0) dz = 1; else if (z === D - 1) dz = -1;
        if (inFp(x + dx, z + dz)) put(x + dx, y, z + dz, "glowstone");
      }
    }

    // Brick wall fill where the loop left gaps (lower storey row above base)
    // Parapet: cornice course then a coping slab on top
    put(x, r - 1, z, "smooth_stone");
    put(x, r, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Interior: floor slabs per storey, roof deck at the top, air elsewhere
    for (let y = gr; y <= r - 2; y += 2) put(x, y, z, "smooth_stone");
    put(x, r - 1, z, "smooth_stone");
  }
}

// Entrance: centred on the front (z = 0) face, framed, with a canopy
const EX = 4;
{
  const e = info.get(key(EX, 0));
  if (e) {
    const gr = e.g, r = e.r;
    // Frame piers beside the door
    for (const fx of [EX - 1, EX + 1]) {
      put(fx, gr + 1, 0, "stone_bricks");
      put(fx, gr + 2, 0, "stone_bricks");
    }
    if (gr + 2 <= r - 2) {
      put(EX, gr + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(EX, gr + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    // Canopy over the entrance
    if (gr + 3 <= r - 2) {
      for (let x = EX - 2; x <= EX + 2; x++) {
        if (inFp(x, 0)) put(x, gr + 3, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
      }
    }
  }
}

// Roof plant: a low 3x2 penthouse block on the roof, sitting on the deck
{
  const deck = medianRoof;
  for (let x = 1; x <= 3; x++) {
    for (let z = 2; z <= 3; z++) {
      const c = info.get(key(x, z));
      if (!c || c.r + 1 >= H) continue;
      put(x, c.r, z, "light_gray_concrete");
      put(x, c.r + 1, z, "light_gray_concrete");
    }
  }
}

g.save(OUT);
