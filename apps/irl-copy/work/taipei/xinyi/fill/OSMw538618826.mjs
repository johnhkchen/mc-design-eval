import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618826";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// footprint lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// exterior faces of a cell: where the neighbour is missing from the footprint
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faces = (x, z) => Object.keys(DIRS).filter(k => {
  const [dx, dz] = DIRS[k];
  return !has(x + dx, z + dz);
});
const isPerim = (x, z) => faces(x, z).length > 0;

const glassProps = (face) => {
  // a pane on a N/S wall runs east-west; on an E/W wall it runs north-south
  const ew = face === "N" || face === "S";
  return {
    north: ew ? "false" : "true",
    south: ew ? "false" : "true",
    east: ew ? "true" : "false",
    west: ew ? "true" : "false",
    waterlogged: "false",
  };
};

// find the front entrance: north face, centred (x = 2) if present
let door = null;
for (const [x, z] of cells) {
  if (faces(x, z).includes("N") && (x === 2 || door === null)) {
    if (door === null || x === 2) door = { x, z };
  }
}

for (const [x, z, gr] of cells) {
  const fs = faces(x, z);
  const perim = fs.length > 0;
  const corner = fs.length >= 2;
  const primary = fs[0];
  const u = primary === "N" || primary === "S" ? x : z;
  const len = primary === "N" || primary === "S" ? W : D;
  const bayWindow = !corner && u % 2 === 1 && u !== 0 && u !== len - 1;
  const isDoor = door && door.x === x && door.z === z;

  // foundation below the cell ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // ground slab / base course
  put(x, gr, z, perim ? "polished_andesite" : "light_gray_concrete");

  // storey 1 (shopfront): bulkhead, glass, piers
  if (perim) {
    if (corner || !bayWindow) {
      for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "white_concrete");
    } else {
      put(x, gr + 1, z, "smooth_stone");
      for (let y = gr + 2; y <= gr + 4; y++)
        put(x, y, z, "glass_pane", glassProps(primary));
    }
    if (isDoor) {
      const dp = { facing: "north", hinge: "left", open: "false", powered: "false" };
      put(x, gr + 1, z, "dark_oak_door", { ...dp, half: "lower" });
      put(x, gr + 2, z, "dark_oak_door", { ...dp, half: "upper" });
      put(x, gr + 3, z, "white_concrete");
      put(x, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }

  // storey line / floor slab between storeys
  put(x, gr + 5, z, "white_concrete");

  // storey 2: sills, glass, lintels, piers
  if (perim) {
    if (corner || !bayWindow) {
      for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "white_concrete");
    } else {
      put(x, gr + 6, z, "white_concrete");
      for (let y = gr + 7; y <= gr + 8; y++)
        put(x, y, z, "glass_pane", glassProps(primary));
      put(x, gr + 9, z, "white_concrete");
    }
  }

  // roof slab and parapet
  put(x, gr + 10, z, perim ? "white_concrete" : "gray_concrete");
  if (perim) put(x, gr + 11, z, "white_concrete");

  // warm light behind some windows (interior air cell just inside the glass)
  if (perim && bayWindow && !isDoor && primary) {
    const [dx, dz] = DIRS[primary];
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && !isPerim(ix, iz)) {
      if (u % 4 === 1) put(ix, gr + 7, iz, "shroomlight");
      else put(ix, gr + 2, iz, "glowstone");
    }
  }

  // rooftop plant boxes on interior roof cells
  if (!perim && (x + z) % 3 === 0) put(x, gr + 11, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
