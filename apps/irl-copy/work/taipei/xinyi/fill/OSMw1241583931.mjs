import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1241583931";
const W = 18, H = 23, D = 16;
const ROOF = 11;      // roof deck top layer, relative to lowest ground
const PARAPET = 12;   // parapet course on the perimeter
const PLANT_Y = [12, 13];

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const base = Math.min(...cells.map(c => c[2]));
const list = cells.map(([x, z, gr]) => ({ x, z, gr: Math.min(Math.max(gr - base, 0), 10) }));

const g = new Voxels([W, H, D]);
const key = (x, z) => `${x},${z}`;
const G = new Map(list.map(c => [key(c.x, c.z), c.gr]));
const has = (x, z) => G.has(key(x, z));

const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const outs = (x, z) =>
  Object.entries(DIRS).filter(([, [dx, dz]]) => !has(x + dx, z + dz)).map(([n]) => n);

const perimSet = new Set(list.filter(c => outs(c.x, c.z).length > 0).map(c => key(c.x, c.z)));
const isPerim = (x, z) => perimSet.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pass 1: perimeter facade, foundation, glazing, and interior glow behind glass
for (const { x, z } of list) {
  if (!isPerim(x, z)) continue;
  const gr = G.get(key(x, z));
  const o = outs(x, z);
  const corner = o.length >= 2;
  const axisNS = o.some(n => n === "north" || n === "south");
  const u = axisNS ? x : z;
  const pier = corner || u % 3 === 0;

  // foundation fill below ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  // base course at ground surface
  put(x, gr, z, "stone_bricks");

  for (let y = gr + 1; y <= 10; y++) {
    let block;
    if (y === 5 || y === 10) block = "light_gray_concrete";           // storey line and cornice
    else if (y >= 6 && y <= 9) {
      if (y === 6 || y === 9) block = "white_concrete";              // sill and head
      else block = pier ? "white_concrete" : "glass";
    } else {                                                          // shopfront, ground storey
      block = pier ? "white_concrete" : "glass";
    }
    put(x, y, z, block);
  }

  put(x, ROOF, z, "light_gray_concrete");       // roof deck edge
  put(x, PARAPET, z, "white_concrete");         // parapet ring

  // warm glow behind some window glass (inward cell is air-gap interior)
  if (!corner && !pier && o.length === 1) {
    const [dx, dz] = DIRS[o[0]];
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && !isPerim(ix, iz)) {
      if (7 > gr && u % 4 === 1) put(ix, 7, iz, "glowstone");
      if (gr + 1 <= 4 && u % 4 === 3) put(ix, gr + 1, iz, "glowstone");
    }
  }
}

// Pass 2: interiors are air gaps with floor slabs per storey, plus roof plant
for (const { x, z } of list) {
  if (isPerim(x, z)) continue;
  const gr = G.get(key(x, z));
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  for (const y of [gr, 5, ROOF]) {
    if (y >= gr) put(x, y, z, "light_gray_concrete");
  }
  if (x >= 6 && x <= 11 && z >= 5 && z <= 10) {
    for (const y of PLANT_Y) put(x, y, z, "gray_concrete");
  }
}

// Pass 3: entrance door and canopy on the north face (fallback south)
const cx = list.reduce((s, c) => s + c.x, 0) / list.length;
let face = "north";
let doorCands = list.filter(c => isPerim(c.x, c.z) && outs(c.x, c.z).includes(face));
if (doorCands.length === 0) {
  face = "south";
  doorCands = list.filter(c => isPerim(c.x, c.z) && outs(c.x, c.z).includes(face));
}
if (doorCands.length > 0) {
  doorCands.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx));
  const { x, z } = doorCands[0];
  const gr = G.get(key(x, z));
  if (gr <= 2) {
    const dprops = { facing: face, hinge: "left", open: "false", powered: "false" };
    put(x, gr + 1, z, "oak_door", { ...dprops, half: "lower" });
    put(x, gr + 2, z, "oak_door", { ...dprops, half: "upper" });
    // canopy lintel over the entrance and its flanking cells
    for (const dx of [-1, 0, 1]) {
      if (has(x + dx, z)) put(x + dx, gr + 3, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
