import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001619.cells.json`, "utf8"));

// Footprint 5 x 6 cells, 19 blocks tall. Front (street) face is z = 0.
const W = 5, H = 19, D = 6;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) {
  cellMap.set(`${x},${z}`, { ground: Math.round(gr), roofRaw: Math.round(rf) });
}

// Smooth the lidar roof noise into one clean roof level (median of the footprint)
const roofs = [...cellMap.values()].map((c) => c.roofRaw).sort((a, b) => a - b);
const ROOF_LEVEL = roofs[Math.floor(roofs.length / 2)];

const inSet = (x, z) => cellMap.has(`${x},${z}`);
const isBoundary = (x, z) => inSet(x, z) && DIRS.some(([dx, dz]) => !inSet(x + dx, z + dz));

const clampGround = (gr) => Math.max(0, Math.min(gr, H - 8));
const roofFor = (ground) => Math.min(Math.max(ROOF_LEVEL, ground + 3), H - 4);

// Pane connections: connect to neighbouring wall cells in the same face plane.
const paneProps = (x, z) => {
  const c = (dx, dz) => (isBoundary(x + dx, z + dz) ? "true" : "false");
  return { north: c(0, -1), south: c(0, 1), east: c(1, 0), west: c(-1, 0), waterlogged: "false" };
};

// Pass 1: foundations, interior floors, roof decks, walls, windows
for (const [x, z] of [...cellMap.keys()].map((k) => k.split(",").map(Number))) {
  const info = cellMap.get(`${x},${z}`);
  const ground = clampGround(info.ground);
  const roof = roofFor(ground);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  const missing = DIRS.filter(([dx, dz]) => !inSet(x + dx, z + dz));
  const boundary = missing.length > 0;
  const storeys = Math.max(1, Math.floor((roof - ground - 1) / 2));

  if (!boundary) {
    // Interior: floor slab per storey and roof deck, air between (no interiors)
    for (let s = 0; s < storeys; s++) put(x, ground + 2 * s, z, "spruce_planks");
    put(x, roof, z, "gray_concrete");
    continue;
  }

  const corner = missing.some((d) => d[0] !== 0) && missing.some((d) => d[1] !== 0);
  // Inward neighbour that is interior (for lights behind glass)
  const inward = DIRS.find(([dx, dz]) => inSet(x + dx, z + dz) && !isBoundary(x + dx, z + dz));

  for (let y = ground; y <= roof - 1; y++) {
    const rel = y - ground;
    if (y === roof - 1 || rel % 2 === 0) {
      // Pale stone string courses per storey and the cornice at the top
      put(x, y, z, "smooth_stone");
    } else if (!corner) {
      // Window row
      put(x, y, z, "glass_pane", paneProps(x, z));
      // Warm light behind a few panes, in the interior air gap
      if (inward && (x + z + rel) % 5 === 0) {
        put(x + inward[0], y, z + inward[1], "glowstone");
      }
    } else {
      // Corner pilaster: brick
      put(x, y, z, "bricks");
    }
  }

  // Roof deck (tar) and parapet on the boundary
  put(x, roof, z, "gray_concrete");
  put(x, roof + 1, z, "bricks");
}

// Pass 2: entrance door on the front face (z = 0), centre cell, with stone lintel
{
  const info = cellMap.get("2,0");
  if (info) {
    const ground = clampGround(info.ground);
    const roof = roofFor(ground);
    if (roof - 1 > ground + 3) {
      put(2, ground + 1, 0, "dark_oak_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      put(2, ground + 2, 0, "dark_oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      // Stone lintel over the door, in place of the window above it
      put(2, ground + 3, 0, "smooth_stone");
    }
  }
}

// Pass 3: brick chimney on the rear corner
{
  const info = cellMap.get("3,5");
  if (info && isBoundary(3, 5)) {
    const roof = roofFor(clampGround(info.ground));
    for (let y = roof + 1; y <= roof + 3; y++) put(3, y, 5, "bricks");
  }
}

g.save(`${DIR}/NYC3001619.nbt`);
