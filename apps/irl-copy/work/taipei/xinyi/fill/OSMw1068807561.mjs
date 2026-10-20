import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807561";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 23, D = 15;
const ROOF = 11;   // flat roof deck, absolute height above lowest ground
const TOP = 10;    // top course of the storeys, under the cornice

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isPerim = (x, z) => dirs.some(([dx, dz]) => !has(x + dx, z + dz));

// Front = the open south-facing edge (highest z); entrance sits at its median x.
const fz = Math.max(...cells.map(([, z]) => z));
const frontXs = cells.filter(([, z]) => z === fz).map(([x]) => x).sort((a, b) => a - b);
const mx = frontXs[Math.floor(frontXs.length / 2)];

const v = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) v.set(x, y, z, id, props);
  else v.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (!isPerim(x, z)) {
    // Interior: floor slabs per storey, air gap between, roof deck on top.
    const slabs = new Set([gr]);
    if (gr + 5 <= 9) slabs.add(gr + 5);
    slabs.add(TOP);
    for (const y of slabs) if (y <= TOP) put(x, y, z, "smooth_stone");
    put(x, ROOF, z, "gray_concrete");
    // Roof equipment: a few plant boxes.
    if (x % 5 === 2 && z % 4 === 1) {
      put(x, ROOF + 1, z, "light_gray_concrete");
      put(x, ROOF + 2, z, "iron_block");
    }
    continue;
  }

  // Facade: base course, storey lines, piers, glazing, entrance.
  const isDoor = z === fz && x === mx;
  for (let y = gr; y <= TOP; y++) {
    if (y === gr) { put(x, y, z, "polished_granite"); continue; }
    if (y === TOP || y === gr + 5) { put(x, y, z, "smooth_quartz"); continue; }
    if (isDoor) {
      if (y === gr + 1) put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === gr + 2) put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (y === gr + 3) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "light_blue_stained_glass");
      continue;
    }
    if ((x + z) % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass");

    // Warm light: a glowstone just inside some glazed bays.
    if ((x * 5 + y * 3 + z) % 13 === 0) {
      for (const [dx, dz] of dirs) {
        const nx = x + dx, nz = z + dz;
        if (has(nx, nz) && !isPerim(nx, nz)) {
          put(nx, y, nz, "glowstone");
          break;
        }
      }
    }
  }

  // Cornice and parapet.
  put(x, ROOF, z, "smooth_quartz");
  put(x, ROOF + 1, z, "white_concrete");
}

v.save(`${DIR}/${ID}.nbt`);
