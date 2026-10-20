import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588110007";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 13 x 34, roof ~27 blocks above lowest ground: five storeys of 5 blocks.
// Read as a mid-rise 1990s-2000s Xinyi office block: white tiled concrete piers,
// light-grey spandrel bands, tinted glazing, shopfront ground floor, plant penthouse.
const W = 13, H = 39, D = 34;
const g = new Voxels([W, H, D]);

const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, p) => {
  if (!inB(x, y, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const base = Math.min(...cells.map((c) => c[2]));
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const xFace = (x, z) => !has(x - 1, z) || !has(x + 1, z);

const WIN_PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const WIN_PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const DOOR_LO = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UP = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
const SLAB_BOT = { type: "bottom", waterlogged: "false" };

// Pass 1: foundations, body walls, bands, floors
for (const [x, z, gr] of cells) {
  const P = perim(x, z);
  // foundation plinth from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // body and floors from ground up to the top of the parapet (base+27)
  for (let y = gr; y <= base + 27; y++) {
    const r = y - base;
    const band = r % 5 === 0 || r % 5 === 4;
    if (P) {
      if (r >= 26) put(x, y, z, "white_concrete");
      else if (band) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "white_concrete");
    } else {
      // interior: only slabs at storey lines and roof deck, air elsewhere
      if (r % 5 === 0 && r <= 25) put(x, y, z, "light_gray_concrete");
    }
  }
  // ensure ground-level base course on the perimeter
  if (P) put(x, base, z, "polished_andesite");
  // cornice cap on parapet top
  if (P) put(x, base + 28, z, "smooth_stone_slab", SLAB_BOT);
}

// Pass 2: windows, entrance, lights
for (const [x, z, gr] of cells) {
  if (!perim(x, z)) continue;
  const xf = xFace(x, z);
  for (let k = 0; k < 5; k++) {
    for (let r = 1; r <= 3; r++) {
      const y = base + 5 * k + r;
      if (y < gr) continue;
      const isWin = xf ? z % 3 !== 0 : (x % 2 === 1 && x <= 11);
      if (!isWin) continue;
      const pane = k === 0 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
      put(x, y, z, pane, xf ? WIN_PANE_X : WIN_PANE_Z);
    }
  }
  // lobby entrance on the z=0 end, centre bay
  if (z === 0 && x === 6) {
    if (base + 1 >= gr) put(x, base + 1, z, "dark_oak_door", DOOR_LO);
    if (base + 2 >= gr) put(x, base + 2, z, "dark_oak_door", DOOR_UP);
    put(x, base + 3, z, "light_gray_concrete");
  }
}

// Warm lights set in the interior air gap behind some windows
for (const [x, z, gr] of cells) {
  if (!perim(x, z)) continue;
  const xf = xFace(x, z);
  if (!xf && !(z === 0 || z === 33)) continue;
  for (let k = 1; k < 5; k++) {
    if ((x + z + k) % 3 !== 0) continue;
    let ix = x, iz = z;
    if (xf) ix = x === 0 ? 1 : x - 1;
    else iz = z === 0 ? 1 : z - 1;
    if (!has(ix, iz)) continue;
    const y = base + 5 * k + 2;
    if (y < G.get(`${ix},${iz}`)) continue;
    if (xf && z % 3 === 0) continue;
    put(ix, y, iz, "glowstone");
  }
}

// Rooftop plant penthouse: floor r26, walls r27, roof r28 over a central box
const boxOK = [];
for (let x = 3; x <= 9; x++) for (let z = 11; z <= 22; z++) if (has(x, z)) boxOK.push([x, z]);
const inBox = (x, z) => boxOK.some(([a, b]) => a === x && b === z);
for (const [x, z] of boxOK) {
  put(x, base + 26, z, "light_gray_concrete");
  const edge = !inBox(x - 1, z) || !inBox(x + 1, z) || !inBox(x, z - 1) || !inBox(x, z + 1);
  if (edge) {
    put(x, base + 27, z, "gray_concrete");
    if ((x + z) % 3 === 0) put(x, base + 27, z, "light_blue_stained_glass_pane", xFace(x, z) ? WIN_PANE_X : WIN_PANE_Z);
  }
  put(x, base + 28, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
