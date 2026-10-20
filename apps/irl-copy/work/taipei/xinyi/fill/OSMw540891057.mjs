import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540891057";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint model
const list = cells.map(([x, z, gr]) => ({ x, z, g: Math.round(gr) }));
const fp = new Map(list.map((c) => [k(c.x, c.z), c.g]));
const minG = Math.min(...list.map((c) => c.g));
const minX = Math.min(...list.map((c) => c.x));
const maxX = Math.max(...list.map((c) => c.x));
const minZ = Math.min(...list.map((c) => c.z));
const maxZ = Math.max(...list.map((c) => c.z));

// Vertical levels: roof about 11 blocks above the lowest ground
const base = minG;
const F1 = base + 5;   // first floor belt / slab (storey height 5)
const R = base + 10;   // roof slab level, cornice belt on the perimeter
const TOP = base + 11; // parapet top

const FACES = [
  { dx: 0, dz: -1, name: "N", facing: "north" },
  { dx: 0, dz: 1, name: "S", facing: "south" },
  { dx: -1, dz: 0, name: "W", facing: "west" },
  { dx: 1, dz: 0, name: "E", facing: "east" },
];

const hasCell = (x, z) => fp.has(k(x, z));
const missingFaces = (x, z) => FACES.filter((f) => !hasCell(x + f.dx, z + f.dz));
const isInterior = (x, z) => missingFaces(x, z).length === 0;

// Entrance: on the south (+z) street face, nearest the middle of the front
const midX = (minX + maxX) / 2;
let entranceKey = null;
{
  let best = Infinity;
  for (const c of list) {
    if (!hasCell(c.x, c.z + 1) && c.z === maxZ) {
      const d = Math.abs(c.x - midX);
      if (d < best) { best = d; entranceKey = k(c.x, c.z); }
    }
  }
}

// Pass 1: foundations, floor slabs, roof deck
for (const c of list) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone");
  if (F1 >= c.g && F1 < TOP) put(c.x, F1, c.z, "smooth_stone");
  if (R >= c.g) put(c.x, R, c.z, "gray_concrete");
}

// Wall material and detail for one perimeter column at height y
function wallBlock(y, c, pier, entr) {
  const gg = c.g;
  if (y === R + 1) return ["white_concrete"];          // parapet
  if (y === R) return ["smooth_quartz"];               // cornice belt
  if (y === F1) return ["smooth_quartz"];              // storey line
  if (y < F1) {                                         // ground storey (shopfront)
    if (y === gg) return ["stone_bricks"];              // base course
    if (entr) {
      if (y === F1 - 1) return ["red_concrete"];        // entrance fascia
      if (y === gg + 1) return ["dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (y === gg + 2) return ["dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
      if (y === gg + 3) return ["lantern", { hanging: "true", waterlogged: "false" }];
      return ["white_concrete"];
    }
    if (y === F1 - 1) return pier ? ["white_concrete"] : ["smooth_quartz"];
    if (pier) return ["white_concrete"];
    return ["glass"];
  }
  // second storey: frame, glass, frame in each bay
  const rel = y - F1;
  if (pier) return ["white_concrete"];
  if (rel === 1 || rel === 4) return ["light_gray_concrete"];
  return ["glass"];
}

// Pass 2: perimeter walls
const bayInfo = [];
for (const c of list) {
  const faces = missingFaces(c.x, c.z);
  if (faces.length === 0) continue;
  const corner = faces.length >= 2;
  for (const f of faces) {
    const along = f.dx === 0 ? c.x : c.z;
    const amin = f.dx === 0 ? minX : minZ;
    const amax = f.dx === 0 ? maxX : maxZ;
    const pier = corner || along === amin || along === amax || (along - amin) % 3 === 0;
    const entr = f.name === "S" && k(c.x, c.z) === entranceKey;
    if (!pier && !entr) bayInfo.push({ c, f });
    for (let y = c.g; y <= R + 1; y++) {
      const [id, props] = wallBlock(y, c, pier, entr);
      put(c.x, y, c.z, id, props);
    }
  }
}

// Pass 3: warm lanterns just inside some second-storey window bays
for (const { c, f } of bayInfo) {
  if (((c.x * 5 + c.z * 3 + (f.dx !== 0 ? 1 : 0)) % 4) !== 0) continue;
  const ix = c.x - f.dx, iz = c.z - f.dz;
  if (!hasCell(ix, iz) || !isInterior(ix, iz)) continue;
  const ig = fp.get(k(ix, iz));
  if (ig > F1 || F1 + 1 >= R) continue;
  put(ix, F1 + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Pass 4: roof plant on the roof deck near the centre
const cx = Math.floor((minX + maxX) / 2);
const cz = Math.floor((minZ + maxZ) / 2);
for (let dx = 0; dx <= 1; dx++) {
  for (let dz = 0; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz;
    if (hasCell(x, z) && isInterior(x, z) && R >= fp.get(k(x, z))) {
      put(x, R + 1, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
