import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-area commercial block, c. 1990s: two storeys of white-tiled
// concrete over a stone-clad shopfront, with a glazed upper floor, a quartz
// cornice and parapet, and warm lights behind the glass.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw456299349";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 73, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const maxZ = Math.max(...cells.map(([, z]) => z));

// Street door: the south-facing edge cell nearest x = 36.
const southEdge = cells.filter(([x, z]) => z === maxZ && isEdge(x, z));
let doorX = -1;
if (southEdge.length) {
  doorX = southEdge.reduce((best, c) => (Math.abs(c[0] - 36) < Math.abs(best - 36) ? c[0] : best), southEdge[0][0]);
}

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const glassProps = (x, z) =>
  (z === 0 || z === maxZ)
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ed = isEdge(x, z);
  // Along the long facades use x as the bay index; along the ends use z.
  const idx = (z === 0 || z === maxZ) ? x : z;

  if (ed) {
    // Base course / plinth at ground level.
    put(x, gr, z, "stone_bricks");
    // Wall body, two storeys plus cornice and parapet.
    for (let y = gr + 1; y <= gr + 9; y++) put(x, y, z, "white_concrete");
    // Storey line slab at the floor between storeys.
    put(x, gr + 5, z, "smooth_stone");
    // Shopfront bulkhead.
    put(x, gr + 1, z, "stone_bricks");
    // Ground-floor glazing with piers every 6 bays.
    const shopPier = idx % 6 === 0;
    for (let y = gr + 2; y <= gr + 4; y++) {
      if (shopPier) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "glass_pane", glassProps(x, z));
    }
    // Entrance door on the street front.
    if (z === maxZ && x === doorX) {
      put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "light_gray_concrete");
      put(x, gr + 4, z, "light_gray_concrete");
      // Canopy projecting from the storey slab over the entrance.
      put(x, gr + 5, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    } else if (z === maxZ && Math.abs(x - doorX) === 1) {
      put(x, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
    // Upper storey window grid: piers every 3 bays, glass between.
    const upperPier = idx % 3 === 0;
    for (let y = gr + 6; y <= gr + 9; y++) {
      if (upperPier) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "glass_pane", glassProps(x, z));
    }
    // Cornice and parapet cap.
    put(x, gr + 10, z, "smooth_quartz");
    put(x, gr + 11, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Interior: ground slab already placed, storey floor and roof slabs only.
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "smooth_stone");

    // Warm lights just inside the glazing on the upper floor.
    const nearFacade = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
    const innerToFacade = has(x, z - 1) && !isEdge(x, z - 1) === false ||
      has(x, z + 1) && !isEdge(x, z + 1) === false;
    if (nearFacade || innerToFacade) {
      if ((x + z) % 9 === 0) put(x, gr + 7, z, "shroomlight");
      else if ((x + z) % 9 === 4) put(x, gr + 8, z, "glowstone");
    }

    // Hanging lanterns beneath the storey slab, a few bays in.
    if (x % 8 === 4 && z === maxZ - 1) put(x, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });

    // Roof equipment: small plant boxes on the roof slab.
    if (x % 10 === 5 && z === 6) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 11 + 1 > H - 1 ? gr + 11 : gr + 11, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
