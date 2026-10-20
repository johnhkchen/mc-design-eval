import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459512";
const OUT = `${DIR}/${ID}.nbt`;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 18 x 9 footprint, two storeys of about 5 blocks, roof at y 11 (lidar).
const W = 18, H = 23, D = 9;
const g = new Voxels([W, H, D]);

const FLOOR1 = 5;      // first floor slab / storey line
const ROOF_SLAB = 10;  // roof deck and cornice
const ROOF_TOP = 11;   // parapet top

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const put = (x, y, z, id, p) => (p ? g.set(x, y, z, id, p) : g.set(x, y, z, id));

// Outward faces of a footprint cell: n = z-1, s = z+1, e = x+1, w = x-1.
const faces = (x, z) => {
  const r = [];
  if (!has(x, z - 1)) r.push("n");
  if (!has(x, z + 1)) r.push("s");
  if (!has(x + 1, z)) r.push("e");
  if (!has(x - 1, z)) r.push("w");
  return r;
};

const inward = { n: [0, 1], s: [0, -1], e: [-1, 0], w: [1, 0] };

const paneProps = (dir) =>
  dir === "n" || dir === "s"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: middle of the north (street) face.
const northCells = cells
  .filter(([x, z]) => faces(x, z).includes("n"))
  .sort((a, b) => a[0] - b[0]);
const doorCell = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;
const doorX = doorCell ? doorCell[0] : -1;
const doorZ = doorCell ? doorCell[1] : -1;

// Main pass: foundation, floors, walls, windows, cornice, parapet, door.
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  const facade = f.length > 0;
  const corner = f.length > 1;

  // Foundation up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF_TOP; y++) {
    if (y === gr) {
      put(x, y, z, facade ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (y === FLOOR1) {
      put(x, y, z, facade ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    if (y === ROOF_SLAB) {
      put(x, y, z, facade ? "smooth_quartz" : "gray_concrete");
      continue;
    }
    if (y === ROOF_TOP) {
      if (facade) put(x, y, z, "white_concrete");
      continue;
    }
    if (!facade) continue; // interior air

    // Entrance door, lower and upper halves.
    if (f.includes("n") && x === doorX && z === doorZ && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    const floor1 = y < FLOOR1;
    const winRow = floor1 ? y >= gr + 1 && y <= 3 : y >= 7 && y <= 8;
    const dir = f[0];
    const t = dir === "n" || dir === "s" ? x : z;

    if (!winRow || corner || t % 3 === 0) {
      put(x, y, z, "white_concrete");
      continue;
    }
    if (dir === "n" && floor1) put(x, y, z, "glass");
    else put(x, y, z, "glass_pane", paneProps(dir));
  }
}

// Warm lanterns in the air gap behind some windows.
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  if (!f.length || f.length > 1) continue;
  const dir = f[0];
  const t = dir === "n" || dir === "s" ? x : z;
  if (t % 6 !== 1) continue;
  if (f.includes("n") && x === doorX && z === doorZ) continue;

  const [dx, dz] = inward[dir];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || faces(ix, iz).length) continue;
  const igr = ground.get(key(ix, iz));
  const lantern = { hanging: "false", waterlogged: "false" };

  // Second floor lantern, standing on the first floor slab.
  if (igr <= FLOOR1) put(ix, FLOOR1 + 1, iz, "lantern", lantern);
  // Ground floor shopfront lantern.
  if (dir === "n" && igr + 1 <= 3) put(ix, igr + 1, iz, "lantern", lantern);
}

// Rooftop penthouse on the central interior of the roof deck.
for (let x = 5; x <= 12; x++) {
  for (let z = 2; z <= 6; z++) {
    if (!has(x, z) || faces(x, z).length) continue;
    const gr = ground.get(key(x, z));
    if (gr > ROOF_SLAB) continue;
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
    put(x, 13, z, "smooth_quartz");
  }
}

g.save(OUT);
