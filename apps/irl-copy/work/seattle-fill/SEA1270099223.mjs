// SEA1270099223: a small campus kiosk / restroom / utility pavilion at Seattle Center.
// Footprint = the 41 cells from the space-needle manifest, local (0,0) = box corner (194,57).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "SEA1270099223";
const here = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill";
const manifest = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const b = manifest.buildings.find((q) => q.id === ID);
const [X0, Z0] = [194, 57];
const W = 8, D = 6, H = 11;                       // box size 8 x 6, heightBlocks 5 + ~6
const F = new Set(b.footprint.map(([x, z]) => `${x - X0},${z - Z0}`));
const inF = (x, z) => F.has(`${x},${z}`);
const cells = [...F].map((k) => k.split(",").map(Number));
const exposed = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inF(x + dx, z + dz));
const perim = new Set(cells.filter(([x, z]) => exposed(x, z)).map(([x, z]) => `${x},${z}`));
const isPerim = (x, z) => perim.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// 1. Plinth: stone_bricks, solid y0-1 under the whole footprint (floor at y1)
for (const [x, z] of cells) { put(x, 0, z, "stone_bricks"); put(x, 1, z, "stone_bricks"); }

// 2. Walls y2-y4 on the perimeter. Smooth sandstone; piers every third cell; glass band at y3.
const DOOR = [2, 5];                              // south face door, lower half y2, upper y3
const HATCH = [0, 2];                             // west serving hatch at z=2 (y2-3 open)
const CHIMNEY = [6, 1];
const doorKey = `${DOOR[0]},${DOOR[1]}`, hatchKey = `${HATCH[0]},${HATCH[1]}`;
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  const key = `${x},${z}`;
  const pier = (x + z) % 3 === 0;
  if (key === doorKey) {
    put(x, 2, z, "spruce_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, "spruce_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 4, z, "smooth_sandstone");
    continue;
  }
  put(x, 2, z, "smooth_sandstone");               // window sill course
  if (key === hatchKey) {                         // serving hatch: open at y2-3
    put(x, 4, z, "smooth_sandstone");
    continue;
  }
  put(x, 3, z, pier ? "smooth_sandstone" : "glass_pane");   // glass band, piers as mullions
  put(x, 4, z, "smooth_sandstone");               // lintel course
}

// 3. Serving window: awning of red/blue wool stripes over the hatch; interior counter behind it
for (const [z, c] of [[1, "red_wool"], [2, "blue_wool"], [3, "red_wool"]]) put(0, 4, z, c);
for (const z of [2, 3]) put(1, 2, z, "smooth_stone");
put(1, 2, 2, "smooth_stone");

// 4. Roof: white_concrete deck at y5 over the footprint, stone_brick_slab rim on the perimeter
for (const [x, z] of cells) {
  if (isPerim(x, z)) put(x, 5, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  else put(x, 5, z, "white_concrete");
}

// 5. Small vent chimney rising from the roof deck, capped with a slab
put(CHIMNEY[0], 5, CHIMNEY[1], "stone_bricks");
put(CHIMNEY[0], 6, CHIMNEY[1], "stone_bricks");
put(CHIMNEY[0], 7, CHIMNEY[1], "stone_brick_wall", { north: "none", south: "none", east: "none", west: "none", up: "true", waterlogged: "false" });
put(CHIMNEY[0], 8, CHIMNEY[1], "stone_brick_slab", { type: "bottom", waterlogged: "false" });

// 6. Glass pane connection states: connect to neighbours that are solid or glass on the same row
const solidAt = (x, y, z) => { const c = g.get(x, y, z); return !!c && c.block !== "air"; };
const paneDir = (x, y, z) => ({
  north: solidAt(x, y, z - 1) ? "true" : "false",
  south: solidAt(x, y, z + 1) ? "true" : "false",
  east: solidAt(x + 1, y, z) ? "true" : "false",
  west: solidAt(x - 1, y, z) ? "true" : "false",
  waterlogged: "false",
});
for (const [x, z] of cells) {
  const c = g.get(x, 3, z);
  if (c && c.block === "glass_pane") put(x, 3, z, "glass_pane", paneDir(x, 3, z));
}

g.save(`${here}/${ID}.nbt`);
console.log(`${ID}: size [${W},${H},${D}], blocks ${g.count()}, footprint ${cells.length}, walls ${perim.size}`);
