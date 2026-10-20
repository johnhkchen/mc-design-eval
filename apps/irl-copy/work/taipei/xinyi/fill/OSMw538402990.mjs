import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538402990";
const W = 29, H = 23, D = 13;

// Footprint cells: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const inside = (x, z) => ground.has(`${x},${z}`);

// Outward face of a footprint cell (null = interior cell)
function faceOf(x, z) {
  if (!inside(x, z - 1)) return "north";
  if (!inside(x, z + 1)) return "south";
  if (!inside(x - 1, z)) return "west";
  if (!inside(x + 1, z)) return "east";
  return null;
}
// Inward offset for a face
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: middle of the south (street) face, falling back to north
let entranceFace = "south";
let southXs = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (faceOf(x, z) === "south") southXs.push(x);
}
if (southXs.length === 0) {
  entranceFace = "north";
  for (const [x, z] of cells) if (faceOf(x, z) === "north") southXs.push(x);
}
southXs.sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;

// Pane connection props depend on which wall the pane sits in
function paneProps(face) {
  const ew = face === "north" || face === "south"; // wall runs along x
  return {
    north: ew ? "false" : "true",
    south: ew ? "false" : "true",
    east: ew ? "true" : "false",
    west: ew ? "true" : "false",
    waterlogged: "false",
  };
}

for (const [x, z, gr] of cells) {
  const f = faceOf(x, z);
  const per = f !== null;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course / floors / roof surface
  put(x, gr, z, per ? "polished_granite" : "smooth_stone");
  put(x, gr + 5, z, per ? "light_gray_concrete" : "smooth_stone");   // storey line
  if (per) {
    put(x, gr + 10, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // cornice
    put(x, gr + 11, z, "stone_bricks");                                          // parapet
  } else {
    put(x, gr + 10, z, "smooth_stone");                                          // roof
  }

  if (!per) {
    // Rooftop plant boxes on interior roof cells
    if (x % 9 === 4 && z % 5 === 2) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    }
    continue;
  }

  // Along-face index
  const u = (f === "north" || f === "south") ? x : z;
  const pier = u % 4 === 0;
  const isEntrance = f === entranceFace && x === doorX;
  const pp = paneProps(f);
  const [ix, iz] = INWARD[f];
  const innerOK = (() => {
    const ax = x + ix, az = z + iz;
    return inside(ax, az) && faceOf(ax, az) === null;
  })();

  // Ground storey: shopfront, piers, entrance
  if (isEntrance) {
    const doorFacing = f === "south" ? "south" : "north";
    put(x, gr + 1, z, "oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "stone_bricks");
    put(x, gr + 4, z, "stone_bricks");
  } else if (pier) {
    for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "stone_bricks");
  } else {
    for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "glass_pane", pp);
    put(x, gr + 4, z, "stone_bricks"); // shopfront lintel
    // warm glow behind some shopfront glass
    if (innerOK && u % 8 === 6) put(x + ix, gr + 2, z + iz, "glowstone");
  }

  // Upper storey: window grid with frames
  for (let y = gr + 6; y <= gr + 9; y++) {
    if (pier) {
      put(x, y, z, "white_concrete");
    } else if (y === gr + 6 || y === gr + 9) {
      put(x, y, z, "white_concrete"); // sill and head
    } else {
      put(x, y, z, "glass_pane", pp);
    }
  }
  // Warm lights behind some upper windows
  if (!pier && innerOK && u % 8 === 2) {
    put(x + ix, gr + 7, z + iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
