import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075542";
const W = 7, H = 29, D = 9;
const ROOF_REL = 16;                       // parapet top, about 17 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const ground = (x, z) => G.get(`${x},${z}`);

// Exposure of a footprint cell to the outside in x and z directions
const exX = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const exZ = (x, z) => !has(x, z - 1) || !has(x, z + 1);

// Entrance: on the minimum-z street face, at the median x of that face
const southFace = cells.filter(([x, z]) => !has(x, z - 1)).map(([x, z]) => x).sort((a, b) => a - b);
const entX = southFace.length ? southFace[Math.floor(southFace.length / 2)] : null;
const entZ = entX === null ? null : cells.find(([x, z]) => x === entX && !has(x, z - 1))[1];

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  const base = gr;
  const top = Math.min(base + ROOF_REL, H - 1);
  const perim = exX(x, z) || exZ(x, z);
  const ex = exX(x, z), ez = exZ(x, z);
  const corner = ex && ez;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Pier or window along the wall (corners are always piers)
  const along = ez ? x : z;
  const pier = corner || (along % 2 === 0);

  for (let y = base; y <= top; y++) {
    const rel = y - base;

    // Floor slabs at storey lines, and roof slab at rel 15
    if (rel === 0) {
      put(x, y, z, perim ? "polished_granite" : "smooth_quartz");
      continue;
    }
    if (rel === 5 || rel === 10 || rel === 15) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (rel === ROOF_REL) {
      // Parapet on perimeter, rooftop plant on interior cells
      if (perim) put(x, y, z, "white_concrete");
      else if (x >= 2 && x <= 4 && z >= 3 && z <= 5) put(x, y, z, "gray_concrete");
      continue;
    }
    if (!perim) continue; // interior air gap

    const k = Math.floor(rel / 5);   // storey index 0..2
    const s = rel % 5;               // position inside storey 1..4

    if (s === 4) {
      // Spandrel band between windows and the storey line above
      put(x, y, z, "white_concrete");
      continue;
    }

    if (pier) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Window cell
    const isEntrance = x === entX && z === entZ;
    if (k === 0 && isEntrance) {
      if (s === 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (s === 2) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "false", west: "false" });
      continue;
    }

    const connect = ez
      ? { north: "false", south: "false", east: "true", west: "true" }
      : { north: "true", south: "true", east: "false", west: "false" };
    put(x, y, z, "light_blue_stained_glass_pane", connect);
  }

  // Warm lights behind some upper-storey windows (glowstone on the interior side)
  if (perim && !(exX(x, z) && exZ(x, z))) {
    for (const k of [1, 2]) {
      const rel = k * 5 + 2;
      const y = base + rel;
      if (y > top) continue;
      if ((along + k) % 3 !== 0) continue;
      let ix = x, iz = z;
      if (ez) iz = !has(x, z - 1) ? z + 1 : z - 1;
      else ix = !has(x - 1, z) ? x + 1 : x - 1;
      if (has(ix, iz) && !exX(ix, iz) && !exZ(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }
}

// Canopy band over the entrance
if (entX !== null) {
  const cy = ground(entX, entZ) + 4;
  put(entX, cy, entZ, "gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
