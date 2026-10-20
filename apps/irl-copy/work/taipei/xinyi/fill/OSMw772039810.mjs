import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s-style Xinyi commercial block: two storeys over a granite base,
// cream painted concrete frame with gray storey lines, tinted glass in piered
// bays, shopfront ground floor with a dark entrance, a cornice, a parapet,
// a small penthouse with a lightning rod, and warm lights behind upper glass.

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772039810";
const cells = JSON.parse(readFileSync(`${BASE}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 13;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inS = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = [
  { dx: 0, dz: -1, face: "north" },
  { dx: 0, dz: 1, face: "south" },
  { dx: 1, dz: 0, face: "east" },
  { dx: -1, dz: 0, face: "west" },
];
const exposed = (x, z) => DIRS.filter((d) => !inS(x + d.dx, z + d.dz));
const isWall = (x, z) => exposed(x, z).length > 0;

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: middle of the north-facing exposed run (single-face cells only).
const northXs = [];
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const ex = exposed(x, z);
  if (ex.length === 1 && ex[0].face === "north") northXs.push(x);
}
northXs.sort((a, b) => a - b);
const entX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : -1;

for (const [x, z, gr] of cells) {
  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ex = exposed(x, z);

  // Interior cells: floor slabs at ground, storey line and roof.
  if (ex.length === 0) {
    put(x, gr, z, "smooth_stone");
    if (gr <= 5) put(x, 5, z, "smooth_stone");
    put(x, 10, z, "smooth_stone");
    continue;
  }

  // Wall / corner / pier logic.
  const face = ex[0];
  const alongX = face.dz !== 0; // north/south faces run along x
  const u = alongX ? x : z;
  const isCorner = ex.length >= 2;
  const pier = isCorner || u % 3 === 0;
  const entrance = ex.length === 1 && face.face === "north" && x === entX;
  const paneProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let y = gr; y <= 11; y++) {
    if (y === gr) {
      put(x, y, z, "polished_andesite"); // base course
    } else if (y === 5) {
      put(x, y, z, "gray_concrete"); // storey line
    } else if (y === 10) {
      put(x, y, z, "smooth_stone"); // cornice
    } else if (y === 11) {
      put(x, y, z, "quartz_block"); // parapet
    } else if (y < 5) {
      // Ground storey: shopfront.
      if (y === 4 || pier) {
        put(x, y, z, "quartz_block");
      } else if (entrance) {
        if (y === gr + 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (y === gr + 2) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "quartz_block");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      }
    } else {
      // Upper storey: sill, two glass rows, lintel.
      if (y === 6 || y === 9 || pier) {
        put(x, y, z, "quartz_block");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps);
        // Warm light in the air gap behind some upper windows.
        if (y === 7 && !isCorner && u % 6 === 2) {
          const ix = x - face.dx, iz = z - face.dz;
          if (inS(ix, iz) && !isWall(ix, iz)) put(ix, 7, iz, "glowstone");
        }
      }
    }
  }

  // Corner lanterns on top of the parapet.
  if (isCorner) put(x, 12, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Penthouse on the roof near the centre, only if its 3x3 footprint is all interior.
const n = cells.length;
const cx = Math.round(cells.reduce((s, c) => s + c[0], 0) / n);
const cz = Math.round(cells.reduce((s, c) => s + c[1], 0) / n);
let penthouse = true;
for (let i = -1; i <= 1; i++)
  for (let j = -1; j <= 1; j++)
    if (!inS(cx + i, cz + j) || isWall(cx + i, cz + j)) penthouse = false;

if (penthouse) {
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) {
      const x = cx + i, z = cz + j;
      put(x, 11, z, "quartz_block");
      put(x, 12, z, "quartz_block");
      put(x, 13, z, "smooth_stone");
    }
  put(cx, 14, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${BASE}/${ID}.nbt`);
