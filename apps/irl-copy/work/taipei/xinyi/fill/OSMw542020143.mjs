import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw542020143";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Footprint 12 x 8. Roof ~11 blocks above lowest ground: two storeys of ~5 blocks,
// a quartz string course at each floor line, and a parapet on top.
// Era read: 1980s Taipei commercial block, pale tiled facade, dark shopfront,
// blue-tinted glazing, flat concrete roof with plant on top.
const W = 12, H = 23, D = 8;
const ROOF_DECK = 10;   // top of second storey / roof slab
const PARAPET = 11;     // parapet course on the edge
const FLOOR2 = 5;       // second-floor slab and string course

const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

let minG = Infinity;
for (const c of cells) minG = Math.min(minG, c[2]);

const key = (x, z) => `${x},${z}`;
const onFoot = new Set(cells.map(([x, z]) => key(x, z)));
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), gr - minG);

const isEdge = (x, z) =>
  !onFoot.has(key(x + 1, z)) || !onFoot.has(key(x - 1, z)) ||
  !onFoot.has(key(x, z + 1)) || !onFoot.has(key(x, z - 1));

// Door sits on the z=0 frontage, centred on the 12-block width.
const DOOR_X = 5;

for (const [x, z] of cells) {
  const gy = groundOf.get(key(x, z));
  const edge = isEdge(x, z);
  const t = x + z; // bay index along whichever wall this cell lies on

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / floor.
  put(x, gy, z, "smooth_stone");

  // Floor slab at the second storey line (interior) or string course (edge).
  if (FLOOR2 > gy) put(x, FLOOR2, z, edge ? "quartz_block" : "smooth_stone");

  // Roof deck at the top of the second storey.
  if (ROOF_DECK > gy) put(x, ROOF_DECK, z, edge ? "quartz_block" : "smooth_stone");

  if (!edge) {
    // Interior rooftop plant on the deck: two air-handling units and a tank.
    if (x >= 4 && x <= 7 && z >= 2 && z <= 5 && ROOF_DECK > gy) {
      if (x <= 5 && z <= 3) put(x, PARAPET, z, "iron_block");
      if (x >= 6 && z >= 4) put(x, PARAPET, z, "light_gray_concrete");
    }
    continue;
  }

  // ---- Edge cell: facade ----

  // Parapet on the perimeter.
  put(x, PARAPET, z, "stone_brick_wall", { up: "true" });

  // Ground storey: shopfront, glazing with dark frames, door on the frontage.
  for (let y = gy + 1; y <= 4; y++) {
    if (y <= gy) continue;
    const isDoorCell = z === 0 && x === DOOR_X;
    if (isDoorCell && y <= gy + 2) {
      // Entrance door, lower and upper halves; the canopy is the lintel above.
      put(x, y, z, "dark_oak_door", {
        facing: "south",
        half: y === gy + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isDoorCell) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (t % 3 === 0) {
      put(x, y, z, "dark_oak_planks");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }

  // Canopy/lintel over the entrance and the shopfront transom at y=4.
  if (4 > gy) {
    if (z === 0 && x >= DOOR_X - 1 && x <= DOOR_X + 1) {
      put(x, 4, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    } else {
      put(x, 4, z, "dark_oak_planks");
    }
  }

  // Upper storey: sill, glazed panes with white mullions, lintel.
  for (let y = 6; y <= 9; y++) {
    if (y <= gy) continue;
    if (y === 6 || y === 9) {
      put(x, y, z, "white_concrete");
      continue;
    }
    // y = 7, 8: window band
    if (t % 3 === 0) {
      put(x, y, z, "white_concrete");
    } else if (y === 8 && t % 6 === 4) {
      // Warm-lit windows: glowstone as a lit window in the glazing band.
      put(x, y, z, "glowstone");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
