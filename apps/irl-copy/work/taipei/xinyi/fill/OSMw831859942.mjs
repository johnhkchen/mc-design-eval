import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831859942";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 27, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground height (third number)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

let minX = Infinity, minZ = Infinity;
for (const [x, z] of cells) { minX = Math.min(minX, x); minZ = Math.min(minZ, z); }

// Face tests: a face is exposed where the neighbour is outside the footprint
const exposed = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const isPerim = (x, z) => { const f = exposed(x, z); return f.n || f.s || f.w || f.e; };

// Front = north (min z) face. Choose entrance cell nearest the mean x of that face.
const frontCells = cells.filter(([x, z]) => !has(x, z - 1));
const meanX = frontCells.reduce((s, [x]) => s + x, 0) / Math.max(1, frontCells.length);
let doorX = -1, doorZ = -1;
{
  let best = Infinity;
  for (const [x, z] of frontCells) {
    const d = Math.abs(x - meanX);
    if (d < best) { best = d; doorX = x; doorZ = z; }
  }
}

const safeSet = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, floors, walls, windows, entrance
for (const [x, z, G] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) safeSet(x, y, z, "stone_bricks");

  if (!isPerim(x, z)) {
    // Interior: floor slabs only, air gap otherwise
    safeSet(x, G, z, "smooth_stone");
    safeSet(x, G + 4, z, "smooth_stone");
    safeSet(x, G + 9, z, "smooth_stone");
    continue;
  }

  const f = exposed(x, z);
  const faceNS = f.n || f.s;
  const faceEW = f.w || f.e;
  const corner = faceNS && faceEW;
  const idx = faceNS ? x - minX : z - minZ;
  const pier = corner || idx % 3 === 0;
  const isDoor = x === doorX && z === doorZ;

  // Base course, storey line, sill, cornice, parapet
  safeSet(x, G, z, "stone_bricks");
  safeSet(x, G + 4, z, "smooth_quartz");
  safeSet(x, G + 5, z, "white_concrete");
  safeSet(x, G + 9, z, "smooth_quartz");
  safeSet(x, G + 10, z, "white_concrete");

  // Ground floor shopfront (storeys 1-3)
  if (isDoor) {
    safeSet(x, G + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    safeSet(x, G + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    safeSet(x, G + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  } else {
    for (const y of [1, 2, 3]) {
      if (pier) safeSet(x, G + y, z, "white_concrete");
      else safeSet(x, G + y, z, "glass_pane", paneProps(faceNS));
    }
  }

  // Upper storey windows (rows 6-8)
  for (const y of [6, 7, 8]) {
    if (pier) safeSet(x, G + y, z, "white_concrete");
    else safeSet(x, G + y, z, "glass_pane", paneProps(faceNS));
  }
}

// Pass 2: warm lights behind selected front windows, and roof plant boxes
for (const [x, z, G] of cells) {
  if (!isPerim(x, z)) {
    // Roof plant: sparse light-grey boxes on the roof deck
    if (((x * 5 + z * 7) % 13) === 0) safeSet(x, G + 10, z, "light_gray_concrete");
    continue;
  }
  const f = exposed(x, z);
  if (!f.n) continue;
  const idx = x - minX;
  const pier = (f.w || f.e) || idx % 3 === 0;
  if (pier) continue;
  if (idx % 6 !== 1) continue;
  if (has(x, z + 1) && !isPerim(x, z + 1)) {
    const gi = gnd(x, z + 1);
    safeSet(x, gi + 7, z + 1, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
