import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537993160";
const W = 16, H = 23, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint ground map
const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const v = Math.round(gr);
  ground.set(key(x, z), v);
  minG = Math.min(minG, v);
}
if (!Number.isFinite(minG)) minG = 0;

const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exposed face of a perimeter cell: N = z-1 side (front), S, W, E
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
};

// Inward neighbour for a face
const inward = (x, z, face) => {
  switch (face) {
    case "N": return [x, z + 1];
    case "S": return [x, z - 1];
    case "W": return [x + 1, z];
    case "E": return [x - 1, z];
  }
};

// Main entrance: front (N) cell closest to the centre line
let doorX = null;
{
  let best = Infinity;
  for (const [k] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (z === 0 && faceOf(x, z) === "N" && Math.abs(x - 8) < best) {
      best = Math.abs(x - 8);
      doorX = x;
    }
  }
}

const paneProps = (along) => along
  ? { north: "false", south: "false", east: "true", west: "true", up: "false", down: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", up: "false", down: "false", waterlogged: "false" };

// Foundations, floors, facades
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const gc = gr;

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  const face = faceOf(x, z);

  if (!face) {
    // Interior cell: floor slabs and roof deck only, air otherwise (no interiors)
    put(x, gc, z, "smooth_stone");
    if (minG + 5 >= gc) put(x, minG + 5, z, "light_gray_concrete");
    if (minG + 10 >= gc) put(x, minG + 10, z, "light_gray_concrete");
    continue;
  }

  const along = face === "N" || face === "S";
  const idx = along ? x : z;
  const L = along ? W : D;
  const mull = idx % 3 === 0 || idx === L - 1;
  const pp = paneProps(along);

  for (let y = gc; y <= minG + 10; y++) {
    let id = "white_concrete";
    let props;
    let isGlass = false;

    if (y === gc) {
      id = "stone_bricks"; // base course / plinth
    } else if (y >= gc + 1 && y <= minG + 3) {
      if (mull) id = "gray_concrete"; else { id = "light_blue_stained_glass_pane"; props = pp; isGlass = true; }
    } else if (y === minG + 4) {
      id = "red_concrete"; // shopfront fascia
    } else if (y === minG + 5) {
      id = "light_gray_concrete"; // storey line
    } else if (y >= minG + 6 && y <= minG + 8) {
      if (mull) id = "gray_concrete"; else { id = "light_blue_stained_glass_pane"; props = pp; isGlass = true; }
    } else if (y === minG + 9) {
      id = "white_concrete"; // spandrel
    } else if (y === minG + 10) {
      id = "smooth_stone"; // coping
    }

    // Entrance door on the front
    if (face === "N" && z === 0 && x === doorX && (y === gc || y === gc + 1)) {
      id = "dark_oak_door";
      props = {
        facing: "north",
        half: y === gc ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      };
      isGlass = false;
    }

    put(x, y, z, id, props);

    // Warm lights behind some glass
    if (isGlass) {
      const [ix, iz] = inward(x, z, face);
      if (has(ix, iz) && !faceOf(ix, iz) && gOf(ix, iz) <= y) {
        if (y === minG + 6 && idx % 6 === 2) {
          put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
        } else if (y === gc + 1 && gc + 1 <= minG + 3 && idx % 6 === 4) {
          put(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Rooftop plant room on the central cells
const RX0 = 4, RX1 = 11, RZ0 = 3, RZ1 = 9;
for (let x = RX0; x <= RX1; x++) {
  for (let z = RZ0; z <= RZ1; z++) {
    if (!has(x, z)) continue;
    const edge = x === RX0 || x === RX1 || z === RZ0 || z === RZ1;
    for (let y = minG + 11; y <= minG + 12; y++) {
      if (edge) put(x, y, z, "light_gray_concrete");
    }
    put(x, minG + 13, z, "smooth_stone"); // plant room roof
  }
}

// Lightning-rod antenna on the plant room
if (has(7, 6)) {
  put(7, minG + 14, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
