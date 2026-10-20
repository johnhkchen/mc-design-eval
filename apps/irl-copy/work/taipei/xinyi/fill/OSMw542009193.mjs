import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542009193";
const W = 10, H = 23, D = 4;

// Footprint: [x, z, ground] per cell. Record gives roof ~11 blocks above lowest ground:
// two storeys of ~5 blocks, a roof slab, and a 1-block parapet.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  const xi = Math.round(x), zi = Math.round(z);
  if (xi < 0 || xi >= W || zi < 0 || zi >= D) continue;
  ground.set(`${xi},${zi}`, Math.max(0, Math.min(H - 12, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneFor = (frontX) => frontX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ext = {
    n: !has(x, z - 1), // street side (z = 0 edge)
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
  const edge = ext.n || ext.s || ext.w || ext.e;
  const corner = (ext.n || ext.s) && (ext.w || ext.e);
  const frontX = ext.n || ext.s;           // wall runs along x
  const along = frontX ? x : z;            // index along the wall
  const street = ext.n;                    // the main frontage
  const door = street && x === 4;

  // Base course / ground floor slab.
  put(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  // Storey 1: shopfront ground floor (y gr+1 .. gr+4).
  if (edge) {
    if (corner) {
      for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "white_concrete");
    } else if (door) {
      put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "light_blue_stained_glass");
      put(x, gr + 4, z, "smooth_quartz");
    } else {
      put(x, gr + 1, z, "smooth_quartz");
      put(x, gr + 2, z, "light_blue_stained_glass");
      put(x, gr + 3, z, "light_blue_stained_glass");
      put(x, gr + 4, z, "smooth_quartz");
    }
  } else {
    // Interior: air, with a warm lantern behind the street-side glass.
    if (z === 1 && x % 3 === 2) put(x, gr + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  }

  // String course between storeys.
  put(x, gr + 5, z, edge ? "smooth_quartz" : "smooth_stone");

  // Storey 2: window grid with white concrete mullions (y gr+6 .. gr+9).
  if (edge) {
    for (let y = gr + 6; y <= gr + 9; y++) {
      if (corner || y === gr + 6 || y === gr + 9 || along % 2 === 0) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneFor(frontX));
      }
    }
  } else {
    // Interior lights behind the upper windows.
    if (z === 2 && x % 3 === 0) put(x, gr + 7, z, "shroomlight");
  }

  // Roof slab / cornice at gr+10.
  put(x, gr + 10, z, edge ? "smooth_quartz" : "gray_concrete");

  // Parapet cap at gr+11, exterior only; a rooftop unit inside.
  if (edge) {
    put(x, gr + 11, z, "white_concrete");
  } else if (x === 2 && z === 1) {
    put(x, gr + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
