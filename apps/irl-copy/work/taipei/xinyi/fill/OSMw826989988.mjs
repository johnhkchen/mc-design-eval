import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw826989988";
const W = 21, H = 38, D = 16;
const ROOF = 26;           // cornice line, about 26 blocks above lowest ground
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint lookup: "x,z" -> ground level
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const at = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => Math.max(0, Math.min(ROOF - 1, Math.round(ground.get(`${x},${z}`))));

// Missing 4-neighbours: a cell with any is on the facade
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const missing = (x, z) => Object.keys(DIRS).filter(d => !at(x + DIRS[d][0], z + DIRS[d][1]));
const edge = (x, z) => missing(x, z).length > 0;

const g = new Voxels([W, H, D]);
const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (!inB(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Front = north face (lowest z). Entrance centred on the front run.
const front = [...ground.keys()].map(k => k.split(",").map(Number)).filter(([x, z]) => !at(x, z - 1));
const cx = front.length ? Math.round(front.reduce((s, [x]) => s + x, 0) / front.length) : Math.floor(W / 2);

// Pass 1: foundations, walls, floors, cornice
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gg = gnd(x, z);
  const isEdge = edge(x, z);
  const isFront = !at(x, z - 1);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  for (let y = gg; y <= ROOF; y++) {
    const r = y % 5;

    if (y === ROOF) {
      if (isEdge) put(x, y, z, "stone_bricks");          // cornice / parapet course
      continue;
    }

    if (!isEdge) {
      // Interior: storey floor slabs only, the rest is air
      if (r === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Facade cells
    if (isFront && y <= gg + 3 && Math.abs(x - cx) <= 2) {
      if (x === cx && y <= gg + 1) {
        // Entrance door, lower and upper halves
        put(x, y, z, "dark_oak_door", {
          facing: "north", half: y === gg ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (y === gg + 2) {
        put(x, y, z, "dark_oak_planks");                  // canopy header over entrance
        continue;
      }
    }

    if (y === gg) { put(x, y, z, "stone_bricks"); continue; }      // base course
    if (isFront && y <= gg + 3) { put(x, y, z, "glass"); continue; } // shopfront
    if (r === 0) { put(x, y, z, "light_gray_concrete"); continue; }  // storey line
    if (r === 4) { put(x, y, z, "smooth_quartz"); continue; }        // upper spandrel wall
    // Window band rows 1..3, mullion every third cell
    put(x, y, z, (x + z) % 3 === 0 ? "white_concrete" : "light_blue_stained_glass");
  }
}

// Pass 2: warm light just inside some windows
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!edge(x, z)) continue;
  const gg = gnd(x, z);
  const m = missing(x, z);
  if (!m.length) continue;
  const [dx, dz] = DIRS[m[0]];
  const ix = x - dx, iz = z - dz;
  if (!at(ix, iz) || edge(ix, iz)) continue;
  for (let y = gg; y < ROOF; y++) {
    if (y % 5 !== 2 || (x + z) % 3 === 0 || (x + z) % 4 !== 1) continue;
    put(ix, y, iz, "glowstone");
  }
}

// Rooftop plant room, set back inside the parapet, with antenna
for (let x = 5; x <= 15; x++) {
  for (let z = 4; z <= 11; z++) {
    if (!at(x, z)) continue;
    const ring = x === 5 || x === 15 || z === 4 || z === 11;
    put(x, ROOF, z, "stone_bricks");
    if (ring) {
      put(x, ROOF + 1, z, "white_concrete");
      put(x, ROOF + 2, z, (x + z) % 3 === 0 ? "white_concrete" : "light_blue_stained_glass");
    }
    put(x, ROOF + 3, z, "stone_bricks");                  // plant room cap
  }
}
put(10, ROOF + 4, 7, "lightning_rod", { facing: "up", powered: "false" });
put(10, ROOF + 5, 7, "lightning_rod", { facing: "up", powered: "false" });

g.save(`${DIR}/${ID}.nbt`);
