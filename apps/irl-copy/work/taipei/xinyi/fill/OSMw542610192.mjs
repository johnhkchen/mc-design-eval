import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610192";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 23, D = 13;
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Pass 1: foundations, base course, floor slabs, cornice and roof deck
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  put(x, gr, z, "stone_bricks");

  const edge = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  // storey slab at gr+5 (interior floor / edge storey line)
  put(x, gr + 5, z, edge ? "smooth_stone" : "light_gray_concrete");
  // roof deck at gr+10; on edges it is the cornice band
  put(x, gr + 10, z, edge ? "smooth_stone" : "light_gray_concrete");
}

// Pass 2: facades, windows, doors, parapet
const DOOR_T = 6;
for (const [x, z, gr] of cells) {
  const nN = !has(x, z - 1); // outward -z
  const nS = !has(x, z + 1); // outward +z (street side)
  const nW = !has(x - 1, z); // outward -x
  const nE = !has(x + 1, z); // outward +x
  if (!(nN || nS || nW || nE)) continue;

  const normals = [nN, nS, nW, nE].filter(Boolean).length;
  const corner = normals >= 2;
  // coordinate running along the facade
  const alongX = nN || nS;
  const t = alongX ? x : z;
  // inward offset for placing warm light behind the glass
  const inX = nW ? 1 : nE ? -1 : 0;
  const inZ = nN ? 1 : nS ? -1 : 0;
  const inside = has(x + inX, z + inZ);

  // parapet
  put(x, gr + 11, z, "white_concrete");

  const doorFace = nS && z === D - 1 && t === DOOR_T;

  // ground storey: shopfront, piers every 4 bays, door centre on street face
  for (let y = gr + 1; y <= gr + 4; y++) {
    if (corner || t % 4 === 0) {
      put(x, y, z, "white_concrete");
    } else if (doorFace) {
      if (y === gr + 1) put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === gr + 2) put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, "light_blue_stained_glass_pane");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane");
    }
  }
  // warm light behind some shopfront glass
  if (!corner && !doorFace && t % 4 === 2 && inside) {
    put(x + inX, gr + 2, z + inZ, "glowstone");
  }

  // upper storey: window bays with piers every 3
  for (let y = gr + 6; y <= gr + 9; y++) {
    if (corner || t % 3 === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane");
    }
  }
  // warm lights behind a rhythm of upper windows
  if (!corner && t % 3 !== 0 && t % 6 === 2 && inside) {
    put(x + inX, gr + 7, z + inZ, "glowstone");
  }
}

// Pass 3: roof plant box and lightning rod at the centre
for (const [x, z, gr] of cells) {
  if (x >= 4 && x <= 8 && z >= 4 && z <= 8) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "light_gray_concrete");
  }
}
if (has(6, 6)) {
  const gr = gnd(6, 6);
  put(6, gr + 13, 6, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
