import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280258";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 8 x 21 footprint, roof ~21 blocks above lowest ground: a four-storey
// 1980s-90s Xinyi mid-rise with a white tiled facade, light grey spandrels,
// a glazed shopfront and a parapet.
const W = 8, H = 33, D = 21;
const FLOOR = 5, STOREYS = 4, ROOF = 20; // roof deck at +20, parapet at +21
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const set = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => set.has(key(x, z));
const FACES = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const FACING = { "-1,0": "west", "1,0": "east", "0,-1": "north", "0,1": "south" };

function put(x, y, z, b, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

function paneProps(x, z) {
  return {
    north: has(x, z - 1) ? "true" : "false",
    south: has(x, z + 1) ? "true" : "false",
    east: has(x + 1, z) ? "true" : "false",
    west: has(x - 1, z) ? "true" : "false",
    waterlogged: "false",
  };
}

// Foundation, roof deck, floor slabs, walls and windows, per footprint cell.
for (const [x, z, rawGround] of cells) {
  const gr = Math.round(rawGround);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const exposed = FACES.filter(([dx, dz]) => !has(x + dx, z + dz));
  const isWall = exposed.length > 0;

  // roof deck and floor slabs for every cell
  for (let s = 0; s <= STOREYS; s++) put(x, gr + s * FLOOR, z, "light_gray_concrete");

  if (!isWall) {
    // interior cells: air between slabs, roof equipment on the deck
    if (x % 3 === 1 && z % 7 === 4) put(x, gr + ROOF + 1, z, "iron_block");
    continue;
  }

  // pier rhythm from the first exposed face
  const [fdx, fdz] = exposed[0];
  const idx = fdx !== 0 ? z : x;
  const pier = idx % 3 === 0;

  for (let s = 0; s < STOREYS; s++) {
    const base = gr + s * FLOOR;

    // row 0: base course on the ground storey, spandrel band above
    put(x, base, z, s === 0 ? "polished_andesite" : "light_gray_concrete");

    for (let r = 1; r <= 3; r++) {
      const y = base + r;
      if (s === 0) {
        // shopfront: glass bays between white piers
        put(x, y, z, pier ? "white_concrete" : "glass");
      } else if (pier) {
        put(x, y, z, "white_concrete");
      } else if (r === 2 && (idx + s) % 4 === 1) {
        // warm light behind a window
        put(x, y, z, "glowstone");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z));
      }
    }

    // row 4: piers/wall; top storey gets the cornice band
    put(x, base + 4, z, s === STOREYS - 1 ? "light_gray_concrete" : "white_concrete");
  }

  // parapet on exposed edges
  put(x, gr + ROOF + 1, z, "white_concrete");
}

// Entrance: middle cell of the southern (+z) street face, ground storey.
const southCells = cells
  .filter(([x, z]) => !has(x, z + 1))
  .sort((a, b) => a[0] - b[0]);
if (southCells.length) {
  const [ex, ez, egr] = southCells[Math.floor(southCells.length / 2)];
  const gr = Math.round(egr);
  const dp = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(ex, gr + 1, ez, "dark_oak_door", { ...dp, half: "lower" });
  put(ex, gr + 2, ez, "dark_oak_door", { ...dp, half: "upper" });
  put(ex, gr + 3, ez, "dark_oak_planks"); // lintel over the door
}

g.save(`${DIR}/${ID}.nbt`);
