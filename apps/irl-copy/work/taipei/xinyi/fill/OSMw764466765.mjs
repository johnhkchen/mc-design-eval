import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi-area mid-rise commercial block, c. 1985-2000: white tiled concrete frame,
// glazed bays, red sign band over a ground-floor shopfront, plant penthouse on the roof.
const ID = "OSMw764466765";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 11, D = 4, H = 38, STOREYS = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map(cells.map(([x, z, gy]) => [`${x},${z}`, gy]));
const has = (x, z) => ground.has(`${x},${z}`);

// Body starts at the highest ground under the footprint; lower cells get a plinth up to it.
const F = Math.max(...cells.map(c => c[2]));
// Storey height so that the roof lands near 26 blocks above the lowest ground.
let sh = Math.max(4, Math.floor((25 - F) / STOREYS));
if (F + STOREYS * sh + 2 > H - 1) sh = Math.max(3, Math.floor((H - 3 - F) / STOREYS));
const T = F + STOREYS * sh; // roof deck level

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D || !has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const ext = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const zFace = (x, z) => !has(x, z - 1) || !has(x, z + 1); // front/back faces (run along x)
const xFace = (x, z) => !has(x - 1, z) || !has(x + 1, z); // end faces (run along z)

const PANE_X = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const DOOR = half => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const litBay = (x, s) => (x + s) % 3 === 0;

// 1. Foundation: solid from y 0 up to the body base under every footprint cell.
for (const [x, z] of cells) {
  for (let y = 0; y < F; y++) put(x, y, z, "stone");
}

// 2. Body: five storeys, floor slabs, facade, roof and plant.
for (const [x, z] of cells) {
  const e = ext(x, z);
  const zf = zFace(x, z);
  const xf = xFace(x, z);

  for (let y = F; y < T; y++) {
    const s = Math.floor((y - F) / sh);
    const rel = (y - F) % sh;

    // Floor slab / base course
    if (rel === 0) {
      if (!e) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, s === 0 ? "polished_andesite" : "smooth_quartz");
      continue;
    }

    // Spandrel band above each window row; red sign band over the shopfront
    if (rel === sh - 1) {
      if (!e) continue; // air gap
      const sign = s === 0 && zf && z === 0;
      put(x, y, z, sign ? "red_concrete" : "light_gray_concrete");
      continue;
    }

    // Interior: air gap, with a warm lamp behind some front windows
    if (!e) {
      if (rel === 2 && z === 1 && x >= 1 && x <= W - 2 && x !== 5 && litBay(x, s)) {
        put(x, y, z, "glowstone");
      }
      continue;
    }

    // Exterior walls
    if (zf) {
      // Entrance door on the street (front, z = 0) at the centre bay
      if (s === 0 && z === 0 && x === 5) {
        if (rel <= 2) put(x, y, z, "dark_oak_door", DOOR(rel === 1 ? "lower" : "upper"));
        else put(x, y, z, "glass");
        continue;
      }
      // Piers at the ends and the centre bay
      if (x === 0 || x === W - 1 || x === 5) {
        put(x, y, z, "white_concrete");
        continue;
      }
      // Shopfront glass on the ground floor, glazed bays above
      if (s === 0) put(x, y, z, "glass");
      else put(x, y, z, "glass_pane", PANE_X);
      continue;
    }
    if (xf) {
      put(x, y, z, "glass_pane", PANE_Z);
      continue;
    }
  }

  // Roof deck, cornice and parapet
  if (e) {
    put(x, T, z, "smooth_quartz");
    put(x, T + 1, z, "white_concrete");
    put(x, T + 2, z, "smooth_quartz");
  } else {
    put(x, T, z, "light_gray_concrete");
    // Rooftop plant: two AC condensers and a small penthouse
    if ((x === 2 || x === 3) && z === 1) put(x, T + 1, z, "iron_block");
    if (x >= 6 && x <= 8) {
      put(x, T + 1, z, "white_concrete");
      put(x, T + 2, z, "white_concrete");
    }
    if (x === 9 && z === 2) {
      put(x, T + 1, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
