import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339253358";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 19, D = 10;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground (y of the cell's foundation top)
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Glass pane connections: panes on a north/south face run east-west, on east/west faces north-south
const pane = (axis) =>
  axis === "ew"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Faces: outward neighbour, along-face neighbours, and the face's running coordinate
const FACES = [
  { name: "N", dx: 0, dz: -1, axis: "ew", u: (x) => x },
  { name: "S", dx: 0, dz: 1, axis: "ew", u: (x) => x },
  { name: "W", dx: -1, dz: 0, axis: "ns", u: (x, z) => z },
  { name: "E", dx: 1, dz: 0, axis: "ns", u: (x, z) => z },
];

// Pass 1: foundations, interior floor slab, roof deck
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1)) {
    put(x, 5, z, "smooth_stone"); // storey floor slab
  }
  put(x, 7, z, "smooth_stone"); // roof deck
}

// Street face is north (z = 0 side). Find the door column on it.
const northU = [];
for (const [x, z] of cells) {
  if (!has(x, z - 1)) northU.push(x);
}
const doorU = northU.length
  ? Math.floor((Math.min(...northU) + Math.max(...northU)) / 2)
  : undefined;

// Pass 2: exterior walls, shopfront, windows, storey lines
for (const [x, z, gr] of cells) {
  for (const f of FACES) {
    if (has(x + f.dx, z + f.dz)) continue; // not an exterior face
    const u = f.u(x, z);
    const pier = !has(x - 1, z) || !has(x + 1, z) || (f.axis === "ns" && (!has(x, z - 1) || !has(x, z + 1)));
    const ix = x - f.dx, iz = z - f.dz; // inward cell
    const inside = has(ix, iz);

    for (let y = gr; y <= 6; y++) {
      if (y === gr) { put(x, y, z, "stone_bricks"); continue; } // base course
      if (pier) { put(x, y, z, "smooth_quartz"); continue; }

      if (y === 4) {
        // storey line / signboard band
        put(x, y, z, f.name === "N" ? "red_concrete" : "stone_bricks");
        continue;
      }

      if (y >= 5) {
        // upper storey: window grid, mullions on even u
        if (u % 2 === 1) {
          put(x, y, z, "glass_pane", pane(f.axis));
          if (y === 6 && u === 3 && inside) put(ix, 6, iz, "glowstone");
        } else {
          put(x, y, z, "white_concrete");
        }
        continue;
      }

      // ground storey, y in 1..3
      if (f.name === "N") {
        if (y === 3) { put(x, y, z, "glass_pane", pane(f.axis)); continue; } // transom
        if (u === doorU) {
          put(x, y, z, "oak_door", {
            facing: "north",
            half: y === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
          continue;
        }
        put(x, y, z, "glass_pane", pane(f.axis)); // shopfront glazing
        if (y === 2 && u === 2 && inside) put(ix, 2, iz, "shroomlight");
      } else {
        if (u % 2 === 1) put(x, y, z, "glass_pane", pane(f.axis));
        else put(x, y, z, "white_concrete");
      }
    }
  }
}

// Pass 3: parapet coping on the roof edge
for (const [x, z] of cells) {
  if (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1)) {
    put(x, 8, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 4: roof plant - a small water tank and a lightning rod
for (let x = 5; x <= 6; x++) {
  for (let z = 2; z <= 3; z++) {
    if (!has(x, z)) continue;
    put(x, 8, z, "light_gray_concrete");
    put(x, 9, z, "light_gray_concrete");
  }
}
if (has(1, 8)) {
  put(1, 8, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
