import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280259";
const OUT = `${DIR}/${ID}.nbt`;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: 8 x 21 footprint, roof ~21 blocks above lowest ground, ~4 storeys of 5 blocks
// with a parapet. Read as a 1990s-2000s Xinyi office block: white concrete piers,
// light-grey spandrels, light-blue tinted glass, granite base, shopfront ground floor.
const W = 8, H = 33, D = 21;
const TOP = 21;          // parapet top / roof level
const g = new Voxels([W, H, D]);

const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, Math.round(gy));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const fp = (x, z) => ground.has(`${x},${z}`);
const maxU_x = maxX - minX;
const maxU_z = maxZ - minZ;

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }; // on N/S faces
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }; // on E/W faces

const lamps = [];

for (const [x, z, gyRaw] of cells) {
  const gy = Math.round(gyRaw);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const N = !fp(x, z - 1), S = !fp(x, z + 1);
  const Wf = !fp(x - 1, z), E = !fp(x + 1, z);
  const facade = N || S || Wf || E;
  const u_x = x - minX, u_z = z - minZ;
  const onZFace = N || S;
  const onXFace = Wf || E;
  const corner = onZFace && onXFace;

  let pier = true;
  let u = 0;
  if (facade && !corner) {
    if (onZFace) {
      u = u_x;
      pier = u === 0 || u === maxU_x || u % 3 === 0;
    } else {
      u = u_z;
      pier = u === 0 || u === maxU_z || u % 3 === 0;
    }
  }

  for (let y = gy; y <= TOP; y++) {
    if (!facade) {
      // Interior: storey floor slabs only, air behind the glass.
      if (y === gy || (y % 5 === 0 && y > gy && y < TOP)) {
        put(x, y, z, "smooth_quartz");
      }
      continue;
    }

    // Facade cells
    if (y === gy) {
      put(x, y, z, "polished_granite");
      continue;
    }
    if (y === TOP) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Entrance: double door on the north (z min) face, at u = 4.
    if (N && !corner && u === 4 && (y === gy + 1 || y === gy + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gy + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (N && !corner && u >= 3 && u <= 5 && y === gy + 3) {
      // Lintel over the entrance.
      put(x, y, z, "stone_bricks");
      continue;
    }

    if (y % 5 === 0) {
      // Storey floor band / cornice line.
      put(x, y, z, "white_concrete");
      continue;
    }

    const r = y % 5; // 1..4
    if (r === 4) {
      put(x, y, z, "light_gray_concrete"); // spandrel
      continue;
    }

    // Window rows r = 1..3
    if (corner || pier) {
      put(x, y, z, "white_concrete");
      continue;
    }

    const storey = Math.floor(y / 5);
    put(x, y, z, "light_blue_stained_glass_pane", onZFace ? paneNS : paneEW);

    // Warm light behind some glass in upper storeys.
    if (r === 2 && storey >= 1 && (u + storey) % 3 === 0) {
      let lx = x, lz = z;
      if (N) lz = z + 1;
      else if (S) lz = z - 1;
      else if (Wf) lx = x + 1;
      else if (E) lx = x - 1;
      if (fp(lx, lz)) lamps.push([lx, y, lz, storey % 2 === 0 ? "glowstone" : "shroomlight"]);
    }
  }
}

// Lamps behind glass (interior air cells).
for (const [lx, y, lz, id] of lamps) put(lx, y, lz, id);

// Roof penthouse for mechanical equipment, set in from the parapet.
const px0 = minX + 2, px1 = minX + 5;
const pz0 = minZ + 7, pz1 = minZ + 13;
for (let x = px0; x <= px1; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!fp(x, z)) continue;
    const edge = x === px0 || x === px1 || z === pz0 || z === pz1;
    for (let y = TOP + 1; y <= TOP + 3; y++) {
      if (edge) put(x, y, z, "white_concrete");
    }
    // Floor and roof of the penthouse.
    put(x, TOP + 1, z, "light_gray_concrete");
    put(x, TOP + 4, z, "light_gray_concrete");
  }
}

// Small glass openings on the penthouse long faces.
for (const z of [pz0 + 2, pz0 + 4]) {
  for (const x of [px0, px1]) {
    if (fp(x, z)) put(x, TOP + 2, z, "light_blue_stained_glass_pane", paneEW);
  }
}

g.save(OUT);
