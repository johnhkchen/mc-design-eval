import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339843998";
const W = 8, H = 19, D = 4;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (alongX) => alongX
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// Window cells on the street (front, z=3) and back (z=0) faces, and the short sides.
function isWindow(x, z) {
  const front = z === D - 1, back = z === 0;
  if (front || back) return x >= 1 && x <= W - 2;
  // side walls x=0 / x=W-1: windows on the middle two cells only
  return z >= 1 && z <= D - 2;
}

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const gr = ground.get(`${x},${z}`);
    if (gr === undefined) continue;
    const b = gr;

    // Foundation: solid from y 0 up to this cell's ground.
    for (let y = 0; y <= b; y++) put(x, y, z, "stone_bricks");

    const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    const front = z === D - 1;
    const alongX = z === 0 || z === D - 1;
    const doorCell = front && x === 3;
    const canopyCell = front && (x === 2 || x === 3 || x === 4);

    // Floor slab / storey line between ground storey and upper storey.
    put(x, b + 4, z, edge ? "smooth_stone" : "light_gray_concrete");
    // Roof slab over full footprint.
    put(x, b + 6, z, edge ? "white_concrete" : "light_gray_concrete");

    if (!edge) {
      // Interior air; roof equipment on the back-right roof bay.
      if (x >= 5 && z === 1) put(x, b + 7, z, "iron_block");
      continue;
    }

    // Base course.
    put(x, b + 1, z, "smooth_stone");

    // Ground storey (shopfront): b+2..b+3.
    for (const y of [b + 2, b + 3]) {
      if (doorCell) {
        if (y === b + 2) put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        // y === b+3 above the door is handled by the canopy below
        continue;
      }
      if (canopyCell && y === b + 3) continue; // canopy slab placed separately
      if (isWindow(x, z)) put(x, y, z, "light_blue_stained_glass_pane", paneProps(alongX));
      else put(x, y, z, "white_concrete");
    }

    // Door lower half at street level.
    if (doorCell) put(x, b + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });

    // Canopy above the entrance.
    if (canopyCell) put(x, b + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });

    // Upper storey: b+5 window row.
    if (isWindow(x, z)) put(x, b + 5, z, "light_blue_stained_glass_pane", paneProps(alongX));
    else put(x, b + 5, z, "white_concrete");

    // Parapet above roof line.
    put(x, b + 7, z, "white_concrete");
  }
}

// Warm lights behind the upper windows and in the shopfront.
for (const x of [2, 5]) {
  if (ground.has(`${x},2`)) put(x, ground.get(`${x},2`) + 5, 2, "shroomlight");
}
for (const x of [1, 6]) {
  if (ground.has(`${x},2`)) put(x, ground.get(`${x},2`) + 2, 2, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
