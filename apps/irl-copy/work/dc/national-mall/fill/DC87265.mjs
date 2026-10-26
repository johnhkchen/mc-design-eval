import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1610 H St NW, Washington DC. Early-20th-century Beaux-Arts commercial block:
// pale stone piers and bands, granite base, shopfront at grade with a framed
// entrance, six storeys (about 3 blocks each) under a parapet with a cornice,
// and a skylit roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87265.cells.json`, "utf8"));

const W = 7, D = 10, HMAX = 30;
const g = new Voxels([W, HMAX, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= HMAX || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Index footprint cells.
const cellMap = new Map();
const key = (x, z) => `${x},${z}`;
const roofs = [];
for (const c of cells) {
  const [x, z, gr, rf] = c;
  const ground = Math.max(0, Math.round(gr));
  const roof = Number.isFinite(rf) ? Math.round(rf) : 18;
  cellMap.set(key(x, z), { ground, roof });
  roofs.push(roof);
}

// Lidar roof smoothed into one flat parapet tier for this block.
roofs.sort((a, b) => a - b);
const T = roofs.length ? roofs[Math.floor(roofs.length / 2)] : 18;

for (const [k, { ground: gr }] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const edgeFront = !cellMap.has(key(x, z - 1)); // z = 0 face, street side
  const edgeBack = !cellMap.has(key(x, z + 1));
  const edgeWest = !cellMap.has(key(x - 1, z));
  const edgeEast = !cellMap.has(key(x + 1, z));
  const perim = edgeFront || edgeBack || edgeWest || edgeEast;
  const frontBack = edgeFront || edgeBack;

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) {
    put(x, y, z, y === 0 && perim ? "polished_granite" : "stone_bricks");
  }

  for (let y = gr; y <= T + 1; y++) {
    if (perim) {
      if (y === 0) { put(x, y, z, "polished_granite"); continue; }

      // Parapet and roof edge.
      if (y >= T) {
        if (y === T + 1) put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        else put(x, y, z, "calcite");
        continue;
      }
      // Cornice: a single clean projecting-looking band, no stray corbels.
      if (y === T - 1) { put(x, y, z, "polished_andesite"); continue; }
      if (y === T - 2) { put(x, y, z, "calcite"); continue; }

      const r = y % 3;
      // Storey lines: a thin stone course rather than a heavy band.
      if (r === 0) {
        put(x, y, z, edgeFront && y === 0 ? "polished_granite" : "polished_andesite");
        continue;
      }

      const bay = frontBack ? x : z;
      const windowBay = bay % 2 === 1;

      if (y < 3 && edgeFront) {
        // Ground-floor street front: stone frame around a glazed shopfront,
        // central entrance with a stone surround.
        if (x === 3 && r === 1) {
          put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        } else if (x === 3 && r === 2) {
          put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        } else if (x === 2 || x === 4) {
          put(x, y, z, "stone_bricks");
        } else if (x === 1 || x === 5) {
          put(x, y, z, "glass_pane");
        } else {
          put(x, y, z, "stone_bricks");
        }
        continue;
      }

      if (windowBay) {
        put(x, y, z, "glass_pane");
      } else {
        put(x, y, z, "calcite");
      }
    } else {
      // Interior: floor slabs per storey, roof deck, skylight, light behind glass.
      if (y === T - 1) {
        const sky = x >= 2 && x <= 4 && z >= 4 && z <= 5;
        put(x, y, z, sky ? "glass" : "stone_bricks");
        continue;
      }
      if (y % 3 === 0 && y < T - 1) { put(x, y, z, "stone_bricks"); continue; }
      // Warm light in the air gap behind front-window glass.
      if (z === 1 && y % 3 === 1 && x % 2 === 1 && y < T - 1) {
        const warm = (x + Math.floor(y / 3)) % 2 === 0;
        if (warm) put(x, y, z, "shroomlight");
        else if ((x + y) % 3 === 0) put(x, y, z, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/DC87265.nbt`);
