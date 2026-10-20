import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608935";
const W = 26, H = 23, D = 20;

// Record: no name. Lidar roof ~11 blocks above lowest ground, 26 x 20 footprint.
// Read as a 2-storey commercial block, c. 1990s-2000s Xinyi: white tiled
// concrete walls, a stone cornice band at each storey line, a plinth, a parapet,
// tinted glass bays between white piers, a dark-timber entrance, and rooftop
// plant boxes. Two storeys of 5 blocks plus the parapet make 11 blocks.

const RAW = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of RAW) {
  const x = Math.round(c[0]), z = Math.round(c[1]), gr = Math.round(c[2]);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, gr);
}
const minG = Math.min(...ground.values());
// Ground relative to the lowest cell; clamped so the roof stays inside the grid.
const relG = (x, z) => Math.min(10, ground.get(`${x},${z}`) - minG);
const inside = (x, z) => ground.has(`${x},${z}`);

// Face directions. inward = the facing a door or block on that face points to.
const FACES = [
  { name: "north", dx: 0, dz: -1, inward: "south", axis: "z" },
  { name: "south", dx: 0, dz: 1, inward: "north", axis: "z" },
  { name: "west", dx: -1, dz: 0, inward: "east", axis: "x" },
  { name: "east", dx: 1, dz: 0, inward: "west", axis: "x" },
];
const exteriorFaces = (x, z) => FACES.filter(f => !inside(x + f.dx, z + f.dz));
const isBoundary = (x, z) => exteriorFaces(x, z).length > 0;

// Everything is collected in a map first so later passes can override earlier ones.
const blocks = new Map();
const put = (x, y, z, id, props, pane = false) =>
  blocks.set(`${x},${y},${z}`, { x, y, z, id, props, pane });
const has = (x, y, z) => blocks.has(`${x},${y},${z}`);

// Pass 1: foundation, floor decks, walls, cornice, parapet, windows.
const cellList = [...ground.keys()].map(k => k.split(",").map(Number));

for (const [x, z] of cellList) {
  const g = relG(x, z);
  const bnd = isBoundary(x, z);

  // Foundation, from y 0 up to this cell's ground.
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  // Floor decks: ground floor, storey 2, roof.
  put(x, g, z, "smooth_stone");
  put(x, g + 5, z, "smooth_stone");
  put(x, g + 10, z, bnd ? "smooth_stone" : "gray_concrete");

  if (!bnd) continue;

  // Exterior wall column: plinth, two storeys of white tile, cornice, parapet.
  for (let y = g + 1; y <= g + 4; y++) put(x, y, z, "white_concrete");
  put(x, g + 1, z, "polished_andesite");
  for (let y = g + 6; y <= g + 9; y++) put(x, y, z, "white_concrete");
  put(x, g + 10, z, "smooth_stone");
  put(x, g + 11, z, "white_concrete");

  // Window bays on each exterior face. Corners and every third cell are piers.
  const faces = exteriorFaces(x, z);
  for (const f of faces) {
    const along = f.axis === "z" ? x : z;
    const corner = faces.length > 1;
    const pier = corner || along % 3 === 0;
    if (pier) continue;
    for (let y = g + 2; y <= g + 4; y++) put(x, y, z, "light_blue_stained_glass_pane", null, true);
    for (let y = g + 6; y <= g + 9; y++) put(x, y, z, "light_blue_stained_glass_pane", null, true);
  }
}

// Pass 2: entrance on the north (low-z) street face, nearest the middle.
let door = null;
const northCells = cellList
  .filter(([x, z]) => exteriorFaces(x, z).length === 1 && exteriorFaces(x, z)[0].name === "north")
  .sort((a, b) => Math.abs(a[0] - 13) - Math.abs(b[0] - 13));
if (northCells.length) door = { x: northCells[0][0], z: northCells[0][1], f: FACES[0] };
if (door) {
  const { x, z, f } = door;
  const g = relG(x, z);
  const doorProps = (half) => ({ facing: f.inward, half, hinge: "left", open: "false", powered: "false" });
  put(x, g + 1, z, "dark_oak_door", doorProps("lower"));
  put(x, g + 2, z, "dark_oak_door", doorProps("upper"));
  put(x, g + 3, z, "white_concrete");
  put(x, g + 4, z, "white_concrete");
  // Dark timber surround either side of the door at street level.
  const along = [[x - 1, z], [x + 1, z]];
  for (const [ax, az] of along) {
    if (!inside(ax, az) || !isBoundary(ax, az)) continue;
    const ag = relG(ax, az);
    put(ax, ag + 1, az, "dark_oak_planks");
  }
}

// Pass 3: warm light in the air gap behind some glass.
for (const [x, z] of cellList) {
  if (!isBoundary(x, z)) continue;
  const g = relG(x, z);
  for (const f of exteriorFaces(x, z)) {
    const along = f.axis === "z" ? x : z;
    if (along % 3 === 0) continue;
    const ix = x - f.dx, iz = z - f.dz;
    if (!inside(ix, iz) || isBoundary(ix, iz) || relG(ix, iz) !== g) continue;
    if (along % 6 === 1) put(ix, g + 3, iz, "shroomlight");
    else if (along % 6 === 4) put(ix, g + 8, iz, "shroomlight");
  }
}

// Pass 4: roof plant on the roof deck of interior cells.
for (const [x, z] of cellList) {
  if (isBoundary(x, z)) continue;
  const g = relG(x, z);
  if (g > 9) continue;
  if (x >= 5 && x <= 9 && z >= 4 && z <= 6) {
    put(x, g + 11, z, "light_gray_concrete");
    if (x === 7 && z === 5) put(x, g + 12, z, "iron_block");
  }
  if (x >= 16 && x <= 18 && z >= 12 && z <= 14) {
    put(x, g + 11, z, "smooth_stone");
  }
}

// Flush to the Voxels grid. Panes take their connections from the blocks around them.
const g = new Voxels([W, H, D]);
for (const b of blocks.values()) {
  if (b.pane) {
    const props = {
      north: has(b.x, b.y, b.z - 1) ? "true" : "false",
      south: has(b.x, b.y, b.z + 1) ? "true" : "false",
      east: has(b.x + 1, b.y, b.z) ? "true" : "false",
      west: has(b.x - 1, b.y, b.z) ? "true" : "false",
      waterlogged: "false",
    };
    g.set(b.x, b.y, b.z, b.id, props);
  } else if (b.props) {
    g.set(b.x, b.y, b.z, b.id, b.props);
  } else {
    g.set(b.x, b.y, b.z, b.id);
  }
}

g.save(`${DIR}/${ID}.nbt`);
