import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 5-storey mid-rise office block, c. 1990s Taipei: white tiled concrete piers,
// blue-green tinted glazing, granite shopfront base, parapet cornice, roof plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011445";
const W = 22, H = 38, D = 20;
const TOP = 25; // top of the walls and cornice; roof is about 26 blocks above lowest ground

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, Math.round(gr));

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];
const exteriorFaces = (x, z) => DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz));

const cellList = [...ground.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr };
});
const perim = new Set();
for (const c of cellList) if (exteriorFaces(c.x, c.z).length) perim.add(`${c.x},${c.z}`);
const isPerim = (x, z) => perim.has(`${x},${z}`);

const Gmin = Math.min(...cellList.map((c) => c.gr));
const cx = cellList.reduce((s, c) => s + c.x, 0) / cellList.length;
const cz = cellList.reduce((s, c) => s + c.z, 0) / cellList.length;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Facade block record so the lighting pass can see what is glazed.
const facade = new Map();
const key3 = (x, y, z) => `${x},${y},${z}`;

// Pass 1: foundations and the interior (floor slabs per storey, air between).
for (const { x, z, gr } of cellList) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  if (isPerim(x, z)) continue;
  put(x, gr, z, "light_gray_concrete");
  for (let y = gr + 1; y <= TOP; y++) {
    const rel = y - Gmin;
    if (rel % 5 === 0) put(x, y, z, "light_gray_concrete");
  }
}

// Entrance: a perimeter cell on the south face nearest the centre, else any.
let entrance = null;
{
  const south = cellList.filter((c) => isPerim(c.x, c.z) && exteriorFaces(c.x, c.z).some(([n]) => n === "south"));
  const pool = south.length ? south : cellList.filter((c) => isPerim(c.x, c.z));
  let best = Infinity;
  for (const c of pool) {
    const d = Math.abs(c.x - cx);
    if (d < best) { best = d; entrance = c; }
  }
}

// Pass 2: perimeter facade.
for (const { x, z, gr } of cellList) {
  if (!isPerim(x, z)) continue;
  const faces = exteriorFaces(x, z);
  const [, fdx, fdz] = faces[0];
  const a = fdz !== 0 ? x : z; // index along the face
  const pier = a % 3 === 0;
  const isEntrance = entrance && entrance.x === x && entrance.z === z;

  for (let y = gr; y <= TOP; y++) {
    const rel = y - Gmin;
    const k = Math.floor(rel / 5);
    const r = rel % 5;
    let id;
    if (y === TOP) id = "smooth_quartz";
    else if (y === TOP - 1) id = "white_concrete"; // parapet
    else if (k === 0 && r === 0) id = "polished_granite"; // base course
    else if (k === 0 && r === 4) id = "white_concrete"; // shopfront lintel
    else if (r === 0 || r === 4) id = "light_gray_concrete"; // storey spandrel
    else if (pier) id = k === 0 ? "polished_granite" : "white_concrete";
    else id = "cyan_stained_glass";

    if (isEntrance && k === 0) {
      if (r === 1 || r === 2) id = "air"; // recessed entrance opening
      if (r === 3) id = "smooth_quartz";
    }
    facade.set(key3(x, y, z), id);
    put(x, y, z, id);
  }
}

// Pass 3: warm lights behind some glazed bays (glowstone in the interior cell).
for (const { x, z, gr } of cellList) {
  if (!isPerim(x, z)) continue;
  const [, fdx, fdz] = exteriorFaces(x, z)[0];
  const ix = x - fdx, iz = z - fdz;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const a = fdz !== 0 ? x : z;
  for (let y = gr; y <= TOP - 2; y++) {
    const rel = y - Gmin;
    const k = Math.floor(rel / 5);
    const r = rel % 5;
    if (r !== 2) continue;
    if (facade.get(key3(x, y, z)) !== "cyan_stained_glass") continue;
    if (y < gAt(ix, iz)) continue;
    if ((a * 7 + k * 3) % 4 === 0) put(ix, y, iz, "glowstone");
  }
}

// Pass 4: roof. Central lift and stair core, with cooling units on the roof.
for (const { x, z, gr } of cellList) {
  if (isPerim(x, z)) continue;
  const core = Math.abs(x - cx) <= 2.5 && Math.abs(z - cz) <= 2.5;
  if (core) {
    for (let y = TOP + 1; y <= TOP + 3; y++) put(x, y, z, "white_concrete");
    put(x, TOP + 4, z, "smooth_quartz");
  } else if (x % 5 === 1 && z % 5 === 1) {
    put(x, TOP + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
