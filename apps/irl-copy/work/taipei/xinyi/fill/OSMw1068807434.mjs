import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807434";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 32, H = 23, D = 26;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Footprint lookup: key "x,z" -> ground (foundation height)
const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

// Outward directions: [facing name, dx, dz]
const DIRS = [
  ["north", 0, -1],
  ["south", 0, 1],
  ["west", -1, 0],
  ["east", 1, 0],
];

const isEdge = (x, z) => DIRS.some(([, dx, dz]) => !has(x + dx, z + dz));

// Door on the south facade, centred on its cells
const southXs = [];
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  if (!has(x, z + 1)) southXs.push(x);
}
const doorX = southXs.length
  ? Math.floor(southXs.reduce((a, b) => a + b, 0) / southXs.length)
  : -99;
const isDoorCell = (x, z, dirName) =>
  dirName === "south" && (x === doorX || x === doorX - 1);

// 1. Foundation, body and roof deck per footprint cell
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gr = gAt(x, z);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (gr <= 10) {
    for (let y = gr; y <= 10; y++) {
      put(x, y, z, y === 10 ? "gray_concrete" : "white_concrete");
    }
  }
}

// 2. Air gap behind glass (inside the facade), so glass reads as windows, not solid walls
const glassRows = (gr) => {
  const rows = [];
  for (let y = gr + 1; y <= 4; y++) rows.push(y);
  for (let y = 6; y <= 9; y++) rows.push(y);
  return rows;
};

for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gr = gAt(x, z);
  if (gr > 9) continue;
  for (const [name, dx, dz] of DIRS) {
    if (has(x + dx, z + dz)) continue;
    const ix = x - dx, iz = z - dz;
    if (!has(ix, iz)) continue;
    const igr = gAt(ix, iz);
    for (const y of glassRows(Math.max(gr, igr))) {
      if (y >= igr + 1) put(ix, y, iz, "air");
    }
  }
}

// 3. Facades: base course, shopfront, storey band, window grid, cornice, parapet
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const gr = gAt(x, z);
  if (gr > 9) continue;
  for (const [name, dx, dz] of DIRS) {
    if (has(x + dx, z + dz)) continue;
    const along = dx !== 0 ? z : x; // position along the facade
    const door = isDoorCell(x, z, name);
    const facing = name;

    // Base course at ground level
    put(x, gr, z, "polished_andesite");

    // Ground storey shopfront (glass with stone piers), or entrance
    for (let y = gr + 1; y <= 4; y++) {
      if (door && y <= gr + 2) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", {
          facing,
          half,
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (along % 3 === 0) {
        put(x, y, z, "stone_bricks");
      } else {
        put(x, y, z, "glass");
      }
    }

    // Storey band between floors
    put(x, 5, z, "smooth_stone");

    // Upper storey windows with piers
    for (let y = 6; y <= 9; y++) {
      if (along % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass");
    }

    // Cornice and parapet
    put(x, 10, z, "smooth_stone");
    put(x, 11, z, "white_concrete");

    // Warm light behind some upper windows
    if (!door && along % 6 === 1) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && gAt(ix, iz) <= 7) put(ix, 7, iz, "glowstone");
    }
  }
}

// 4. Roof: AC plant units on the deck, and a central mast
for (let x = 3; x < W; x += 6) {
  for (let z = 3; z < D; z += 6) {
    if (!has(x, z) || gAt(x, z) > 9 || isEdge(x, z)) continue;
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
  }
}

const cx = Math.round(cells.reduce((a, c) => a + c[0], 0) / cells.length);
const cz = Math.round(cells.reduce((a, c) => a + c[1], 0) / cells.length);
if (has(cx, cz) && gAt(cx, cz) <= 9) {
  for (let y = 11; y <= 13; y++) put(cx, y, cz, "white_concrete");
  put(cx, 14, cz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
