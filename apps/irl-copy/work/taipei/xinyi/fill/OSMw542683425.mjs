import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey Xinyi-district shophouse-style commercial block (1970s-80s Taipei):
// stone-base shopfronts with glass and quartz pillars at ground, a quartz storey line,
// white-concrete window bays with glass panes and warm shroomlight behind some windows,
// stone cornice, parapet, and a small roof plant box. Roof stands at y = 11.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542683425";
const W = 25, H = 23, D = 13;

const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const ROOF_Y = 10;     // roof slab top course
const PARAPET_Y = 11;  // parapet course (roof top at 11)
const FLOOR_Y = 5;     // second-floor slab / storey line
const LINTEL_Y = 4;    // ground-floor lintel band

for (const [x, z, grRaw] of cells) {
  const gy = Math.round(grRaw);

  const edgeN = !has(x, z - 1);
  const edgeS = !has(x, z + 1);
  const edgeW = !has(x - 1, z);
  const edgeE = !has(x + 1, z);
  const isEdge = edgeN || edgeS || edgeW || edgeE;
  const isCorner = (edgeN || edgeS) && (edgeW || edgeE);
  const alongX = edgeN || edgeS;               // facade runs along x
  const col = alongX ? x : z;                  // position along facade
  const isDoorCol = alongX && x === 12;
  const pillarCol = isCorner || col % 4 === 0;

  // inward neighbour (for light sources behind glass)
  let ix = x, iz = z;
  if (edgeN) iz = z + 1;
  else if (edgeS) iz = z - 1;
  else if (edgeW) ix = x + 1;
  else if (edgeE) ix = x - 1;
  const inwardOk = has(ix, iz);

  // foundation up to ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // interior floor / storey slabs (air gap otherwise)
  for (let y = gy; y <= ROOF_Y; y++) {
    if (y === gy) put(x, y, z, "smooth_stone");
    else if (y === FLOOR_Y) put(x, y, z, "smooth_quartz");
    else if (y === ROOF_Y) put(x, y, z, "smooth_stone");
  }

  if (!isEdge) continue;

  // facade, bottom to top
  for (let y = gy; y <= ROOF_Y; y++) {
    if (y === gy) {
      put(x, y, z, "stone_bricks");                       // base course
    } else if (y <= 3) {
      // ground storey shopfront
      if (isDoorCol && (edgeN || edgeS) && y <= gy + 2 && y >= gy + 1 && gy + 2 <= 3) {
        const facing = edgeN ? "north" : "south";
        const half = y === gy + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
      } else if (pillarCol) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "glass_pane");
        if (col % 8 === 2 && inwardOk && y === gy + 1) put(ix, y, iz, "glowstone");
      }
    } else if (y === LINTEL_Y) {
      put(x, y, z, pillarCol ? "smooth_quartz" : "stone_bricks");
    } else if (y === FLOOR_Y) {
      put(x, y, z, "smooth_quartz");                       // storey line
    } else if (y >= 6 && y <= 9) {
      if (y === 6 || y === 9) {
        put(x, y, z, "white_concrete");                    // head / sill bands
      } else if (pillarCol || col % 3 === 0) {
        put(x, y, z, "white_concrete");                    // mullions
      } else {
        put(x, y, z, "glass_pane");
        if (col % 6 === 1 && inwardOk && y === 7) put(ix, y, iz, "shroomlight");
      }
    } else if (y === ROOF_Y) {
      put(x, y, z, "stone_bricks");                        // cornice
    } else if (y === PARAPET_Y) {
      put(x, y, z, "stone_brick_wall");                    // parapet
    }
  }
}

// roof plant box, set back from the parapet
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (x >= 9 && x <= 15 && z >= 4 && z <= 8 && has(x, z)) {
    const isEdge = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
    if (isEdge) continue;
    put(x, PARAPET_Y, z, "light_gray_concrete");
    put(x, PARAPET_Y + 1, z, "light_gray_concrete");
  }
}
put(12, 13, 6, "lantern", { hanging: "false" });

g.save(`${dir}/${id}.nbt`);
