import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1334986657";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 7, H = 19, D = 4;
const g = new Voxels([W, H, D]);

// footprint lookup: key "x,z" -> ground (y of the cell's foundation top)
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(11, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const GLASS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const CAP = { type: "top", waterlogged: "false" };
const LANTERN = { hanging: "true", waterlogged: "false" };

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to the cell's ground, floor slab on top.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");

  // Roof deck over every cell at the top of the 5-block storey.
  put(x, gr + 5, z, "light_gray_concrete");

  if (!isEdge(x, z)) {
    // Interior cells: air above the floor; roof equipment on the deck.
    if ((x === 2 && z === 1) || (x === 4 && z === 2)) {
      put(x, gr + 6, z, "iron_block");
    }
    continue;
  }

  const frontFace = z === 0;               // street-facing long face
  const entrance = frontFace && x === 3;   // single entrance, centred on the front
  const pier = x % 2 === 0;                // structural bays: even x are piers

  // Base course.
  put(x, gr + 1, z, entrance ? "air" : "polished_andesite");

  // Shopfront band (ground floor).
  if (entrance) {
    put(x, gr + 2, z, "air");
    put(x, gr + 3, z, "glass_pane", GLASS);       // transom
    put(x, gr + 4, z, "lantern", LANTERN);        // warm light over the door
  } else {
    put(x, gr + 2, z, pier ? "white_concrete" : "glass_pane", pier ? undefined : GLASS);
    // Upper storey window band.
    put(x, gr + 3, z, pier ? "white_concrete" : "glass_pane", pier ? undefined : GLASS);
    put(x, gr + 4, z, pier ? "white_concrete" : "glass_pane", pier ? undefined : GLASS);
  }

  // Parapet and cornice cap.
  put(x, gr + 6, z, "white_concrete");
  put(x, gr + 7, z, "stone_brick_slab", CAP);
}

g.save(`${dir}/${id}.nbt`);
