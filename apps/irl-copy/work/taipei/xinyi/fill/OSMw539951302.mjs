import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw539951302";
const cells = JSON.parse(readFileSync(BASE + ".cells.json", "utf8"));

// Low-rise Xinyi commercial block, c.1995-2005: two storeys of shopfront and
// office glazing over a stone base, quartz-clad fascias and a parapet, with a
// roof-level plant box. The building is 11 blocks to roof, so it is about two
// 5-block storeys plus a parapet.
const W = 35, H = 23, D = 16;
const ROOF = 11;          // parapet top, the roof line sits at y 10
const V = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(x + "," + z, gr);
const has = (x, z) => ground.has(x + "," + z);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const put = (x, y, z, name, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) V.set(x, y, z, name, props);
  else V.set(x, y, z, name);
};

const paneProps = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: the long north face (missing -z neighbour), centred on x = 17.
const CX = 17;

for (const [x, z, gr] of cells) {
  const miss = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  const edge = miss.length > 0;
  const alongX = miss.some(([, dz]) => dz !== 0);   // wall runs along x
  const idx = alongX ? x : z;
  const inward = miss.length ? [-miss[0][0], -miss[0][1]] : null;
  const doorFace = miss.some(([dx, dz]) => dx === 0 && dz === -1);
  const isDoor = edge && doorFace && Math.abs(x - CX) <= 1;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-level floor slab for interior cells (edge cells are the wall base).
  if (!edge) put(x, gr, z, "smooth_stone");

  // Second-floor slab (interior) and fascia line (edge).
  if (gr <= 5) put(x, 5, z, edge ? "smooth_quartz" : "smooth_stone");

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      if (edge) put(x, y, z, "smooth_quartz");       // parapet
      continue;
    }
    if (y === 10) {                                  // roof deck
      put(x, y, z, edge ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }
    if (y === 5 || !edge) continue;
    if (y === 4) { put(x, y, z, "stone_bricks"); continue; }  // storey line

    if (y <= 3) {
      // Ground-storey shopfront.
      if (isDoor && (y === gr || y === gr + 1) && gr + 1 <= 3) {
        const d = { facing: "north", hinge: "left", open: "false", powered: "false" };
        put(x, y, z, "dark_oak_door", { ...d, half: y === gr ? "lower" : "upper" });
      } else if (y === 3) {
        if (isDoor) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        else put(x, y, z, "smooth_quartz");           // sign band
      } else if (idx % 4 === 0) {
        put(x, y, z, "polished_andesite");           // shopfront pilaster
      } else {
        put(x, y, z, "glass_pane", paneProps(alongX));
      }
    } else if (y >= 6 && y <= 9) {
      // Upper office storey: glazed bays between white pilasters.
      if (y === 9) { put(x, y, z, "white_concrete"); continue; }
      if (idx % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "glass_pane", paneProps(alongX));
    }
  }

  // Warm lamps standing on the floor slab directly behind selected upper windows.
  if (edge && inward && idx % 6 === 2 && idx % 3 !== 0 && has(x + inward[0], z + inward[1])) {
    const ix = x + inward[0], iz = z + inward[1];
    if (!ground.has(ix + "," + iz) || ground.get(ix + "," + iz) <= 6) {
      put(ix, 6, iz, "glowstone");
    }
  }
}

// Plant box on the roof, set back from the parapet.
for (let x = 12; x <= 22; x++) {
  for (let z = 4; z <= 11; z++) {
    if (!has(x, z)) continue;
    const isEdge = DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
    if (isEdge) continue;
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
  }
}

V.save(BASE + ".nbt");
