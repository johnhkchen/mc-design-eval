import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807533";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 23, D = 17;
const FL2 = 5;    // second-floor slab / belt course
const TOP = 10;   // roof slab level (cornice on edges)
const PAR = 11;   // parapet top, about 11 blocks above lowest ground

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props === undefined) g.set(x, y, z, id);
  else g.set(x, y, z, id, props);
};

// footprint lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const exposed = (x, z) => Object.keys(DIRS).filter(k => !has(x + DIRS[k][0], z + DIRS[k][1]));
const faceP = (face, x, z) => (face === "north" || face === "south") ? x : z;

// entrance face: prefer south (street side), otherwise first exposed face found
const allCells = [...ground.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr };
});
const entFace = ["south", "north", "east", "west"].find(f =>
  allCells.some(c => exposed(c.x, c.z).includes(f))
);
const entCells = allCells
  .filter(c => exposed(c.x, c.z).includes(entFace))
  .map(c => ({ ...c, p: faceP(entFace, c.x, c.z) }))
  .sort((a, b) => a.p - b.p);
const door = entCells[Math.floor(entCells.length / 2)];

// ---- main pass ----
for (const { x, z, gr } of allCells) {
  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ex = exposed(x, z);
  if (ex.length === 0) {
    // interior: floor slabs and roof slab only, air between (no interiors)
    for (let y = gr; y <= TOP; y++) {
      if (y === gr || y === FL2 || y === TOP) put(x, y, z, "light_gray_concrete");
    }
    // roof equipment on a grid
    if (x % 4 === 1 && z % 4 === 1) put(x, TOP + 1, z, "iron_block");
    continue;
  }

  const face = ex[0];
  const p = faceP(face, x, z);

  for (let y = gr; y <= PAR; y++) {
    let id = null;
    let props;
    if (y === gr) {
      id = "polished_andesite";                       // base course
    } else if (y === PAR) {
      id = "white_concrete";                          // parapet
    } else if (y === TOP) {
      id = "smooth_stone";                            // cornice
    } else if (y === FL2) {
      id = "light_gray_concrete";                     // storey line
    } else if (y < FL2) {
      // ground floor: shopfront
      if (y === 4) id = "white_concrete";             // lintel
      else if (y >= gr + 1 && y <= 3) id = (p % 3 === 0) ? "polished_andesite" : "glass";
      else id = "white_concrete";
    } else if (y < TOP) {
      // upper storey windows
      if (y === 6) id = "white_concrete";             // sill
      else if (y === 9) id = "white_concrete";        // spandrel
      else id = (p % 3 === 0) ? "light_gray_concrete" : "glass_pane"; // 7, 8
    }
    if (id) put(x, y, z, id, props);
  }

  // window lights behind glass (inward cell is interior air)
  const [ox, oz] = DIRS[face];
  const ix = x - ox, iz = z - oz;
  const innerOk = has(ix, iz) && exposed(ix, iz).length === 0;
  if (innerOk) {
    if (p % 3 !== 0 && (p + z) % 2 === 0) put(ix, 7, iz, "glowstone");
    if (p % 6 === 1 && gr + 2 <= 3) put(ix, gr + 2, iz, "shroomlight");
  }
}

// ---- entrance: door, lintel and canopy ----
{
  const [ox, oz] = DIRS[entFace];
  const { x, z, gr } = door;
  const doorFacing = OPP[entFace];
  put(x, gr + 1, z, "spruce_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "spruce_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, z, "white_concrete"); // lintel above door

  // canopy cantilevered from the lintel, three wide, outside the footprint
  const ax = Math.abs(oz), az = Math.abs(ox);
  for (let k = -1; k <= 1; k++) {
    const cx = x + ox + ax * k;
    const cz = z + oz + az * k;
    if (has(cx, cz)) continue;
    put(cx, gr + 3, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  // small warm lights under the canopy edges
  put(x + ox + ax * 1, gr + 2, z + oz + az * 1, "lantern", { hanging: "true", waterlogged: "false" });
  put(x + ox + ax * -1, gr + 2, z + oz + az * -1, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
