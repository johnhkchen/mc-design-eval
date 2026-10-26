import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC69442";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 34, D = 52;
const g = new Voxels([W, H, D]);

const inside = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (!inside(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const fp = new Map();
for (const c of cells) fp.set(`${c[0]},${c[1]}`, c);
const has = (x, z) => fp.has(`${x},${z}`);

// Classical Revival limestone: calcite walls, polished andesite base,
// stone brick storey bands, smooth stone roof, tinted glazing.
const WALL = "calcite";
const BASE = "polished_andesite";
const BAND = "stone_bricks";
const ROOF = "smooth_stone";
const FLOOR = "smooth_stone";
const TRIM = "chiseled_stone_bricks";

const STOREY = 4;
const centreX = Math.floor(W / 2);

// Pre-compute the tallest roof in the footprint for penthouse placement
let maxTop = 0;
for (const c of cells) maxTop = Math.max(maxTop, Math.round(c[3]));

for (const [x, z, gr0, rf0] of cells) {
  const gr = Math.max(0, Math.min(H - 6, Math.round(gr0)));
  const top = Math.max(gr + 3, Math.min(H - 4, Math.round(rf0)));

  // 1. Foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faceN = !has(x, z - 1); // street-facing (z-min)
  const faceS = !has(x, z + 1);
  const faceW = !has(x - 1, z);
  const faceE = !has(x + 1, z);
  const ext = faceN || faceS || faceW || faceE;

  const along = (faceN || faceS) ? x : z;
  const isEntranceCell = faceN && x === centreX;
  const isPilasterCell = faceN && (x === centreX - 1 || x === centreX + 1);

  // 2. Walls, slabs, storey lines, windows, entrance
  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    const storeyRow = rel % STOREY;
    const isFloor = storeyRow === 0;
    const winRow = storeyRow === 1 || storeyRow === 2;

    if (isFloor) {
      put(x, y, z, ext ? (rel === 0 ? BASE : BAND) : FLOOR);
      continue;
    }
    if (!ext) continue; // interior air gap

    if (rel === 0) {
      put(x, y, z, BASE);
      continue;
    }

    // Entrance: door in centre bay at ground floor, pilasters flanking, lintel above
    if (faceN && rel <= 3 && (isEntranceCell || isPilasterCell)) {
      if (isEntranceCell && rel === 1) {
        put(x, y, z, "spruce_door", {
          facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (isEntranceCell && rel === 2) {
        put(x, y, z, "spruce_door", {
          facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (isEntranceCell && rel === 3) {
        put(x, y, z, TRIM); // lintel over door
        continue;
      }
      if (isPilasterCell && rel <= 3) {
        put(x, y, z, TRIM); // flanking pilasters
        continue;
      }
    }

    if (winRow) {
      const bay = along % 3 === 1;
      if (bay) {
        put(x, y, z, "glass_pane");
        // Warm light behind some panes
        if (storeyRow === 2 && along % 6 === 1) {
          let ix = x, iz = z;
          if (faceN) iz = z + 1;
          else if (faceS) iz = z - 1;
          else if (faceW) ix = x + 1;
          else if (faceE) ix = x - 1;
          if (has(ix, iz)) put(ix, y, iz, "glowstone");
        }
      } else {
        put(x, y, z, WALL);
      }
    } else {
      // Spandrel / storey band between window rows
      put(x, y, z, WALL);
    }
  }

  // 3. Cornice course below roof on exterior cells
  if (ext && top - 1 > gr) put(x, top - 1, z, BAND);

  // 4. Roof slab
  put(x, top, z, ROOF);

  // 5. Parapet and corner piers
  if (ext) {
    put(x, top + 1, z, WALL);
    const corner = (faceN || faceS) && (faceW || faceE);
    if (corner) put(x, top + 2, z, TRIM);
  }

  // 6. Roof penthouse on the tallest interior cells, stepped back from the parapet
  const isTallest = Math.round(rf0) >= maxTop - 1;
  const interiorRoof = !ext && isTallest && (x + z) % 4 === 0;
  if (interiorRoof && top + 2 < H) {
    put(x, top + 1, z, WALL);
    put(x, top + 2, z, "glass_pane");
  }
}

g.save(`${DIR}/${ID}.nbt`);
