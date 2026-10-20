import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, footprint 23x26, roof ~11 blocks above lowest ground.
// Read: a two-storey mid-century concrete commercial block (1970s-80s Taipei):
// light grey concrete frame, stone base, smooth-stone storey bands, glass-pane
// window grids, shopfronts on the ground floor, a flat roof with parapet and a
// small rooftop plant.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw540296198";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 23, H = 23, D = 26;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Outward faces of a footprint cell.
const outsOf = (x, z) =>
  Object.keys(DIRS).filter((n) => {
    const [dx, dz] = DIRS[n];
    return !has(x + dx, z + dz);
  });

const isPerimeter = (x, z) => outsOf(x, z).length > 0;

// Pane connection properties so glass joins along the face.
const paneFor = (n) => {
  const alongX = n === "north" || n === "south";
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
};

// Pass 1: mass, foundation, floors and walls.
for (const [x, z, ground] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  if (!isPerimeter(x, z)) {
    // Interior: floor slabs only, air between (no interiors).
    put(x, ground, z, "smooth_stone");
    put(x, ground + 5, z, "smooth_stone");
    put(x, ground + 10, z, "smooth_stone");
    continue;
  }

  // Perimeter wall: solid concrete, carved below into windows.
  for (let y = ground; y <= ground + 11; y++) put(x, y, z, "light_gray_concrete");

  // Base course, storey bands, cornice, parapet.
  put(x, ground, z, "stone_bricks");
  put(x, ground + 5, z, "smooth_stone");
  put(x, ground + 10, z, "smooth_stone");
  put(x, ground + 11, z, "smooth_stone");
}

// Pass 2: windows, shopfronts, lights on the perimeter.
for (const [x, z, ground] of cells) {
  if (!isPerimeter(x, z)) continue;
  const outs = outsOf(x, z);

  // Corner pillars stay solid concrete.
  if (outs.length >= 2) continue;

  const n = outs[0];
  const [dx, dz] = DIRS[n];
  const along = n === "north" || n === "south" ? x : z;
  const isMullion = along % 3 === 0;
  const inX = x - dx, inZ = z - dz;
  const inwardOpen = has(inX, inZ) && !isPerimeter(inX, inZ);

  // Ground floor: shopfront glass, stone-faced mullions every third cell.
  if (!isMullion) {
    for (let y = ground + 1; y <= ground + 4; y++) {
      put(x, y, z, "glass_pane", paneFor(n));
    }
  }
  // Upper storey: window grid.
  if (!isMullion) {
    for (let y = ground + 6; y <= ground + 8; y++) {
      put(x, y, z, "glass_pane", paneFor(n));
    }
  }

  // Warm light behind some glass.
  if (inwardOpen) {
    if (!isMullion && (x * 7 + z * 3) % 4 === 0) {
      put(inX, ground + 7, inZ, "glowstone");
    }
    if (!isMullion && (x + z) % 5 === 0) {
      put(inX, ground + 2, inZ, "shroomlight");
    }
  }
}

// Pass 3: entrance on the south face, near the middle of its run.
{
  const south = cells
    .filter(([x, z]) => isPerimeter(x, z) && outsOf(x, z).length === 1 && outsOf(x, z)[0] === "south")
    .map(([x, z, gr]) => ({ x, z, gr }))
    .sort((a, b) => a.x - b.x);
  if (south.length > 0) {
    const e = south[Math.floor(south.length / 2)];
    const doorProps = (half) => ({
      facing: "south",
      half,
      hinge: "left",
      open: "false",
      powered: "false",
    });
    put(e.x, e.gr + 1, e.z, "dark_oak_door", doorProps("lower"));
    put(e.x, e.gr + 2, e.z, "dark_oak_door", doorProps("upper"));
    // Lintel over the door, a small canopy-like band of stone.
    put(e.x, e.gr + 3, e.z, "smooth_stone");
    put(e.x - 1, e.gr + 3, e.z, "smooth_stone");
    put(e.x + 1, e.gr + 3, e.z, "smooth_stone");
    // Warm light inside the entrance.
    const inZ = e.z - 1;
    if (has(e.x, inZ)) put(e.x, e.gr + 3, inZ, "lantern");
  }
}

// Pass 4: roof plant on the flat roof, a small 2x2 block with a thin screen.
{
  const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
  for (const [x, z, gr] of cells) {
    if (isPerimeter(x, z)) continue;
    if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1 && (x <= cx) && (z <= cz)) {
      put(x, gr + 11, z, "stone_bricks");
    }
  }
}

g.save(`${dir}/${id}.nbt`);
