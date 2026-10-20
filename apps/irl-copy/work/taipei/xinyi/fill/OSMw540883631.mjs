import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883631";

const W = 8, H = 23, D = 13;
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const c of raw) ground.set(`${c[0]},${c[1]}`, c[2]);

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const streetFace = z === 0;
  const onZface = (z === 0 || z === D - 1) && x > 0 && x < W - 1;
  const onXface = (x === 0 || x === W - 1) && z > 0 && z < D - 1;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab
  put(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  // Ground storey (gr+1 .. gr+4)
  if (edge) {
    put(x, gr + 1, z, "stone_bricks");
    for (let y = gr + 2; y <= gr + 4; y++) put(x, y, z, "white_concrete");
  } else {
    for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "air");
  }

  // Storey line (floor slab between storeys)
  put(x, gr + 5, z, edge ? "smooth_quartz" : "smooth_stone");

  // Upper storey (gr+6 .. gr+9)
  if (edge) {
    for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "white_concrete");
  } else {
    for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "air");
  }

  // Roof slab / parapet at gr+10 (top of parapet = gr+11)
  put(x, gr + 10, z, edge ? "smooth_quartz" : "smooth_stone");

  if (corner) continue;

  // Street face: shopfront with entrance at x = 2
  if (streetFace && x >= 1 && x <= 6) {
    if (x === 2) {
      put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "glass");
    } else {
      put(x, gr + 1, z, "stone_bricks");
      put(x, gr + 2, z, "glass");
      put(x, gr + 3, z, "glass");
    }
    put(x, gr + 4, z, "smooth_quartz");
    // Upper storey street windows with frame
    if (x % 3 !== 0) {
      put(x, gr + 6, z, "gray_concrete");
      put(x, gr + 7, z, "glass_pane", paneX);
      put(x, gr + 8, z, "glass_pane", paneX);
      put(x, gr + 9, z, "gray_concrete");
    }
    continue;
  }

  // Other perimeter faces: window grid with piers
  if (onZface && x % 3 !== 0) {
    put(x, gr + 2, z, "glass_pane", paneX);
    put(x, gr + 3, z, "glass_pane", paneX);
    put(x, gr + 6, z, "gray_concrete");
    put(x, gr + 7, z, "glass_pane", paneX);
    put(x, gr + 8, z, "glass_pane", paneX);
    put(x, gr + 9, z, "gray_concrete");
  }
  if (onXface && z % 3 !== 0) {
    put(x, gr + 2, z, "glass_pane", paneZ);
    put(x, gr + 3, z, "glass_pane", paneZ);
    put(x, gr + 6, z, "gray_concrete");
    put(x, gr + 7, z, "glass_pane", paneZ);
    put(x, gr + 8, z, "glass_pane", paneZ);
    put(x, gr + 9, z, "gray_concrete");
  }
}

// Warm lights behind some upper-storey street windows
for (const x of [1, 5]) {
  const gr = ground.get(`${x},1`);
  if (gr !== undefined) put(x, gr + 7, 1, "shroomlight");
}
// And on the west face
{
  const gr = ground.get(`1,4`);
  if (gr !== undefined) put(1, gr + 7, 4, "shroomlight");
}

// Rooftop water tank on the interior, two blocks high
for (const x of [2, 3]) {
  for (const z of [4, 5]) {
    const gr = ground.get(`${x},${z}`);
    if (gr === undefined) continue;
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
