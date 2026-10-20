import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300019";
const W = 16, H = 23, D = 21;

// Mid-century (c.1960s-70s) Taipei low-rise commercial block: cream tiled walls,
// stone base, light-grey spandrel bands, glazed shopfront, flat roof with parapet.
const M = {
  found: "stone",
  base: "stone_bricks",
  wall: "white_concrete",
  band: "light_gray_concrete",
  floor: "smooth_stone",
  cap: "stone_bricks",
  shop: "light_blue_stained_glass",
  pane: "light_blue_stained_glass_pane",
  equip: "light_gray_concrete",
  lamp: "glowstone",
};

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...cells.map((c) => c[2]));

const groundMap = new Map();
for (const [x, z, gr] of cells) groundMap.set(`${x},${z}`, gr - minG);
const has = (x, z) => groundMap.has(`${x},${z}`);
const gAt = (x, z) => groundMap.get(`${x},${z}`);

// Outward faces of a cell: a face exists where the neighbour is outside the footprint.
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};
const isPerim = (x, z) => faces(x, z).length > 0;

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: outward-facing south-side cell nearest the middle of the footprint.
const xs = cells.map((c) => c[0]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
let doorCell = null;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!has(x, z + 1)) {
    if (!doorCell || Math.abs(x - cx) < Math.abs(doorCell[0] - cx)) doorCell = [x, z];
  }
}

// Plant/equipment block: 2x2 interior cells nearest the centre of the roof.
const zs = cells.map((c) => c[1]);
const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
const interior = cells
  .map((c) => [c[0], c[1]])
  .filter(([x, z]) => !isPerim(x, z))
  .sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz))
  .slice(0, 4);

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const b = gr - minG; // this cell's ground (building datum)

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, M.found);

  // Floor slabs at each storey datum (interior and perimeter both).
  put(x, b, z, M.floor);
  put(x, b + 5, z, M.floor);
  // Roof deck.
  put(x, b + 10, z, M.floor);

  const f = faces(x, z);
  if (f.length === 0) continue;

  const face = f[0];
  const bay = face === "north" || face === "south" ? x : z;
  const pier = bay % 3 === 0;

  // Base course and spandrels.
  put(x, b, z, M.base);
  put(x, b + 4, z, M.band);
  put(x, b + 5, z, M.band);
  put(x, b + 9, z, M.band);
  // Parapet cap.
  put(x, b + 10, z, M.cap);

  // Ground-floor shopfront: full glass between piers, door at entrance.
  const isDoor = doorCell && x === doorCell[0] && z === doorCell[1];
  for (let y = b + 1; y <= b + 3; y++) {
    if (isDoor) continue;
    if (pier) put(x, y, z, M.wall);
    else put(x, y, z, M.shop);
  }
  if (!isDoor) {
    // Warm lamp in the shopfront interior, behind the glass.
    if (bay % 4 === 1) {
      const [dx, dz] = DIRS[OPP[face]];
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && !isPerim(ix, iz)) put(ix, b + 2, iz, M.lamp);
    }
  }

  // Upper storey: panes in frames, piers between bays.
  for (let y = b + 6; y <= b + 8; y++) {
    if (pier) put(x, y, z, M.wall);
    else {
      put(x, y, z, M.pane, paneProps(face));
    }
  }
  if (bay % 4 === 3) {
    const [dx, dz] = DIRS[OPP[face]];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && !isPerim(ix, iz)) put(ix, b + 7, iz, M.lamp);
  }
}

// Entrance: double-height door (lower and upper halves) facing outward.
if (doorCell) {
  const [x, z] = doorCell;
  const b = gAt(x, z);
  const dp = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  put(x, b + 1, z, "oak_door", dp("lower"));
  put(x, b + 2, z, "oak_door", dp("upper"));
  // Lintel over the door.
  put(x, b + 3, z, M.band);
}

// Roof plant: a small white equipment block, two blocks tall, with a cap.
for (const [x, z] of interior) {
  const b = gAt(x, z);
  put(x, b + 11, z, M.equip);
  put(x, b + 12, z, M.wall);
}

g.save(`${DIR}/${ID}.nbt`);
